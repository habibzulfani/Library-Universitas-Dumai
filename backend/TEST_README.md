# E-Repository API Test Suite

This document provides comprehensive information about the test suite for the E-Repository API, including setup, configuration, and execution instructions.

## Overview

The E-Repository API test suite includes:
- **Unit Tests**: Authentication, Books, Papers handlers and middleware
- **Integration Tests**: End-to-end API testing
- **Database Tests**: Full MySQL compatibility testing
- **Coverage Reports**: Code coverage analysis

## Test Architecture

### Database Configuration
The test suite uses **MySQL** for testing to maintain compatibility with the production database. This ensures:
- Full compatibility with MySQL-specific features (enums, constraints)
- Realistic test scenarios matching production environment
- Proper foreign key constraint testing
- Real database performance characteristics

### Test Structure
```
backend/
├── test_config.go                    # Main test configuration and helpers
├── api_test.go                       # Integration tests
├── internal/handlers/
│   ├── test_helpers.go              # Shared test helper functions
│   ├── auth_test.go                 # Authentication handler tests
│   ├── books_test.go                # Books handler tests (deleted, needs recreation)
│   └── papers_test.go               # Papers handler tests
├── internal/middleware/
│   └── auth_test.go                 # Authentication middleware tests
└── Makefile                         # Test automation and commands
```

## Prerequisites

### Database Setup
1. **MySQL Server**: Ensure MySQL is running and accessible
2. **Test Database**: A separate database for testing (automatically created/destroyed)
3. **User Permissions**: MySQL user with CREATE/DROP database privileges

### Environment Variables
Configure these environment variables for testing:

```bash
export TEST_DB_HOST=localhost
export TEST_DB_PORT=3306
export TEST_DB_USER=root
export TEST_DB_PASSWORD=your_password
export TEST_DB_NAME=e_repository_test
```

### Go Dependencies
Install required testing dependencies:
```bash
go mod download
go install github.com/stretchr/testify@latest
```

## Running Tests

### Quick Start
```bash
# Run all tests
make test

# Run with coverage
make test-coverage
```

### Individual Test Categories

#### Authentication Tests
```bash
# Test user registration, login, JWT handling
make test-auth
```

#### Books Handler Tests
```bash
# Test books CRUD operations, search, pagination
make test-books
```

#### Papers Handler Tests
```bash
# Test papers CRUD operations, search, pagination
make test-papers
```

#### Middleware Tests
```bash
# Test authentication and authorization middleware
make test-middleware
```

#### Integration Tests
```bash
# Test complete API workflows
make test-api
```

### Advanced Testing Options

#### Coverage Analysis
```bash
# Generate detailed coverage report
make test-coverage
# Open coverage.html in browser to view detailed report
```

#### Verbose Testing
```bash
# Run tests with detailed output
TEST_DB_HOST=localhost TEST_DB_PORT=3306 TEST_DB_USER=root TEST_DB_PASSWORD=password TEST_DB_NAME=e_repository_test go test -v ./...
```

#### Race Condition Detection
```bash
# Run tests with race detection
TEST_DB_HOST=localhost TEST_DB_PORT=3306 TEST_DB_USER=root TEST_DB_PASSWORD=password TEST_DB_NAME=e_repository_test go test -race ./...
```

## Test Configuration

### Database Configuration
The test suite automatically:
1. **Creates** a fresh test database for each test run
2. **Migrates** all database schemas
3. **Seeds** test data before each test
4. **Cleans** all data between test methods
5. **Destroys** the test database after completion

### Test Data
Each test gets fresh, predictable data:
- **Admin User**: `admin@test.com` (password: `password123`)
- **Regular User**: `user@test.com` (password: `password123`)
- **Sample Books**: 2 test books with different subjects
- **Sample Papers**: 2 test papers from different departments
- **Categories**: Computer Science, Mathematics, Research Papers

### JWT Configuration
Tests use a dedicated JWT secret: `test-secret-key-for-testing-only`

## Test Cases Coverage

### Authentication Handler (`auth_test.go`)
- ✅ User registration with valid data
- ✅ Registration validation (email format, password length)
- ✅ Duplicate email handling
- ✅ User login with valid credentials
- ✅ Login with invalid credentials
- ✅ User not found scenarios
- ✅ Invalid JSON handling
- ✅ Missing fields validation

### Books Handler (`books_test.go`) - **Needs Recreation**
- ⚠️ Currently deleted, needs to be recreated with MySQL support
- Should test: CRUD operations, search, pagination, authorization

### Papers Handler (`papers_test.go`)
- ✅ Public paper listing with pagination
- ✅ Search functionality
- ✅ Individual paper retrieval
- ✅ Admin-only CRUD operations
- ✅ Authorization checks
- ✅ Error handling

### Authentication Middleware (`middleware/auth_test.go`)
- ✅ JWT token validation
- ✅ Missing/invalid authorization headers
- ✅ User context setting
- ✅ Admin role verification
- ✅ Optional authentication middleware

### Integration Tests (`api_test.go`)
- ✅ Health check endpoint
- ✅ Complete user registration and login workflows
- ✅ End-to-end books and papers operations
- ✅ Protected endpoint access
- ✅ Search and pagination functionality

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check MySQL service status
sudo systemctl status mysql

# Verify database credentials
mysql -h localhost -u root -p

# Check if test database exists (should be auto-created)
mysql -h localhost -u root -p -e "SHOW DATABASES LIKE 'e_repository_test';"
```

#### Permission Issues
```bash
# Grant necessary permissions to test user
mysql -h localhost -u root -p -e "GRANT ALL PRIVILEGES ON e_repository_test.* TO 'your_user'@'localhost';"
mysql -h localhost -u root -p -e "GRANT CREATE, DROP ON *.* TO 'your_user'@'localhost';"
```

#### Environment Variable Issues
```bash
# Verify environment variables are set
echo $TEST_DB_HOST $TEST_DB_PORT $TEST_DB_USER $TEST_DB_NAME

# Set variables for current session
export TEST_DB_HOST=localhost
export TEST_DB_PORT=3306
export TEST_DB_USER=root
export TEST_DB_PASSWORD=your_password
export TEST_DB_NAME=e_repository_test
```

### Test Data Cleanup
```bash
# Manual cleanup if needed
make test-cleanup

# Remove test database manually
mysql -h localhost -u root -p -e "DROP DATABASE IF EXISTS e_repository_test;"
```

## Best Practices

### Writing New Tests
1. **Use Test Suites**: Extend existing test suites or create new ones using testify/suite
2. **Database Isolation**: Each test method gets a clean database state
3. **Shared Helpers**: Use functions from `test_helpers.go` for common operations
4. **Realistic Data**: Use data that matches production patterns
5. **Error Testing**: Test both success and failure scenarios

### Test Naming Convention
```go
func (suite *TestSuite) TestMethodName_Scenario() {
    // Test implementation
}
```

Examples:
- `TestRegister_Success`
- `TestRegister_InvalidEmail`
- `TestLogin_UserNotFound`
- `TestCreateBook_Unauthorized`

### Database Testing Pattern
```go
func (suite *TestSuite) SetupTest() {
    // Clean up data before each test
    cleanupTestData(suite.db)
    // Create fresh test data
    suite.createTestData()
}
```

## CI/CD Integration

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
          MYSQL_ROOT_PASSWORD: password
          MYSQL_DATABASE: e_repository_test
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
          TEST_DB_PASSWORD: password
          TEST_DB_NAME: e_repository_test
        run: make test-coverage
```

## Performance Considerations

### Test Execution Time
- **Unit Tests**: ~2-5 seconds per test suite
- **Integration Tests**: ~10-15 seconds
- **Full Test Suite**: ~30-60 seconds (depending on MySQL performance)

### Optimization Tips
1. **Parallel Execution**: Tests within a suite run sequentially, but suites can run in parallel
2. **Database Transactions**: Use transactions for faster rollback in some scenarios
3. **Connection Pooling**: Reuse database connections within test suites
4. **Minimal Data**: Create only the minimum data needed for each test

## Security Testing

The test suite includes security-focused tests:
- **JWT Token Validation**: Ensures proper token verification
- **Authorization Checks**: Verifies role-based access control
- **Input Validation**: Tests for SQL injection prevention
- **Password Hashing**: Verifies bcrypt implementation

## Monitoring and Reporting

### Coverage Goals
- **Target Coverage**: >80% overall
- **Critical Paths**: >95% (authentication, authorization)
- **Handler Methods**: >90%
- **Middleware**: >95%

### Metrics Tracking
```bash
# Generate coverage report
make test-coverage

# View coverage by package
go tool cover -func=coverage.out
```

## Future Improvements

### Planned Enhancements
1. **Performance Tests**: Add benchmark tests for critical endpoints
2. **Load Testing**: Integration with load testing tools
3. **Contract Testing**: API contract validation
4. **Mock Services**: External service mocking for isolated testing
5. **Snapshot Testing**: Database state snapshot testing

### Test Data Management
1. **Fixtures**: Structured test data management
2. **Factories**: Dynamic test data generation
3. **Seeders**: Consistent test data seeding
4. **Builders**: Fluent test data builders

---

For questions or issues with the test suite, please check the troubleshooting section or create an issue in the project repository. 