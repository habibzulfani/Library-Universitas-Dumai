'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LecturerApproval from '@/components/admin/LecturerApproval';

export default function LecturerApprovalPage() {
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            router.replace('/login');
        }
    }, [user, router]);

    if (!user || user.role !== 'admin') {
        return null;
    }

    return <LecturerApproval />;
} 