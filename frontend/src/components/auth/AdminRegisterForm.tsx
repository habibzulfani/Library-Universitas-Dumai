'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    VStack,
    useToast,
    Heading,
    FormHelperText,
} from '@chakra-ui/react';
import { authAPI } from '@/lib/api';
import { UserIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface AdminRegisterFormData {
    name: string;
    email: string;
    password: string;
    nim_nidn: string;
    address?: string;
}

const AdminRegisterForm: React.FC = () => {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [formData, setFormData] = useState<AdminRegisterFormData>({
        name: '',
        email: '',
        password: '',
        nim_nidn: '',
        address: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePicture(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (formData.password !== confirmPassword) {
            toast({
                title: 'Error',
                description: 'Passwords do not match',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            setLoading(false);
            return;
        }

        // Validate password length
        if (formData.password.length < 6) {
            toast({
                title: 'Error',
                description: 'Password must be at least 6 characters long',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            setLoading(false);
            return;
        }

        const formDataObj = new FormData();
        formDataObj.append('name', formData.name);
        formDataObj.append('email', formData.email);
        formDataObj.append('password', formData.password);
        formDataObj.append('nim_nidn', formData.nim_nidn);
        formDataObj.append('role', 'admin'); // Set role as admin
        formDataObj.append('address', formData.address || '');
        if (profilePicture) {
            formDataObj.append('profile_picture', profilePicture);
        }

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
        <Box as="form" onSubmit={handleSubmit} maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg">
            <Heading mb={6} textAlign="center">Admin Registration</Heading>
            <VStack spacing={4}>
                <FormControl>
                    <FormLabel>Profile Picture</FormLabel>
                    <div className="flex items-center space-x-4">
                        <div className="relative h-16 w-16 rounded-full bg-[#38b36c] flex items-center justify-center overflow-hidden">
                            {previewUrl ? (
                                <Image
                                    src={previewUrl}
                                    alt="Profile"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <UserIcon className="h-8 w-8 text-white" />
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePictureChange}
                            className="hidden"
                            id="profile-picture"
                        />
                        <label
                            htmlFor="profile-picture"
                            className="cursor-pointer bg-[#38b36c] text-white px-4 py-2 rounded-md hover:bg-[#2d8f57] transition-colors"
                        >
                            Upload Photo
                        </label>
                    </div>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Name</FormLabel>
                    <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                    />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                    />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                    />
                    <FormHelperText>
                        Password must be at least 6 characters long.
                    </FormHelperText>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Confirm Password</FormLabel>
                    <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                    />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>NIDN</FormLabel>
                    <Input
                        name="nim_nidn"
                        value={formData.nim_nidn}
                        onChange={handleChange}
                        placeholder="Enter your NIDN"
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Address</FormLabel>
                    <Input
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter your address"
                    />
                </FormControl>

                <Button
                    type="submit"
                    colorScheme="green"
                    width="full"
                    mt={4}
                    isLoading={loading}
                >
                    Register as Admin
                </Button>
            </VStack>
        </Box>
    );
};

export default AdminRegisterForm; 