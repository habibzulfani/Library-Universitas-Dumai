#!/bin/bash

# E-Repository Deployment Script for Hostinger VPS
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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user."
   exit 1
fi

print_status "Starting E-Repository deployment on Hostinger VPS..."

# Step 1: Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_success "System updated successfully"

# Step 2: Install required packages
print_status "Installing required packages..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
print_success "Required packages installed"

# Step 3: Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    print_success "Docker installed successfully"
else
    print_warning "Docker is already installed"
fi

# Step 4: Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed successfully"
else
    print_warning "Docker Compose is already installed"
fi

# Step 5: Install Nginx
print_status "Installing Nginx..."
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
print_success "Nginx installed and started"

# Step 6: Install Certbot for SSL
print_status "Installing Certbot for SSL certificates..."
sudo apt install -y certbot python3-certbot-nginx
print_success "Certbot installed"

# Step 7: Create application directory
print_status "Setting up application directory..."
sudo mkdir -p /var/www/e-repository
sudo chown $USER:$USER /var/www/e-repository
cd /var/www/e-repository

# Step 8: Clone repository (if not already present)
if [ ! -d ".git" ]; then
    print_status "Cloning repository..."
    # Replace with your actual repository URL
    git clone https://github.com/habibzulfani/e-repository.git .
    print_success "Repository cloned"
else
    print_warning "Repository already exists, pulling latest changes..."
    git pull
fi

# Step 8.5: Install Python 3, venv, and dependencies
print_status "Installing Python 3 and venv..."
sudo apt install -y python3 python3-pip python3-venv
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
if [ -f requirements.txt ]; then
    pip install -r requirements.txt
fi
PYTHON_CMD="venv/bin/python"
export PYTHON_CMD

# Step 9: Create production environment
print_status "Setting up production environment..."
if [ ! -f ".env" ]; then
    cp env.production .env
    print_warning "Please edit .env file with your production settings"
    print_warning "Run: nano .env"
else
    print_warning ".env file already exists"
fi

# Step 9.5: Generate secure passwords and update .env
print_status "Generating secure passwords..."
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
MYSQL_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')

sed -i "s|REPLACE_WITH_STRONG_ROOT_PASSWORD|$MYSQL_ROOT_PASSWORD|g" .env
sed -i "s|REPLACE_WITH_STRONG_DB_PASSWORD|$MYSQL_PASSWORD|g" .env
sed -i "s|REPLACE_WITH_VERY_SECURE_JWT_SECRET|$JWT_SECRET|g" .env

# Optionally print the generated secrets for backup
print_success "MySQL Root Password: $MYSQL_ROOT_PASSWORD"
print_success "MySQL User Password: $MYSQL_PASSWORD"
print_success "JWT Secret: $JWT_SECRET"

# Step 10: Create Nginx configuration
print_status "Setting up Nginx configuration..."
sudo tee /etc/nginx/sites-available/e-repository > /dev/null <<EOF
server {
    listen 80;
    server_name _;  # Will match any domain/IP

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # PDF Service
    location /pdf {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Uploads
    location /uploads {
        alias /var/www/e-repository/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/e-repository /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t
sudo systemctl reload nginx
print_success "Nginx configuration created"

# Step 11: Setup firewall
print_status "Setting up firewall..."
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw --force enable
print_success "Firewall configured"

# Step 12: Build and start application
print_status "Building and starting application..."
docker compose --env-file .env up -d --build
# After bringing up Docker Compose services, install Python dependencies in util-python
print_status "Installing Python dependencies in util-python container..."
docker compose run --rm util-python pip install -r requirements.txt
print_success "Application started"

# Step 12.2: Install Go (Golang)
print_status "Installing Go (Golang)..."
sudo apt install -y golang
print_success "Go installed"

# Step 12.5: Import biblio CSV data (Go)
print_status "Importing biblio CSV data..."
if [ -f backend/cmd/import_biblio/main.go ]; then
    (cd backend && go run cmd/import_biblio/main.go)
    print_success "CSV data import completed successfully!"
else
    print_warning "CSV import script not found. Skipping."
fi

# Step 12.6: Generate missing cover images (Python)
print_status "Generating missing cover images (placeholder covers for missing files)..."
if [ -f generate_covers.py ]; then
    $PYTHON_CMD generate_covers.py db && print_success "Cover image generation completed successfully!" || print_warning "Failed to generate missing cover images. Please check Python and dependencies."
else
    print_warning "generate_covers.py not found. Skipping cover generation."
fi

# Step 13: Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Step 14: Check service status
print_status "Checking service status..."
docker compose ps

# Step 15: Test application
print_status "Testing application..."
if curl -s -f http://localhost:3000 > /dev/null; then
    print_success "Frontend is accessible"
else
    print_warning "Frontend may not be ready yet"
fi

if curl -s -f http://localhost:8080/api/v1/health > /dev/null; then
    print_success "API is accessible"
else
    print_warning "API may not be ready yet"
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)
print_success "Deployment completed!"
echo ""
echo "============================================================================="
echo "                           DEPLOYMENT COMPLETED!                             "
echo "============================================================================="
echo ""
echo "🌐 Access your application at:"
echo "   Frontend:  http://$SERVER_IP"
echo "   API:       http://$SERVER_IP/api"
echo ""
echo "🔧 Next steps:"
echo "   1. Edit .env file: nano .env"
echo "   2. Update passwords and secrets"
echo "   3. Set up SSL certificate when domain is ready"
echo "   4. Configure domain in Nginx"
echo ""
echo "📋 Useful commands:"
echo "   View logs:     docker compose logs -f"
echo "   Restart:       docker compose restart"
echo "   Stop:          docker compose down"
echo "   Update:        git pull && docker compose up -d --build"
echo ""
echo "🔒 Security checklist:"
echo "   - [ ] Change default passwords in .env"
echo "   - [ ] Set up SSL certificate"
echo "   - [ ] Configure domain"
echo "   - [ ] Set up regular backups"
echo ""
echo "=============================================================================" 