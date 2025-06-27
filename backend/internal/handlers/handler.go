package handlers

import (
	"e-repository-api/configs"

	"gorm.io/gorm"
)

// Handler combines all handlers
type Handler struct {
	*BookHandler
	*PaperHandler
	db     *gorm.DB
	config *configs.Config
}

// NewHandler creates a new handler instance
func NewHandler(db *gorm.DB, config *configs.Config) *Handler {
	return &Handler{
		BookHandler:  NewBookHandler(db, config),
		PaperHandler: NewPaperHandler(db, config),
		db:           db,
		config:       config,
	}
}
