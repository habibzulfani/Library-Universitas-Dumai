package utils

import (
	"log"
	"os"

	"gorm.io/gorm"
)

// DeleteFileIfUnreferenced deletes a file from disk if no other records in the table reference it.
//   - db: the gorm DB
//   - table: the table name (e.g., "books", "papers")
//   - column: the column name (e.g., "file_url", "cover_image_url")
//   - filePath: the file path to check (should be relative, e.g., "/uploads/books/filename.pdf")
//   - excludeID: the ID of the current record to exclude from the check
func DeleteFileIfUnreferenced(db *gorm.DB, table, column, filePath string, excludeID uint) {
	if filePath == "" {
		log.Printf("[DeleteFileIfUnreferenced] Empty file path provided for %s.%s, record ID: %d", table, column, excludeID)
		return
	}

	var count int64
	db.Table(table).Where(column+" = ? AND id != ?", filePath, excludeID).Count(&count)

	// Remove leading slash if present for file system operations
	trimmed := filePath
	if len(trimmed) > 0 && trimmed[0] == '/' {
		trimmed = trimmed[1:]
	}

	if count == 0 {
		log.Printf("[DeleteFileIfUnreferenced] Attempting to delete file: %s (original: %s)", trimmed, filePath)
		err := os.Remove(trimmed)
		if err != nil && !os.IsNotExist(err) {
			log.Printf("[DeleteFileIfUnreferenced] Failed to delete file: %s | Error: %v", trimmed, err)
		} else if err == nil {
			log.Printf("[DeleteFileIfUnreferenced] Successfully deleted file: %s", trimmed)
		} else {
			log.Printf("[DeleteFileIfUnreferenced] File already does not exist: %s", trimmed)
		}
	} else {
		log.Printf("[DeleteFileIfUnreferenced] File %s is still referenced by %d other records in %s.%s", filePath, count, table, column)
	}
}
