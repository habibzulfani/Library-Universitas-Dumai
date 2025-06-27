"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/');
        }
    }, [isAuthenticated, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsLoading(true);
        try {
            const res = await fetch("/api/v1/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(
                    "If the email exists, a password reset link has been sent. Please check your inbox."
                );
            } else {
                setError(data.error || "Something went wrong. Please try again.");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Forgot your password?
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Enter your email address and we&apos;ll send you a link to reset your password.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                            <div className="text-sm text-green-700">{success}</div>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="text-sm text-red-700">{error}</div>
                        </div>
                    )}
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#009846] focus:border-[#009846] focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 mt-6">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="py-3 text-base font-semibold rounded-md text-white bg-[#009846] hover:bg-[#007a36] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#009846] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoading ? "Sending..." : "Send reset link"}
                        </button>
                        <div className="flex justify-between mt-2">
                            <Link
                                href="/login"
                                className="text-sm text-[#009846] hover:text-[#007a36] font-medium"
                            >
                                Back to login
                            </Link>
                            <Link
                                href="/register"
                                className="text-sm text-[#38b36c] hover:text-[#2e8c55] font-medium"
                            >
                                Sign up
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
} 