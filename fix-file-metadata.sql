-- Fix file_metadata table to match backend expectations
ALTER TABLE file_metadata ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;