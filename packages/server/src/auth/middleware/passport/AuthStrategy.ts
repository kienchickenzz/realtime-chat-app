import { JwtFromRequestFunction, Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt'
import { decryptToken } from '../../utils/tempTokenUtils'
import { Strategy } from 'passport'
import { Request } from 'express'
import logger from '../../../utils/logger'

interface ICommonObject {
    [key: string]: any
}

const _cookieExtractor = (req: any) => {
    let jwt = null

    if (req && req.cookies) {
        jwt = req.cookies['token']
        logger.debug(`[AUTH] _cookieExtractor - Extracting JWT from cookies: ${JSON.stringify({
            hasToken: !!jwt,
            tokenLength: jwt ? jwt.length : 0,
            allCookies: Object.keys(req.cookies || {})
        })}`)
    } else {
        logger.debug('[AUTH] _cookieExtractor - No cookies found in request')
    }

    return jwt
}

export const getAuthStrategy = (options: any): Strategy => {
    let jwtFromRequest: JwtFromRequestFunction
    jwtFromRequest = _cookieExtractor
    const jwtOptions = {
        jwtFromRequest: jwtFromRequest,
        passReqToCallback: true,
        ...options
    }
    const jwtVerify = async (req: Request, payload: ICommonObject, done: VerifiedCallback) => {
        logger.debug(`[AUTH] jwtVerify - Starting JWT verification: ${JSON.stringify({
            payloadId: payload?.id,
            payloadUsername: payload?.username,
            payloadAudience: payload?.aud,
            payloadIssuer: payload?.iss,
            payloadExpiry: payload?.exp,
            payloadMeta: payload?.meta ? 'present' : 'missing'
        })}`)

        try {
            const meta = decryptToken(payload.meta)
            logger.debug(`[AUTH] jwtVerify - Decrypted meta: ${JSON.stringify({
                meta: meta,
                metaLength: meta ? meta.length : 0
            })}`)

            if (!meta) {
                logger.debug('[AUTH] jwtVerify - Meta decryption failed')
                return done(null, false, 'Unauthorized.')
            }

            const ids = meta.split(':')
            logger.debug(`[AUTH] jwtVerify - Meta validation: ${JSON.stringify({
                idsLength: ids.length,
                firstId: ids[0],
                payloadId: payload.id,
                idsMatch: payload.id === ids[0]
            })}`)
            
            if (ids.length !== 2 || payload.id !== ids[0]) {
                return done(null, false, 'Unauthorized.')
            }
            
            // TODO: Create a proper user object HERE
            // Create user object from JWT payload
            const user = {
                id: payload.id,
                name: payload.username,
                email: null // Will be filled from DB if needed
            }
            
            logger.debug(`[AUTH] jwtVerify - JWT verification successful: ${JSON.stringify({
                userId: user.id,
                userName: user.name
            })}`)
            
            done(null, user)
        } catch (error) {
            logger.debug(`[AUTH] jwtVerify - JWT verification error: ${JSON.stringify(error)}`)
            done(error, false)
        }
    }
    return new JwtStrategy(jwtOptions, jwtVerify)
}
