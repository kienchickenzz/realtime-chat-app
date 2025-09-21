import path from 'path'
import fs from 'fs'
import { randomBytes } from 'crypto'
import { DataSource } from 'typeorm'
import { User } from '../database/entities/User'
import { SSEStreamer } from '../sse/SSEStreamer'

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

export const processUserActivityUpdate = async (
    data: any, 
    appDataSource: DataSource, 
    sseStreamer: SSEStreamer
): Promise<void> => {
    const queryRunner = appDataSource.createQueryRunner()
    await queryRunner.connect()
    
    try {
        await queryRunner.startTransaction()
        
        // Lấy tất cả user hiện có (chưa có cơ chế bạn bè)
        const users = await queryRunner.manager.find(User)
        
        // Tổng hợp danh sách ID của tất cả user để gửi thông báo (exclude chính user đó)
        const targetClientIds = users
            .filter(user => user.id !== userId)
            .map(user => user.id)
        
        // Xác định loại event và stream dữ liệu tương ứng
        const { eventType, userId, userName } = data
        
        switch (eventType) {
            case 'sign_in':
                sseStreamer.streamSignIn(targetClientIds, userId, userName)
                break
            case 'sign_out':
                sseStreamer.streamSignOut(targetClientIds, userId, userName)
                break
            default:
                console.log(`Unknown event type: ${eventType}`)
        }
        
        await queryRunner.commitTransaction()
        
    } catch (error) {
        await queryRunner.rollbackTransaction()
        throw error
    } finally {
        await queryRunner.release()
    }
}
