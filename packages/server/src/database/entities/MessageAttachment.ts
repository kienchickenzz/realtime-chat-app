import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { Message } from './Message';

@Entity('message_attachments', { schema: 'business' })
export class MessageAttachment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @ManyToOne(() => Message, (m) => m.attachments, { onDelete: 'CASCADE' })
    message: Message;

    @Column({ type: 'text' })
    fileUrl: string;

    @Column({ length: 255 })
    fileName: string;

    @Column({ length: 100, nullable: true })
    fileType?: string;

    @Column({ type: 'bigint', nullable: true })
    fileSize?: number;

    @Column({ type: 'text', nullable: true })
    thumbnailUrl?: string;

    @Column({ type: 'int', nullable: true })
    width?: number;

    @Column({ type: 'int', nullable: true })
    height?: number;

    @Column({ type: 'int', nullable: true })
    duration?: number;

    @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
