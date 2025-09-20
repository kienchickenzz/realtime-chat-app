import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    Index,
} from 'typeorm';
import { User } from './User';
import { ConversationMember } from './ConversationMemeber';
import { Message } from './Message';

@Entity('conversations', { schema: 'business' })
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ length: 20, default: 'direct' })
    type: string;

    @Column({ length: 255, nullable: true })
    name?: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'text', nullable: true })
    avatarUrl?: string;

    @Column({ default: false })
    isPinned: boolean;

    @Column({ type: 'int', default: 100 })
    maxMembers: number;

    @ManyToOne(() => User, (u) => u.createdConversations, { onDelete: 'SET NULL' })
    createdBy: User;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;

    // Relations
    @OneToMany(() => ConversationMember, (m) => m.conversation)
    members: ConversationMember[];

    @OneToMany(() => Message, (m) => m.conversation)
    messages: Message[];
}
