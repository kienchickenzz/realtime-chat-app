import { StatusCodes } from 'http-status-codes'

import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { LoggedInUser } from '../Interface'
import { InternalError } from '../../errors/internalError'
import { UserErrorMessage } from '../services/user'

export const getLoggedInUser = async (userId: string): Promise<LoggedInUser> => {
    const dataSource = getRunningExpressApp().AppDataSource
    const queryRunner = dataSource.createQueryRunner()
    await queryRunner.connect()

    try {
        // Get user info with role and permissions
        const query = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u."createdDate",
                u."updatedDate",
                r.name as role_name,
                r.permissions
            FROM auth.users u
            LEFT JOIN auth.user_role ur ON u.id = ur."userId"
            LEFT JOIN auth.roles r ON ur."roleId" = r.id
            WHERE u.id = $1
        `
        const result = await queryRunner.query(query, [userId])

        if (result.length === 0) {
            throw new InternalError(StatusCodes.NOT_FOUND, UserErrorMessage.USER_NOT_FOUND)
        }

        const userData = result[0]
        
        // Parse permissions from JSON string
        let permissions: string[] = []
        if (userData.permissions) {
            try {
                permissions = JSON.parse(userData.permissions)
            } catch (error) {
                console.error('Error parsing permissions JSON:', error)
                permissions = []
            }
        }

        const loggedInUser: LoggedInUser = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role_name || 'member',
            permissions: permissions
        }

        return loggedInUser

    } finally {
        await queryRunner.release()
    }
}

export default {
    getLoggedInUser,
}
