import { Entity, Column, PrimaryColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from './User'
import { Role } from './Role'

@Entity('user_role', { schema: 'auth' })
export class UserRole {
    @PrimaryColumn({ type: 'uuid' })
    userId: string

    @PrimaryColumn({ type: 'uuid' })
    roleId: string

    @CreateDateColumn()
    createdAt: Date

    // Relationships
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User

    @ManyToOne(() => Role, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'roleId' })
    role: Role
}
