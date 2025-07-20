package main

import (
	"fmt"
	"os"

	"e-repository-api/configs"
	"e-repository-api/internal/database"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// SetupTestDB creates a MySQL test database for testing
func SetupTestDB() (*gorm.DB, error) {
	// Get test database configuration from environment or use defaults
	config := GetTestConfig()

	// Connect to MySQL without specifying a database first
	rootDSN := fmt.Sprintf("%s:%s@tcp(%s:%s)/?charset=utf8mb4&parseTime=True&loc=Local",
		config.Database.User,
		config.Database.Password,
		config.Database.Host,
		config.Database.Port,
	)

	rootDB, err := gorm.Open(mysql.Open(rootDSN), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MySQL root: %w", err)
	}

	// Create test database
	sqlDB, err := rootDB.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	_, err = sqlDB.Exec(fmt.Sprintf("DROP DATABASE IF EXISTS %s", config.Database.Name))
	if err != nil {
		return nil, fmt.Errorf("failed to drop test database: %w", err)
	}

	_, err = sqlDB.Exec(fmt.Sprintf("CREATE DATABASE %s", config.Database.Name))
	if err != nil {
		return nil, fmt.Errorf("failed to create test database: %w", err)
	}

	// Close root connection
	sqlDB.Close()

	// Connect to the test database
	testDSN := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		config.Database.User,
		config.Database.Password,
		config.Database.Host,
		config.Database.Port,
		config.Database.Name,
	)

	db, err := gorm.Open(mysql.Open(testDSN), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to test database: %w", err)
	}

	// Set the database connection for the database package
	database.SetDB(db)

	// Run migrations
	err = database.Migrate()
	if err != nil {
		return nil, fmt.Errorf("failed to migrate test database: %w", err)
	}

	return db, nil
}

// GetTestConfig returns a test configuration
func GetTestConfig() *configs.Config {
	return &configs.Config{
		Database: configs.DatabaseConfig{
			Host:     getTestEnv("TEST_DB_HOST", "localhost"),
			Port:     getTestEnv("TEST_DB_PORT", "3307"),
			User:     getTestEnv("TEST_DB_USER", "root"),
			Password: getTestEnv("TEST_DB_PASSWORD", "rootpassword"),
			Name:     getTestEnv("TEST_DB_NAME", "e_repository_test_api"),
		},
		JWT: configs.JWTConfig{
			Secret: "test-secret-key-for-testing-only",
		},
		Server: configs.ServerConfig{
			Port: "8080",
		},
		Upload: configs.UploadConfig{
			Path:          "./test-uploads",
			MaxUploadSize: 10485760, // 10MB in bytes
		},
	}
}

// CleanupTestDB removes the test database
func CleanupTestDB(config *configs.Config) error {
	// Connect to MySQL without specifying a database
	rootDSN := fmt.Sprintf("%s:%s@tcp(%s:%s)/?charset=utf8mb4&parseTime=True&loc=Local",
		config.Database.User,
		config.Database.Password,
		config.Database.Host,
		config.Database.Port,
	)

	rootDB, err := gorm.Open(mysql.Open(rootDSN), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return fmt.Errorf("failed to connect to MySQL root for cleanup: %w", err)
	}

	// Drop test database
	sqlDB, err := rootDB.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB for cleanup: %w", err)
	}
	defer sqlDB.Close()

	_, err = sqlDB.Exec(fmt.Sprintf("DROP DATABASE IF EXISTS %s", config.Database.Name))
	if err != nil {
		return fmt.Errorf("failed to drop test database: %w", err)
	}

	return nil
}

// SeedTestData adds sample data for testing
func SeedTestData(db *gorm.DB) error {
	// Helper functions for pointer types
	stringPtr := func(s string) *string { return &s }
	intPtr := func(i int) *int { return &i }
	uintPtr := func(i uint) *uint { return &i }

	// Generate proper password hash for "password123"
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Seed test users
	testUsers := []database.User{
		{
			Email:         "admin@demo.com",
			Name:          "Demo Admin",
			PasswordHash:  string(hashedPassword), // Properly hashed password123
			Role:          "admin",
			UserType:      "lecturer",
			NIMNIDN:       stringPtr("ADM001"),
			Faculty:       stringPtr("Fakultas Ilmu Komputer"),
			DepartmentID:  uintPtr(2), // Sistem Informasi
			EmailVerified: true,
			IsApproved:    true,
		},
		{
			Email:         "user@demo.com",
			Name:          "Demo User",
			PasswordHash:  string(hashedPassword), // Properly hashed password123
			Role:          "user",
			UserType:      "student",
			NIMNIDN:       stringPtr("STU001"),
			Faculty:       stringPtr("Fakultas Ilmu Komputer"),
			DepartmentID:  uintPtr(2), // Sistem Informasi
			EmailVerified: true,
			IsApproved:    true,
		},
	}

	for _, user := range testUsers {
		db.Create(&user)
	}

	// Seed test categories
	testCategories := []database.Category{
		{Name: "Computer Science", Description: stringPtr("CS related content"), Type: "both"},
		{Name: "Mathematics", Description: stringPtr("Math related content"), Type: "book"},
		{Name: "Research Papers", Description: stringPtr("Academic papers"), Type: "paper"},
	}

	for _, category := range testCategories {
		db.Create(&category)
	}

	// Seed test books
	testBooks := []database.Book{
		{
			Title:         "Introduction to Algorithms",
			Author:        "Thomas H. Cormen",
			Publisher:     stringPtr("MIT Press"),
			PublishedYear: intPtr(2009),
			ISBN:          stringPtr("978-0262033848"),
			Subject:       stringPtr("Computer Science"),
			Language:      stringPtr("English"),
			Pages:         stringPtr("1312"),
			Summary:       stringPtr("A comprehensive textbook covering algorithmic techniques and data structures used in computer science."),
			FileURL:       stringPtr("/uploads/books/intro_algorithms.pdf"),
			CreatedBy:     uintPtr(1), // Admin user
		},
		{
			Title:         "Clean Code",
			Author:        "Robert C. Martin",
			Publisher:     stringPtr("Prentice Hall"),
			PublishedYear: intPtr(2008),
			ISBN:          stringPtr("978-0132350884"),
			Subject:       stringPtr("Computer Science"),
			Language:      stringPtr("English"),
			Pages:         stringPtr("464"),
			Summary:       stringPtr("Best practices for writing clean, maintainable, and efficient code."),
			FileURL:       stringPtr("/uploads/books/clean_code.pdf"),
			CreatedBy:     uintPtr(1), // Admin user
		},
	}

	for _, book := range testBooks {
		db.Create(&book)
	}

	// Seed test papers
	testPapers := []database.Paper{
		{
			Title:      "Machine Learning Applications in Academic Performance Prediction",
			Author:     "John Smith",
			Advisor:    stringPtr("Dr. Ahmad Rahman"),
			University: stringPtr("Universitas Dumai"),
			Department: stringPtr("Computer Science"),
			Year:       intPtr(2023),
			Abstract:   stringPtr("This research explores the application of machine learning algorithms in predicting student academic performance."),
			Keywords:   stringPtr("machine learning, academic performance, prediction"),
			FileURL:    stringPtr("/uploads/papers/ml_academic_prediction.pdf"),
			CreatedBy:  uintPtr(1), // Admin user
		},
		{
			Title:      "Database Query Optimization",
			Author:     "Sarah Johnson",
			Advisor:    stringPtr("Dr. Ahmad Rahman"),
			University: stringPtr("Universitas Dumai"),
			Department: stringPtr("Computer Science"),
			Year:       intPtr(2023),
			Abstract:   stringPtr("An investigation into query optimization techniques for large-scale database systems."),
			Keywords:   stringPtr("database optimization, query performance, big data"),
			FileURL:    stringPtr("/uploads/papers/db_optimization.pdf"),
			CreatedBy:  uintPtr(1), // Admin user
		},
	}

	for _, paper := range testPapers {
		db.Create(&paper)
	}

	return nil
}

// getTestEnv gets environment variable with fallback for testing
func getTestEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
