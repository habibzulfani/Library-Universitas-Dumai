#!/bin/bash

# E-Repository Deployment Script for Hostinger VPS (Root Version)
# This script will set up the server and deploy the application

set -e  # Exit on any error

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

print_status "Starting E-Repository deployment on Hostinger VPS (Root Mode)..."

# Step 1: Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Step 2: Install required packages
print_status "Installing required packages..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Step 3: Install Docker
print_status "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Step 4: Start and enable Docker
print_status "Starting Docker service..."
systemctl start docker
systemctl enable docker

# Step 5: Create application directory
print_status "Creating application directory..."
mkdir -p /opt/erepository
cd /opt/erepository

# Step 6: Clone or update repository
if [ -d .git ]; then
    print_status "Repository already exists, pulling latest changes..."
    git pull
else
    print_status "Cloning repository..."
    git clone https://github.com/habibzulfani/Library-Universitas-Dumai.git .
fi
chmod +x setup.sh

# Step 6.5: Install Python 3, venv, and dependencies
print_status "Installing Python 3 and venv..."
apt install -y python3 python3-pip python3-venv
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
if [ -f requirements.txt ]; then
    pip install -r requirements.txt
fi
PYTHON_CMD="venv/bin/python"
export PYTHON_CMD

# Step 7: Create production environment
print_status "Setting up production environment..."
cp env.production.template .env

# Step 8: Generate secure passwords
print_status "Generating secure passwords..."
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
MYSQL_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')

# Update .env file with secure passwords
sed -i "s|CHANGE_THIS_TO_SECURE_PASSWORD|$MYSQL_ROOT_PASSWORD|g" .env
sed -i "s|CHANGE_THIS_TO_VERY_SECURE_JWT_SECRET_KEY|$JWT_SECRET|g" .env

# Step 9: Start services
print_status "Starting services..."
docker compose up -d

# Step 10: Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Step 10.5: Seed the database
print_status "Seeding the database with schema and sample data..."
chmod +x backend/setup_database.sh
./backend/setup_database.sh

# Step 10.6: Import biblio CSV data (Go)
print_status "Importing biblio CSV data..."
if [ -f backend/cmd/import_biblio/main.go ]; then
    (cd backend && go run cmd/import_biblio/main.go)
    print_success "CSV data import completed successfully!"
else
    print_warning "CSV import script not found. Skipping."
fi

# Step 10.7: Generate missing cover images (Python)
print_status "Generating missing cover images (placeholder covers for missing files)..."
if [ -f generate_covers.py ]; then
    $PYTHON_CMD generate_covers.py db && print_success "Cover image generation completed successfully!" || print_warning "Failed to generate missing cover images. Please check Python and dependencies."
else
    print_warning "generate_covers.py not found. Skipping cover generation."
fi

# Step 11: Check service status
print_status "Checking service status..."
docker compose ps

# Step 12: Display access information
print_success "Deployment completed successfully!"
echo ""
echo "=== ACCESS INFORMATION ==="
echo "Frontend: http://$(curl -s ifconfig.me):3000"
echo "API: http://$(curl -s ifconfig.me):8080"
echo "PDF Service: http://$(curl -s ifconfig.me):8000"
echo ""
echo "=== DATABASE CREDENTIALS ==="
echo "MySQL Root Password: $MYSQL_ROOT_PASSWORD"
echo "MySQL User Password: $MYSQL_PASSWORD"
echo ""
echo "=== IMPORTANT NOTES ==="
echo "1. Save the passwords above in a secure location"
echo "2. Configure your domain DNS to point to this server"
echo "3. Set up SSL certificates for production use"
echo "4. Configure firewall rules if needed"
echo ""
echo "=== USEFUL COMMANDS ==="
echo "View logs: docker compose logs -f"
echo "Stop services: docker compose down"
echo "Restart services: docker compose restart"
echo "Update application: git pull && docker compose up -d --build" 