package handlers

import (
	"net/http"
	"net/url"

	"e-repository-api/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AuthorResponse represents the response for author search
type AuthorResponse struct {
	Name       string `json:"name"`
	BookCount  int64  `json:"bookCount"`
	PaperCount int64  `json:"paperCount"`
}

// AuthorHandler handles author-related requests
type AuthorHandler struct {
	db *gorm.DB
}

// NewAuthorHandler creates a new author handler
func NewAuthorHandler(db *gorm.DB) *AuthorHandler {
	return &AuthorHandler{db: db}
}

// GetAuthorWorks handles requests to get all works by an author
func (h *AuthorHandler) GetAuthorWorks(c *gin.Context) {
	authorName := c.Param("name")

	// URL decode the author name
	decodedName, err := url.QueryUnescape(authorName)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid author name"})
		return
	}

	// Get books by author using book_authors table
	var books []models.Book
	if err := h.db.Joins("JOIN book_authors ON books.id = book_authors.book_id").
		Where("book_authors.author_name = ?", decodedName).
		Find(&books).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch books"})
		return
	}

	// Get papers by author using paper_authors table
	var papers []models.Paper
	if err := h.db.Joins("JOIN paper_authors ON papers.id = paper_authors.paper_id").
		Where("paper_authors.author_name = ?", decodedName).
		Find(&papers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch papers"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"name":   decodedName,
		"books":  books,
		"papers": papers,
	})
}

// SearchAuthors handles requests to search for authors
func (h *AuthorHandler) SearchAuthors(c *gin.Context) {
	query := c.Query("query")

	// URL decode the search query
	decodedQuery, err := url.QueryUnescape(query)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid search query"})
		return
	}

	// Get authors from books
	var bookAuthors []struct {
		AuthorName string
		Count      int64
	}
	if err := h.db.Model(&models.BookAuthor{}).
		Select("author_name, COUNT(*) as count").
		Where("author_name LIKE ?", "%"+decodedQuery+"%").
		Group("author_name").
		Find(&bookAuthors).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search book authors"})
		return
	}

	// Get authors from papers
	var paperAuthors []struct {
		AuthorName string
		Count      int64
	}
	if err := h.db.Model(&models.PaperAuthor{}).
		Select("author_name, COUNT(*) as count").
		Where("author_name LIKE ?", "%"+decodedQuery+"%").
		Group("author_name").
		Find(&paperAuthors).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search paper authors"})
		return
	}

	// Combine results
	authors := make(map[string]AuthorResponse)
	for _, ba := range bookAuthors {
		authors[ba.AuthorName] = AuthorResponse{
			Name:      ba.AuthorName,
			BookCount: ba.Count,
		}
	}
	for _, pa := range paperAuthors {
		if author, exists := authors[pa.AuthorName]; exists {
			author.PaperCount = pa.Count
			authors[pa.AuthorName] = author
		} else {
			authors[pa.AuthorName] = AuthorResponse{
				Name:       pa.AuthorName,
				PaperCount: pa.Count,
			}
		}
	}

	// Convert map to slice
	authorList := make([]AuthorResponse, 0, len(authors))
	for _, author := range authors {
		authorList = append(authorList, author)
	}

	c.JSON(http.StatusOK, gin.H{
		"authors": authorList,
	})
}

// GetAuthorDetail handles requests to get author details
func (h *AuthorHandler) GetAuthorDetail(c *gin.Context) {
	authorName := c.Param("name")
	if authorName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Author name is required"})
		return
	}

	// URL decode the author name
	decodedName, err := url.QueryUnescape(authorName)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid author name"})
		return
	}

	// Get books by author
	var books []models.Book
	if err := h.db.Joins("JOIN book_authors ON books.id = book_authors.book_id").
		Where("book_authors.author_name = ?", decodedName).
		Find(&books).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch books"})
		return
	}

	// Get papers by author
	var papers []models.Paper
	if err := h.db.Joins("JOIN paper_authors ON papers.id = paper_authors.paper_id").
		Where("paper_authors.author_name = ?", decodedName).
		Find(&papers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch papers"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"name":   decodedName,
		"books":  books,
		"papers": papers,
	})
}
