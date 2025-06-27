'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import BookForm from '@/components/forms/BookForm';

const AddBookPage = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [showForm, setShowForm] = useState(true);

    const handleSuccess = () => {
        toast.success('Book submitted successfully! Your book has been submitted and is pending approval.');
        router.push('/books');
    };

    const handleClose = () => {
        router.push('/books');
    };

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