// This file is deprecated. Router setup has been moved to cmd/main.go
// Keeping this file for reference but it's no longer used.

// SetupRoutes configures all the routes for the application
package routes

import (
	"e-repository-api/configs"
	"e-repository-api/internal/database"
	"e-repository-api/internal/handlers"
	"e-repository-api/internal/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, config *configs.Config) {
	// Initialize handlers
	authHandler := handlers.NewAuthHandler(database.GetDB(), config)
	bookHandler := handlers.NewBookHandler(database.GetDB(), config)
	paperHandler := handlers.NewPaperHandler(database.GetDB(), config)
	authorHandler := handlers.NewAuthorHandler(database.GetDB())
	statsHandler := handlers.NewStatsHandler(database.GetDB())

	// Public routes
	public := router.Group("/api/v1")
	{
		// Auth routes
		auth := public.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/forgot-password", authHandler.ForgotPassword)
			auth.POST("/reset-password", authHandler.ResetPassword)
			auth.GET("/verify-email", authHandler.VerifyEmail)
		}

		// Public repository routes
		public.GET("/books", bookHandler.GetBooks)
		public.GET("/books/:id", bookHandler.GetBook)
		public.GET("/papers", paperHandler.GetPapers)
		public.GET("/papers/:id", paperHandler.GetPaper)

		// Author routes
		authorRoutes := public.Group("/authors")
		{
			authorRoutes.GET("/search", authorHandler.SearchAuthors)
			authorRoutes.GET("/:name/works", authorHandler.GetAuthorWorks)
		}

		public.GET("/users/count", statsHandler.GetUserCount)
		public.GET("/downloads/count", statsHandler.GetDownloadCount)
	}

	// Protected routes
	protected := router.Group("/api/v1")
	protected.Use(middleware.AuthMiddleware(config))
	{
		// User routes
		users := protected.Group("/users")
		{
			users.GET("/me", authHandler.GetProfile)
			users.PUT("/me", authHandler.UpdateProfile)
			users.PUT("/me/password", authHandler.ChangePassword)
		}

		// Admin routes
		admin := protected.Group("/admin")
		admin.Use(middleware.AdminMiddleware())
		{
			admin.GET("/users", authHandler.GetAllUsers)
			admin.GET("/users/:id", authHandler.GetUser)
			admin.PUT("/users/:id", authHandler.UpdateUser)
			admin.DELETE("/users/:id", authHandler.DeleteUser)
			admin.GET("/lecturers", authHandler.GetPendingLecturers)
			admin.POST("/lecturers/:id/approve", authHandler.ApproveLecturer)

			// Admin repository routes
			admin.POST("/books", bookHandler.CreateBook)
			admin.PUT("/books/:id", bookHandler.UpdateBook)
			admin.DELETE("/books/:id", bookHandler.DeleteBook)
			admin.POST("/papers", paperHandler.CreatePaper)
			admin.PUT("/papers/:id", paperHandler.UpdatePaper)
			admin.DELETE("/papers/:id", paperHandler.DeletePaper)
		}

		// Protected repository routes
		protected.GET("/books/:id/download", bookHandler.DownloadBook)
		protected.GET("/papers/:id/download", paperHandler.DownloadPaper)

		// User repository routes
		user := protected.Group("/user")
		{
			user.POST("/books", bookHandler.CreateUserBook)
			user.PUT("/books/:id", bookHandler.UpdateUserBook)
			user.DELETE("/books/:id", bookHandler.DeleteUserBook)
			user.GET("/books", bookHandler.GetUserBooks)
			user.POST("/papers", paperHandler.CreateUserPaper)
			user.PUT("/papers/:id", paperHandler.UpdateUserPaper)
			user.DELETE("/papers/:id", paperHandler.DeleteUserPaper)
			user.GET("/papers", paperHandler.GetUserPapers)
		}
	}
}
