import { Router } from 'express'
import conversationController from '../../controllers/conversation'

const router = Router()

router.get( '/', conversationController.getUserConversations )
router.post( '/direct', conversationController.createDirectConversation )
router.get( '/:conversationId/messages', conversationController.getConversationMessages )

router.get('/connect', )

export default router
