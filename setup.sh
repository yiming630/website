#!/bin/bash

# Translation Platform - Development Setup Script

echo "🚀 Translation Platform - Development Setup"
echo "=========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env.dev exists
if [ ! -f "env.dev" ]; then
    echo "❌ env.dev file not found. Please create it from env.example"
    exit 1
fi

# Load environment variables
echo "📋 Loading environment variables..."
cp env.dev .env

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p app/api-gateway/logs
mkdir -p app/user-svc/logs

# Install dependencies for local development (optional)
echo "📦 Installing dependencies..."

# API Gateway
if [ -d "app/api-gateway" ]; then
    echo "  - Installing API Gateway dependencies..."
    cd app/api-gateway
    npm install
    cd ../..
fi

# User Service
if [ -d "app/user-svc" ]; then
    echo "  - Installing User Service dependencies..."
    cd app/user-svc
    npm install
    cd ../..
fi

# Frontend (if exists)
if [ -d "app/frontend" ]; then
    echo "  - Installing Frontend dependencies..."
    cd app/frontend
    npm install
    cd ../..
fi

# Build Docker images
echo "🐳 Building Docker images..."
docker-compose build

# Start services
echo "🚀 Starting services..."
docker-compose up -d db

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "🗄️  Database should be initialized automatically via init.sql"

# Start all services
echo "🚀 Starting all services..."
docker-compose up -d

# Show service status
echo ""
echo "✅ Setup complete! Services are starting..."
echo ""
echo "📊 Service URLs:"
echo "  - Frontend: http://localhost:3000"
echo "  - API Gateway (GraphQL): http://localhost:4000/graphql"
echo "  - User Service: http://localhost:4001"
echo "  - pgAdmin: http://localhost:5050 (admin@translation-platform.com / admin123)"
echo ""
echo "🔍 Useful commands:"
echo "  - View logs: docker-compose logs -f [service-name]"
echo "  - Stop services: docker-compose down"
echo "  - Rebuild services: docker-compose build"
echo "  - View running services: docker-compose ps"
echo ""
echo "📝 Default admin credentials:"
echo "  - Email: admin@translation-platform.com"
echo "  - Password: admin123"
echo ""
echo "Happy coding! 🎉"
