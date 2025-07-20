'use client';

import React, { useState } from 'react';
import { Box, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, useToast } from '@chakra-ui/react';
import UserForm, { UserFormData } from '../forms/UserForm';
import { authAPI } from '@/lib/api';

const UserManagement: React.FC = () => {
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formDataObj: FormData) => {
        setLoading(true);
        try {
            await authAPI.register(formDataObj);
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
                        <UserForm
                            onSubmit={handleSubmit}
                            showRole
                            showProfilePicture
                            showAddress
                            showConfirmPassword
                            submitLabel="Register User"
                            loading={loading}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default UserManagement; 