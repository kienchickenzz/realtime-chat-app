import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import messageService from '../../services/message';
import { InternalError } from '../../errors/internalError'

const createMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const senderId = req.user?.id;
        const { conversationId, content, messageType, parentMessageId } = req.body;
        
        if (!senderId) {
            throw new InternalError(StatusCodes.UNAUTHORIZED, "Unauthorized.")
        }

        if (!conversationId) {
            throw new InternalError(StatusCodes.BAD_REQUEST, "Conversation ID is required.")
        }

        // Validate message type if provided
        const validMessageTypes = ['text', 'image', 'file', 'voice', 'video'];
        if (messageType && !validMessageTypes.includes(messageType)) {
            throw new InternalError(StatusCodes.BAD_REQUEST, "Invalid message type.")
        }

        // Text messages must have content
        if ((!messageType || messageType === 'text') && !content?.trim()) {
            throw new InternalError(StatusCodes.BAD_REQUEST, "Text messages must have content.")
        }

        const message = await messageService.createMessage({
            conversationId,
            senderId,
            content: content?.trim(),
            messageType,
            parentMessageId
        });
        
        return res.status(StatusCodes.CREATED).json({
            message,
            success: true
        });
    } catch (error) {
        next(error);
    }
};

export default {
    createMessage
}