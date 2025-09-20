import path from 'path'
import fs from 'fs'
import { randomBytes } from 'crypto'

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
