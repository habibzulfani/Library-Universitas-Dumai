package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"e-repository-api/internal/services"

	"github.com/gin-gonic/gin"
)

type MetadataHandler struct {
	extractor *services.MetadataExtractor
}

func NewMetadataHandler() *MetadataHandler {
	return &MetadataHandler{
		extractor: services.NewMetadataExtractor(),
	}
}

// Python service response structure
type PythonMetadataResponse struct {
	Success bool `json:"success"`
	Data    struct {
		Title        string   `json:"title"`
		Authors      []string `json:"authors"`
		Abstract     string   `json:"abstract"`
		Keywords     []string `json:"keywords"`
		Journal      string   `json:"journal"`
		Publisher    string   `json:"publisher"`
		Year         int      `json:"year"`
		Volume       string   `json:"volume"`
		Issue        string   `json:"issue"`
		Pages        string   `json:"pages"`
		DOI          string   `json:"doi"`
		ISBN         string   `json:"isbn"`
		ISSN         string   `json:"issn"`
		Language     string   `json:"language"`
		Subject      string   `json:"subject"`
		University   string   `json:"university"`
		Department   string   `json:"department"`
		Advisor      string   `json:"advisor"`
		DocumentType string   `json:"document_type"`
		Confidence   float64  `json:"confidence"`
	} `json:"data"`
	Message string `json:"message"`
}

// ExtractMetadata handles metadata extraction from uploaded files
func (h *MetadataHandler) ExtractMetadata(c *gin.Context) {
	// Get the uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No file uploaded",
		})
		return
	}
	defer file.Close()

	// Check file size (limit to 50MB)
	if header.Size > 50*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "File size too large. Maximum size is 50MB",
		})
		return
	}

	// Check file type
	ext := strings.ToLower(filepath.Ext(header.Filename))
	supportedTypes := []string{".pdf", ".doc", ".docx", ".txt", ".html", ".htm"}

	isSupported := false
	for _, supportedType := range supportedTypes {
		if ext == supportedType {
			isSupported = true
			break
		}
	}

	if !isSupported {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Unsupported file type: %s. Supported types: %s", ext, strings.Join(supportedTypes, ", ")),
		})
		return
	}

	// For PDF files, use the Python service for better extraction
	if ext == ".pdf" {
		metadata, err := h.extractWithPythonService(file, header)
		if err != nil {
			fmt.Printf("Python service extraction failed: %v\n", err)
			// Fallback to Go extraction
			metadata, err = h.extractWithGoService(file, header)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": fmt.Sprintf("Failed to extract metadata: %v", err),
				})
				return
			}
		}
		c.JSON(http.StatusOK, metadata)
		return
	}

	// For non-PDF files, use Go extraction
	metadata, err := h.extractWithGoService(file, header)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to extract metadata: %v", err),
		})
		return
	}

	c.JSON(http.StatusOK, metadata)
}

// extractWithPythonService calls the Python PDF service for better extraction
func (h *MetadataHandler) extractWithPythonService(file multipart.File, header *multipart.FileHeader) (gin.H, error) {
	// Create a buffer to store the file content
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// Create form field for file
	part, err := writer.CreateFormFile("file", header.Filename)
	if err != nil {
		return nil, fmt.Errorf("failed to create form field: %v", err)
	}

	// Copy file content to form field
	_, err = io.Copy(part, file)
	if err != nil {
		return nil, fmt.Errorf("failed to copy file content: %v", err)
	}

	writer.Close()

	// Call Python service
	pythonServiceURL := "http://pdf-service:8000/extract"
	if os.Getenv("PYTHON_SERVICE_URL") != "" {
		pythonServiceURL = os.Getenv("PYTHON_SERVICE_URL")
	}

	resp, err := http.Post(pythonServiceURL, writer.FormDataContentType(), &buf)
	if err != nil {
		return nil, fmt.Errorf("failed to call Python service: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Python service returned status %d: %s", resp.StatusCode, string(body))
	}

	// Parse Python service response
	var pythonResp PythonMetadataResponse
	if err := json.NewDecoder(resp.Body).Decode(&pythonResp); err != nil {
		return nil, fmt.Errorf("failed to decode Python service response: %v", err)
	}

	// Convert Python response to Go metadata format
	metadata := &services.ExtractedMetadata{
		Title:        pythonResp.Data.Title,
		Authors:      pythonResp.Data.Authors,
		Abstract:     pythonResp.Data.Abstract,
		Keywords:     pythonResp.Data.Keywords,
		Journal:      pythonResp.Data.Journal,
		Publisher:    pythonResp.Data.Publisher,
		Year:         pythonResp.Data.Year,
		Volume:       pythonResp.Data.Volume,
		Issue:        pythonResp.Data.Issue,
		Pages:        pythonResp.Data.Pages,
		DOI:          pythonResp.Data.DOI,
		ISBN:         pythonResp.Data.ISBN,
		ISSN:         pythonResp.Data.ISSN,
		Language:     pythonResp.Data.Language,
		Subject:      pythonResp.Data.Subject,
		University:   pythonResp.Data.University,
		Department:   pythonResp.Data.Department,
		Advisor:      pythonResp.Data.Advisor,
		DocumentType: pythonResp.Data.DocumentType,
		Confidence:   pythonResp.Data.Confidence,
	}

	return gin.H{
		"success": true,
		"data":    metadata,
		"message": "Metadata extracted successfully",
	}, nil
}

// extractWithGoService uses the original Go extraction as fallback
func (h *MetadataHandler) extractWithGoService(file multipart.File, header *multipart.FileHeader) (gin.H, error) {
	// Create a temporary file to save the upload
	tempPath := fmt.Sprintf("/tmp/metadata_extraction_%s", header.Filename)

	// Create the temporary file
	tempFile, err := os.Create(tempPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create temporary file: %v", err)
	}
	defer tempFile.Close()

	// Copy file content to temporary file
	_, err = io.Copy(tempFile, file)
	if err != nil {
		return nil, fmt.Errorf("failed to copy file content: %v", err)
	}

	// Close the file before processing
	tempFile.Close()

	// Reset file pointer for potential reuse
	file.Seek(0, 0)

	// Extract metadata using Go service
	metadata, err := h.extractor.ExtractMetadataFromFile(tempPath)
	if err != nil {
		return nil, fmt.Errorf("failed to extract metadata: %v", err)
	}

	return gin.H{
		"success": true,
		"data":    metadata,
		"message": "Metadata extracted successfully",
	}, nil
}

// ExtractMetadataFromURL handles metadata extraction from a file URL
func (h *MetadataHandler) ExtractMetadataFromURL(c *gin.Context) {
	fileURL := c.PostForm("file_url")
	if fileURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "file_url is required",
		})
		return
	}

	// Convert URL to file path (assuming files are stored locally)
	// In a real implementation, you might need to download the file first
	filePath := strings.TrimPrefix(fileURL, "/uploads/")
	if !strings.HasPrefix(filePath, "/") {
		filePath = "/" + filePath
	}

	// Extract metadata
	metadata, err := h.extractor.ExtractMetadataFromFile(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to extract metadata: %v", err),
		})
		return
	}

	// Return the extracted metadata
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    metadata,
		"message": "Metadata extracted successfully",
	})
}
