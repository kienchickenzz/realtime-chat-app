import { DataSource } from 'typeorm'
import { Conversation } from '../../database/entities/Conversation'
import { Message } from '../../database/entities/Message'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { InternalError } from '../../errors/internalError'
import { StatusCodes } from 'http-status-codes'


const getUserConversations = async (userId: string) => {
    const appServer = getRunningExpressApp()
    const dataSource: DataSource = appServer.AppDataSource

    const query = `
        SELECT 
            c.id as conversation_id,
            c.type,
            c.name,
            c.description,
            c."avatarUrl",
            c."createdAt",
            c."updatedAt",
            
            -- Member info
            cm.id as member_id,
            cm.role as member_role,
            cm."joinedAt" as member_joined_at,
            cm."leftAt" as member_left_at,
            
            -- Member user info
            u.id as member_user_id,
            u."displayName" as member_user_display_name,
            u."avatarUrl" as member_user_avatar_url,
            u_auth.email as member_user_email
            
        FROM business.conversations c
        INNER JOIN business.conversation_members user_cm 
            ON c.id = user_cm."conversationId" 
            AND user_cm."userId" = $1 
            AND user_cm."leftAt" IS NULL
        INNER JOIN business.conversation_members cm 
            ON c.id = cm."conversationId" 
            AND cm."leftAt" IS NULL
        INNER JOIN business.users u ON cm."userId" = u.id
        INNER JOIN auth.users u_auth ON u.id = u_auth.id
        
        ORDER BY c."updatedAt" DESC, cm."joinedAt" ASC
    `

    const rawResults = await dataSource.query(query, [userId])
    
    // Group conversations and their members
    const conversationMap = new Map();
    
    rawResults.forEach(row => {
        const conversationId = row.conversation_id;
        
        if (!conversationMap.has(conversationId)) {
            conversationMap.set(conversationId, {
                id: row.conversation_id,
                type: row.type,
                name: row.name,
                description: row.description,
                avatarUrl: row.avatarUrl,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
                members: []
            });
        }
        
        const conversation = conversationMap.get(conversationId);
        
        // Add member if not already added
        const existingMember = conversation.members.find(m => m.id === row.member_id);
        if (!existingMember && row.member_id) {
            conversation.members.push({
                id: row.member_id,
                role: row.member_role,
                joinedAt: row.member_joined_at,
                leftAt: row.member_left_at,
                user: {
                    id: row.member_user_id,
                    displayName: row.member_user_display_name,
                    email: row.member_user_email,
                    avatarUrl: row.member_user_avatar_url
                }
            });
        }
    });
    
    return Array.from(conversationMap.values());
}

const createDirectConversation = async (currentUserId: string, targetUserId: string): Promise<Conversation> => {
    const appServer = getRunningExpressApp()
    const dataSource: DataSource = appServer.AppDataSource
    
    // Kiểm tra user có tồn tại không
    const targetUserQuery = `SELECT 
            a.id
        FROM business.users a
        JOIN business.users b
            ON a.id = b.id
        WHERE a.id = $1;
    `
    const targetUserResult = await dataSource.query(targetUserQuery, [targetUserId]);
    if (targetUserResult.length === 0) {
        throw new InternalError( StatusCodes.BAD_REQUEST, 'User not found');
    }

    // Kiểm tra conversation 1:1 đã tồn tại chưa
    // Kiểm tra xem có conversation nào có đúng 2 members là currentUser, targetUser và có kiểu là direct không
    const existingConversationQuery = `
            -- Tìm conversation_id nếu tồn tại
            SELECT 
                c.id as conversation_id,
                c.type,
                c.name,
                c.description,
                c."avatarUrl" as avatar,
                c."createdAt",
                c."updatedAt"
            FROM business.conversations c
            WHERE c.type = 'direct'
                AND c.id IN (
                    SELECT "conversationId"
                    FROM business.conversation_members
                    WHERE "leftAt" IS NULL
                    GROUP BY "conversationId"
                    HAVING COUNT(DISTINCT "userId") = 2
                        AND SUM(CASE WHEN "userId" = $1 THEN 1 ELSE 0 END) = 1
                        AND SUM(CASE WHEN "userId" = $2 THEN 1 ELSE 0 END) = 1
                )
    `

    const result = await dataSource.query(existingConversationQuery, [currentUserId, targetUserId]);
    
    if ( result.length > 0 ) {
        // Nếu conversation đã tồn tại, query lại với đầy đủ thông tin members
        const existingConversationId = result[0].conversation_id;
        
        const fullConversationQuery = `
            SELECT 
                c.id as conversation_id,
                c.type,
                c.name,
                c.description, 
                c."avatarUrl",
                c."createdAt",
                c."updatedAt",
                
                -- Creator info
                creator.id as creator_id,
                creator."displayName" as creator_display_name,
                creator."avatarUrl" as creator_avatar_url,
                creator_auth.email as creator_email,
                
                -- Member info
                cm.id as member_id,
                cm.role as member_role,
                cm."joinedAt" as member_joined_at,
                cm."leftAt" as member_left_at,
                
                -- Member user info
                u.id as member_user_id,
                u."displayName" as member_user_display_name,
                u."avatarUrl" as member_user_avatar_url,
                u_auth.email as member_user_email
                
            FROM business.conversations c
            INNER JOIN business.users creator ON c."createdById" = creator.id
            INNER JOIN auth.users creator_auth ON creator.id = creator_auth.id
            INNER JOIN business.conversation_members cm ON c.id = cm."conversationId"
            INNER JOIN business.users u ON cm."userId" = u.id
            INNER JOIN auth.users u_auth ON u.id = u_auth.id
            
            WHERE c.id = $1 
            AND cm."leftAt" IS NULL
        `;
        
        const fullResult = await dataSource.query(fullConversationQuery, [existingConversationId]);
        
        if (fullResult.length === 0) {
            throw new InternalError(StatusCodes.NOT_FOUND, 'Conversation not found');
        }
        
        // Transform kết quả thành conversation object
        const conversationData = fullResult[0];
        const conversation = {
            id: conversationData.conversation_id,
            type: conversationData.type,
            name: conversationData.name,
            description: conversationData.description,
            avatarUrl: conversationData.avatarUrl,
            createdAt: conversationData.createdAt,
            updatedAt: conversationData.updatedAt,
            createdBy: {
                id: conversationData.creator_id,
                displayName: conversationData.creator_display_name,
                email: conversationData.creator_email,
                avatarUrl: conversationData.creator_avatar_url
            },
            members: []
        };
        
        // Group members
        const memberMap = new Map();
        fullResult.forEach(row => {
            if (row.member_id && !memberMap.has(row.member_id)) {
                memberMap.set(row.member_id, {
                    id: row.member_id,
                    role: row.member_role,
                    joinedAt: row.member_joined_at,
                    leftAt: row.member_left_at,
                    user: {
                        id: row.member_user_id,
                        displayName: row.member_user_display_name,
                        email: row.member_user_email,
                        avatarUrl: row.member_user_avatar_url
                    }
                });
            }
        });
        
        conversation.members = Array.from(memberMap.values());
        return conversation as Conversation;
    }

    // Bắt đầu transaction để tạo conversation mới
    await dataSource.transaction(async manager => {
        // Tạo conversation mới
        const insertConversationQuery = `
            INSERT INTO business.conversations (type, "createdById", "createdAt", "updatedAt") 
            VALUES ($1, $2, NOW(), NOW()) 
            RETURNING id, type, name, description, "avatarUrl", "createdAt", "updatedAt"
        `;
        
        const newConversationResult = await manager.query(insertConversationQuery, ['direct', currentUserId]);
        const newConversation = newConversationResult[0];

        // Tạo 2 conversation members bằng batch insert
        const insertMembersQuery = `
            INSERT INTO business.conversation_members ("conversationId", "userId", role, "joinedAt") 
            VALUES 
                ($1, $2, 'member', NOW()),
                ($1, $3, 'member', NOW())
            RETURNING id, role, "joinedAt", "leftAt"
        `;
        
        await manager.query(insertMembersQuery, [newConversation.id, currentUserId, targetUserId]);
    });

    // Trả về conversation với đầy đủ thông tin bằng cách query lại
    const finalConversationQuery = `
        SELECT 
            c.id as conversation_id,
            c.type,
            c.name,
            c.description, 
            c."avatarUrl",
            c."createdAt",
            c."updatedAt",
            
            -- Creator info
            creator.id as creator_id,
            creator."displayName" as creator_display_name,
            creator."avatarUrl" as creator_avatar_url,
            creator_auth.email as creator_email,
            
            -- Member info
            cm.id as member_id,
            cm.role as member_role,
            cm."joinedAt" as member_joined_at,
            cm."leftAt" as member_left_at,
            
            -- Member user info
            u.id as member_user_id,
            u."displayName" as member_user_display_name,
            u."avatarUrl" as member_user_avatar_url,
            u_auth.email as member_user_email
            
        FROM business.conversations c
        INNER JOIN business.users creator ON c."createdById" = creator.id
        INNER JOIN auth.users creator_auth ON creator.id = creator_auth.id
        INNER JOIN business.conversation_members cm ON c.id = cm."conversationId"
        INNER JOIN business.users u ON cm."userId" = u.id
        INNER JOIN auth.users u_auth ON u.id = u_auth.id
        
        WHERE c."createdById" = $1 
        AND c.type = 'direct'
        AND cm."leftAt" IS NULL
        ORDER BY c."createdAt" DESC
    `

    const finalResults = await dataSource.query(finalConversationQuery, [currentUserId]);
    
    if (finalResults.length === 0) {
        throw new InternalError(StatusCodes.NOT_FOUND, 'Conversation not found');
    }
    
    // Transform thành conversation object
    const conversationData = finalResults[0];
    const conversation = {
        id: conversationData.conversation_id,
        type: conversationData.type,
        name: conversationData.name,
        description: conversationData.description,
        avatarUrl: conversationData.avatarUrl,
        createdAt: conversationData.createdAt,
        updatedAt: conversationData.updatedAt,
        createdBy: {
            id: conversationData.creator_id,
            displayName: conversationData.creator_display_name,
            email: conversationData.creator_email,
            avatarUrl: conversationData.creator_avatar_url
        },
        members: []
    };
    
    // Group members
    const memberMap = new Map();
    finalResults.forEach(row => {
        if (row.member_id && !memberMap.has(row.member_id)) {
            memberMap.set(row.member_id, {
                id: row.member_id,
                role: row.member_role,
                joinedAt: row.member_joined_at,
                leftAt: row.member_left_at,
                user: {
                    id: row.member_user_id,
                    displayName: row.member_user_display_name,
                    email: row.member_user_email,
                    avatarUrl: row.member_user_avatar_url
                }
            });
        }
    });
    
    conversation.members = Array.from(memberMap.values());
    return conversation as Conversation;
}

const getConversationMessages = async (conversationId: string, userId: string, page: number = 1, limit: number = 50): Promise<{ messages: Message[], total: number, hasNext: boolean, hasPrev: boolean }> => {
    const appServer = getRunningExpressApp()
    const dataSource: DataSource = appServer.AppDataSource

    // Kiểm tra user có quyền truy cập conversation không
    const memberCheckQuery = `
        SELECT cm.id 
        FROM business.conversation_members cm 
        WHERE cm."conversationId" = $1 
        AND cm."userId" = $2 
        AND cm."leftAt" IS NULL
    `;
    
    const memberCheckResult = await dataSource.query(memberCheckQuery, [conversationId, userId]);
    
    if (memberCheckResult.length === 0) {
        throw new Error('Access denied: You are not a member of this conversation');
    }

    // Đếm tổng số messages
    const countQuery = `
        SELECT COUNT(*) as total
        FROM business.messages m
        WHERE m."conversationId" = $1 
        AND m."isDeleted" = false
    `;
    
    const countResult = await dataSource.query(countQuery, [conversationId]);
    const total = parseInt(countResult[0].total);

    // Tính offset cho pagination
    const offset = (page - 1) * limit;

    // Lấy messages với pagination và các relations
    const messagesQuery = `
        SELECT 
            m.id as message_id,
            m.content as message_content,
            m."messageType" as message_type,
            m."isEdited" as message_is_edited,
            m."editedAt" as message_edited_at,
            m."createdAt" as message_created_at,
            
            -- Thông tin sender
            sender.id as sender_id,
            sender."displayName" as sender_username,
            sender."avatarUrl" as sender_avatar,
            
            -- Thông tin parent message (nếu có)
            pm.id as parent_message_id,
            pm.content as parent_message_content,
            pm."messageType" as parent_message_type,
            pm."createdAt" as parent_message_created_at,
            
            -- Thông tin sender của parent message
            ps.id as parent_sender_id,
            ps."displayName" as parent_sender_username,
            
            -- Thông tin attachments
            att.id as attachment_id,
            att."fileName" as attachment_file_name,
            att."fileUrl" as attachment_file_url,
            att."fileType" as attachment_file_type,
            att."fileSize" as attachment_file_size
            
        FROM business.messages m
        LEFT JOIN business.users sender ON m."senderId" = sender.id
        LEFT JOIN business.messages pm ON m."parentMessageId" = pm.id
        LEFT JOIN business.users ps ON pm."senderId" = ps.id
        LEFT JOIN business.message_attachments att ON m.id = att."messageId"
        
        WHERE m."conversationId" = $1 
        AND m."isDeleted" = false
        
        ORDER BY m."createdAt" DESC
        OFFSET $2
        LIMIT $3
    `;

    const messagesResult = await dataSource.query(messagesQuery, [conversationId, offset, limit]);

    // Transform raw results thành message objects
    // Group theo message_id để tránh duplicate messages do LEFT JOIN với attachments
    const messageMap = new Map();
    
    messagesResult.forEach(row => {
        const messageId = row.message_id;
        
        if (!messageMap.has(messageId)) {
            // Tạo message object mới
            messageMap.set(messageId, {
                id: row.message_id,
                content: row.message_content,
                type: row.message_type,
                isEdited: row.message_is_edited,
                editedAt: row.message_edited_at,
                createdAt: row.message_created_at,
                sender: {
                    id: row.sender_id,
                    username: row.sender_username,
                    avatar: row.sender_avatar
                },
                parentMessage: row.parent_message_id ? {
                    id: row.parent_message_id,
                    content: row.parent_message_content,
                    type: row.parent_message_type,
                    createdAt: row.parent_message_created_at,
                    sender: {
                        id: row.parent_sender_id,
                        username: row.parent_sender_username,
                    }
                } : null,
                attachments: []
            });
        }
        
        // Thêm attachment vào message nếu có
        if (row.attachment_id) {
            const message = messageMap.get(messageId);
            // Kiểm tra attachment đã tồn tại chưa để tránh duplicate
            const existingAttachment = message.attachments.find(att => att.id === row.attachment_id);
            
            if (!existingAttachment) {
                message.attachments.push({
                    id: row.attachment_id,
                    fileName: row.attachment_file_name,
                    fileUrl: row.attachment_file_url,
                    fileType: row.attachment_file_type,
                    fileSize: row.attachment_file_size
                });
            }
        }
    });

    const messages = Array.from(messageMap.values()) as Message[];

    // Tính toán pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        messages,
        total,
        hasNext,
        hasPrev
    };
}

export default {
    getUserConversations,
    createDirectConversation,
    getConversationMessages
}
