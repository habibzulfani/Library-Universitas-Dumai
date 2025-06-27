package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type StatsHandler struct {
	db *gorm.DB
}

func NewStatsHandler(db *gorm.DB) *StatsHandler {
	return &StatsHandler{db: db}
}

func (h *StatsHandler) GetUserCount(c *gin.Context) {
	var count int64
	h.db.Table("users").Count(&count)
	c.JSON(http.StatusOK, gin.H{"count": count})
}

func (h *StatsHandler) GetDownloadCount(c *gin.Context) {
	var count int64
	h.db.Table("downloads").Count(&count)
	c.JSON(http.StatusOK, gin.H{"count": count})
}
