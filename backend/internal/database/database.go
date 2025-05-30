package database

import (
	"fmt"
	"log"

	"e-repository-api/configs"
	"e-repository-api/internal/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Connect initializes the database connection
func Connect(config *configs.Config) error {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		config.Database.User,
		config.Database.Password,
		config.Database.Host,
		config.Database.Port,
		config.Database.Name,
	)

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("Database connected successfully")
	return nil
}

// Migrate runs database migrations
func Migrate() error {
	// Skip auto-migration since we have a proper database schema
	// that's initialized by Docker with the database_schema.sql file
	// This prevents conflicts with existing indexes and tables
	
	/*
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
	)

	if err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}
	*/

	log.Println("Database migration skipped - using existing schema")
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