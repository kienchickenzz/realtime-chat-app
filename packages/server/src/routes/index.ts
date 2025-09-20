import express from 'express'

import userRouter from '../auth/routes/user'

const router = express.Router()

router.use( '/user', userRouter )

export default router
