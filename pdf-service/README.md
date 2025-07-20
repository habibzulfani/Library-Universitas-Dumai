## Metadata Extractor

This service provides advanced metadata extraction from academic PDFs, including:
- Title, authors, abstract, keywords
- Journal, ISSN, volume, issue, year
- Language detection (supports bilingual/Indonesian/English)
- Author and affiliation extraction with heuristics
- Header/footer scanning for important metadata

### Development Notes
- Author extraction uses regex and stopword filtering to avoid city names, acronyms, and non-author text.
- Language detection samples multiple parts of the document and can return 'Bilingual (Indonesian/English)'.
- Header/footer lines are scanned for journal, ISSN, volume, and issue.
- For future improvements, consider mapping author superscripts to affiliations, and further tuning stopword lists for your document corpus.

See `main.py` for implementation details and update this section as new features are added. 