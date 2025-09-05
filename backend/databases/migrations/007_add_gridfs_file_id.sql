-- Migration: Add GridFS file ID column to file_metadata table
-- This replaces Baidu Cloud storage with MongoDB GridFS

-- Add column only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='file_metadata' AND column_name='gridfs_file_id') THEN
        ALTER TABLE file_metadata 
        ADD COLUMN gridfs_file_id VARCHAR(24); -- MongoDB ObjectId length
    END IF;
END $$;

-- Create index on gridfs_file_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_file_metadata_gridfs_id ON file_metadata(gridfs_file_id);

-- Update existing records to have a placeholder (if any exist)
-- UPDATE file_metadata SET gridfs_file_id = 'migration_placeholder' WHERE gridfs_file_id IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN file_metadata.gridfs_file_id IS 'MongoDB GridFS ObjectId for file storage';