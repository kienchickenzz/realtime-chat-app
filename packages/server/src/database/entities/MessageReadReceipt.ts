import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Index, Unique } from 'typeorm';
import { Message } from './Message';
import { User } from './User';

@Entity('message_read_receipts', { schema: 'business' })
@Unique(['message', 'user'])
export class MessageReadReceipt {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @ManyToOne(() => Message, (m) => m.readReceipts, { onDelete: 'CASCADE' })
    message: Message;

    @Index()
    @ManyToOne(() => User, (u) => u.readReceipts, { onDelete: 'CASCADE' })
    user: User;

    @CreateDateColumn({ type: 'timestamptz' })
    readAt: Date;
}
