import { createClient } from 'redis'
import { SSEStreamer } from '../sse/SSEStreamer'
import logger from '../utils/logger'

export class RedisEventSubscriber {
    private redisEventSubscriber: ReturnType<typeof createClient>
    private sseStreamer: SSEStreamer
    private subscribedChannels: Set<string> = new Set()

    constructor(sseStreamer: SSEStreamer) {
        if (process.env.REDIS_URL) {
            this.redisEventSubscriber = createClient({
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
            this.redisEventSubscriber = createClient({
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
        await this.redisEventSubscriber.connect()
    }

    async disconnect() {
        if (this.redisEventSubscriber) {
            await this.redisEventSubscriber.quit()
        }
    }

    subscribe(channel: string) {
        // Subscribe to the Redis channel for job events
        if (!this.redisEventSubscriber) {
            throw new Error('Redis subscriber not connected.')
        }

        // Check if already subscribed
        if (this.subscribedChannels.has(channel)) {
            return // Prevent duplicate subscription
        }

        this.redisEventSubscriber.subscribe(channel, (message) => {
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

            case 'new_message':
                // Stream sign-out event to current user's SSE connection
                this.sseStreamer.streamMessageEvent( userId, data )
                break
            
            default:
                break
        }
    }
}
