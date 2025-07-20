'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import BookForm from '@/components/forms/BookForm';

const AddBookPage = () => {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
            return;
        }
        if (!loading && user) {
            setShowForm(true);
        }
    }, [user, loading, router]);

    const handleSuccess = () => {
        toast.success('Book submitted successfully! Your book has been submitted and is pending approval.');
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

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {showForm && (
                <BookForm
                    editingBook={null}
                    onClose={handleClose}
                    onSuccess={handleSuccess}
                    isAdmin={user?.role === 'admin'}
                />
            )}
        </div>
    );
};

export default AddBookPage; 