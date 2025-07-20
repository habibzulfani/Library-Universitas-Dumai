function formatAuthors(authors: string[] | undefined, style: 'apa' | 'mla' | 'chicago'): string {
    if (!authors || authors.length === 0) return '';
    if (style === 'apa') {
        // APA: up to 20 authors, last author preceded by &
        if (authors.length === 1) return authors[0];
        if (authors.length <= 20) {
            return authors.slice(0, -1).join(', ') + ', & ' + authors[authors.length - 1];
        }
        // More than 20: first 19, ..., last
        return authors.slice(0, 19).join(', ') + ', ... ' + authors[authors.length - 1];
    } else if (style === 'mla') {
        if (authors.length === 1) return authors[0];
        if (authors.length === 2) return authors.join(', and ');
        return authors[0] + ', et al.';
    } else if (style === 'chicago') {
        if (authors.length === 1) return authors[0];
        if (authors.length === 2) return authors.join(' and ');
        return authors.slice(0, -1).join(', ') + ', and ' + authors[authors.length - 1];
    }
    return authors.join(', ');
}

export function generateBookCitation(book: {
    title: string;
    author?: string;
    authors?: { author_name: string }[] | string[];
    published_year?: number;
    publisher?: string;
    isbn?: string;
}, format: 'apa' | 'mla' | 'chicago' = 'apa'): string {
    const year = book.published_year || 'n.d.';
    let authorsArr: string[] = [];
    if (Array.isArray(book.authors) && book.authors.length > 0) {
        if (typeof book.authors[0] === 'string') {
            authorsArr = book.authors as string[];
        } else {
            authorsArr = (book.authors as { author_name: string }[]).map(a => a.author_name);
        }
    } else if (book.author) {
        authorsArr = [book.author];
    }
    const authorsStr = formatAuthors(authorsArr, format);
    switch (format) {
        case 'apa':
            return `${authorsStr}. (${year}). ${book.title}. ${book.publisher || 'Unknown Publisher'}.${book.isbn ? ` ISBN: ${book.isbn}` : ''}`;
        case 'mla':
            return `${authorsStr}. "${book.title}." ${book.publisher || 'Unknown Publisher'}, ${year}.${book.isbn ? ` ISBN: ${book.isbn}` : ''}`;
        case 'chicago':
            return `${authorsStr}. ${book.title}. ${book.publisher || 'Unknown Publisher'}, ${year}.${book.isbn ? ` ISBN: ${book.isbn}` : ''}`;
        default:
            return '';
    }
}

export function generatePaperCitation(paper: {
    title: string;
    author?: string;
    authors?: { author_name: string }[] | string[];
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
    let authorsArr: string[] = [];
    if (Array.isArray(paper.authors) && paper.authors.length > 0) {
        if (typeof paper.authors[0] === 'string') {
            authorsArr = paper.authors as string[];
        } else {
            authorsArr = (paper.authors as { author_name: string }[]).map(a => a.author_name);
        }
    } else if (paper.author) {
        authorsArr = [paper.author];
    }
    const authorsStr = formatAuthors(authorsArr, format);
    switch (format) {
        case 'apa':
            return `${authorsStr}. (${paper.year}). ${paper.title}. ${paper.journal ? `${paper.journal}${paper.volume ? `, ${paper.volume}` : ''}${paper.issue ? `(${paper.issue})` : ''}${paper.pages ? `, ${paper.pages}` : ''}` : ''}${paper.university ? `${paper.university}, ` : ''}${paper.department ? `${paper.department}.` : ''}${paper.doi ? ` https://doi.org/${paper.doi}` : ''}${paper.issn ? ` ISSN: ${paper.issn}` : ''}`;
        case 'mla':
            return `${authorsStr}. "${paper.title}." ${paper.journal ? `${paper.journal}${paper.volume ? `, vol. ${paper.volume}` : ''}${paper.issue ? `, no. ${paper.issue}` : ''}${paper.pages ? `, pp. ${paper.pages}` : ''}` : ''}${paper.university ? `${paper.university}, ` : ''}${paper.department ? `${paper.department}, ` : ''}${paper.year}.${paper.doi ? ` https://doi.org/${paper.doi}` : ''}${paper.issn ? ` ISSN: ${paper.issn}` : ''}`;
        case 'chicago':
            return `${authorsStr}. "${paper.title}." ${paper.journal ? `${paper.journal}${paper.volume ? ` ${paper.volume}` : ''}${paper.issue ? `, no. ${paper.issue}` : ''}${paper.pages ? ` (${paper.pages})` : ''}` : ''}${paper.university ? `${paper.university}, ` : ''}${paper.department ? `${paper.department}, ` : ''}${paper.year}.${paper.doi ? ` https://doi.org/${paper.doi}` : ''}${paper.issn ? ` ISSN: ${paper.issn}` : ''}`;
        default:
            return '';
    }
} 