import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'

import userService from '../../services/user'

const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { excludedUserId } = req.query
        const users = await userService.getAllUsers( excludedUserId as string )
        return res.status(StatusCodes.OK).json(users)
    } catch (error) {
        next(error)
    }
}

export default {
    getAllUsers
}
