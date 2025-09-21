import express from 'express'

import authUserRouter from '../auth/routes/user'

import userRouter from '../routes/user'

const router = express.Router()

router.use( '/auth', authUserRouter )

router.use( '/user', userRouter )

export default router
