import React from 'react';
import RegisterForm from '@/components/auth/RegisterForm';
import { Container, Heading, Text, VStack } from '@chakra-ui/react';

export default function RegisterPage() {
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading textAlign="center">Create an Account</Heading>
        <Text textAlign="center" color="gray.600">
          Join our community and start sharing your academic work
        </Text>
        <RegisterForm />
      </VStack>
    </Container>
  );
} 