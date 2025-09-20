-- ----------
-- 1. users - Quản lý thông tin người dùng
-- ----------

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- UUID cho distributed systems
    username VARCHAR(50) UNIQUE NOT NULL, -- Tên đăng nhập duy nhất
    email VARCHAR(255) UNIQUE NOT NULL, -- Email duy nhất
    display_name VARCHAR(100) NOT NULL, -- Tên hiển thị
    avatar_url TEXT, -- URL ảnh đại diện
    bio TEXT, -- Tiểu sử
    password_hash VARCHAR(255) NOT NULL, -- Mật khẩu đã hash (bcrypt/argon2)
    
    -- Status và trạng thái
    status VARCHAR(20) DEFAULT 'offline', -- online, offline, away, busy
    last_seen_at TIMESTAMP WITH TIME ZONE, -- Thời gian online cuối
    is_active BOOLEAN DEFAULT true, -- Tài khoản còn hoạt động không
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
    
    -- Indexing cho performance
    INDEX idx_users_username (username),
    INDEX idx_users_email (email),
    INDEX idx_users_status (status),
    INDEX idx_users_last_seen (last_seen_at DESC)
);


-- ----------
-- 2. conversations - Quản lý các cuộc hội thoại
-- ----------

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL DEFAULT 'direct', -- direct, group
    name VARCHAR(255), -- Tên group (NULL với direct message)
    description TEXT, -- Mô tả cho group (NULL với direct message)
    avatar_url TEXT, -- Ảnh đại diện group (NULL với direct message)
    
    -- Settings
    is_pinned BOOLEAN DEFAULT false, -- Được ghim không
    max_members INT DEFAULT 100, -- Giới hạn thành viên (cho group)
    
    -- Metadata
    created_by UUID REFERENCES users(id), -- Người tạo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_conversations_type (type),
    INDEX idx_conversations_last_message (last_message_at DESC),
    INDEX idx_conversations_created_by (created_by)
);


-- ----------
-- 3. conversation_members - Thành viên trong conversation
-- ----------

CREATE TABLE conversation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Roles và permissions
    role VARCHAR(20) DEFAULT 'member', -- admin, member
    nickname VARCHAR(100), -- Nickname trong group này
    
    -- Settings cho mỗi user trong conversation
    is_muted BOOLEAN DEFAULT false, -- Tắt thông báo
    muted_until TIMESTAMP WITH TIME ZONE, -- Tắt thông báo đến khi nào
    notification_level VARCHAR(20) DEFAULT 'all', -- all, mentions, none
    
    -- Tracking
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE, -- NULL nếu còn trong conversation
    last_read_message_id UUID, -- ID tin nhắn đọc cuối cùng
    unread_count INT DEFAULT 0, -- Cache số tin nhắn chưa đọc
    
    -- Constraints
    UNIQUE(conversation_id, user_id), -- Một user chỉ join 1 lần vào conversation
    
    -- Indexes
    INDEX idx_members_conversation (conversation_id),
    INDEX idx_members_user (user_id),
    INDEX idx_members_role (role),
    INDEX idx_members_active (conversation_id, left_at) -- Tìm active members
);


-- ----------
-- 4. messages - Tin nhắn chính
-- ----------

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    
    -- Nội dung tin nhắn
    content TEXT, -- Nội dung text
    message_type VARCHAR(20) DEFAULT 'text', -- text, image, file, audio, video
    
    -- Reply và thread
    parent_message_id UUID REFERENCES messages(id), -- Reply to message
    thread_count INT DEFAULT 0, -- Số reply trong thread
    
    -- Metadata
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT false, -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes cho query performance
    INDEX idx_messages_conversation (conversation_id, created_at DESC),
    INDEX idx_messages_sender (sender_id),
    INDEX idx_messages_parent (parent_message_id),
    INDEX idx_messages_type (message_type)
);


-- ----------
-- 5. message_attachments - File đính kèm
-- ----------

CREATE TABLE message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    
    -- File info
    file_url TEXT NOT NULL, -- URL của file trên storage (S3, Cloudinary...)
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100), -- MIME type
    file_size BIGINT, -- Kích thước file (bytes)
    
    -- Thumbnail cho images/videos
    thumbnail_url TEXT,
    width INT, -- Chiều rộng (cho images/videos)
    height INT, -- Chiều cao
    duration INT, -- Thời lượng (cho audio/video, tính bằng giây)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_attachments_message (message_id)
);


-- ----------
-- 6. message_read_receipts - Tracking đã đọc tin nhắn
-- ----------

CREATE TABLE message_read_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Một user chỉ đọc 1 lần
    UNIQUE(message_id, user_id),
    
    INDEX idx_read_receipts_message (message_id),
    INDEX idx_read_receipts_user (user_id)
);

-- ----------
-- 7. user_presence - Tracking online status real-time
-- ----------

CREATE TABLE user_presence (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'offline',
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Device và connection info
    active_device_count INT DEFAULT 0, -- Số thiết bị đang online
    last_device_info JSONB, -- {"platform": "web", "browser": "Chrome", ...}
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_presence_status (status),
    INDEX idx_presence_last_active (last_active_at DESC)
);


-- ----------
-- Triggers and Functions
-- ----------


