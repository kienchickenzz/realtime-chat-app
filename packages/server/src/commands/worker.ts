import logger from '../utils/logger'
import { BaseCommand } from './base'
import { QueueManager } from '../queue/QueueManager'
import { getDataSource } from '../DataSource'
import { SSEStreamer } from '../sse/SSEStreamer'
import { RedisEventPublisher } from '../pubsub/RedisEventPublisher'

export default class Worker extends BaseCommand {
    static description = 'Start the ChatApp worker process'
    
    static examples = [
        '$ my-server worker',
        '$ my-server worker --PORT 4001'
    ]

    updateStatusWorkerId: string
    updateMessageWorkerId: string
    messageEventWorkerId: string

    async prepareData() {
        // Init database
        const appDataSource = getDataSource()
        await appDataSource.initialize()
        await appDataSource.runMigrations({ transaction: 'each' })
        
        const redisEventPublisher = new RedisEventPublisher()
        await redisEventPublisher.connect()

        const sseStreamer = new SSEStreamer()

        // Init telemetry
        // const telemetry = new Telemetry()

        return { 
            appDataSource, 
            sseStreamer,
            redisEventPublisher,
            // telemetry, 
        }
    }

    async run(): Promise< void > {
        logger.info( 'Starting Worker...' )

        const { 
            appDataSource,
            sseStreamer, 
            redisEventPublisher,
            // telemetry, 
        } = await this.prepareData()
        
        const queueManager = QueueManager.getInstance()
        queueManager.setupAllQueues({
            // telemetry,
            appDataSource,
            sseStreamer,
            redisEventPublisher,
        } )

        // // UpdateStatus
        // const updateStatusQueue = queueManager.getQueue( 'updateStatus' )
        // const updateStatusWorker = updateStatusQueue.createWorker()
        // this.updateStatusWorkerId = updateStatusWorker.id
        // logger.info( `Update Worker ${ this.updateStatusWorkerId } created` )

        // // UpdateMessage
        // const updateMessageQueue = queueManager.getQueue( 'updateStatus' )
        // const updateMessageWorker = updateMessageQueue.createWorker()
        // this.updateMessageWorkerId = updateMessageWorker.id
        // logger.info( `Update Worker ${ this.updateMessageWorkerId } created` )
        
        // MessageEvent
        const messageEventQueue = queueManager.getQueue( 'messageEvent' )
        const messageEventWorker = messageEventQueue.createWorker()
        this.messageEventWorkerId = messageEventWorker.id
        logger.info( `Update Worker ${ this.messageEventWorkerId } created` )

        // Keep the process running
        process.stdin.resume()
    }

    async catch(error: Error) {
        if (error.stack) logger.error(error.stack)
        await new Promise((resolve) => {
            setTimeout(resolve, 1000)
        })
        await this.failExit()
    }

    async stopProcess() {
        try {
            const queueManager = QueueManager.getInstance()

            // const updateStatusWorker = queueManager.getQueue( 'updateStatus' ).getWorker()
            // logger.info( `Shutting down Update Worker ${ this.updateStatusWorkerId }...` )
            // await updateStatusWorker.close()

            // const updateMessageWorker = queueManager.getQueue( 'updateMessage' ).getWorker()
            // logger.info( `Shutting down Update Worker ${ this.updateMessageWorkerId }...` )
            // await updateMessageWorker.close()

            const messageEventQueue = queueManager.getQueue( 'messageEvent' ).getWorker()
            logger.info( `Shutting down Update Worker ${ this.messageEventWorkerId }...` )
            await messageEventQueue.close()

        } catch (error) {
            logger.error('There was an error shutting down Worker...', error)
            await this.failExit()
        }

        await this.gracefullyExit()
    }
}
