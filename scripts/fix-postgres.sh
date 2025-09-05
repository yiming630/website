#!/bin/bash

echo "🔧 Fixing PostgreSQL connection issues..."

# Stop and remove existing containers
docker rm -f postgres mongodb 2>/dev/null || true

echo "🐘 Starting PostgreSQL with proper configuration..."
docker run --name postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=translation_platform \
  -p 5432:5432 \
  -d postgres:16-alpine

echo "⏳ Waiting for PostgreSQL to start..."
sleep 5

# Wait for PostgreSQL to be ready
until docker exec postgres pg_isready -U postgres -d translation_platform; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

echo "📋 Creating database schema..."
docker exec postgres psql -U postgres -d translation_platform -c "
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'READER',
  plan VARCHAR(50) DEFAULT 'FREE',
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  account_status VARCHAR(50) DEFAULT 'ACTIVE',
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#2563eb',
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  default_source_language VARCHAR(10) DEFAULT 'en',
  default_target_language VARCHAR(10) DEFAULT 'zh',
  default_translation_style VARCHAR(50) DEFAULT 'GENERAL',
  default_specialization VARCHAR(100),
  require_review BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'PROCESSING',
  progress INTEGER DEFAULT 0,
  source_language VARCHAR(10) NOT NULL,
  target_language VARCHAR(10) NOT NULL,
  translation_style VARCHAR(50) DEFAULT 'GENERAL',
  specialization VARCHAR(100),
  original_content TEXT,
  translated_content TEXT,
  file_url VARCHAR(500),
  file_size INTEGER,
  file_type VARCHAR(100),
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
"

echo "🍃 Starting MongoDB..."
docker run --name mongodb \
  -p 27017:27017 \
  -d mongo:7

echo "✅ Database setup complete!"
echo ""
echo "🔗 Connection strings:"
echo "PostgreSQL: postgresql://postgres:password@localhost:5432/translation_platform"
echo "MongoDB: mongodb://localhost:27017/translation_platform_dev"