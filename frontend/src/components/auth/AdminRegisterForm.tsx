'use client';

import UserForm, { UserFormData } from '../forms/UserForm';
import { useRouter } from 'next/navigation';
import { useToast } from '@chakra-ui/react';
import { authAPI } from '@/lib/api';
import React, { useState } from 'react';

const AdminRegisterForm: React.FC = () => {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formDataObj: FormData) => {
        setLoading(true);
        try {
            await authAPI.register(formDataObj);
            toast({
                title: 'Registration successful',
                description: 'Your account is ready to use. You can now login.',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            router.push('/login');
        } catch (error) {
            console.error('Registration error:', error);
            toast({
                title: 'Registration failed',
                description: 'Please try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <UserForm
            onSubmit={handleSubmit}
            showProfilePicture
            showConfirmPassword
            showAddress
            initialValues={{ role: 'admin' }}
            submitLabel="Register as Admin"
            loading={loading}
        />
    );
};

export default AdminRegisterForm; 