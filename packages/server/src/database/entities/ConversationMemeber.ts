import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { Conversation } from './Conversation';
import { User } from './User';
import { Message } from './Message';

@Entity('conversation_members', { schema: 'business' })
@Unique(['conversation', 'user'])
export class ConversationMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Conversation, (c) => c.members, { onDelete: 'CASCADE' })
  conversation: Conversation;

  @Index()
  @ManyToOne(() => User, (u) => u.conversations, { onDelete: 'CASCADE' })
  user: User;

  @Index()
  @Column({ length: 20, default: 'member' })
  role: string;

  @Column({ length: 100, nullable: true })
  nickname?: string;

  @Column({ default: false })
  isMuted: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  mutedUntil?: Date;

  @Column({ length: 20, default: 'all' })
  notificationLevel: string;

  @CreateDateColumn({ type: 'timestamptz' })
  joinedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  leftAt?: Date;

  @ManyToOne(() => Message, { nullable: true })
  lastReadMessage?: Message;

  @Column({ type: 'int', default: 0 })
  unreadCount: number;
}
