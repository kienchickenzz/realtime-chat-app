import bcrypt from 'bcryptjs'
import { StatusCodes } from 'http-status-codes'
import moment from 'moment'
import { DataSource, QueryRunner } from 'typeorm'
import { Request, Response, NextFunction } from 'express'
import { InternalError } from '../../../errors/internalError'
import { getRunningExpressApp } from '../../../utils/getRunningExpressApp'
import { RedisEventPublisher } from '../../../pubsub/RedisEventPublisher'
import { v4 as uuidv4 } from 'uuid'
import { User as AuthUser } from '../../database/entities/User'
import { User as BusinessUser } from '../../../database/entities/User'
import { isInvalidEmail, isInvalidName, isInvalidPassword, isInvalidUUID } from '../../utils/validation.util'
import { getHash, compareHash } from '../../utils/encryption.util'
import { generateTempToken } from '../../utils/tempTokenUtils'
import { sendPasswordResetEmail } from '../../utils/sendEmail'
import logger from '../../../utils/logger'

export const enum UserErrorMessage {
    EXPIRED_TEMP_TOKEN = 'Expired Temporary Token',
    INVALID_TEMP_TOKEN = 'Invalid Temporary Token',
    INVALID_USER_ID = 'Invalid User Id',
    INVALID_USER_EMAIL = 'Invalid User Email',
    INVALID_USER_CREDENTIAL = 'Invalid User Credential',
    INVALID_USER_NAME = 'Invalid User Name',
    USER_EMAIL_ALREADY_EXISTS = 'User Email Already Exists',
    USER_NOT_FOUND = 'User Not Found',
    INCORRECT_USER_EMAIL_OR_CREDENTIALS = 'Incorrect Email or Password'
}

export interface RegisterDTO {
    name: string
    email: string
    password: string
}

export interface LoginDTO {
    email: string
    password: string
}

export interface ForgotPasswordDTO {
    email: string
}

export interface ResetPasswordDTO {
    email: string
    token: string
    password: string
}

export class UserService {
    private dataSource: DataSource | undefined

    constructor() {
        // Lazy initialization - don't get the datasource until it's needed
    }

    private getDataSource(): DataSource {
        if (!this.dataSource) {
            const appServer = getRunningExpressApp()
            this.dataSource = appServer.AppDataSource
        }
        return this.dataSource
    }

    // Validation methods
    private validateUserId(id: string | undefined) {
        if (isInvalidUUID(id)) throw new InternalError(StatusCodes.BAD_REQUEST, UserErrorMessage.INVALID_USER_ID)
    }

    private validateUserName(name: string | undefined) {
        if (isInvalidName(name)) throw new InternalError(StatusCodes.BAD_REQUEST, UserErrorMessage.INVALID_USER_NAME)
    }

    private validateUserEmail(email: string | undefined) {
        if (isInvalidEmail(email)) throw new InternalError(StatusCodes.BAD_REQUEST, UserErrorMessage.INVALID_USER_EMAIL)
    }

    private validatePassword(password: string | undefined) {
        if (isInvalidPassword(password)) throw new InternalError(StatusCodes.BAD_REQUEST, UserErrorMessage.INVALID_USER_CREDENTIAL)
    }

    private encryptPassword(password: string): string {
        this.validatePassword(password)
        return getHash(password)
    }

    private async triggerUserActivityUpdate(eventType: 'someone_sign_in' | 'someone_sign_out', userId: string, userName: string): Promise<void> {
        const queryRunner = this.getDataSource().createQueryRunner()
        await queryRunner.connect()

        try {
            await queryRunner.startTransaction()
            
            // Lấy tất cả user hiện có (exclude chính user đó và chỉ lấy user đang active)
            const activeUsers = await queryRunner.manager.find(AuthUser, {
                where: {
                    // TODO: Thêm điều kiện isActive: true khi có field này
                }
            })
            const targetUserIds = activeUsers
                .filter(user => user.id !== userId)
                .map(user => user.id)

            await queryRunner.commitTransaction()

            // Tạo instance RedisEventPublisher và loop publish từng user
            const publisher = new RedisEventPublisher()
            await publisher.connect()
            
            // for (const channelId of targetUserIds) {
            //     await publisher.publishUserActivity(eventType, userId, userName, channelId)
            // }
            
            await publisher.disconnect()

        } catch (error) {
            await queryRunner.rollbackTransaction()
            console.error('Failed to trigger user activity update:', error)
            // Don't throw error to avoid breaking main flow
        } finally {
            await queryRunner.release()
        }
    }

    // Database operations
    private async findUserByEmail(email: string, queryRunner: QueryRunner): Promise<AuthUser | null> {
        const sql = `
            SELECT *
            FROM auth.users
            WHERE email = $1
        `
        const result = await queryRunner.query( sql, [ email ] )

        return result.length > 0 ? result[ 0 ] as AuthUser : null
    }

    // Main service methods
    public async register(data: RegisterDTO): Promise<Partial<AuthUser>> {
        const queryRunner = this.getDataSource().createQueryRunner()
        await queryRunner.connect()

        try {
            await queryRunner.startTransaction()

            this.validateUserEmail( data.email )

            // Check if user already exists
            const existingUser = await this.findUserByEmail( data.email, queryRunner )
            if ( existingUser ) {
                throw new InternalError(StatusCodes.BAD_REQUEST, UserErrorMessage.USER_EMAIL_ALREADY_EXISTS)
            }

            // Validate input
            this.validateUserName(data.name)
            this.validateUserEmail(data.email)

            // Create new user
            const authUserId = uuidv4()
            const hashedPassword = this.encryptPassword(data.password)
            const tempToken = generateTempToken()
            const tokenExpiry = new Date()
            const expiryInHours = process.env.INVITE_TOKEN_EXPIRY_IN_HOURS ? parseInt(process.env.INVITE_TOKEN_EXPIRY_IN_HOURS) : 24
            tokenExpiry.setHours(tokenExpiry.getHours() + expiryInHours)

            const [ savedUser ] = await queryRunner.query(
                `
                    INSERT INTO auth.users (id, name, email, credential, "tempToken", "tokenExpiry")
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                `,
                [authUserId, data.name, data.email, hashedPassword, tempToken, tokenExpiry]
            )

            await queryRunner.query(
                `
                    INSERT INTO business.users (id, "displayName")
                    VALUES ($1, $2)
                `,
                [ authUserId, data.name ]
            )

            await queryRunner.commitTransaction()

            // Return user without sensitive data
            const { credential, tempToken: token, tokenExpiry: expiry, ...userResponse } = savedUser
            return userResponse

        } catch (error) {
            await queryRunner.rollbackTransaction()
            throw error
        } finally {
            await queryRunner.release()
        }
    }

    public async login(data: LoginDTO): Promise<AuthUser> {
        const queryRunner = this.getDataSource().createQueryRunner()
        await queryRunner.connect()

        try {
            // Find user by email
            const user = await this.findUserByEmail(data.email, queryRunner)
            if (!user) {
                throw new InternalError(StatusCodes.NOT_FOUND, UserErrorMessage.USER_NOT_FOUND)
            }

            // Check password
            if (!user.credential) {
                throw new InternalError(StatusCodes.BAD_REQUEST, UserErrorMessage.INVALID_USER_CREDENTIAL)
            }

            if (!compareHash(data.password, user.credential)) {
                throw new InternalError(StatusCodes.UNAUTHORIZED, UserErrorMessage.INCORRECT_USER_EMAIL_OR_CREDENTIALS)
            }

            // Subscribe user to their channel for receiving notifications
            const appServer = getRunningExpressApp()
            appServer.redisEventSubscriber.subscribe(user.id)
            logger.debug(`Subscribed user ${user.id} to their notification channel`)

            // Trigger user sign-in activity update
            await this.triggerUserActivityUpdate('someone_sign_in', user.id, user.name)

            return user

        } finally {
            await queryRunner.release()
        }
    }

    public async forgotPassword(data: ForgotPasswordDTO): Promise<void> {
        const queryRunner = this.getDataSource().createQueryRunner()
        await queryRunner.connect()

        try {
            await queryRunner.startTransaction()

            // Find user by email
            const user = await this.findUserByEmail(data.email, queryRunner)
            if (!user) {
                throw new InternalError(StatusCodes.NOT_FOUND, UserErrorMessage.USER_NOT_FOUND)
            }

            // Generate reset token
            const tempToken = generateTempToken()
            const tokenExpiry = new Date()
            const expiryInMins = process.env.PASSWORD_RESET_TOKEN_EXPIRY_IN_MINUTES 
                ? parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY_IN_MINUTES) 
                : 15
            tokenExpiry.setMinutes(tokenExpiry.getMinutes() + expiryInMins)

            // Update user with reset token
            user.tempToken = tempToken
            user.tokenExpiry = tokenExpiry
            await queryRunner.manager.save(AuthUser, user)

            // Send reset email
            const resetLink = `${process.env.APP_URL}/reset-password?token=${tempToken}`
            await sendPasswordResetEmail(data.email, resetLink)

            await queryRunner.commitTransaction()

        } catch (error) {
            await queryRunner.rollbackTransaction()
            throw error
        } finally {
            await queryRunner.release()
        }
    }

    public async resetPassword(data: ResetPasswordDTO): Promise<void> {
        const queryRunner = this.getDataSource().createQueryRunner()
        await queryRunner.connect()

        try {
            await queryRunner.startTransaction()

            // Find user by email
            const user = await this.findUserByEmail(data.email, queryRunner)
            if (!user) {
                throw new InternalError(StatusCodes.NOT_FOUND, UserErrorMessage.USER_NOT_FOUND)
            }

            // Validate token
            if (user.tempToken !== data.token) {
                throw new InternalError(StatusCodes.BAD_REQUEST, UserErrorMessage.INVALID_TEMP_TOKEN)
            }

            // Check token expiry
            if (!user.tokenExpiry) {
                throw new InternalError(StatusCodes.BAD_REQUEST, UserErrorMessage.INVALID_TEMP_TOKEN)
            }

            const now = moment()
            const expiryInMins = process.env.PASSWORD_RESET_TOKEN_EXPIRY_IN_MINUTES 
                ? parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY_IN_MINUTES) 
                : 15
            const diff = now.diff(user.tokenExpiry, 'minutes')
            
            if (Math.abs(diff) > expiryInMins) {
                throw new InternalError(StatusCodes.BAD_REQUEST, UserErrorMessage.EXPIRED_TEMP_TOKEN)
            }

            // Update password and clear token
            const hashedPassword = this.encryptPassword(data.password)
            user.credential = hashedPassword
            user.tempToken = undefined
            user.tokenExpiry = undefined

            await queryRunner.manager.save(AuthUser, user)
            await queryRunner.commitTransaction()

        } catch (error) {
            await queryRunner.rollbackTransaction()
            throw error
        } finally {
            await queryRunner.release()
        }
    }
}
