import React from 'react';
import { Box, Heading, Text, VStack, Button } from '@chakra-ui/react';
import { useRouter } from 'next/router';

const PendingApproval: React.FC = () => {
    const router = useRouter();

    return (
        <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg">
            <VStack spacing={6}>
                <Heading size="lg">Registration Pending Approval</Heading>

                <Text textAlign="center">
                    Thank you for registering as a lecturer. Your account is pending approval from an administrator.
                    You will receive an email once your account has been approved.
                </Text>

                <Text textAlign="center" fontSize="sm" color="gray.600">
                    Please check your email for the verification link to verify your email address.
                </Text>

                <Button
                    colorScheme="blue"
                    onClick={() => router.push('/login')}
                >
                    Return to Login
                </Button>
            </VStack>
        </Box>
    );
};

export default PendingApproval; 