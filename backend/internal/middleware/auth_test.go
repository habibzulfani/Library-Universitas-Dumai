package middleware

import (
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
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type AuthMiddlewareTestSuite struct {
	suite.Suite
	db     *gorm.DB
	config *configs.Config
	user   models.User
	token  string
}

func (suite *AuthMiddlewareTestSuite) SetupSuite() {
	// Setup test database once for the entire suite
	config := getTestConfig()
	db, err := setupMySQLTestDB(config)
	suite.Require().NoError(err)
	suite.db = db

	// Setup config
	suite.config = &configs.Config{
		JWT: configs.JWTConfig{
			Secret: "test-secret-key",
		},
	}
}

func (suite *AuthMiddlewareTestSuite) SetupTest() {
	// Clean up data before each test
	cleanupTestData(suite.db)

	// Create test user
	suite.user = models.User{
		Email:        "test@example.com",
		Name:         "Test User",
		PasswordHash: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password123
		Role:         "user",
	}
	suite.db.Create(&suite.user)

	// Generate token
	suite.token, _ = utils.GenerateJWT(suite.user.ID, suite.config.JWT.Secret)
}

func (suite *AuthMiddlewareTestSuite) TearDownSuite() {
	// Cleanup test database
	config := getTestConfig()
	cleanupTestDatabase(config)
}

// Helper function to create a new router for each test
func (suite *AuthMiddlewareTestSuite) newRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return gin.New()
}

func (suite *AuthMiddlewareTestSuite) TestAuthMiddleware_ValidToken() {
	router := suite.newRouter()
	router.Use(AuthMiddleware(suite.config))
	router.GET("/protected", func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found in context"})
			return
		}
		userObj := user.(models.User)
		c.JSON(http.StatusOK, gin.H{"message": "success", "user_id": userObj.ID})
	})

	req := httptest.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+suite.token)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

func (suite *AuthMiddlewareTestSuite) TestAuthMiddleware_MissingHeader() {
	router := suite.newRouter()
	router.Use(AuthMiddleware(suite.config))
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req := httptest.NewRequest("GET", "/protected", nil)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

func (suite *AuthMiddlewareTestSuite) TestAuthMiddleware_InvalidHeaderFormat() {
	router := suite.newRouter()
	router.Use(AuthMiddleware(suite.config))
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req := httptest.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "InvalidFormat")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

func (suite *AuthMiddlewareTestSuite) TestAuthMiddleware_InvalidToken() {
	router := suite.newRouter()
	router.Use(AuthMiddleware(suite.config))
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req := httptest.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer invalid-token")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

func (suite *AuthMiddlewareTestSuite) TestAuthMiddleware_UserNotFound() {
	// Create token for non-existent user
	fakeToken, _ := utils.GenerateJWT(999, suite.config.JWT.Secret)

	router := suite.newRouter()
	router.Use(AuthMiddleware(suite.config))
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req := httptest.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+fakeToken)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

func (suite *AuthMiddlewareTestSuite) TestAdminMiddleware_AdminUser() {
	// Create admin user
	adminUser := models.User{
		Email:        "admin@example.com",
		Name:         "Admin User",
		PasswordHash: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password123
		Role:         "admin",
	}
	suite.db.Create(&adminUser)

	// Middleware chain: auth first, then admin
	router := suite.newRouter()
	router.Use(AuthMiddleware(suite.config))
	router.Use(AdminMiddleware())
	router.GET("/admin", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "admin access granted"})
	})

	adminToken, _ := utils.GenerateJWT(adminUser.ID, suite.config.JWT.Secret)
	req := httptest.NewRequest("GET", "/admin", nil)
	req.Header.Set("Authorization", "Bearer "+adminToken)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

func (suite *AuthMiddlewareTestSuite) TestAdminMiddleware_RegularUser() {
	// Middleware chain: auth first, then admin
	router := suite.newRouter()
	router.Use(AuthMiddleware(suite.config))
	router.Use(AdminMiddleware())
	router.GET("/admin", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "admin access granted"})
	})

	req := httptest.NewRequest("GET", "/admin", nil)
	req.Header.Set("Authorization", "Bearer "+suite.token) // Regular user token

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusForbidden, w.Code)
}

func (suite *AuthMiddlewareTestSuite) TestAdminMiddleware_NoUser() {
	// Admin middleware without auth middleware first
	router := suite.newRouter()
	router.Use(AdminMiddleware())
	router.GET("/admin", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "admin access granted"})
	})

	req := httptest.NewRequest("GET", "/admin", nil)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

func (suite *AuthMiddlewareTestSuite) TestOptionalAuthMiddleware_WithValidToken() {
	router := suite.newRouter()
	router.Use(OptionalAuthMiddleware(suite.config))
	router.GET("/optional", func(c *gin.Context) {
		user, exists := c.Get("user")
		if exists {
			userObj := user.(models.User)
			c.JSON(http.StatusOK, gin.H{"authenticated": true, "user_id": userObj.ID})
		} else {
			c.JSON(http.StatusOK, gin.H{"authenticated": false})
		}
	})

	req := httptest.NewRequest("GET", "/optional", nil)
	req.Header.Set("Authorization", "Bearer "+suite.token)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

func (suite *AuthMiddlewareTestSuite) TestOptionalAuthMiddleware_WithoutToken() {
	router := suite.newRouter()
	router.Use(OptionalAuthMiddleware(suite.config))
	router.GET("/optional", func(c *gin.Context) {
		user, exists := c.Get("user")
		if exists {
			userObj := user.(models.User)
			c.JSON(http.StatusOK, gin.H{"authenticated": true, "user_id": userObj.ID})
		} else {
			c.JSON(http.StatusOK, gin.H{"authenticated": false})
		}
	})

	req := httptest.NewRequest("GET", "/optional", nil)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

func (suite *AuthMiddlewareTestSuite) TestOptionalAuthMiddleware_WithInvalidToken() {
	router := suite.newRouter()
	router.Use(OptionalAuthMiddleware(suite.config))
	router.GET("/optional", func(c *gin.Context) {
		user, exists := c.Get("user")
		if exists {
			userObj := user.(models.User)
			c.JSON(http.StatusOK, gin.H{"authenticated": true, "user_id": userObj.ID})
		} else {
			c.JSON(http.StatusOK, gin.H{"authenticated": false})
		}
	})

	req := httptest.NewRequest("GET", "/optional", nil)
	req.Header.Set("Authorization", "Bearer invalid-token")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

func TestAuthMiddlewareTestSuite(t *testing.T) {
	suite.Run(t, new(AuthMiddlewareTestSuite))
}

// Helper functions
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
