import { Request, Response } from 'express'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import logger from '../../utils/logger'

const connectSSE = async(userId: string, res: Response) => {
    try {
        const appServer = getRunningExpressApp()
        
        // Add client to SSE streamer
        appServer.sseStreamer.addClient(userId, res)
        logger.debug(`Added user ${userId} to SSE streamer`)

        // Subscribe to Redis channels for this user
        appServer.redisSubscriber.subscribe(userId)
        logger.debug(`Subscribed user ${userId} to channel ${userId}`)

        return true
    } catch (error) {
        logger.error('Error in SSE connection:', error)
        throw error
    }
}

const disconnectSSE = async(userId: string) => {
    try {
        const appServer = getRunningExpressApp()
        
        if (appServer.sseStreamer) {
            appServer.sseStreamer.removeClient(userId)
            logger.debug(`Removed user ${userId} from SSE streamer`)
        }

        return true
    } catch (error) {
        logger.error('Error in SSE disconnection:', error)
        throw error
    }
}

export default {
    connectSSE,
    disconnectSSE,
}
