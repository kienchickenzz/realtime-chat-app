import logger from '../utils/logger'
import { BaseCommand } from './base'

export default class Worker extends BaseCommand {
    static description = 'Start the ChatApp worker process'
    
    static examples = [
        '$ my-server worker',
        '$ my-server worker --PORT 4001'
    ]

    async run(): Promise<void> {
        logger.info('Starting Worker...')
        // Add your worker logic here
        logger.info('Worker started successfully')
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
            logger.info('Shutting down Worker...')
            // Add cleanup logic here
        } catch (error) {
            logger.error('There was an error shutting down Worker...', error)
            await this.failExit()
        }

        await this.gracefullyExit()
    }
}