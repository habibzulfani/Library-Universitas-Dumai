package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"e-repository-api/configs"
	"e-repository-api/internal/database"
	"e-repository-api/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthTestSuite struct {
	suite.Suite
	db      *gorm.DB
	router  *gin.Engine
	handler *AuthHandler
	config  *configs.Config
}

func (suite *AuthTestSuite) SetupSuite() {
	// Setup test database once for the entire suite
	config := getTestConfig()
	db, err := setupMySQLTestDB(config)
	suite.Require().NoError(err)
	suite.db = db

	// Set the global database connection to our test database
	database.SetDB(suite.db)

	// Setup test config
	suite.config = &configs.Config{
		JWT: configs.JWTConfig{
			Secret: "test-secret-key",
		},
	}

	// Create handler
	suite.handler = NewAuthHandler(suite.config)

	// Setup Gin router
	gin.SetMode(gin.TestMode)
	suite.router = gin.New()
	
	// Setup routes
	auth := suite.router.Group("/auth")
	{
		auth.POST("/register", suite.handler.Register)
		auth.POST("/login", suite.handler.Login)
	}
}

func (suite *AuthTestSuite) SetupTest() {
	// Clean up data before each test
	cleanupTestData(suite.db)
}

func (suite *AuthTestSuite) TearDownSuite() {
	// Cleanup test database
	config := getTestConfig()
	cleanupTestDatabase(config)
}

// Helper function to generate bcrypt hash
func (suite *AuthTestSuite) hashPassword(password string) string {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	suite.Require().NoError(err)
	return string(hash)
}

func (suite *AuthTestSuite) TestRegister_Success() {
	registerReq := models.RegisterRequest{
		Email:    "test@example.com",
		Name:     "Test User",
		Password: "password123",
	}

	jsonData, _ := json.Marshal(registerReq)
	req := httptest.NewRequest("POST", "/auth/register", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	var response models.AuthResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), response.Token)
	assert.Equal(suite.T(), "test@example.com", response.User.Email)
	assert.Equal(suite.T(), "Test User", response.User.Name)
	assert.Equal(suite.T(), "user", response.User.Role)
}

func (suite *AuthTestSuite) TestRegister_InvalidEmail() {
	registerReq := models.RegisterRequest{
		Email:    "invalid-email",
		Name:     "Test User",
		Password: "password123",
	}

	jsonData, _ := json.Marshal(registerReq)
	req := httptest.NewRequest("POST", "/auth/register", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

func (suite *AuthTestSuite) TestRegister_ShortPassword() {
	registerReq := models.RegisterRequest{
		Email:    "test@example.com",
		Name:     "Test User",
		Password: "123", // Too short
	}

	jsonData, _ := json.Marshal(registerReq)
	req := httptest.NewRequest("POST", "/auth/register", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

func (suite *AuthTestSuite) TestRegister_DuplicateEmail() {
	// First registration
	registerReq := models.RegisterRequest{
		Email:    "test@example.com",
		Name:     "Test User",
		Password: "password123",
	}

	jsonData, _ := json.Marshal(registerReq)
	req := httptest.NewRequest("POST", "/auth/register", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)
	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	// Second registration with same email
	w2 := httptest.NewRecorder()
	req2 := httptest.NewRequest("POST", "/auth/register", bytes.NewBuffer(jsonData))
	req2.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w2, req2)

	assert.Equal(suite.T(), http.StatusConflict, w2.Code)
}

func (suite *AuthTestSuite) TestLogin_Success() {
	// Create a user with properly hashed password
	hashedPassword := suite.hashPassword("password123")
	user := models.User{
		Email:    "test@example.com",
		Name:     "Test User",
		Password: hashedPassword,
		Role:     "user",
	}
	suite.db.Create(&user)

	// Login request
	loginReq := models.LoginRequest{
		Email:    "test@example.com",
		Password: "password123",
	}

	jsonData, _ := json.Marshal(loginReq)
	req := httptest.NewRequest("POST", "/auth/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response models.AuthResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), response.Token)
	assert.Equal(suite.T(), "test@example.com", response.User.Email)
}

func (suite *AuthTestSuite) TestLogin_InvalidCredentials() {
	// Create a user with properly hashed password
	hashedPassword := suite.hashPassword("password123")
	user := models.User{
		Email:    "test@example.com",
		Name:     "Test User",
		Password: hashedPassword,
		Role:     "user",
	}
	suite.db.Create(&user)

	// Login with wrong password
	loginReq := models.LoginRequest{
		Email:    "test@example.com",
		Password: "wrongpassword",
	}

	jsonData, _ := json.Marshal(loginReq)
	req := httptest.NewRequest("POST", "/auth/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

func (suite *AuthTestSuite) TestLogin_UserNotFound() {
	loginReq := models.LoginRequest{
		Email:    "nonexistent@example.com",
		Password: "password123",
	}

	jsonData, _ := json.Marshal(loginReq)
	req := httptest.NewRequest("POST", "/auth/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

func (suite *AuthTestSuite) TestLogin_InvalidJSON() {
	req := httptest.NewRequest("POST", "/auth/login", bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

func (suite *AuthTestSuite) TestLogin_MissingFields() {
	// Missing password
	loginReq := map[string]string{
		"email": "test@example.com",
	}

	jsonData, _ := json.Marshal(loginReq)
	req := httptest.NewRequest("POST", "/auth/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

func TestAuthTestSuite(t *testing.T) {
	suite.Run(t, new(AuthTestSuite))
} 