
import { DataSource, Repository } from 'typeorm';
import { Conversation } from '../../database/entities/Conversation';
import { ConversationMember } from '../../database/entities/ConversationMemeber';
import { User } from '../../database/entities/User';
import { Message } from '../../database/entities/Message';

export interface ConversationService {
    getUserConversations(userId: string): Promise<Conversation[]>;
    createDirectConversation(currentUserId: string, targetUserId: string): Promise<Conversation>;
    getConversationMessages(conversationId: string, userId: string, page: number, limit: number): Promise<{ messages: Message[], total: number, hasNext: boolean, hasPrev: boolean }>;
}

export class ConversationServiceImpl implements ConversationService {
    private conversationRepository: Repository<Conversation>;
    private conversationMemberRepository: Repository<ConversationMember>;
    private userRepository: Repository<User>;
    private messageRepository: Repository<Message>;

    constructor(dataSource: DataSource) {
        this.conversationRepository = dataSource.getRepository(Conversation);
        this.conversationMemberRepository = dataSource.getRepository(ConversationMember);
        this.userRepository = dataSource.getRepository(User);
        this.messageRepository = dataSource.getRepository(Message);
    }

    async getUserConversations(userId: string): Promise<Conversation[]> {
        const conversations = await this.conversationRepository
            .createQueryBuilder('conversation')
            .innerJoin('conversation.members', 'member')
            .innerJoin('member.user', 'user')
            .leftJoinAndSelect('conversation.members', 'allMembers')
            .leftJoinAndSelect('allMembers.user', 'memberUser')
            .leftJoinAndSelect('conversation.createdBy', 'creator')
            .where('user.id = :userId', { userId })
            .andWhere('member.leftAt IS NULL')
            .orderBy('conversation.updatedAt', 'DESC')
            .getMany();

        return conversations;
    }

    async createDirectConversation(currentUserId: string, targetUserId: string): Promise<Conversation> {
        // Kiểm tra target user có tồn tại không
        const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });
        if (!targetUser) {
            throw new Error('Target user not found');
        }

        // Kiểm tra conversation 1:1 đã tồn tại chưa
        const existingConversation = await this.conversationRepository
            .createQueryBuilder('conversation')
            .innerJoin('conversation.members', 'member1')
            .innerJoin('conversation.members', 'member2')
            .where('conversation.type = :type', { type: 'direct' })
            .andWhere('member1.user.id = :currentUserId', { currentUserId })
            .andWhere('member2.user.id = :targetUserId', { targetUserId })
            .andWhere('member1.leftAt IS NULL')
            .andWhere('member2.leftAt IS NULL')
            .leftJoinAndSelect('conversation.members', 'allMembers')
            .leftJoinAndSelect('allMembers.user', 'memberUser')
            .leftJoinAndSelect('conversation.createdBy', 'creator')
            .getOne();

        if (existingConversation) {
            return existingConversation;
        }

        // Tạo conversation mới
        const currentUser = await this.userRepository.findOne({ where: { id: currentUserId } });
        if (!currentUser) {
            throw new Error('Current user not found');
        }

        const newConversation = this.conversationRepository.create({
            type: 'direct',
            createdBy: currentUser
        });

        const savedConversation = await this.conversationRepository.save(newConversation);

        // Tạo 2 conversation members
        const members = [
            this.conversationMemberRepository.create({
                conversation: savedConversation,
                user: currentUser,
                role: 'member'
            }),
            this.conversationMemberRepository.create({
                conversation: savedConversation,
                user: targetUser,
                role: 'member'
            })
        ];

        await this.conversationMemberRepository.save(members);

        // Trả về conversation với đầy đủ thông tin
        return await this.conversationRepository.findOne({
            where: { id: savedConversation.id },
            relations: ['members', 'members.user', 'createdBy']
        });
    }

    async getConversationMessages(conversationId: string, userId: string, page: number = 1, limit: number = 50): Promise<{ messages: Message[], total: number, hasNext: boolean, hasPrev: boolean }> {
        // Kiểm tra user có quyền truy cập conversation không
        const memberCheck = await this.conversationMemberRepository.findOne({
            where: {
                conversation: { id: conversationId },
                user: { id: userId },
                leftAt: null
            }
        });

        if (!memberCheck) {
            throw new Error('Access denied: You are not a member of this conversation');
        }

        // Tính offset cho pagination
        const offset = (page - 1) * limit;

        // Đếm tổng số messages
        const total = await this.messageRepository.count({
            where: {
                conversation: { id: conversationId },
                isDeleted: false
            }
        });

        // Lấy messages với pagination
        const messages = await this.messageRepository
            .createQueryBuilder('message')
            .leftJoinAndSelect('message.sender', 'sender')
            .leftJoinAndSelect('message.attachments', 'attachments')
            .leftJoinAndSelect('message.parentMessage', 'parentMessage')
            .leftJoinAndSelect('parentMessage.sender', 'parentSender')
            .where('message.conversation.id = :conversationId', { conversationId })
            .andWhere('message.isDeleted = :isDeleted', { isDeleted: false })
            .orderBy('message.createdAt', 'DESC')
            .skip(offset)
            .take(limit)
            .getMany();

        // Tính toán pagination info
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return {
            messages,
            total,
            hasNext,
            hasPrev
        };
    }
}

export default {
    ConversationServiceImpl
}
