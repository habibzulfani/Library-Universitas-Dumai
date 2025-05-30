package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"e-repository-api/configs"
	"e-repository-api/internal/database"
	"e-repository-api/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type BookHandler struct {
	config *configs.Config
}

func NewBookHandler(config *configs.Config) *BookHandler {
	return &BookHandler{config: config}
}

// CreateBook handles book creation with file upload
func (h *BookHandler) CreateBook(c *gin.Context) {
	var book models.Book
	
	// Parse multipart form
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil { // 32MB max
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	// Extract form fields
	book.Title = c.PostForm("title")
	book.Author = c.PostForm("author")
	
	// Handle optional string fields (convert to pointers)
	if publisher := c.PostForm("publisher"); publisher != "" {
		book.Publisher = &publisher
	}
	if subject := c.PostForm("subject"); subject != "" {
		book.Subject = &subject
	}
	if language := c.PostForm("language"); language != "" {
		book.Language = &language
	}
	if summary := c.PostForm("summary"); summary != "" {
		book.Summary = &summary
	}
	if isbn := c.PostForm("isbn"); isbn != "" {
		book.ISBN = &isbn
	}

	// Parse numeric fields (convert to *int64)
	if yearStr := c.PostForm("published_year"); yearStr != "" {
		if year, err := strconv.Atoi(yearStr); err == nil {
			book.PublishedYear = &year
		}
	}
	if pagesStr := c.PostForm("pages"); pagesStr != "" {
		if pages, err := strconv.Atoi(pagesStr); err == nil {
			book.Pages = &pages
		}
	}

	// Set created_by from authenticated user (admin context)
	if userID, exists := c.Get("user_id"); exists {
		if uid, ok := userID.(uint); ok {
			book.CreatedBy = &uid
		}
	}

	// Validate required fields
	if book.Title == "" || book.Author == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title and author are required"})
		return
	}

	// Handle file upload
	file, header, err := c.Request.FormFile("file")
	if err == nil {
		defer file.Close()

		// Create uploads directory if it doesn't exist
		uploadDir := "uploads/books"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}

		// Generate unique filename
		ext := filepath.Ext(header.Filename)
		filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strings.ReplaceAll(book.Title, " ", "_"), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(header, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		book.FileURL = &filePath
	}

	// Save to database
	if err := database.GetDB().Create(&book).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create book"})
		return
	}

	// Update book count
	database.GetDB().Model(&models.Counter{}).Where("name = ?", "total_books").UpdateColumn("count", gorm.Expr("count + 1"))

	c.JSON(http.StatusCreated, book)
}

// CreateUserBook handles user book creation with file upload
func (h *BookHandler) CreateUserBook(c *gin.Context) {
	var book models.Book
	
	// Parse multipart form
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil { // 32MB max
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	// Extract form fields
	book.Title = c.PostForm("title")
	book.Author = c.PostForm("author")
	
	// Handle optional string fields (convert to pointers)
	if publisher := c.PostForm("publisher"); publisher != "" {
		book.Publisher = &publisher
	}
	if subject := c.PostForm("subject"); subject != "" {
		book.Subject = &subject
	}
	if language := c.PostForm("language"); language != "" {
		book.Language = &language
	}
	if summary := c.PostForm("summary"); summary != "" {
		book.Summary = &summary
	}
	if isbn := c.PostForm("isbn"); isbn != "" {
		book.ISBN = &isbn
	}

	// Parse numeric fields (convert to *int64)
	if yearStr := c.PostForm("published_year"); yearStr != "" {
		if year, err := strconv.Atoi(yearStr); err == nil {
			book.PublishedYear = &year
		}
	}
	if pagesStr := c.PostForm("pages"); pagesStr != "" {
		if pages, err := strconv.Atoi(pagesStr); err == nil {
			book.Pages = &pages
		}
	}

	// Set created_by from authenticated user
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	if uid, ok := userID.(uint); ok {
		book.CreatedBy = &uid
	}

	// Validate required fields
	if book.Title == "" || book.Author == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title and author are required"})
		return
	}

	// Handle file upload
	file, header, err := c.Request.FormFile("file")
	if err == nil {
		defer file.Close()

		// Create uploads directory if it doesn't exist
		uploadDir := "uploads/books"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}

		// Generate unique filename
		ext := filepath.Ext(header.Filename)
		filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strings.ReplaceAll(book.Title, " ", "_"), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(header, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		book.FileURL = &filePath
	}

	// Save to database
	if err := database.GetDB().Create(&book).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create book"})
		return
	}

	// Update book count
	database.GetDB().Model(&models.Counter{}).Where("name = ?", "total_books").UpdateColumn("count", gorm.Expr("count + 1"))

	c.JSON(http.StatusCreated, book)
}

// GetBooks handles book listing with pagination and search
func (h *BookHandler) GetBooks(c *gin.Context) {
	var req models.SearchRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set defaults
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.Limit <= 0 {
		req.Limit = 10
	}
	if req.Limit > 100 {
		req.Limit = 100
	}

	query := database.GetDB().Model(&models.Book{}).Unscoped()
	
	// Search functionality
	if req.Query != "" {
		searchTerm := "%" + strings.ToLower(req.Query) + "%"
		query = query.Where("LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(summary) LIKE ?", 
			searchTerm, searchTerm, searchTerm)
	}

	// Category filter
	if req.Category != "" {
		query = query.Joins("JOIN book_categories ON books.id = book_categories.book_id").
			Joins("JOIN categories ON book_categories.category_id = categories.id").
			Where("categories.name = ?", req.Category)
	}

	// Year filter
	if req.Year != nil {
		query = query.Where("published_year = ?", *req.Year)
	}

	// Count total using raw SQL to avoid soft delete issues
	var total int64
	countSQL := "SELECT COUNT(*) FROM books WHERE 1=1"
	var countArgs []interface{}
	
	// Apply the same filters to count query
	if req.Query != "" {
		searchTerm := "%" + strings.ToLower(req.Query) + "%"
		countSQL += " AND (LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(summary) LIKE ?)"
		countArgs = append(countArgs, searchTerm, searchTerm, searchTerm)
	}
	if req.Category != "" {
		countSQL += " AND id IN (SELECT book_id FROM book_categories bc JOIN categories c ON bc.category_id = c.id WHERE c.name = ?)"
		countArgs = append(countArgs, req.Category)
	}
	if req.Year != nil {
		countSQL += " AND published_year = ?"
		countArgs = append(countArgs, *req.Year)
	}
	
	database.GetDB().Raw(countSQL, countArgs...).Scan(&total)

	// Get books with pagination
	var books []models.Book
	offset := (req.Page - 1) * req.Limit
	if err := query.Offset(offset).Limit(req.Limit).Find(&books).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch books"})
		return
	}

	totalPages := int((total + int64(req.Limit) - 1) / int64(req.Limit))

	response := models.PaginatedResponse{
		Data:       books,
		Total:      total,
		Page:       req.Page,
		Limit:      req.Limit,
		TotalPages: totalPages,
	}

	c.JSON(http.StatusOK, response)
}

// GetUserBooks handles getting books created by the authenticated user
func (h *BookHandler) GetUserBooks(c *gin.Context) {
	var req models.SearchRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get authenticated user ID
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	uid, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	// Set defaults
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.Limit <= 0 {
		req.Limit = 10
	}
	if req.Limit > 100 {
		req.Limit = 100
	}

	query := database.GetDB().Model(&models.Book{}).Unscoped().Where("created_by = ?", uid)
	
	// Search functionality
	if req.Query != "" {
		searchTerm := "%" + strings.ToLower(req.Query) + "%"
		query = query.Where("LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(summary) LIKE ?", 
			searchTerm, searchTerm, searchTerm)
	}

	// Category filter
	if req.Category != "" {
		query = query.Joins("JOIN book_categories ON books.id = book_categories.book_id").
			Joins("JOIN categories ON book_categories.category_id = categories.id").
			Where("categories.name = ?", req.Category)
	}

	// Year filter
	if req.Year != nil {
		query = query.Where("published_year = ?", *req.Year)
	}

	// Count total using raw SQL to avoid soft delete issues
	var total int64
	countSQL := "SELECT COUNT(*) FROM books WHERE 1=1"
	var countArgs []interface{}
	
	// Apply the same filters to count query
	if req.Query != "" {
		searchTerm := "%" + strings.ToLower(req.Query) + "%"
		countSQL += " AND (LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(summary) LIKE ?)"
		countArgs = append(countArgs, searchTerm, searchTerm, searchTerm)
	}
	if req.Category != "" {
		countSQL += " AND id IN (SELECT book_id FROM book_categories bc JOIN categories c ON bc.category_id = c.id WHERE c.name = ?)"
		countArgs = append(countArgs, req.Category)
	}
	if req.Year != nil {
		countSQL += " AND published_year = ?"
		countArgs = append(countArgs, *req.Year)
	}
	
	database.GetDB().Raw(countSQL, countArgs...).Scan(&total)

	// Get books with pagination
	var books []models.Book
	offset := (req.Page - 1) * req.Limit
	if err := query.Offset(offset).Limit(req.Limit).Find(&books).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch books"})
		return
	}

	totalPages := int((total + int64(req.Limit) - 1) / int64(req.Limit))

	response := models.PaginatedResponse{
		Data:       books,
		Total:      total,
		Page:       req.Page,
		Limit:      req.Limit,
		TotalPages: totalPages,
	}

	c.JSON(http.StatusOK, response)
}

// GetBook handles getting a single book by ID
func (h *BookHandler) GetBook(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	var book models.Book
	if err := database.GetDB().Unscoped().Preload("Categories").Preload("Authors").First(&book, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch book"})
		return
	}

	c.JSON(http.StatusOK, book)
}

// UpdateUserBook handles user book updates with file upload
func (h *BookHandler) UpdateUserBook(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	// Get authenticated user ID
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	uid, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	var book models.Book
	if err := database.GetDB().Unscoped().Where("id = ? AND created_by = ?", uint(id), uid).First(&book).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Book not found or you don't have permission to edit it"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch book"})
		return
	}

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil { // 32MB max
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	// Update form fields if provided
	if title := c.PostForm("title"); title != "" {
		book.Title = title
	}
	if author := c.PostForm("author"); author != "" {
		book.Author = author
	}

	// Handle optional string fields
	if publisher := c.PostForm("publisher"); publisher != "" {
		book.Publisher = &publisher
	}
	if subject := c.PostForm("subject"); subject != "" {
		book.Subject = &subject
	}
	if language := c.PostForm("language"); language != "" {
		book.Language = &language
	}
	if summary := c.PostForm("summary"); summary != "" {
		book.Summary = &summary
	}
	if isbn := c.PostForm("isbn"); isbn != "" {
		book.ISBN = &isbn
	}

	// Parse numeric fields
	if yearStr := c.PostForm("published_year"); yearStr != "" {
		if year, err := strconv.Atoi(yearStr); err == nil {
			book.PublishedYear = &year
		}
	}
	if pagesStr := c.PostForm("pages"); pagesStr != "" {
		if pages, err := strconv.Atoi(pagesStr); err == nil {
			book.Pages = &pages
		}
	}

	// Handle file upload
	file, header, err := c.Request.FormFile("file")
	if err == nil {
		defer file.Close()

		// Create uploads directory if it doesn't exist
		uploadDir := "uploads/books"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}

		// Generate unique filename
		ext := filepath.Ext(header.Filename)
		filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strings.ReplaceAll(book.Title, " ", "_"), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(header, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		// Remove old file if exists
		if book.FileURL != nil && *book.FileURL != "" {
			os.Remove(*book.FileURL)
		}

		book.FileURL = &filePath
	}

	// Save updates to database
	if err := database.GetDB().Save(&book).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update book"})
		return
	}

	c.JSON(http.StatusOK, book)
}

// DeleteUserBook handles user book deletion
func (h *BookHandler) DeleteUserBook(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	// Get authenticated user ID
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	uid, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	var book models.Book
	if err := database.GetDB().Unscoped().Where("id = ? AND created_by = ?", uint(id), uid).First(&book).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Book not found or you don't have permission to delete it"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch book"})
		return
	}

	if err := database.GetDB().Delete(&book).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete book"})
		return
	}

	// Update book count
	database.GetDB().Model(&models.Counter{}).Where("name = ?", "total_books").UpdateColumn("count", gorm.Expr("count - 1"))

	c.JSON(http.StatusOK, gin.H{"message": "Book deleted successfully"})
}

// DownloadBook handles book download requests
func (h *BookHandler) DownloadBook(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	var book models.Book
	if err := database.GetDB().Unscoped().First(&book, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch book"})
		return
	}

	if book.FileURL == nil || *book.FileURL == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not available"})
		return
	}

	// Log download activity
	var userID *uint
	if user, exists := c.Get("user_id"); exists {
		if uid, ok := user.(uint); ok {
			userID = &uid
		}
	}

	clientIP := c.ClientIP()
	userAgent := c.Request.UserAgent()
	download := models.Download{
		UserID:       userID,
		ItemID:       book.ID,
		ItemType:     "book",
		IPAddress:    &clientIP,
		UserAgent:    &userAgent,
		DownloadedAt: time.Now(),
	}

	database.GetDB().Create(&download)

	// Update download counter
	database.GetDB().Model(&models.Counter{}).Where("name = ?", "total_downloads").UpdateColumn("count", gorm.Expr("count + 1"))

	// Serve the file directly
	filePath := *book.FileURL
	
	// Extract file extension from the stored file path
	ext := filepath.Ext(filePath)
	filename := book.Title
	if ext != "" {
		filename = filename + ext
	}
	
	// Set appropriate headers for file download
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	c.Header("Content-Type", "application/octet-stream")
	
	// Serve the file
	c.File(filePath)
}

// UpdateBook handles admin book updates with file upload
func (h *BookHandler) UpdateBook(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	var book models.Book
	if err := database.GetDB().Unscoped().First(&book, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch book"})
		return
	}

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil { // 32MB max
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	// Update form fields if provided
	if title := c.PostForm("title"); title != "" {
		book.Title = title
	}
	if author := c.PostForm("author"); author != "" {
		book.Author = author
	}

	// Handle optional string fields
	if publisher := c.PostForm("publisher"); publisher != "" {
		book.Publisher = &publisher
	}
	if subject := c.PostForm("subject"); subject != "" {
		book.Subject = &subject
	}
	if language := c.PostForm("language"); language != "" {
		book.Language = &language
	}
	if summary := c.PostForm("summary"); summary != "" {
		book.Summary = &summary
	}
	if isbn := c.PostForm("isbn"); isbn != "" {
		book.ISBN = &isbn
	}

	// Parse numeric fields
	if yearStr := c.PostForm("published_year"); yearStr != "" {
		if year, err := strconv.Atoi(yearStr); err == nil {
			book.PublishedYear = &year
		}
	}
	if pagesStr := c.PostForm("pages"); pagesStr != "" {
		if pages, err := strconv.Atoi(pagesStr); err == nil {
			book.Pages = &pages
		}
	}

	// Handle file upload
	file, header, err := c.Request.FormFile("file")
	if err == nil {
		defer file.Close()

		// Create uploads directory if it doesn't exist
		uploadDir := "uploads/books"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}

		// Generate unique filename
		ext := filepath.Ext(header.Filename)
		filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strings.ReplaceAll(book.Title, " ", "_"), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(header, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		// Remove old file if exists
		if book.FileURL != nil && *book.FileURL != "" {
			os.Remove(*book.FileURL)
		}

		book.FileURL = &filePath
	}

	// Save updates to database
	if err := database.GetDB().Save(&book).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update book"})
		return
	}

	c.JSON(http.StatusOK, book)
}

// DeleteBook handles admin book deletion (soft delete)
func (h *BookHandler) DeleteBook(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	var book models.Book
	if err := database.GetDB().Unscoped().First(&book, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch book"})
		return
	}

	if err := database.GetDB().Delete(&book).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete book"})
		return
	}

	// Update book count
	database.GetDB().Model(&models.Counter{}).Where("name = ?", "total_books").UpdateColumn("count", gorm.Expr("count - 1"))

	c.JSON(http.StatusOK, gin.H{"message": "Book deleted successfully"})
} 