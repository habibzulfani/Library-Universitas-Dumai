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

type PaperHandler struct {
	db     *gorm.DB
	config *configs.Config
}

func NewPaperHandler(db *gorm.DB, config *configs.Config) *PaperHandler {
	return &PaperHandler{
		db:     db,
		config: config,
	}
}

// CreatePaper handles paper creation with file upload
func (h *PaperHandler) CreatePaper(c *gin.Context) {
	var paper models.Paper

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil { // 32MB max
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	// Extract form fields
	paper.Title = c.PostForm("title")
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

	// Handle optional string fields
	if advisor := c.PostForm("advisor"); advisor != "" {
		paper.Advisor = &advisor
	}
	if university := c.PostForm("university"); university != "" {
		paper.University = &university
	}
	if department := c.PostForm("department"); department != "" {
		paper.Department = &department
	}
	if abstract := c.PostForm("abstract"); abstract != "" {
		paper.Abstract = &abstract
	}
	if keywords := c.PostForm("keywords"); keywords != "" {
		paper.Keywords = &keywords
	}
	if journal := c.PostForm("journal"); journal != "" {
		paper.Journal = &journal
	}
	if issn := c.PostForm("issn"); issn != "" {
		paper.ISSN = &issn
	}
	if language := c.PostForm("language"); language != "" {
		paper.Language = &language
	}
	if doi := c.PostForm("doi"); doi != "" {
		paper.DOI = &doi
	}
	if pages := c.PostForm("pages"); pages != "" {
		paper.Pages = &pages
	}

	// Parse numeric fields
	if yearStr := c.PostForm("year"); yearStr != "" {
		if year, err := strconv.Atoi(yearStr); err == nil {
			paper.Year = &year
		}
	}
	if volumeStr := c.PostForm("volume"); volumeStr != "" {
		if volume, err := strconv.Atoi(volumeStr); err == nil {
			paper.Volume = &volume
		}
	}
	if issueStr := c.PostForm("issue"); issueStr != "" {
		if issue, err := strconv.Atoi(issueStr); err == nil {
			paper.Issue = &issue
		}
	}

	// Set created_by from authenticated user (admin context)
	if userID, exists := c.Get("user_id"); exists {
		if uid, ok := userID.(uint); ok {
			paper.CreatedBy = &uid
		}
	}

	// Validate required fields
	if paper.Title == "" || len(authors) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title and at least one author are required"})
		return
	}

	// Set the first author as the main author in the papers table
	paper.Author = authors[0]

	// Handle file upload
	file, header, err := c.Request.FormFile("file")
	if err == nil {
		defer file.Close()

		// Create uploads directory if it doesn't exist
		uploadDir := "uploads/papers"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}

		// Generate unique filename
		ext := filepath.Ext(header.Filename)
		filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strings.ReplaceAll(paper.Title, " ", "_"), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(header, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		// Save file paths relative to uploads directory
		fileURL := fmt.Sprintf("/uploads/papers/%s", filepath.Base(filePath))
		paper.FileURL = &fileURL
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
		filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strings.ReplaceAll(paper.Title, " ", "_"), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(coverHeader, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save cover image"})
			return
		}

		// Save file paths relative to uploads directory
		coverImageURL := fmt.Sprintf("/uploads/covers/%s", filepath.Base(filePath))
		paper.CoverImageURL = &coverImageURL
	}

	// Start a transaction
	tx := h.db.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}

	// Save paper
	if err := tx.Create(&paper).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create paper"})
		return
	}

	// Create paper authors
	for _, authorName := range authors {
		paperAuthor := models.PaperAuthor{
			PaperID:    paper.ID,
			AuthorName: authorName,
			UserID:     paper.CreatedBy,
		}
		if err := tx.Create(&paperAuthor).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create paper authors"})
			return
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Update paper count
	h.db.Model(&models.Counter{}).Where("name = ?", "total_papers").UpdateColumn("count", gorm.Expr("count + 1"))

	// Load authors for response
	h.db.Preload("Authors").First(&paper, paper.ID)

	c.JSON(http.StatusCreated, paper)
}

// CreateUserPaper handles user paper creation with file upload
func (h *PaperHandler) CreateUserPaper(c *gin.Context) {
	var paper models.Paper

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil { // 32MB max
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	// Extract form fields
	paper.Title = c.PostForm("title")
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

	// Handle optional string fields
	if advisor := c.PostForm("advisor"); advisor != "" {
		paper.Advisor = &advisor
	}
	if university := c.PostForm("university"); university != "" {
		paper.University = &university
	}
	if department := c.PostForm("department"); department != "" {
		paper.Department = &department
	}
	if abstract := c.PostForm("abstract"); abstract != "" {
		paper.Abstract = &abstract
	}
	if keywords := c.PostForm("keywords"); keywords != "" {
		paper.Keywords = &keywords
	}
	if journal := c.PostForm("journal"); journal != "" {
		paper.Journal = &journal
	}
	if issn := c.PostForm("issn"); issn != "" {
		paper.ISSN = &issn
	}
	if language := c.PostForm("language"); language != "" {
		paper.Language = &language
	}
	if doi := c.PostForm("doi"); doi != "" {
		paper.DOI = &doi
	}
	if pages := c.PostForm("pages"); pages != "" {
		paper.Pages = &pages
	}

	// Parse numeric fields
	if yearStr := c.PostForm("year"); yearStr != "" {
		if year, err := strconv.Atoi(yearStr); err == nil {
			paper.Year = &year
		}
	}
	if volumeStr := c.PostForm("volume"); volumeStr != "" {
		if volume, err := strconv.Atoi(volumeStr); err == nil {
			paper.Volume = &volume
		}
	}
	if issueStr := c.PostForm("issue"); issueStr != "" {
		if issue, err := strconv.Atoi(issueStr); err == nil {
			paper.Issue = &issue
		}
	}

	// Set created_by from authenticated user
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	if uid, ok := userID.(uint); ok {
		paper.CreatedBy = &uid
	}

	// Validate required fields
	if paper.Title == "" || len(authors) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title and at least one author are required"})
		return
	}

	// Set the first author as the main author in the papers table
	paper.Author = authors[0]

	// Handle file upload
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
		return
	}
	defer file.Close()

	// Create uploads directory if it doesn't exist
	uploadDir := "uploads/papers"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strings.ReplaceAll(paper.Title, " ", "_"), ext)
	filePath := filepath.Join(uploadDir, filename)

	// Save file
	if err := c.SaveUploadedFile(header, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Save file paths relative to uploads directory
	fileURL := fmt.Sprintf("/uploads/papers/%s", filepath.Base(filePath))
	paper.FileURL = &fileURL

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
		filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strings.ReplaceAll(paper.Title, " ", "_"), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(coverHeader, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save cover image"})
			return
		}

		// Save file paths relative to uploads directory
		coverImageURL := fmt.Sprintf("/uploads/covers/%s", filepath.Base(filePath))
		paper.CoverImageURL = &coverImageURL
	}

	// Start a transaction
	tx := h.db.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}

	// Save paper
	if err := tx.Create(&paper).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create paper"})
		return
	}

	// Create paper authors
	for _, authorName := range authors {
		paperAuthor := models.PaperAuthor{
			PaperID:    paper.ID,
			AuthorName: authorName,
			UserID:     paper.CreatedBy,
		}
		if err := tx.Create(&paperAuthor).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create paper authors"})
			return
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Update paper count
	h.db.Model(&models.Counter{}).Where("name = ?", "total_papers").UpdateColumn("count", gorm.Expr("count + 1"))

	// Load authors for response
	h.db.Preload("Authors").First(&paper, paper.ID)

	c.JSON(http.StatusCreated, paper)
}

// GetPapers handles paper listing with pagination and search
func (h *PaperHandler) GetPapers(c *gin.Context) {
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

	query := h.db.Model(&models.Paper{}).Unscoped()

	// Search functionality
	if q != "" {
		searchTerm := "%" + strings.ToLower(q) + "%"
		query = query.Where("LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(abstract) LIKE ? OR LOWER(keywords) LIKE ? OR LOWER(issn) LIKE ? OR LOWER(doi) LIKE ? OR CAST(year AS CHAR) LIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
	}

	// Category filter
	if req.Category != "" {
		query = query.Joins("JOIN paper_categories ON papers.id = paper_categories.paper_id").
			Joins("JOIN categories ON paper_categories.category_id = categories.id").
			Where("categories.name = ?", req.Category)
	}

	// Year filter
	if req.Year != nil {
		query = query.Where("year = ?", *req.Year)
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
	var papers []models.Paper
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

	if err := query.Preload("Authors").Offset(offset).Limit(req.Limit).Find(&papers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get papers"})
		return
	}

	// Format each paper to include authors array like GetPaper
	var formattedPapers []gin.H
	for _, paper := range papers {
		item := gin.H{
			"id":              paper.ID,
			"title":           paper.Title,
			"author":          paper.Author,
			"authors":         make([]gin.H, 0),
			"advisor":         paper.Advisor,
			"university":      paper.University,
			"department":      paper.Department,
			"year":            paper.Year,
			"issn":            paper.ISSN,
			"journal":         paper.Journal,
			"volume":          paper.Volume,
			"issue":           paper.Issue,
			"pages":           paper.Pages,
			"doi":             paper.DOI,
			"abstract":        paper.Abstract,
			"keywords":        paper.Keywords,
			"file_url":        paper.FileURL,
			"cover_image_url": paper.CoverImageURL,
			"created_by":      paper.CreatedBy,
			"created_at":      paper.CreatedAt,
			"updated_at":      paper.UpdatedAt,
			"language":        paper.Language,
		}
		for _, author := range paper.Authors {
			item["authors"] = append(item["authors"].([]gin.H), gin.H{
				"id":          author.ID,
				"author_name": author.AuthorName,
			})
		}
		// Convert file URLs to full URLs if they exist
		if paper.FileURL != nil {
			fileURL := *paper.FileURL
			if !strings.HasPrefix(fileURL, "http") {
				fileURL = fmt.Sprintf("%s%s", h.config.Server.BaseURL, fileURL)
				item["file_url"] = fileURL
			}
		}
		if paper.CoverImageURL != nil {
			coverURL := *paper.CoverImageURL
			if !strings.HasPrefix(coverURL, "http") {
				coverURL = fmt.Sprintf("%s%s", h.config.Server.BaseURL, coverURL)
				item["cover_image_url"] = coverURL
			}
		}
		formattedPapers = append(formattedPapers, item)
	}

	c.JSON(http.StatusOK, gin.H{
		"total":       total,
		"page":        req.Page,
		"limit":       req.Limit,
		"total_pages": int(math.Ceil(float64(total) / float64(req.Limit))),
		"data":        formattedPapers,
	})
}

// GetPaper handles single paper retrieval
func (h *PaperHandler) GetPaper(c *gin.Context) {
	id := c.Param("id")
	var paper models.Paper

	// Load paper with its authors
	if err := h.db.Unscoped().Preload("Authors").First(&paper, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Paper not found"})
		return
	}

	// Format the response to include authors array
	response := gin.H{
		"id":              paper.ID,
		"title":           paper.Title,
		"author":          paper.Author,
		"authors":         make([]gin.H, 0),
		"advisor":         paper.Advisor,
		"university":      paper.University,
		"department":      paper.Department,
		"year":            paper.Year,
		"issn":            paper.ISSN,
		"journal":         paper.Journal,
		"volume":          paper.Volume,
		"issue":           paper.Issue,
		"pages":           paper.Pages,
		"doi":             paper.DOI,
		"abstract":        paper.Abstract,
		"keywords":        paper.Keywords,
		"file_url":        paper.FileURL,
		"cover_image_url": paper.CoverImageURL,
		"created_by":      paper.CreatedBy,
		"created_at":      paper.CreatedAt,
		"updated_at":      paper.UpdatedAt,
		"language":        paper.Language,
	}

	// Add authors to the response
	for _, author := range paper.Authors {
		response["authors"] = append(response["authors"].([]gin.H), gin.H{
			"id":          author.ID,
			"author_name": author.AuthorName,
		})
	}

	// Convert file URLs to full URLs if they exist
	if paper.FileURL != nil {
		fileURL := *paper.FileURL
		if !strings.HasPrefix(fileURL, "http") {
			fileURL = fmt.Sprintf("%s%s", h.config.Server.BaseURL, fileURL)
			response["file_url"] = fileURL
		}
	}

	if paper.CoverImageURL != nil {
		coverURL := *paper.CoverImageURL
		if !strings.HasPrefix(coverURL, "http") {
			coverURL = fmt.Sprintf("%s%s", h.config.Server.BaseURL, coverURL)
			response["cover_image_url"] = coverURL
		}
	}

	c.JSON(http.StatusOK, response)
}

// UpdatePaper handles admin paper updates
func (h *PaperHandler) UpdatePaper(c *gin.Context) {
	id := c.Param("id")
	var paper models.Paper

	// Check if paper exists
	if err := h.db.Unscoped().First(&paper, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Paper not found"})
		return
	}

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil { // 32MB max
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	// Update fields
	if title := c.PostForm("title"); title != "" {
		paper.Title = title
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
	if paper.Title == "" || len(authors) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title and at least one author are required"})
		return
	}

	// Handle optional string fields
	if advisor := c.PostForm("advisor"); advisor != "" {
		paper.Advisor = &advisor
	}
	if university := c.PostForm("university"); university != "" {
		paper.University = &university
	}
	if department := c.PostForm("department"); department != "" {
		paper.Department = &department
	}
	if abstract := c.PostForm("abstract"); abstract != "" {
		paper.Abstract = &abstract
	}
	if keywords := c.PostForm("keywords"); keywords != "" {
		paper.Keywords = &keywords
	}
	if journal := c.PostForm("journal"); journal != "" {
		paper.Journal = &journal
	}
	if issn := c.PostForm("issn"); issn != "" {
		paper.ISSN = &issn
	}
	if language := c.PostForm("language"); language != "" {
		paper.Language = &language
	}
	if doi := c.PostForm("doi"); doi != "" {
		paper.DOI = &doi
	}
	if pages := c.PostForm("pages"); pages != "" {
		paper.Pages = &pages
	}

	// Parse numeric fields
	if yearStr := c.PostForm("year"); yearStr != "" {
		if year, err := strconv.Atoi(yearStr); err == nil {
			paper.Year = &year
		}
	}
	if volumeStr := c.PostForm("volume"); volumeStr != "" {
		if volume, err := strconv.Atoi(volumeStr); err == nil {
			paper.Volume = &volume
		}
	}
	if issueStr := c.PostForm("issue"); issueStr != "" {
		if issue, err := strconv.Atoi(issueStr); err == nil {
			paper.Issue = &issue
		}
	}

	// Handle file upload
	file, header, err := c.Request.FormFile("file")
	if err == nil {
		defer file.Close()

		// Create uploads directory if it doesn't exist
		uploadDir := "uploads/papers"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}

		// Generate unique filename
		ext := filepath.Ext(header.Filename)
		filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strings.ReplaceAll(paper.Title, " ", "_"), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(header, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		// Delete old file if exists and not referenced by other papers
		if paper.FileURL != nil {
			utils.DeleteFileIfUnreferenced(h.db, "papers", "file_url", *paper.FileURL, paper.ID)
		}

		// Save file paths relative to uploads directory
		fileURL := fmt.Sprintf("/uploads/papers/%s", filepath.Base(filePath))
		paper.FileURL = &fileURL
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
		filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strings.ReplaceAll(paper.Title, " ", "_"), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(coverHeader, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save cover image"})
			return
		}

		// Delete old cover if exists and not referenced by other papers
		if paper.CoverImageURL != nil {
			utils.DeleteFileIfUnreferenced(h.db, "papers", "cover_image_url", *paper.CoverImageURL, paper.ID)
		}

		// Save file paths relative to uploads directory
		coverImageURL := fmt.Sprintf("/uploads/covers/%s", filepath.Base(filePath))
		paper.CoverImageURL = &coverImageURL
	}

	// Start a transaction
	tx := h.db.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}

	// Update paper
	if err := tx.Save(&paper).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update paper"})
		return
	}

	// Delete existing authors
	if err := tx.Where("paper_id = ?", paper.ID).Delete(&models.PaperAuthor{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete existing authors"})
		return
	}

	// Create new paper authors
	for _, authorName := range authors {
		paperAuthor := models.PaperAuthor{
			PaperID:    paper.ID,
			AuthorName: authorName,
			UserID:     paper.CreatedBy,
		}
		if err := tx.Create(&paperAuthor).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create paper authors"})
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
	h.db.Preload("Authors").First(&paper, paper.ID)

	c.JSON(http.StatusOK, paper)
}

// DeletePaper handles admin paper deletion
func (h *PaperHandler) DeletePaper(c *gin.Context) {
	id := c.Param("id")
	var paper models.Paper

	// Check if paper exists
	if err := h.db.Unscoped().First(&paper, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Paper not found"})
		return
	}

	// Delete file if exists and not referenced by other papers
	if paper.FileURL != nil {
		utils.DeleteFileIfUnreferenced(h.db, "papers", "file_url", *paper.FileURL, paper.ID)
	}
	// Delete cover image if exists and not referenced by other papers
	if paper.CoverImageURL != nil {
		utils.DeleteFileIfUnreferenced(h.db, "papers", "cover_image_url", *paper.CoverImageURL, paper.ID)
	}

	// Delete from database
	if err := h.db.Delete(&paper).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete paper"})
		return
	}

	// Update paper count
	h.db.Model(&models.Counter{}).Where("name = ?", "total_papers").UpdateColumn("count", gorm.Expr("count - 1"))

	c.JSON(http.StatusOK, gin.H{"message": "Paper deleted successfully"})
}

// DownloadPaper handles paper file download
func (h *PaperHandler) DownloadPaper(c *gin.Context) {
	id := c.Param("id")
	var paper models.Paper

	// Check if paper exists
	if err := h.db.Unscoped().First(&paper, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Paper not found"})
		return
	}

	// Check if file exists
	if paper.FileURL == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Paper file not found"})
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
		ItemID:       paper.ID,
		ItemType:     "paper",
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
	filePath := *paper.FileURL
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

// GetUserPapers handles user paper listing with pagination and search
func (h *PaperHandler) GetUserPapers(c *gin.Context) {
	var req models.SearchRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
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

	query := h.db.Model(&models.Paper{}).Unscoped().Where("created_by = ?", userID)

	// Search functionality
	if q != "" {
		searchTerm := "%" + strings.ToLower(q) + "%"
		query = query.Where("LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(abstract) LIKE ? OR LOWER(keywords) LIKE ? OR LOWER(issn) LIKE ? OR LOWER(doi) LIKE ? OR CAST(year AS CHAR) LIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
	}

	// Category filter
	if req.Category != "" {
		query = query.Joins("JOIN paper_categories ON papers.id = paper_categories.paper_id").
			Joins("JOIN categories ON paper_categories.category_id = categories.id").
			Where("categories.name = ?", req.Category)
	}

	// Year filter
	if req.Year != nil {
		query = query.Where("year = ?", *req.Year)
	}

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get total count"})
		return
	}

	// Get paginated results
	var papers []models.Paper
	offset := (req.Page - 1) * req.Limit
	if err := query.Preload("Authors").Offset(offset).Limit(req.Limit).Find(&papers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get papers"})
		return
	}

	// Format each paper to include authors array like GetPaper
	var formattedPapers []gin.H
	for _, paper := range papers {
		item := gin.H{
			"id":              paper.ID,
			"title":           paper.Title,
			"author":          paper.Author,
			"authors":         make([]gin.H, 0),
			"advisor":         paper.Advisor,
			"university":      paper.University,
			"department":      paper.Department,
			"year":            paper.Year,
			"issn":            paper.ISSN,
			"journal":         paper.Journal,
			"volume":          paper.Volume,
			"issue":           paper.Issue,
			"pages":           paper.Pages,
			"doi":             paper.DOI,
			"abstract":        paper.Abstract,
			"keywords":        paper.Keywords,
			"file_url":        paper.FileURL,
			"cover_image_url": paper.CoverImageURL,
			"created_by":      paper.CreatedBy,
			"created_at":      paper.CreatedAt,
			"updated_at":      paper.UpdatedAt,
			"language":        paper.Language,
		}
		for _, author := range paper.Authors {
			item["authors"] = append(item["authors"].([]gin.H), gin.H{
				"id":          author.ID,
				"author_name": author.AuthorName,
			})
		}
		// Convert file URLs to full URLs if they exist
		if paper.FileURL != nil {
			fileURL := *paper.FileURL
			if !strings.HasPrefix(fileURL, "http") {
				fileURL = fmt.Sprintf("%s%s", h.config.Server.BaseURL, fileURL)
				item["file_url"] = fileURL
			}
		}
		if paper.CoverImageURL != nil {
			coverURL := *paper.CoverImageURL
			if !strings.HasPrefix(coverURL, "http") {
				coverURL = fmt.Sprintf("%s%s", h.config.Server.BaseURL, coverURL)
				item["cover_image_url"] = coverURL
			}
		}
		formattedPapers = append(formattedPapers, item)
	}

	c.JSON(http.StatusOK, gin.H{
		"total":       total,
		"page":        req.Page,
		"limit":       req.Limit,
		"total_pages": int(math.Ceil(float64(total) / float64(req.Limit))),
		"data":        formattedPapers,
	})
}

// UpdateUserPaper handles user paper updates
func (h *PaperHandler) UpdateUserPaper(c *gin.Context) {
	id := c.Param("id")
	var paper models.Paper

	// Check if paper exists and belongs to user
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	if err := h.db.Unscoped().Preload("Authors").First(&paper, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Paper not found"})
		return
	}

	if paper.CreatedBy == nil || *paper.CreatedBy != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to update this paper"})
		return
	}

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil { // 32MB max
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	// Update fields
	if title := c.PostForm("title"); title != "" {
		paper.Title = title
	}

	// Get authors from form data
	authors := c.PostFormArray("authors[]")
	if len(authors) == 0 {
		// Fallback to single author if no authors array is provided
		if author := c.PostForm("author"); author != "" {
			authors = []string{author}
		} else {
			// If no new authors provided, use existing authors
			authors = make([]string, len(paper.Authors))
			for i, author := range paper.Authors {
				authors[i] = author.AuthorName
			}
		}
	}

	// Validate required fields
	if paper.Title == "" || len(authors) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title and at least one author are required"})
		return
	}

	// Set the first author as the main author in the papers table
	paper.Author = authors[0]

	// Handle optional string fields
	if advisor := c.PostForm("advisor"); advisor != "" {
		paper.Advisor = &advisor
	}
	if university := c.PostForm("university"); university != "" {
		paper.University = &university
	}
	if department := c.PostForm("department"); department != "" {
		paper.Department = &department
	}
	if abstract := c.PostForm("abstract"); abstract != "" {
		paper.Abstract = &abstract
	}
	if keywords := c.PostForm("keywords"); keywords != "" {
		paper.Keywords = &keywords
	}
	if journal := c.PostForm("journal"); journal != "" {
		paper.Journal = &journal
	}
	if issn := c.PostForm("issn"); issn != "" {
		paper.ISSN = &issn
	}
	if language := c.PostForm("language"); language != "" {
		paper.Language = &language
	}
	if doi := c.PostForm("doi"); doi != "" {
		paper.DOI = &doi
	}
	if pages := c.PostForm("pages"); pages != "" {
		paper.Pages = &pages
	}

	// Parse numeric fields
	if yearStr := c.PostForm("year"); yearStr != "" {
		if year, err := strconv.Atoi(yearStr); err == nil {
			paper.Year = &year
		}
	}
	if volumeStr := c.PostForm("volume"); volumeStr != "" {
		if volume, err := strconv.Atoi(volumeStr); err == nil {
			paper.Volume = &volume
		}
	}
	if issueStr := c.PostForm("issue"); issueStr != "" {
		if issue, err := strconv.Atoi(issueStr); err == nil {
			paper.Issue = &issue
		}
	}

	// Handle file upload
	file, header, err := c.Request.FormFile("file")
	if err == nil {
		defer file.Close()

		// Create uploads directory if it doesn't exist
		uploadDir := "uploads/papers"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}

		// Generate unique filename
		ext := filepath.Ext(header.Filename)
		filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strings.ReplaceAll(paper.Title, " ", "_"), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(header, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		// Delete old file if exists and not referenced by other papers
		if paper.FileURL != nil {
			log.Printf("[User Paper Update] Replacing old file: %s", *paper.FileURL)
			utils.DeleteFileIfUnreferenced(h.db, "papers", "file_url", *paper.FileURL, paper.ID)
		}

		// Save file paths relative to uploads directory
		fileURL := fmt.Sprintf("/uploads/papers/%s", filepath.Base(filePath))
		paper.FileURL = &fileURL
		log.Printf("[User Paper Update] New file saved: %s", fileURL)
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
		filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strings.ReplaceAll(paper.Title, " ", "_"), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(coverHeader, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save cover image"})
			return
		}

		// Delete old cover if exists and not referenced by other papers
		if paper.CoverImageURL != nil {
			log.Printf("[User Paper Update] Replacing old cover: %s", *paper.CoverImageURL)
			utils.DeleteFileIfUnreferenced(h.db, "papers", "cover_image_url", *paper.CoverImageURL, paper.ID)
		}

		// Save file paths relative to uploads directory
		coverImageURL := fmt.Sprintf("/uploads/covers/%s", filepath.Base(filePath))
		paper.CoverImageURL = &coverImageURL
		log.Printf("[User Paper Update] New cover saved: %s", coverImageURL)
	}

	// Start a transaction
	tx := h.db.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}

	// Update paper
	if err := tx.Save(&paper).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update paper"})
		return
	}

	// Delete existing authors
	if err := tx.Where("paper_id = ?", paper.ID).Delete(&models.PaperAuthor{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete existing authors"})
		return
	}

	// Create new paper authors
	for _, authorName := range authors {
		paperAuthor := models.PaperAuthor{
			PaperID:    paper.ID,
			AuthorName: authorName,
			UserID:     paper.CreatedBy,
		}
		if err := tx.Create(&paperAuthor).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create paper authors"})
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
	h.db.Preload("Authors").First(&paper, paper.ID)

	c.JSON(http.StatusOK, paper)
}

// DeleteUserPaper handles user paper deletion
func (h *PaperHandler) DeleteUserPaper(c *gin.Context) {
	id := c.Param("id")
	var paper models.Paper

	// Check if paper exists and belongs to user
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	if err := h.db.Unscoped().First(&paper, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Paper not found"})
		return
	}

	if paper.CreatedBy == nil || *paper.CreatedBy != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to delete this paper"})
		return
	}

	log.Printf("[User Paper Delete] Deleting paper ID: %s, Title: %s", id, paper.Title)

	// Delete file if exists and not referenced by other papers
	if paper.FileURL != nil {
		log.Printf("[User Paper Delete] Checking file deletion for: %s", *paper.FileURL)
		utils.DeleteFileIfUnreferenced(h.db, "papers", "file_url", *paper.FileURL, paper.ID)
	}
	// Delete cover image if exists and not referenced by other papers
	if paper.CoverImageURL != nil {
		log.Printf("[User Paper Delete] Checking cover deletion for: %s", *paper.CoverImageURL)
		utils.DeleteFileIfUnreferenced(h.db, "papers", "cover_image_url", *paper.CoverImageURL, paper.ID)
	}

	// Delete from database
	if err := h.db.Delete(&paper).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete paper"})
		return
	}

	// Update paper count
	h.db.Model(&models.Counter{}).Where("name = ?", "total_papers").UpdateColumn("count", gorm.Expr("count - 1"))

	log.Printf("[User Paper Delete] Successfully deleted paper ID: %s", id)
	c.JSON(http.StatusOK, gin.H{"message": "Paper deleted successfully"})
}

// CitePaper handles citation logging for a paper
func (h *PaperHandler) CitePaper(c *gin.Context) {
	id := c.Param("id")
	var paper models.Paper

	// Check if paper exists
	if err := h.db.Unscoped().First(&paper, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Paper not found"})
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
		ItemID:   paper.ID,
		ItemType: "paper",
		CitedAt:  time.Now(),
	}
	h.db.Create(&citation)

	c.JSON(http.StatusOK, gin.H{"message": "Citation logged"})
}
