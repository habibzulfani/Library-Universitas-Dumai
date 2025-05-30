package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"e-repository-api/configs"
	"e-repository-api/internal/middleware"
	"e-repository-api/internal/models"
	"e-repository-api/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type PapersTestSuite struct {
	suite.Suite
	db          *gorm.DB
	router      *gin.Engine
	handler     *PaperHandler
	authHandler *AuthHandler
	config      *configs.Config
	adminToken  string
	userToken   string
	testPapers  []models.Paper // Store created test papers
}

func (suite *PapersTestSuite) SetupSuite() {
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

	// Create handlers
	suite.handler = NewPaperHandler(suite.config)
	suite.authHandler = NewAuthHandler(suite.config)

	// Setup Gin router
	gin.SetMode(gin.TestMode)
	suite.router = gin.New()

	// Setup routes
	api := suite.router.Group("/api")
	{
		// Public routes
		api.GET("/papers", suite.handler.GetPapers)
		api.GET("/papers/:id", suite.handler.GetPaper)

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware(suite.config))
		{
			protected.GET("/papers/:id/download", suite.handler.DownloadPaper)
		}

		// Admin routes
		admin := api.Group("/admin")
		admin.Use(middleware.AuthMiddleware(suite.config))
		admin.Use(middleware.AdminMiddleware())
		{
			admin.POST("/papers", suite.handler.CreatePaper)
			admin.PUT("/papers/:id", suite.handler.UpdatePaper)
			admin.DELETE("/papers/:id", suite.handler.DeletePaper)
		}
	}
}

func (suite *PapersTestSuite) SetupTest() {
	// Clean up data before each test
	cleanupTestData(suite.db)
	
	// Create test users and get tokens
	suite.createTestUsers()
}

func (suite *PapersTestSuite) TearDownSuite() {
	// Cleanup test database
	config := getTestConfig()
	cleanupTestDatabase(config)
}

// Helper function to generate bcrypt hash
func (suite *PapersTestSuite) hashPassword(password string) string {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	suite.Require().NoError(err)
	return string(hash)
}

func (suite *PapersTestSuite) createTestUsers() {
	// Create admin user with proper password hash
	hashedPassword := suite.hashPassword("password123")
	adminUser := models.User{
		Email:        "admin@test.com",
		Name:         "Test Admin",
		PasswordHash: hashedPassword,
		Role:         "admin",
	}
	suite.db.Create(&adminUser)

	// Create regular user
	regularUser := models.User{
		Email:        "user@test.com",
		Name:         "Test User",
		PasswordHash: hashedPassword,
		Role:         "user",
	}
	suite.db.Create(&regularUser)

	// Generate tokens
	suite.adminToken, _ = utils.GenerateJWT(adminUser.ID, suite.config.JWT.Secret)
	suite.userToken, _ = utils.GenerateJWT(regularUser.ID, suite.config.JWT.Secret)

	// Create test papers
	suite.createTestPapers()
}

func (suite *PapersTestSuite) createTestPapers() {
	stringPtr := func(s string) *string { return &s }
	intPtr := func(i int) *int { return &i }

	papers := []models.Paper{
		{
			Title:      "Test Paper 1",
			Author:     "Researcher 1",
			Advisor:    stringPtr("Advisor 1"),
			University: stringPtr("Test University"),
			Department: stringPtr("Computer Science"),
			Year:       intPtr(2023),
			Abstract:   stringPtr("First test paper abstract"),
			Keywords:   stringPtr("test, computer science, research"),
		},
		{
			Title:      "Test Paper 2",
			Author:     "Researcher 2",
			Advisor:    stringPtr("Advisor 2"),
			University: stringPtr("Test University"),
			Department: stringPtr("Mathematics"),
			Year:       intPtr(2022),
			Abstract:   stringPtr("Second test paper abstract"),
			Keywords:   stringPtr("test, mathematics, analysis"),
		},
	}

	suite.testPapers = make([]models.Paper, 0)
	for _, paper := range papers {
		err := suite.db.Create(&paper).Error
		suite.Require().NoError(err)
		suite.testPapers = append(suite.testPapers, paper)
	}
}

func (suite *PapersTestSuite) TestGetPapers_Success() {
	req := httptest.NewRequest("GET", "/api/papers", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response models.PaginatedResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 1, response.Page)
	assert.Equal(suite.T(), 10, response.Limit)
	assert.Equal(suite.T(), 1, response.TotalPages)
	assert.Equal(suite.T(), int64(2), response.Total)
}

func (suite *PapersTestSuite) TestGetPaper_Success() {
	// Use the ID from the first created test paper
	paperID := suite.testPapers[0].ID
	req := httptest.NewRequest("GET", fmt.Sprintf("/api/papers/%d", paperID), nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var paper models.Paper
	err := json.Unmarshal(w.Body.Bytes(), &paper)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), paperID, paper.ID)
	assert.Equal(suite.T(), "Test Paper 1", paper.Title)
}

func (suite *PapersTestSuite) TestGetPaper_NotFound() {
	req := httptest.NewRequest("GET", "/api/papers/999", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

func (suite *PapersTestSuite) TestCreatePaper_Success() {
	newPaper := models.Paper{
		Title:      "New Test Paper",
		Author:     "New Researcher",
		Advisor:    &[]string{"New Advisor"}[0],
		University: &[]string{"New University"}[0],
		Department: &[]string{"Physics"}[0],
		Year:       &[]int{2024}[0],
		Abstract:   &[]string{"A new test paper abstract"}[0],
		Keywords:   &[]string{"test, physics, research"}[0],
	}

	jsonData, _ := json.Marshal(newPaper)
	req := httptest.NewRequest("POST", "/api/admin/papers", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+suite.adminToken)

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	var createdPaper models.Paper
	err := json.Unmarshal(w.Body.Bytes(), &createdPaper)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "New Test Paper", createdPaper.Title)
	assert.Equal(suite.T(), "New Researcher", createdPaper.Author)
}

func (suite *PapersTestSuite) TestCreatePaper_Unauthorized() {
	newPaper := models.Paper{
		Title:  "New Test Paper",
		Author: "New Researcher",
	}

	jsonData, _ := json.Marshal(newPaper)
	req := httptest.NewRequest("POST", "/api/admin/papers", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+suite.userToken) // Regular user token

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusForbidden, w.Code)
}

func (suite *PapersTestSuite) TestDeletePaper_Success() {
	// Use the ID from the first created test paper
	paperID := suite.testPapers[0].ID
	req := httptest.NewRequest("DELETE", fmt.Sprintf("/api/admin/papers/%d", paperID), nil)
	req.Header.Set("Authorization", "Bearer "+suite.adminToken)

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Verify paper is deleted
	var paper models.Paper
	result := suite.db.First(&paper, paperID)
	assert.Error(suite.T(), result.Error)
}

func TestPapersTestSuite(t *testing.T) {
	suite.Run(t, new(PapersTestSuite))
} 