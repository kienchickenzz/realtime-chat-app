import { MigrationInterface, QueryRunner } from 'typeorm'

export class SeedRoles1758870000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // User permissions - basic chat functionality
        const userPermissions = [
            'messages:view',
            'messages:create', 
            'messages:edit',
            'messages:delete',
            'messages:react',
            'messages:forward',
            'messages:upload-file',
            'conversations:view',
            'conversations:create',
            'conversations:update',
            'conversations:delete',
            'conversations:add-member',
            'conversations:remove-member',
            'conversations:mute',
            'conversations:archive',
            'users:view',
            'users:view-profile',
            'users:update-profile',
            'users:view-presence',
            'users:search'
        ]

        // Admin permissions - all user permissions plus admin capabilities
        const adminPermissions = [
            ...userPermissions,
            'admin:users-manage',
            'admin:roles-manage',
            'admin:conversations-manage',
            'admin:messages-moderate'
        ]

        // Insert User role
        await queryRunner.query(`
            INSERT INTO auth.roles (id, name, description, permissions, "createdAt") 
            VALUES (
                gen_random_uuid(),
                'user',
                'Standard user with basic chat functionality and personal workspace access.',
                $1,
                NOW()
            )
        `, [JSON.stringify(userPermissions)])

        // Insert Admin role  
        await queryRunner.query(`
            INSERT INTO auth.roles (id, name, description, permissions, "createdAt") 
            VALUES (
                gen_random_uuid(),
                'admin',
                'Manages organization settings, users, and has full access to all chat features within the organization.',
                $1,
                NOW()
            )
        `, [JSON.stringify(adminPermissions)])
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove seeded roles
        await queryRunner.query(`DELETE FROM auth.roles WHERE name IN ('user', 'admin')`)
    }
}
