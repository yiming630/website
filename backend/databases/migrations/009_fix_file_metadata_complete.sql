-- Fix file_metadata table to include all columns expected by the backend
-- This migration consolidates all missing columns from file_metadata_advanced

-- Add missing columns that the backend expects
ALTER TABLE file_metadata 
ADD COLUMN IF NOT EXISTS stored_filename VARCHAR(500),
ADD COLUMN IF NOT EXISTS file_key VARCHAR(1000),
ADD COLUMN IF NOT EXISTS file_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS file_extension VARCHAR(10),
ADD COLUMN IF NOT EXISTS bucket_name VARCHAR(200) DEFAULT 'gridfs-storage',
ADD COLUMN IF NOT EXISTS storage_region VARCHAR(100) DEFAULT 'local',
ADD COLUMN IF NOT EXISTS extracted_text TEXT,
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

-- Note: deleted_at was already added manually, but ensure it exists
ALTER TABLE file_metadata
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Create file_access_logs table if it doesn't exist (referenced by backend code)
CREATE TABLE IF NOT EXISTS file_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_metadata_id INTEGER, -- Using INTEGER to match file_metadata.id type
    user_id VARCHAR(255),
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

-- Update existing rows with default values for new columns if needed
UPDATE file_metadata 
SET stored_filename = original_filename 
WHERE stored_filename IS NULL AND original_filename IS NOT NULL;

UPDATE file_metadata 
SET file_key = CONCAT('gridfs/', gridfs_file_id)
WHERE file_key IS NULL AND gridfs_file_id IS NOT NULL;

UPDATE file_metadata 
SET file_type = mime_type
WHERE file_type IS NULL AND mime_type IS NOT NULL;

UPDATE file_metadata
SET file_extension = 
  CASE 
    WHEN original_filename LIKE '%.pdf' THEN 'pdf'
    WHEN original_filename LIKE '%.docx' THEN 'docx'
    WHEN original_filename LIKE '%.txt' THEN 'txt'
    WHEN original_filename LIKE '%.doc' THEN 'doc'
    ELSE 'unknown'
  END
WHERE file_extension IS NULL;