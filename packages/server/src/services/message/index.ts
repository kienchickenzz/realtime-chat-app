import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { Message } from '../../database/entities/Message'
import { Conversation } from '../../database/entities/Conversation'
import { User } from '../../database/entities/User'

interface CreateMessageData {
    conversationId: string
    senderId: string
    content?: string
    messageType?: string
    parentMessageId?: string
}

const createMessage = async (data: CreateMessageData) => {
    const appServer = getRunningExpressApp()
    const dataSource = appServer.AppDataSource
    const queryRunner = dataSource.createQueryRunner()
    
    await queryRunner.connect()
    
    try {
        await queryRunner.startTransaction()
        
        // Verify conversation exists and user is a member
        const conversationQuery = `
            SELECT c.id
            FROM business.conversations c
            INNER JOIN business.conversation_members cm ON c.id = cm."conversationId"
            WHERE c.id = $1 AND cm."userId" = $2
        `
        const conversationResult = await dataSource.query(conversationQuery, [data.conversationId, data.senderId])
        
        if (conversationResult.length === 0) {
            throw new Error('Conversation not found or user not a member')
        }
        
        // Create the message
        const messageInsertQuery = `
            INSERT INTO business.messages ("conversationId", "senderId", content, "messageType", "parentMessageId")
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `
        
        const messageResult = await dataSource.query(messageInsertQuery, [
            data.conversationId,
            data.senderId,
            data.content || null,
            data.messageType || 'text',
            data.parentMessageId || null
        ])
        
        const newMessage = messageResult[0]
        
        // If this is a reply, update thread count
        // if (data.parentMessageId) {
        //     const updateThreadCountQuery = `
        //         UPDATE business.messages 
        //         SET thread_count = thread_count + 1 
        //         WHERE id = $1
        //     `
        //     await dataSource.query(updateThreadCountQuery, [data.parentMessageId])
        // }
        
        // Get the complete message with relations
        const fullMessageQuery = `
            SELECT 
                m.*,
                json_build_object(
                    'id', s.id,
                    'displayName', s."displayName",
                    'avatarUrl', s."avatarUrl"
                ) as sender,
                json_build_object(
                    'id', c.id,
                    'name', c.name,
                    'type', c.type
                ) as conversation
            FROM business.messages m
            INNER JOIN business.users s ON m."senderId" = s.id
            INNER JOIN business.conversations c ON m."conversationId" = c.id
            WHERE m.id = $1
        `
        
        const fullMessageResult = await dataSource.query(fullMessageQuery, [newMessage.id])
        
        await queryRunner.commitTransaction()
        
        return fullMessageResult[0]
        
    } catch (error) {
        await queryRunner.rollbackTransaction()
        throw error
    } finally {
        await queryRunner.release()
    }
}

export default {
    createMessage
}
