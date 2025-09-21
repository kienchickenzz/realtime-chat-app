import { Queue, RedisOptions } from 'bullmq'
import { BaseQueue } from './BaseQueue'
import { DataSource } from 'typeorm'
import { processUserActivityUpdate } from '../utils'
import { SSEStreamer } from '../sse/SSEStreamer'

interface UpdateMessageQueueOptions {
    appDataSource: DataSource
    sseStreamer: SSEStreamer
    // telemetry: Telemetry
}

export class UpdateMessageQueue extends BaseQueue {
    private queueName: string
    private appDataSource: DataSource
    private sseStreamer: SSEStreamer

    constructor( queueName: string, connection: RedisOptions, options: UpdateMessageQueueOptions ) {
        super( queueName, connection )
        this.queueName = queueName
        this.appDataSource = options.appDataSource
        this.sseStreamer = options.sseStreamer
    }

    public getQueueName(): string {
        return this.queueName
    }

    public getQueue(): Queue {
        return this.queue
    }

    public async processJob(data: any): Promise<any> {
        // return await processUserActivityUpdate(data, this.appDataSource, this.sseStreamer)
    }
}
