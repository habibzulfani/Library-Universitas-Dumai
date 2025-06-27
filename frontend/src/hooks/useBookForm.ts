import { useState, useEffect } from 'react';
import { booksAPI, Book } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface BookFormData {
    title: string;
    author: string;
    authors: string[];
    publisher: string;
    published_year: string;
    isbn: string;
    subject: string;
    language: string;
    pages: string;
    summary: string;
    file: File | null;
    coverImage: File | null;
}

interface UseBookFormProps {
    onSuccess: () => void;
    onError?: (error: string) => void;
    editingBook?: Book | null;
    isAdmin?: boolean;
}

export function useBookForm({ onSuccess, onError, editingBook, isAdmin = false }: UseBookFormProps) {
    const [bookFormData, setBookFormData] = useState<BookFormData>({
        title: '',
        author: '',
        authors: [],
        publisher: '',
        published_year: '',
        isbn: '',
        subject: '',
        language: 'English',
        pages: '',
        summary: '',
        file: null,
        coverImage: null,
    });

    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [existingFile, setExistingFile] = useState<string | null>(null);
    const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form data when editing book changes
    useEffect(() => {
        if (editingBook) {
            const existingAuthors = editingBook.authors?.map(a => a.author_name) || [editingBook.author];
            const firstAuthor = existingAuthors.length > 0 ? existingAuthors[0] : '';
            const remainingAuthors = existingAuthors.slice(1);

            setBookFormData({
                title: editingBook.title,
                author: firstAuthor,
                authors: remainingAuthors,
                publisher: editingBook.publisher || '',
                published_year: editingBook.published_year?.toString() || '',
                isbn: editingBook.isbn || '',
                subject: editingBook.subject || '',
                language: editingBook.language || 'English',
                pages: editingBook.pages?.toString() || '',
                summary: editingBook.summary || '',
                file: null,
                coverImage: null,
            });

            if (editingBook.cover_image_url) {
                setCoverPreview(editingBook.cover_image_url);
            }

            if (editingBook.file_url) {
                const fileName = editingBook.file_url.split('/').pop() || '';
                setExistingFile(fileName);
                setExistingFileUrl(editingBook.file_url);
            }
        } else {
            resetBookForm();
        }
    }, [editingBook]);

    const validateForm = (): boolean => {
        if (!bookFormData.title.trim()) {
            toast.error('Title is required');
            return false;
        }

        const allAuthors = [...bookFormData.authors];
        if (bookFormData.author.trim() && !allAuthors.includes(bookFormData.author.trim())) {
            allAuthors.push(bookFormData.author.trim());
        }

        if (allAuthors.length === 0 && !bookFormData.author.trim()) {
            toast.error('At least one author is required');
            return false;
        }

        if (bookFormData.published_year && (parseInt(bookFormData.published_year) < 1800 || parseInt(bookFormData.published_year) > new Date().getFullYear() + 1)) {
            toast.error('Published year must be between 1800 and next year');
            return false;
        }

        if (bookFormData.pages && (parseInt(bookFormData.pages) < 1 || parseInt(bookFormData.pages) > 10000)) {
            toast.error('Pages must be between 1 and 10,000');
            return false;
        }

        return true;
    };

    const handleBookSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();

            // Required fields
            formData.append('title', bookFormData.title);

            // Handle multiple authors
            const allAuthors = [...bookFormData.authors];
            if (bookFormData.author.trim() && !allAuthors.includes(bookFormData.author.trim())) {
                allAuthors.push(bookFormData.author.trim());
            }

            allAuthors.forEach(author => {
                formData.append('authors[]', author);
            });

            // Optional fields
            if (bookFormData.publisher) formData.append('publisher', bookFormData.publisher);
            if (bookFormData.published_year) formData.append('published_year', bookFormData.published_year);
            if (bookFormData.isbn) formData.append('isbn', bookFormData.isbn);
            if (bookFormData.subject) formData.append('subject', bookFormData.subject);
            if (bookFormData.language) formData.append('language', bookFormData.language);
            if (bookFormData.pages) formData.append('pages', bookFormData.pages);
            if (bookFormData.summary) formData.append('summary', bookFormData.summary);
            if (bookFormData.file) formData.append('file', bookFormData.file);
            if (bookFormData.coverImage) formData.append('cover_image', bookFormData.coverImage);

            if (editingBook) {
                if (isAdmin) {
                    await booksAPI.updateBook(editingBook.id, formData);
                } else {
                    await booksAPI.updateUserBook(editingBook.id, formData);
                }
                toast.success('Book updated successfully');
            } else {
                if (isAdmin) {
                    await booksAPI.createBook(formData);
                } else {
                    await booksAPI.createUserBook(formData);
                }
                toast.success('Book created successfully');
            }

            onSuccess();
            resetBookForm();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to save book';
            toast.error(errorMessage);
            if (onError) {
                onError(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBookCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBookFormData({ ...bookFormData, coverImage: file });

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBookFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 32 * 1024 * 1024) { // 32MB limit
                toast.error('File size must be less than 32MB');
                e.target.value = '';
                return;
            }
            setBookFormData({ ...bookFormData, file });
        }
    };

    const handleAddAuthor = () => {
        if (bookFormData.author.trim() && !bookFormData.authors.includes(bookFormData.author.trim())) {
            setBookFormData({
                ...bookFormData,
                authors: [...bookFormData.authors, bookFormData.author.trim()],
                author: ''
            });
        }
    };

    const handleEditAuthor = (index: number) => {
        setBookFormData({
            ...bookFormData,
            author: bookFormData.authors[index],
            authors: bookFormData.authors.filter((_, i) => i !== index)
        });
    };

    const handleRemoveAuthor = (index: number) => {
        setBookFormData({
            ...bookFormData,
            authors: bookFormData.authors.filter((_, i) => i !== index)
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddAuthor();
        }
    };

    const resetBookForm = () => {
        setBookFormData({
            title: '',
            author: '',
            authors: [],
            publisher: '',
            published_year: '',
            isbn: '',
            subject: '',
            language: 'English',
            pages: '',
            summary: '',
            file: null,
            coverImage: null,
        });
        setCoverPreview(null);
        setExistingFile(null);
        setExistingFileUrl(null);
    };

    return {
        bookFormData,
        setBookFormData,
        handleBookSubmit,
        handleBookCoverChange,
        handleBookFileChange,
        handleAddAuthor,
        handleEditAuthor,
        handleRemoveAuthor,
        handleKeyPress,
        resetBookForm,
        isSubmitting,
        coverPreview,
        existingFile,
        existingFileUrl,
    };
} 