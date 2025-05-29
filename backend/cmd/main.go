package main

import (
	"log"
	"net/http"

	"e-repository-api/configs"
	"e-repository-api/internal/database"
	"e-repository-api/internal/handlers"
	"e-repository-api/internal/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	config := configs.LoadConfig()

	// Connect to database
	if err := database.Connect(config); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Run migrations
	if err := database.Migrate(); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	// Seed initial data
	if err := database.SeedData(); err != nil {
		log.Fatal("Failed to seed data:", err)
	}

	// Initialize Gin
	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		
		c.Next()
	})

	// Serve static files from uploads directory
	r.Static("/uploads", "./uploads")

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(config)
	bookHandler := handlers.NewBookHandler(config)
	paperHandler := handlers.NewPaperHandler(config)

	// Public routes
	public := r.Group("/api/v1")
	{
		// Authentication routes
		public.POST("/auth/register", authHandler.Register)
		public.POST("/auth/login", authHandler.Login)

		// Public book and paper access
		public.GET("/books", bookHandler.GetBooks)
		public.GET("/books/:id", bookHandler.GetBook)
		public.GET("/papers", paperHandler.GetPapers)
		public.GET("/papers/:id", paperHandler.GetPaper)

		// Health check
		public.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status": "ok",
				"message": "E-Repository API is running",
			})
		})
	}

	// Optional auth routes (can be accessed with or without auth)
	optional := r.Group("/api/v1")
	optional.Use(middleware.OptionalAuthMiddleware(config))
	{
		optional.GET("/books/:id/download", bookHandler.DownloadBook)
		optional.GET("/papers/:id/download", paperHandler.DownloadPaper)
	}

	// Protected routes (require authentication)
	protected := r.Group("/api/v1")
	protected.Use(middleware.AuthMiddleware(config))
	{
		// User profile routes
		protected.GET("/profile", authHandler.GetProfile)
		protected.PUT("/profile", authHandler.UpdateProfile)
		protected.PUT("/profile/password", authHandler.ChangePassword)

		// User content management
		// Books
		protected.POST("/user/books", bookHandler.CreateUserBook)
		protected.GET("/user/books", bookHandler.GetUserBooks)
		protected.PUT("/user/books/:id", bookHandler.UpdateUserBook)
		protected.DELETE("/user/books/:id", bookHandler.DeleteUserBook)

		// Papers
		protected.POST("/user/papers", paperHandler.CreateUserPaper)
		protected.GET("/user/papers", paperHandler.GetUserPapers)
		protected.PUT("/user/papers/:id", paperHandler.UpdateUserPaper)
		protected.DELETE("/user/papers/:id", paperHandler.DeleteUserPaper)
	}

	// Admin only routes
	admin := r.Group("/api/v1/admin")
	admin.Use(middleware.AuthMiddleware(config))
	admin.Use(middleware.AdminMiddleware())
	{
		// Book management
		admin.POST("/books", bookHandler.CreateBook)
		admin.PUT("/books/:id", bookHandler.UpdateBook)
		admin.DELETE("/books/:id", bookHandler.DeleteBook)

		// Paper management
		admin.POST("/papers", paperHandler.CreatePaper)
		admin.PUT("/papers/:id", paperHandler.UpdatePaper)
		admin.DELETE("/papers/:id", paperHandler.DeletePaper)

		// Statistics
		admin.GET("/stats", func(c *gin.Context) {
			var stats map[string]interface{}
			
			// Get counters
			var counters []struct {
				Name  string `json:"name"`
				Count int64  `json:"count"`
			}
			database.GetDB().Table("counters").Select("name, count").Find(&counters)
			
			stats = make(map[string]interface{})
			for _, counter := range counters {
				stats[counter.Name] = counter.Count
			}
			
			c.JSON(http.StatusOK, gin.H{"stats": stats})
		})
	}

	// Start server
	port := ":" + config.Server.Port
	log.Printf("Server starting on port %s", config.Server.Port)
	if err := r.Run(port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
} 