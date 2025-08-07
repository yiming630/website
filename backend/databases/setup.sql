-- Database setup script for Translation Platform
-- Run this before running schema.sql

-- Create database (run as superuser)
-- CREATE DATABASE translation_platform_dev;
-- CREATE DATABASE translation_platform_test;
-- CREATE DATABASE translation_platform_prod;

-- Create application user
-- CREATE USER translation_app WITH PASSWORD 'your_secure_password';

-- Grant privileges
-- GRANT ALL PRIVILEGES ON DATABASE translation_platform_dev TO translation_app;
-- GRANT ALL PRIVILEGES ON DATABASE translation_platform_test TO translation_app;
-- GRANT ALL PRIVILEGES ON DATABASE translation_platform_prod TO translation_app;

-- Connect to the specific database and run the following:
-- GRANT ALL ON SCHEMA public TO translation_app;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO translation_app;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO translation_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO translation_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO translation_app;