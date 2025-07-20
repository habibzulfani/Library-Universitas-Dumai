#!/bin/bash

# Database configuration (use env vars if set, otherwise defaults)
DB_NAME="${DB_NAME:-e_repository_db}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-rootpassword}"
DB_HOST="${DB_HOST:-e-repository-mysql}"
DB_PORT="${DB_PORT:-3306}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SCHEMA_FILE="$SCRIPT_DIR/../database_schema.sql"
SAMPLE_DATA_FILE="$SCRIPT_DIR/../sample_data.sql"

echo "Starting database setup..."

# Check if MySQL container is running
if ! docker ps | grep -q "e-repository-mysql"; then
    echo -e "${RED}MySQL container is not running!${NC}"
    echo -e "${YELLOW}Please start the container first using 'docker-compose up -d mysql'${NC}"
    exit 1
fi

# Check if MySQL is ready
echo "Waiting for MySQL to be ready..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if docker exec e-repository-mysql mysqladmin ping -h localhost -u root -prootpassword >/dev/null 2>&1; then
        echo -e "${GREEN}MySQL is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo -e "${RED}MySQL failed to start within expected time${NC}"
    echo -e "${YELLOW}Checking MySQL logs...${NC}"
    docker logs e-repository-mysql 2>/dev/null | tail -20
    exit 1
fi

# Check if schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}Schema file not found at: $SCHEMA_FILE${NC}"
    exit 1
fi

# Check if sample data file exists
if [ ! -f "$SAMPLE_DATA_FILE" ]; then
    echo -e "${RED}Sample data file not found at: $SAMPLE_DATA_FILE${NC}"
    exit 1
fi

# Drop existing database if it exists
echo "Dropping existing database if it exists..."
if ! docker exec e-repository-mysql mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD -e "DROP DATABASE IF EXISTS $DB_NAME;" >/dev/null 2>&1; then
    echo -e "${RED}Failed to drop database${NC}"
    exit 1
fi

# Create new database
echo "Creating new database..."
if ! docker exec e-repository-mysql mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD -e "CREATE DATABASE $DB_NAME;" >/dev/null 2>&1; then
    echo -e "${RED}Failed to create database${NC}"
    exit 1
fi

# Create schema
echo "Creating schema..."
if ! docker exec -i e-repository-mysql mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME < "$SCHEMA_FILE"; then
    echo -e "${RED}Failed to create schema${NC}"
    exit 1
fi

# Load sample data
echo "Loading sample data..."
if ! docker exec -i e-repository-mysql mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME < "$SAMPLE_DATA_FILE"; then
    echo -e "${RED}Failed to load sample data${NC}"
    exit 1
fi

# Verify the setup
echo "Verifying database setup..."
if docker exec e-repository-mysql mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW TABLES;" >/dev/null 2>&1; then
    echo -e "${GREEN}Database setup completed successfully!${NC}"
    echo "Database name: $DB_NAME"
    echo "Database user: $DB_USER"
    echo "Database host: $DB_HOST"
    echo "Database port: $DB_PORT"
else
    echo -e "${RED}Database verification failed${NC}"
    exit 1
fi 