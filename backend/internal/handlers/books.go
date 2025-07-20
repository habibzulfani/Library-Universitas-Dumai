package handlers

import (
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"e-repository-api/configs"
	"e-repository-api/internal/models"
	"e-repository-api/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type BookHandler struct {
	db     *gorm.DB
	config *configs.Config
}

func NewBookHandler(db *gorm.DB, config *configs.Config) *BookHandler {
	return &BookHandler{
		db:     db,
		config: config,
	}
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

	// Get authors from form data
	authors := c.PostFormArray("authors[]")
	log.Printf("Received authors array: %v", authors)
	if len(authors) == 0 {
		// Fallback to single author if no authors array is provided
		if author := c.PostForm("author"); author != "" {
			authors = []string{author}
			log.Printf("Fallback to single author: %s", author)
		}
	}
	log.Printf("Final authors array: %v", authors)

	// Validate required fields
	if book.Title == "" || len(authors) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title and at least one author are required"})
		return
	}

	// Set the first author as the main author in the books table
	book.Author = authors[0]

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
		book.Pages = &pagesStr
	}

	// Set created_by from authenticated user (admin context)
	if userID, exists := c.Get("user_id"); exists {
		if uid, ok := userID.(uint); ok {
			book.CreatedBy = &uid
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

		// Save file paths relative to uploads directory
		fileURL := fmt.Sprintf("/uploads/books/%s", filepath.Base(filePath))
		book.FileURL = &fileURL
	}

	// Handle cover image upload
	coverFile, coverHeader, err := c.Request.FormFile("cover_image")
	if err == nil {
		defer coverFile.Close()

		// Create uploads directory if it doesn't exist
		uploadDir := "uploads/covers"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}

		// Generate unique filename
		ext := filepath.Ext(coverHeader.Filename)
		filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strings.ReplaceAll(book.Title, " ", "_"), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(coverHeader, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save cover image"})
			return
		}

		// Save file paths relative to uploads directory
		coverImageURL := fmt.Sprintf("/uploads/covers/%s", filepath.Base(filePath))
		book.CoverImageURL = &coverImageURL
	}

	// Start a transaction
	tx := h.db.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}

	// Save book to database
	if err := tx.Create(&book).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create book"})
		return
	}

	// Create book authors
	for _, authorName := range authors {
		bookAuthor := models.BookAuthor{
			BookID:     book.ID,
			AuthorName: authorName,
			UserID:     book.CreatedBy,
		}
		if err := tx.Create(&bookAuthor).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create book authors"})
			return
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Update book count
	h.db.Model(&models.Counter{}).Where("name = ?", "total_books").UpdateColumn("count", gorm.Expr("count + 1"))

	// Load authors for response
	h.db.Preload("Authors").First(&book, book.ID)

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

	// Get authors from form data
	authors := c.PostFormArray("authors[]")
	log.Printf("Received authors array: %v", authors)
	if len(authors) == 0 {
		// Fallback to single author if no authors array is provided
		if author := c.PostForm("author"); author != "" {
			authors = []string{author}
			log.Printf("Fallback to single author: %s", author)
		}
	}
	log.Printf("Final authors array: %v", authors)

	// Validate required fields
	if book.Title == "" || len(authors) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title and at least one author are required"})
		return
	}

	// Set the first author as the main author in the books table
	book.Author = authors[0]

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
		book.Pages = &pagesStr
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

		// Save file paths relative to uploads directory
		fileURL := fmt.Sprintf("/uploads/books/%s", filepath.Base(filePath))
		book.FileURL = &fileURL
	}

	// Handle cover image upload
	coverFile, coverHeader, err := c.Request.FormFile("cover_image")
	if err == nil {
		defer coverFile.Close()

		// Create uploads directory if it doesn't exist
		uploadDir := "uploads/covers"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}

		// Generate unique filename
		ext := filepath.Ext(coverHeader.Filename)
		filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strings.ReplaceAll(book.Title, " ", "_"), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(coverHeader, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save cover image"})
			return
		}

		// Save file paths relative to uploads directory
		coverImageURL := fmt.Sprintf("/uploads/covers/%s", filepath.Base(filePath))
		book.CoverImageURL = &coverImageURL
	}

	// Start a transaction
	tx := h.db.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}

	// Save book to database
	if err := tx.Create(&book).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create book"})
		return
	}

	// Create book authors
	for _, authorName := range authors {
		bookAuthor := models.BookAuthor{
			BookID:     book.ID,
			AuthorName: authorName,
			UserID:     book.CreatedBy,
		}
		if err := tx.Create(&bookAuthor).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create book authors"})
			return
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Update book count
	h.db.Model(&models.Counter{}).Where("name = ?", "total_books").UpdateColumn("count", gorm.Expr("count + 1"))

	// Load authors for response
	h.db.Preload("Authors").First(&book, book.ID)

	c.JSON(http.StatusCreated, book)
}

// GetBooks handles book listing with pagination and search
func (h *BookHandler) GetBooks(c *gin.Context) {
	var req models.SearchRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Support both 'query' and 'search' as search parameters
	q := req.Query
	if q == "" {
		q = c.Query("search")
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

	query := h.db.Model(&models.Book{}).Unscoped()

	// Search functionality
	if q != "" {
		searchTerm := "%" + strings.ToLower(q) + "%"
		query = query.Where("LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(summary) LIKE ? OR LOWER(isbn) LIKE ? OR CAST(published_year AS CHAR) LIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
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

	// After year filter
	if createdBy := c.Query("created_by"); createdBy != "" {
		query = query.Where("created_by = ?", createdBy)
	}

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get total count"})
		return
	}

	// Get paginated results
	var books []models.Book
	offset := (req.Page - 1) * req.Limit

	// Handle sorting
	if req.Sort != "" {
		sortParts := strings.Split(req.Sort, ":")
		if len(sortParts) == 2 {
			field := sortParts[0]
			direction := strings.ToUpper(sortParts[1])
			if direction == "DESC" || direction == "ASC" {
				query = query.Order(fmt.Sprintf("%s %s", field, direction))
			}
		}
	} else {
		// Default sorting by created_at desc
		query = query.Order("created_at DESC")
	}

	if err := query.Preload("Authors").Offset(offset).Limit(req.Limit).Find(&books).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get books"})
		return
	}

	// Format each book to include authors array like GetBook
	var formattedBooks []gin.H
	for _, book := range books {
		item := gin.H{
			"id":              book.ID,
			"title":           book.Title,
			"author":          book.Author,
			"authors":         make([]gin.H, 0),
			"publisher":       book.Publisher,
			"published_year":  book.PublishedYear,
			"isbn":            book.ISBN,
			"subject":         book.Subject,
			"language":        book.Language,
			"pages":           book.Pages,
			"summary":         book.Summary,
			"file_url":        book.FileURL,
			"cover_image_url": book.CoverImageURL,
			"created_by":      book.CreatedBy,
			"created_at":      book.CreatedAt,
			"updated_at":      book.UpdatedAt,
		}
		for _, author := range book.Authors {
			item["authors"] = append(item["authors"].([]gin.H), gin.H{
				"id":          author.ID,
				"author_name": author.AuthorName,
			})
		}
		// Convert file URLs to full URLs if they exist
		if book.FileURL != nil {
			fileURL := *book.FileURL
			if !strings.HasPrefix(fileURL, "http") {
				fileURL = fmt.Sprintf("%s%s", h.config.Server.BaseURL, fileURL)
				item["file_url"] = fileURL
			}
		}
		if book.CoverImageURL != nil {
			coverURL := *book.CoverImageURL
			if !strings.HasPrefix(coverURL, "http") {
				coverURL = fmt.Sprintf("%s%s", h.config.Server.BaseURL, coverURL)
				item["cover_image_url"] = coverURL
			}
		}
		formattedBooks = append(formattedBooks, item)
	}

	c.JSON(http.StatusOK, gin.H{
		"total":       total,
		"page":        req.Page,
		"limit":       req.Limit,
		"total_pages": int(math.Ceil(float64(total) / float64(req.Limit))),
		"data":        formattedBooks,
	})
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

	// Support both 'query' and 'search' as search parameters
	q := req.Query
	if q == "" {
		q = c.Query("search")
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

	query := h.db.Model(&models.Book{}).Unscoped().Where("created_by = ?", uid)

	// Search functionality
	if q != "" {
		searchTerm := "%" + strings.ToLower(q) + "%"
		query = query.Where("LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(summary) LIKE ? OR LOWER(isbn) LIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm)
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

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get total count"})
		return
	}

	// Get paginated results
	var books []models.Book
	offset := (req.Page - 1) * req.Limit
	if err := query.Preload("Authors").Offset(offset).Limit(req.Limit).Find(&books).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get books"})
		return
	}

	// Format each book to include authors array like GetBook
	var formattedBooks []gin.H
	for _, book := range books {
		item := gin.H{
			"id":              book.ID,
			"title":           book.Title,
			"author":          book.Author,
			"authors":         make([]gin.H, 0),
			"publisher":       book.Publisher,
			"published_year":  book.PublishedYear,
			"isbn":            book.ISBN,
			"subject":         book.Subject,
			"language":        book.Language,
			"pages":           book.Pages,
			"summary":         book.Summary,
			"file_url":        book.FileURL,
			"cover_image_url": book.CoverImageURL,
			"created_by":      book.CreatedBy,
			"created_at":      book.CreatedAt,
			"updated_at":      book.UpdatedAt,
		}
		for _, author := range book.Authors {
			item["authors"] = append(item["authors"].([]gin.H), gin.H{
				"id":          author.ID,
				"author_name": author.AuthorName,
			})
		}
		// Convert file URLs to full URLs if they exist
		if book.FileURL != nil {
			fileURL := *book.FileURL
			if !strings.HasPrefix(fileURL, "http") {
				fileURL = fmt.Sprintf("%s%s", h.config.Server.BaseURL, fileURL)
				item["file_url"] = fileURL
			}
		}
		if book.CoverImageURL != nil {
			coverURL := *book.CoverImageURL
			if !strings.HasPrefix(coverURL, "http") {
				coverURL = fmt.Sprintf("%s%s", h.config.Server.BaseURL, coverURL)
				item["cover_image_url"] = coverURL
			}
		}
		formattedBooks = append(formattedBooks, item)
	}

	c.JSON(http.StatusOK, gin.H{
		"total":       total,
		"page":        req.Page,
		"limit":       req.Limit,
		"total_pages": int(math.Ceil(float64(total) / float64(req.Limit))),
		"data":        formattedBooks,
	})
}

// GetBook handles getting a single book by ID
func (h *BookHandler) GetBook(c *gin.Context) {
	id := c.Param("id")
	var book models.Book

	// Load book with its authors
	if err := h.db.Unscoped().Preload("Authors").First(&book, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	// Format the response to include authors array
	response := gin.H{
		"id":              book.ID,
		"title":           book.Title,
		"author":          book.Author,
		"authors":         make([]gin.H, 0),
		"publisher":       book.Publisher,
		"published_year":  book.PublishedYear,
		"isbn":            book.ISBN,
		"subject":         book.Subject,
		"language":        book.Language,
		"pages":           book.Pages,
		"summary":         book.Summary,
		"file_url":        book.FileURL,
		"cover_image_url": book.CoverImageURL,
		"created_by":      book.CreatedBy,
		"created_at":      book.CreatedAt,
		"updated_at":      book.UpdatedAt,
	}

	// Add authors to the response
	for _, author := range book.Authors {
		response["authors"] = append(response["authors"].([]gin.H), gin.H{
			"id":          author.ID,
			"author_name": author.AuthorName,
		})
	}

	// Convert file URLs to full URLs if they exist
	if book.FileURL != nil {
		fileURL := *book.FileURL
		if !strings.HasPrefix(fileURL, "http") {
			fileURL = fmt.Sprintf("%s%s", h.config.Server.BaseURL, fileURL)
			response["file_url"] = fileURL
		}
	}

	if book.CoverImageURL != nil {
		coverURL := *book.CoverImageURL
		if !strings.HasPrefix(coverURL, "http") {
			coverURL = fmt.Sprintf("%s%s", h.config.Server.BaseURL, coverURL)
			response["cover_image_url"] = coverURL
		}
	}

	c.JSON(http.StatusOK, response)
}

// UpdateUserBook handles user book updates with file upload
func (h *BookHandler) UpdateUserBook(c *gin.Context) {
	id := c.Param("id")
	var book models.Book

	// Check if book exists and belongs to user
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	if err := h.db.Unscoped().Preload("Authors").First(&book, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	if book.CreatedBy == nil || *book.CreatedBy != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to update this book"})
		return
	}

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil { // 32MB max
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	// Update fields
	if title := c.PostForm("title"); title != "" {
		book.Title = title
	}

	// Get authors from form data
	authors := c.PostFormArray("authors[]")
	if len(authors) == 0 {
		// Fallback to single author if no authors array is provided
		if author := c.PostForm("author"); author != "" {
			authors = []string{author}
		} else {
			// If no new authors provided, use existing authors
			authors = make([]string, len(book.Authors))
			for i, author := range book.Authors {
				authors[i] = author.AuthorName
			}
		}
	}

	// Validate required fields
	if book.Title == "" || len(authors) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title and at least one author are required"})
		return
	}

	// Set the first author as the main author in the books table
	book.Author = authors[0]

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
		book.Pages = &pagesStr
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

		// Delete old file if exists and not referenced by other books
		if book.FileURL != nil {
			utils.DeleteFileIfUnreferenced(h.db, "books", "file_url", *book.FileURL, book.ID)
		}

		// Save file paths relative to uploads directory
		fileURL := fmt.Sprintf("/uploads/books/%s", filepath.Base(filePath))
		book.FileURL = &fileURL
	}

	// Handle cover image upload
	coverFile, coverHeader, err := c.Request.FormFile("cover_image")
	if err == nil {
		defer coverFile.Close()

		// Create uploads directory if it doesn't exist
		uploadDir := "uploads/covers"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}

		// Generate unique filename
		ext := filepath.Ext(coverHeader.Filename)
		filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strings.ReplaceAll(book.Title, " ", "_"), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(coverHeader, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save cover image"})
			return
		}

		// Delete old cover if exists and not referenced by other books
		if book.CoverImageURL != nil {
			utils.DeleteFileIfUnreferenced(h.db, "books", "cover_image_url", *book.CoverImageURL, book.ID)
		}

		// Save file paths relative to uploads directory
		coverImageURL := fmt.Sprintf("/uploads/covers/%s", filepath.Base(filePath))
		book.CoverImageURL = &coverImageURL
	}

	// Start a transaction
	tx := h.db.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}

	// Update book
	if err := tx.Save(&book).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update book"})
		return
	}

	// Delete existing authors
	if err := tx.Where("book_id = ?", book.ID).Delete(&models.BookAuthor{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete existing authors"})
		return
	}

	// Create new book authors
	for _, authorName := range authors {
		bookAuthor := models.BookAuthor{
			BookID:     book.ID,
			AuthorName: authorName,
			UserID:     book.CreatedBy,
		}
		if err := tx.Create(&bookAuthor).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create book authors"})
			return
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Load authors for response
	h.db.Preload("Authors").First(&book, book.ID)

	c.JSON(http.StatusOK, book)
}

// DeleteUserBook handles user book deletion
func (h *BookHandler) DeleteUserBook(c *gin.Context) {
	id := c.Param("id")
	var book models.Book

	// Check if book exists and belongs to user
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	if err := h.db.Unscoped().First(&book, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	if book.CreatedBy == nil || *book.CreatedBy != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to delete this book"})
		return
	}

	// Delete file if exists and not referenced by other books
	if book.FileURL != nil {
		utils.DeleteFileIfUnreferenced(h.db, "books", "file_url", *book.FileURL, book.ID)
	}
	// Delete cover image if exists and not referenced by other books
	if book.CoverImageURL != nil {
		utils.DeleteFileIfUnreferenced(h.db, "books", "cover_image_url", *book.CoverImageURL, book.ID)
	}

	// Delete from database
	if err := h.db.Delete(&book).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete book"})
		return
	}

	// Update book count
	h.db.Model(&models.Counter{}).Where("name = ?", "total_books").UpdateColumn("count", gorm.Expr("count - 1"))

	c.JSON(http.StatusOK, gin.H{"message": "Book deleted successfully"})
}

// DownloadBook handles book download requests
func (h *BookHandler) DownloadBook(c *gin.Context) {
	id := c.Param("id")
	var book models.Book

	// Check if book exists
	if err := h.db.Unscoped().First(&book, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	// Check if file exists
	if book.FileURL == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book file not found"})
		return
	}

	// Check if user is authenticated (optional for public downloads)
	userIDVal, exists := c.Get("user_id")
	var userID *uint
	if exists {
		uid := userIDVal.(uint)
		userID = &uid
	}

	// Log the download
	download := models.Download{
		UserID:       userID,
		ItemID:       book.ID,
		ItemType:     "book",
		IPAddress:    nil,
		UserAgent:    nil,
		DownloadedAt: time.Now(),
	}
	if ip := c.ClientIP(); ip != "" {
		ipCopy := ip
		download.IPAddress = &ipCopy
	}
	if ua := c.Request.UserAgent(); ua != "" {
		uaCopy := ua
		download.UserAgent = &uaCopy
	}
	h.db.Create(&download)

	// Extract the file path from the URL
	filePath := *book.FileURL
	log.Printf("Original FileURL: %s", filePath)
	log.Printf("BaseURL: %s", h.config.Server.BaseURL)

	// Handle different URL formats
	if strings.HasPrefix(filePath, "http") {
		// Full URL - extract the path
		if strings.HasPrefix(filePath, h.config.Server.BaseURL) {
			filePath = strings.TrimPrefix(filePath, h.config.Server.BaseURL)
			filePath = strings.TrimPrefix(filePath, "/")
		}
	} else if strings.HasPrefix(filePath, "/") {
		// Absolute path - remove leading slash to make it relative
		filePath = strings.TrimPrefix(filePath, "/")
	}

	log.Printf("Extracted filePath: %s", filePath)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		log.Printf("File does not exist: %s", filePath)
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found on disk"})
		return
	}

	// Set the Content-Disposition header
	filename := filepath.Base(filePath)
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))

	log.Printf("Serving file: %s", filePath)
	// Serve the file
	c.File(filePath)
}

// UpdateBook handles book updates with file upload
func (h *BookHandler) UpdateBook(c *gin.Context) {
	id := c.Param("id")
	var book models.Book

	// Check if book exists
	if err := h.db.Unscoped().First(&book, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil { // 32MB max
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	// Update fields
	if title := c.PostForm("title"); title != "" {
		book.Title = title
	}

	// Get authors from form data
	authors := c.PostFormArray("authors[]")
	if len(authors) == 0 {
		// Fallback to single author if no authors array is provided
		if author := c.PostForm("author"); author != "" {
			authors = []string{author}
		}
	}

	// Validate required fields
	if book.Title == "" || len(authors) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title and at least one author are required"})
		return
	}

	// Set the first author as the main author in the books table
	book.Author = authors[0]

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
		book.Pages = &pagesStr
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

		// Delete old file if exists and not referenced by other books
		if book.FileURL != nil {
			utils.DeleteFileIfUnreferenced(h.db, "books", "file_url", *book.FileURL, book.ID)
		}

		// Save file paths relative to uploads directory
		fileURL := fmt.Sprintf("/uploads/books/%s", filepath.Base(filePath))
		book.FileURL = &fileURL
	}

	// Handle cover image upload
	coverFile, coverHeader, err := c.Request.FormFile("cover_image")
	if err == nil {
		defer coverFile.Close()

		// Create uploads directory if it doesn't exist
		uploadDir := "uploads/covers"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}

		// Generate unique filename
		ext := filepath.Ext(coverHeader.Filename)
		filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strings.ReplaceAll(book.Title, " ", "_"), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(coverHeader, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save cover image"})
			return
		}

		// Delete old cover if exists and not referenced by other books
		if book.CoverImageURL != nil {
			utils.DeleteFileIfUnreferenced(h.db, "books", "cover_image_url", *book.CoverImageURL, book.ID)
		}

		// Save file paths relative to uploads directory
		coverImageURL := fmt.Sprintf("/uploads/covers/%s", filepath.Base(filePath))
		book.CoverImageURL = &coverImageURL
	}

	// Start a transaction
	tx := h.db.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}

	// Update book
	if err := tx.Save(&book).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update book"})
		return
	}

	// Delete existing authors
	if err := tx.Where("book_id = ?", book.ID).Delete(&models.BookAuthor{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete existing authors"})
		return
	}

	// Create new book authors
	for _, authorName := range authors {
		bookAuthor := models.BookAuthor{
			BookID:     book.ID,
			AuthorName: authorName,
			UserID:     book.CreatedBy,
		}
		if err := tx.Create(&bookAuthor).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create book authors"})
			return
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Load authors for response
	h.db.Preload("Authors").First(&book, book.ID)

	c.JSON(http.StatusOK, book)
}

// DeleteBook handles admin book deletion (soft delete)
func (h *BookHandler) DeleteBook(c *gin.Context) {
	id := c.Param("id")
	var book models.Book

	// Check if book exists
	if err := h.db.Unscoped().First(&book, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	// Delete file if exists and not referenced by other books
	if book.FileURL != nil {
		utils.DeleteFileIfUnreferenced(h.db, "books", "file_url", *book.FileURL, book.ID)
	}
	// Delete cover image if exists and not referenced by other books
	if book.CoverImageURL != nil {
		utils.DeleteFileIfUnreferenced(h.db, "books", "cover_image_url", *book.CoverImageURL, book.ID)
	}

	// Delete from database
	if err := h.db.Delete(&book).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete book"})
		return
	}

	// Update book count
	h.db.Model(&models.Counter{}).Where("name = ?", "total_books").UpdateColumn("count", gorm.Expr("count - 1"))

	c.JSON(http.StatusOK, gin.H{"message": "Book deleted successfully"})
}

// GetAuthorWorks handles GET /api/authors/:name/works
func (h *BookHandler) GetAuthorWorks(c *gin.Context) {
	authorName := c.Param("name")
	if authorName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Author name is required"})
		return
	}

	// Query books by author
	var books []models.Book
	if err := h.db.Where("author LIKE ?", "%"+authorName+"%").Find(&books).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch author works"})
		return
	}

	// Convert file URLs to full URLs if they exist
	for i := range books {
		if books[i].FileURL != nil {
			fileURL := *books[i].FileURL
			if !strings.HasPrefix(fileURL, "http") {
				fileURL = fmt.Sprintf("%s%s", h.config.Server.BaseURL, fileURL)
				books[i].FileURL = &fileURL
			}
		}
		if books[i].CoverImageURL != nil {
			coverURL := *books[i].CoverImageURL
			if !strings.HasPrefix(coverURL, "http") {
				coverURL = fmt.Sprintf("%s%s", h.config.Server.BaseURL, coverURL)
				books[i].CoverImageURL = &coverURL
			}
		}
	}

	c.JSON(http.StatusOK, books)
}

// CiteBook handles citation logging for a book
func (h *BookHandler) CiteBook(c *gin.Context) {
	id := c.Param("id")
	var book models.Book

	// Check if book exists
	if err := h.db.Unscoped().First(&book, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	// Check if user is authenticated (optional for public citations)
	userIDVal, exists := c.Get("user_id")
	var userID *uint
	if exists {
		uid := userIDVal.(uint)
		userID = &uid
	}

	// Log the citation
	citation := models.Citation{
		UserID:   userID,
		ItemID:   book.ID,
		ItemType: "book",
		CitedAt:  time.Now(),
	}
	h.db.Create(&citation)

	c.JSON(http.StatusOK, gin.H{"message": "Citation logged"})
}
