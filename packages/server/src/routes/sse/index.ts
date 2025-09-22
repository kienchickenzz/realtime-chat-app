import { Router } from 'express'
import sseController from '../../controllers/sse'
import { verifyToken } from '../../auth/middleware/passport'

const router = Router()

router.get( '/connect', sseController.connect )
router.post( '/disconnect', sseController.disconnect )

export default router
