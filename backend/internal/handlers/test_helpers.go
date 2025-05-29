package handlers

import (
	"fmt"
	"os"

	"e-repository-api/configs"
	"e-repository-api/internal/database"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// setupMySQLTestDB creates a MySQL test database for testing
func setupMySQLTestDB(config *configs.Config) (*gorm.DB, error) {
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

// cleanupTestDatabase removes the test database
func cleanupTestDatabase(config *configs.Config) error {
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

// getTestEnv gets environment variable with fallback for testing
func getTestEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getTestConfig returns a test database configuration
func getTestConfig() *configs.Config {
	return &configs.Config{
		Database: configs.DatabaseConfig{
			Host:     getTestEnv("TEST_DB_HOST", "localhost"),
			Port:     getTestEnv("TEST_DB_PORT", "3307"),
			User:     getTestEnv("TEST_DB_USER", "root"),
			Password: getTestEnv("TEST_DB_PASSWORD", "rootpassword"),
			Name:     getTestEnv("TEST_DB_NAME", "e_repository_test"),
		},
	}
}

// cleanupTestData cleans up all test data from the database
func cleanupTestData(db *gorm.DB) {
	// Clean up test data in reverse order of foreign key dependencies
	db.Exec("DELETE FROM downloads")
	db.Exec("DELETE FROM file_uploads")
	db.Exec("DELETE FROM activity_logs")
	db.Exec("DELETE FROM paper_authors")
	db.Exec("DELETE FROM book_authors")
	db.Exec("DELETE FROM paper_categories")
	db.Exec("DELETE FROM book_categories")
	db.Exec("DELETE FROM user_papers")
	db.Exec("DELETE FROM user_books")
	db.Exec("DELETE FROM papers")
	db.Exec("DELETE FROM books")
	db.Exec("DELETE FROM categories")
	db.Exec("DELETE FROM users")
	db.Exec("DELETE FROM counters")
} 