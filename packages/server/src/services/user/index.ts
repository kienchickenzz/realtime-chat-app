
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { User } from '../../database/entities/User'

const getAllUsers = async(excludeUserId?: string) => {
    const appServer = getRunningExpressApp()
    const dataSource = appServer.AppDataSource
    const queryRunner = dataSource.createQueryRunner()
    
    await queryRunner.connect()
    
    try {
        await queryRunner.startTransaction()
        
        let users = await queryRunner.manager.find(User)
        
        // Exclude the specified user if provided
        // TODO: Thêm trường hợp để có thể sử dụng business user id
        if (excludeUserId) {
            users = users.filter(user => user.authUserId !== excludeUserId)
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
