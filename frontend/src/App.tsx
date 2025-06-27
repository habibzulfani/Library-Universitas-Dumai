import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import RegisterForm from './components/auth/RegisterForm';
import PendingApproval from './pages/PendingApproval';
import LecturerApproval from './components/admin/LecturerApproval';
import { AuthProvider } from './contexts/AuthContext';

const App: React.FC = () => {
    const router = useRouter();

    return (
        <ChakraProvider>
            <AuthProvider>
                {router.pathname === '/register' && <RegisterForm />}
                {router.pathname === '/pending-approval' && <PendingApproval />}
                {router.pathname === '/admin/lecturer-approval' && <LecturerApproval />}
            </AuthProvider>
        </ChakraProvider>
    );
};

export default App; 