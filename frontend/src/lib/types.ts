export interface Category {
    id: number;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface BaseItem {
    id: number;
    title: string;
    author: string;
    published_year: number;
    category_id: number;
    category?: Category;
    created_at: string;
    updated_at: string;
}

export interface Book extends BaseItem {
    isbn?: string;
    publisher?: string;
    description?: string;
    cover_url?: string;
}

export interface Paper {
    id: number;
    title: string;
    author: string;
    authors: Array<{
        id: number;
        author_name: string;
    }>;
    advisor?: string;
    university?: string;
    department?: string;
    year?: number;
    issn?: string;
    language?: string;
    journal?: string;
    volume?: number;
    issue?: number;
    pages?: string;
    doi?: string;
    abstract?: string;
    keywords?: string;
    file_url?: string;
    cover_image_url?: string;
    created_at: string;
    updated_at: string;
}