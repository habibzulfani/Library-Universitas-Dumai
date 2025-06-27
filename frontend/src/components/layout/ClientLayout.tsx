'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import { Toaster } from "@/components/ui/toaster";
import { ChakraProvider } from '@chakra-ui/react';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ChakraProvider>
            <AuthProvider>
                <Navbar />
                <main>
                    {children}
                </main>
                <Toaster />
            </AuthProvider>
        </ChakraProvider>
    );
} 