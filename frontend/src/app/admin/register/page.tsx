import React from 'react';
import AdminRegisterForm from '@/components/auth/AdminRegisterForm';
import { Container, Heading, Text, VStack } from '@chakra-ui/react';

export default function AdminRegisterPage() {
    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={8} align="stretch">
                <Heading textAlign="center">Admin Registration</Heading>
                <Text textAlign="center" color="gray.600">
                    Create an admin account to manage the repository
                </Text>
                <AdminRegisterForm />
            </VStack>
        </Container>
    );
} 