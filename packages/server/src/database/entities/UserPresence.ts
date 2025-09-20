import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  Index,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

@Entity('user_presence', { schema: 'business' })
export class UserPresence {
    @PrimaryColumn('uuid')
    userId: string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Index()
    @Column({ length: 20, default: 'offline' })
    status: string;

    @Index()
    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    lastActiveAt: Date;

    @Column({ type: 'int', default: 0 })
    activeDeviceCount: number;

    @Column({ type: 'jsonb', nullable: true })
    lastDeviceInfo?: Record<string, any>;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}
