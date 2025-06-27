'use client';

import React, { useState } from 'react';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    Select,
    VStack,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
} from '@chakra-ui/react';
import { authAPI } from '@/lib/api';

interface UserFormData {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
    user_type: 'student' | 'lecturer';
    nim_nidn: string;
    faculty: 'Fakultas Ekonomi' | 'Fakultas Ilmu Komputer' | 'Fakultas Hukum';
    department_id: number;
}

const UserManagement: React.FC = () => {
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<UserFormData>({
        name: '',
        email: '',
        password: '',
        role: 'user',
        user_type: 'student',
        nim_nidn: '',
        faculty: 'Fakultas Ilmu Komputer',
        department_id: 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'department_id' ? parseInt(value, 10) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await authAPI.adminRegister(formData);
            toast({
                title: 'User registered successfully',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            onClose();
            // Refresh user list or update state as needed
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
        <Box>
            <Button colorScheme="green" onClick={onOpen}>
                Register New User
            </Button>

            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Register New User</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box as="form" onSubmit={handleSubmit}>
                            <VStack spacing={4} pb={4}>
                                <FormControl isRequired>
                                    <FormLabel>Name</FormLabel>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter name"
                                    />
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel>Email</FormLabel>
                                    <Input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter email"
                                    />
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel>Password</FormLabel>
                                    <Input
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter password"
                                    />
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel>Role</FormLabel>
                                    <Select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </Select>
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

                                <FormControl isRequired>
                                    <FormLabel>{formData.user_type === 'student' ? 'NIM' : 'NIDN'}</FormLabel>
                                    <Input
                                        name="nim_nidn"
                                        value={formData.nim_nidn}
                                        onChange={handleChange}
                                        placeholder={`Enter ${formData.user_type === 'student' ? 'NIM' : 'NIDN'}`}
                                    />
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

                                <FormControl isRequired>
                                    <FormLabel>Department</FormLabel>
                                    <Select
                                        name="department_id"
                                        value={formData.department_id}
                                        onChange={handleChange}
                                    >
                                        {/* Add department options based on selected faculty */}
                                    </Select>
                                </FormControl>

                                <Button
                                    type="submit"
                                    colorScheme="green"
                                    width="full"
                                    isLoading={loading}
                                >
                                    Register User
                                </Button>
                            </VStack>
                        </Box>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default UserManagement; 