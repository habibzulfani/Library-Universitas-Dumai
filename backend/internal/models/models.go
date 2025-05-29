package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents the users table
type User struct {
	ID        uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	Email     string         `json:"email" gorm:"uniqueIndex;size:191;not null"`
	Name      string         `json:"name" gorm:"type:longtext;not null"`
	Password  string         `json:"-" gorm:"type:longtext;not null"`
	NIM       *string        `json:"nim" gorm:"type:longtext"`
	Jurusan   *string        `json:"jurusan" gorm:"type:longtext"`
	Address   *string        `json:"address" gorm:"type:longtext"`
	Role      string         `json:"role" gorm:"type:enum('public','user','admin');default:'user'"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
	
	// Relationships
	Books   []Book  `json:"books,omitempty" gorm:"many2many:user_books;"`
	Papers  []Paper `json:"papers,omitempty" gorm:"many2many:user_papers;"`
}

// Book represents the books table
type Book struct {
	ID            uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	Title         string         `json:"title" gorm:"type:longtext;not null"`
	Author        string         `json:"author" gorm:"type:longtext;not null"`
	Publisher     *string        `json:"publisher" gorm:"type:longtext"`
	PublishedYear *int64         `json:"published_year"`
	ISBN          *string        `json:"isbn" gorm:"size:191;index"`
	Subject       *string        `json:"subject" gorm:"type:longtext"`
	Language      *string        `json:"language" gorm:"type:longtext"`
	Pages         *int64         `json:"pages"`
	Summary       *string        `json:"summary" gorm:"type:text"`
	FileURL       *string        `json:"file_url" gorm:"type:longtext"`
	CreatedBy     *uint          `json:"created_by" gorm:"index"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"deleted_at" gorm:"index"`
	
	// Relationships
	Creator    *User          `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	Users      []User         `json:"users,omitempty" gorm:"many2many:user_books;"`
	Authors    []BookAuthor   `json:"authors,omitempty" gorm:"foreignKey:BookID"`
	Categories []Category     `json:"categories,omitempty" gorm:"many2many:book_categories;"`
}

// Paper represents the papers table
type Paper struct {
	ID         uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	Title      string         `json:"title" gorm:"type:longtext;not null"`
	Author     string         `json:"author" gorm:"type:longtext;not null"`
	Advisor    *string        `json:"advisor" gorm:"type:longtext"`
	University *string        `json:"university" gorm:"type:longtext"`
	Department *string        `json:"department" gorm:"type:longtext"`
	Year       *int64         `json:"year"`
	ISSN       *string        `json:"issn" gorm:"size:191;index"`
	Abstract   *string        `json:"abstract" gorm:"type:text"`
	Keywords   *string        `json:"keywords" gorm:"type:text"`
	FileURL    *string        `json:"file_url" gorm:"type:longtext"`
	CreatedBy  *uint          `json:"created_by" gorm:"index"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"deleted_at" gorm:"index"`
	
	// Relationships
	Creator    *User          `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	Users      []User         `json:"users,omitempty" gorm:"many2many:user_papers;"`
	Authors    []PaperAuthor  `json:"authors,omitempty" gorm:"foreignKey:PaperID"`
	Categories []Category     `json:"categories,omitempty" gorm:"many2many:paper_categories;"`
}

// Category represents the categories table
type Category struct {
	ID          uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string    `json:"name" gorm:"size:255;not null;index"`
	Description *string   `json:"description" gorm:"type:text"`
	Type        string    `json:"type" gorm:"type:enum('book','paper','both');default:'both'"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	
	// Relationships
	Books  []Book  `json:"books,omitempty" gorm:"many2many:book_categories;"`
	Papers []Paper `json:"papers,omitempty" gorm:"many2many:paper_categories;"`
}

// BookAuthor represents the book_authors table
type BookAuthor struct {
	ID         uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	BookID     uint      `json:"book_id" gorm:"not null;index"`
	UserID     *uint     `json:"user_id" gorm:"index"`
	AuthorName string    `json:"author_name" gorm:"type:longtext;not null"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
	
	// Relationships
	Book *Book `json:"book,omitempty" gorm:"foreignKey:BookID"`
	User *User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// PaperAuthor represents the paper_authors table
type PaperAuthor struct {
	ID         uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	PaperID    uint      `json:"paper_id" gorm:"not null;index"`
	UserID     *uint     `json:"user_id" gorm:"index"`
	AuthorName string    `json:"author_name" gorm:"type:longtext;not null"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
	
	// Relationships
	Paper *Paper `json:"paper,omitempty" gorm:"foreignKey:PaperID"`
	User  *User  `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// ActivityLog represents the activity_logs table
type ActivityLog struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    *uint     `json:"user_id" gorm:"index"`
	Action    string    `json:"action" gorm:"type:longtext;not null"`
	ItemID    *uint     `json:"item_id"`
	ItemType  *string   `json:"item_type" gorm:"type:enum('book','paper')"`
	IPAddress *string   `json:"ip_address" gorm:"size:45"`
	UserAgent *string   `json:"user_agent" gorm:"type:text"`
	CreatedAt time.Time `json:"created_at"`
	
	// Relationships
	User *User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// Counter represents the counters table
type Counter struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Name      string    `json:"name" gorm:"size:255;not null;uniqueIndex"`
	Count     int64     `json:"count" gorm:"default:0"`
	UpdatedAt time.Time `json:"updated_at"`
}

// FileUpload represents the file_uploads table
type FileUpload struct {
	ID           uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	OriginalName string    `json:"original_name" gorm:"size:255;not null"`
	StoredName   string    `json:"stored_name" gorm:"size:255;not null"`
	FilePath     string    `json:"file_path" gorm:"type:longtext;not null"`
	FileSize     *int64    `json:"file_size"`
	MimeType     *string   `json:"mime_type" gorm:"size:100"`
	UploadedBy   *uint     `json:"uploaded_by" gorm:"index"`
	RelatedID    *uint     `json:"related_id"`
	RelatedType  *string   `json:"related_type" gorm:"type:enum('book','paper')"`
	CreatedAt    time.Time `json:"created_at"`
	
	// Relationships
	Uploader *User `json:"uploader,omitempty" gorm:"foreignKey:UploadedBy"`
}

// Download represents the downloads table
type Download struct {
	ID           uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID       *uint     `json:"user_id" gorm:"index"`
	ItemID       uint      `json:"item_id" gorm:"not null"`
	ItemType     string    `json:"item_type" gorm:"type:enum('book','paper');not null"`
	IPAddress    *string   `json:"ip_address" gorm:"size:45"`
	UserAgent    *string   `json:"user_agent" gorm:"type:text"`
	DownloadedAt time.Time `json:"downloaded_at"`
	
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
	Address  *string `json:"address"`
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