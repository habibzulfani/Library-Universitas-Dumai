'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Toaster } from "@/components/ui/toaster";
import { ChakraProvider, Box } from '@chakra-ui/react';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ChakraProvider>
            <AuthProvider>
                <Box minH="100vh" display="flex" flexDirection="column">
                    <Navbar />
                    <main style={{ flex: 1 }}>
                        {children}
                    </main>
                    <Footer />
                    <Toaster />
                </Box>
            </AuthProvider>
        </ChakraProvider>
    );
} 