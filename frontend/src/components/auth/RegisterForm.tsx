'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    Select,
    VStack,
    useToast,
    Text,
    Heading,
    FormErrorMessage,
    InputGroup,
    InputRightElement,
    IconButton,
    HStack,
    Image,
    Center,
    FormHelperText,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { authAPI, publicAPI } from '@/lib/api';
import { UserIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface RegisterFormData {
    name: string;
    email: string;
    password: string;
    user_type: 'student' | 'lecturer';
    nim_nidn: string;
    faculty: 'Fakultas Ekonomi' | 'Fakultas Ilmu Komputer' | 'Fakultas Hukum';
    department_id: number;
    address?: string;
}

interface ValidationErrors {
    [key: string]: string;
}

interface Department {
    id: number;
    name: string;
}

const RegisterForm: React.FC = () => {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [formData, setFormData] = useState<RegisterFormData>({
        name: '',
        email: '',
        password: '',
        user_type: 'student',
        nim_nidn: '',
        faculty: 'Fakultas Ilmu Komputer',
        department_id: 0,
        address: '',
    });
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);

    // Email validation
    const validateEmail = (email: string): string | null => {
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!email) return 'Email is required';
        if (!emailRegex.test(email)) return 'Invalid email format';
        return null;
    };

    // NIM/NIDN validation
    const validateNimNidn = (value: string, type: 'student' | 'lecturer'): string | null => {
        if (!value) return `${type === 'student' ? 'NIM' : 'NIDN'} is required`;
        if (type === 'student' && !/^\d{8}$/.test(value)) {
            return 'NIM must be 8 digits';
        }
        if (type === 'lecturer' && !/^\d{10}$/.test(value)) {
            return 'NIDN must be 10 digits';
        }
        return null;
    };

    // Password validation
    const validatePassword = (password: string): string | null => {
        if (!password) return 'Password is required';
        if (password.length < 6) return 'Password must be at least 6 characters';
        return null;
    };

    // Profile picture validation
    const validateProfilePicture = (file: File | null): string | null => {
        if (!file) return null;
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            return 'Invalid file type. Please upload a JPEG, PNG, or GIF image';
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB
            return 'File size must be less than 5MB';
        }
        return null;
    };

    useEffect(() => {
        const fetchDepartments = async () => {
            setIsLoadingDepartments(true);
            try {
                const response = await publicAPI.getDepartments(formData.faculty);
                setDepartments(response.data);
                setFormData(prev => ({ ...prev, department_id: 0 }));
            } catch (err) {
                console.error('Error fetching departments:', err);
                toast({
                    title: 'Error',
                    description: 'Failed to load departments',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
            } finally {
                setIsLoadingDepartments(false);
            }
        };

        if (formData.faculty) {
            fetchDepartments();
        }
    }, [formData.faculty, toast]);

    const validateForm = () => {
        const newErrors: ValidationErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.nim_nidn.trim()) {
            newErrors.nim_nidn = 'NIM/NIDN is required';
        } else if (formData.user_type === 'student' && !/^\d{8}$/.test(formData.nim_nidn)) {
            newErrors.nim_nidn = 'NIM must be 8 digits';
        } else if (formData.user_type === 'lecturer' && !/^\d{10}$/.test(formData.nim_nidn)) {
            newErrors.nim_nidn = 'NIDN must be 10 digits';
        }

        if (!formData.department_id) {
            newErrors.department_id = 'Department is required';
        }

        if (formData.password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'department_id' ? parseInt(value, 10) : value
        }));

        // Clear error when field is modified
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const error = validateProfilePicture(file);
            if (error) {
                toast({
                    title: 'Invalid file',
                    description: error,
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
                return;
            }
            setProfilePicture(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        const formDataObj = new FormData();
        formDataObj.append('name', formData.name.trim());
        formDataObj.append('email', formData.email.trim());
        formDataObj.append('password', formData.password);
        formDataObj.append('user_type', formData.user_type);
        formDataObj.append('nim_nidn', formData.nim_nidn);
        formDataObj.append('faculty', formData.faculty);
        formDataObj.append('department_id', formData.department_id.toString());
        if (formData.address) {
            formDataObj.append('address', formData.address.trim());
        }
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
                description: error instanceof Error ? error.message : 'Please try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box as="form" onSubmit={handleSubmit} w="100%" maxW="500px" mx="auto">
            <VStack spacing={4} align="stretch">
                <FormControl>
                    <FormLabel>Profile Picture</FormLabel>
                    <div className="flex items-center space-x-4">
                        <div className="relative h-16 w-16 rounded-full bg-[#38b36c] flex items-center justify-center overflow-hidden">
                            {previewUrl ? (
                                <Image
                                    src={previewUrl}
                                    alt="Profile"
                                    objectFit="cover"
                                    w="full"
                                    h="full"
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

                <FormControl isRequired isInvalid={!!errors.name}>
                    <FormLabel>Name</FormLabel>
                    <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                    />
                    <FormErrorMessage>{errors.name}</FormErrorMessage>
                </FormControl>

                <FormControl isRequired isInvalid={!!errors.email}>
                    <FormLabel>Email</FormLabel>
                    <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your university email"
                    />
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                </FormControl>

                <FormControl isRequired isInvalid={!!errors.password}>
                    <FormLabel>Password</FormLabel>
                    <InputGroup>
                        <Input
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                        />
                        <InputRightElement>
                            <IconButton
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                icon={showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                onClick={() => setShowPassword(!showPassword)}
                                variant="ghost"
                            />
                        </InputRightElement>
                    </InputGroup>
                    <FormHelperText>
                        Password must be at least 6 characters long.
                    </FormHelperText>
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                </FormControl>

                <FormControl isRequired isInvalid={!!errors.confirmPassword}>
                    <FormLabel>Confirm Password</FormLabel>
                    <InputGroup>
                        <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                        />
                        <InputRightElement>
                            <IconButton
                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                icon={showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                variant="ghost"
                            />
                        </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Occupation</FormLabel>
                    <Select
                        name="user_type"
                        value={formData.user_type}
                        onChange={handleChange}
                    >
                        <option value="student">Student</option>
                        <option value="lecturer">Lecturer</option>
                    </Select>
                </FormControl>

                <FormControl isRequired isInvalid={!!errors.nim_nidn}>
                    <FormLabel>{formData.user_type === 'student' ? 'NIM' : 'NIDN'}</FormLabel>
                    <Input
                        name="nim_nidn"
                        value={formData.nim_nidn}
                        onChange={handleChange}
                        placeholder={`Enter your ${formData.user_type === 'student' ? 'NIM' : 'NIDN'}`}
                    />
                    <FormErrorMessage>{errors.nim_nidn}</FormErrorMessage>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Faculty</FormLabel>
                    <Select
                        name="faculty"
                        value={formData.faculty}
                        onChange={handleChange}
                    >
                        <option value="Fakultas Ekonomi">Fakultas Ekonomi</option>
                        <option value="Fakultas Ilmu Komputer">Fakultas Ilmu Komputer</option>
                        <option value="Fakultas Hukum">Fakultas Hukum</option>
                    </Select>
                </FormControl>

                <FormControl isRequired isInvalid={!!errors.department_id}>
                    <FormLabel>Department</FormLabel>
                    <Select
                        name="department_id"
                        value={formData.department_id}
                        onChange={handleChange}
                        isDisabled={isLoadingDepartments}
                    >
                        <option value="">Select Department</option>
                        {departments.map((dept: Department) => (
                            <option key={dept.id} value={dept.id}>
                                {dept.name}
                            </option>
                        ))}
                    </Select>
                    <FormErrorMessage>{errors.department_id}</FormErrorMessage>
                </FormControl>

                <Button
                    type="submit"
                    bg="green.500"
                    _hover={{ bg: 'green.600' }}
                    color="white"
                    width="full"
                    isLoading={loading}
                    loadingText="Registering..."
                >
                    Register
                </Button>

                <Text fontSize="sm" textAlign="center">
                    Already have an account?{' '}
                    <Button
                        variant="link"
                        color="blue.500"
                        _hover={{ color: 'blue.600' }}
                        onClick={() => router.push('/login')}
                    >
                        Login here
                    </Button>
                </Text>
            </VStack>
        </Box>
    );
};

export default RegisterForm; 