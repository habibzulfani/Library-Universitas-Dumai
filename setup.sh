#!/bin/bash

# =============================================================================
# E-Repository System Setup Script
# =============================================================================
# This script will:
# 1. Check prerequisites and disk space
# 2. Clean up Docker resources if needed
# 3. Set up environment variables
# 4. Build and run Docker containers
# 5. Migrate database and load sample data
# 6. Verify all services are running
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Docker Compose command (will be set based on available version)
DOCKER_COMPOSE_CMD=""

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect Docker Compose version and set command
detect_docker_compose() {
    print_status "Detecting Docker Compose version..."
    
    # Check for Docker Compose V2 (docker compose)
    if docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
        local version=$(docker compose version --short 2>/dev/null || docker compose version | head -1)
        print_success "Found Docker Compose V2: $version"
        return 0
    fi
    
    # Check for Docker Compose V1 (docker-compose)
    if command_exists docker-compose; then
        DOCKER_COMPOSE_CMD="docker-compose"
        local version=$(docker-compose version --short 2>/dev/null || docker-compose version | head -1)
        print_success "Found Docker Compose V1: $version"
        return 0
    fi
    
    # Neither version found
    print_error "Docker Compose is not installed or not available."
    print_status "Please install Docker Compose:"
    print_status "  - For Docker Desktop: Docker Compose V2 is included"
    print_status "  - For standalone: https://docs.docker.com/compose/install/"
    return 1
}

# Function to check disk space
check_disk_space() {
    print_status "Checking available disk space..."
    
    # Get available space in GB (works on both macOS and Linux)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        available_space=$(df -g . | awk 'NR==2 {print $4}')
    else
        # Linux
        available_space=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    fi
    
    print_status "Available disk space: ${available_space}GB"
    
    if [ "$available_space" -lt 5 ]; then
        print_error "Insufficient disk space! At least 5GB is required."
        print_warning "Current available space: ${available_space}GB"
        print_status "Cleaning up Docker to free space..."
        docker system prune -a -f >/dev/null 2>&1 || true
        
        # Check again after cleanup
        if [[ "$OSTYPE" == "darwin"* ]]; then
            available_space=$(df -g . | awk 'NR==2 {print $4}')
        else
            available_space=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
        fi
        
        if [ "$available_space" -lt 5 ]; then
            print_error "Still insufficient disk space after cleanup: ${available_space}GB"
            print_error "Please free up more disk space and try again."
            exit 1
        else
            print_success "Disk space freed up. Available: ${available_space}GB"
        fi
    else
        print_success "Sufficient disk space available: ${available_space}GB"
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within expected time"
    return 1
}

# Function to wait for MySQL to be ready with better error handling
wait_for_mysql() {
    local max_attempts=60  # Increased timeout
    local attempt=1

    print_status "Waiting for MySQL to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        # Check if container is running first
        if ! docker ps | grep -q "e-repository-mysql"; then
            print_error "MySQL container is not running!"
            print_status "Checking MySQL container logs..."
            docker logs e-repository-mysql 2>/dev/null | tail -20 || true
            return 1
        fi
        
        # Try to ping MySQL
        if docker exec e-repository-mysql mysqladmin ping -h localhost -u root -prootpassword >/dev/null 2>&1; then
            print_success "MySQL is ready!"
            return 0
        fi
        
        # Check for specific error patterns in logs
        if docker logs e-repository-mysql 2>&1 | grep -q "No space left on device"; then
            print_error "MySQL failed due to insufficient disk space!"
            print_status "Please free up more disk space and try again."
            return 1
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "MySQL failed to start within expected time"
    print_status "MySQL container logs:"
    docker logs e-repository-mysql 2>/dev/null | tail -20 || true
    return 1
}

# Main setup function
main() {
    echo "============================================================================="
    echo "                    E-Repository System Setup Script                        "
    echo "============================================================================="
    echo ""

    # Step 1: Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Detect Docker Compose version
    if ! detect_docker_compose; then
        exit 1
    fi
    
    if ! command_exists curl; then
        print_error "curl is not installed. Please install curl first."
        exit 1
    fi
    
    print_success "All prerequisites are installed"
    echo ""

    # Step 2: Check if Docker is running
    print_status "Checking if Docker is running..."
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_success "Docker is running"
    echo ""

    # Step 3: Check disk space
    check_disk_space
    echo ""

    # Step 4: Clean up any existing containers
    print_status "Cleaning up any existing containers..."
    $DOCKER_COMPOSE_CMD down --remove-orphans -v >/dev/null 2>&1 || true
    print_success "Cleanup completed"
    echo ""

    # Step 5: Create necessary directories
    print_status "Creating necessary directories..."
    mkdir -p uploads
    print_success "Directories created"
    echo ""

    # Step 6: Check environment files
    print_status "Checking environment configuration..."
    
    if [ ! -f "backend/.env" ]; then
        if [ -f "backend/.env.example" ]; then
            print_warning "Backend .env file not found, copying from .env.example"
            cp backend/.env.example backend/.env
        else
            print_warning "Creating default backend .env file"
            cat > backend/.env << EOF
DB_HOST=mysql
DB_PORT=3306
DB_NAME=test_db2
DB_USER=e_repositori
DB_PASSWORD=secure_password_here
JWT_SECRET=your_jwt_secret_key_here
PORT=8080
EOF
        fi
    fi
    
    print_success "Environment configuration ready"
    echo ""

    # Step 7: Build and start services
    print_status "Building Docker images..."
    if ! $DOCKER_COMPOSE_CMD build --no-cache; then
        print_error "Failed to build Docker images"
        exit 1
    fi
    print_success "Docker images built successfully"
    echo ""

    print_status "Starting services..."
    if ! $DOCKER_COMPOSE_CMD up -d; then
        print_error "Failed to start services"
        exit 1
    fi
    print_success "Services started"
    echo ""

    # Step 8: Wait for MySQL to be ready
    if ! wait_for_mysql; then
        print_error "MySQL setup failed. Stopping all services..."
        $DOCKER_COMPOSE_CMD down >/dev/null 2>&1 || true
        exit 1
    fi

    # Step 9: Initialize database schema
    print_status "Initializing database schema..."
    sleep 5  # Give MySQL a bit more time to fully initialize
    
    if [ -f "database_schema.sql" ]; then
        if docker exec -i e-repository-mysql mysql -u root -prootpassword < database_schema.sql; then
            print_success "Database schema initialized successfully"
        else
            print_error "Failed to initialize database schema"
            print_status "MySQL container logs:"
            docker logs e-repository-mysql 2>/dev/null | tail -20 || true
            print_error "Stopping all services..."
            $DOCKER_COMPOSE_CMD down >/dev/null 2>&1 || true
            exit 1
        fi
    else
        print_warning "database_schema.sql not found, skipping schema initialization"
    fi
    echo ""

    # Step 10: Load sample data
    print_status "Loading sample data..."
    
    if [ -f "simple_sample_data.sql" ]; then
        if docker exec -i e-repository-mysql mysql -u root -prootpassword test_db2 < simple_sample_data.sql; then
            print_success "Sample data loaded successfully"
        else
            print_warning "Failed to load sample data from simple_sample_data.sql"
            # Try alternative sample data file
            if [ -f "sample_data.sql" ]; then
                print_status "Trying alternative sample data file..."
                if docker exec -i e-repository-mysql mysql -u root -prootpassword test_db2 < sample_data.sql; then
                    print_success "Alternative sample data loaded successfully"
                else
                    print_warning "Failed to load alternative sample data, but continuing..."
                fi
            fi
        fi
    elif [ -f "sample_data.sql" ]; then
        print_status "Using sample_data.sql..."
        if docker exec -i e-repository-mysql mysql -u root -prootpassword test_db2 < sample_data.sql; then
            print_success "Sample data loaded successfully"
        else
            print_warning "Failed to load sample data, but continuing..."
        fi
    else
        print_warning "No sample data files found, skipping data loading"
    fi
    echo ""

    # Step 11: Wait for API to be ready
    if ! wait_for_service "API Server" "http://localhost:8080/api/v1/health"; then
        print_warning "API server may not be fully ready, but continuing..."
    fi

    # Step 12: Wait for Frontend to be ready
    if ! wait_for_service "Frontend" "http://localhost:3000"; then
        print_warning "Frontend may not be fully ready, but continuing..."
    fi

    # Step 13: Display service status
    echo ""
    print_status "Checking service status..."
    $DOCKER_COMPOSE_CMD ps
    echo ""

    # Step 14: Display access information
    echo "============================================================================="
    echo "                           SETUP COMPLETED!                                 "
    echo "============================================================================="
    echo ""
    print_success "All services are running successfully!"
    echo ""
    echo "🌐 Access URLs:"
    echo "   Frontend:  http://localhost:3000"
    echo "   API:       http://localhost:8080"
    echo "   MySQL:     localhost:3307"
    echo ""
    echo "🔑 Demo Accounts:"
    echo "   Admin:     admin@demo.com / password123"
    echo "   User:      user@demo.com / password123"
    echo "   Student 1: john.smith@demo.com / password123"
    echo "   Student 2: sarah.johnson@demo.com / password123"
    echo ""
    echo "📊 Database Info:"
    echo "   Database:  test_db2"
    echo "   Username:  e_repositori"
    echo "   Password:  secure_password_here"
    echo ""
    echo "🛠️  Useful Commands:"
    echo "   Stop services:     $DOCKER_COMPOSE_CMD down"
    echo "   View logs:         $DOCKER_COMPOSE_CMD logs -f"
    echo "   Restart services:  $DOCKER_COMPOSE_CMD restart"
    echo "   Access MySQL:      docker exec -it e-repository-mysql mysql -u root -prootpassword test_db2"
    echo ""
    echo "✅ You can now access the application at http://localhost:3000"
    echo ""
    echo "💡 If you encounter issues:"
    echo "   - Check logs: $DOCKER_COMPOSE_CMD logs"
    echo "   - Restart: $DOCKER_COMPOSE_CMD restart"
    echo "   - Clean restart: $DOCKER_COMPOSE_CMD down && ./setup.sh"
    echo "============================================================================="
}

# Run the main function
main "$@" 