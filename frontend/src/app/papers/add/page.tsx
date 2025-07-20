'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import PaperForm from '@/components/forms/PaperForm';

const AddPaperPage = () => {
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
        toast.success('Paper submitted successfully! Your paper has been submitted and is pending approval.');
        router.push('/papers');
    };

    const handleClose = () => {
        router.push('/papers');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#4cae8a] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {showForm && (
                <PaperForm
                    editingPaper={null}
                    onClose={handleClose}
                    onSuccess={handleSuccess}
                    isAdmin={user?.role === 'admin'}
                />
            )}
        </div>
    );
};

export default AddPaperPage; 