-- Migration: Create file_metadata table
-- Date: 2024-12-05
-- Description: Creates the file_metadata table for storing document upload information

-- Create file_metadata table
CREATE TABLE IF NOT EXISTS file_metadata (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  project_id VARCHAR(255),
  gridfs_file_id VARCHAR(255) NOT NULL,
  original_filename VARCHAR(500) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  file_hash VARCHAR(255),
  source_language VARCHAR(10),
  target_language VARCHAR(10),
  translation_style VARCHAR(50),
  specialization VARCHAR(100),
  visibility VARCHAR(50) DEFAULT 'private',
  upload_status VARCHAR(50) DEFAULT 'completed',
  translation_status VARCHAR(50) DEFAULT 'pending',
  translation_progress INTEGER DEFAULT 0,
  translated_file_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB,
  UNIQUE(file_hash)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_file_metadata_user_id ON file_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_project_id ON file_metadata(project_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_file_hash ON file_metadata(file_hash);
CREATE INDEX IF NOT EXISTS idx_file_metadata_created_at ON file_metadata(created_at);
CREATE INDEX IF NOT EXISTS idx_file_metadata_translation_status ON file_metadata(translation_status);

-- Add comments for documentation
COMMENT ON TABLE file_metadata IS 'Stores metadata for uploaded files and their translation status';
COMMENT ON COLUMN file_metadata.gridfs_file_id IS 'Reference to GridFS file ID in MongoDB';
COMMENT ON COLUMN file_metadata.file_hash IS 'SHA-256 hash of file content for deduplication';
COMMENT ON COLUMN file_metadata.translation_status IS 'Status: pending, processing, completed, failed';
COMMENT ON COLUMN file_metadata.metadata IS 'Additional JSON metadata for extensibility';
