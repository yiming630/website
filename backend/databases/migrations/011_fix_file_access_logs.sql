-- Fix file_access_logs table to match backend expectations
-- The backend expects file_metadata_id as INTEGER, not file_metadata_advanced_id as UUID

-- Drop the existing table and recreate it correctly
DROP TABLE IF EXISTS file_access_logs;

-- Recreate file_access_logs with correct column names and types
CREATE TABLE file_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_metadata_id INTEGER, -- Matches file_metadata.id which is SERIAL/INTEGER
    user_id VARCHAR(255), -- Backend uses VARCHAR for user_id in file operations
    access_type VARCHAR(50) NOT NULL,
    access_method VARCHAR(50) NOT NULL,
    ip_address INET NULL,
    user_agent TEXT NULL,
    request_headers JSONB NULL,
    response_status INTEGER NULL,
    bytes_transferred BIGINT NULL,
    access_duration INTEGER NULL,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    share_token VARCHAR(100) NULL,
    referrer VARCHAR(500) NULL,
    session_id VARCHAR(100) NULL
);

-- Add index for better performance
CREATE INDEX idx_file_access_logs_file_metadata_id ON file_access_logs(file_metadata_id);
CREATE INDEX idx_file_access_logs_user_id ON file_access_logs(user_id);
CREATE INDEX idx_file_access_logs_accessed_at ON file_access_logs(accessed_at);

-- Add foreign key constraint to file_metadata
ALTER TABLE file_access_logs 
ADD CONSTRAINT fk_file_access_logs_file_metadata 
FOREIGN KEY (file_metadata_id) REFERENCES file_metadata(id) ON DELETE CASCADE;
