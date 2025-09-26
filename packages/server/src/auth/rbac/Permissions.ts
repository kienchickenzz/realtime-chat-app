export class Permissions {
    private categories: PermissionCategory[] = []
    constructor() {
        // Messages permissions
        const messagesCategory = new PermissionCategory('messages')
        messagesCategory.addPermission(new Permission('messages:view', 'View Messages'))
        messagesCategory.addPermission(new Permission('messages:create', 'Send Messages'))
        messagesCategory.addPermission(new Permission('messages:edit', 'Edit Messages'))
        messagesCategory.addPermission(new Permission('messages:delete', 'Delete Messages'))
        messagesCategory.addPermission(new Permission('messages:react', 'React to Messages'))
        messagesCategory.addPermission(new Permission('messages:forward', 'Forward Messages'))
        messagesCategory.addPermission(new Permission('messages:upload-file', 'Upload File Attachments'))
        this.categories.push(messagesCategory)

        // Conversations permissions
        const conversationsCategory = new PermissionCategory('conversations')
        conversationsCategory.addPermission(new Permission('conversations:view', 'View Conversations'))
        conversationsCategory.addPermission(new Permission('conversations:create', 'Create Conversations'))
        conversationsCategory.addPermission(new Permission('conversations:update', 'Update Conversation Settings'))
        conversationsCategory.addPermission(new Permission('conversations:delete', 'Delete Conversations'))
        conversationsCategory.addPermission(new Permission('conversations:add-member', 'Add Members to Conversation'))
        conversationsCategory.addPermission(new Permission('conversations:remove-member', 'Remove Members from Conversation'))
        conversationsCategory.addPermission(new Permission('conversations:mute', 'Mute/Unmute Conversations'))
        conversationsCategory.addPermission(new Permission('conversations:archive', 'Archive Conversations'))
        this.categories.push(conversationsCategory)

        // Users permissions
        const usersCategory = new PermissionCategory('users')
        usersCategory.addPermission(new Permission('users:view', 'View Users List'))
        usersCategory.addPermission(new Permission('users:view-profile', 'View User Profiles'))
        usersCategory.addPermission(new Permission('users:update-profile', 'Update Own Profile'))
        usersCategory.addPermission(new Permission('users:view-presence', 'View User Online Status'))
        usersCategory.addPermission(new Permission('users:search', 'Search Users'))
        this.categories.push(usersCategory)

        // Admin permissions
        const adminCategory = new PermissionCategory('admin')
        adminCategory.addPermission(new Permission('admin:users-manage', 'Manage All Users'))
        adminCategory.addPermission(new Permission('admin:roles-manage', 'Manage Roles & Permissions'))
        adminCategory.addPermission(new Permission('admin:conversations-manage', 'Manage All Conversations'))
        adminCategory.addPermission(new Permission('admin:messages-moderate', 'Moderate All Messages'))
        this.categories.push(adminCategory)
    }

    public toJSON(): { [key: string]: { key: string; value: string }[] } {
        return this.categories.reduce((acc, category) => {
            return {
                ...acc,
                ...category.toJSON()
            }
        }, {})
    }
}

class PermissionCategory {
    public permissions: any[] = []

    constructor(public category: string) {}

    addPermission(permission: Permission) {
        this.permissions.push(permission)
    }
    public toJSON() {
        return {
            [this.category]: [...this.permissions.map((permission) => permission.toJSON())]
        }
    }
}

export class Permission {
    constructor( public name: string, public description: string ) {}

    public toJSON() {
        return {
            key: this.name,
            value: this.description,
        }
    }
}
