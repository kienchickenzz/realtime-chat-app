import { Response } from 'express'
import logger from '../utils/logger'

type Client = {
    response: Response
    started?: boolean
}

export class SSEStreamer {
    clients: { 
        [ id: string ]: Client 
    } = {}

    addClient( userId: string, res: Response ) {
        // Lắng nghe sự kiện client disconnect
        res.on( 'close', () => {
            logger.debug( `Client ${ userId } disconnected` );
            delete this.clients[ userId ];
        });
        
        this.clients[ userId ] = { response: res, started: false }
    }

    removeClient( userId: string ) {
        const client = this.clients[ userId ]
        if ( client ) {
            const clientResponse = {
                event: 'end',
                data: '[END]'
            }
            client.response.write('message\ndata:' + JSON.stringify(clientResponse) + '\n\n')
            client.response.end()
            delete this.clients[ userId ]
        }
    }

    streamStartEvent( userId: string ) {
        const client = this.clients[ userId ]
        
        // Prevent multiple start events being streamed to the client
        if ( client && !client.started ) {
            const clientResponse = {
                event: 'start',
                data: '[START]'
            }
            client.response.write( 'message:\ndata:' + JSON.stringify( clientResponse ) + '\n\n' )
            client.started = true
        }
    }

    streamSignIn( channelId: string, data: any ) {
        const client = this.clients[channelId]
        if (client) {
            const clientResponse = {
                event: 'someone_sign_in',
                data: data
            }
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n')
        }
    }

    streamSignOut( channelId: string, data: any ) {
        const client = this.clients[ channelId ]
        if (client) {
            const clientResponse = {
                event: 'someone_sign_out',
                data: data
            }
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n')
        }
    }

    streamMessageEvent( channelId: string, data: any ) {
        const client = this.clients[ channelId ]
        if (client) {
            const clientResponse = {
                event: 'new_message',
                data: data
            }
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n')
        }
    }
}
