import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm'

@Entity('roles', { schema: 'auth' })
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar', length: 50, unique: true })
    name: string // 'admin', 'member'

    @Column({ type: 'text', nullable: true })
    description?: string

    @Column({ type: 'text' })
    permissions: string // JSON array

    @CreateDateColumn()
    createdAt: Date
}
