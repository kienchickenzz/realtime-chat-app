import { HttpStatusCode } from 'axios'
import { RedisStore } from 'connect-redis'
import express, { NextFunction, Request, Response } from 'express'
import session from 'express-session'
import { StatusCodes } from 'http-status-codes'
import jwt, { JwtPayload, sign, SignOptions } from 'jsonwebtoken'
import passport from 'passport'
import { VerifiedCallback } from 'passport-jwt'
import { InternalError } from '../../../errors/internalError'
// import { IdentityManager } from '../../../IdentityManager'
import { getRunningExpressApp } from '../../../utils/getRunningExpressApp'
import { ErrorMessage, LoggedInUser } from '../../Interface'
import { UserService } from '../../services/user'
import { decryptToken, encryptToken, generateSafeCopy } from '../../utils/tempTokenUtils'
import { getAuthStrategy } from './AuthStrategy'
import { initializeRedisClientAndStore } from './SessionPersistance'
import { RedisEventPublisher } from '../../../pubsub/RedisEventPublisher'
import logger from '../../../utils/logger'
import { User as AuthUser } from '../../database/entities/User'
import { Not } from 'typeorm'

const localStrategy = require('passport-local').Strategy

const jwtAudience = process.env.JWT_AUDIENCE || 'AUDIENCE'
const jwtIssuer = process.env.JWT_ISSUER || 'ISSUER'

const expireAuthTokensOnRestart = process.env.EXPIRE_AUTH_TOKENS_ON_RESTART === 'true'
const jwtAuthTokenSecret = process.env.JWT_AUTH_TOKEN_SECRET || 'auth_token'
const jwtRefreshSecret = process.env.JWT_REFRESH_TOKEN_SECRET || process.env.JWT_AUTH_TOKEN_SECRET || 'refresh_token'

const secureCookie = process.env.APP_URL?.startsWith('https') ? true : false
const jwtOptions = {
    secretOrKey: jwtAuthTokenSecret,
    audience: jwtAudience,
    issuer: jwtIssuer
}

const _initializePassportMiddleware = async (app: express.Application) => {
    // Configure session middleware
    let options: any = {
        secret: process.env.EXPRESS_SESSION_SECRET || 'flowise',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: secureCookie,
            httpOnly: true,
            sameSite: 'lax' // Add sameSite attribute
        }
    }

    // if the auth tokens are not to be expired on restart, then configure the session store
    if ( !expireAuthTokensOnRestart ) {
        const redisStore = initializeRedisClientAndStore()
        options.store = redisStore as RedisStore
        logger.debug('[AUTH] Session - Using Redis store for session persistence')
    } else {
        logger.debug('[AUTH] Session - Using memory store (sessions will expire on restart)')
    }

    logger.debug(`[AUTH] Session - Initializing session middleware with options: ${JSON.stringify({
        secureCookie: secureCookie,
        httpOnly: options.cookie.httpOnly,
        sameSite: options.cookie.sameSite,
        hasRedisStore: !!options.store
    })}`)

    app.use(session(options))
    app.use(passport.initialize())
    app.use(passport.session())
    
    // Add session debugging middleware AFTER passport.session()
    app.use((req: any, res: any, next: any) => {
        logger.debug(`[AUTH] Session Middleware - Request session info: ${JSON.stringify({
            path: req.path,
            method: req.method,
            sessionID: req.sessionID,
            hasSession: !!req.session,
            isAuthenticated: !!req.user,
            passportUser: req.session?.passport?.user ? 'present' : 'missing',
            sessionPassportData: req.session?.passport,
            cookieKeys: req.cookies ? Object.keys(req.cookies) : [],
            userAfterSession: req.user ? {
                id: req.user.id,
                email: req.user.email,
                name: req.user.name
            } : null
        })}`)
        next()
    })

    passport.serializeUser((user: any, done) => {
        logger.debug(`[AUTH] passport.serializeUser - Serializing user: ${JSON.stringify({
            id: user?.id,
            email: user?.email,
            name: user?.name
        })}`)
        done(null, user)
    })

    passport.deserializeUser((user: any, done) => {
        logger.debug(`[AUTH] passport.deserializeUser - Deserializing user: ${JSON.stringify({
            userExists: !!user,
            userType: typeof user,
            userKeys: user ? Object.keys(user) : [],
            id: user?.id,
            email: user?.email,
            name: user?.name,
            fullUser: user
        })}`)
        
        if (!user) {
            logger.debug('[AUTH] passport.deserializeUser - No user to deserialize')
            return done(null, false)
        }
        
        done(null, user)
    })
}

export const initializeJwtCookieMiddleware = async (app: express.Application) => {
    await _initializePassportMiddleware(app)

    const strategy = getAuthStrategy(jwtOptions)
    passport.use(strategy)
    passport.use(
        'login',
        new localStrategy(
            {
                usernameField: 'email',
                passwordField: 'password',
                session: true
            },
            async (email: string, password: string, done: VerifiedCallback) => {
                let queryRunner
                try {
                    queryRunner = getRunningExpressApp().AppDataSource.createQueryRunner()
                    await queryRunner.connect()
                    const userService = new UserService()
                    const body: any = {
                        email: email,
                        password: password
                    }

                    // FIXME: Triển khai service ở đây có hợp lí không hay nên triển khai 1 hàm utils truy vấn vào db...
                    // (bỏ controller đi!)
                    const response = await userService.login(body)
                    const loggedInUser: LoggedInUser = {
                        id: response.id,
                        email: response.email,
                        name: response.name
                    }

                    return done( null, loggedInUser )
                } catch (error) {
                    return done(error)
                } finally {
                    if (queryRunner) await queryRunner.release()
                }
            }
        )
    )

    // Routing resolver
    app.post( '/api/auth/resolve', async (req, res) => {
        // Always redirect to login page for single tenant
        return res.status(HttpStatusCode.Ok).json({ redirectUrl: '/signin' })
    })

    app.post( '/api/auth/refreshToken', async (req, res) => {
        const refreshToken = req.cookies.refreshToken
        if (!refreshToken) return res.sendStatus(401)

        jwt.verify(refreshToken, jwtRefreshSecret, async (err: any, payload: any) => {
            if (err || !payload) return res.status(401).json({ message: ErrorMessage.REFRESH_TOKEN_EXPIRED })
            
            // const loggedInUser = req.user as LoggedInUser
            // let isSSO = false
            // let newTokenResponse: any = {}
            
            // SSO logic removed for single tenant
            
            const meta = decryptToken(payload.meta)
            if (!meta) {
                return res.status(401).json({ message: ErrorMessage.REFRESH_TOKEN_EXPIRED })
            }
            
            // Simplified for single tenant - no SSO
            return setTokenOrCookies(res, payload, false, req)
        })
    })

    // FIXME: passport.authenticate được gọi 2 lần để làm gì vậy?! Mục đích của mỗi lần gọi là thế nào?
    app.post( '/api/auth/login', (req, res, next?) => {

        // FIXME: Sau khi thực hiện authenticate với await userService.login(body) thì lúc này 
        // hàm async (err: any, user: LoggedInUser) => { sẽ được gọi và nơi gọi hàm này chính là done à 
        // đoạn này return done(null, loggedInUser, { message: 'Logged in Successfully' }) ??
        passport.authenticate( 'login', async ( err: any, user: LoggedInUser ) => {
            try {
                if ( err || !user ) {
                    // If there is a middleware error handler, pass the error to the centralized error handler. 
                    // Otherwise, return a 401 response directly.
                    return next ? next( err ) : res.status( 401 ).json( err )
                }

                // License check removed for single tenant
                
                req.login(user, { session: true }, async (error) => {
                    if (error) {
                        return next ? next(error) : res.status(401).json(error)
                    }
                    
                    // Publish someone_sign_in event to notify other users
                    try {
                        await publishUserSignInEvent(user.id, user.name)
                    } catch (publishError) {
                        logger.error('Failed to publish sign-in event:', publishError)
                        // Don't fail the login if event publishing fails
                    }
                    
                    return setTokenOrCookies(res, user, true, req)
                })
            } catch (error: any) {
                return next ? next(error) : res.status(401).json(error)
            }
        })(req, res, next)
    })
}

export const setTokenOrCookies = (
    res: Response,
    user: LoggedInUser,
    regenerateRefreshToken: boolean,
    req?: Request,
    redirect?: boolean,
    isSSO?: boolean
) => {
    const token = _generateJwtAuthToken(user)

    let refreshToken: string = ''
    if (regenerateRefreshToken) {
        refreshToken = _generateJwtRefreshToken(user)
    } else {
        refreshToken = req?.cookies?.refreshToken
    }

    const returnUser = generateSafeCopy(user)
    returnUser.isSSO = !isSSO ? false : isSSO

    if (redirect) {
        // Send user data as part of the redirect URL (using query parameters)
        const dashboardUrl = `/sso-success?user=${encodeURIComponent(JSON.stringify(returnUser))}`
        // Return the token as a cookie in our response.
        let resWithCookies = res
            .cookie('token', token, {
                httpOnly: true,
                secure: secureCookie,
                sameSite: 'lax'
            })
            .cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: secureCookie,
                sameSite: 'lax'
            })
        resWithCookies.redirect(dashboardUrl)
    } else {
        // Return the token as a cookie in our response.
        res.cookie('token', token, {
            httpOnly: true,
            secure: secureCookie,
            sameSite: 'lax'
        })
            .cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: secureCookie,
                sameSite: 'lax'
            })
            .type('json')
            .send({ ...returnUser })
    }
}

const _generateJwtAuthToken = (user: LoggedInUser) => {
    let expiryInMinutes = -1

    // if (user.ssoToken) {
    //     const jwtHeader = jwt.decode(user.ssoToken, { complete: true })
    //     if (jwtHeader) {
    //         const utcSeconds = (jwtHeader.payload as any).exp
    //         let d = new Date(0) // The 0 there is the key, which sets the date to the epoch
    //         d.setUTCSeconds(utcSeconds)
    //         // get the minutes difference from current time
    //         expiryInMinutes = Math.abs(d.getTime() - new Date().getTime()) / 60000
    //     }
    // }

    if (expiryInMinutes === -1) {
        expiryInMinutes = process.env.JWT_TOKEN_EXPIRY_IN_MINUTES ? parseInt(process.env.JWT_TOKEN_EXPIRY_IN_MINUTES) : 60
    }
    return _generateJwtToken(user, expiryInMinutes, jwtAuthTokenSecret)
}

const _generateJwtRefreshToken = (user: LoggedInUser) => {
    let expiryInMinutes = -1

    // if (user.ssoRefreshToken) {
    //     const jwtHeader = jwt.decode(user.ssoRefreshToken, { complete: false })
    //     if (jwtHeader && typeof jwtHeader !== 'string') {
    //         const utcSeconds = (jwtHeader as JwtPayload).exp
    //         if (utcSeconds) {
    //             let d = new Date(0) // The 0 there is the key, which sets the date to the epoch
    //             d.setUTCSeconds(utcSeconds)
    //             // get the minutes difference from current time
    //             expiryInMinutes = Math.abs(d.getTime() - new Date().getTime()) / 60000
    //         }
    //     }
    // }

    if (expiryInMinutes === -1) {
        expiryInMinutes = process.env.JWT_REFRESH_TOKEN_EXPIRY_IN_MINUTES
            ? parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY_IN_MINUTES)
            : 129600 // 90 days
    }
    return _generateJwtToken(user, expiryInMinutes, jwtRefreshSecret)
}

const _generateJwtToken = (user: LoggedInUser, expiryInMinutes: number, secret: string) => {
    // Create meta with format "userId:timestamp" for validation
    const metaString = `${user.id}:${Date.now()}`
    const encryptedUserInfo = encryptToken(metaString)
    const options: SignOptions = {
        expiresIn: `${expiryInMinutes}m`, // Expiry in minutes
        notBefore: '0', // Cannot use before now, can be configured to be deferred.
        algorithm: 'HS256', // HMAC using SHA-256 hash algorithm
        audience: jwtAudience, // The audience of the token
        issuer: jwtIssuer // The issuer of the token
    }
    return sign({ id: user.id, username: user.name, meta: encryptedUserInfo }, secret!, options )
}

const publishUserSignInEvent = async (userId: string, userName: string): Promise<void> => {
    try {
        const appServer = getRunningExpressApp()
        const dataSource = appServer.AppDataSource
        const queryRunner = dataSource.createQueryRunner()
        await queryRunner.connect()

        try {
            // Query all users except the one who just logged in
            const otherUsers = await queryRunner.manager.find(AuthUser, {
                where: {
                    id: Not(userId),
                },
            })

            if (otherUsers.length === 0) {
                logger.debug('No other users to notify about sign-in')
                return
            }

            // Create publisher and notify each user
            const publisher = new RedisEventPublisher()
            await publisher.connect()

            const data = {
                userName: userName, 
                userId: userId
            }
            
            for (const user of otherUsers) {
                await publisher.publishUserSignInEvent( user.id, data )
                logger.debug(`Published sign-in event for user ${userId} to channel ${user.id}`)
            }
            
            await publisher.disconnect()
            
        } finally {
            await queryRunner.release()
        }
        
    } catch (error) {
        logger.error('Error publishing user sign-in event:', error)
        throw error
    }
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    logger.debug(`[AUTH] verifyToken - Starting token verification: ${JSON.stringify({
        path: req.path,
        method: req.method,
        hasUser: !!req.user,
        hasCookies: !!req.cookies,
        cookieKeys: req.cookies ? Object.keys(req.cookies) : [],
        sessionId: req.sessionID
    })}`)

    passport.authenticate('jwt', { session: true }, (err: any, user: LoggedInUser, info: object) => {
        logger.debug(`[AUTH] verifyToken - JWT authenticate callback: ${JSON.stringify({
            hasError: !!err,
            hasUser: !!user,
            hasInfo: !!info,
            infoName: info ? (info as any).name : null,
            infoMessage: info ? (info as any).message : null
        })}`)

        if (err) {
            logger.debug(`[AUTH] verifyToken - JWT authentication error: ${JSON.stringify(err)}`)
            return next(err)
        }

        // @ts-ignore
        if (info && info.name === 'TokenExpiredError') {
            logger.debug('[AUTH] verifyToken - JWT token expired')
            if (req.cookies && req.cookies.refreshToken) {
                return res.status(401).json({ message: ErrorMessage.TOKEN_EXPIRED, retry: true })
            }
            return res.status(401).json({ message: ErrorMessage.INVALID_MISSING_TOKEN })
        }

        if (!user) {
            logger.debug('[AUTH] verifyToken - No user found, authentication failed')
            return res.status(401).json({ message: ErrorMessage.INVALID_MISSING_TOKEN })
        }

        logger.debug(`[AUTH] verifyToken - JWT authentication successful: ${JSON.stringify({
            userId: user.id,
            userEmail: user.email,
            userName: user.name
        })}`)

        req.user = user // Add user to request object for subsequent middleware
        next()
    })(req, res, next)
}
