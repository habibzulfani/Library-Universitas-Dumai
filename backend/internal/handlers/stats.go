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

// GetUsersPerMonth returns user registration count grouped by year and month for the last 12 months
func (h *StatsHandler) GetUsersPerMonth(c *gin.Context) {
	type Result struct {
		Year  int `json:"year"`
		Month int `json:"month"`
		Count int `json:"count"`
	}
	var results []Result
	h.db.Raw(`
		SELECT YEAR(created_at) as year, MONTH(created_at) as month, COUNT(*) as count
		FROM users
		WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
		GROUP BY year, month
		ORDER BY year, month
	`).Scan(&results)
	c.JSON(http.StatusOK, results)
}

// GetDownloadsPerMonth returns download count grouped by year and month for the last 12 months
func (h *StatsHandler) GetDownloadsPerMonth(c *gin.Context) {
	type Result struct {
		Year  int `json:"year"`
		Month int `json:"month"`
		Count int `json:"count"`
	}
	var results []Result
	h.db.Raw(`
		SELECT YEAR(downloaded_at) as year, MONTH(downloaded_at) as month, COUNT(*) as count
		FROM downloads
		WHERE downloaded_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
		GROUP BY year, month
		ORDER BY year, month
	`).Scan(&results)
	c.JSON(http.StatusOK, results)
}

func (h *StatsHandler) GetCitationCount(c *gin.Context) {
	var count int64
	h.db.Table("citations").Count(&count)
	c.JSON(http.StatusOK, gin.H{"count": count})
}

// GetCitationsPerMonth returns citation count grouped by year and month for the last 12 months
func (h *StatsHandler) GetCitationsPerMonth(c *gin.Context) {
	type Result struct {
		Year  int `json:"year"`
		Month int `json:"month"`
		Count int `json:"count"`
	}
	var results []Result
	h.db.Raw(`
		SELECT YEAR(cited_at) as year, MONTH(cited_at) as month, COUNT(*) as count
		FROM citations
		WHERE cited_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
		GROUP BY year, month
		ORDER BY year, month
	`).Scan(&results)
	c.JSON(http.StatusOK, results)
}

// GetUserCitationsPerMonth returns citation count for the user's own works grouped by year/month
func (h *StatsHandler) GetUserCitationsPerMonth(c *gin.Context) {
	type Result struct {
		Year  int `json:"year"`
		Month int `json:"month"`
		Count int `json:"count"`
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	var results []Result
	h.db.Raw(`
		SELECT YEAR(c.cited_at) as year, MONTH(c.cited_at) as month, COUNT(*) as count
		FROM citations c
		LEFT JOIN books b ON c.item_id = b.id AND c.item_type = 'book'
		LEFT JOIN papers p ON c.item_id = p.id AND c.item_type = 'paper'
		WHERE c.cited_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
		AND ((c.item_type = 'book' AND b.created_by = ?) OR (c.item_type = 'paper' AND p.created_by = ?))
		GROUP BY year, month
		ORDER BY year, month
	`, userID, userID).Scan(&results)
	c.JSON(http.StatusOK, results)
}

// GetUserStats returns totalBooks, totalPapers, totalDownloads, totalCitations for the authenticated user
func (h *StatsHandler) GetUserStats(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	var totalBooks, totalPapers, totalDownloads, totalCitations int64
	h.db.Table("books").Where("created_by = ?", userID).Count(&totalBooks)
	h.db.Table("papers").Where("created_by = ?", userID).Count(&totalPapers)
	h.db.Raw(`SELECT COUNT(*) FROM downloads d LEFT JOIN books b ON d.item_id = b.id AND d.item_type = 'book' LEFT JOIN papers p ON d.item_id = p.id AND d.item_type = 'paper' WHERE (d.item_type = 'book' AND b.created_by = ?) OR (d.item_type = 'paper' AND p.created_by = ?)`, userID, userID).Scan(&totalDownloads)
	h.db.Raw(`SELECT COUNT(*) FROM citations c LEFT JOIN books b ON c.item_id = b.id AND c.item_type = 'book' LEFT JOIN papers p ON c.item_id = p.id AND c.item_type = 'paper' WHERE (c.item_type = 'book' AND b.created_by = ?) OR (c.item_type = 'paper' AND p.created_by = ?)`, userID, userID).Scan(&totalCitations)
	c.JSON(http.StatusOK, gin.H{
		"totalBooks":     totalBooks,
		"totalPapers":    totalPapers,
		"totalDownloads": totalDownloads,
		"totalCitations": totalCitations,
	})
}

// GetUserStatsById returns stats for a user by ID (public)
func (h *StatsHandler) GetUserStatsById(c *gin.Context) {
	userID := c.Param("id")
	var totalBooks, totalPapers, totalDownloads, totalCitations int64
	h.db.Table("books").Where("created_by = ?", userID).Count(&totalBooks)
	h.db.Table("papers").Where("created_by = ?", userID).Count(&totalPapers)
	h.db.Raw(`SELECT COUNT(*) FROM downloads d LEFT JOIN books b ON d.item_id = b.id AND d.item_type = 'book' LEFT JOIN papers p ON d.item_id = p.id AND d.item_type = 'paper' WHERE (d.item_type = 'book' AND b.created_by = ?) OR (d.item_type = 'paper' AND p.created_by = ?)`, userID, userID).Scan(&totalDownloads)
	h.db.Raw(`SELECT COUNT(*) FROM citations c LEFT JOIN books b ON c.item_id = b.id AND c.item_type = 'book' LEFT JOIN papers p ON c.item_id = p.id AND c.item_type = 'paper' WHERE (c.item_type = 'book' AND b.created_by = ?) OR (c.item_type = 'paper' AND p.created_by = ?)`, userID, userID).Scan(&totalCitations)
	c.JSON(http.StatusOK, gin.H{
		"totalBooks":     totalBooks,
		"totalPapers":    totalPapers,
		"totalDownloads": totalDownloads,
		"totalCitations": totalCitations,
	})
}

// GetUserCitationsPerMonthById returns citation count per month for a user's works (public)
func (h *StatsHandler) GetUserCitationsPerMonthById(c *gin.Context) {
	type Result struct {
		Year  int `json:"year"`
		Month int `json:"month"`
		Count int `json:"count"`
	}
	userID := c.Param("id")
	var results []Result
	h.db.Raw(`
		SELECT YEAR(c.cited_at) as year, MONTH(c.cited_at) as month, COUNT(*) as count
		FROM citations c
		LEFT JOIN books b ON c.item_id = b.id AND c.item_type = 'book'
		LEFT JOIN papers p ON c.item_id = p.id AND c.item_type = 'paper'
		WHERE c.cited_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
		AND ((c.item_type = 'book' AND b.created_by = ?) OR (c.item_type = 'paper' AND p.created_by = ?))
		GROUP BY year, month
		ORDER BY year, month
	`, userID, userID).Scan(&results)
	c.JSON(http.StatusOK, results)
}

// GetUserDownloadsPerMonthById returns download count per month for a user's works (public)
func (h *StatsHandler) GetUserDownloadsPerMonthById(c *gin.Context) {
	type Result struct {
		Year  int `json:"year"`
		Month int `json:"month"`
		Count int `json:"count"`
	}
	userID := c.Param("id")
	var results []Result
	h.db.Raw(`
		SELECT YEAR(d.downloaded_at) as year, MONTH(d.downloaded_at) as month, COUNT(*) as count
		FROM downloads d
		LEFT JOIN books b ON d.item_id = b.id AND d.item_type = 'book'
		LEFT JOIN papers p ON d.item_id = p.id AND d.item_type = 'paper'
		WHERE d.downloaded_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
		AND ((d.item_type = 'book' AND b.created_by = ?) OR (d.item_type = 'paper' AND p.created_by = ?))
		GROUP BY year, month
		ORDER BY year, month
	`, userID, userID).Scan(&results)
	c.JSON(http.StatusOK, results)
}

// GetBookStats returns download and citation count for a book (public)
func (h *StatsHandler) GetBookStats(c *gin.Context) {
	bookID := c.Param("id")
	var downloadCount, citationCount int64
	h.db.Table("downloads").Where("item_id = ? AND item_type = 'book'", bookID).Count(&downloadCount)
	h.db.Table("citations").Where("item_id = ? AND item_type = 'book'", bookID).Count(&citationCount)
	c.JSON(http.StatusOK, gin.H{
		"download_count": downloadCount,
		"citation_count": citationCount,
	})
}

// GetPaperStats returns download and citation count for a paper (public)
func (h *StatsHandler) GetPaperStats(c *gin.Context) {
	paperID := c.Param("id")
	var downloadCount, citationCount int64
	h.db.Table("downloads").Where("item_id = ? AND item_type = 'paper'", paperID).Count(&downloadCount)
	h.db.Table("citations").Where("item_id = ? AND item_type = 'paper'", paperID).Count(&citationCount)
	c.JSON(http.StatusOK, gin.H{
		"download_count": downloadCount,
		"citation_count": citationCount,
	})
}

// GetBooksPerMonth returns book count grouped by year and month for the last 12 months
func (h *StatsHandler) GetBooksPerMonth(c *gin.Context) {
	type Result struct {
		Year  int `json:"year"`
		Month int `json:"month"`
		Count int `json:"count"`
	}
	var results []Result
	h.db.Raw(`
		SELECT YEAR(created_at) as year, MONTH(created_at) as month, COUNT(*) as count
		FROM books
		WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
		GROUP BY year, month
		ORDER BY year, month
	`).Scan(&results)
	c.JSON(http.StatusOK, results)
}

// GetPapersPerMonth returns paper count grouped by year and month for the last 12 months
func (h *StatsHandler) GetPapersPerMonth(c *gin.Context) {
	type Result struct {
		Year  int `json:"year"`
		Month int `json:"month"`
		Count int `json:"count"`
	}
	var results []Result
	h.db.Raw(`
		SELECT YEAR(created_at) as year, MONTH(created_at) as month, COUNT(*) as count
		FROM papers
		WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
		GROUP BY year, month
		ORDER BY year, month
	`).Scan(&results)
	c.JSON(http.StatusOK, results)
}

// GetUserDownloadsPerMonth returns download count per month for the authenticated user's works
func (h *StatsHandler) GetUserDownloadsPerMonth(c *gin.Context) {
	type Result struct {
		Year  int `json:"year"`
		Month int `json:"month"`
		Count int `json:"count"`
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	var results []Result
	h.db.Raw(`
		SELECT YEAR(d.downloaded_at) as year, MONTH(d.downloaded_at) as month, COUNT(*) as count
		FROM downloads d
		LEFT JOIN books b ON d.item_id = b.id AND d.item_type = 'book'
		LEFT JOIN papers p ON d.item_id = p.id AND d.item_type = 'paper'
		WHERE d.downloaded_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
		AND ((d.item_type = 'book' AND b.created_by = ?) OR (d.item_type = 'paper' AND p.created_by = ?))
		GROUP BY year, month
		ORDER BY year, month
	`, userID, userID).Scan(&results)
	c.JSON(http.StatusOK, results)
}
