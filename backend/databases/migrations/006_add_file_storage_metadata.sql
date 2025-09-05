-- File Storage Metadata Schema Migration
-- Creates tables for managing file uploads to Baidu Cloud with comprehensive metadata storage

-- 1. Create extended file metadata table (file_metadata already exists from migration 005)
CREATE TABLE IF NOT EXISTS file_metadata_advanced (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    project_id UUID NULL, -- Can be linked to a specific project
    
    -- File identification and naming
    original_filename VARCHAR(500) NOT NULL,
    stored_filename VARCHAR(500) NOT NULL,
    file_key VARCHAR(1000) NOT NULL UNIQUE, -- Baidu BOS object key
    file_hash VARCHAR(128) NOT NULL, -- SHA-256 hash for deduplication
    
    -- File properties
    file_type VARCHAR(50) NOT NULL, -- MIME type
    file_extension VARCHAR(10) NOT NULL,
    file_size BIGINT NOT NULL, -- Size in bytes
    
    -- Upload and processing status
    upload_status VARCHAR(50) DEFAULT 'pending', -- pending, uploading, completed, failed, deleted
    processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    
    -- Storage information
    bucket_name VARCHAR(200) NOT NULL,
    storage_region VARCHAR(100) NOT NULL,
    storage_class VARCHAR(50) DEFAULT 'STANDARD', -- STANDARD, STANDARD_IA, COLD, ARCHIVE
    is_encrypted BOOLEAN DEFAULT FALSE,
    
    -- Access control
    visibility VARCHAR(20) DEFAULT 'private', -- private, public-read, public-read-write
    access_permissions JSONB DEFAULT '{}', -- Custom permissions JSON
    
    -- URLs and access
    file_url VARCHAR(2000) NULL, -- Public access URL (if public)
    cdn_url VARCHAR(2000) NULL, -- CDN URL for faster access
    presigned_url VARCHAR(3000) NULL, -- Temporary signed URL
    presigned_expires_at TIMESTAMP NULL, -- When presigned URL expires
    
    -- Language and translation metadata
    source_language VARCHAR(10) NULL,
    target_language VARCHAR(10) NULL,
    translation_style VARCHAR(50) NULL,
    specialization VARCHAR(100) NULL,
    
    -- Processing metadata
    extracted_text TEXT NULL, -- Extracted text content for search
    metadata JSONB DEFAULT '{}', -- Additional metadata (dimensions, duration, etc.)
    thumbnail_urls JSONB DEFAULT '[]', -- Array of thumbnail URLs
    processing_logs JSONB DEFAULT '[]', -- Processing step logs
    
    -- Upload tracking
    upload_session_id VARCHAR(100) NULL, -- For multipart uploads
    total_parts INTEGER NULL, -- For multipart uploads
    completed_parts INTEGER DEFAULT 0, -- For multipart uploads
    upload_progress INTEGER DEFAULT 0, -- Progress percentage (0-100)
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_at TIMESTAMP NULL,
    processed_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL, -- Soft delete
    last_accessed_at TIMESTAMP NULL
);

-- 2. Create glossary files table (specialization for translation glossaries)
CREATE TABLE IF NOT EXISTS glossary_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_metadata_advanced_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Glossary properties
    glossary_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    domain VARCHAR(100) NULL, -- medical, legal, technical, etc.
    
    -- Glossary statistics
    term_count INTEGER DEFAULT 0,
    last_updated_at TIMESTAMP NULL,
    version INTEGER DEFAULT 1,
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP NULL,
    
    -- Status and validation
    validation_status VARCHAR(50) DEFAULT 'pending', -- pending, validated, rejected
    validation_notes TEXT NULL,
    validated_by UUID NULL,
    validated_at TIMESTAMP NULL,
    
    -- Sharing and collaboration
    is_public BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    shared_with JSONB DEFAULT '[]', -- Array of user IDs who have access
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create file sharing table
CREATE TABLE IF NOT EXISTS file_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_metadata_advanced_id UUID NOT NULL,
    shared_by UUID NOT NULL, -- User who shared the file
    shared_with UUID NULL, -- User who received access (NULL for public links)
    
    -- Sharing configuration
    share_type VARCHAR(20) NOT NULL, -- user, email, public_link
    recipient_email VARCHAR(255) NULL, -- For email-based sharing
    share_token VARCHAR(100) NULL, -- For public link sharing
    
    -- Permissions
    can_view BOOLEAN DEFAULT TRUE,
    can_download BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_comment BOOLEAN DEFAULT FALSE,
    can_share BOOLEAN DEFAULT FALSE,
    
    -- Expiration and limits
    expires_at TIMESTAMP NULL,
    max_downloads INTEGER NULL,
    download_count INTEGER DEFAULT 0,
    max_views INTEGER NULL,
    view_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMP NULL,
    revoked_by UUID NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create file access logs table (for audit and analytics)
CREATE TABLE IF NOT EXISTS file_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_metadata_advanced_id UUID NOT NULL,
    user_id UUID NULL, -- NULL for anonymous access
    
    -- Access details
    access_type VARCHAR(50) NOT NULL, -- view, download, upload, delete, share
    access_method VARCHAR(50) NOT NULL, -- direct, presigned_url, cdn, api
    ip_address INET NULL,
    user_agent TEXT NULL,
    
    -- Request details
    request_headers JSONB NULL,
    response_status INTEGER NULL,
    bytes_transferred BIGINT NULL,
    
    -- Timing
    access_duration INTEGER NULL, -- Duration in milliseconds
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional context
    share_token VARCHAR(100) NULL, -- If accessed via shared link
    referrer VARCHAR(500) NULL,
    session_id VARCHAR(100) NULL
);

-- 5. Create file processing jobs table (for async processing)
CREATE TABLE IF NOT EXISTS file_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_metadata_advanced_id UUID NOT NULL,
    
    -- Job configuration
    job_type VARCHAR(100) NOT NULL, -- thumbnail_generation, text_extraction, virus_scan, translation
    job_status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed, cancelled
    priority INTEGER DEFAULT 0, -- Higher number = higher priority
    
    -- Processing details
    processor_id VARCHAR(100) NULL, -- ID of the processing service/worker
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Job data and results
    input_data JSONB NULL, -- Job-specific input parameters
    output_data JSONB NULL, -- Job results
    error_message TEXT NULL,
    error_details JSONB NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_file_metadata_advanced_user_id ON file_metadata_advanced(user_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_advanced_project_id ON file_metadata_advanced(project_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_advanced_file_hash ON file_metadata_advanced(file_hash);
CREATE INDEX IF NOT EXISTS idx_file_metadata_advanced_file_key ON file_metadata_advanced(file_key);
CREATE INDEX IF NOT EXISTS idx_file_metadata_advanced_upload_status ON file_metadata_advanced(upload_status);
CREATE INDEX IF NOT EXISTS idx_file_metadata_advanced_processing_status ON file_metadata_advanced(processing_status);
CREATE INDEX IF NOT EXISTS idx_file_metadata_advanced_file_type ON file_metadata_advanced(file_type);
CREATE INDEX IF NOT EXISTS idx_file_metadata_advanced_created_at ON file_metadata_advanced(created_at);
CREATE INDEX IF NOT EXISTS idx_file_metadata_advanced_deleted_at ON file_metadata_advanced(deleted_at);

CREATE INDEX IF NOT EXISTS idx_glossary_files_file_metadata_advanced_id ON glossary_files(file_metadata_advanced_id);
CREATE INDEX IF NOT EXISTS idx_glossary_files_user_id ON glossary_files(user_id);
CREATE INDEX IF NOT EXISTS idx_glossary_files_languages ON glossary_files(source_language, target_language);
CREATE INDEX IF NOT EXISTS idx_glossary_files_domain ON glossary_files(domain);
CREATE INDEX IF NOT EXISTS idx_glossary_files_is_public ON glossary_files(is_public);

CREATE INDEX IF NOT EXISTS idx_file_shares_file_metadata_advanced_id ON file_shares(file_metadata_advanced_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_by ON file_shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with ON file_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_file_shares_share_token ON file_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_file_shares_is_active ON file_shares(is_active);

CREATE INDEX IF NOT EXISTS idx_file_access_logs_file_metadata_advanced_id ON file_access_logs(file_metadata_advanced_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_user_id ON file_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_access_type ON file_access_logs(access_type);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_accessed_at ON file_access_logs(accessed_at);

CREATE INDEX IF NOT EXISTS idx_file_processing_jobs_file_metadata_advanced_id ON file_processing_jobs(file_metadata_advanced_id);
CREATE INDEX IF NOT EXISTS idx_file_processing_jobs_status ON file_processing_jobs(job_status);
CREATE INDEX IF NOT EXISTS idx_file_processing_jobs_type ON file_processing_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_file_processing_jobs_priority ON file_processing_jobs(priority DESC);

-- 7. Add foreign key constraints
DO $$ 
DECLARE 
    users_id_type text;
    projects_id_type text;
BEGIN
    -- Check if users table exists and get the id column type
    SELECT data_type INTO users_id_type
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id';
    
    -- Only add foreign keys if users table has UUID id column
    IF users_id_type = 'uuid' THEN
        -- Check if constraints don't already exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_file_metadata_advanced_user_id') THEN
            ALTER TABLE file_metadata_advanced 
            ADD CONSTRAINT fk_file_metadata_advanced_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_glossary_files_user_id') THEN
            ALTER TABLE glossary_files 
            ADD CONSTRAINT fk_glossary_files_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_glossary_files_validated_by') THEN
            ALTER TABLE glossary_files 
            ADD CONSTRAINT fk_glossary_files_validated_by 
            FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_file_shares_shared_by') THEN
            ALTER TABLE file_shares 
            ADD CONSTRAINT fk_file_shares_shared_by 
            FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_file_shares_shared_with') THEN
            ALTER TABLE file_shares 
            ADD CONSTRAINT fk_file_shares_shared_with 
            FOREIGN KEY (shared_with) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_file_shares_revoked_by') THEN
            ALTER TABLE file_shares 
            ADD CONSTRAINT fk_file_shares_revoked_by 
            FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_file_access_logs_user_id') THEN
            ALTER TABLE file_access_logs 
            ADD CONSTRAINT fk_file_access_logs_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
    ELSE
        RAISE NOTICE 'Skipping user foreign key constraints - users table not found or id column is not UUID type (found: %)', COALESCE(users_id_type, 'table not found');
    END IF;
    
    -- Check projects table exists and has compatible id type
    SELECT data_type INTO projects_id_type
    FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'id';
    
    IF projects_id_type = 'uuid' THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_file_metadata_advanced_project_id') THEN
            ALTER TABLE file_metadata_advanced 
            ADD CONSTRAINT fk_file_metadata_advanced_project_id 
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
        END IF;
    ELSE
        RAISE NOTICE 'Skipping projects foreign key constraint - projects table not found or id column is not UUID type (found: %)', COALESCE(projects_id_type, 'table not found');
    END IF;
END $$;

-- Add file metadata references
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_glossary_files_file_metadata_advanced_id') THEN
        ALTER TABLE glossary_files 
        ADD CONSTRAINT fk_glossary_files_file_metadata_advanced_id 
        FOREIGN KEY (file_metadata_advanced_id) REFERENCES file_metadata_advanced(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_file_shares_file_metadata_advanced_id') THEN
        ALTER TABLE file_shares 
        ADD CONSTRAINT fk_file_shares_file_metadata_advanced_id 
        FOREIGN KEY (file_metadata_advanced_id) REFERENCES file_metadata_advanced(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_file_access_logs_file_metadata_advanced_id') THEN
        ALTER TABLE file_access_logs 
        ADD CONSTRAINT fk_file_access_logs_file_metadata_advanced_id 
        FOREIGN KEY (file_metadata_advanced_id) REFERENCES file_metadata_advanced(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_file_processing_jobs_file_metadata_advanced_id') THEN
        ALTER TABLE file_processing_jobs 
        ADD CONSTRAINT fk_file_processing_jobs_file_metadata_advanced_id 
        FOREIGN KEY (file_metadata_advanced_id) REFERENCES file_metadata_advanced(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 8. Create triggers for automatic timestamp updates (reuse function from previous migration)
DROP TRIGGER IF EXISTS update_file_metadata_advanced_timestamp ON file_metadata_advanced;
CREATE TRIGGER update_file_metadata_advanced_timestamp 
    BEFORE UPDATE ON file_metadata_advanced 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_glossary_files_timestamp ON glossary_files;
CREATE TRIGGER update_glossary_files_timestamp 
    BEFORE UPDATE ON glossary_files 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_file_shares_timestamp ON file_shares;
CREATE TRIGGER update_file_shares_timestamp 
    BEFORE UPDATE ON file_shares 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_file_processing_jobs_timestamp ON file_processing_jobs;
CREATE TRIGGER update_file_processing_jobs_timestamp 
    BEFORE UPDATE ON file_processing_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 9. Create functions for file management
CREATE OR REPLACE FUNCTION soft_delete_file_advanced(file_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE file_metadata_advanced 
    SET deleted_at = CURRENT_TIMESTAMP,
        upload_status = 'deleted'
    WHERE id = file_id AND deleted_at IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_file_storage_stats(user_id_param UUID DEFAULT NULL)
RETURNS TABLE (
    total_files BIGINT,
    total_size_bytes BIGINT,
    total_size_mb NUMERIC,
    files_by_type JSONB,
    recent_uploads BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as file_count,
            SUM(file_size) as size_bytes,
            ROUND(SUM(file_size)::NUMERIC / 1024 / 1024, 2) as size_mb
        FROM file_metadata_advanced 
        WHERE (user_id_param IS NULL OR user_id = user_id_param)
        AND deleted_at IS NULL
    ),
    types AS (
        SELECT jsonb_object_agg(file_type, type_count) as types_json
        FROM (
            SELECT file_type, COUNT(*) as type_count
            FROM file_metadata 
            WHERE (user_id_param IS NULL OR user_id = user_id_param)
            AND deleted_at IS NULL
            GROUP BY file_type
        ) type_counts
    ),
    recent AS (
        SELECT COUNT(*) as recent_count
        FROM file_metadata_advanced 
        WHERE (user_id_param IS NULL OR user_id = user_id_param)
        AND deleted_at IS NULL
        AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
    )
    SELECT 
        stats.file_count,
        stats.size_bytes,
        stats.size_mb,
        COALESCE(types.types_json, '{}'::jsonb),
        recent.recent_count
    FROM stats, types, recent;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_expired_shares()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE file_shares 
    SET is_active = FALSE,
        revoked_at = CURRENT_TIMESTAMP
    WHERE expires_at IS NOT NULL 
    AND expires_at < CURRENT_TIMESTAMP 
    AND is_active = TRUE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to generate presigned URLs record
CREATE OR REPLACE FUNCTION update_presigned_url(
    file_id UUID,
    new_url VARCHAR(3000),
    expires_in_seconds INTEGER DEFAULT 3600
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE file_metadata_advanced 
    SET presigned_url = new_url,
        presigned_expires_at = CURRENT_TIMESTAMP + INTERVAL '1 second' * expires_in_seconds,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = file_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 11. Insert some sample data for development (optional)
-- Uncomment the following block if you want test data

/*
INSERT INTO file_metadata (
    user_id, original_filename, stored_filename, file_key, file_hash,
    file_type, file_extension, file_size, upload_status, processing_status,
    bucket_name, storage_region, source_language, target_language
) VALUES (
    (SELECT id FROM users WHERE email = 'admin@translation-platform.com' LIMIT 1),
    'sample-document.pdf',
    '1693834567890-sample-document.pdf',
    'documents/1693834567890-sample-document.pdf',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'application/pdf',
    'pdf',
    1048576,
    'completed',
    'completed',
    'translation-files-bucket',
    'bj.bcebos.com',
    'en',
    'zh'
) ON CONFLICT DO NOTHING;
*/