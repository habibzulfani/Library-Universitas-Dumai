# Go E-Repository API Makefile
.PHONY: help build run test test-unit test-integration test-coverage test-cleanup clean deps fmt lint vet security audit

# Default target
help: ## Show this help message
	@echo 'Usage: make <target>'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Build targets
build: ## Build the application
	go build -o bin/e-repository-api .

run: ## Run the application
	go run .

# Dependency management
deps: ## Download and install dependencies
	go mod download
	go mod tidy

# Code quality
fmt: ## Format Go code
	go fmt ./...

lint: ## Run golint
	golint ./...

vet: ## Run go vet
	go vet ./...

security: ## Run gosec security scanner
	gosec ./...

audit: ## Run security audit on dependencies
	go list -json -m all | nancy sleuth

# Testing targets
test: test-unit test-integration ## Run all tests

test-unit: ## Run unit tests
	@echo "Running unit tests..."
	TEST_DB_HOST=${TEST_DB_HOST} \
	TEST_DB_PORT=${TEST_DB_PORT} \
	TEST_DB_USER=${TEST_DB_USER} \
	TEST_DB_PASSWORD=${TEST_DB_PASSWORD} \
	TEST_DB_NAME=${TEST_DB_NAME} \
	go test -v -race -short ./internal/handlers/... ./internal/middleware/...

test-integration: ## Run integration tests
	@echo "Running integration tests..."
	TEST_DB_HOST=${TEST_DB_HOST} \
	TEST_DB_PORT=${TEST_DB_PORT} \
	TEST_DB_USER=${TEST_DB_USER} \
	TEST_DB_PASSWORD=${TEST_DB_PASSWORD} \
	TEST_DB_NAME=${TEST_DB_NAME} \
	go test -v -race ./...

test-coverage: ## Run tests with coverage
	@echo "Running tests with coverage..."
	TEST_DB_HOST=${TEST_DB_HOST} \
	TEST_DB_PORT=${TEST_DB_PORT} \
	TEST_DB_USER=${TEST_DB_USER} \
	TEST_DB_PASSWORD=${TEST_DB_PASSWORD} \
	TEST_DB_NAME=${TEST_DB_NAME} \
	go test -v -race -coverprofile=coverage.out -covermode=atomic ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

test-auth: ## Run only authentication tests
	@echo "Running authentication tests..."
	TEST_DB_HOST=${TEST_DB_HOST} \
	TEST_DB_PORT=${TEST_DB_PORT} \
	TEST_DB_USER=${TEST_DB_USER} \
	TEST_DB_PASSWORD=${TEST_DB_PASSWORD} \
	TEST_DB_NAME=${TEST_DB_NAME} \
	go test -v -race ./internal/handlers/ -run TestAuthTestSuite

test-books: ## Run only book handler tests
	@echo "Running book handler tests..."
	TEST_DB_HOST=${TEST_DB_HOST} \
	TEST_DB_PORT=${TEST_DB_PORT} \
	TEST_DB_USER=${TEST_DB_USER} \
	TEST_DB_PASSWORD=${TEST_DB_PASSWORD} \
	TEST_DB_NAME=${TEST_DB_NAME} \
	go test -v -race ./internal/handlers/ -run TestBooksTestSuite

test-papers: ## Run only paper handler tests
	@echo "Running paper handler tests..."
	TEST_DB_HOST=${TEST_DB_HOST} \
	TEST_DB_PORT=${TEST_DB_PORT} \
	TEST_DB_USER=${TEST_DB_USER} \
	TEST_DB_PASSWORD=${TEST_DB_PASSWORD} \
	TEST_DB_NAME=${TEST_DB_NAME} \
	go test -v -race ./internal/handlers/ -run TestPapersTestSuite

test-middleware: ## Run only middleware tests
	@echo "Running middleware tests..."
	TEST_DB_HOST=${TEST_DB_HOST} \
	TEST_DB_PORT=${TEST_DB_PORT} \
	TEST_DB_USER=${TEST_DB_USER} \
	TEST_DB_PASSWORD=${TEST_DB_PASSWORD} \
	TEST_DB_NAME=${TEST_DB_NAME} \
	go test -v -race ./internal/middleware/ -run TestAuthMiddlewareTestSuite

test-api: ## Run only API integration tests
	@echo "Running API integration tests..."
	TEST_DB_HOST=${TEST_DB_HOST} \
	TEST_DB_PORT=${TEST_DB_PORT} \
	TEST_DB_USER=${TEST_DB_USER} \
	TEST_DB_PASSWORD=${TEST_DB_PASSWORD} \
	TEST_DB_NAME=${TEST_DB_NAME} \
	go test -v -race ./ -run TestAPIIntegrationTestSuite

test-cleanup: ## Clean up test databases and files
	@echo "Cleaning up test artifacts..."
	rm -f coverage.out coverage.html
	rm -rf test-uploads/
	mysql -h${TEST_DB_HOST} -P${TEST_DB_PORT} -u${TEST_DB_USER} -p${TEST_DB_PASSWORD} -e "DROP DATABASE IF EXISTS ${TEST_DB_NAME};" 2>/dev/null || true

# Docker targets
docker-build: ## Build Docker image
	docker build -t e-repository-api .

docker-run: ## Run Docker container
	docker run -p 8080:8080 e-repository-api

docker-test: ## Run tests in Docker
	docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Development targets
dev-setup: deps ## Setup development environment
	@echo "Setting up development environment..."
	go install golang.org/x/tools/cmd/goimports@latest
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install github.com/securecodewarrior/go-gosec@latest

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	rm -rf bin/
	rm -f coverage.out coverage.html
	rm -rf test-uploads/
	go clean -testcache

# Environment variables for testing (override these)
TEST_DB_HOST ?= localhost
TEST_DB_PORT ?= 3307
TEST_DB_USER ?= root
TEST_DB_PASSWORD ?= rootpassword
TEST_DB_NAME ?= e_repository_test

# Docker MySQL status check
docker-mysql-status: ## Check Docker MySQL container status
	@echo "Checking Docker MySQL status..."
	@docker ps | grep mysql || echo "MySQL container not running"
	@echo "MySQL is available on port 3307 (if running)"

# Docker cleanup for space issues
docker-cleanup: ## Clean Docker to free up space
	@echo "Cleaning Docker to free up disk space..."
	docker system prune -f
	docker volume prune -f
	@echo "Docker cleanup completed" 