import { Response } from 'express'

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
            console.log( `Client ${ userId } disconnected` );
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

    // TODO: Object hóa 2 tham số id và name để dễ mở rộng hơn
    streamSignIn( targetClientIds: string[] | string, userId: string, userName: string ) {
        const targets = Array.isArray(targetClientIds) ? targetClientIds : [targetClientIds]
        
        targets.forEach( targetId => {
            const client = this.clients[ targetId ]
            if ( client ) {
                const clientResponse = {
                    event: 'sign_in',
                    data: {
                        userId: userId,
                        userName: userName
                    }
                }
                client.response.write( 'message:\ndata:' + JSON.stringify( clientResponse ) + '\n\n' )
            }
        } )
    }

    streamSignOut( targetClientIds: string[] | string, userId: string, userName: string ) {
        const targets = Array.isArray(targetClientIds) ? targetClientIds : [targetClientIds]
        
        targets.forEach( targetId => {
            const client = this.clients[ targetId ]
            if ( client ) {
                const clientResponse = {
                    event: 'sign_out',
                    data: {
                        userId: userId,
                        userName: userName
                    }
                }
                client.response.write( 'message:\ndata:' + JSON.stringify( clientResponse ) + '\n\n' )
            }
        } )
    }
}
