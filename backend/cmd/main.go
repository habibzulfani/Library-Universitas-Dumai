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
		origin := c.GetHeader("Origin")
		if origin != "" {
			c.Header("Access-Control-Allow-Origin", origin)
		}
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, Accept-Encoding, X-CSRF-Token, Accept")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	})

	// Serve static files from uploads directory
	r.Static("/uploads", "./uploads")

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(database.GetDB(), config)
	bookHandler := handlers.NewBookHandler(database.GetDB(), config)
	paperHandler := handlers.NewPaperHandler(database.GetDB(), config)
	authorHandler := handlers.NewAuthorHandler(database.GetDB())
	statsHandler := handlers.NewStatsHandler(database.GetDB())
	metadataHandler := handlers.NewMetadataHandler()

	// API routes
	api := r.Group("/api")
	{
		// Health check
		api.GET("/v1/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "healthy"})
		})

		// Auth routes
		auth := api.Group("/v1/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/forgot-password", authHandler.ForgotPassword)
			auth.POST("/reset-password", authHandler.ResetPassword)
			auth.GET("/verify-email", authHandler.VerifyEmail)
		}

		// Public content routes
		public := api.Group("/v1")
		{
			public.GET("/books", bookHandler.GetBooks)
			public.GET("/books/:id", bookHandler.GetBook)
			public.GET("/papers", paperHandler.GetPapers)
			public.GET("/papers/:id", paperHandler.GetPaper)
			public.GET("/departments", authHandler.GetDepartments)
			authors := public.Group("/authors")
			{
				authors.GET("/search", authorHandler.SearchAuthors)
				authors.GET("/:name/works", authorHandler.GetAuthorWorks)
			}
			public.GET("/users/count", statsHandler.GetUserCount)
			public.GET("/downloads/count", statsHandler.GetDownloadCount)
			public.GET("/users-per-month", statsHandler.GetUsersPerMonth)
			public.GET("/downloads-per-month", statsHandler.GetDownloadsPerMonth)
			public.GET("/users/:id", authHandler.GetPublicUser)
			public.GET("/citations/count", statsHandler.GetCitationCount)
			public.GET("/citations-per-month", statsHandler.GetCitationsPerMonth)
			public.GET("/users/:id/stats", statsHandler.GetUserStatsById)
			public.GET("/users/:id/citations-per-month", statsHandler.GetUserCitationsPerMonthById)
			public.GET("/users/:id/downloads-per-month", statsHandler.GetUserDownloadsPerMonthById)
			public.GET("/books/:id/stats", statsHandler.GetBookStats)
			public.GET("/papers/:id/stats", statsHandler.GetPaperStats)
			public.GET("/books-per-month", statsHandler.GetBooksPerMonth)
			public.GET("/papers-per-month", statsHandler.GetPapersPerMonth)

			// Public download and citation routes
			public.GET("/books/:id/download", bookHandler.DownloadBook)
			public.POST("/books/:id/cite", bookHandler.CiteBook)
			public.GET("/papers/:id/download", paperHandler.DownloadPaper)
			public.POST("/papers/:id/cite", paperHandler.CitePaper)

			// Metadata extraction routes
			public.POST("/metadata/extract", metadataHandler.ExtractMetadata)
			public.POST("/metadata/extract-from-url", metadataHandler.ExtractMetadataFromURL)
		}

		// Protected routes
		protected := api.Group("/v1")
		protected.Use(middleware.AuthMiddleware(config))
		{
			// Profile routes
			protected.GET("/profile", authHandler.GetProfile)
			protected.PUT("/profile", authHandler.UpdateProfile)
			protected.PUT("/profile/password", authHandler.ChangePassword)

			// User routes
			user := protected.Group("/user")
			{
				// User book routes
				user.POST("/books", bookHandler.CreateUserBook)
				user.GET("/books", bookHandler.GetUserBooks)
				user.PUT("/books/:id", bookHandler.UpdateUserBook)
				user.DELETE("/books/:id", bookHandler.DeleteUserBook)
				user.GET("/books/:id/download", bookHandler.DownloadBook)
				user.POST("/books/:id/cite", bookHandler.CiteBook)

				// User paper routes
				user.POST("/papers", paperHandler.CreateUserPaper)
				user.GET("/papers", paperHandler.GetUserPapers)
				user.PUT("/papers/:id", paperHandler.UpdateUserPaper)
				user.DELETE("/papers/:id", paperHandler.DeleteUserPaper)
				user.GET("/papers/:id/download", paperHandler.DownloadPaper)
				user.POST("/papers/:id/cite", paperHandler.CitePaper)
				user.GET("/citations-per-month", statsHandler.GetUserCitationsPerMonth)
				user.GET("/stats", statsHandler.GetUserStats)
				user.GET("/downloads-per-month", statsHandler.GetUserDownloadsPerMonth)
			}
		}

		// Admin routes
		admin := api.Group("/v1/admin")
		admin.Use(middleware.AuthMiddleware(config))
		admin.Use(middleware.AdminMiddleware())
		{
			// Admin user management
			admin.GET("/users", authHandler.GetAllUsers)
			admin.GET("/users/:id", authHandler.GetUser)
			admin.PUT("/users/:id", authHandler.UpdateUser)
			admin.DELETE("/users/:id", authHandler.DeleteUser)
			admin.POST("/users/bulk-delete", authHandler.BulkDeleteUsers)
			admin.GET("/lecturers", authHandler.GetPendingLecturers)
			admin.POST("/lecturers/:id/approve", authHandler.ApproveLecturer)

			// Admin repository management
			admin.GET("/books", bookHandler.GetBooks)
			admin.POST("/books", bookHandler.CreateBook)
			admin.PUT("/books/:id", bookHandler.UpdateBook)
			admin.DELETE("/books/:id", bookHandler.DeleteBook)
			admin.GET("/papers", paperHandler.GetPapers)
			admin.POST("/papers", paperHandler.CreatePaper)
			admin.PUT("/papers/:id", paperHandler.UpdatePaper)
			admin.DELETE("/papers/:id", paperHandler.DeletePaper)
		}
	}

	// Start server
	port := ":" + config.Server.Port
	log.Printf("Server starting on port %s", config.Server.Port)
	if err := r.Run(port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
