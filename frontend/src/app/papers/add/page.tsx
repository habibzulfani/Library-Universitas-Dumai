'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import PaperForm from '@/components/forms/PaperForm';

const AddPaperPage = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [showForm, setShowForm] = useState(true);

    const handleSuccess = () => {
        toast.success('Paper submitted successfully! Your paper has been submitted and is pending approval.');
        router.push('/papers');
    };

    const handleClose = () => {
        router.push('/papers');
    };

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