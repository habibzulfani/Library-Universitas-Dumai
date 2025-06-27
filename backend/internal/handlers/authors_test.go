package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"e-repository-api/internal/models"
	"e-repository-api/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

func TestGetAuthorWorks(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewAuthorHandler(db)

	// Create test data
	book := models.Book{
		Title:         "Test Book",
		PublishedYear: utils.IntPtr(2024),
	}
	paper := models.Paper{
		Title: "Test Paper",
		Year:  utils.IntPtr(2024),
	}

	db.Create(&book)
	db.Create(&paper)

	// Create author associations
	bookAuthor := models.BookAuthor{
		BookID:     book.ID,
		AuthorName: "Test Author",
	}
	paperAuthor := models.PaperAuthor{
		PaperID:    paper.ID,
		AuthorName: "Test Author",
	}

	db.Create(&bookAuthor)
	db.Create(&paperAuthor)

	// Test cases
	tests := []struct {
		name           string
		authorName     string
		expectedStatus int
		expectedBooks  int
		expectedPapers int
	}{
		{
			name:           "Valid author",
			authorName:     "Test Author",
			expectedStatus: http.StatusOK,
			expectedBooks:  1,
			expectedPapers: 1,
		},
		{
			name:           "Non-existent author",
			authorName:     "Non Existent",
			expectedStatus: http.StatusOK,
			expectedBooks:  0,
			expectedPapers: 0,
		},
		{
			name:           "Empty author name",
			authorName:     "",
			expectedStatus: http.StatusBadRequest,
			expectedBooks:  0,
			expectedPapers: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create request
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Params = []gin.Param{{Key: "name", Value: tt.authorName}}

			// Call handler
			handler.GetAuthorWorks(c)

			// Assert response
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusOK {
				var response struct {
					Name   string         `json:"name"`
					Books  []models.Book  `json:"books"`
					Papers []models.Paper `json:"papers"`
				}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Equal(t, tt.expectedBooks, len(response.Books))
				assert.Equal(t, tt.expectedPapers, len(response.Papers))
			}
		})
	}
}

func TestSearchAuthors(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	handler := NewAuthorHandler(db)

	// Create test data
	books := []models.Book{
		{Title: "Book 1"},
		{Title: "Book 2"},
	}
	papers := []models.Paper{
		{Title: "Paper 1"},
		{Title: "Paper 2"},
	}

	for i := range books {
		db.Create(&books[i])
	}
	for i := range papers {
		db.Create(&papers[i])
	}

	// Create author associations
	bookAuthors := []models.BookAuthor{
		{BookID: books[0].ID, AuthorName: "John Doe"},
		{BookID: books[1].ID, AuthorName: "Jane Smith"},
	}
	paperAuthors := []models.PaperAuthor{
		{PaperID: papers[0].ID, AuthorName: "John Doe"},
		{PaperID: papers[1].ID, AuthorName: "Alice Johnson"},
	}

	for i := range bookAuthors {
		db.Create(&bookAuthors[i])
	}
	for i := range paperAuthors {
		db.Create(&paperAuthors[i])
	}

	// Test cases
	tests := []struct {
		name           string
		query          string
		expectedStatus int
		expectedCount  int
	}{
		{
			name:           "Search by first name",
			query:          "John",
			expectedStatus: http.StatusOK,
			expectedCount:  1,
		},
		{
			name:           "Search by last name",
			query:          "Smith",
			expectedStatus: http.StatusOK,
			expectedCount:  1,
		},
		{
			name:           "Search with no results",
			query:          "Nonexistent",
			expectedStatus: http.StatusOK,
			expectedCount:  0,
		},
		{
			name:           "Empty query",
			query:          "",
			expectedStatus: http.StatusOK,
			expectedCount:  3, // All authors when no query
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create request
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest("GET", "/?query="+tt.query, bytes.NewBufferString(""))

			// Call handler
			handler.SearchAuthors(c)

			// Assert response
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusOK {
				var response struct {
					Authors []AuthorResponse `json:"authors"`
				}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Equal(t, tt.expectedCount, len(response.Authors))
			}
		})
	}
}

func setupTestDB(t *testing.T) *gorm.DB {
	config := getTestConfig()
	db, err := setupMySQLTestDB(config)
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	// Clean up after test
	t.Cleanup(func() {
		cleanupTestData(db)
		cleanupTestDatabase(config)
	})

	return db
}
