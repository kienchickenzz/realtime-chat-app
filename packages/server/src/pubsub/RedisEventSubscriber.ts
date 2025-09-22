import { createClient } from 'redis'
import { SSEStreamer } from '../sse/SSEStreamer'
import logger from '../utils/logger'

export class RedisEventSubscriber {
    private redisSubscriber: ReturnType<typeof createClient>
    private sseStreamer: SSEStreamer
    private subscribedChannels: Set<string> = new Set()

    constructor(sseStreamer: SSEStreamer) {
        if (process.env.REDIS_URL) {
            this.redisSubscriber = createClient({
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
            this.redisSubscriber = createClient({
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
        this.sseStreamer = sseStreamer
    }

    async connect() {
        await this.redisSubscriber.connect()
    }

    async disconnect() {
        if (this.redisSubscriber) {
            await this.redisSubscriber.quit()
        }
    }

    subscribe(channel: string) {
        // Subscribe to the Redis channel for job events
        if (!this.redisSubscriber) {
            throw new Error('Redis subscriber not connected.')
        }

        // Check if already subscribed
        if (this.subscribedChannels.has(channel)) {
            return // Prevent duplicate subscription
        }

        this.redisSubscriber.subscribe(channel, (message) => {
            this.handleEvent(message)
        })

        // Mark the channel as subscribed
        this.subscribedChannels.add(channel)
    }

    private handleEvent( message: string ) {
        // Parse the message from Redis
        const event = JSON.parse( message )
        const { userId, eventType, data } = event
        
        // Stream the event to the client using switch case
        switch (eventType) {
            case 'start':
                this.sseStreamer.streamStartEvent( userId )
                break
            
            case 'someone_sign_in':
                // Stream sign-in event to current user's SSE connection
                this.sseStreamer.streamSignIn( userId, data )
                break
            
            case 'someone_sign_out':
                // Stream sign-out event to current user's SSE connection
                this.sseStreamer.streamSignOut( userId, data )
                break
            
            default:
                break
        }
    }
}
