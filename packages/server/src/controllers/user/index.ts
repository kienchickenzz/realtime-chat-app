import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalError } from '../../errors/internalError'

import userService from '../../services/user'

const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const currentUserId = req.user?.id;

        if ( !currentUserId ) {
            throw new InternalError( StatusCodes.UNAUTHORIZED, "Unauthorized." )
        }

        const users = await userService.getAllUsers( currentUserId )
        return res.status(StatusCodes.OK).json(users)
    } catch ( error ) {
        next( error )
    }
}

export default {
    getAllUsers
}
