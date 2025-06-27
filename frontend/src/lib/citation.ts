export function generateBookCitation(book: {
    title: string;
    author: string;
    published_year?: number;
    publisher?: string;
    isbn?: string;
}, format: 'apa' | 'mla' | 'chicago' = 'apa'): string {
    const year = book.published_year || 'n.d.';
    switch (format) {
        case 'apa':
            return `${book.author}. (${year}). ${book.title}. ${book.publisher || 'Unknown Publisher'}.${book.isbn ? ` ISBN: ${book.isbn}` : ''}`;
        case 'mla':
            return `${book.author}. "${book.title}." ${book.publisher || 'Unknown Publisher'}, ${year}.${book.isbn ? ` ISBN: ${book.isbn}` : ''}`;
        case 'chicago':
            return `${book.author}. ${book.title}. ${book.publisher || 'Unknown Publisher'}, ${year}.${book.isbn ? ` ISBN: ${book.isbn}` : ''}`;
        default:
            return '';
    }
}

export function generatePaperCitation(paper: {
    title: string;
    author: string;
    year: number;
    university?: string;
    department?: string;
    issn?: string;
    journal?: string;
    volume?: number;
    issue?: number;
    pages?: string;
    doi?: string;
}, format: 'apa' | 'mla' | 'chicago' = 'apa'): string {
    switch (format) {
        case 'apa':
            return `${paper.author}. (${paper.year}). ${paper.title}. ${paper.journal ? `${paper.journal}${paper.volume ? `, ${paper.volume}` : ''}${paper.issue ? `(${paper.issue})` : ''}${paper.pages ? `, ${paper.pages}` : ''}` : ''}${paper.university ? `${paper.university}, ` : ''}${paper.department ? `${paper.department}.` : ''}${paper.doi ? ` https://doi.org/${paper.doi}` : ''}${paper.issn ? ` ISSN: ${paper.issn}` : ''}`;
        case 'mla':
            return `${paper.author}. "${paper.title}." ${paper.journal ? `${paper.journal}${paper.volume ? `, vol. ${paper.volume}` : ''}${paper.issue ? `, no. ${paper.issue}` : ''}${paper.pages ? `, pp. ${paper.pages}` : ''}` : ''}${paper.university ? `${paper.university}, ` : ''}${paper.department ? `${paper.department}, ` : ''}${paper.year}.${paper.doi ? ` https://doi.org/${paper.doi}` : ''}${paper.issn ? ` ISSN: ${paper.issn}` : ''}`;
        case 'chicago':
            return `${paper.author}. "${paper.title}." ${paper.journal ? `${paper.journal}${paper.volume ? ` ${paper.volume}` : ''}${paper.issue ? `, no. ${paper.issue}` : ''}${paper.pages ? ` (${paper.pages})` : ''}` : ''}${paper.university ? `${paper.university}, ` : ''}${paper.department ? `${paper.department}, ` : ''}${paper.year}.${paper.doi ? ` https://doi.org/${paper.doi}` : ''}${paper.issn ? ` ISSN: ${paper.issn}` : ''}`;
        default:
            return '';
    }
} 