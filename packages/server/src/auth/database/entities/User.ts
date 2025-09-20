import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
  
@Entity('users', { schema: 'auth' })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar', length: 100 })
    name: string

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string

    @Column({ type: 'text', nullable: true })
    credential?: string // hashed password

    @Column({ type: 'text', nullable: true })
    tempToken?: string // for password reset

    @Column({ nullable: true })
    tokenExpiry?: Date

    @CreateDateColumn()
    createdDate: Date

    @UpdateDateColumn()
    updatedDate: Date
}
