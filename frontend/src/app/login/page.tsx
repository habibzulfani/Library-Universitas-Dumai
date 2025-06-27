'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    nim_nidn: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'nim_nidn'>('email');

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // If using NIM/NIDN, send that instead of email
      const loginData = loginMethod === 'email'
        ? { email: formData.email, password: formData.password }
        : { nim_nidn: formData.nim_nidn, password: formData.password };

      await login(loginData);
      router.push('/');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDemoLogin = (email: string, password: string) => {
    setFormData({ email, nim_nidn: '', password });
    setLoginMethod('email');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href="/register"
              className="font-medium text-[#009846] hover:text-[#007a36]"
            >
              create a new account
            </Link>
          </p>
        </div>

        {/* Demo Credentials Section */}
        <div className="bg-[#e6f4ec] border border-[#b2e5c7] rounded-md p-4">
          <div className="flex items-center mb-3">
            <UserIcon className="h-5 w-5 text-[#009846] mr-2" />
            <h3 className="text-sm font-medium text-[#007a36]">Demo Accounts</h3>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => handleDemoLogin('admin@demo.com', 'password123')}
              className="w-full text-left text-sm text-[#007a36] hover:text-[#005a27]"
            >
              Admin: admin@demo.com / password123
            </button>
            <button
              onClick={() => handleDemoLogin('user@demo.com', 'password123')}
              className="w-full text-left text-sm text-[#007a36] hover:text-[#005a27]"
            >
              User: user@demo.com / password123
            </button>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Login Method Toggle */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${loginMethod === 'email'
                ? 'bg-[#009846] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('nim_nidn')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${loginMethod === 'nim_nidn'
                ? 'bg-[#009846] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              NIM/NIDN
            </button>
          </div>

          <div className="rounded-md shadow-sm -space-y-px">
            {loginMethod === 'email' ? (
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
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-[#009846] focus:border-[#009846] focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            ) : (
              <div>
                <label htmlFor="nim_nidn" className="sr-only">
                  NIM/NIDN
                </label>
                <input
                  id="nim_nidn"
                  name="nim_nidn"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-[#009846] focus:border-[#009846] focus:z-10 sm:text-sm"
                  placeholder="NIM/NIDN"
                  value={formData.nim_nidn}
                  onChange={handleChange}
                />
              </div>
            )}
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-[#009846] focus:border-[#009846] focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-6">
            <div className="flex flex-row gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 text-base font-semibold rounded-md text-white bg-[#009846] hover:bg-[#007a36] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#009846] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
              <Link
                href="/register"
                className="flex-1 py-3 text-base font-semibold rounded-md text-center text-white bg-[#38b36c] hover:bg-[#2e8c55] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38b36c] transition-all"
              >
                Sign up
              </Link>
            </div>
            <div className="flex justify-end mt-2">
              <Link
                href="/forgot-password"
                className="text-sm text-[#009846] hover:text-[#007a36] font-medium"
              >
                Forgot password?
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 