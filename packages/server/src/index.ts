import express, { Request, Response } from 'express'
import path from 'path'
import cors from 'cors'
import http from 'http'
import cookieParser from 'cookie-parser'
import { DataSource, IsNull } from 'typeorm'
import { getEncryptionKey } from './utils'
import logger, { expressRequestLogger } from './utils/logger'
import { getDataSource } from './DataSource'
import { getCorsOptions, sanitizeMiddleware } from './utils/XSS'
import apiRouter from './routes'
import errorHandlerMiddleware from './middlewares/errors'
import { WHITELIST_URLS } from './utils/constants'
import { initializeJwtCookieMiddleware, verifyToken } from './auth/middleware/passport'
// import { IdentityManager } from './IdentityManager'
// import { SSEStreamer } from './utils/SSEStreamer'
import { LoggedInUser } from './auth/Interface'
// import { IMetricsProvider } from './Interface.Metrics'
// import { Prometheus } from './metrics/Prometheus'
// import { OpenTelemetry } from './metrics/OpenTelemetry'
// import { QueueManager } from './queue/QueueManager'
// import { RedisEventSubscriber } from './queue/RedisEventSubscriber'
import 'global-agent/bootstrap'

declare global {
    namespace Express {
        interface User extends LoggedInUser {}
        interface Request {
            user?: LoggedInUser
        }
        namespace Multer {
            interface File {
                bucket: string
                key: string
                acl: string
                contentType: string
                contentDisposition: null
                storageClass: string
                serverSideEncryption: null
                metadata: any
                location: string
                etag: string
            }
        }
    }
}

export class App {
    app: express.Application
    AppDataSource: DataSource = getDataSource()
    // sseStreamer: SSEStreamer
    // identityManager: IdentityManager
    // metricsProvider: IMetricsProvider
    // queueManager: QueueManager
    // redisSubscriber: RedisEventSubscriber

    constructor() {
        this.app = express()
    }

    async initDatabase() {
        // Initialize database
        try {
            await this.AppDataSource.initialize()
            logger.info('📦 [server]: Data Source initialized successfully')

            // Run Migrations Scripts
            await this.AppDataSource.runMigrations({ transaction: 'each' })
            logger.info('🔄 [server]: Database migrations completed successfully')

            // Initialize Identity Manager
            // this.identityManager = await IdentityManager.getInstance()
            // logger.info('🔐 [server]: Identity Manager initialized successfully')

            // Initialize encryption key
            await getEncryptionKey()
            logger.info('🔑 [server]: Encryption key initialized successfully')

            // Initialize SSE Streamer
            // this.sseStreamer = new SSEStreamer()
            // logger.info('🌊 [server]: SSE Streamer initialized successfully')

            // Init Queues
            // this.queueManager = QueueManager.getInstance()
            // this.queueManager.setupAllQueues({
            //     appDataSource: this.AppDataSource,
            // })
            // logger.info('✅ [Queue]: All queues setup successfully')

            // this.redisSubscriber = new RedisEventSubscriber(this.sseStreamer)
            // await this.redisSubscriber.connect()
            logger.info('🔗 [server]: Redis event subscriber connected successfully')

            logger.error('🔴 TEST: Error level log')
            logger.warn('🟡 TEST: Warn level log') 
            logger.info('🔵 TEST: Info level log')
            logger.verbose('🟣 TEST: Verbose level log')
            logger.debug('🟢 TEST: Debug level log')

            logger.info('🎉 [server]: All initialization steps completed successfully!')
        } catch (error) {
            logger.error('❌ [server]: Error during Data Source initialization:', error)
        }
    }

    async config() {
        // Limit is needed to allow sending/receiving base64 encoded string
        const flowise_file_size_limit = process.env.FLOWISE_FILE_SIZE_LIMIT || '50mb'
        this.app.use(express.json({ limit: flowise_file_size_limit }))
        this.app.use(express.urlencoded({ limit: flowise_file_size_limit, extended: true }))

        // Enhanced trust proxy settings for load balancer
        this.app.set('trust proxy', true) // Trust all proxies

        // Allow access from specified domains
        this.app.use(cors(getCorsOptions()))

        // Parse cookies
        this.app.use(cookieParser() as any)

        // Switch off the default 'X-Powered-By: Express' header
        this.app.disable('x-powered-by')

        // Add the expressRequestLogger middleware to log all requests
        this.app.use(expressRequestLogger)

        // Add the sanitizeMiddleware to guard against XSS
        this.app.use(sanitizeMiddleware)

        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Credentials', 'true') // Allow credentials (cookies, etc.)
            if (next) next()
        })

        const whitelistURLs = WHITELIST_URLS
        const URL_CASE_INSENSITIVE_REGEX: RegExp = /\/api\/v1\//i
        const URL_CASE_SENSITIVE_REGEX: RegExp = /\/api\/v1\//

        await initializeJwtCookieMiddleware(this.app)

        this.app.use(async (req, res, next) => {
            // Step 1: Check if the req path contains /api/v1 regardless of case
            if (URL_CASE_INSENSITIVE_REGEX.test(req.path)) {
                // Step 2: Check if the req path is casesensitive
                if (URL_CASE_SENSITIVE_REGEX.test(req.path)) {
                    // Step 3: Check if the req path is in the whitelist
                    const isWhitelisted = whitelistURLs.some((url) => req.path.startsWith(url))
                    if (isWhitelisted) {
                        next()
                    } else if (req.headers['x-request-from'] === 'internal') {
                        verifyToken(req, res, next)
                    } else {
                        // Không cần verify JWT - API hoàn toàn mở
                        next()
                    }
                } else {
                    return res.status(401).json({ error: 'Unauthorized Access' })
                }
            } else {
                // If the req path does not contain /api/v1, then allow the request to pass through, example: /assets, /canvas
                next()
            }
        })

        // this is for SSO and must be after the JWT cookie middleware
        // await this.identityManager.initializeSSO(this.app)

        // if (process.env.ENABLE_METRICS === 'true') {
        //     switch (process.env.METRICS_PROVIDER) {
        //         // default to prometheus
        //         case 'prometheus':
        //         case undefined:
        //             this.metricsProvider = new Prometheus(this.app)
        //             break
        //         case 'open_telemetry':
        //             this.metricsProvider = new OpenTelemetry(this.app)
        //             break
        //         // add more cases for other metrics providers here
        //     }
        //     if (this.metricsProvider) {
        //         await this.metricsProvider.initializeCounters()
        //         logger.info(`📊 [server]: Metrics Provider [${this.metricsProvider.getName()}] has been initialized!`)
        //     } else {
        //         logger.error(
        //             "❌ [server]: Metrics collection is enabled, but failed to initialize provider (valid values are 'prometheus' or 'open_telemetry'."
        //         )
        //     }
        // }

        this.app.use('/api/v1', apiRouter )

        // ----------------------------------------
        // Configure number of proxies in Host Environment
        // ----------------------------------------
        this.app.get('/api/v1/ip', (request, response) => {
            response.send({
                ip: request.ip,
                msg: 'Check returned IP address in the response. If it matches your current IP address ( which you can get by going to http://ip.nfriedly.com/ or https://api.ipify.org/ ), then the number of proxies is correct and the rate limiter should now work correctly. If not, increase the number of proxies by 1 and restart Cloud-Hosted Flowise until the IP address matches your own. Visit https://docs.flowiseai.com/configuration/rate-limit#cloud-hosted-rate-limit-setup-guide for more information.'
            })
        })

        if ( process.env.ENABLE_BULLMQ_DASHBOARD === 'true' ) {
            // this.app.use( '/admin/queues', this.queueManager.getBullBoardRouter() )
        }

        // ----------------------------------------
        // Serve UI static
        // ----------------------------------------

        const uiBuildPath = path.join(__dirname, '..', 'public', 'dist')
        const uiHtmlPath = path.join(__dirname, '..', 'public', 'dist', 'index.html')

        this.app.use('/', express.static(uiBuildPath))

        // All other requests not handled will return React app
        this.app.use((req: Request, res: Response) => {
            res.sendFile(uiHtmlPath)
        })

        // Error handling
        this.app.use( errorHandlerMiddleware )
    }

    async stopApp() {
        try {
            const removePromises: any[] = []
            // if (this.queueManager) {
            //     removePromises.push(this.redisSubscriber.disconnect())
            // }
            await Promise.all(removePromises)
        } catch (e) {
            logger.error(`❌[server]: Server shut down error: ${e}`)
        }
    }
}

let serverApp: App | undefined

export async function start(): Promise<void> {
    serverApp = new App()

    const host = process.env.HOST
    const port = parseInt( process.env.PORT || '', 10 ) || 3000
    const server = http.createServer( serverApp.app )

    await serverApp.initDatabase()
    await serverApp.config()

    server.listen( port, host, () => {
        logger.info( `⚡️ [server]: Server is listening at ${ host ? 'http://' + host : '' }:${ port }` )
    } )
}

export function getInstance(): App | undefined {
    return serverApp
}
