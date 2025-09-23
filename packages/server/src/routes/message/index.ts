import { Router } from 'express';
import messageController from '../../controllers/message';

const router = Router();

// POST /api/messages - Create a new message
router.post('/', messageController.createMessage);

export default router;