import { BaseQueue } from './BaseQueue'
import { UpdateStatusQueue } from './UpdateStatusQueue'
import { UpdateMessageQueue } from './UpdateMessageQueue'
import { SSEStreamer } from '../sse/SSEStreamer'
// import { Telemetry } from '../utils/telemetry'
import { DataSource } from 'typeorm'
import { RedisOptions } from 'bullmq'
import { createBullBoard } from 'bull-board'
import { BullMQAdapter } from 'bull-board/bullMQAdapter'
import { Express } from 'express'

const QUEUE_NAME = process.env.QUEUE_NAME || 'chatapp-queue'

type QUEUE_TYPE = 'updateStatus' | 'updateMessage'

export class QueueManager {
    private static instance: QueueManager
    private queues: Map< string, BaseQueue > = new Map()
    private connection: RedisOptions
    private bullBoardRouter?: Express

    private constructor() {
        let tlsOpts = undefined
        if ( process.env.REDIS_URL && process.env.REDIS_URL.startsWith( 'rediss://' ) ) {
            tlsOpts = {
                rejectUnauthorized: false
            }
        } else if (process.env.REDIS_TLS === 'true') {
            tlsOpts = {
                cert: process.env.REDIS_CERT ? Buffer.from(process.env.REDIS_CERT, 'base64') : undefined,
                key: process.env.REDIS_KEY ? Buffer.from(process.env.REDIS_KEY, 'base64') : undefined,
                ca: process.env.REDIS_CA ? Buffer.from(process.env.REDIS_CA, 'base64') : undefined
            }
        }
        this.connection = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            username: process.env.REDIS_USERNAME || undefined,
            password: process.env.REDIS_PASSWORD || undefined,
            tls: tlsOpts,
            enableReadyCheck: true,
            keepAlive:
                process.env.REDIS_KEEP_ALIVE && !isNaN(parseInt(process.env.REDIS_KEEP_ALIVE, 10))
                    ? parseInt(process.env.REDIS_KEEP_ALIVE, 10)
                    : undefined
        }
    }

    public static getInstance(): QueueManager {
        if ( !QueueManager.instance ) {
            QueueManager.instance = new QueueManager()
        }
        return QueueManager.instance
    }

    public registerQueue( name: QUEUE_TYPE, queue: BaseQueue ) {
        this.queues.set( name, queue )
    }

    public getQueue( name: QUEUE_TYPE ): BaseQueue {
        const queue = this.queues.get( name )
        if ( !queue ) throw new Error( `Queue ${ name } not found` )
        return queue
    }

    public getBullBoardRouter(): Express {
        if ( !this.bullBoardRouter ) throw new Error( 'BullBoard router not found' )
        return this.bullBoardRouter
    }

    public setupAllQueues( {
        // telemetry,
        appDataSource,
        sseStreamer,
    }: {
        // telemetry: Telemetry
        appDataSource: DataSource,
        sseStreamer: SSEStreamer
    } ) {
        const updateStatusQueueName = `${ QUEUE_NAME }-updateStatus`
        const updateStatusQueue = new UpdateStatusQueue( updateStatusQueueName, this.connection, {
            // telemetry,
            appDataSource,
            sseStreamer,
        } )
        this.registerQueue( 'updateStatus', updateStatusQueue )

        const updateMessageQueueName = `${ QUEUE_NAME }-updateMessage`
        const updateMessageQueue = new UpdateMessageQueue( updateMessageQueueName, this.connection, {
            // telemetry,
            appDataSource,
            sseStreamer,
        } )
        this.registerQueue( 'updateMessage', updateMessageQueue )

        const bullboard = createBullBoard( [
            new BullMQAdapter( updateStatusQueue.getQueue() ), 
            new BullMQAdapter( updateMessageQueue.getQueue() ), 
        ] )
        this.bullBoardRouter = bullboard.router
    }
}
