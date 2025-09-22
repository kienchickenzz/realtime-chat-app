import express from 'express'

import authUserRouter from '../auth/routes/user'
import userRouter from '../routes/user'
import sseRouter from '../routes/sse'

const router = express.Router()

router.use( '/auth', authUserRouter )

router.use( '/user', userRouter )

router.use( '/sse', sseRouter )

export default router
