package models

import (
	"e-repository-api/configs"
	"fmt"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// User represents the user model
type User struct {
	ID                uint       `json:"id" gorm:"primaryKey"`
	Email             string     `json:"email" gorm:"unique;not null"`
	PasswordHash      string     `json:"-" gorm:"not null"`
	Name              string     `json:"name" gorm:"not null"`
	Role              string     `json:"role" gorm:"type:enum('admin','user');default:'user'"`
	UserType          string     `json:"user_type" gorm:"type:enum('student','lecturer');default:'student'"`
	NIMNIDN           *string    `json:"nim_nidn" gorm:"column:nim_nidn"`
	Faculty           *string    `json:"faculty" gorm:"type:enum('Fakultas Ekonomi','Fakultas Ilmu Komputer','Fakultas Hukum')"`
	DepartmentID      *uint      `json:"department_id"`
	Address           *string    `json:"address"`
	ProfilePictureURL *string    `json:"profile_picture_url" gorm:"size:255"`
	LoginCounter      int        `json:"login_counter" gorm:"default:0"`
	EmailVerified     bool       `json:"email_verified" gorm:"default:false"`
	VerificationToken string     `json:"-"`
	IsApproved        bool       `json:"is_approved" gorm:"default:false"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
	DeletedAt         *time.Time `json:"deleted_at,omitempty" gorm:"index"`

	// Relationships
	Department *Department `json:"department,omitempty" gorm:"foreignKey:DepartmentID"`
	Books      []Book      `json:"books,omitempty" gorm:"many2many:user_books;"`
	Papers     []Paper     `json:"papers,omitempty" gorm:"many2many:user_papers;"`
}

// Department represents the departments table
type Department struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Name      string    `json:"name" gorm:"size:255;not null"`
	Faculty   string    `json:"faculty" gorm:"type:enum('Fakultas Ekonomi','Fakultas Ilmu Komputer','Fakultas Hukum');not null"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relationships
	Users []User `json:"users,omitempty" gorm:"foreignKey:DepartmentID"`
}

// Book represents the books table
type Book struct {
	ID            uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Title         string    `json:"title" gorm:"size:500;not null"`
	Author        string    `json:"author" gorm:"size:255;not null"`
	Publisher     *string   `json:"publisher" gorm:"size:255"`
	PublishedYear *int      `json:"published_year"`
	ISBN          *string   `json:"isbn" gorm:"size:50;index"`
	Subject       *string   `json:"subject" gorm:"size:255"`
	Language      *string   `json:"language" gorm:"size:100;default:'English'"`
	Pages         *int      `json:"pages"`
	Summary       *string   `json:"summary" gorm:"type:text"`
	FileURL       *string   `json:"file_url" gorm:"size:500"`
	CoverImageURL *string   `json:"cover_image_url" gorm:"size:500"`
	CreatedBy     *uint     `json:"created_by" gorm:"index"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	// Relationships
	Creator    *User        `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	Users      []User       `json:"users,omitempty" gorm:"many2many:user_books;"`
	Authors    []BookAuthor `json:"authors,omitempty" gorm:"foreignKey:BookID"`
	Categories []Category   `json:"categories,omitempty" gorm:"many2many:book_categories;"`
}

// Paper represents the papers table
type Paper struct {
	ID            uint          `json:"id" gorm:"primaryKey"`
	Title         string        `json:"title" gorm:"size:500;not null"`
	Author        string        `json:"author" gorm:"size:255;not null"`
	Advisor       *string       `json:"advisor" gorm:"size:255"`
	University    *string       `json:"university" gorm:"size:255"`
	Department    *string       `json:"department" gorm:"size:255"`
	Year          *int          `json:"year"`
	ISSN          *string       `json:"issn" gorm:"size:191"`
	Journal       *string       `json:"journal" gorm:"size:255"`
	Volume        *int          `json:"volume"`
	Issue         *int          `json:"issue"`
	Pages         *string       `json:"pages" gorm:"size:50"`
	DOI           *string       `json:"doi" gorm:"size:255"`
	Abstract      *string       `json:"abstract" gorm:"type:text"`
	Keywords      *string       `json:"keywords" gorm:"type:text"`
	FileURL       *string       `json:"file_url" gorm:"size:500"`
	CoverImageURL *string       `json:"cover_image_url" gorm:"size:500"`
	CreatedBy     *uint         `json:"created_by"`
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`
	Authors       []PaperAuthor `json:"authors,omitempty"`
}

// Category represents the categories table
type Category struct {
	ID          uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string    `json:"name" gorm:"size:255;not null;index:idx_categories_name"`
	Description *string   `json:"description" gorm:"type:text"`
	Type        string    `json:"type" gorm:"type:enum('book','paper','both');default:'both';index:idx_categories_type"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relationships
	Books  []Book  `json:"books,omitempty" gorm:"many2many:book_categories;"`
	Papers []Paper `json:"papers,omitempty" gorm:"many2many:paper_categories;"`
}

// BookAuthor represents the book_authors table
type BookAuthor struct {
	ID         uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	BookID     uint      `json:"book_id" gorm:"not null;index:idx_book_authors_book_id"`
	UserID     *uint     `json:"user_id" gorm:"index:idx_book_authors_user_id"`
	AuthorName string    `json:"author_name" gorm:"type:varchar(255);not null;index:idx_book_authors_author_name"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`

	// Relationships
	Book *Book `json:"book,omitempty" gorm:"foreignKey:BookID"`
	User *User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// PaperAuthor represents the paper_authors table
type PaperAuthor struct {
	ID         uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	PaperID    uint      `json:"paper_id" gorm:"not null;index:idx_paper_authors_paper_id"`
	UserID     *uint     `json:"user_id" gorm:"index:idx_paper_authors_user_id"`
	AuthorName string    `json:"author_name" gorm:"type:varchar(255);not null;index:idx_paper_authors_author_name"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`

	// Relationships
	Paper *Paper `json:"paper,omitempty" gorm:"foreignKey:PaperID"`
	User  *User  `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// ActivityLog represents the activity_logs table
type ActivityLog struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    *uint     `json:"user_id" gorm:"index:idx_activity_logs_user_id"`
	Action    string    `json:"action" gorm:"type:varchar(255);not null;index:idx_activity_logs_action"`
	ItemID    *uint     `json:"item_id" gorm:"index:idx_activity_logs_item"`
	ItemType  *string   `json:"item_type" gorm:"type:enum('book','paper');index:idx_activity_logs_item"`
	IPAddress *string   `json:"ip_address" gorm:"size:45"`
	UserAgent *string   `json:"user_agent" gorm:"type:text"`
	CreatedAt time.Time `json:"created_at" gorm:"index:idx_activity_logs_created_at"`

	// Relationships
	User *User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// Counter represents the counters table
type Counter struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Name      string    `json:"name" gorm:"size:255;not null;uniqueIndex:idx_counters_name"`
	Count     int64     `json:"count" gorm:"default:0"`
	UpdatedAt time.Time `json:"updated_at"`
}

// FileUpload represents the file_uploads table
type FileUpload struct {
	ID           uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Filename     string    `json:"filename" gorm:"size:255;not null"`
	OriginalName string    `json:"original_name" gorm:"size:255;not null"`
	FilePath     string    `json:"file_path" gorm:"type:longtext;not null"`
	FileSize     *int64    `json:"file_size"`
	MimeType     *string   `json:"mime_type" gorm:"size:100"`
	UploadedBy   *uint     `json:"uploaded_by" gorm:"index:idx_file_uploads_uploaded_by"`
	RelatedID    *uint     `json:"related_id" gorm:"index:idx_file_uploads_related"`
	RelatedType  *string   `json:"related_type" gorm:"type:enum('book','paper');index:idx_file_uploads_related"`
	CreatedAt    time.Time `json:"created_at" gorm:"index:idx_file_uploads_created_at"`

	// Relationships
	Uploader *User `json:"uploader,omitempty" gorm:"foreignKey:UploadedBy"`
}

// Download represents the downloads table
type Download struct {
	ID           uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID       *uint     `json:"user_id" gorm:"index:idx_downloads_user_id"`
	ItemID       uint      `json:"item_id" gorm:"not null;index:idx_downloads_item"`
	ItemType     string    `json:"item_type" gorm:"type:enum('book','paper');not null;index:idx_downloads_item"`
	IPAddress    *string   `json:"ip_address" gorm:"size:45"`
	UserAgent    *string   `json:"user_agent" gorm:"type:text"`
	DownloadedAt time.Time `json:"downloaded_at" gorm:"index:idx_downloads_downloaded_at"`

	// Relationships
	User *User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// Request/Response DTOs
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Email        string  `json:"email" binding:"required,email"`
	Name         string  `json:"name" binding:"required"`
	Password     string  `json:"password" binding:"required,min=6"`
	UserType     string  `json:"user_type" binding:"required,oneof=student lecturer"`
	NIMNIDN      string  `json:"nim_nidn" binding:"required"`
	Faculty      string  `json:"faculty" binding:"required,oneof=Fakultas Ekonomi Fakultas Ilmu Komputer Fakultas Hukum"`
	DepartmentID uint    `json:"department_id" binding:"required"`
	Address      *string `json:"address" binding:"omitempty"`
}

// UserResponse represents the user response model
type UserResponse struct {
	ID                uint                `json:"id"`
	Email             string              `json:"email"`
	Name              string              `json:"name"`
	Role              string              `json:"role"`
	UserType          string              `json:"user_type"`
	NIMNIDN           *string             `json:"nim_nidn"`
	Faculty           *string             `json:"faculty"`
	DepartmentID      *uint               `json:"department_id"`
	Department        *DepartmentResponse `json:"department"`
	Address           *string             `json:"address"`
	ProfilePictureURL *string             `json:"profile_picture_url"`
}

type DepartmentResponse struct {
	ID      uint   `json:"id"`
	Name    string `json:"name"`
	Faculty string `json:"faculty"`
}

// AuthResponse represents the authentication response model
type AuthResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

type SearchRequest struct {
	Query    string `form:"query"`
	Type     string `form:"type"`
	Category string `form:"category"`
	Year     *int   `form:"year"`
	ISBN     string `form:"isbn"`
	ISSN     string `form:"issn"`
	Page     int    `form:"page"`
	Limit    int    `form:"limit"`
	Sort     string `form:"sort"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalPages int         `json:"total_pages"`
}

// PasswordResetToken represents the password_reset_tokens table
// Used for password reset functionality
type PasswordResetToken struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    uint      `json:"user_id" gorm:"index;not null"`
	Token     string    `json:"token" gorm:"size:255;uniqueIndex;not null"`
	ExpiresAt time.Time `json:"expires_at" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`
}

// InitDB initializes the database connection
func InitDB(config *configs.Config) *gorm.DB {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		config.Database.User,
		config.Database.Password,
		config.Database.Host,
		config.Database.Port,
		config.Database.Name,
	)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(fmt.Sprintf("Failed to connect to database: %v", err))
	}

	// Set connection pool settings
	sqlDB, err := db.DB()
	if err != nil {
		panic(fmt.Sprintf("Failed to get database instance: %v", err))
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// Auto migrate the schema
	err = db.AutoMigrate(
		&User{},
		&Department{},
		&Book{},
		&Paper{},
		&Category{},
		&BookAuthor{},
		&PaperAuthor{},
		&ActivityLog{},
		&Counter{},
		&FileUpload{},
		&Download{},
		&PasswordResetToken{},
	)
	if err != nil {
		panic(fmt.Sprintf("Failed to migrate database: %v", err))
	}

	return db
}
