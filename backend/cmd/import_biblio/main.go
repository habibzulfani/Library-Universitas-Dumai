package main

import (
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"strings"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type Book struct {
	Title         string
	Author        string
	Publisher     *string
	PublishedYear *int
	ISBN          *string
	Subject       *string
	Language      *string
	Pages         *string
	Summary       *string
	FileURL       *string
	CoverImageURL *string
}

type Paper struct {
	Title         string
	Author        string
	Advisor       *string
	University    *string
	Department    *string
	Year          *int
	ISSN          *string
	Journal       *string
	Volume        *int
	Issue         *int
	Pages         *string
	DOI           *string
	Abstract      *string
	Keywords      *string
	FileURL       *string
	CoverImageURL *string
}

type BookAuthor struct {
	BookID     uint
	AuthorName string
}

type PaperAuthor struct {
	PaperID    uint
	AuthorName string
}

func main() {
	dsn := "root:rootpassword@tcp(127.0.0.1:3307)/e_repository_db?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	file, err := os.Open("../senayan_biblio_export.csv")
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.Comma = ','
	reader.LazyQuotes = true
	records, err := reader.ReadAll()
	if err != nil {
		log.Fatal(err)
	}

	header := records[0]
	for i, row := range records[1:] {
		rowMap := make(map[string]string)
		for j, col := range row {
			if j < len(header) {
				key := strings.TrimSpace(header[j])
				rowMap[key] = col
			}
		}

		title := getOrDefault(rowMap, "Judul", "Unknown Title")
		penulisTambahan := cleanBrackets(getOrDefault(rowMap, "Penulis Tambahan", "Unknown Author"))
		authors := splitAuthors(penulisTambahan, "")
		mainAuthor := "Unknown Author"
		if len(authors) > 0 {
			mainAuthor = authors[0]
		}
		publisher := getOrDefaultPtr(rowMap, "Penerbit")
		tahun := parseIntPtr(rowMap["Tahun"])
		isbn := getOrDefaultPtr(rowMap, "ISBN")
		subject := cleanBracketsPtr(getOrDefaultPtr(rowMap, "Subjek"))
		language := getOrDefaultPtr(rowMap, "Bahasa")
		cover := getOrDefaultPtr(rowMap, "Cover")
		cover = normalizeCoverImageURL(cover)

		pages := getOrDefaultPtr(rowMap, "Jumlah Halaman dan Dimensi")

		// Heuristic: if Penerbit is present, treat as Book; else Paper
		if publisher != nil && *publisher != "" {
			book := Book{
				Title:         title,
				Author:        mainAuthor,
				Publisher:     publisher,
				PublishedYear: tahun,
				ISBN:          isbn,
				Subject:       subject,
				Language:      language,
				Pages:         pages,
				CoverImageURL: cover,
			}
			result := db.Table("books").Create(&book)
			if result.Error != nil {
				log.Printf("[Row %d] Failed to insert book: %v", i+2, result.Error)
				continue
			}
			for _, author := range authors {
				ba := BookAuthor{BookID: getLastInsertID(db), AuthorName: author}
				db.Table("book_authors").Create(&ba)
			}
		} else {
			paper := Paper{
				Title:         title,
				Author:        mainAuthor,
				Year:          tahun,
				Pages:         pages,
				CoverImageURL: cover,
			}
			result := db.Table("papers").Create(&paper)
			if result.Error != nil {
				log.Printf("[Row %d] Failed to insert paper: %v", i+2, result.Error)
				continue
			}
			for _, author := range authors {
				pa := PaperAuthor{PaperID: getLastInsertID(db), AuthorName: author}
				db.Table("paper_authors").Create(&pa)
			}
		}
	}
	fmt.Println("Import complete!")
}

func getOrDefault(m map[string]string, key, def string) string {
	if v, ok := m[key]; ok && v != "" {
		return v
	}
	return def
}

func getOrDefaultPtr(m map[string]string, key string) *string {
	if v, ok := m[key]; ok && v != "" {
		return &v
	}
	return nil
}

func parseIntPtr(s string) *int {
	if s == "" {
		return nil
	}
	var i int
	_, err := fmt.Sscanf(s, "%d", &i)
	if err != nil {
		return nil
	}
	return &i
}

func splitAuthors(main, additional string) []string {
	var authors []string
	for _, a := range strings.Split(main, ";") {
		a = strings.TrimSpace(cleanBrackets(a))
		if a != "" {
			authors = append(authors, a)
		}
	}
	for _, a := range strings.Split(additional, ";") {
		a = strings.TrimSpace(cleanBrackets(a))
		if a != "" {
			authors = append(authors, a)
		}
	}
	return authors
}

func cleanBrackets(s string) string {
	return strings.ReplaceAll(strings.ReplaceAll(s, "<", ""), ">", "")
}

func cleanBracketsPtr(s *string) *string {
	if s == nil {
		return nil
	}
	clean := cleanBrackets(*s)
	return &clean
}

func normalizeCoverImageURL(cover *string) *string {
	if cover == nil || *cover == "" {
		return nil
	}
	if strings.HasPrefix(*cover, "/") || strings.HasPrefix(*cover, "http") {
		return cover
	}
	url := "/uploads/covers/" + *cover
	return &url
}

func getLastInsertID(db *gorm.DB) uint {
	var id uint
	db.Raw("SELECT LAST_INSERT_ID()").Scan(&id)
	return id
}
