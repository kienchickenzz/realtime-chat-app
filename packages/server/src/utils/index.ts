import path from 'path'
import fs from 'fs'
import { randomBytes } from 'crypto'
import { DataSource } from 'typeorm'
import { User } from '../database/entities/User'
import { SSEStreamer } from '../sse/SSEStreamer'
import logger from './logger'

const generateEncryptKey = (): string => {
    return randomBytes(24).toString('base64')
}

export const getEncryptionKey = async (): Promise<string> => {
    if (process.env.FLOWISE_SECRETKEY_OVERWRITE !== undefined && process.env.FLOWISE_SECRETKEY_OVERWRITE !== '') {
        return process.env.FLOWISE_SECRETKEY_OVERWRITE
    }
    const encryptKey = generateEncryptKey()
    const defaultLocation = process.env.SECRETKEY_PATH
        ? path.join(process.env.SECRETKEY_PATH, 'encryption.key')
        : path.join(__dirname, '..', '..', '..', 'encryption.key') // Lưu vào thư mục packages
    await fs.promises.writeFile(defaultLocation, encryptKey)
    return encryptKey
}

interface MessageEventInfo {
    messageId: string;
    senderId: string;
    content: string;
    createdAt: string;
    recipients: string[]; // Array of userIds excluding sender
}

export const getMessageEventInfo = async ( appDataSource: DataSource, messageId: string): Promise<MessageEventInfo | null> => {
    try {
        const query = `
            SELECT 
                m.id as message_id,
                m."senderId" as sender_id,
                m.content,
                m."createdAt",
                m."conversationId",
                array_agg(cm."userId") FILTER (WHERE cm."userId" != m."senderId" AND cm."leftAt" IS NULL) as recipients
            FROM business.messages m
            INNER JOIN business.conversation_members cm ON m."conversationId" = cm."conversationId"
            WHERE m.id = $1
            GROUP BY m.id, m."senderId", m.content, m."createdAt", m."conversationId"
        `;

        const result = await appDataSource.query(query, [messageId]);

        if (result.length === 0) {
            logger.warn(`Message not found: ${messageId}`);
            return null;
        }

        const row = result[0];
        
        return {
            messageId: row.message_id,
            senderId: row.sender_id,
            content: row.content,
            createdAt: row.createdAt,
            recipients: row.recipients || []
        };

    } catch (error) {
        logger.error('Error getting message event info:', error);
        throw error;
    }
};

// export const processUserActivityUpdate = async (
//     data: any, 
//     appDataSource: DataSource, 
//     sseStreamer: SSEStreamer
// ): Promise<void> => {
//     const queryRunner = appDataSource.createQueryRunner()
//     await queryRunner.connect()
    
//     try {
//         await queryRunner.startTransaction()
        
//         // Lấy tất cả user hiện có (chưa có cơ chế bạn bè)
//         const users = await queryRunner.manager.find(User)
        
//         // Tổng hợp danh sách ID của tất cả user để gửi thông báo (exclude chính user đó)
//         const targetClientIds = users
//             .filter(user => user.id !== userId)
//             .map(user => user.id)
        
//         // Xác định loại event và stream dữ liệu tương ứng
//         const { eventType, userId, userName } = data
        
//         switch (eventType) {
//             case 'sign_in':
//                 sseStreamer.streamSignIn(targetClientIds, userId, userName)
//                 break
//             case 'sign_out':
//                 sseStreamer.streamSignOut(targetClientIds, userId, userName)
//                 break
//             default:
//                 console.log(`Unknown event type: ${eventType}`)
//         }
        
//         await queryRunner.commitTransaction()
        
//     } catch (error) {
//         await queryRunner.rollbackTransaction()
//         throw error
//     } finally {
//         await queryRunner.release()
//     }
// }
