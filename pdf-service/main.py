print("=== PDF SERVICE MAIN.PY LOADED ===")
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
import logging
from typing import Optional
import fitz  # PyMuPDF
from pdfminer.high_level import extract_text
import pytesseract
from PIL import Image
import re
from pydantic import BaseModel
import json
from collections import Counter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PDF Metadata Extractor", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExtractedMetadata(BaseModel):
    title: str = ""
    authors: list = []
    abstract: str = ""
    keywords: list = []
    journal: str = ""
    publisher: str = ""
    year: int = 0
    volume: str = ""
    issue: str = ""
    pages: str = ""
    doi: str = ""
    isbn: str = ""
    issn: str = ""
    language: str = "English"
    subject: str = ""
    university: str = ""
    department: str = ""
    advisor: str = ""
    document_type: str = "paper"
    confidence: float = 0.0

class MetadataResponse(BaseModel):
    success: bool = True
    data: ExtractedMetadata
    message: str = "Metadata extracted successfully"

def extract_text_with_ocr(pdf_path: str, page_num: int = 0) -> str:
    """Extract text from PDF page using OCR if regular extraction fails"""
    try:
        # Open PDF with PyMuPDF
        doc = fitz.open(pdf_path)
        page = doc[page_num]
        
        # Try to extract text normally first
        text = page.get_text()
        
        # If no text extracted, try OCR
        if not text.strip():
            logger.info(f"No text found on page {page_num}, trying OCR...")
            
            # Convert page to image
            mat = fitz.Matrix(2, 2)  # Higher resolution for better OCR
            pix = page.get_pixmap(matrix=mat)
            
            # Save as temporary image
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp_file:
                pix.save(tmp_file.name)
                tmp_path = tmp_file.name
            
            try:
                # Perform OCR
                image = Image.open(tmp_path)
                text = pytesseract.image_to_string(image, lang='eng')
                
                # Clean up temporary file
                os.unlink(tmp_path)
                
                logger.info(f"OCR extracted {len(text)} characters from page {page_num}")
            except Exception as e:
                logger.error(f"OCR failed for page {page_num}: {e}")
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
                text = ""
        
        doc.close()
        return text
    except Exception as e:
        logger.error(f"Error extracting text from page {page_num}: {e}")
        return ""

def extract_title(text: str) -> str:
    """Extract the title, supporting multi-line uppercase titles at the top of the document."""
    import re
    lines = text.split('\n')
    title_lines = []
    for i, line in enumerate(lines[:10]):
        l = line.strip()
        # Stop at first section header or if line is too short
        if not l or len(l) < 8:
            continue
        if re.match(r'^(abstract|abstrak|introduction|pendahuluan|bab|chapter|prodi|fakultas|universitas|journal|jurnal|vol|no|issue|issn|doi|keywords?|kata kunci)', l, re.IGNORECASE):
            break
        # If line is all uppercase or title case, likely part of title
        if l.isupper() or (l[0].isupper() and sum(1 for c in l if c.isupper()) > 2):
            title_lines.append(l)
        elif title_lines:
            # Stop if we already started and hit a non-title line
            break
    # Join consecutive lines if multi-line title
    if title_lines:
        title = ' '.join(title_lines)
        # Remove excessive spaces
        title = re.sub(r'\s+', ' ', title).strip()
        return title
    # Fallback: first significant line
    for line in lines[:20]:
        l = line.strip()
        if len(l) > 10 and not re.match(r'^(abstract|abstrak|introduction|pendahuluan|bab|chapter|prodi|fakultas|universitas|journal|jurnal|vol|no|issue|issn|doi|keywords?|kata kunci)', l, re.IGNORECASE):
            return l
    return ""


def extract_authors(text: str) -> list:
    """Extract author names, handling multiple names, trailing numbers/symbols, and splitting by commas or numbers."""
    import re
    lines = text.split('\n')
    # Find likely author block: after title, before abstract
    title_idx = -1
    abstract_idx = -1
    for i, line in enumerate(lines[:40]):
        l = line.strip().lower()
        if title_idx == -1 and len(line.strip()) > 10 and not re.match(r'^(abstract|abstrak|introduction|pendahuluan|bab|chapter|prodi|fakultas|universitas|journal|jurnal|vol|no|issue|issn|doi|keywords?|kata kunci)', l):
            title_idx = i
        if abstract_idx == -1 and ('abstract' in l or 'abstrak' in l):
            abstract_idx = i
            break
    start = title_idx + 1 if title_idx >= 0 else 0
    end = abstract_idx if abstract_idx > start else start + 10
    if end > len(lines):
        end = len(lines)
    author_candidates = []
    for i in range(start, end):
        line = lines[i].strip()
        if not line or len(line) > 100:
            continue
        # Split by comma or numbers/superscripts
        parts = re.split(r',|\d+\)?|\)|\s{2,}', line)
        for part in parts:
            name = part.strip()
            # Remove trailing numbers/symbols
            name = re.sub(r'[\d\)]+$', '', name).strip()
            # Only accept if 2-4 words, each capitalized, and not a stopword
            words = name.split()
            if 2 <= len(words) <= 4 and all(w[0].isupper() for w in words if w):
                if name and name not in author_candidates:
                    author_candidates.append(name)
            if len(author_candidates) >= 5:
                break
    return author_candidates


def extract_authors_ner(text: str, language: str) -> list:
    """Extract author names using spaCy NER with strict filtering."""
    try:
        import spacy
        nlp = nlp_id if language == "Indonesian" else nlp_en
        if nlp is None:
            return []
        doc = nlp('\n'.join(text.split('\n')[:40]))  # Only top of document
        stopwords = set([
            'jakarta', 'bandung', 'surabaya', 'indonesia', 'kms', 'sma', 'pgri', 'universitas', 'fakultas', 'prodi', 'teknik', 'informatika', 'manajemen', 'komputer', 'author', 'correspondence', 'korespondensi', 'email', 'gmail', 'yahoo', 'hotmail', 'abstract', 'abstrak', 'introduction', 'chapter', 'page', 'management', 'system', 'knowledge', 'study', 'waterfall', 'method', 'hasil', 'penelitian', 'sistem', 'informasi', 'repository', 'e-repositori', 'school', 'student', 'teacher', 'journal', 'jurnal', 'vol', 'volume', 'no', 'issue', 'tahun', 'year', 'halaman', 'pages', 'doi', 'issn', 'isbn', 'archiving', 'sharing', 'media', 'suryadi', 'kata kunci', 'keywords', 'pendahuluan', 'bab', 'daftar pustaka', 'references', 'faculty', 'department', 'jurusan', 'program studi', 'study program', 'research', 'result', 'conclusion', 'recommendation', 'suggestion', 'saran', 'ucapan terima kasih', 'acknowledgment', 'acknowledgement', 'figure', 'table', 'chapter', 'bab', 'laporan', 'makalah', 'skripsi', 'tesis', 'disertasi', 'conference', 'proceeding', 'prosiding', 'report', 'book', 'buku', 'paper', 'student', 'teacher', 'guru', 'kepala sekolah', 'dosen', 'pembimbing', 'supervisor', 'advisor', 'dibimbing oleh', 'under the supervision of'
        ])
        authors = []
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                name = ent.text.strip()
                if 2 <= len(name.split()) <= 4 and not any(sw in name.lower() for sw in stopwords):
                    if name not in authors:
                        authors.append(name)
            if len(authors) >= 5:
                break
        return authors
    except Exception:
        return []

def extract_affiliations(text: str) -> list:
    """Extract affiliations (university, department, etc.) from the text."""
    affiliations = []
    for line in text.split('\n'):
        l = line.lower()
        if any(kw in l for kw in ['universitas', 'university', 'fakultas', 'faculty', 'prodi', 'department', 'jurusan']):
            affiliations.append(line.strip())
    return affiliations

def is_non_author_line(line: str) -> bool:
    """Check if a line is clearly not an author line"""
    line_lower = line.lower()
    
    # Institutional keywords that indicate this is not an author line
    institutional_keywords = [
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
    ]

    for keyword in institutional_keywords:
        if keyword in line_lower:
            return True

    # Check for email patterns
    if "@" in line:
        return True

    # Check for phone number patterns
    if "+" in line or "-" in line:
        # Count digits to see if it looks like a phone number
        digit_count = sum(1 for char in line if char.isdigit())
        if digit_count >= 8:  # Likely a phone number
            return True

    # Check for URL patterns
    if "http://" in line or "https://" in line or "www." in line:
        return True

    # Check for date patterns
    if any(year in line for year in ["202", "201", "200"]):
        # If line contains year and other date-like patterns, it's probably not an author
        if "/" in line or "-" in line or "." in line:
            return True

    return False


def is_likely_author_line(line: str) -> bool:
    """Check if a line contains patterns typical of author names"""
    # Look for lines with multiple capitalized words (likely names)
    words = line.split()
    if len(words) < 2:
        return False

    capitalized_words = 0
    for word in words:
        if len(word) > 1 and word[0].isupper():
            capitalized_words += 1

    # At least half the words should be capitalized
    return capitalized_words / len(words) >= 0.5


def split_author_line(line: str) -> list:
    """Split a line containing multiple authors by common separators"""
    import re
    # Split by comma, 'and', '&', and parentheses
    parts = re.split(r'[,()]|\band\b|\&', line)
    return [part.strip() for part in parts if part.strip()]


def clean_author_name(name: str) -> str:
    """Clean up an author name by removing unwanted elements"""
    import re
    # Remove superscripts and asterisks
    name = re.sub(r'[\d\*]+', '', name)
    # Remove emails
    name = re.sub(r'\S+@\S+', '', name)
    # Remove extra whitespace
    name = name.strip()
    # Remove leading/trailing punctuation
    name = name.strip('.,;:!?')
    return name


def is_valid_author_name(name: str) -> bool:
    """Check if a cleaned name is likely a real author name"""
    if len(name) < 3 or len(name) > 100:
        return False

    name_lower = name.lower()
    
    # Reject institutional names
    institutional_names = [
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
    ]

    for institutional_name in institutional_names:
        if institutional_name in name_lower:
            return False

    # Must contain at least one letter
    if not any(char.isalpha() for char in name):
        return False

    # Should not be all uppercase (likely a header)
    if name.isupper() and len(name) > 5:
        return False

    # Should not contain only numbers and special characters
    letter_count = sum(1 for char in name if char.isalpha())
    if letter_count < 2:
        return False

    return True


def remove_duplicate_authors(authors: list) -> list:
    """Remove duplicate author names while preserving order"""
    seen = set()
    result = []
    for author in authors:
        if author not in seen:
            seen.add(author)
            result.append(author)
    return result

# Improved keyword extraction

def extract_keywords(text: str) -> list:
    """Extract keywords from text, supporting English and Indonesian patterns"""
    keyword_patterns = [
        r'(?i)keywords?[:\s]*([^\n\.;]+)',
        r'(?i)key words[:\s]*([^\n\.;]+)',
        r'(?i)index terms[:\s]*([^\n\.;]+)',
        r'(?i)kata kunci[:\s]*([^\n\.;]+)',  # Indonesian
    ]
    for pattern in keyword_patterns:
        match = re.search(pattern, text)
        if match:
            keyword_text = match.group(1)
            # Split by comma or semicolon
            keywords = [k.strip() for k in re.split(r'[;,]', keyword_text) if len(k.strip()) > 1]
            return list(dict.fromkeys(keywords))
    return []

# Optional: Extract emails (associate with authors if needed)
def extract_emails(text: str) -> list:
    """Extract emails from text"""
    email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    return re.findall(email_pattern, text)

# Optional: Language detection (requires langdetect)
try:
    import spacy
    # Try to load English and multilingual models
    try:
        nlp_en = spacy.load("en_core_web_sm")
    except Exception:
        nlp_en = None
    try:
        nlp_id = spacy.load("xx_ent_wiki_sm")
    except Exception:
        nlp_id = None
except ImportError:
    nlp_en = None
    nlp_id = None

def extract_university_ner(text: str, language: str) -> str:
    """Extract university/institution using spaCy NER if available."""
    nlp = nlp_id if language == "Indonesian" else nlp_en
    if nlp is None:
        return ""
    doc = nlp(text)
    orgs = [ent.text.strip() for ent in doc.ents if ent.label_ == "ORG"]
    # Heuristic: prefer those containing 'universitas', 'university', etc.
    for org in orgs:
        if any(x in org.lower() for x in ["universitas", "university", "institute", "institut", "college"]):
            return org
    return orgs[0] if orgs else ""

def merge_and_filter_authors(heuristic_authors, ner_authors):
    # Debug: log first 10 NER results before filtering
    logging.info(f"First 10 NER authors before filtering: {ner_authors[:10]}")
    # Merge, deduplicate, and filter unlikely names
    all_authors = heuristic_authors + ner_authors
    seen = set()
    filtered = []
    for name in all_authors:
        name = name.strip()
        if (
            name and
            len(name) > 1 and
            name.lower() not in seen and
            not any(char.isdigit() for char in name) and
            not name.isupper()
        ):
            seen.add(name.lower())
            filtered.append(name)
    logging.info(f"Filtered authors: {filtered[:10]}")
    return filtered

def merge_universities(heuristic_univ, ner_univ):
    # Prefer NER if it contains university/institute keywords, else fallback to heuristic
    if ner_univ and any(x in ner_univ.lower() for x in ["universitas", "university", "institute", "institut", "college"]):
        return ner_univ
    if heuristic_univ:
        return heuristic_univ
    return ner_univ or ""

def extract_advisor_with_ner(text: str, language: str) -> str:
    # Use NER to find PERSON near advisor keywords
    import re
    try:
        import spacy
        nlp = nlp_id if language == "Indonesian" else nlp_en
        if nlp is None:
            return extract_advisor(text, language)
        doc = nlp(text)
        # Find advisor keyword lines
        advisor_keywords = ["advisor", "supervisor", "pembimbing", "dosen pembimbing"]
        lines = text.split('\n')
        for i, line in enumerate(lines):
            if any(kw in line.lower() for kw in advisor_keywords):
                # Look for PERSON entities in this line and the next 2 lines
                context = '\n'.join(lines[i:i+3])
                context_doc = nlp(context)
                for ent in context_doc.ents:
                    if ent.label_ == "PERSON" and len(ent.text.split()) >= 2:
                        return ent.text.strip()
        # Fallback to heuristic
        return extract_advisor(text, language)
    except Exception as e:
        logging.warning(f"NER advisor extraction failed: {e}")
        return extract_advisor(text, language)

def extract_department_with_ner(text: str, language: str) -> str:
    # Use NER to find ORG near department/faculty keywords
    import re
    try:
        import spacy
        nlp = nlp_id if language == "Indonesian" else nlp_en
        if nlp is None:
            return extract_department(text, language)
        dept_keywords = ["department", "faculty", "jurusan", "fakultas", "program studi", "school of"]
        lines = text.split('\n')
        for i, line in enumerate(lines):
            if any(kw in line.lower() for kw in dept_keywords):
                # Look for ORG entities in this line and the next 2 lines
                context = '\n'.join(lines[i:i+3])
                context_doc = nlp(context)
                for ent in context_doc.ents:
                    if ent.label_ == "ORG":
                        return ent.text.strip()
        # Fallback to heuristic
        return extract_department(text, language)
    except Exception as e:
        logging.warning(f"NER department extraction failed: {e}")
        return extract_department(text, language)

def extract_headers_footers(page_texts: list) -> dict:
    """Scan first/last 2 lines of each page for journal, volume, issue, ISSN/eISSN, DOI."""
    import re
    meta = {}
    for page in page_texts:
        lines = [l.strip() for l in page.split('\n') if l.strip()]
        scan_lines = lines[:2] + lines[-2:] if len(lines) >= 2 else lines
        for line in scan_lines:
            l = line.lower()
            # Journal
            if 'journal' in l or 'jurnal' in l or 'proceedings' in l or 'prosiding' in l:
                if 'journal' not in meta:
                    meta['journal'] = line
            # Volume
            m = re.search(r'vol(?:ume)?[\s:.,-]*([0-9]{1,4})', line, re.IGNORECASE)
            if m:
                meta['volume'] = m.group(1)
            # Issue
            m = re.search(r'(no\.|number|issue)[\s:.,-]*([0-9]{1,4})', line, re.IGNORECASE)
            if m:
                meta['issue'] = m.group(2)
            # ISSN/eISSN
            m = re.search(r'(e?issn)[\s:]*([0-9]{4}-[0-9]{3}[0-9Xx])', line, re.IGNORECASE)
            if m:
                key = m.group(1).lower()
                meta[key] = m.group(2).upper()
            # DOI
            m = re.search(r'doi[:\s]*((10\.\d{4,9}/[-._;()/:A-Z0-9]+))', line, re.IGNORECASE)
            if m:
                meta['doi'] = m.group(1)
    return meta

# --- Patch the main extraction logic to use NER if available ---
@app.post("/extract", response_model=MetadataResponse)
async def extract_metadata(file: UploadFile = File(...)):
    """Extract metadata from uploaded PDF file"""
    try:
        logger.info("Checkpoint: start of extract_metadata")
        logger.info(f"Processing file: {file.filename}")
        
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        try:
            # Extract text from PDF (with page splits)
            import fitz  # PyMuPDF
            doc = fitz.open(tmp_path)
            page_texts = [page.get_text() for page in doc]
            full_text = '\n'.join(page_texts)
        except Exception as e:
            logger.error(f"Failed to extract text from PDF: {e}")
            raise HTTPException(status_code=500, detail="Failed to extract text from PDF")
        finally:
            os.unlink(tmp_path)

        # Extract headers/footers metadata
        header_footer_meta = extract_headers_footers(page_texts)

        # Extract main metadata
        metadata = ExtractedMetadata()
        metadata.title = extract_title(full_text)
        # Merge NER and heuristic for authors
        heuristic_authors = extract_authors(full_text)
        ner_authors = extract_authors_ner(full_text, metadata.language)
        metadata.authors = merge_and_filter_authors(heuristic_authors, ner_authors)
        logging.info(f"Authors extracted using {'NER' if ner_authors else 'heuristic'} (NER count: {len(ner_authors)}, Heuristic count: {len(heuristic_authors)})")
        logger.info("Checkpoint: after author extraction")
        metadata.abstract = extract_abstract(full_text)
        metadata.keywords = extract_keywords(full_text)
        metadata.year = extract_year(full_text, page_texts=page_texts)
        metadata.language = detect_language(full_text, full_text=full_text, page_texts=page_texts)
        logger.info(f"Detected language: {metadata.language}")
        logger.info(f"Language check: {metadata.language not in ['English', 'Indonesian', 'Bilingual (Indonesian/English)']}")
        if metadata.language not in ["English", "Indonesian", "Bilingual (Indonesian/English)"]:
            return MetadataResponse(
                success=False,
                message="Only English and Indonesian PDFs are supported for metadata extraction.",
                data=ExtractedMetadata()
            )
        # Language-specific extraction for university and department
        # Merge NER and heuristic for university
        heuristic_univ = extract_university(full_text, metadata.language)
        ner_univ = extract_university_ner(full_text, metadata.language)
        metadata.university = merge_universities(heuristic_univ, ner_univ)
        logging.info(f"University extracted using {'NER' if ner_univ else 'heuristic'}")
        logger.info("Checkpoint: after university extraction")
        # NER-enhanced advisor extraction
        metadata.advisor = extract_advisor_with_ner(full_text, metadata.language)
        logging.info(f"Advisor extracted using NER-enhanced method")
        logger.info("Checkpoint: after advisor extraction")
        # NER-enhanced department extraction
        metadata.department = extract_department_with_ner(full_text, metadata.language)
        logging.info(f"Department extracted using NER-enhanced method")
        logger.info("Checkpoint: after department extraction")
        # Language-specific extraction for publisher
        metadata.publisher = extract_publisher(full_text, metadata.language)
        # Language-specific extraction for pages
        metadata.pages = extract_pages(full_text, metadata.language)
        # Language-specific extraction for subject
        metadata.subject = extract_subject(full_text, metadata.language)
        # Language-specific extraction for document_type
        metadata.document_type = extract_document_type(full_text, metadata.language)
        logger.info(f"Extracted metadata: {metadata}")
        logger.info("Checkpoint: after document_type extraction")

        # NER-based extraction for authors and university (supplement or override)
        ner_authors = extract_authors_ner(full_text, metadata.language)
        if ner_authors:
            metadata.authors = ner_authors
        ner_university = extract_university_ner(full_text, metadata.language)
        if ner_university:
            metadata.university = ner_university

        # Log extracted text length
        logger.info(f"Extracted text length: {len(full_text)}")
        logger.info(f"Final extracted metadata: {metadata}")
        logger.info("Checkpoint: before return")
        return MetadataResponse(success=True, message="Metadata extracted successfully", data=metadata)
    except Exception as e:
        logger.error(f"Failed to extract metadata: {e}")
        try:
            logger.error(f"Metadata at error: {metadata}")
        except Exception:
            logger.error("Metadata object not available at error.")
        raise HTTPException(status_code=500, detail="Failed to extract metadata")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "pdf-metadata-extractor"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 


def extract_abstract(text: str) -> str:
    """Extract the abstract or summary from the text, supporting English, Indonesian, and bilingual documents."""
    import re
    # Patterns for English and Indonesian abstracts
    patterns = [
        r"(?i)\babstract\b\s*[:\-–]?\s*([\s\S]{20,2000}?)(?=\n\s*(keywords?|kata kunci|introduction|pendahuluan|bab|chapter|section)\b|\n\s*$)",  # English
        r"(?i)\babstrak\b\s*[:\-–]?\s*([\s\S]{20,2000}?)(?=\n\s*(keywords?|kata kunci|introduction|pendahuluan|bab|chapter|section)\b|\n\s*$)",   # Indonesian
        r"(?i)\bsummary\b\s*[:\-–]?\s*([\s\S]{20,2000}?)(?=\n\s*(keywords?|kata kunci|introduction|pendahuluan|bab|chapter|section)\b|\n\s*$)",   # Sometimes used
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            abstract = match.group(1).strip()
            # Clean up whitespace
            abstract = re.sub(r"\s+", " ", abstract).strip()
            if 20 < len(abstract) < 2000:
                return abstract
    # Fallback: look for a paragraph after the abstract header
    lines = text.split('\n')
    for i, line in enumerate(lines):
        l = line.lower().strip()
        if l.startswith('abstract') or l.startswith('abstrak') or l.startswith('summary'):
            # Collect lines until a section header or empty line
            abstract_lines = []
            for next_line in lines[i+1:i+20]:
                if not next_line.strip():
                    break
                if re.match(r"^(keywords?|kata kunci|introduction|pendahuluan|bab|chapter|section)\b", next_line.strip(), re.IGNORECASE):
                    break
                abstract_lines.append(next_line.strip())
                if len(abstract_lines) > 15:
                    break
            abstract = ' '.join(abstract_lines)
            abstract = re.sub(r"\s+", " ", abstract).strip()
            if 20 < len(abstract) < 2000:
                return abstract
    return "" 


def extract_year(text: str, page_texts=None) -> int:
    """Extract the publication year from the text (and optionally from page headers/footers)."""
    import re
    from datetime import datetime
    current_year = datetime.now().year
    # Look for years in a reasonable range
    year_candidates = set()
    # Search in the first 2 pages and last 2 pages if available
    if page_texts:
        sample_pages = []
        if len(page_texts) > 0:
            sample_pages.append(page_texts[0])
        if len(page_texts) > 1:
            sample_pages.append(page_texts[1])
        if len(page_texts) > 2:
            sample_pages.append(page_texts[-1])
        if len(page_texts) > 3:
            sample_pages.append(page_texts[-2])
        for page in sample_pages:
            for match in re.findall(r"\b(19\d{2}|20\d{2})\b", page):
                year = int(match)
                if 1900 <= year <= current_year:
                    year_candidates.add(year)
    # Search in the whole text as fallback
    for match in re.findall(r"\b(19\d{2}|20\d{2})\b", text):
        year = int(match)
        if 1900 <= year <= current_year:
            year_candidates.add(year)
    # Heuristic: prefer years close to 'published', 'diterbitkan', 'copyright', 'hak cipta', 'tahun', etc.
    context_keywords = [
        r"published", r"diterbitkan", r"copyright", r"hak cipta", r"tahun", r"year", r"accepted", r"disahkan", r"approved"
    ]
    for keyword in context_keywords:
        for match in re.finditer(rf"{keyword}[^\n\d]{{0,20}}(19\d{{2}}|20\d{{2}})", text, re.IGNORECASE):
            year = int(match.group(1))
            if 1900 <= year <= current_year:
                # Prioritize this year
                return year
    # If multiple candidates, return the most frequent or the latest
    if year_candidates:
        # Return the most common year if possible
        from collections import Counter
        year_list = list(year_candidates)
        if len(year_list) == 1:
            return year_list[0]
        # Otherwise, pick the most recent
        return max(year_list)
    return 0 


def detect_language(text: str, full_text=None, page_texts=None) -> str:
    """Detect if the document is in English, Indonesian, or Bilingual (Indonesian/English)."""
    try:
        from langdetect import detect, DetectorFactory
        DetectorFactory.seed = 0
        # Sample from different parts of the document
        samples = []
        if page_texts and len(page_texts) > 0:
            samples.append(page_texts[0])
        if page_texts and len(page_texts) > 1:
            samples.append(page_texts[1])
        if page_texts and len(page_texts) > 2:
            samples.append(page_texts[-1])
        if page_texts and len(page_texts) > 3:
            samples.append(page_texts[-2])
        if not samples:
            samples = [text[:2000], text[-2000:]]
        detected = []
        for sample in samples:
            try:
                lang = detect(sample)
                detected.append(lang)
            except Exception:
                continue
        # Heuristic: if both 'id' and 'en' are present, call it bilingual
        if 'id' in detected and 'en' in detected:
            return 'Bilingual (Indonesian/English)'
        if detected.count('id') > detected.count('en'):
            return 'Indonesian'
        if detected.count('en') > 0:
            return 'English'
    except ImportError:
        pass
    # Fallback: look for common Indonesian words
    indonesian_keywords = ['abstrak', 'kata kunci', 'pendahuluan', 'bab', 'daftar pustaka', 'universitas', 'fakultas', 'jurusan', 'prodi', 'penelitian', 'hasil', 'kesimpulan']
    count_id = sum(1 for w in indonesian_keywords if w in text.lower())
    if count_id >= 2:
        return 'Indonesian'
    # Fallback: look for common English words
    english_keywords = ['abstract', 'keywords', 'introduction', 'university', 'faculty', 'department', 'research', 'result', 'conclusion', 'references']
    count_en = sum(1 for w in english_keywords if w in text.lower())
    if count_en >= 2:
        return 'English'
    # If both present, call it bilingual
    if count_id > 0 and count_en > 0:
        return 'Bilingual (Indonesian/English)'
    return 'Unknown' 


def extract_university(text: str, language: str = "") -> str:
    """Extract university name from lines with 'Universitas', 'University', etc., and parse multi-part lines."""
    import re
    university_keywords = ['universitas', 'university', 'institute', 'institut', 'college', 'politeknik', 'polytechnic']
    lines = text.split('\n')
    for line in lines:
        l = line.lower()
        if any(kw in l for kw in university_keywords):
            # If line contains 'Fakultas' or 'Prodi', split and take only university part
            for splitter in ['fakultas', 'faculty', 'departemen', 'department', 'jurusan', 'prodi', 'program studi', 'school of']:
                if splitter in l:
                    # Take after last splitter
                    parts = [p.strip(' ,.-:') for p in re.split(r',|;', line)]
                    for p in reversed(parts):
                        if any(uk in p.lower() for uk in university_keywords):
                            return p
            # Otherwise, return the line
            return line.strip(' ,.-:')
    # Fallback: regex
    pattern = r"(?i)(universitas|university|institute|institut|college|politeknik|polytechnic)[\s:.,-]*([A-Z][A-Za-z\s&.'-]{3,100})"
    match = re.search(pattern, text)
    if match:
        return (match.group(1) + ' ' + match.group(2)).strip()
    return ""


def extract_department(text: str, language: str = "") -> str:
    """Extract department/faculty from lines with 'Prodi', 'Fakultas', etc., and parse multi-part lines."""
    import re
    department_keywords = ['prodi', 'program studi', 'jurusan', 'fakultas', 'faculty', 'departemen', 'department', 'school of']
    lines = text.split('\n')
    for line in lines:
        l = line.lower()
        if any(kw in l for kw in department_keywords):
            # If line contains university, split and take only department part
            for splitter in ['universitas', 'university', 'institute', 'institut', 'college', 'politeknik', 'polytechnic']:
                if splitter in l:
                    # Take before splitter
                    parts = [p.strip(' ,.-:') for p in re.split(r',|;', line)]
                    for p in parts:
                        if any(dk in p.lower() for dk in department_keywords):
                            return p
            # Otherwise, return the line
            return line.strip(' ,.-:')
    # Fallback: regex
    pattern = r"(?i)(prodi|program studi|jurusan|fakultas|faculty|departemen|department|school of)[\s:.,-]*([A-Z][A-Za-z\s&.'-]{3,100})"
    match = re.search(pattern, text)
    if match:
        return (match.group(1) + ' ' + match.group(2)).strip()
    return ""

def extract_publisher(text: str, language: str = "") -> str:
    """Extract publisher from the text using robust heuristics for both Indonesian and English."""
    import re
    publisher_keywords = [
        'publisher', 'diterbitkan oleh', 'published by', 'penerbit'
    ]
    lines = text.split('\n')
    for line in lines:
        l = line.lower()
        if any(kw in l for kw in publisher_keywords):
            if 8 < len(line.strip()) < 120:
                # Extract organization after the keyword
                for kw in publisher_keywords:
                    if kw in l:
                        after = line.lower().split(kw, 1)[-1]
                        after = after.lstrip(':.- \\')
                        org = ' '.join(after.split()[:10]).strip(' ,.-:')
                        if org and org[0].isupper():
                            return org
                return line.strip(' ,.-:')
    # Fallback: regex for publisher
    pattern = r"(?i)(publisher|diterbitkan oleh|published by|penerbit)[\s:.,-]*([A-Z][A-Za-z\s&.'-]{3,100})"
    match = re.search(pattern, text)
    if match:
        return match.group(2).strip()
    return ""


def extract_pages(text: str, language: str = "") -> str:
    """Extract page numbers or page range from the text, scanning headers/footers and main text."""
    import re
    patterns = [
        r"(?i)(?:pp\.|pages|halaman)[\s:.,-]*([0-9]+\s*-\s*[0-9]+)",
        r"(?i)(?:pp\.|pages|halaman)[\s:.,-]*([0-9]+)",
        r"(?i)page[s]?[\s:.,-]*([0-9]+\s*-\s*[0-9]+)",
        r"(?i)page[s]?[\s:.,-]*([0-9]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip()
    return ""


def extract_subject(text: str, language: str = "") -> str:
    """Extract subject or field of study from the text."""
    import re
    patterns = [
        r"(?i)subject[\s:.,-]*([A-Z][A-Za-z\s&.'-]{3,100})",
        r"(?i)bidang[\s:.,-]*([A-Z][A-Za-z\s&.'-]{3,100})",
        r"(?i)field of study[\s:.,-]*([A-Z][A-Za-z\s&.'-]{3,100})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip()
    # Fallback: look for lines with subject-like keywords
    for line in text.split('\n'):
        l = line.lower()
        if any(kw in l for kw in ['subject', 'bidang', 'field of study']):
            if len(line.strip()) > 8 and len(line.strip()) < 200:
                return line.strip()
    return ""


def extract_document_type(text: str, language: str = "") -> str:
    """Determine document type: thesis, dissertation, skripsi, paper, journal, etc."""
    doc_types = [
        (['thesis', 'tesis'], 'thesis'),
        (['dissertation', 'disertasi'], 'dissertation'),
        (['skripsi'], 'skripsi'),
        (['journal', 'jurnal'], 'journal'),
        (['conference', 'proceeding', 'prosiding'], 'conference paper'),
        (['report', 'laporan'], 'report'),
        (['book', 'buku'], 'book'),
        (['paper', 'makalah'], 'paper'),
    ]
    text_lower = text.lower()
    for keywords, label in doc_types:
        for kw in keywords:
            if kw in text_lower:
                return label
    return "paper" 


def extract_advisor(text: str, language: str = "") -> str:
    """Extract advisor/supervisor name from the text using robust heuristics for both Indonesian and English."""
    import re
    # Look for lines with advisor/supervisor keywords
    advisor_keywords = [
        'advisor', 'supervisor', 'pembimbing', 'dosen pembimbing', 'dibimbing oleh', 'under the supervision of'
    ]
    lines = text.split('\n')
    for line in lines:
        l = line.lower()
        if any(kw in l for kw in advisor_keywords):
            # Avoid lines that are too short or too long
            if 8 < len(line.strip()) < 100:
                # Extract name after the keyword
                for kw in advisor_keywords:
                    if kw in l:
                        after = line.lower().split(kw, 1)[-1]
                        # Remove common separators
                        after = after.lstrip(':.- \\')
                        # Take only the first 5 words (likely a name)
                        name = ' '.join(after.split()[:5]).strip(' ,.-:')
                        # Only return if it looks like a name
                        if name and all(w[0].isupper() for w in name.split() if w[0].isalpha()):
                            return name
                # Fallback: return the line
                return line.strip(' ,.-:')
    # Fallback: regex for advisor
    pattern = r"(?i)(advisor|supervisor|pembimbing|dosen pembimbing|dibimbing oleh|under the supervision of)[\s:.,-]*([A-Z][A-Za-z\s&.'-]{3,100})"
    match = re.search(pattern, text)
    if match:
        return match.group(2).strip()
    return ""


def extract_issn(text: str) -> str:
    """Extract ISSN from the text using regex, scanning headers/footers and main text."""
    import re
    # ISSN pattern: 4 digits, hyphen, 3 digits, digit or X
    pattern = r"(?i)ISSN[\s:]*([0-9]{4}-[0-9]{3}[0-9Xx])"
    match = re.search(pattern, text)
    if match:
        return match.group(1).upper()
    # Fallback: search for ISSN-like pattern anywhere
    match = re.search(r"([0-9]{4}-[0-9]{3}[0-9Xx])", text)
    if match:
        return match.group(1).upper()
    return ""

def extract_isbn(text: str) -> str:
    """Extract ISBN from the text using regex, scanning headers/footers and main text."""
    import re
    # ISBN-13: 978- or 979- followed by 10 digits (with or without hyphens)
    pattern = r"(?i)ISBN[\s:]*((97[89][- ]?[0-9]{1,5}[- ]?[0-9]{1,7}[- ]?[0-9]{1,7}[- ]?[0-9Xx]))"
    match = re.search(pattern, text)
    if match:
        return match.group(1).replace(' ', '').upper()
    # Fallback: search for ISBN-10/13 pattern anywhere
    match = re.search(r"(97[89][- ]?[0-9]{1,5}[- ]?[0-9]{1,7}[- ]?[0-9]{1,7}[- ]?[0-9Xx])", text)
    if match:
        return match.group(1).replace(' ', '').upper()
    return "" 

def extract_doi(text: str) -> str:
    """Extract DOI from the text using regex, scanning headers/footers and main text."""
    import re
    # DOI pattern: 10.<digits>/<suffix>
    pattern = r"(?i)doi[:\s]*((10\.\d{4,9}/[-._;()/:A-Z0-9]+))"
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        return match.group(1)
    # Fallback: search for DOI-like pattern anywhere
    match = re.search(r"(10\.\d{4,9}/[-._;()/:A-Z0-9]+)", text, re.IGNORECASE)
    if match:
        return match.group(1)
    return ""

def extract_journal(text: str) -> str:
    """Extract journal name from the text, scanning headers/footers and main text."""
    import re
    # Look for lines with 'journal', 'jurnal', or 'proceedings'
    lines = text.split('\n')
    for line in lines[:20] + lines[-20:]:  # Scan first and last 20 lines
        l = line.lower()
        if any(kw in l for kw in ['journal', 'jurnal', 'proceedings', 'prosiding']):
            # Avoid lines that are too short or too long
            if 6 < len(line.strip()) < 120:
                return line.strip(' ,.-:')
    # Fallback: regex for journal
    pattern = r"(?i)(journal|jurnal|proceedings|prosiding)[\s:.,-]*([A-Z][A-Za-z\s&.'-]{3,100})"
    match = re.search(pattern, text)
    if match:
        return (match.group(1) + ' ' + match.group(2)).strip()
    return ""

def extract_volume(text: str) -> str:
    """Extract volume from the text using regex, scanning headers/footers and main text."""
    import re
    pattern = r"(?i)vol(?:ume)?[\s:.,-]*([0-9]{1,4})"
    match = re.search(pattern, text)
    if match:
        return match.group(1)
    return ""

def extract_issue(text: str) -> str:
    """Extract issue from the text using regex, scanning headers/footers and main text."""
    import re
    pattern = r"(?i)(no\.|number|issue)[\s:.,-]*([0-9]{1,4})"
    match = re.search(pattern, text)
    if match:
        return match.group(2)
    return "" 