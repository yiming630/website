-- Email Verification Schema Migration
-- Run this to add email verification functionality

-- 1. Update users table to add email verification fields
ALTER TABLE IF EXISTS users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS password_salt VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE, -- Encrypted token
    salt VARCHAR(255) NOT NULL, -- Salt for token encryption
    email VARCHAR(255) NOT NULL, -- Store email for verification
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    ip_address INET NULL, -- Track IP for security
    user_agent TEXT NULL, -- Track user agent
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_tokens_token_hash ON email_verification_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_email_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_tokens_expires_at ON email_verification_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_tokens_email ON email_verification_tokens(email);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

-- 4. Create email logs table for tracking
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL,
    email_type VARCHAR(50) NOT NULL, -- 'verification', 'welcome', 'password_reset'
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template_used VARCHAR(100) NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'failed', 'bounced'
    error_message TEXT NULL,
    ip_address INET NULL,
    user_agent TEXT NULL
);

-- 5. Create indexes for email logs
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);

-- 6. Add foreign key constraints if users table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE email_verification_tokens 
        ADD CONSTRAINT fk_email_tokens_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        
        ALTER TABLE email_logs 
        ADD CONSTRAINT fk_email_logs_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 7. Create function to cleanup expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM email_verification_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER IF NOT EXISTS update_email_tokens_timestamp 
    BEFORE UPDATE ON email_verification_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 9. Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'TRANSLATOR',
    plan VARCHAR(50) DEFAULT 'free',
    preferences JSONB DEFAULT '{}',
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP NULL,
    account_status VARCHAR(20) DEFAULT 'pending',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Insert some test data (for development only)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@translation-platform.com') THEN
        INSERT INTO users (name, email, password_hash, password_salt, role, email_verified, account_status, email_verified_at) 
        VALUES (
            'System Admin',
            'admin@translation-platform.com',
            '$2b$12$dummy.hash.for.testing.purposes.only',
            'dummy-salt-123',
            'ADMIN',
            TRUE,
            'active',
            CURRENT_TIMESTAMP
        );
    END IF;
END $$;