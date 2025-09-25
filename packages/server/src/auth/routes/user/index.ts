import { Router } from 'express'
import userController from '../../controllers/user'

const router = Router()

router.post( '/register', userController.register )
router.post( '/logout', userController.logout )

export default router
