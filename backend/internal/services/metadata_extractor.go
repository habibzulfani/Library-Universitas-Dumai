package services

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/ledongthuc/pdf"
	"golang.org/x/net/html"
)

// ExtractedMetadata represents the structured metadata extracted from a document
type ExtractedMetadata struct {
	Title        string   `json:"title"`
	Authors      []string `json:"authors"`
	Abstract     string   `json:"abstract"`
	Keywords     []string `json:"keywords"`
	Journal      string   `json:"journal"`
	Publisher    string   `json:"publisher"`
	Year         int      `json:"year"`
	Volume       string   `json:"volume"`
	Issue        string   `json:"issue"`
	Pages        string   `json:"pages"`
	DOI          string   `json:"doi"`
	ISBN         string   `json:"isbn"`
	ISSN         string   `json:"issn"`
	Language     string   `json:"language"`
	Subject      string   `json:"subject"`
	University   string   `json:"university"`
	Department   string   `json:"department"`
	Advisor      string   `json:"advisor"`
	DocumentType string   `json:"document_type"` // "book", "paper", "thesis", etc.
	Confidence   float64  `json:"confidence"`    // Confidence score for extraction
}

// MetadataExtractor service for extracting metadata from documents
type MetadataExtractor struct{}

// NewMetadataExtractor creates a new metadata extractor instance
func NewMetadataExtractor() *MetadataExtractor {
	return &MetadataExtractor{}
}

// ExtractMetadataFromFile extracts metadata from a file based on its type
func (me *MetadataExtractor) ExtractMetadataFromFile(filePath string) (*ExtractedMetadata, error) {
	ext := strings.ToLower(filepath.Ext(filePath))

	switch ext {
	case ".pdf":
		return me.extractFromPDF(filePath)
	case ".doc", ".docx":
		return me.extractFromWord(filePath)
	case ".txt":
		return me.extractFromText(filePath)
	case ".html", ".htm":
		return me.extractFromHTML(filePath)
	default:
		return nil, fmt.Errorf("unsupported file type: %s", ext)
	}
}

// extractFromPDF extracts metadata from PDF files
func (me *MetadataExtractor) extractFromPDF(filePath string) (*ExtractedMetadata, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open PDF file: %v", err)
	}
	defer file.Close()

	// Get file info for size
	fileInfo, err := file.Stat()
	if err != nil {
		return nil, fmt.Errorf("failed to get file info: %v", err)
	}

	reader, err := pdf.NewReader(file, fileInfo.Size())
	if err != nil {
		// If PDF reader fails, return a basic structure instead of error
		fmt.Printf("Warning: failed to create PDF reader for %s: %v\n", filePath, err)
		return &ExtractedMetadata{
			DocumentType: "paper",
			Confidence:   0.1,
			Language:     "English",
		}, nil
	}

	// Extract text from first few pages (usually contains metadata)
	var textBuilder strings.Builder
	numPages := reader.NumPage()

	// Read first 5 pages or all pages if less than 5 (increased from 3)
	pagesToRead := 5
	if numPages < pagesToRead {
		pagesToRead = numPages
	}

	fmt.Printf("Processing PDF with %d pages, reading first %d pages\n", numPages, pagesToRead)

	for i := 1; i <= pagesToRead; i++ {
		page := reader.Page(i)
		if page.V.IsNull() {
			fmt.Printf("Page %d is null, skipping\n", i)
			continue
		}

		text, err := page.GetPlainText(nil)
		if err != nil {
			// Log the error but continue with other pages
			fmt.Printf("Warning: failed to extract text from page %d: %v\n", i, err)
			continue
		}

		// Clean up the extracted text
		text = strings.TrimSpace(text)
		if text != "" {
			fmt.Printf("Page %d extracted text length: %d characters\n", i, len(text))
			textBuilder.WriteString(text + "\n")
		} else {
			fmt.Printf("Page %d extracted empty text\n", i)
		}
	}

	text := textBuilder.String()

	// If no text was extracted, return a basic structure
	if strings.TrimSpace(text) == "" {
		fmt.Printf("Warning: no text extracted from PDF file: %s\n", filePath)
		return &ExtractedMetadata{
			DocumentType: "paper",
			Confidence:   0.1,
			Language:     "English",
		}, nil
	}

	fmt.Printf("Total extracted text length: %d characters\n", len(text))
	fmt.Printf("First 500 characters of extracted text:\n%s\n", text[:min(500, len(text))])

	return me.parseTextMetadata(text, "pdf")
}

// extractFromWord extracts metadata from Word documents (simplified - would need a proper Word parser)
func (me *MetadataExtractor) extractFromWord(filePath string) (*ExtractedMetadata, error) {
	// For now, we'll return a basic structure
	// In a real implementation, you'd use a library like "github.com/unidoc/unioffice"
	return &ExtractedMetadata{
		DocumentType: "paper",
		Confidence:   0.3,
	}, nil
}

// extractFromText extracts metadata from plain text files
func (me *MetadataExtractor) extractFromText(filePath string) (*ExtractedMetadata, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open text file: %v", err)
	}
	defer file.Close()

	content, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("failed to read text file: %v", err)
	}

	text := string(content)
	return me.parseTextMetadata(text, "text")
}

// extractFromHTML extracts metadata from HTML files
func (me *MetadataExtractor) extractFromHTML(filePath string) (*ExtractedMetadata, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open HTML file: %v", err)
	}
	defer file.Close()

	doc, err := html.Parse(file)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %v", err)
	}

	// Extract text content from HTML
	var textBuilder strings.Builder
	var extractText func(*html.Node)
	extractText = func(n *html.Node) {
		if n.Type == html.TextNode {
			textBuilder.WriteString(n.Data + " ")
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			extractText(c)
		}
	}
	extractText(doc)

	text := textBuilder.String()
	return me.parseTextMetadata(text, "html")
}

// parseTextMetadata parses text content to extract structured metadata
func (me *MetadataExtractor) parseTextMetadata(text string, sourceType string) (*ExtractedMetadata, error) {
	metadata := &ExtractedMetadata{
		DocumentType: "paper",
		Confidence:   0.5,
		Language:     "English",
	}

	// Normalize text
	text = strings.ReplaceAll(text, "\r\n", "\n")
	text = strings.ReplaceAll(text, "\r", "\n")
	lines := strings.Split(text, "\n")

	// Extract title (usually the first significant line)
	metadata.Title = me.extractTitle(lines)

	// Extract authors
	metadata.Authors = me.extractAuthors(text)

	// Extract abstract
	metadata.Abstract = me.extractAbstract(text)

	// Extract keywords
	metadata.Keywords = me.extractKeywords(text)

	// Extract year
	metadata.Year = me.extractYear(text)

	// Extract DOI
	metadata.DOI = me.extractDOI(text)

	// Extract ISBN
	metadata.ISBN = me.extractISBN(text)

	// Extract ISSN
	metadata.ISSN = me.extractISSN(text)

	// Extract journal/publisher
	metadata.Journal = me.extractJournal(text)
	metadata.Publisher = me.extractPublisher(text)

	// Extract volume, issue, pages
	metadata.Volume = me.extractVolume(text)
	metadata.Issue = me.extractIssue(text)
	metadata.Pages = me.extractPages(text)

	// Extract university and department
	metadata.University = me.extractUniversity(text)
	metadata.Department = me.extractDepartment(text)

	// Extract advisor
	metadata.Advisor = me.extractAdvisor(text)

	// Determine document type
	metadata.DocumentType = me.determineDocumentType(text)

	// Calculate confidence score
	metadata.Confidence = me.calculateConfidence(metadata)

	return metadata, nil
}

// extractTitle extracts the title from the document
func (me *MetadataExtractor) extractTitle(lines []string) string {
	for i, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Skip common non-title patterns
		if me.isNonTitleLine(line) {
			continue
		}

		// Title is usually the first significant line
		if len(line) > 10 && len(line) < 200 {
			// Clean up the title
			title := strings.TrimSpace(line)
			// Remove common prefixes
			title = strings.TrimPrefix(title, "Title:")
			title = strings.TrimPrefix(title, "TITLE:")
			title = strings.TrimSpace(title)
			return title
		}

		// If we've checked the first 15 lines, stop (increased from 10)
		if i > 15 {
			break
		}
	}
	return ""
}

// extractAuthors extracts author names from the document
func (me *MetadataExtractor) extractAuthors(text string) []string {
	var authors []string
	lines := strings.Split(text, "\n")

	// Find the title line index (to start searching after the title)
	titleIdx := -1
	for i, line := range lines {
		line = strings.TrimSpace(line)
		if len(line) > 10 && len(line) < 200 && !me.isNonTitleLine(line) {
			titleIdx = i
			break
		}
	}

	// Search up to 20 lines after the title for author candidates
	start := 0
	if titleIdx >= 0 {
		start = titleIdx + 1
	}
	end := start + 20
	if end > len(lines) {
		end = len(lines)
	}

	authorCandidates := []string{}
	for i := start; i < end; i++ {
		line := strings.TrimSpace(lines[i])
		if len(line) < 3 || len(line) > 200 {
			continue
		}

		// Skip lines that are clearly not author lines
		if me.isNonAuthorLine(line) {
			continue
		}

		// Check if line contains likely author patterns
		if me.isLikelyAuthorLine(line) {
			authorCandidates = append(authorCandidates, line)
		}
	}

	// Process author candidates
	for _, candidate := range authorCandidates {
		// Split by common separators
		parts := me.splitAuthorLine(candidate)
		for _, part := range parts {
			author := me.cleanAuthorName(part)
			if me.isValidAuthorName(author) {
				authors = append(authors, author)
			}
		}
	}

	// Remove duplicates while preserving order
	return me.removeDuplicateAuthors(authors)
}

// isNonAuthorLine checks if a line is clearly not an author line
func (me *MetadataExtractor) isNonAuthorLine(line string) bool {
	lineLower := strings.ToLower(line)

	// Institutional keywords that indicate this is not an author line
	institutionalKeywords := []string{
		"universitas", "university", "college", "institute", "institut",
		"fakultas", "faculty", "school", "sekolah",
		"jurusan", "department", "departemen", "divisi",
		"prodi", "program studi", "program study", "study program",
		"penulis korespondensi", "corresponding author", "author for correspondence",
		"alamat", "address", "email", "e-mail", "phone", "telepon",
		"abstract", "abstrak", "introduction", "pendahuluan",
		"keywords", "kata kunci", "references", "referensi",
		"acknowledgment", "acknowledgement", "ucapan terima kasih",
		"figure", "figur", "table", "tabel", "chapter", "bab",
		"page", "halaman", "volume", "vol", "issue", "edisi",
		"doi", "issn", "isbn", "published", "diterbitkan",
		"submitted", "dikirim", "received", "diterima",
		"accepted", "diterima", "revised", "direvisi",
		"journal", "jurnal", "proceedings", "prosiding",
		"conference", "konferensi", "seminar", "workshop",
		"research", "penelitian", "study", "studi", "analysis", "analisis",
		"method", "metode", "methodology", "metodologi",
		"result", "hasil", "conclusion", "kesimpulan",
		"recommendation", "rekomendasi", "suggestion", "saran",
	}

	for _, keyword := range institutionalKeywords {
		if strings.Contains(lineLower, keyword) {
			return true
		}
	}

	// Check for email patterns
	if strings.Contains(line, "@") {
		return true
	}

	// Check for phone number patterns
	if strings.Contains(line, "+") || strings.Contains(line, "-") {
		// Count digits to see if it looks like a phone number
		digitCount := 0
		for _, char := range line {
			if char >= '0' && char <= '9' {
				digitCount++
			}
		}
		if digitCount >= 8 { // Likely a phone number
			return true
		}
	}

	// Check for URL patterns
	if strings.Contains(line, "http://") || strings.Contains(line, "https://") || strings.Contains(line, "www.") {
		return true
	}

	// Check for date patterns
	if strings.Contains(line, "202") || strings.Contains(line, "201") || strings.Contains(line, "200") {
		// If line contains year and other date-like patterns, it's probably not an author
		if strings.Contains(line, "/") || strings.Contains(line, "-") || strings.Contains(line, ".") {
			return true
		}
	}

	return false
}

// isValidAuthorName checks if a cleaned name is likely a real author name
func (me *MetadataExtractor) isValidAuthorName(name string) bool {
	if len(name) < 3 || len(name) > 100 {
		return false
	}

	nameLower := strings.ToLower(name)

	// Reject institutional names
	institutionalNames := []string{
		"universitas", "university", "college", "institute", "institut",
		"fakultas", "faculty", "school", "sekolah",
		"jurusan", "department", "departemen", "divisi",
		"prodi", "program studi", "program study", "study program",
		"penulis korespondensi", "corresponding author", "author for correspondence",
		"teknologi informasi", "information technology",
		"manajemen informatika", "informatics management",
		"teknik informatika", "informatics engineering",
		"sistem informasi", "information systems",
		"ilmu komputer", "computer science",
		"teknik komputer", "computer engineering",
	}

	for _, institutionalName := range institutionalNames {
		if strings.Contains(nameLower, institutionalName) {
			return false
		}
	}

	// Must contain at least one letter
	hasLetter := false
	for _, char := range name {
		if (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') {
			hasLetter = true
			break
		}
	}
	if !hasLetter {
		return false
	}

	// Should not be all uppercase (likely a header)
	if name == strings.ToUpper(name) && len(name) > 5 {
		return false
	}

	// Should not contain only numbers and special characters
	letterCount := 0
	for _, char := range name {
		if (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') {
			letterCount++
		}
	}
	if letterCount < 2 {
		return false
	}

	return true
}

// extractAbstract extracts the abstract from the document
func (me *MetadataExtractor) extractAbstract(text string) string {
	// Look for abstract section
	abstractPatterns := []string{
		`(?i)abstract\s*:?\s*([^]*?)(?=\n\s*\n|\n\s*[A-Z]|$)`,
		`(?i)summary\s*:?\s*([^]*?)(?=\n\s*\n|\n\s*[A-Z]|$)`,
		`(?i)introduction\s*:?\s*([^]*?)(?=\n\s*\n|\n\s*[A-Z]|$)`,
	}

	for _, pattern := range abstractPatterns {
		re := regexp.MustCompile(pattern)
		matches := re.FindStringSubmatch(text)
		if len(matches) > 1 {
			abstract := strings.TrimSpace(matches[1])
			if len(abstract) > 20 && len(abstract) < 2000 {
				// Clean up the abstract
				abstract = strings.ReplaceAll(abstract, "\n", " ")
				abstract = regexp.MustCompile(`\s+`).ReplaceAllString(abstract, " ")
				abstract = strings.TrimSpace(abstract)
				return abstract
			}
		}
	}

	// If no abstract found with patterns, try to find a paragraph that looks like an abstract
	lines := strings.Split(text, "\n")
	var abstractLines []string
	inAbstract := false

	for i, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Look for abstract indicators
		if strings.Contains(strings.ToLower(line), "abstract") ||
			strings.Contains(strings.ToLower(line), "summary") {
			inAbstract = true
			continue
		}

		// If we're in abstract section, collect lines
		if inAbstract {
			// Stop if we hit another section
			if strings.Contains(strings.ToLower(line), "introduction") ||
				strings.Contains(strings.ToLower(line), "chapter") ||
				strings.Contains(strings.ToLower(line), "section") {
				break
			}

			// Add line to abstract
			if len(line) > 10 {
				abstractLines = append(abstractLines, line)
			}

			// Stop if abstract is getting too long
			if len(abstractLines) > 10 {
				break
			}
		}

		// Stop searching after first 50 lines
		if i > 50 {
			break
		}
	}

	if len(abstractLines) > 0 {
		abstract := strings.Join(abstractLines, " ")
		abstract = regexp.MustCompile(`\s+`).ReplaceAllString(abstract, " ")
		abstract = strings.TrimSpace(abstract)
		if len(abstract) > 20 && len(abstract) < 2000 {
			return abstract
		}
	}

	return ""
}

// extractKeywords extracts keywords from the document
func (me *MetadataExtractor) extractKeywords(text string) []string {
	var keywords []string

	patterns := []string{
		`(?i)keywords?[:\s]*([^.\n]+)`,
		`(?i)key words[:\s]*([^.\n]+)`,
		`(?i)index terms[:\s]*([^.\n]+)`,
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		match := re.FindStringSubmatch(text)
		if len(match) > 1 {
			keywordText := strings.TrimSpace(match[1])
			// Split by common separators
			keywordList := regexp.MustCompile(`[,;]`).Split(keywordText, -1)
			for _, keyword := range keywordList {
				keyword = strings.TrimSpace(keyword)
				if keyword != "" && len(keyword) > 2 {
					keywords = append(keywords, keyword)
				}
			}
		}
	}

	return me.removeDuplicates(keywords)
}

// extractYear extracts the publication year
func (me *MetadataExtractor) extractYear(text string) int {
	// Look for 4-digit years between 1900 and current year
	currentYear := time.Now().Year()
	pattern := fmt.Sprintf(`\b(19[0-9]{2}|20[0-2][0-9])\b`)
	re := regexp.MustCompile(pattern)
	matches := re.FindAllString(text, -1)

	for _, match := range matches {
		year := 0
		fmt.Sscanf(match, "%d", &year)
		if year >= 1900 && year <= currentYear {
			return year
		}
	}
	return 0
}

// extractDOI extracts DOI from the document
func (me *MetadataExtractor) extractDOI(text string) string {
	pattern := `(?i)(?:doi|digital object identifier)[:\s]*(10\.\d{4,}/[-._;()/:\w]+)`
	re := regexp.MustCompile(pattern)
	match := re.FindStringSubmatch(text)
	if len(match) > 1 {
		return strings.TrimSpace(match[1])
	}
	return ""
}

// extractISBN extracts ISBN from the document
func (me *MetadataExtractor) extractISBN(text string) string {
	patterns := []string{
		`(?i)(?:isbn|international standard book number)[:\s]*([0-9\-X]{10,17})`,
		`\b([0-9\-X]{10,17})\b`,
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		match := re.FindStringSubmatch(text)
		if len(match) > 1 {
			isbn := strings.TrimSpace(match[1])
			if me.isValidISBN(isbn) {
				return isbn
			}
		}
	}
	return ""
}

// extractISSN extracts ISSN from the document
func (me *MetadataExtractor) extractISSN(text string) string {
	pattern := `(?i)(?:issn|international standard serial number)[:\s]*([0-9]{4}-[0-9]{3}[0-9X])`
	re := regexp.MustCompile(pattern)
	match := re.FindStringSubmatch(text)
	if len(match) > 1 {
		return strings.TrimSpace(match[1])
	}
	return ""
}

// extractJournal extracts journal name
func (me *MetadataExtractor) extractJournal(text string) string {
	patterns := []string{
		`(?i)(?:journal|periodical)[:\s]*([^.\n]+)`,
		`(?i)published in[:\s]*([^.\n]+)`,
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		match := re.FindStringSubmatch(text)
		if len(match) > 1 {
			journal := strings.TrimSpace(match[1])
			if len(journal) > 3 && len(journal) < 200 {
				return journal
			}
		}
	}
	return ""
}

// extractPublisher extracts publisher name
func (me *MetadataExtractor) extractPublisher(text string) string {
	patterns := []string{
		`(?i)(?:publisher|published by)[:\s]*([^.\n]+)`,
		`(?i)©\s*([^.\n]+)`,
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		match := re.FindStringSubmatch(text)
		if len(match) > 1 {
			publisher := strings.TrimSpace(match[1])
			if len(publisher) > 3 && len(publisher) < 200 {
				return publisher
			}
		}
	}
	return ""
}

// extractVolume extracts volume number
func (me *MetadataExtractor) extractVolume(text string) string {
	patterns := []string{
		`(?i)(?:vol|volume)[.\s]*([0-9]+)`,
		`(?i)vol\.\s*([0-9]+)`,
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		match := re.FindStringSubmatch(text)
		if len(match) > 1 {
			return strings.TrimSpace(match[1])
		}
	}
	return ""
}

// extractIssue extracts issue number
func (me *MetadataExtractor) extractIssue(text string) string {
	patterns := []string{
		`(?i)(?:no|number|issue)[.\s]*([0-9]+)`,
		`(?i)no\.\s*([0-9]+)`,
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		match := re.FindStringSubmatch(text)
		if len(match) > 1 {
			return strings.TrimSpace(match[1])
		}
	}
	return ""
}

// extractPages extracts page numbers
func (me *MetadataExtractor) extractPages(text string) string {
	patterns := []string{
		`(?i)(?:pp|pages)[.\s]*([0-9\-]+)`,
		`(?i)page[s]?\s*([0-9\-]+)`,
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		match := re.FindStringSubmatch(text)
		if len(match) > 1 {
			return strings.TrimSpace(match[1])
		}
	}
	return ""
}

// extractUniversity extracts university name
func (me *MetadataExtractor) extractUniversity(text string) string {
	patterns := []string{
		`(?i)(?:university|universitas)[:\s]*([^.\n]+)`,
		`(?i)submitted to[:\s]*([^.\n]+)`,
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		match := re.FindStringSubmatch(text)
		if len(match) > 1 {
			university := strings.TrimSpace(match[1])
			if len(university) > 3 && len(university) < 200 {
				return university
			}
		}
	}
	return ""
}

// extractDepartment extracts department name
func (me *MetadataExtractor) extractDepartment(text string) string {
	patterns := []string{
		`(?i)(?:department|departemen|faculty|fakultas)[:\s]*([^.\n]+)`,
		`(?i)school of[:\s]*([^.\n]+)`,
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		match := re.FindStringSubmatch(text)
		if len(match) > 1 {
			department := strings.TrimSpace(match[1])
			if len(department) > 3 && len(department) < 200 {
				return department
			}
		}
	}
	return ""
}

// extractAdvisor extracts advisor name
func (me *MetadataExtractor) extractAdvisor(text string) string {
	patterns := []string{
		`(?i)(?:advisor|supervisor|pembimbing)[:\s]*([^.\n]+)`,
		`(?i)under the supervision of[:\s]*([^.\n]+)`,
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		match := re.FindStringSubmatch(text)
		if len(match) > 1 {
			advisor := strings.TrimSpace(match[1])
			if len(advisor) > 3 && len(advisor) < 200 {
				return advisor
			}
		}
	}
	return ""
}

// determineDocumentType determines if it's a book, paper, thesis, etc.
func (me *MetadataExtractor) determineDocumentType(text string) string {
	text = strings.ToLower(text)

	if strings.Contains(text, "thesis") || strings.Contains(text, "disertasi") {
		return "thesis"
	}
	if strings.Contains(text, "book") || strings.Contains(text, "buku") {
		return "book"
	}
	if strings.Contains(text, "journal") || strings.Contains(text, "jurnal") {
		return "paper"
	}
	if strings.Contains(text, "conference") || strings.Contains(text, "proceeding") {
		return "paper"
	}

	return "paper" // default
}

// calculateConfidence calculates confidence score for the extraction
func (me *MetadataExtractor) calculateConfidence(metadata *ExtractedMetadata) float64 {
	score := 0.0
	total := 0.0

	// Title confidence
	if metadata.Title != "" {
		score += 0.2
	}
	total += 0.2

	// Authors confidence
	if len(metadata.Authors) > 0 {
		score += 0.15
	}
	total += 0.15

	// Abstract confidence
	if metadata.Abstract != "" {
		score += 0.15
	}
	total += 0.15

	// Year confidence
	if metadata.Year > 0 {
		score += 0.1
	}
	total += 0.1

	// DOI/ISBN/ISSN confidence
	if metadata.DOI != "" || metadata.ISBN != "" || metadata.ISSN != "" {
		score += 0.1
	}
	total += 0.1

	// Journal/Publisher confidence
	if metadata.Journal != "" || metadata.Publisher != "" {
		score += 0.1
	}
	total += 0.1

	// Keywords confidence
	if len(metadata.Keywords) > 0 {
		score += 0.1
	}
	total += 0.1

	// University/Department confidence
	if metadata.University != "" || metadata.Department != "" {
		score += 0.1
	}
	total += 0.1

	if total == 0 {
		return 0.0
	}

	return score / total
}

// Helper functions

func (me *MetadataExtractor) isNonTitleLine(line string) bool {
	nonTitlePatterns := []string{
		`^\d+$`, // Just numbers
		`^(abstract|introduction|conclusion|references|bibliography)`, // Section headers
		`^[A-Z\s]+$`,       // All caps (likely headers)
		`^[a-z\s]+$`,       // All lowercase (likely not title)
		`^\s*$`,            // Empty or whitespace only
		`^(page|p\.|pp\.)`, // Page numbers
	}

	for _, pattern := range nonTitlePatterns {
		re := regexp.MustCompile(pattern)
		if re.MatchString(strings.ToLower(line)) {
			return true
		}
	}
	return false
}

func (me *MetadataExtractor) isValidISBN(isbn string) bool {
	// Remove hyphens and spaces
	isbn = regexp.MustCompile(`[-\s]`).ReplaceAllString(isbn, "")

	// Check length (ISBN-10 or ISBN-13)
	if len(isbn) != 10 && len(isbn) != 13 {
		return false
	}

	// Basic validation - in a real implementation, you'd add checksum validation
	return true
}

func (me *MetadataExtractor) removeDuplicates(slice []string) []string {
	keys := make(map[string]bool)
	var result []string
	for _, item := range slice {
		if !keys[item] {
			keys[item] = true
			result = append(result, item)
		}
	}
	return result
}

func (me *MetadataExtractor) isLikelyAuthorLine(line string) bool {
	// Look for lines with multiple capitalized words (likely names)
	words := strings.Fields(line)
	if len(words) < 2 {
		return false
	}

	capitalizedWords := 0
	for _, word := range words {
		if len(word) > 1 && word[0] >= 'A' && word[0] <= 'Z' {
			capitalizedWords++
		}
	}

	// At least half the words should be capitalized
	return float64(capitalizedWords)/float64(len(words)) >= 0.5
}

func (me *MetadataExtractor) splitAuthorLine(line string) []string {
	// Split by comma, 'and', '&', and parentheses
	parts := regexp.MustCompile(`[,()]|\band\b|\&`).Split(line, -1)
	var result []string
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			result = append(result, part)
		}
	}
	return result
}

func (me *MetadataExtractor) cleanAuthorName(name string) string {
	// Remove superscripts and asterisks
	name = regexp.MustCompile(`[\d\*]+`).ReplaceAllString(name, "")
	// Remove emails
	name = regexp.MustCompile(`\S+@\S+`).ReplaceAllString(name, "")
	// Remove extra whitespace
	name = strings.TrimSpace(name)
	// Remove leading/trailing punctuation
	name = strings.Trim(name, ".,;:!?")
	return name
}

func (me *MetadataExtractor) removeDuplicateAuthors(authors []string) []string {
	seen := make(map[string]bool)
	var result []string
	for _, author := range authors {
		if !seen[author] {
			seen[author] = true
			result = append(result, author)
		}
	}
	return result
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
