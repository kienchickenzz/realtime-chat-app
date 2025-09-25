import { Client } from 'pg';
import logger from './logger';
import { QueueManager } from '../queue/QueueManager';
import { BaseQueue } from '../queue/BaseQueue'
import { MessageEventData } from '../queue/MessageEventQueue'

export class DatabaseListener {
    private client: Client | null ;
    private isListening = false;
    private messageEventQueue: BaseQueue

    constructor() {
        // Create new client for listening (separate from TypeORM connection)
        this.client = new Client({
            host: process.env.DATABASE_HOST,
            port: parseInt( process.env.DATABASE_PORT || '5432' ),
            user: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
        });

        const queueManager = QueueManager.getInstance();
        this.messageEventQueue = queueManager.getQueue( 'messageEvent' )
    }

    async start() {
        try {
            await this.client.connect();
            logger.info('Database listener connected to PostgreSQL');

            // Listen to new_message notifications
            await this.client.query('LISTEN new_message');

            // Handle notifications
            this.client.on('notification', (msg) => {
                if (msg.channel === 'new_message' && msg.payload) {
                    this.handleNewMessageNotification(msg.payload);
                }
            });

            this.client.on('error', (err) => {
                logger.error('Database listener error:', err);
                this.reconnect();
            });

            this.client.on('end', () => {
                logger.warn('Database listener connection ended');
                if (this.isListening) {
                    this.reconnect();
                }
            });

            this.isListening = true;

        } catch (error) {
            logger.error( `Failed to start database listener: ${error}` );
            throw error;
        }
    }

    async stop() {
        try {
            this.isListening = false;
            
            if (this.client) {
                await this.client.query('UNLISTEN new_message');
                await this.client.end();
                this.client = null;
            }
            
            logger.info('Database listener stopped');
        } catch (error) {
            logger.error( `Error stopping database listener: ${error}`);
        }
    }

    private async handleNewMessageNotification(payload: string) {
        try {
            const messageData: MessageEventData = JSON.parse(payload);
            logger.debug( `Received new message notification: ${messageData}` );

            // Add to message event queue for processing
            this.messageEventQueue.addJob( messageData )

        } catch (error) {
            logger.error( `Error handling new message notification: ${error}` );
        }
    }

    private async reconnect() {
        if (!this.isListening) return;

        logger.info('Attempting to reconnect database listener...');
        
        try {
            await this.stop();
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            await this.start();
        } catch (error) {
            logger.error( `Failed to reconnect database listener: ${ error }` );
            // Retry after 10 seconds
            setTimeout(() => this.reconnect(), 10000);
        }
    }
}
