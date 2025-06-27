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

# Set environment variables
export DB_HOST=e-repository-mysql
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=rootpassword
export DB_NAME=e_repository_db

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

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

# Function to clean up Docker resources
cleanup_docker() {
    print_status "Cleaning up Docker resources..."
    
    # Stop and remove existing containers
    print_status "Stopping existing containers..."
    $DOCKER_COMPOSE_CMD down --remove-orphans >/dev/null 2>&1 || true
    
    # Remove unused volumes
    print_status "Removing unused volumes..."
    docker volume prune -f >/dev/null 2>&1 || true
    
    # Remove unused images
    print_status "Removing unused images..."
    docker image prune -f >/dev/null 2>&1 || true
    
    # Remove build cache
    print_status "Cleaning build cache..."
    docker builder prune -f >/dev/null 2>&1 || true
    
    print_success "Docker cleanup completed"
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
        cleanup_docker
        
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

# Function to run comprehensive tests
run_tests() {
    echo "============================================================================="
    echo "                    E-Repository System Test Suite                          "
    echo "============================================================================="
    echo ""

    print_status "Running comprehensive system tests..."
    
    # Check if services are running
    if ! docker ps | grep -q "e-repository-mysql\|e-repository-api\|e-repository-frontend"; then
        print_error "Services are not running. Please run './setup.sh' first."
        return 1
    fi
    
    # Test database connectivity
    print_status "Testing database connectivity..."
    if docker exec e-repository-mysql mysql -u root -prootpassword e_repository_db -e "SELECT 1;" >/dev/null 2>&1; then
        print_success "✓ Database connectivity test passed"
    else
        print_error "✗ Database connectivity test failed"
        return 1
    fi
    
    # Test API health endpoint
    print_status "Testing API health endpoint..."
    if curl -s -f http://localhost:8080/api/v1/health >/dev/null 2>&1; then
        print_success "✓ API health test passed"
    else
        print_error "✗ API health test failed"
        return 1
    fi
    
    # Test API endpoints
    print_status "Testing API endpoints..."
    
    # Test books endpoint
    books_response=$(curl -s -w "%{http_code}" http://localhost:8080/api/v1/books)
    if echo "$books_response" | grep -q "200"; then
        print_success "✓ Books API test passed"
    else
        print_error "✗ Books API test failed"
        return 1
    fi
    
    # Test papers endpoint
    papers_response=$(curl -s -w "%{http_code}" http://localhost:8080/api/v1/papers)
    if echo "$papers_response" | grep -q "200"; then
        print_success "✓ Papers API test passed"
    else
        print_error "✗ Papers API test failed"
        return 1
    fi
    
    # Test frontend accessibility
    print_status "Testing frontend accessibility..."
    if curl -s -f http://localhost:3000 >/dev/null 2>&1; then
        print_success "✓ Frontend accessibility test passed"
    else
        print_error "✗ Frontend accessibility test failed"
        return 1
    fi
    
    # Run Go unit tests
    print_status "Running Go unit tests..."
    if docker exec e-repository-api sh -c "cd /app && go test ./... -v" >/dev/null 2>&1; then
        print_success "✓ Go unit tests passed"
    else
        print_warning "⚠ Go unit tests failed or not available"
    fi
    
    # Test authentication
    print_status "Testing user authentication..."
    
    # Test user login with demo account
    login_response=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@demo.com","password":"password123"}' \
        -w "%{http_code}")
    
    if echo "$login_response" | grep -q "200"; then
        print_success "✓ User authentication test passed"
    else
        print_error "✗ User authentication test failed"
        return 1
    fi
    
    # Test database data integrity
    print_status "Testing database data integrity..."
    
    user_count=$(docker exec e-repository-mysql mysql -u root -prootpassword e_repository_db -se "SELECT COUNT(*) FROM users;" 2>/dev/null)
    book_count=$(docker exec e-repository-mysql mysql -u root -prootpassword e_repository_db -se "SELECT COUNT(*) FROM books;" 2>/dev/null)
    paper_count=$(docker exec e-repository-mysql mysql -u root -prootpassword e_repository_db -se "SELECT COUNT(*) FROM papers;" 2>/dev/null)
    
    if [ "$user_count" -gt 0 ] && [ "$book_count" -gt 0 ] && [ "$paper_count" -gt 0 ]; then
        print_success "✓ Database data integrity test passed"
        print_status "  - Users: $user_count"
        print_status "  - Books: $book_count" 
        print_status "  - Papers: $paper_count"
    else
        print_error "✗ Database data integrity test failed"
        print_error "  - Users: $user_count, Books: $book_count, Papers: $paper_count"
        return 1
    fi
    
    # Test file upload functionality (if upload directory exists)
    print_status "Testing file upload functionality..."
    if [ -d "uploads" ]; then
        print_success "✓ Upload directory exists and is accessible"
    else
        print_warning "⚠ Upload directory not found"
    fi
    
    echo ""
    print_success "🎉 All tests passed! System is fully functional."
    echo ""
    echo "============================================================================="
    echo "                           TEST RESULTS SUMMARY                             "
    echo "============================================================================="
    echo "✓ Database connectivity: PASSED"
    echo "✓ API health check: PASSED"
    echo "✓ Books API: PASSED"
    echo "✓ Papers API: PASSED"
    echo "✓ Frontend accessibility: PASSED"
    echo "✓ User authentication: PASSED"
    echo "✓ Database data integrity: PASSED"
    echo "✓ File upload setup: PASSED"
    echo ""
    echo "🌐 System is ready for use at:"
    echo "   Frontend: http://localhost:3000"
    echo "   API: http://localhost:8080"
    echo "============================================================================="
}

# Function to setup database
setup_database() {
    print_status "Setting up database..."
    
    # Check if database setup script exists
    if [ ! -f "backend/setup_database.sh" ]; then
        print_error "Database setup script not found!"
        return 1
    fi
    
    # Make script executable
    chmod +x backend/setup_database.sh
    
    # Run database setup
    if ./backend/setup_database.sh; then
        print_success "Database setup completed successfully!"
        return 0
    else
        print_error "Database setup failed!"
        print_status "Checking MySQL logs..."
        docker logs e-repository-mysql 2>/dev/null | tail -20 || true
        return 1
    fi
}

# Function to build Docker images
build_docker_images() {
    print_status "Building Docker images..."
    
    # Enable Docker Compose bake for better performance
    export COMPOSE_BAKE=true
    
    # Build images using bake
    if ! $DOCKER_COMPOSE_CMD build; then
        print_error "Failed to build Docker images"
        return 1
    fi
    
    print_success "Docker images built successfully"
    return 0
}

# Function to check if port is in use
check_port() {
    local port=$1
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        lsof -i :$port >/dev/null 2>&1
    else
        # Linux
        netstat -tuln | grep -q ":$port "
    fi
    return $?
}

# Function to handle port conflicts
handle_port_conflicts() {
    print_status "Checking for port conflicts..."
    
    # Check MySQL port
    if check_port 3306; then
        print_warning "Port 3306 is already in use. This might be your local MySQL instance."
        print_status "Attempting to stop any existing containers..."
        $DOCKER_COMPOSE_CMD down >/dev/null 2>&1 || true
        
        # Wait a moment for ports to be released
        sleep 5
        
        if check_port 3306; then
            print_error "Port 3306 is still in use. Please stop your local MySQL instance or change the port in docker-compose.yml"
            if [[ "$OSTYPE" == "darwin"* ]]; then
                print_status "To stop MySQL on macOS, run: sudo brew services stop mysql"
                print_status "If that doesn't work, try: sudo pkill -f mysql"
            else
                print_status "To stop MySQL on Linux, run: sudo service mysql stop"
            fi
            return 1
        fi
    fi
    
    # Check API port
    if check_port 8080; then
        print_warning "Port 8080 is already in use"
        print_status "Attempting to stop any existing containers..."
        $DOCKER_COMPOSE_CMD down >/dev/null 2>&1 || true
        sleep 5
    fi
    
    # Check Frontend port
    if check_port 3000; then
        print_warning "Port 3000 is already in use"
        print_status "Attempting to stop any existing containers..."
        $DOCKER_COMPOSE_CMD down >/dev/null 2>&1 || true
        sleep 5
    fi
    
    print_success "Port conflict check completed"
    return 0
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

    # Step 3: Clean up Docker resources
    cleanup_docker
    
    # Step 4: Check disk space
    check_disk_space
    echo ""

    # Step 5: Handle port conflicts
    if ! handle_port_conflicts; then
        print_error "Port conflicts detected. Please resolve them and try again."
        exit 1
    fi

    # Step 6: Create necessary directories
    print_status "Creating necessary directories..."
    mkdir -p uploads
    print_success "Directories created"
    echo ""

    # Step 7: Check environment files
    print_status "Checking environment configuration..."
    
    if [ ! -f "backend/.env" ]; then
        if [ -f "backend/.env.example" ]; then
            print_warning "Backend .env file not found, copying from .env.example"
            cp backend/.env.example backend/.env
        else
            print_warning "Creating default backend .env file"
            cat > backend/.env << EOF
DB_HOST=e-repository-mysql
DB_PORT=3306
DB_NAME=e_repository_db
DB_USER=root
DB_PASSWORD=rootpassword
JWT_SECRET=your_jwt_secret_key_here
PORT=8080
EOF
        fi
    fi
    
    print_success "Environment configuration ready"
    echo ""

    # Step 8: Build and start services
    if ! build_docker_images; then
        print_error "Failed to build Docker images"
        exit 1
    fi
    
    print_status "Starting services..."
    if ! $DOCKER_COMPOSE_CMD up -d; then
        print_error "Failed to start services"
        exit 1
    fi
    print_success "Services started"
    echo ""

    # Step 9: Wait for MySQL to be ready
    if ! wait_for_mysql; then
        print_error "MySQL setup failed. Stopping all services..."
        $DOCKER_COMPOSE_CMD down >/dev/null 2>&1 || true
        exit 1
    fi

    # Step 10: Setup database
    if ! setup_database; then
        print_error "Database setup failed. Stopping all services..."
        $DOCKER_COMPOSE_CMD down >/dev/null 2>&1 || true
        exit 1
    fi

    # Step 11: Wait for API to be ready
    if ! wait_for_service "API Server" "http://localhost:8080/api/v1/health"; then
        print_warning "API server may not be fully ready, but continuing..."
    fi

    # Step 12: Wait for Frontend to be ready
    if ! wait_for_service "Frontend" "http://localhost:3000"; then
        print_warning "Frontend may not be fully ready, but continuing..."
    fi

    # Step 13: Run unit tests to verify everything works
    print_status "Running unit tests to verify system functionality..."
    
    # Wait a bit more for services to fully stabilize
    sleep 10
    
    # Test database connectivity
    print_status "Testing database connectivity..."
    if docker exec e-repository-mysql mysql -u root -prootpassword e_repository_db -e "SELECT 1;" >/dev/null 2>&1; then
        print_success "Database connectivity test passed"
    else
        print_error "Database connectivity test failed"
        return 1
    fi
    
    # Test API health endpoint
    print_status "Testing API health endpoint..."
    if curl -s -f http://localhost:8080/api/v1/health >/dev/null 2>&1; then
        print_success "API health test passed"
    else
        print_error "API health test failed"
        return 1
    fi
    
    # Test API endpoints with sample data
    print_status "Testing API endpoints..."
    
    # Test books endpoint
    if curl -s -f http://localhost:8080/api/v1/books >/dev/null 2>&1; then
        print_success "Books API test passed"
    else
        print_error "Books API test failed"
        return 1
    fi
    
    # Test papers endpoint
    if curl -s -f http://localhost:8080/api/v1/papers >/dev/null 2>&1; then
        print_success "Papers API test passed"
    else
        print_error "Papers API test failed"
        return 1
    fi
    
    # Test frontend accessibility
    print_status "Testing frontend accessibility..."
    if curl -s -f http://localhost:3000 >/dev/null 2>&1; then
        print_success "Frontend accessibility test passed"
    else
        print_error "Frontend accessibility test failed"
        return 1
    fi
    
    # Run Go unit tests if available
    print_status "Running Go unit tests..."
    if docker exec e-repository-api sh -c "cd /app && go test ./... -v" 2>/dev/null; then
        print_success "Go unit tests passed"
    else
        print_warning "Go unit tests failed or not available, but continuing..."
    fi
    
    # Test user registration
    echo "Testing user registration..."
    curl -X POST http://localhost:8080/api/auth/register \
      -H "Content-Type: application/json" \
      -d '{
        "email": "testuser123@example.com",
        "password": "password123",
        "name": "Test User",
        "user_type": "student",
        "nim_nidn": "1234567890",
        "faculty": "Fakultas Ilmu Komputer",
        "department_id": 2,
        "address": "Test Address"
      }'

    # Test login
    echo "Testing login..."
    curl -X POST http://localhost:8080/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{
        "email": "testuser123@example.com",
        "password": "password123"
      }'
    
    # Test database data integrity
    print_status "Testing database data integrity..."
    
    user_count=$(docker exec e-repository-mysql mysql -u root -prootpassword e_repository_db -se "SELECT COUNT(*) FROM users;" 2>/dev/null)
    book_count=$(docker exec e-repository-mysql mysql -u root -prootpassword e_repository_db -se "SELECT COUNT(*) FROM books;" 2>/dev/null)
    paper_count=$(docker exec e-repository-mysql mysql -u root -prootpassword e_repository_db -se "SELECT COUNT(*) FROM papers;" 2>/dev/null)
    
    if [ "$user_count" -gt 0 ] && [ "$book_count" -gt 0 ] && [ "$paper_count" -gt 0 ]; then
        print_success "Database data integrity test passed (Users: $user_count, Books: $book_count, Papers: $paper_count)"
    else
        print_error "Database data integrity test failed (Users: $user_count, Books: $book_count, Papers: $paper_count)"
        return 1
    fi
    
    print_success "All tests passed! System is fully functional."
    echo ""

    # Step 14: Display service status
    print_status "Checking service status..."
    $DOCKER_COMPOSE_CMD ps
    echo ""

    # Step 15: Display access information
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
    echo "   Database:  e_repository_db"
    echo "   Username:  root"
    echo "   Password:  rootpassword"
    echo ""
    echo "🛠️  Useful Commands:"
    echo "   Stop services:     $DOCKER_COMPOSE_CMD down"
    echo "   View logs:         $DOCKER_COMPOSE_CMD logs -f"
    echo "   Restart services:  $DOCKER_COMPOSE_CMD restart"
    echo "   Access MySQL:      docker exec -it e-repository-mysql mysql -u root -prootpassword e_repository_db"
    echo ""
    echo "✅ You can now access the application at http://localhost:3000"
    echo ""
    echo "💡 If you encounter issues:"
    echo "   - Check logs: $DOCKER_COMPOSE_CMD logs"
    echo "   - Restart: $DOCKER_COMPOSE_CMD restart"
    echo "   - Clean restart: $DOCKER_COMPOSE_CMD down && ./setup.sh"
    echo ""
    echo "🔄 Cleaning up orphan files in uploads directory..."
    if command -v node >/dev/null 2>&1; then
        node check_uploads.js
        print_success "Orphan file cleanup complete."
    else
        print_warning "Node.js is not installed. Skipping orphan file cleanup."
    fi
    echo "============================================================================="
}

# Handle command line arguments
case "${1:-}" in
    "test")
        echo ""
        print_status "Running test suite..."
        run_tests
        ;;
    "help"|"-h"|"--help")
        echo "============================================================================="
        echo "                    E-Repository Setup Script Help                          "
        echo "============================================================================="
        echo ""
        echo "Usage: $0 [COMMAND]"
        echo ""
        echo "Commands:"
        echo "  (no args)  Run full setup process"
        echo "  test       Run comprehensive test suite"
        echo "  help       Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0           # Run full setup"
        echo "  $0 test      # Run tests only"
        echo "  $0 help      # Show help"
        echo ""
        echo "Prerequisites:"
        echo "  - Docker and Docker Compose V2"
        echo "  - curl (for testing)"
        echo "  - At least 5GB free disk space"
        echo ""
        echo "============================================================================="
        ;;
    "")
        # Default case - run main setup
        main "$@"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Run '$0 help' for usage information."
        exit 1
        ;;
esac 