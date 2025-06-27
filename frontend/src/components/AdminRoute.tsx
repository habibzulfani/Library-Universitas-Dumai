'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminRouteProps {
    children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user || user.role !== 'admin') {
        return null;
    }

    return <>{children}</>;
};

export default AdminRoute; 