#!/bin/bash

# Database initialization script for Translation Platform

set -e

echo "🚀 Starting database initialization..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}"; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Check if database exists, create if not
echo "🔍 Checking if database exists..."
if ! psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -lqt | cut -d \| -f 1 | grep -qw "${DB_NAME:-translation_platform_dev}"; then
  echo "📝 Creating database ${DB_NAME:-translation_platform_dev}..."
  createdb -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" "${DB_NAME:-translation_platform_dev}"
else
  echo "✅ Database ${DB_NAME:-translation_platform_dev} already exists"
fi

# Run schema migrations
echo "🔨 Running database schema..."
psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-translation_platform_dev}" -f /app/databases/schema.sql

echo "✅ Database initialization completed!"

# Test connection from Node.js
echo "🧪 Testing database connection..."
node -e "
const { testConnection } = require('./databases/connection');
testConnection().then(success => {
  if (success) {
    console.log('✅ Database connection test successful');
    process.exit(0);
  } else {
    console.log('❌ Database connection test failed');
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ Database connection test error:', err);
  process.exit(1);
});
"
