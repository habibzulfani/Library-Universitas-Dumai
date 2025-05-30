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

type BooksTestSuite struct {
	suite.Suite
	db          *gorm.DB
	router      *gin.Engine
	handler     *BookHandler
	authHandler *AuthHandler
	config      *configs.Config
	adminToken  string
	userToken   string
	testBooks   []models.Book // Store created test books
}

func (suite *BooksTestSuite) SetupSuite() {
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
	suite.handler = NewBookHandler(suite.config)
	suite.authHandler = NewAuthHandler(suite.config)

	// Setup Gin router
	gin.SetMode(gin.TestMode)
	suite.router = gin.New()

	// Setup routes
	api := suite.router.Group("/api")
	{
		// Public routes
		api.GET("/books", suite.handler.GetBooks)
		api.GET("/books/:id", suite.handler.GetBook)

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware(suite.config))
		{
			protected.GET("/books/:id/download", suite.handler.DownloadBook)
		}

		// Admin routes
		admin := api.Group("/admin")
		admin.Use(middleware.AuthMiddleware(suite.config))
		admin.Use(middleware.AdminMiddleware())
		{
			admin.POST("/books", suite.handler.CreateBook)
			admin.PUT("/books/:id", suite.handler.UpdateBook)
			admin.DELETE("/books/:id", suite.handler.DeleteBook)
		}
	}
}

func (suite *BooksTestSuite) SetupTest() {
	// Clean up data before each test
	cleanupTestData(suite.db)
	
	// Create test users and get tokens
	suite.createTestUsers()
}

func (suite *BooksTestSuite) TearDownSuite() {
	// Cleanup test database
	config := getTestConfig()
	cleanupTestDatabase(config)
}

// Helper function to generate bcrypt hash
func (suite *BooksTestSuite) hashPassword(password string) string {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	suite.Require().NoError(err)
	return string(hash)
}

func (suite *BooksTestSuite) createTestUsers() {
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

	// Create test books
	suite.createTestBooks()
}

func (suite *BooksTestSuite) createTestBooks() {
	stringPtr := func(s string) *string { return &s }
	intPtr := func(i int) *int { return &i }

	books := []models.Book{
		{
			Title:         "Test Book 1",
			Author:        "Author 1",
			Publisher:     stringPtr("Publisher 1"),
			PublishedYear: intPtr(2023),
			ISBN:          stringPtr("978-1234567890"),
			Subject:       stringPtr("Computer Science"),
			Language:      stringPtr("English"),
			Pages:         intPtr(300),
			Summary:       stringPtr("A test book"),
		},
		{
			Title:         "Test Book 2",
			Author:        "Author 2",
			Publisher:     stringPtr("Publisher 2"),
			PublishedYear: intPtr(2022),
			ISBN:          stringPtr("978-0987654321"),
			Subject:       stringPtr("Mathematics"),
			Language:      stringPtr("English"),
			Pages:         intPtr(250),
			Summary:       stringPtr("Another test book"),
		},
	}

	suite.testBooks = make([]models.Book, 0)
	for _, book := range books {
		err := suite.db.Create(&book).Error
		suite.Require().NoError(err)
		suite.testBooks = append(suite.testBooks, book)
	}
}

func (suite *BooksTestSuite) TestGetBooks_Success() {
	req := httptest.NewRequest("GET", "/api/books", nil)
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

func (suite *BooksTestSuite) TestGetBook_Success() {
	// Use the ID from the first created test book
	bookID := suite.testBooks[0].ID
	req := httptest.NewRequest("GET", fmt.Sprintf("/api/books/%d", bookID), nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var book models.Book
	err := json.Unmarshal(w.Body.Bytes(), &book)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), bookID, book.ID)
	assert.Equal(suite.T(), "Test Book 1", book.Title)
}

func (suite *BooksTestSuite) TestGetBook_NotFound() {
	req := httptest.NewRequest("GET", "/api/books/999", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

func (suite *BooksTestSuite) TestCreateBook_Success() {
	newBook := models.Book{
		Title:         "New Test Book",
		Author:        "New Author",
		Publisher:     &[]string{"New Publisher"}[0],
		PublishedYear: &[]int{2024}[0],
		Subject:       &[]string{"Science"}[0],
		Language:      &[]string{"English"}[0],
		Pages:         &[]int{400}[0],
		Summary:       &[]string{"A new test book summary"}[0],
	}

	jsonData, _ := json.Marshal(newBook)
	req := httptest.NewRequest("POST", "/api/admin/books", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+suite.adminToken)

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	var createdBook models.Book
	err := json.Unmarshal(w.Body.Bytes(), &createdBook)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "New Test Book", createdBook.Title)
	assert.Equal(suite.T(), "New Author", createdBook.Author)
}

func (suite *BooksTestSuite) TestCreateBook_Unauthorized() {
	newBook := models.Book{
		Title:  "New Test Book",
		Author: "New Author",
	}

	jsonData, _ := json.Marshal(newBook)
	req := httptest.NewRequest("POST", "/api/admin/books", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+suite.userToken) // Regular user token

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusForbidden, w.Code)
}

func (suite *BooksTestSuite) TestDeleteBook_Success() {
	// Use the ID from the first created test book
	bookID := suite.testBooks[0].ID
	req := httptest.NewRequest("DELETE", fmt.Sprintf("/api/admin/books/%d", bookID), nil)
	req.Header.Set("Authorization", "Bearer "+suite.adminToken)

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Verify book is deleted
	var book models.Book
	result := suite.db.First(&book, bookID)
	assert.Error(suite.T(), result.Error)
}

func TestBooksTestSuite(t *testing.T) {
	suite.Run(t, new(BooksTestSuite))
} 