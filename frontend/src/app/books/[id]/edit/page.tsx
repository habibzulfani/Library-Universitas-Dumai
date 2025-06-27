'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import BookForm from '@/components/forms/BookForm';
import { booksAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function EditBookPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [book, setBook] = useState<any>(null);

    useEffect(() => {
        const fetchBook = async () => {
            try {
                console.log('Fetching book with ID:', params.id);
                const response = await booksAPI.getBook(parseInt(params.id));
                console.log('API Response:', response);
                setBook(response);
            } catch (error) {
                console.error('Error fetching book:', error);
                toast.error('Failed to load book details');
            } finally {
                setLoading(false);
            }
        };

        fetchBook();
    }, [params.id]);

    const handleBookSuccess = () => {
        toast.success('Book updated successfully');
        router.push('/books');
    };

    const handleClose = () => {
        router.push('/books');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#38b36c]"></div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Book not found</h2>
                    <p className="text-gray-600 mb-4">The book you're looking for doesn't exist or has been removed.</p>
                    <button
                        onClick={() => router.push('/books')}
                        className="px-4 py-2 bg-[#38b36c] text-white rounded-md hover:bg-[#2e8c55]"
                    >
                        Back to Books
                    </button>
                </div>
            </div>
        );
    }

    return (
        <BookForm
            editingBook={book}
            onClose={handleClose}
            onSuccess={handleBookSuccess}
        />
    );
} 