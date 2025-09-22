import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import sseService from '../../services/sse'
import { LoggedInUser } from '../../auth/Interface'
import logger from '../../utils/logger'

const connect = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as LoggedInUser
        
        if (!user || !user.id) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'User not authenticated'
            })
        }

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no')
        res.flushHeaders()

        // Connect to SSE and subscribe to Redis channels
        await sseService.connectSSE(user.id, res)

        // Send initial connection message
        res.write('data: {"event": "start", "message": "SSE connection established"}\n\n')

        logger.info(`SSE connection established for user ${user.id}`)

    } catch (error) {
        logger.error('Error in SSE connect:', error)
        next(error)
    }
}

const disconnect = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as LoggedInUser
        
        if (!user || !user.id) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'User not authenticated'
            })
        }

        await sseService.disconnectSSE(user.id)

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'SSE connection disconnected'
        })

    } catch (error) {
        logger.error('Error in SSE disconnect:', error)
        next(error)
    }
}

export default {
    connect,
    disconnect,
}
