import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { User } from '../../database/entities/User'

const getAllUsers = async(excludeUserId?: string) => {
    const appServer = getRunningExpressApp()
    const dataSource = appServer.AppDataSource
    const queryRunner = dataSource.createQueryRunner()
    
    await queryRunner.connect()
    
    try {
        await queryRunner.startTransaction()
        
        let users

        if ( excludeUserId ) {
            const userQuery = `
                SELECT *
                FROM business.users u
                WHERE u.id != $1
            `
            users = await dataSource.query(userQuery, [ excludeUserId ]);
        } else {
            const userQuery = `
                SELECT *
                FROM business.users u
            `
            users = await dataSource.query(userQuery);
        }

        await queryRunner.commitTransaction()
        
        return users
        
    } catch (error) {
        await queryRunner.rollbackTransaction()
        throw error
    } finally {
        await queryRunner.release()
    }
} 

export default {
    getAllUsers
}
