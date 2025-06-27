package handlers

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"gorm.io/gorm"

	"e-repository-api/configs"
	"e-repository-api/internal/models"
	"e-repository-api/internal/utils"
)

// AuthTestSuite is a test suite for auth handlers
type AuthTestSuite struct {
	suite.Suite
	router  *gin.Engine
	db      *gorm.DB
	config  *configs.Config
	handler *AuthHandler
}

// SetupSuite runs once before all tests
func (suite *AuthTestSuite) SetupSuite() {
	log.Println("Setting up test suite...")

	// Initialize test database
	log.Println("Initializing test database...")
	db, err := setupMySQLTestDB(getTestConfig())
	if err != nil {
		log.Printf("Failed to setup test database: %v", err)
	}
	suite.NoError(err)
	suite.db = db

	// Initialize config
	log.Println("Initializing test config...")
	suite.config = getTestConfig()

	// Initialize router
	log.Println("Initializing router...")
	gin.SetMode(gin.TestMode)
	suite.router = gin.New()

	// Initialize handler
	log.Println("Initializing auth handler...")
	suite.handler = NewAuthHandler(suite.db, suite.config)

	// Set up routes
	log.Println("Setting up routes...")
	suite.router.POST("/auth/register", suite.handler.Register)
	suite.router.POST("/auth/login", suite.handler.Login)
	suite.router.PUT("/auth/profile", suite.handler.UpdateProfile)

	log.Println("Test suite setup completed")
}

// SetupTest runs before each test
func (suite *AuthTestSuite) SetupTest() {
	log.Printf("Setting up test: %s", suite.T().Name())

	// Clean up test data before each test
	log.Println("Cleaning up test data...")
	cleanupTestData(suite.db)

	// Seed fresh test data
	log.Println("Seeding test data...")
	err := SeedTestData(suite.db)
	if err != nil {
		log.Printf("Failed to seed test data: %v", err)
	}
	suite.NoError(err)

	log.Println("Test setup completed")
}

// TearDownSuite runs once after all tests
func (suite *AuthTestSuite) TearDownSuite() {
	log.Println("Tearing down test suite...")

	if suite.db != nil {
		// Clean up test data
		log.Println("Cleaning up test data...")
		cleanupTestData(suite.db)

		// Close database connection
		log.Println("Closing database connection...")
		db, err := suite.db.DB()
		if err == nil {
			db.Close()
		}

		// Drop test database
		log.Println("Dropping test database...")
		err = cleanupTestDatabase(suite.config)
		if err != nil {
			log.Printf("Failed to cleanup test database: %v", err)
		}
		suite.NoError(err)
	}

	log.Println("Test suite teardown completed")
}

// TestLogin tests the login endpoint
func (suite *AuthTestSuite) TestLogin() {
	log.Printf("Running test: %s", suite.T().Name())

	// Test cases
	tests := []struct {
		name       string
		payload    map[string]interface{}
		wantStatus int
		wantError  bool
	}{
		{
			name: "successful login",
			payload: map[string]interface{}{
				"email":    "user@demo.com",
				"password": "password123",
			},
			wantStatus: http.StatusOK,
			wantError:  false,
		},
		{
			name: "invalid credentials",
			payload: map[string]interface{}{
				"email":    "user@demo.com",
				"password": "wrongpassword",
			},
			wantStatus: http.StatusUnauthorized,
			wantError:  true,
		},
		{
			name: "missing email",
			payload: map[string]interface{}{
				"password": "password123",
			},
			wantStatus: http.StatusBadRequest,
			wantError:  true,
		},
		{
			name: "missing password",
			payload: map[string]interface{}{
				"email": "user@demo.com",
			},
			wantStatus: http.StatusBadRequest,
			wantError:  true,
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			log.Printf("Running test case: %s", tt.name)

			// Create request
			jsonData, _ := json.Marshal(tt.payload)
			log.Printf("Request payload: %s", string(jsonData))

			req, _ := http.NewRequest("POST", "/auth/login", bytes.NewBuffer(jsonData))
			req.Header.Set("Content-Type", "application/json")

			// Create response recorder
			w := httptest.NewRecorder()

			// Perform request
			log.Println("Sending request...")
			suite.router.ServeHTTP(w, req)

			// Check status code
			log.Printf("Response status: %d (expected: %d)", w.Code, tt.wantStatus)
			suite.Equal(tt.wantStatus, w.Code)

			// Parse response
			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			log.Printf("Response body: %s", w.Body.String())

			if tt.wantError {
				// Should have error message
				suite.NoError(err)
				suite.NotNil(response["error"])
				log.Printf("Error message: %v", response["error"])
			} else {
				// Should have token and user data
				suite.NoError(err)
				suite.NotNil(response["token"])
				suite.NotNil(response["user"])

				// Verify user data
				user := response["user"].(map[string]interface{})
				suite.Equal(tt.payload["email"], user["email"])
				log.Printf("User data verified: %v", user)
			}
		})
	}
}

// TestRegister_Success tests successful user registration
func (suite *AuthTestSuite) TestRegister_Success() {
	suite.T().Log("Setting up test: TestRegister_Success")
	suite.SetupTest()
	suite.T().Log("Test setup completed")

	registerReq := models.RegisterRequest{
		Email:        "newuser@test.com",
		Name:         "New Test User",
		Password:     "password123",
		UserType:     "student",
		NIMNIDN:      "NEW001",
		Faculty:      "Fakultas Ilmu Komputer",
		DepartmentID: 1,
		Address:      utils.StringPtr("Test Address"),
	}

	jsonData, _ := json.Marshal(registerReq)
	suite.T().Logf("Request payload: %s", string(jsonData))

	req := httptest.NewRequest("POST", "/auth/register", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	suite.T().Log("Sending request...")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	suite.T().Logf("Response status: %d (expected: 201)", w.Code)
	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	suite.T().Logf("Response body: %s", w.Body.String())
	var response models.AuthResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), response.Token)
	assert.NotEmpty(suite.T(), response.User.Email)
	assert.Equal(suite.T(), "newuser@test.com", response.User.Email)
	assert.Equal(suite.T(), "New Test User", response.User.Name)
	assert.Equal(suite.T(), "user", response.User.Role)
	suite.T().Logf("Registration successful: %+v", response)
}

// TestRegister_InvalidEmail tests registration with invalid email
func (suite *AuthTestSuite) TestRegister_InvalidEmail() {
	log.Printf("Running test: %s", suite.T().Name())

	registerReq := models.RegisterRequest{
		Email:        "invalid-email",
		Name:         "Test User",
		Password:     "password123",
		UserType:     "student",
		NIMNIDN:      "12345",
		Faculty:      "Fakultas Ilmu Komputer",
		DepartmentID: 1,
		Address:      utils.StringPtr("Test Address"),
	}

	jsonData, _ := json.Marshal(registerReq)
	req := httptest.NewRequest("POST", "/auth/register", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestRegister_ShortPassword tests registration with short password
func (suite *AuthTestSuite) TestRegister_ShortPassword() {
	log.Printf("Running test: %s", suite.T().Name())

	registerReq := models.RegisterRequest{
		Email:        "test@example.com",
		Name:         "Test User",
		Password:     "123",
		UserType:     "student",
		NIMNIDN:      "12345",
		Faculty:      "Fakultas Ilmu Komputer",
		DepartmentID: 1,
		Address:      utils.StringPtr("Test Address"),
	}

	jsonData, _ := json.Marshal(registerReq)
	req := httptest.NewRequest("POST", "/auth/register", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// TestRegister_DuplicateEmail tests registration with duplicate email
func (suite *AuthTestSuite) TestRegister_DuplicateEmail() {
	log.Printf("Running test: %s", suite.T().Name())

	// First registration
	registerReq := models.RegisterRequest{
		Email:        "test@example.com",
		Name:         "Test User",
		Password:     "password123",
		UserType:     "student",
		NIMNIDN:      "12345",
		Faculty:      "Fakultas Ilmu Komputer",
		DepartmentID: 1,
		Address:      utils.StringPtr("Test Address"),
	}

	jsonData, _ := json.Marshal(registerReq)
	req := httptest.NewRequest("POST", "/auth/register", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	// Second registration with same email
	registerReq = models.RegisterRequest{
		Email:        "test@example.com",
		Name:         "Test User 2",
		Password:     "password123",
		UserType:     "student",
		NIMNIDN:      "12346",
		Faculty:      "Fakultas Ilmu Komputer",
		DepartmentID: 1,
		Address:      utils.StringPtr("Test Address 2"),
	}

	jsonData, _ = json.Marshal(registerReq)
	req = httptest.NewRequest("POST", "/auth/register", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	w = httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusConflict, w.Code)
}

// TestAuthTestSuite runs the auth test suite
func TestAuthTestSuite(t *testing.T) {
	suite.Run(t, new(AuthTestSuite))
}

func (suite *AuthTestSuite) TestRegister() {
	// Test successful registration
	reqBody := models.RegisterRequest{
		Email:        "test@example.com",
		Name:         "Test User",
		Password:     "password123",
		UserType:     "student",
		NIMNIDN:      "12345",
		Faculty:      "Fakultas Ilmu Komputer",
		DepartmentID: 1,
		Address:      utils.StringPtr("Test Address"),
	}
	jsonBody, _ := json.Marshal(reqBody)
	req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	// Test duplicate email
	reqBody = models.RegisterRequest{
		Email:        "test@example.com",
		Name:         "Test User 2",
		Password:     "password123",
		UserType:     "student",
		NIMNIDN:      "12346",
		Faculty:      "Fakultas Ilmu Komputer",
		DepartmentID: 1,
		Address:      utils.StringPtr("Test Address 2"),
	}
	jsonBody, _ = json.Marshal(reqBody)
	req = httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusConflict, w.Code)
}

func (suite *AuthTestSuite) TestAdminRegister() {
	log.Printf("Running test: %s", suite.T().Name())

	// Create test admin
	admin := models.User{
		Email:         "admin@example.com",
		PasswordHash:  "hashed_password",
		Name:          "Admin User",
		Role:          "admin",
		UserType:      "lecturer",
		NIMNIDN:       utils.StringPtr("A12345"),
		Faculty:       utils.StringPtr("Fakultas Ilmu Komputer"),
		DepartmentID:  utils.UintPtr(1),
		EmailVerified: true,
		IsApproved:    true,
	}
	if err := suite.db.Create(&admin).Error; err != nil {
		suite.T().Fatalf("Failed to create test admin: %v", err)
	}

	// Generate token
	token := suite.generateToken(admin.ID)

	// Test admin registration
	registerReq := models.RegisterRequest{
		Email:        "newadmin@example.com",
		Name:         "New Admin",
		Password:     "password123",
		UserType:     "lecturer",
		NIMNIDN:      "A67890",
		Faculty:      "Fakultas Ilmu Komputer",
		DepartmentID: 1,
		Address:      utils.StringPtr("Admin Address"),
	}

	jsonData, _ := json.Marshal(registerReq)
	req := httptest.NewRequest("POST", "/auth/register", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusCreated, w.Code)
}

func (suite *AuthTestSuite) generateToken(userID uint) string {
	token, err := utils.GenerateJWT(userID, suite.config.JWT.Secret)
	if err != nil {
		suite.T().Fatalf("Failed to generate token: %v", err)
	}
	return token
}

func (suite *AuthTestSuite) TestUpdateProfile() {
	// Create test user
	user := models.User{
		Email:         "test@example.com",
		PasswordHash:  "hashed_password",
		Name:          "Test User",
		Role:          "user",
		UserType:      "student",
		NIMNIDN:       utils.StringPtr("12345"),
		Faculty:       utils.StringPtr("Fakultas Ilmu Komputer"),
		DepartmentID:  utils.UintPtr(1),
		EmailVerified: true,
		IsApproved:    true,
	}
	if err := suite.db.Create(&user).Error; err != nil {
		suite.T().Fatalf("Failed to create test user: %v", err)
	}

	// Generate token
	token := suite.generateToken(user.ID)

	// Test successful profile update
	updateReq := map[string]interface{}{
		"name":          "Updated Name",
		"address":       "Updated Address",
		"department_id": 2,
	}
	jsonBody, _ := json.Marshal(updateReq)
	req := httptest.NewRequest(http.MethodPut, "/auth/profile", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Verify user was updated
	var updatedUser models.User
	if err := suite.db.First(&updatedUser, user.ID).Error; err != nil {
		suite.T().Fatalf("Failed to fetch updated user: %v", err)
	}
	assert.Equal(suite.T(), "Updated Name", updatedUser.Name)
	assert.Equal(suite.T(), "Updated Address", *updatedUser.Address)
	assert.Equal(suite.T(), uint(2), *updatedUser.DepartmentID)
}
