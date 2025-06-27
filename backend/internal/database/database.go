package database

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"e-repository-api/configs"
	"e-repository-api/internal/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Connect initializes the database connection with retry mechanism
func Connect(config *configs.Config) error {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		config.Database.User,
		config.Database.Password,
		config.Database.Host,
		config.Database.Port,
		config.Database.Name,
	)

	// Get retry configuration from environment variables
	retryInterval := 5 // default 5 seconds
	maxRetries := 10   // default 10 retries

	if interval := os.Getenv("DB_RETRY_INTERVAL"); interval != "" {
		if val, err := strconv.Atoi(interval); err == nil {
			retryInterval = val
		}
	}

	if retries := os.Getenv("DB_MAX_RETRIES"); retries != "" {
		if val, err := strconv.Atoi(retries); err == nil {
			maxRetries = val
		}
	}

	var err error
	for i := 0; i < maxRetries; i++ {
		DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})

		if err == nil {
			log.Println("Database connected successfully")
			return nil
		}

		log.Printf("Failed to connect to database (attempt %d/%d): %v", i+1, maxRetries, err)
		if i < maxRetries-1 {
			log.Printf("Retrying in %d seconds...", retryInterval)
			time.Sleep(time.Duration(retryInterval) * time.Second)
		}
	}

	return fmt.Errorf("failed to connect to database after %d attempts: %w", maxRetries, err)
}

// Migrate runs database migrations
func Migrate() error {
	// Run migrations for all databases
	err := DB.AutoMigrate(
		&models.User{},
		&models.Book{},
		&models.Paper{},
		&models.Category{},
		&models.BookAuthor{},
		&models.PaperAuthor{},
		&models.ActivityLog{},
		&models.Counter{},
		&models.FileUpload{},
		&models.Download{},
		&models.PasswordResetToken{},
	)

	if err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Println("Database migrated successfully")
	return nil
}

// SeedData inserts initial data
func SeedData() error {
	// Check if admin user already exists
	var count int64
	DB.Model(&models.User{}).Where("email = ?", "admin@unidum.ac.id").Count(&count)

	if count == 0 {
		// Create admin user (password will be hashed in the handler)
		adminUser := models.User{
			Email: "admin@unidum.ac.id",
			Name:  "Administrator",
			Role:  "admin",
		}

		if err := DB.Create(&adminUser).Error; err != nil {
			log.Printf("Failed to create admin user: %v", err)
		} else {
			log.Println("Admin user created successfully")
		}
	}

	// Seed categories
	categories := []models.Category{
		{Name: "Teknik Informatika", Description: stringPtr("Kategori untuk materi Teknik Informatika"), Type: "both"},
		{Name: "Sistem Informasi", Description: stringPtr("Kategori untuk materi Sistem Informasi"), Type: "both"},
		{Name: "Ilmu Komputer", Description: stringPtr("Kategori untuk materi Ilmu Komputer"), Type: "both"},
		{Name: "Skripsi", Description: stringPtr("Tugas Akhir Mahasiswa"), Type: "paper"},
		{Name: "Jurnal Ilmiah", Description: stringPtr("Jurnal dan Publikasi Ilmiah"), Type: "paper"},
		{Name: "Buku Teks", Description: stringPtr("Buku-buku akademik"), Type: "book"},
		{Name: "Referensi", Description: stringPtr("Buku referensi dan panduan"), Type: "book"},
	}

	for _, category := range categories {
		var existingCount int64
		DB.Model(&models.Category{}).Where("name = ?", category.Name).Count(&existingCount)

		if existingCount == 0 {
			if err := DB.Create(&category).Error; err != nil {
				log.Printf("Failed to create category %s: %v", category.Name, err)
			}
		}
	}

	// Seed counters
	counters := []models.Counter{
		{Name: "total_downloads", Count: 0},
		{Name: "total_users", Count: 1},
		{Name: "total_books", Count: 0},
		{Name: "total_papers", Count: 0},
		{Name: "total_visits", Count: 0},
	}

	for _, counter := range counters {
		var existingCount int64
		DB.Model(&models.Counter{}).Where("name = ?", counter.Name).Count(&existingCount)

		if existingCount == 0 {
			if err := DB.Create(&counter).Error; err != nil {
				log.Printf("Failed to create counter %s: %v", counter.Name, err)
			}
		}
	}

	log.Println("Database seeding completed")
	return nil
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}

// SetDB sets the database instance (used for testing)
func SetDB(db *gorm.DB) {
	DB = db
}

// Helper function to create string pointer
func stringPtr(s string) *string {
	return &s
}

// Export model types for testing
type User = models.User
type Book = models.Book
type Paper = models.Paper
type Category = models.Category
type BookAuthor = models.BookAuthor
type PaperAuthor = models.PaperAuthor
type ActivityLog = models.ActivityLog
type Counter = models.Counter
type FileUpload = models.FileUpload
type Download = models.Download
