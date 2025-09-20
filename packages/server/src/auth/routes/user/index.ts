import { Router } from 'express'
import { UserController } from '../../controllers/user'

const router = Router()
const userController = new UserController()

router.post( '/register', userController.register)

router.post( '/login', userController.login )

router.post( '/forgot-password', userController.forgotPassword )

router.post( '/reset-password', userController.resetPassword )

router.post( '/verify', userController.verifyUser )

router.get( '/:id', userController.getUserProfile )

export default router
