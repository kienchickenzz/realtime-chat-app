import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalError } from '../../errors/internalError'

async function errorHandlerMiddleware( err: InternalError, req: Request, res: Response, next: NextFunction ) {
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
    let displayedError = {
        statusCode,
        success: false,
        message: err.message,
        // Provide error stack trace only in development
        stack: process.env.ENV_MODE === 'development' ? err.stack : {}
    }

    if (!req.body || !req.body.streaming || req.body.streaming === 'false') {
        res.setHeader('Content-Type', 'application/json')
        res.status(displayedError.statusCode).json(displayedError)
    }
}

export default errorHandlerMiddleware
