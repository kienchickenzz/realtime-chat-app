import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ConversationServiceImpl } from '../../services/conversation';
import { InternalError } from '../../errors/internalError'
import { AppDataSource } from '../../DataSource';

const conversationService = new ConversationServiceImpl(AppDataSource);

const getUserConversations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            throw new InternalError( StatusCodes.UNAUTHORIZED, "Unauthorized." )
        }

        const conversations = await conversationService.getUserConversations(userId);
        
        return res.status(StatusCodes.OK).json({
            conversations,
            total: conversations.length
        });
    } catch (error) {
        next(error);
    }
};

const createDirectConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const currentUserId = req.user?.id;
        const { targetUserId } = req.body;
        
        if ( !currentUserId || !targetUserId ) {
            throw new InternalError( StatusCodes.BAD_REQUEST, "Bad Request." )
        }

        if ( currentUserId === targetUserId ) {
            throw new InternalError( StatusCodes.BAD_REQUEST, "Cannot create conversation with yourself." )
        }

        const conversation = await conversationService.createDirectConversation(currentUserId, targetUserId);
        
        return res.status(StatusCodes.CREATED).json({
            conversation,
            message: 'Direct conversation created successfully'
        });
    } catch ( error ) {
        next( error )
    }
}

const getConversationMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        const { conversationId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100 messages per request
        
        if (!userId) {
            throw new InternalError(StatusCodes.UNAUTHORIZED, "Unauthorized.")
        }

        if (!conversationId) {
            throw new InternalError(StatusCodes.BAD_REQUEST, "Conversation ID is required.")
        }

        const result = await conversationService.getConversationMessages(conversationId, userId, page, limit);
        
        return res.status(StatusCodes.OK).json({
            messages: result.messages,
            pagination: {
                page,
                limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit),
                hasNext: result.hasNext,
                hasPrev: result.hasPrev
            }
        });
    } catch (error) {
        if (error.message === 'Access denied: You are not a member of this conversation') {
            throw new InternalError(StatusCodes.FORBIDDEN, "Access denied: You are not a member of this conversation.")
        }
        next(error)
    }
}

export default {
    getUserConversations,
    createDirectConversation,
    getConversationMessages
}
