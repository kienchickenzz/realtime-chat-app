import { Queue, RedisOptions } from 'bullmq'
import { DataSource } from 'typeorm'
import { BaseQueue } from './BaseQueue'
import logger from '../utils/logger'
import { getMessageEventInfo } from '../utils'
import { RedisEventPublisher } from '../pubsub/RedisEventPublisher'

// TODO: Add another interface here for polymorphism (ONLY allow specific interface for addJob)
export interface MessageEventData {
    messageId: string;
}

interface MessageEventQueueOptions {
    redisEventPublisher: RedisEventPublisher
    appDataSource: DataSource
}

export class MessageEventQueue extends BaseQueue {
    private queueName: string
    private redisEventPublisher: RedisEventPublisher
    private appDataSource: DataSource

    constructor( queueName: string, connection: RedisOptions, options: MessageEventQueueOptions ) {
        super( queueName, connection )
        this.queueName = queueName

        this.appDataSource = options.appDataSource
        this.redisEventPublisher = options.redisEventPublisher
    }

    public getQueueName(): string {
        return this.queueName
    }

    public getQueue(): Queue {
        return this.queue
    }

    public async processJob(data: MessageEventData): Promise<void> {
        try {
            logger.debug(`Processing message event: ${JSON.stringify(data, null, 2)}`);

            // Get message info and recipients using utils function
            const messageInfo = await getMessageEventInfo( this.appDataSource, data.messageId );
            
            if (!messageInfo) {
                logger.warn(`Message info not found for messageId: ${data.messageId}`);
                return;
            }

            // Publish to Redis for each recipient
            for ( const recipientId of messageInfo.recipients ) {
                const data = {
                    messageId: messageInfo.messageId,
                    senderId: messageInfo.senderId,
                    content: messageInfo.content,
                    createdAt: messageInfo.createdAt
                }
                await this.redisEventPublisher.publishNewMessageEvent( recipientId, data )
                
                logger.debug(`Published message event to user: ${recipientId}`);
            }

            logger.info(`Message event processed successfully for message: ${data.messageId}, sent to ${messageInfo.recipients.length} recipients`);

        } catch (error) {
            logger.error('Error processing message event:', error);
            throw error; // Re-throw to trigger retry mechanism
        }
    }
}
