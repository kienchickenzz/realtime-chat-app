import express from 'express'

import authUserRouter from '../auth/routes/user'
import userRouter from '../routes/user'
import sseRouter from '../routes/sse'
import conversationRouter from '../routes/conversation'
import messageRouter from '../routes/message'

const router = express.Router()

router.use( '/auth', authUserRouter )

router.use( '/user', userRouter )

router.use( '/sse', sseRouter )

router.use( '/conversation', conversationRouter )

router.use( '/message', messageRouter )

export default router
