import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { Conversation } from './Conversation';
import { User } from './User';
import { MessageAttachment } from './MessageAttachment';
import { MessageReadReceipt } from './MessageReadReceipt';

@Entity('messages', { schema: 'business' })
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @ManyToOne(() => Conversation, (c) => c.messages, { onDelete: 'CASCADE' })
    conversation: Conversation;

    @Index()
    @ManyToOne(() => User, (u) => u.messages)
    sender: User;

    @Column({ type: 'text', nullable: true })
    content?: string;

    @Index()
    @Column({ length: 20, default: 'text' })
    messageType: string;

    @Index()
    @ManyToOne(() => Message, (m) => m.replies, { nullable: true })
    parentMessage?: Message;

    @OneToMany(() => Message, (m) => m.parentMessage)
    replies: Message[];

    @Column({ type: 'int', default: 0 })
    threadCount: number;

    @Column({ default: false })
    isEdited: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    editedAt?: Date;

    @Column({ default: false })
    isDeleted: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    deletedAt?: Date;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    // Relations
    @OneToMany(() => MessageAttachment, (a) => a.message)
    attachments: MessageAttachment[];

    @OneToMany(() => MessageReadReceipt, (r) => r.message)
  readReceipts: MessageReadReceipt[];
}
