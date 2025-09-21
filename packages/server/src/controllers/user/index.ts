import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'

import userService from '../../services/user'

const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await userService.getAllUsers()
        return res.status(StatusCodes.OK).json(users)
    } catch (error) {
        next(error)
    }
}

export default {
    getAllUsers
}
