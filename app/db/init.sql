-- Translation Platform Database Initialization Script
-- PostgreSQL 16+ compatible

-- Create custom enums
CREATE TYPE user_role_enum AS ENUM ('READER', 'TRANSLATOR', 'ADMIN', 'ENTERPRISE');
CREATE TYPE document_status_enum AS ENUM ('PROCESSING', 'TRANSLATING', 'REVIEWING', 'COMPLETED', 'FAILED');
CREATE TYPE translation_style_enum AS ENUM ('GENERAL', 'ACADEMIC', 'BUSINESS', 'LEGAL', 'TECHNICAL', 'CREATIVE', 'MEDICAL', 'FINANCIAL');
CREATE TYPE chat_author_enum AS ENUM ('USER', 'AI');

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'READER',
    plan VARCHAR(100) NOT NULL DEFAULT 'free',
    preferences JSONB DEFAULT '{}',
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    default_settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    status document_status_enum NOT NULL DEFAULT 'PROCESSING',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    translation_style translation_style_enum NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    original_content TEXT,
    translated_content TEXT,
    file_url TEXT,
    file_size BIGINT,
    file_type VARCHAR(50),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Download links table
CREATE TABLE download_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    format VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    file_size BIGINT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author chat_author_enum NOT NULL,
    message_type VARCHAR(100) NOT NULL DEFAULT 'text',
    selected_text TEXT,
    position JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project collaborators table (many-to-many)
CREATE TABLE project_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{}',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Document collaborators table (many-to-many)
CREATE TABLE document_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{}',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, user_id)
);

-- Languages configuration table
CREATE TABLE languages (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100) NOT NULL,
    is_auto_detected BOOLEAN DEFAULT FALSE,
    supported_as_source BOOLEAN DEFAULT TRUE,
    supported_as_target BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Translation specializations table
CREATE TABLE translation_specializations (
    key VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requires_expertise BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    action_url TEXT,
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table (for JWT refresh tokens)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, refresh_token)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verification_token ON users(verification_token);
CREATE INDEX idx_users_reset_password_token ON users(reset_password_token);
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_documents_owner_id ON documents(owner_id);
CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_chat_messages_document_id ON chat_messages(document_id);
CREATE INDEX idx_download_links_document_id ON download_links(document_id);
CREATE INDEX idx_download_links_expires_at ON download_links(expires_at);
CREATE INDEX idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX idx_project_collaborators_user_id ON project_collaborators(user_id);
CREATE INDEX idx_document_collaborators_document_id ON document_collaborators(document_id);
CREATE INDEX idx_document_collaborators_user_id ON document_collaborators(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Create update trigger for updated_at fields
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default languages
INSERT INTO languages (code, name, native_name, supported_as_source, supported_as_target) VALUES
('en', 'English', 'English', TRUE, TRUE),
('zh', 'Chinese', '中文', TRUE, TRUE),
('zh-CN', 'Chinese (Simplified)', '简体中文', TRUE, TRUE),
('zh-TW', 'Chinese (Traditional)', '繁體中文', TRUE, TRUE),
('ja', 'Japanese', '日本語', TRUE, TRUE),
('ko', 'Korean', '한국어', TRUE, TRUE),
('fr', 'French', 'Français', TRUE, TRUE),
('de', 'German', 'Deutsch', TRUE, TRUE),
('es', 'Spanish', 'Español', TRUE, TRUE),
('pt', 'Portuguese', 'Português', TRUE, TRUE),
('ru', 'Russian', 'Русский', TRUE, TRUE),
('ar', 'Arabic', 'العربية', TRUE, TRUE),
('hi', 'Hindi', 'हिन्दी', TRUE, TRUE),
('auto', 'Auto Detect', 'Auto Detect', TRUE, FALSE);

-- Insert default translation specializations
INSERT INTO translation_specializations (key, title, description, requires_expertise) VALUES
('general', 'General Translation', 'General purpose translation for everyday content', FALSE),
('academic', 'Academic', 'Academic papers, research documents, and scholarly content', TRUE),
('business', 'Business', 'Business documents, contracts, and corporate communications', TRUE),
('legal', 'Legal', 'Legal documents, contracts, and juridical content', TRUE),
('technical', 'Technical', 'Technical manuals, specifications, and engineering documents', TRUE),
('creative', 'Creative', 'Creative writing, literature, and artistic content', TRUE),
('medical', 'Medical', 'Medical documents, research papers, and healthcare content', TRUE),
('financial', 'Financial', 'Financial reports, investment documents, and economic content', TRUE);

-- Create a default admin user (password: admin123)
INSERT INTO users (name, email, password_hash, role, is_verified) VALUES
('Admin User', 'admin@translation-platform.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5u.G', 'ADMIN', TRUE);

-- Create a default test project
INSERT INTO projects (name, description, color, owner_id, default_settings) VALUES
('Sample Project', 'A sample project for testing', '#3B82F6', (SELECT id FROM users WHERE email = 'admin@translation-platform.com'), '{"defaultSourceLanguage": "en", "defaultTargetLanguage": "zh-CN", "defaultTranslationStyle": "GENERAL", "defaultSpecialization": "general", "requireReview": false}');

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
