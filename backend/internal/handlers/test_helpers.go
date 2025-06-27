package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"e-repository-api/configs"
	"e-repository-api/internal/database"
	"e-repository-api/internal/models"
	"e-repository-api/internal/utils"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
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
			Port:     getTestEnv("TEST_DB_PORT", "3306"),
			User:     getTestEnv("TEST_DB_USER", "root"),
			Password: getTestEnv("TEST_DB_PASSWORD", "rootpassword"),
			Name:     getTestEnv("TEST_DB_NAME", "e_repository_db_test"),
		},
		JWT: configs.JWTConfig{
			Secret: "test-secret-key-for-testing-only",
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

// SeedTestData adds sample data for testing
func SeedTestData(db *gorm.DB) error {
	// Generate password hash for test users
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to generate password hash: %w", err)
	}

	// Create test departments
	testDepartments := []models.Department{
		{
			Name:    "Sistem Informasi",
			Faculty: "Fakultas Ilmu Komputer",
		},
		{
			Name:    "Teknik Informatika",
			Faculty: "Fakultas Ilmu Komputer",
		},
	}

	for _, dept := range testDepartments {
		if err := db.Create(&dept).Error; err != nil {
			return fmt.Errorf("failed to create test department: %w", err)
		}
	}

	// Get department IDs
	var csDept, itDept models.Department
	if err := db.Where("name = ?", "Sistem Informasi").First(&csDept).Error; err != nil {
		return fmt.Errorf("failed to find CS department: %w", err)
	}
	if err := db.Where("name = ?", "Teknik Informatika").First(&itDept).Error; err != nil {
		return fmt.Errorf("failed to find IT department: %w", err)
	}

	// Create test users
	testUsers := []models.User{
		{
			Email:         "admin@demo.com",
			PasswordHash:  string(hashedPassword),
			Name:          "Admin User",
			Role:          "admin",
			UserType:      "lecturer",
			NIMNIDN:       utils.StringPtr("ADM001"),
			Faculty:       utils.StringPtr("Fakultas Ilmu Komputer"),
			DepartmentID:  &csDept.ID,
			Address:       utils.StringPtr("Jl. Admin No. 1"),
			EmailVerified: true,
			IsApproved:    true,
		},
		{
			Email:         "user@demo.com",
			PasswordHash:  string(hashedPassword),
			Name:          "Regular User",
			Role:          "user",
			UserType:      "student",
			NIMNIDN:       utils.StringPtr("STU001"),
			Faculty:       utils.StringPtr("Fakultas Ilmu Komputer"),
			DepartmentID:  &csDept.ID,
			Address:       utils.StringPtr("Jl. User No. 1"),
			EmailVerified: true,
			IsApproved:    true,
		},
	}

	for _, user := range testUsers {
		if err := db.Create(&user).Error; err != nil {
			return fmt.Errorf("failed to create test user: %w", err)
		}
	}

	// Create test categories
	testCategories := []models.Category{
		{
			Name:        "Computer Science",
			Description: utils.StringPtr("CS related content"),
			Type:        "both",
		},
		{
			Name:        "Mathematics",
			Description: utils.StringPtr("Math related content"),
			Type:        "book",
		},
		{
			Name:        "Engineering",
			Description: utils.StringPtr("Engineering related content"),
			Type:        "paper",
		},
	}

	for _, cat := range testCategories {
		if err := db.Create(&cat).Error; err != nil {
			return fmt.Errorf("failed to create test category: %w", err)
		}
	}

	// Create test books
	testBooks := []models.Book{
		{
			Title:         "Introduction to Programming",
			Author:        "John Smith",
			Publisher:     utils.StringPtr("Tech Books"),
			PublishedYear: utils.IntPtr(2023),
			ISBN:          utils.StringPtr("123-456-789"),
			Subject:       utils.StringPtr("Computer Science"),
			Language:      utils.StringPtr("English"),
			Pages:         utils.IntPtr(300),
			Summary:       utils.StringPtr("A beginner's guide to programming"),
			FileURL:       utils.StringPtr("/uploads/books/intro_programming.pdf"),
			CreatedBy:     utils.UintPtr(1),
		},
		{
			Title:         "Advanced Mathematics",
			Author:        "Sarah Johnson",
			Publisher:     utils.StringPtr("Math Books"),
			PublishedYear: utils.IntPtr(2023),
			ISBN:          utils.StringPtr("987-654-321"),
			Subject:       utils.StringPtr("Mathematics"),
			Language:      utils.StringPtr("English"),
			Pages:         utils.IntPtr(400),
			Summary:       utils.StringPtr("Advanced mathematical concepts"),
			FileURL:       utils.StringPtr("/uploads/books/advanced_math.pdf"),
			CreatedBy:     utils.UintPtr(1),
		},
	}

	for _, book := range testBooks {
		if err := db.Create(&book).Error; err != nil {
			return fmt.Errorf("failed to create test book: %w", err)
		}
	}

	// Create test papers
	testPapers := []models.Paper{
		{
			Title:      "Machine Learning Applications",
			Author:     "John Smith",
			Advisor:    utils.StringPtr("Dr. Ahmad Rahman"),
			University: utils.StringPtr("Universitas Dumai"),
			Department: utils.StringPtr("Sistem Informasi"),
			Year:       utils.IntPtr(2023),
			Abstract:   utils.StringPtr("Research on ML applications"),
			Keywords:   utils.StringPtr("machine learning, AI"),
			FileURL:    utils.StringPtr("/uploads/papers/ml_applications.pdf"),
			CreatedBy:  utils.UintPtr(1),
		},
		{
			Title:      "Database Optimization",
			Author:     "Sarah Johnson",
			Advisor:    utils.StringPtr("Dr. Lisa Wong"),
			University: utils.StringPtr("Universitas Dumai"),
			Department: utils.StringPtr("Teknik Informatika"),
			Year:       utils.IntPtr(2023),
			Abstract:   utils.StringPtr("Research on database optimization"),
			Keywords:   utils.StringPtr("database, optimization"),
			FileURL:    utils.StringPtr("/uploads/papers/db_optimization.pdf"),
			CreatedBy:  utils.UintPtr(1),
		},
	}

	for _, paper := range testPapers {
		if err := db.Create(&paper).Error; err != nil {
			return fmt.Errorf("failed to create test paper: %w", err)
		}
	}

	return nil
}

// Helper functions for pointer types
func stringPtr(s string) *string {
	return &s
}

func intPtr(i int) *int {
	return &i
}

func uintPtr(u uint) *uint {
	return &u
}

// setupTestRouter creates a new router for testing
func setupTestRouter(handler interface{}) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	switch h := handler.(type) {
	case *AuthHandler:
		router.POST("/auth/register", h.Register)
		router.POST("/auth/login", h.Login)
		router.POST("/auth/admin/register", h.AdminRegister)
		router.GET("/auth/profile", h.GetProfile)
		router.PUT("/auth/profile", h.UpdateProfile)
	case *BookHandler:
		router.GET("/books", h.GetBooks)
		router.GET("/books/:id", h.GetBook)
		router.POST("/books", h.CreateBook)
		router.PUT("/books/:id", h.UpdateBook)
		router.DELETE("/books/:id", h.DeleteBook)
	case *PaperHandler:
		router.GET("/papers", h.GetPapers)
		router.GET("/papers/:id", h.GetPaper)
		router.POST("/papers", h.CreatePaper)
		router.PUT("/papers/:id", h.UpdatePaper)
		router.DELETE("/papers/:id", h.DeletePaper)
	}

	return router
}

// performRequest performs a test request
func performRequest(r *gin.Engine, method, path string, body interface{}, token string) *httptest.ResponseRecorder {
	var req *http.Request
	if body != nil {
		jsonData, _ := json.Marshal(body)
		req, _ = http.NewRequest(method, path, bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req, _ = http.NewRequest(method, path, nil)
	}

	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

// createTestUser creates a test user
func createTestUser(t *testing.T, h *AuthHandler, role string) (models.User, string) {
	// Create test department
	dept := models.Department{
		Name:    "Test Department",
		Faculty: "Fakultas Ilmu Komputer",
	}
	if err := h.db.Create(&dept).Error; err != nil {
		t.Fatalf("Failed to create test department: %v", err)
	}

	// Create test user
	user := models.User{
		Email:         "test@example.com",
		PasswordHash:  "hashed_password",
		Name:          "Test User",
		Role:          role,
		UserType:      "student",
		NIMNIDN:       utils.StringPtr("12345"),
		Faculty:       utils.StringPtr("Fakultas Ilmu Komputer"),
		DepartmentID:  &dept.ID,
		EmailVerified: true,
		IsApproved:    true,
	}
	if err := h.db.Create(&user).Error; err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	// Generate token
	token, err := utils.GenerateJWT(user.ID, h.config.JWT.Secret)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	return user, token
}

// createTestAdmin creates a test admin user
func createTestAdmin(t *testing.T, h *AuthHandler) (models.User, string) {
	// Create test department
	dept := models.Department{
		Name:    "Test Department",
		Faculty: "Fakultas Ilmu Komputer",
	}
	if err := h.db.Create(&dept).Error; err != nil {
		t.Fatalf("Failed to create test department: %v", err)
	}

	// Create test admin
	admin := models.User{
		Email:         "admin@example.com",
		PasswordHash:  "hashed_password",
		Name:          "Test Admin",
		Role:          "admin",
		UserType:      "lecturer",
		NIMNIDN:       utils.StringPtr("A12345"),
		Faculty:       utils.StringPtr("Fakultas Ilmu Komputer"),
		DepartmentID:  &dept.ID,
		EmailVerified: true,
		IsApproved:    true,
	}
	if err := h.db.Create(&admin).Error; err != nil {
		t.Fatalf("Failed to create test admin: %v", err)
	}

	// Generate token
	token, err := utils.GenerateJWT(admin.ID, h.config.JWT.Secret)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	return admin, token
}
