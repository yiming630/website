-- Add missing columns that the backend expects
-- This migration adds columns that were missed in previous migrations

-- Add processing_status column (backend expects this for upload operations)
ALTER TABLE file_metadata 
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(50) DEFAULT 'pending';

-- Also ensure all other expected columns exist with proper defaults
ALTER TABLE file_metadata
ADD COLUMN IF NOT EXISTS stored_filename VARCHAR(500),
ADD COLUMN IF NOT EXISTS file_key VARCHAR(1000),
ADD COLUMN IF NOT EXISTS file_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS file_extension VARCHAR(10);

-- Update existing rows with default values if columns were just added
UPDATE file_metadata 
SET processing_status = 'completed' 
WHERE processing_status IS NULL AND upload_status = 'completed';

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
    WHEN original_filename LIKE '%.png' THEN 'png'
    WHEN original_filename LIKE '%.jpg' THEN 'jpg'
    WHEN original_filename LIKE '%.jpeg' THEN 'jpeg'
    ELSE 'txt'
  END
WHERE file_extension IS NULL;
