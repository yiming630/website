#!/bin/bash

# Translation Platform Development Setup Script
echo "🚀 Setting up Translation Platform Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f "env.dev" ]; then
    echo "❌ env.dev file not found. Please create it first."
    exit 1
fi

# Load environment variables
export $(cat env.dev | grep -v '^#' | xargs)

echo "📦 Building Docker images..."
docker-compose build

echo "🗄️ Starting PostgreSQL database..."
docker-compose up -d db

echo "⏳ Waiting for database to be ready..."
sleep 10

# Check database health
until docker-compose exec db pg_isready -U $POSTGRES_USER -d $POSTGRES_DB; do
    echo "⏳ Waiting for database..."
    sleep 2
done

echo "✅ Database is ready!"

echo "🔐 Starting user service..."
docker-compose up -d user-svc

echo "⏳ Waiting for user service to be ready..."
sleep 5

# Check user service health
until curl -f http://localhost:$USER_SVC_PORT/health > /dev/null 2>&1; do
    echo "⏳ Waiting for user service..."
    sleep 2
done

echo "✅ User service is ready!"

echo "🌐 Starting API gateway..."
docker-compose up -d api-gateway

echo "⏳ Waiting for API gateway to be ready..."
sleep 5

# Check API gateway health
until curl -f http://localhost:$API_GATEWAY_PORT/health > /dev/null 2>&1; do
    echo "⏳ Waiting for API gateway..."
    sleep 2
done

echo "✅ API gateway is ready!"

echo "🎨 Starting frontend..."
docker-compose up -d frontend

echo "⏳ Waiting for frontend to be ready..."
sleep 10

# Check frontend health
until curl -f http://localhost:3000 > /dev/null 2>&1; do
    echo "⏳ Waiting for frontend..."
    sleep 2
done

echo "✅ Frontend is ready!"

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔌 API Gateway: http://localhost:$API_GATEWAY_PORT"
echo "🔍 GraphQL Playground: http://localhost:$API_GATEWAY_PORT/graphql"
echo "👤 User Service: http://localhost:$USER_SVC_PORT"
echo "🗄️ Database: localhost:$POSTGRES_PORT"
echo ""
echo "📊 Health Checks:"
echo "  - Frontend: http://localhost:3000"
echo "  - API Gateway: http://localhost:$API_GATEWAY_PORT/health"
echo "  - User Service: http://localhost:$USER_SVC_PORT/health"
echo ""
echo "🔧 To view logs: docker-compose logs -f [service-name]"
echo "🛑 To stop: docker-compose down"
echo "🔄 To restart: docker-compose restart"
