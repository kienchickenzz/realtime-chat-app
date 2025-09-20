import { Command, Flags } from '@oclif/core'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '..', '..', '.env'), override: true })

enum EXIT_CODE {
    SUCCESS = 0,
    FAILED = 1
}

export abstract class BaseCommand extends Command {
    static flags = {
        PORT: Flags.string(),
    }

    protected async stopProcess() {
        // Overridden method by child class
    }

    private onTerminate() {
        return async () => {
            try {
                // Shut down the app after timeout if it ever stuck removing pools
                setTimeout(async () => {
                    console.info('Flowise was forced to shut down after 30 secs')
                    await this.failExit()
                }, 30000)

                await this.stopProcess()
            } catch (error) {
                console.error('There was an error shutting down Flowise...', error)
            }
        }
    }

    protected async gracefullyExit() {
        process.exit(EXIT_CODE.SUCCESS)
    }

    protected async failExit() {
        process.exit(EXIT_CODE.FAILED)
    }

    async init(): Promise<void> {
        await super.init()

        process.on('SIGTERM', this.onTerminate())
        process.on('SIGINT', this.onTerminate())

        // Prevent throw new Error from crashing the app
        process.on('uncaughtException', (err) => {
            console.error('uncaughtException: ', err)
        })

        process.on('unhandledRejection', (err) => {
            console.error('unhandledRejection: ', err)
        })

        const { flags } = await this.parse(this.constructor as any)
        if (flags.PORT) process.env.PORT = flags.PORT
    }
}
