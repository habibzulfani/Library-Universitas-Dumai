package models

import (
	"time"
)

// User represents the users table
type User struct {
	ID           uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Email        string    `json:"email" gorm:"uniqueIndex:idx_users_email;size:255;not null"`
	PasswordHash string    `json:"-" gorm:"column:password_hash;size:255;not null"`
	Name         string    `json:"name" gorm:"size:255;not null"`
	Role         string    `json:"role" gorm:"type:enum('admin','user');default:'user'"`
	NIM          *string   `json:"nim" gorm:"size:50"`
	Jurusan      *string   `json:"jurusan" gorm:"size:255"`
	LoginCounter int       `json:"login_counter" gorm:"default:0"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	
	// Relationships
	Books   []Book  `json:"books,omitempty" gorm:"many2many:user_books;"`
	Papers  []Paper `json:"papers,omitempty" gorm:"many2many:user_papers;"`
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
	CreatedBy     *uint     `json:"created_by" gorm:"index"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	
	// Relationships
	Creator    *User          `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	Users      []User         `json:"users,omitempty" gorm:"many2many:user_books;"`
	Authors    []BookAuthor   `json:"authors,omitempty" gorm:"foreignKey:BookID"`
	Categories []Category     `json:"categories,omitempty" gorm:"many2many:book_categories;"`
}

// Paper represents the papers table
type Paper struct {
	ID         uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Title      string    `json:"title" gorm:"size:500;not null"`
	Author     string    `json:"author" gorm:"size:255;not null"`
	Advisor    *string   `json:"advisor" gorm:"size:255"`
	University *string   `json:"university" gorm:"size:255"`
	Department *string   `json:"department" gorm:"size:255"`
	Year       *int      `json:"year"`
	ISSN       *string   `json:"issn" gorm:"size:191;index"`
	Abstract   *string   `json:"abstract" gorm:"type:text"`
	Keywords   *string   `json:"keywords" gorm:"type:text"`
	FileURL    *string   `json:"file_url" gorm:"size:500"`
	CreatedBy  *uint     `json:"created_by" gorm:"index"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
	
	// Relationships
	Creator    *User          `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	Users      []User         `json:"users,omitempty" gorm:"many2many:user_papers;"`
	Authors    []PaperAuthor  `json:"authors,omitempty" gorm:"foreignKey:PaperID"`
	Categories []Category     `json:"categories,omitempty" gorm:"many2many:paper_categories;"`
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
	AuthorName string    `json:"author_name" gorm:"type:longtext;not null;index:idx_book_authors_author_name"`
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
	AuthorName string    `json:"author_name" gorm:"type:longtext;not null;index:idx_paper_authors_author_name"`
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
	Action    string    `json:"action" gorm:"type:longtext;not null;index:idx_activity_logs_action"`
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
	Email    string  `json:"email" binding:"required,email"`
	Name     string  `json:"name" binding:"required"`
	Password string  `json:"password" binding:"required,min=6"`
	NIM      *string `json:"nim"`
	Jurusan  *string `json:"jurusan"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type SearchRequest struct {
	Query      string `json:"query" form:"query"`
	Type       string `json:"type" form:"type"` // "book", "paper", "both"
	Category   string `json:"category" form:"category"`
	Year       *int   `json:"year" form:"year"`
	Page       int    `json:"page" form:"page"`
	Limit      int    `json:"limit" form:"limit"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalPages int         `json:"total_pages"`
}