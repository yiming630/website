#!/bin/bash

# Development Setup Script for Translation Platform Backend
# This script sets up the development environment with all necessary services

set -e

echo "🚀 Setting up Translation Platform Development Environment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    print_status "Checking Docker installation..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    print_status "Checking Docker Compose..."
    if ! docker-compose --version > /dev/null 2>&1; then
        print_error "Docker Compose is not available. Please install Docker Compose and try again."
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p services/api-gateway/logs
    mkdir -p services/document-service/logs
    mkdir -p services/file-processing-service/logs
    mkdir -p services/collaboration-service/logs
    mkdir -p services/notification-service/logs
    
    print_success "Directories created"
}

# Copy environment file if it doesn't exist
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        cp env.example .env
        print_success "Environment file created from template"
        print_warning "Please review and update .env file with your specific configuration"
    else
        print_success "Environment file already exists"
    fi
}

# Build and start services
start_services() {
    print_status "Building and starting services..."
    
    # Start core services (production profile)
    docker-compose up -d postgres redis api-gateway document-service file-processing-service collaboration-service notification-service
    
    print_success "Core services started"
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_service_health
}

# Start development tools
start_dev_tools() {
    print_status "Starting development tools..."
    
    # Start development profile services
    docker-compose --profile development up -d pgadmin redis-commander mailhog
    
    print_success "Development tools started"
}

# Check service health
check_service_health() {
    print_status "Checking service health..."
    
    services=("postgres" "redis" "api-gateway" "document-service" "file-processing-service" "collaboration-service" "notification-service")
    
    for service in "${services[@]}"; do
        if docker-compose ps $service | grep -q "Up"; then
            print_success "$service is running"
        else
            print_error "$service is not running"
        fi
    done
}

# Display service URLs
display_urls() {
    echo ""
    print_success "🎉 Development environment is ready!"
    echo ""
    echo "📋 Service URLs:"
    echo "  • API Gateway (GraphQL): http://localhost:4000"
    echo "  • GraphQL Playground: http://localhost:4000/graphql"
    echo "  • WebSocket: ws://localhost:4001"
    echo "  • Document Service: http://localhost:8000"
    echo "  • File Processing: http://localhost:8001"
    echo "  • Collaboration Service: http://localhost:8002"
    echo "  • Notification Service: http://localhost:8003"
    echo ""
    echo "🛠️  Development Tools:"
    echo "  • pgAdmin (Database): http://localhost:5050"
    echo "    - Email: admin@translation-platform.com"
    echo "    - Password: admin123"
    echo "  • Redis Commander: http://localhost:8081"
    echo "  • Mailhog (Email Testing): http://localhost:8025"
    echo ""
    echo "📊 Database:"
    echo "  • PostgreSQL: localhost:5432"
    echo "  • Redis: localhost:6379"
    echo ""
    print_warning "Remember to update your .env file with your specific configuration!"
}

# Main execution
main() {
    echo "=========================================="
    echo "Translation Platform Development Setup"
    echo "=========================================="
    echo ""
    
    check_docker
    check_docker_compose
    create_directories
    setup_environment
    start_services
    start_dev_tools
    display_urls
}

# Run main function
main "$@"

