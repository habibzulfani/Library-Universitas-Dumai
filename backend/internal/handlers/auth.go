package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"e-repository-api/configs"
	"e-repository-api/internal/database"
	"e-repository-api/internal/models"
	"e-repository-api/internal/utils"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// AuthHandler handles authentication-related requests
type AuthHandler struct {
	db     *gorm.DB
	config *configs.Config
}

// NewAuthHandler creates a new AuthHandler
func NewAuthHandler(db *gorm.DB, config *configs.Config) *AuthHandler {
	return &AuthHandler{
		db:     db,
		config: config,
	}
}

// AdminRegister handles admin registration of other users
func (h *AuthHandler) AdminRegister(c *gin.Context) {
	// Check if the current user is an admin
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userObj := userInterface.(models.User)
	if userObj.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only admins can register users"})
		return
	}

	var req struct {
		Email        string `json:"email" binding:"required,email"`
		Password     string `json:"password" binding:"required,min=6"`
		Name         string `json:"name" binding:"required"`
		Role         string `json:"role" binding:"required,oneof=admin user"`
		UserType     string `json:"user_type" binding:"required,oneof=student lecturer"`
		Faculty      string `json:"faculty" binding:"required,oneof=Fakultas Ekonomi Fakultas Ilmu Komputer Fakultas Hukum"`
		DepartmentID uint   `json:"department_id" binding:"required"`
		NIMNIDN      string `json:"nim_nidn" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Admin registration validation error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Admin attempting to register user with email: %s", req.Email)

	// Check if email already exists
	var existingUser models.User
	if err := h.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		log.Printf("Admin registration failed: Email %s already exists", req.Email)
		c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		log.Printf("Password hashing failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user
	newUser := models.User{
		Email:         req.Email,
		PasswordHash:  hashedPassword,
		Name:          req.Name,
		Role:          req.Role,
		UserType:      req.UserType,
		NIMNIDN:       &req.NIMNIDN,
		Faculty:       &req.Faculty,
		DepartmentID:  &req.DepartmentID,
		EmailVerified: true, // Admin-registered users are automatically verified
		IsApproved:    true, // Admin-registered users are automatically approved
	}

	if err := h.db.Create(&newUser).Error; err != nil {
		log.Printf("User creation failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	log.Printf("Admin registered user successfully: %s", req.Email)

	// Generate JWT token
	token, err := utils.GenerateJWT(newUser.ID, h.config.JWT.Secret)
	if err != nil {
		log.Printf("Token generation failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Get department name for response
	var department models.Department
	if err := h.db.First(&department, req.DepartmentID).Error; err != nil {
		log.Printf("Failed to fetch department: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch department"})
		return
	}

	response := models.AuthResponse{
		Token: token,
		User: models.UserResponse{
			ID:           newUser.ID,
			Email:        newUser.Email,
			Name:         newUser.Name,
			Role:         newUser.Role,
			UserType:     newUser.UserType,
			NIMNIDN:      newUser.NIMNIDN,
			Faculty:      newUser.Faculty,
			DepartmentID: newUser.DepartmentID,
			Department:   nil,
		},
	}
	if newUser.DepartmentID != nil {
		response.User.Department = &models.DepartmentResponse{
			ID:      department.ID,
			Name:    department.Name,
			Faculty: department.Faculty,
		}
	}

	c.JSON(http.StatusCreated, response)
}

// Register handles user registration
func (h *AuthHandler) Register(c *gin.Context) {
	// Parse multipart form
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil { // 32MB max
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	// Extract form fields
	email := strings.TrimSpace(c.PostForm("email"))
	password := c.PostForm("password")
	name := strings.TrimSpace(c.PostForm("name"))
	userType := c.PostForm("user_type")
	nimNidn := strings.TrimSpace(c.PostForm("nim_nidn"))
	faculty := c.PostForm("faculty")
	departmentIDStr := c.PostForm("department_id")
	address := strings.TrimSpace(c.PostForm("address"))

	// Validate required fields
	if email == "" || password == "" || name == "" || userType == "" || nimNidn == "" || faculty == "" || departmentIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "All required fields must be provided"})
		return
	}

	// Validate email format
	if !isValidEmail(email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email format"})
		return
	}

	// Validate NIM/NIDN format
	if !isValidNimNidn(nimNidn, userType) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid NIM/NIDN format"})
		return
	}

	// Validate password strength
	if !isValidPassword(password) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password does not meet requirements"})
		return
	}

	// Convert department ID to uint
	departmentIDUint64, err := strconv.ParseUint(departmentIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid department ID"})
		return
	}
	departmentID := uint(departmentIDUint64)

	// Validate department belongs to selected faculty
	var department models.Department
	if err := h.db.Where("id = ? AND faculty = ?", departmentID, faculty).First(&department).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid department for selected faculty"})
		return
	}

	// Check if email already exists
	var existingUser models.User
	if err := h.db.Where("email = ?", email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Generate verification token
	verificationToken, err := utils.GenerateVerificationToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate verification token"})
		return
	}

	// Handle profile picture upload
	var profilePictureURL *string
	file, header, err := c.Request.FormFile("profile_picture")
	if err == nil {
		defer file.Close()

		// Validate file type
		if !isValidImageType(header.Header.Get("Content-Type")) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type. Please upload a JPEG, PNG, or GIF image"})
			return
		}

		// Validate file size (5MB max)
		if header.Size > 5*1024*1024 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File size must be less than 5MB"})
			return
		}

		// Create uploads directory if it doesn't exist
		uploadDir := "uploads/profile_pictures"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}

		// Generate unique filename
		ext := filepath.Ext(header.Filename)
		filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strings.ReplaceAll(name, " ", "_"), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(header, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save profile picture"})
			return
		}

		profilePictureURL = &filePath
	}

	// Create user
	user := models.User{
		Email:             email,
		PasswordHash:      hashedPassword,
		Name:              name,
		Role:              "user",
		UserType:          userType,
		NIMNIDN:           &nimNidn,
		Faculty:           &faculty,
		DepartmentID:      &departmentID,
		Address:           &address,
		ProfilePictureURL: profilePictureURL,
		EmailVerified:     true, // Auto-verify for testing
		VerificationToken: verificationToken,
		IsApproved:        userType != "lecturer", // Auto-approve students
	}

	if err := h.db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Skip sending verification email for testing
	// if err := h.sendVerificationEmail(user); err != nil {
	// 	log.Printf("Failed to send verification email: %v", err)
	// 	// Don't return error here, just log it
	// }

	c.JSON(http.StatusCreated, gin.H{
		"message": "Registration successful. Your account is ready to use.",
	})
}

// Helper functions for validation
func isValidEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`)
	return emailRegex.MatchString(email)
}

func isValidNimNidn(nimNidn, userType string) bool {
	if userType == "student" {
		return regexp.MustCompile(`^\d{8}$`).MatchString(nimNidn)
	}
	return regexp.MustCompile(`^\d{10}$`).MatchString(nimNidn)
}

func isValidPassword(password string) bool {
	if len(password) < 6 {
		return false
	}
	// Removed complex character requirements for better user experience
	// Only require minimum length of 6 characters
	return true
}

func isValidImageType(contentType string) bool {
	validTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/gif":  true,
	}
	return validTypes[contentType]
}

// VerifyEmail handles email verification
func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Verification token is required"})
		return
	}

	var user models.User
	if err := h.db.Where("verification_token = ?", token).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invalid verification token"})
		return
	}

	user.EmailVerified = true
	user.VerificationToken = "" // Clear the token after verification

	if err := h.db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify email"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Email verified successfully"})
}

// ApproveLecturer handles lecturer approval by admin
func (h *AuthHandler) ApproveLecturer(c *gin.Context) {
	// Check if the current user is an admin
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userObj := user.(models.User)
	if userObj.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only admins can approve lecturers"})
		return
	}

	lecturerID := c.Param("id")
	var lecturer models.User
	if err := h.db.First(&lecturer, lecturerID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Lecturer not found"})
		return
	}

	if lecturer.UserType != "lecturer" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User is not a lecturer"})
		return
	}

	lecturer.IsApproved = true
	if err := h.db.Save(&lecturer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve lecturer"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Lecturer approved successfully"})
}

// Login handles user login
func (h *AuthHandler) Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required_without=NIMNIDN,omitempty,email"`
		NIMNIDN  string `json:"nim_nidn" binding:"required_without=Email,omitempty"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	var query *gorm.DB

	// Check if login is using email or NIM/NIDN
	if req.Email != "" {
		query = h.db.Where("email = ?", req.Email)
	} else {
		query = h.db.Where("nim_nidn = ?", req.NIMNIDN)
	}

	if err := query.First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if !user.EmailVerified {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Please verify your email first"})
		return
	}

	if !user.IsApproved {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Your account is pending approval"})
		return
	}

	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate JWT token
	token, err := utils.GenerateJWT(user.ID, h.config.JWT.Secret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Update login counter
	user.LoginCounter++
	h.db.Save(&user)

	// Get department name for response
	var department models.Department
	if user.DepartmentID != nil {
		if err := h.db.First(&department, *user.DepartmentID).Error; err != nil {
			log.Printf("Failed to fetch department: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch department"})
			return
		}
	}

	// Create response with nil checks
	response := models.AuthResponse{
		Token: token,
		User: models.UserResponse{
			ID:           user.ID,
			Email:        user.Email,
			Name:         user.Name,
			Role:         user.Role,
			UserType:     user.UserType,
			NIMNIDN:      user.NIMNIDN,
			Faculty:      user.Faculty,
			DepartmentID: user.DepartmentID,
			Department:   nil,
		},
	}
	if user.DepartmentID != nil {
		response.User.Department = &models.DepartmentResponse{
			ID:      department.ID,
			Name:    department.Name,
			Faculty: department.Faculty,
		}
	}

	c.JSON(http.StatusOK, response)
}

// GetProfile handles getting user profile
func (h *AuthHandler) GetProfile(c *gin.Context) {
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	user := userInterface.(models.User)

	// Fetch the user with department preloaded
	var dbUser models.User
	if err := h.db.Preload("Department").First(&dbUser, user.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user with department"})
		return
	}

	response := models.UserResponse{
		ID:                dbUser.ID,
		Email:             dbUser.Email,
		Name:              dbUser.Name,
		Role:              dbUser.Role,
		UserType:          dbUser.UserType,
		NIMNIDN:           dbUser.NIMNIDN,
		Faculty:           dbUser.Faculty,
		DepartmentID:      dbUser.DepartmentID,
		Department:        nil,
		Address:           dbUser.Address,
		ProfilePictureURL: dbUser.ProfilePictureURL,
	}
	if dbUser.Department != nil {
		response.Department = &models.DepartmentResponse{
			ID:      dbUser.Department.ID,
			Name:    dbUser.Department.Name,
			Faculty: dbUser.Department.Faculty,
		}
	}

	c.JSON(http.StatusOK, response)
}

// UpdateProfile handles updating user profile
func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	user := userInterface.(models.User)

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil { // 32MB max
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	// Extract form fields
	name := c.PostForm("name")
	nim := c.PostForm("nim_nidn")
	departmentIDStr := c.PostForm("department_id")
	address := c.PostForm("address")

	// Validate required fields
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
		return
	}

	// Update user fields
	user.Name = name
	if nim != "" {
		user.NIMNIDN = &nim
	}
	if departmentIDStr != "" {
		departmentID, err := strconv.ParseUint(departmentIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid department ID"})
			return
		}
		departmentIDUint := uint(departmentID)
		user.DepartmentID = &departmentIDUint
	}
	if address != "" {
		user.Address = &address
	}

	// Handle profile picture upload
	file, header, err := c.Request.FormFile("profile_picture")
	if err == nil {
		defer file.Close()

		// Create uploads directory if it doesn't exist
		uploadDir := "uploads/profile_pictures"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}

		// Generate unique filename
		ext := filepath.Ext(header.Filename)
		filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), strings.ReplaceAll(user.Name, " ", "_"), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(header, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save profile picture"})
			return
		}

		// Delete old profile picture if exists
		if user.ProfilePictureURL != nil {
			if err := os.Remove(*user.ProfilePictureURL); err != nil && !os.IsNotExist(err) {
				log.Printf("Failed to delete old profile picture: %v", err)
			}
		}

		user.ProfilePictureURL = &filePath
	}

	if err := h.db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	// Get department name for response
	var department models.Department
	if user.DepartmentID != nil {
		if err := h.db.First(&department, *user.DepartmentID).Error; err != nil {
			log.Printf("Failed to fetch department: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch department"})
			return
		}
	}

	response := models.UserResponse{
		ID:                user.ID,
		Email:             user.Email,
		Name:              user.Name,
		Role:              user.Role,
		UserType:          user.UserType,
		NIMNIDN:           user.NIMNIDN,
		Faculty:           user.Faculty,
		DepartmentID:      user.DepartmentID,
		Department:        nil,
		Address:           user.Address,
		ProfilePictureURL: user.ProfilePictureURL,
	}
	if user.DepartmentID != nil {
		response.Department = &models.DepartmentResponse{
			ID:      department.ID,
			Name:    department.Name,
			Faculty: department.Faculty,
		}
	}

	c.JSON(http.StatusOK, response)
}

// ChangePassword handles password changes
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var req struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Current password is incorrect"})
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Update password
	if err := h.db.Model(&user).Update("password_hash", string(hashedPassword)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

// ForgotPassword handles password reset requests
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user exists
	var user models.User
	if err := h.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		// Don't reveal if email exists or not
		c.JSON(http.StatusOK, gin.H{"message": "If your email is registered, you will receive a password reset link"})
		return
	}

	// Generate reset token
	token := make([]byte, 32)
	if _, err := rand.Read(token); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate reset token"})
		return
	}

	// Store token in database
	resetToken := models.PasswordResetToken{
		UserID:    user.ID,
		Token:     hex.EncodeToString(token),
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}

	if err := h.db.Create(&resetToken).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store reset token"})
		return
	}

	// Send password reset email
	if err := h.sendPasswordResetEmail(user, resetToken.Token); err != nil {
		log.Printf("Failed to send password reset email: %v", err)
		// Don't return error here, just log it
		// For testing purposes, still return the token in response
		c.JSON(http.StatusOK, gin.H{
			"message": "If your email is registered, you will receive a password reset link",
			"token":   resetToken.Token, // Remove this in production
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "If your email is registered, you will receive a password reset link",
	})
}

// ResetPassword handles password reset
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find valid token
	var resetToken models.PasswordResetToken
	if err := h.db.Where("token = ? AND expires_at > ?", req.Token, time.Now()).First(&resetToken).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired token"})
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Update password
	if err := h.db.Model(&models.User{}).Where("id = ?", resetToken.UserID).Update("password_hash", string(hashedPassword)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	// Delete used token
	h.db.Delete(&resetToken)

	c.JSON(http.StatusOK, gin.H{"message": "Password has been reset successfully"})
}

// Helper function to validate department based on faculty
func isValidDepartment(faculty, department string) bool {
	switch faculty {
	case "Fakultas Ekonomi":
		return department == "Manajemen"
	case "Fakultas Ilmu Komputer":
		return department == "Sistem Informasi" || department == "Teknik Informatika" ||
			department == "Rekayasa Perangkat Lunak" || department == "Manajemen Informatika"
	case "Fakultas Hukum":
		return department == "Ilmu Hukum"
	default:
		return false
	}
}

// GetPendingLecturers handles fetching lecturers pending approval
func (h *AuthHandler) GetPendingLecturers(c *gin.Context) {
	// Check if the current user is an admin
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userObj := user.(models.User)
	if userObj.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only admins can view pending lecturers"})
		return
	}

	var lecturers []models.User
	if err := h.db.Where("user_type = ?", "lecturer").Find(&lecturers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch lecturers"})
		return
	}

	c.JSON(http.StatusOK, lecturers)
}

// GetAllUsers handles getting all users (admin only)
func (h *AuthHandler) GetAllUsers(c *gin.Context) {
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

	query := h.db.Model(&database.User{})

	// Search functionality
	if req.Query != "" {
		searchTerm := "%" + strings.ToLower(req.Query) + "%"
		query = query.Where("LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(nim_nidn) LIKE ?",
			searchTerm, searchTerm, searchTerm)
	}

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get total count"})
		return
	}

	// Get paginated results
	var users []database.User
	offset := (req.Page - 1) * req.Limit
	if err := query.Offset(offset).Limit(req.Limit).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	// Remove sensitive information
	for i := range users {
		users[i].PasswordHash = ""
	}

	c.JSON(http.StatusOK, gin.H{
		"total":       total,
		"page":        req.Page,
		"limit":       req.Limit,
		"total_pages": int(math.Ceil(float64(total) / float64(req.Limit))),
		"data":        users,
	})
}

// GetUser handles getting a specific user by ID (admin only)
func (h *AuthHandler) GetUser(c *gin.Context) {
	id := c.Param("id")
	var user database.User
	if err := h.db.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Remove sensitive information
	user.PasswordHash = ""

	c.JSON(http.StatusOK, user)
}

// UpdateUser handles updating a specific user (admin only)
func (h *AuthHandler) UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var user database.User
	if err := h.db.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var input struct {
		Name       string  `json:"name"`
		Email      string  `json:"email"`
		Role       string  `json:"role"`
		UserType   string  `json:"user_type"`
		NIMNIDN    *string `json:"nim_nidn"`
		Faculty    *string `json:"faculty"`
		IsApproved bool    `json:"is_approved"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update user fields
	user.Name = input.Name
	user.Email = input.Email
	user.Role = input.Role
	user.UserType = input.UserType
	user.NIMNIDN = input.NIMNIDN
	user.Faculty = input.Faculty
	user.IsApproved = input.IsApproved

	if err := h.db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	// Get department name for response
	var department models.Department
	if user.DepartmentID != nil {
		if err := h.db.First(&department, *user.DepartmentID).Error; err != nil {
			log.Printf("Failed to fetch department: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch department"})
			return
		}
	}

	response := models.UserResponse{
		ID:                user.ID,
		Email:             user.Email,
		Name:              user.Name,
		Role:              user.Role,
		UserType:          user.UserType,
		NIMNIDN:           user.NIMNIDN,
		Faculty:           user.Faculty,
		DepartmentID:      user.DepartmentID,
		Department:        nil,
		Address:           user.Address,
		ProfilePictureURL: user.ProfilePictureURL,
	}
	if user.DepartmentID != nil {
		response.Department = &models.DepartmentResponse{
			ID:      department.ID,
			Name:    department.Name,
			Faculty: department.Faculty,
		}
	}

	c.JSON(http.StatusOK, response)
}

// DeleteUser handles deleting a specific user (admin only)
func (h *AuthHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")
	var user database.User
	if err := h.db.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if err := h.db.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// GetDepartments handles fetching departments based on faculty
func (h *AuthHandler) GetDepartments(c *gin.Context) {
	faculty := c.Query("faculty")
	var departments []models.Department

	query := h.db.Model(&models.Department{})
	if faculty != "" {
		query = query.Where("faculty = ?", faculty)
	}

	if err := query.Find(&departments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch departments"})
		return
	}

	c.JSON(http.StatusOK, departments)
}

// Helper function to send verification email
func (h *AuthHandler) sendVerificationEmail(user models.User) error {
	emailConfig := configs.NewEmailConfig()
	return utils.SendVerificationEmail(user.Email, user.VerificationToken, emailConfig)
}

// Helper function to send password reset email
func (h *AuthHandler) sendPasswordResetEmail(user models.User, token string) error {
	emailConfig := configs.NewEmailConfig()
	return utils.SendPasswordResetEmail(user.Email, token, emailConfig)
}
