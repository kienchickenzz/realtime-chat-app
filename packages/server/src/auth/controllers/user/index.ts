import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { UserService, RegisterDTO, LoginDTO, ForgotPasswordDTO, ResetPasswordDTO } from '../../services/user'

export class UserController {
    private userService: UserService

    constructor() {
        this.userService = new UserService()
    }

    public async register(req: Request, res: Response, next: NextFunction) {
        try {
            const data: RegisterDTO = req.body
            const user = await this.userService.register(data)
            
            return res.status(StatusCodes.CREATED).json( user )
        } catch (error) {
            next(error)
        }
    }

    public async login(req: Request, res: Response, next: NextFunction) {
        try {
            const data: LoginDTO = req.body
            const user = await this.userService.login(data)
            
            // Remove sensitive data from response
            const { credential, tempToken, tokenExpiry, ...userResponse } = user
            
            return res.status(StatusCodes.OK).json( user )
        } catch (error) {
            next(error)
        }
    }

    public async forgotPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const data: ForgotPasswordDTO = req.body
            await this.userService.forgotPassword(data)
            
            return res.status( StatusCodes.OK )
        } catch (error) {
            next(error)
        }
    }

    public async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const data: ResetPasswordDTO = req.body
            await this.userService.resetPassword(data)
            
            return res.status(StatusCodes.OK)
        } catch (error) {
            next(error)
        }
    }

    public async verifyUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { token } = req.body
            await this.userService.verifyUser(token)
            
            return res.status(StatusCodes.OK)
        } catch (error) {
            next(error)
        }
    }

    public async getUserProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const user = await this.userService.getUserById(id)
            
            if (!user) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'User not found'
                })
            }

            // Remove sensitive data from response
            const { credential, tempToken, tokenExpiry, ...userResponse } = user
            
            return res.status(StatusCodes.OK)
        } catch (error) {
            next(error)
        }
    }
}
