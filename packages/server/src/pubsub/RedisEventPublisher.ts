import { createClient } from 'redis'
import logger from '../utils/logger'

export class RedisEventPublisher {
    private redisPublisher: ReturnType<typeof createClient>

    constructor() {
        if (process.env.REDIS_URL) {
            this.redisPublisher = createClient({
                url: process.env.REDIS_URL,
                socket: {
                    keepAlive:
                        process.env.REDIS_KEEP_ALIVE && !isNaN(parseInt(process.env.REDIS_KEEP_ALIVE, 10))
                            ? parseInt(process.env.REDIS_KEEP_ALIVE, 10)
                            : undefined
                },
                pingInterval:
                    process.env.REDIS_KEEP_ALIVE && !isNaN(parseInt(process.env.REDIS_KEEP_ALIVE, 10))
                        ? parseInt(process.env.REDIS_KEEP_ALIVE, 10)
                        : undefined
            })
        } else {
            this.redisPublisher = createClient({
                username: process.env.REDIS_USERNAME || undefined,
                password: process.env.REDIS_PASSWORD || undefined,
                socket: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                    tls: process.env.REDIS_TLS === 'true',
                    cert: process.env.REDIS_CERT ? Buffer.from(process.env.REDIS_CERT, 'base64') : undefined,
                    key: process.env.REDIS_KEY ? Buffer.from(process.env.REDIS_KEY, 'base64') : undefined,
                    ca: process.env.REDIS_CA ? Buffer.from(process.env.REDIS_CA, 'base64') : undefined,
                    keepAlive:
                        process.env.REDIS_KEEP_ALIVE && !isNaN(parseInt(process.env.REDIS_KEEP_ALIVE, 10))
                            ? parseInt(process.env.REDIS_KEEP_ALIVE, 10)
                            : undefined
                },
                pingInterval:
                    process.env.REDIS_KEEP_ALIVE && !isNaN(parseInt(process.env.REDIS_KEEP_ALIVE, 10))
                        ? parseInt(process.env.REDIS_KEEP_ALIVE, 10)
                        : undefined
            })
        }
    }

    async connect() {
        await this.redisPublisher.connect()
    }

    async disconnect() {
        if (this.redisPublisher) {
            await this.redisPublisher.quit()
        }
    }

    publishStartEvent( userId: string ) {
        try {
            this.redisPublisher.publish(
                userId,
                JSON.stringify({
                    userId,
                    eventType: 'start',
                })
            )
        } catch (error) {
            console.error('Error streaming start event:', error)
        }
    }

    async publishUserSignInEvent( userId: string, data: any ) {
        try {
            this.redisPublisher.publish(
                userId,
                JSON.stringify({
                    userId,
                    eventType: 'someone_sign_in',
                    data
                })
            )
        } catch (error) {
            console.error('Error streaming start event:', error)
        }
    }

    async publishUserSignOutEvent( userId: string, data: any ) {
        try {
            this.redisPublisher.publish(
                userId,
                JSON.stringify({
                    userId,
                    eventType: 'someone_sign_out',
                    data
                })
            )
        } catch (error) {
            console.error('Error streaming start event:', error)
        }
    }
}
