import { Initial1758355700886 } from './1758355700886-Initial'
import { RemoveUserId1758592012743 } from './1758592012743-RemoveUserId'
import { AddMessageTrigger1758669660000 } from './1758669660000-AddMessageTrigger'

import { postgresMigrations as authMigrations } from '../../../auth/database/migrations/postgres'

export const postgresMigrations = [
    ...authMigrations,

    Initial1758355700886,
    RemoveUserId1758592012743,
    AddMessageTrigger1758669660000,
]
