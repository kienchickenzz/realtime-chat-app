import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Index,
    OneToMany,
} from 'typeorm';
import { Conversation } from './Conversation';
import { ConversationMember } from './ConversationMemeber';
import { Message } from './Message';
import { MessageReadReceipt } from './MessageReadReceipt';
import { UserPresence } from './UserPresence';

@Entity('users', { schema: 'business' })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', unique: true })
    authUserId: string;

    @Column({ length: 100 })
    displayName: string;

    @Column({ type: 'text', nullable: true })
    avatarUrl?: string;

    @Column({ type: 'text', nullable: true })
    bio?: string;

    @Index()
    @Column({ length: 20, default: 'offline' })
    status: string;

    @Index()
    @Column({ type: 'timestamptz', nullable: true })
    lastSeenAt?: Date;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamptz' })
    deletedAt?: Date;

    // Relations
    @OneToMany(() => Conversation, (c) => c.createdBy)
    createdConversations: Conversation[];

    @OneToMany(() => ConversationMember, (m) => m.user)
    conversations: ConversationMember[];

    @OneToMany(() => Message, (m) => m.sender)
    messages: Message[];

    @OneToMany(() => MessageReadReceipt, (r) => r.user)
    readReceipts: MessageReadReceipt[];

    // 1-1 với user_presence
    presence: UserPresence;
}
