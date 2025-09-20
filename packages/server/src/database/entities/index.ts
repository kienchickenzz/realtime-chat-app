import { User as businessUser } from './User'
import { Conversation } from './Conversation'
import { ConversationMember } from './ConversationMemeber'
import { Message } from './Message'
import { MessageAttachment } from './MessageAttachment'
import { MessageReadReceipt } from './MessageReadReceipt'
import { UserPresence } from './UserPresence'

import { entities as authEntities } from '../../auth/database/entities'

export const entities = {
    ...authEntities,

    businessUser,
    Conversation,
    ConversationMember,
    Message,
    MessageAttachment,
    MessageReadReceipt,
    UserPresence,
}
