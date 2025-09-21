
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { User } from '../../database/entities/User'

const getAllUsers = async() => {
    const appServer = getRunningExpressApp()
    const dataSource = appServer.AppDataSource
    const queryRunner = dataSource.createQueryRunner()
    
    await queryRunner.connect()
    
    try {
        await queryRunner.startTransaction()
        
        const users = await queryRunner.manager.find(User)
        
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
