import { useState, useEffect } from 'react';
import { papersAPI, Paper } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface PaperFormData {
    title: string;
    author: string;
    authors: string[];
    abstract: string;
    keywords: string;
    advisor: string;
    university: string;
    department: string;
    year: string;
    journal: string;
    volume: string;
    issue: string;
    pages: string;
    doi: string;
    issn: string;
    file: File | null;
    coverImage: File | null;
}

interface UsePaperFormProps {
    onSuccess: () => void;
    onError?: (error: string) => void;
    editingPaper?: Paper | null;
    isAdmin?: boolean;
}

export function usePaperForm({ onSuccess, onError, editingPaper, isAdmin = false }: UsePaperFormProps) {
    const [paperFormData, setPaperFormData] = useState<PaperFormData>({
        title: '',
        author: '',
        authors: [],
        abstract: '',
        keywords: '',
        advisor: '',
        university: 'Universitas Dumai',
        department: '',
        year: new Date().getFullYear().toString(),
        journal: '',
        volume: '',
        issue: '',
        pages: '',
        doi: '',
        issn: '',
        file: null,
        coverImage: null,
    });

    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [existingFile, setExistingFile] = useState<string | null>(null);
    const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form data when editing paper changes
    useEffect(() => {
        if (editingPaper) {
            const existingAuthors = editingPaper.authors?.map(a => a.author_name) || [editingPaper.author];
            const firstAuthor = existingAuthors.length > 0 ? existingAuthors[0] : '';
            const remainingAuthors = existingAuthors.slice(1);

            setPaperFormData({
                title: editingPaper.title,
                author: firstAuthor,
                authors: remainingAuthors,
                abstract: editingPaper.abstract || '',
                keywords: editingPaper.keywords || '',
                advisor: editingPaper.advisor || '',
                university: editingPaper.university || 'Universitas Dumai',
                department: editingPaper.department || '',
                year: editingPaper.year?.toString() || new Date().getFullYear().toString(),
                journal: editingPaper.journal || '',
                volume: editingPaper.volume?.toString() || '',
                issue: editingPaper.issue?.toString() || '',
                pages: editingPaper.pages || '',
                doi: editingPaper.doi || '',
                issn: editingPaper.issn || '',
                file: null,
                coverImage: null,
            });

            if (editingPaper.cover_image_url) {
                setCoverPreview(editingPaper.cover_image_url);
            }

            if (editingPaper.file_url) {
                const fileName = editingPaper.file_url.split('/').pop() || '';
                setExistingFile(fileName);
                setExistingFileUrl(editingPaper.file_url);
            }
        } else {
            resetPaperForm();
        }
    }, [editingPaper]);

    const validateForm = (): boolean => {
        if (!paperFormData.title.trim()) {
            toast.error('Title is required');
            return false;
        }

        const allAuthors = [...paperFormData.authors];
        if (paperFormData.author.trim() && !allAuthors.includes(paperFormData.author.trim())) {
            allAuthors.push(paperFormData.author.trim());
        }

        if (allAuthors.length === 0 && !paperFormData.author.trim()) {
            toast.error('At least one author is required');
            return false;
        }

        if (!paperFormData.abstract.trim()) {
            toast.error('Abstract is required');
            return false;
        }

        if (paperFormData.year && (parseInt(paperFormData.year) < 1900 || parseInt(paperFormData.year) > new Date().getFullYear() + 1)) {
            toast.error('Year must be between 1900 and next year');
            return false;
        }

        if (paperFormData.volume && (parseInt(paperFormData.volume) < 1 || parseInt(paperFormData.volume) > 1000)) {
            toast.error('Volume must be between 1 and 1000');
            return false;
        }

        if (paperFormData.issue && (parseInt(paperFormData.issue) < 1 || parseInt(paperFormData.issue) > 100)) {
            toast.error('Issue must be between 1 and 100');
            return false;
        }

        return true;
    };

    const handlePaperSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();

            // Required fields
            formData.append('title', paperFormData.title);
            formData.append('abstract', paperFormData.abstract);

            // Handle multiple authors
            const allAuthors = [...paperFormData.authors];
            if (paperFormData.author.trim() && !allAuthors.includes(paperFormData.author.trim())) {
                allAuthors.push(paperFormData.author.trim());
            }

            allAuthors.forEach(author => {
                formData.append('authors[]', author);
            });

            // Optional fields
            if (paperFormData.keywords) formData.append('keywords', paperFormData.keywords);
            if (paperFormData.advisor) formData.append('advisor', paperFormData.advisor);
            if (paperFormData.university) formData.append('university', paperFormData.university);
            if (paperFormData.department) formData.append('department', paperFormData.department);
            if (paperFormData.year) formData.append('year', paperFormData.year);
            if (paperFormData.journal) formData.append('journal', paperFormData.journal);
            if (paperFormData.volume) formData.append('volume', paperFormData.volume);
            if (paperFormData.issue) formData.append('issue', paperFormData.issue);
            if (paperFormData.pages) formData.append('pages', paperFormData.pages);
            if (paperFormData.doi) formData.append('doi', paperFormData.doi);
            if (paperFormData.issn) formData.append('issn', paperFormData.issn);
            if (paperFormData.file) formData.append('file', paperFormData.file);
            if (paperFormData.coverImage) formData.append('cover_image', paperFormData.coverImage);

            if (editingPaper) {
                if (isAdmin) {
                    await papersAPI.updatePaper(editingPaper.id, formData);
                } else {
                    await papersAPI.updateUserPaper(editingPaper.id, formData);
                }
                toast.success('Paper updated successfully');
            } else {
                if (isAdmin) {
                    await papersAPI.createPaper(formData);
                } else {
                    await papersAPI.createUserPaper(formData);
                }
                toast.success('Paper created successfully');
            }

            onSuccess();
            resetPaperForm();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to save paper';
            toast.error(errorMessage);
            if (onError) {
                onError(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePaperCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPaperFormData({ ...paperFormData, coverImage: file });

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePaperFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 32 * 1024 * 1024) { // 32MB limit
                toast.error('File size must be less than 32MB');
                e.target.value = '';
                return;
            }
            setPaperFormData({ ...paperFormData, file });
        }
    };

    const handleAddAuthor = () => {
        if (paperFormData.author.trim() && !paperFormData.authors.includes(paperFormData.author.trim())) {
            setPaperFormData({
                ...paperFormData,
                authors: [...paperFormData.authors, paperFormData.author.trim()],
                author: ''
            });
        }
    };

    const handleEditAuthor = (index: number) => {
        setPaperFormData({
            ...paperFormData,
            author: paperFormData.authors[index],
            authors: paperFormData.authors.filter((_, i) => i !== index)
        });
    };

    const handleRemoveAuthor = (index: number) => {
        setPaperFormData({
            ...paperFormData,
            authors: paperFormData.authors.filter((_, i) => i !== index)
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddAuthor();
        }
    };

    const resetPaperForm = () => {
        setPaperFormData({
            title: '',
            author: '',
            authors: [],
            abstract: '',
            keywords: '',
            advisor: '',
            university: 'Universitas Dumai',
            department: '',
            year: new Date().getFullYear().toString(),
            journal: '',
            volume: '',
            issue: '',
            pages: '',
            doi: '',
            issn: '',
            file: null,
            coverImage: null,
        });
        setCoverPreview(null);
        setExistingFile(null);
        setExistingFileUrl(null);
    };

    return {
        paperFormData,
        setPaperFormData,
        handlePaperSubmit,
        handlePaperCoverChange,
        handlePaperFileChange,
        handleAddAuthor,
        handleEditAuthor,
        handleRemoveAuthor,
        handleKeyPress,
        resetPaperForm,
        isSubmitting,
        coverPreview,
        existingFile,
        existingFileUrl,
    };
} 