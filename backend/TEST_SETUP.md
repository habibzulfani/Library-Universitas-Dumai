# Test Environment Setup Guide

This guide helps you set up the MySQL-based testing environment for the E-Repository API.

## Quick Setup

### 1. Using Docker MySQL (Recommended)

The project includes a Docker MySQL setup that's already configured:

```bash
# Start the Docker services (from project root)
cd ..
docker-compose up -d mysql

# Verify MySQL is running
docker ps | grep mysql

# Run tests with Docker MySQL
cd backend
make test-auth
```

### 2. Using Local MySQL

If you prefer a local MySQL installation:

```bash
# Install MySQL (macOS)
brew install mysql
brew services start mysql

# Set root password
mysql_secure_installation

# Create test database (optional, auto-created by tests)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS e_repository_test;"
```

## Environment Configuration

### Default Configuration (Docker MySQL)

The Makefile is preconfigured for Docker MySQL:

```bash
TEST_DB_HOST=localhost
TEST_DB_PORT=3307          # Docker MySQL port
TEST_DB_USER=root
TEST_DB_PASSWORD=rootpassword  # From docker-compose.yml
TEST_DB_NAME=e_repository_test
```

### Custom Configuration

Override environment variables as needed:

```bash
# For local MySQL (port 3306)
export TEST_DB_HOST=localhost
export TEST_DB_PORT=3306
export TEST_DB_USER=root
export TEST_DB_PASSWORD=your_local_password
export TEST_DB_NAME=e_repository_test

# Run tests with custom config
make test
```

## Troubleshooting

### MySQL Connection Issues

#### 1. Docker MySQL Not Running
```bash
# Check if MySQL container is running
make docker-mysql-status

# Start MySQL container
cd .. && docker-compose up -d mysql

# Check logs if container fails to start
docker logs e-repository-mysql
```

#### 2. Connection Refused (Port Issues)
```bash
# Check which port MySQL is using
docker port e-repository-mysql

# Update TEST_DB_PORT if different
export TEST_DB_PORT=3307  # or whatever port is shown
```

#### 3. Access Denied (Authentication)
```bash
# Check docker-compose.yml for correct password
grep MYSQL_ROOT_PASSWORD ../docker-compose.yml

# Use the correct password
export TEST_DB_PASSWORD=rootpassword
```

### Disk Space Issues

#### 1. Docker Disk Full
```bash
# Clean Docker to free space
make docker-cleanup

# Or manual cleanup
docker system prune -a
docker volume prune
```

#### 2. Check Disk Usage
```bash
# Check Docker disk usage
docker system df

# Check available space
df -h
```

#### 3. Alternative Solutions
```bash
# Use smaller test database name (if needed)
export TEST_DB_NAME=test_db

# Or use a different Docker MySQL image
# Edit docker-compose.yml to use mysql:5.7 (smaller)
```

### Permission Issues

#### 1. Database Creation Permissions
```bash
# Grant permissions for test database creation
mysql -h localhost -P 3307 -u root -p -e "GRANT ALL PRIVILEGES ON *.* TO 'root'@'%';"

# Or connect to Docker MySQL directly
docker exec -it e-repository-mysql mysql -u root -p
```

#### 2. File Upload Permissions
```bash
# Ensure test-uploads directory is writable
mkdir -p test-uploads
chmod 755 test-uploads
```

## Testing Commands

### Basic Testing
```bash
# Test database connection
make docker-mysql-status

# Run authentication tests
make test-auth

# Run all tests
make test

# Run with coverage
make test-coverage
```

### Advanced Testing
```bash
# Run specific test categories
make test-books      # Books handler tests (needs recreation)
make test-papers     # Papers handler tests
make test-middleware # Middleware tests
make test-api        # Integration tests

# Clean up test artifacts
make test-cleanup
```

### Development Workflow
```bash
# 1. Start Docker MySQL
cd .. && docker-compose up -d mysql

# 2. Verify connection
cd backend && make docker-mysql-status

# 3. Run tests during development
make test-auth  # Quick authentication tests

# 4. Full test suite before commit
make test-coverage

# 5. Cleanup after testing
make test-cleanup
```

## Alternative Setup Options

### Option 1: Local MySQL (Homebrew - macOS)
```bash
# Install and start MySQL
brew install mysql
brew services start mysql

# Configure for testing
mysql -u root -p
> CREATE USER 'test_user'@'localhost' IDENTIFIED BY 'test_password';
> GRANT ALL PRIVILEGES ON *.* TO 'test_user'@'localhost';
> FLUSH PRIVILEGES;

# Set environment variables
export TEST_DB_HOST=localhost
export TEST_DB_PORT=3306
export TEST_DB_USER=test_user
export TEST_DB_PASSWORD=test_password
```

### Option 2: MySQL via Docker Run (Alternative)
```bash
# Run standalone MySQL container
docker run --name mysql-test \
  -e MYSQL_ROOT_PASSWORD=testpassword \
  -p 3306:3306 \
  -d mysql:8.0

# Configure environment
export TEST_DB_HOST=localhost
export TEST_DB_PORT=3306
export TEST_DB_USER=root
export TEST_DB_PASSWORD=testpassword
```

### Option 3: Remote MySQL
```bash
# For CI/CD or remote MySQL
export TEST_DB_HOST=your-mysql-host.com
export TEST_DB_PORT=3306
export TEST_DB_USER=your_user
export TEST_DB_PASSWORD=your_password
export TEST_DB_NAME=your_test_db
```

## Configuration Files

### Makefile Defaults
The `Makefile` includes default values that work with the Docker setup:

```makefile
TEST_DB_HOST ?= localhost
TEST_DB_PORT ?= 3307
TEST_DB_USER ?= root
TEST_DB_PASSWORD ?= rootpassword
TEST_DB_NAME ?= e_repository_test
```

### Test Configuration
The test suite (`test_config.go`) automatically:
- Creates test database if it doesn't exist
- Runs migrations
- Seeds test data
- Cleans up between tests
- Drops test database after completion

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: testpassword
          MYSQL_DATABASE: e_repository_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-go@v2
        with:
          go-version: 1.21
      - name: Run tests
        env:
          TEST_DB_HOST: 127.0.0.1
          TEST_DB_PORT: 3306
          TEST_DB_USER: root
          TEST_DB_PASSWORD: testpassword
          TEST_DB_NAME: e_repository_test
        run: make test-coverage
```

## Performance Tips

### Faster Test Execution
1. **Use SSD storage** for Docker volumes
2. **Increase MySQL memory** settings if needed
3. **Run tests in parallel** (when safe)
4. **Use connection pooling** in test configuration

### Resource Management
```bash
# Monitor Docker resource usage
docker stats

# Limit MySQL container resources if needed
docker update --memory=512m e-repository-mysql
```

## Verification Checklist

Before running tests, ensure:

- [ ] MySQL container is running (`docker ps | grep mysql`)
- [ ] Port 3307 is accessible (`telnet localhost 3307`)
- [ ] Credentials are correct (check `docker-compose.yml`)
- [ ] Sufficient disk space (`docker system df`)
- [ ] Go dependencies installed (`go mod download`)

## Common Error Solutions

| Error | Solution |
|-------|----------|
| `connection refused` | Start MySQL container |
| `access denied` | Check password in docker-compose.yml |
| `no space left` | Run `make docker-cleanup` |
| `database exists` | Normal, tests handle cleanup |
| `permission denied` | Grant database creation permissions |

---

For additional help, see the main [TEST_README.md](./TEST_README.md) or check the troubleshooting section. 