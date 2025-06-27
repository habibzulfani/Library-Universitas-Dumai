'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { papersAPI, Paper } from '@/lib/api';
import { toast } from 'react-hot-toast';
import PaperForm from '@/components/forms/PaperForm';

export default function EditPaperPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [paper, setPaper] = useState<Paper | null>(null);
    const [showForm, setShowForm] = useState(false);

    const paperId = params?.id as string;

    useEffect(() => {
        const fetchPaper = async () => {
            if (!paperId) return;

            setIsLoading(true);
            try {
                const response = await papersAPI.getPaper(parseInt(paperId));
                setPaper(response);
                setShowForm(true);
                setError('');
            } catch (err) {
                console.error('Error fetching paper:', err);
                setError('Failed to load paper details');
                toast.error('Failed to load paper details');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPaper();
    }, [paperId]);

    const handleSuccess = () => {
        toast.success('Paper updated successfully');
        router.push(`/papers/${paperId}`);
    };

    const handleClose = () => {
        router.push(`/papers/${paperId}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4cae8a] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading paper details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/papers')}
                        className="bg-[#4cae8a] text-white px-4 py-2 rounded-md hover:bg-[#357a5b]"
                    >
                        Back to Papers
                    </button>
                </div>
            </div>
        );
    }

    if (!paper) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Paper not found</p>
                    <button
                        onClick={() => router.push('/papers')}
                        className="bg-[#4cae8a] text-white px-4 py-2 rounded-md hover:bg-[#357a5b]"
                    >
                        Back to Papers
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {showForm && (
                <PaperForm
                    editingPaper={paper}
                    onClose={handleClose}
                    onSuccess={handleSuccess}
                    isAdmin={user?.role === 'admin'}
                />
            )}
        </div>
    );
} 