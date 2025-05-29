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

type PaperHandler struct {
	config *configs.Config
}

func NewPaperHandler(config *configs.Config) *PaperHandler {
	return &PaperHandler{config: config}
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
	paper.Author = c.PostForm("author")
	
	// Handle optional string fields (convert to pointers)
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

	// Parse year field (convert to *int64)
	if yearStr := c.PostForm("year"); yearStr != "" {
		if year, err := strconv.ParseInt(yearStr, 10, 64); err == nil {
			paper.Year = &year
		}
	}

	// Set created_by from authenticated user (admin context)
	if userID, exists := c.Get("user_id"); exists {
		if uid, ok := userID.(uint); ok {
			paper.CreatedBy = &uid
		}
	}

	// Validate required fields
	if paper.Title == "" || paper.Author == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title and author are required"})
		return
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

		paper.FileURL = &filePath
	}

	// Save to database
	if err := database.GetDB().Create(&paper).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create paper"})
		return
	}

	// Update paper count
	database.GetDB().Model(&models.Counter{}).Where("name = ?", "total_papers").UpdateColumn("count", gorm.Expr("count + 1"))

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
	paper.Author = c.PostForm("author")
	
	// Handle optional string fields (convert to pointers)
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

	// Parse year field (convert to *int64)
	if yearStr := c.PostForm("year"); yearStr != "" {
		if year, err := strconv.ParseInt(yearStr, 10, 64); err == nil {
			paper.Year = &year
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
	if paper.Title == "" || paper.Author == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title and author are required"})
		return
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

		paper.FileURL = &filePath
	}

	// Save to database
	if err := database.GetDB().Create(&paper).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create paper"})
		return
	}

	// Update paper count
	database.GetDB().Model(&models.Counter{}).Where("name = ?", "total_papers").UpdateColumn("count", gorm.Expr("count + 1"))

	c.JSON(http.StatusCreated, paper)
}

// GetPapers handles paper listing with pagination and search
func (h *PaperHandler) GetPapers(c *gin.Context) {
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

	query := database.GetDB().Model(&models.Paper{}).Preload("Categories")
	
	// Search functionality
	if req.Query != "" {
		searchTerm := "%" + strings.ToLower(req.Query) + "%"
		query = query.Where("LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(abstract) LIKE ? OR LOWER(keywords) LIKE ?", 
			searchTerm, searchTerm, searchTerm, searchTerm)
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

	// Count total
	var total int64
	query.Count(&total)

	// Get papers with pagination
	var papers []models.Paper
	offset := (req.Page - 1) * req.Limit
	if err := query.Offset(offset).Limit(req.Limit).Find(&papers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch papers"})
		return
	}

	totalPages := int((total + int64(req.Limit) - 1) / int64(req.Limit))

	response := models.PaginatedResponse{
		Data:       papers,
		Total:      total,
		Page:       req.Page,
		Limit:      req.Limit,
		TotalPages: totalPages,
	}

	c.JSON(http.StatusOK, response)
}

// GetPaper handles getting a single paper by ID
func (h *PaperHandler) GetPaper(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid paper ID"})
		return
	}

	var paper models.Paper
	if err := database.GetDB().Preload("Categories").Preload("Authors").First(&paper, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Paper not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch paper"})
		return
	}

	c.JSON(http.StatusOK, paper)
}

// UpdatePaper handles paper updates with file upload
func (h *PaperHandler) UpdatePaper(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid paper ID"})
		return
	}

	var paper models.Paper
	if err := database.GetDB().First(&paper, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Paper not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch paper"})
		return
	}

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil { // 32MB max
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	// Update form fields if provided
	if title := c.PostForm("title"); title != "" {
		paper.Title = title
	}
	if author := c.PostForm("author"); author != "" {
		paper.Author = author
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

	// Parse year field
	if yearStr := c.PostForm("year"); yearStr != "" {
		if year, err := strconv.ParseInt(yearStr, 10, 64); err == nil {
			paper.Year = &year
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

		// Remove old file if exists
		if paper.FileURL != nil && *paper.FileURL != "" {
			os.Remove(*paper.FileURL)
		}

		paper.FileURL = &filePath
	}

	// Save updates to database
	if err := database.GetDB().Save(&paper).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update paper"})
		return
	}

	c.JSON(http.StatusOK, paper)
}

// DeletePaper handles paper deletion (soft delete)
func (h *PaperHandler) DeletePaper(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid paper ID"})
		return
	}

	var paper models.Paper
	if err := database.GetDB().First(&paper, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Paper not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch paper"})
		return
	}

	if err := database.GetDB().Delete(&paper).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete paper"})
		return
	}

	// Update paper count
	database.GetDB().Model(&models.Counter{}).Where("name = ?", "total_papers").UpdateColumn("count", gorm.Expr("count - 1"))

	c.JSON(http.StatusOK, gin.H{"message": "Paper deleted successfully"})
}

// DownloadPaper handles paper download requests
func (h *PaperHandler) DownloadPaper(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid paper ID"})
		return
	}

	var paper models.Paper
	if err := database.GetDB().First(&paper, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Paper not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch paper"})
		return
	}

	if paper.FileURL == nil || *paper.FileURL == "" {
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
		ItemID:       paper.ID,
		ItemType:     "paper",
		IPAddress:    &clientIP,
		UserAgent:    &userAgent,
		DownloadedAt: time.Now(),
	}

	database.GetDB().Create(&download)

	// Update download counter
	database.GetDB().Model(&models.Counter{}).Where("name = ?", "total_downloads").UpdateColumn("count", gorm.Expr("count + 1"))

	// Serve the file directly
	filePath := *paper.FileURL
	
	// Extract file extension from the stored file path
	ext := filepath.Ext(filePath)
	filename := paper.Title
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

// GetUserPapers handles getting papers created by the authenticated user
func (h *PaperHandler) GetUserPapers(c *gin.Context) {
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

	query := database.GetDB().Model(&models.Paper{}).Where("created_by = ?", uid).Preload("Categories")
	
	// Search functionality
	if req.Query != "" {
		searchTerm := "%" + strings.ToLower(req.Query) + "%"
		query = query.Where("LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(abstract) LIKE ? OR LOWER(keywords) LIKE ?", 
			searchTerm, searchTerm, searchTerm, searchTerm)
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

	// Count total
	var total int64
	query.Count(&total)

	// Get papers with pagination
	var papers []models.Paper
	offset := (req.Page - 1) * req.Limit
	if err := query.Offset(offset).Limit(req.Limit).Find(&papers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch papers"})
		return
	}

	totalPages := int((total + int64(req.Limit) - 1) / int64(req.Limit))

	response := models.PaginatedResponse{
		Data:       papers,
		Total:      total,
		Page:       req.Page,
		Limit:      req.Limit,
		TotalPages: totalPages,
	}

	c.JSON(http.StatusOK, response)
}

// UpdateUserPaper handles user paper updates with file upload
func (h *PaperHandler) UpdateUserPaper(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid paper ID"})
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

	var paper models.Paper
	if err := database.GetDB().Where("id = ? AND created_by = ?", uint(id), uid).First(&paper).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Paper not found or you don't have permission to edit it"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch paper"})
		return
	}

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil { // 32MB max
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	// Update form fields if provided
	if title := c.PostForm("title"); title != "" {
		paper.Title = title
	}
	if author := c.PostForm("author"); author != "" {
		paper.Author = author
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

	// Parse year field
	if yearStr := c.PostForm("year"); yearStr != "" {
		if year, err := strconv.ParseInt(yearStr, 10, 64); err == nil {
			paper.Year = &year
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

		// Remove old file if exists
		if paper.FileURL != nil && *paper.FileURL != "" {
			os.Remove(*paper.FileURL)
		}

		paper.FileURL = &filePath
	}

	// Save updates to database
	if err := database.GetDB().Save(&paper).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update paper"})
		return
	}

	c.JSON(http.StatusOK, paper)
}

// DeleteUserPaper handles user paper deletion
func (h *PaperHandler) DeleteUserPaper(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid paper ID"})
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

	var paper models.Paper
	if err := database.GetDB().Where("id = ? AND created_by = ?", uint(id), uid).First(&paper).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Paper not found or you don't have permission to delete it"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch paper"})
		return
	}

	if err := database.GetDB().Delete(&paper).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete paper"})
		return
	}

	// Update paper count
	database.GetDB().Model(&models.Counter{}).Where("name = ?", "total_papers").UpdateColumn("count", gorm.Expr("count - 1"))

	c.JSON(http.StatusOK, gin.H{"message": "Paper deleted successfully"})
} 