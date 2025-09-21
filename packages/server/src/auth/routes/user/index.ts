import { Router } from 'express'
import { UserController } from '../../controllers/user'

// TODO: Chuyển về export default các hàm để code clean hơn
const router = Router()
const userController = new UserController()

router.post( '/register', userController.register.bind(userController))

router.post( '/login', userController.login.bind(userController) )

router.post( '/forgot-password', userController.forgotPassword.bind(userController) )

router.post( '/reset-password', userController.resetPassword.bind(userController) )

router.post( '/verify', userController.verifyUser.bind(userController) )

router.get( '/:id', userController.getUserProfile.bind(userController) )

export default router
