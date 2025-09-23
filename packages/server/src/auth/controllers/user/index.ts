import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { UserService, RegisterDTO, LoginDTO, ForgotPasswordDTO, ResetPasswordDTO } from '../../services/user'
import { getRunningExpressApp } from '../../../utils/getRunningExpressApp'
import logger from '../../../utils/logger'

const userService = new UserService() 

const register = async ( req: Request, res: Response, next: NextFunction ) => {
    try {
        const data: RegisterDTO = req.body
        const user = await userService.register( data )
        
        return res.status( StatusCodes.CREATED ).json( user )
    } catch ( error ) {
        next( error )
    }
}

const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data: ForgotPasswordDTO = req.body
        await userService.forgotPassword(data)
        
        return res.status( StatusCodes.OK )
    } catch (error) {
        next(error)
    }
}

const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data: ResetPasswordDTO = req.body
        await userService.resetPassword(data)
        
        return res.status(StatusCodes.OK)
    } catch (error) {
        next(error)
    }
}

export default {
    register,
    forgotPassword,
    resetPassword,
}
