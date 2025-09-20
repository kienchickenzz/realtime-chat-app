import Redis from 'ioredis'
import { RedisStore } from 'connect-redis'

let redisClient: Redis | null = null
let redisStore: RedisStore | null = null

export const initializeRedisClientAndStore = (): RedisStore => {
    if (!redisClient) {
        if (process.env.REDIS_URL) {
            redisClient = new Redis(process.env.REDIS_URL)
        } else {
            redisClient = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                username: process.env.REDIS_USERNAME || undefined,
                password: process.env.REDIS_PASSWORD || undefined,
                tls:
                    process.env.REDIS_TLS === 'true'
                        ? {
                              cert: process.env.REDIS_CERT ? Buffer.from(process.env.REDIS_CERT, 'base64') : undefined,
                              key: process.env.REDIS_KEY ? Buffer.from(process.env.REDIS_KEY, 'base64') : undefined,
                              ca: process.env.REDIS_CA ? Buffer.from(process.env.REDIS_CA, 'base64') : undefined
                          }
                        : undefined
            })
        }
    }
    if (!redisStore) {
        redisStore = new RedisStore({ client: redisClient })
    }
    return redisStore
}
