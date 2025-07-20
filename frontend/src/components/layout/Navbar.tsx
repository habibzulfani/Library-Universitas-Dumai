'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { MagnifyingGlassIcon, UserIcon, BookOpenIcon, DocumentTextIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { getFullUrl } from '@/lib/api';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  mobile?: boolean;
}

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  const isActivePath = (path: string) => {
    return pathname === path || (pathname?.startsWith(`${path}/`) ?? false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileSearchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(mobileSearchQuery.trim())}`);
      setMobileSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const NavLink: React.FC<NavLinkProps> = ({ href, children, icon: Icon, mobile = false }) => {
    const isActive = isActivePath(href);
    const baseClasses = mobile
      ? "block px-3 py-2 rounded-md text-base font-medium transition-all duration-200"
      : "px-3 py-2 rounded-md text-sm font-medium flex items-center transition-all duration-200";

    const activeClasses = isActive
      ? "bg-[#009846] text-white shadow-sm hover:bg-[#007a36]"
      : "text-gray-700 hover:text-[#009846] hover:bg-gray-50";

    return (
      <Link
        href={href}
        className={`${baseClasses} ${activeClasses}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {Icon && <Icon className={`h-4 w-4 mr-2 ${isActive ? 'text-white' : 'text-[#009846]'}`} />}
        {children}
      </Link>
    );
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center group">
              <div className="relative h-10 w-10 transition-all duration-200 group-hover:scale-105 group-hover:shadow-md">
                <Image
                  src="/logo-undu.png"
                  alt="Universitas Dumai Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="ml-2 text-xl font-bold text-[#009846] group-hover:text-[#007a36] transition-colors duration-200">
                Universitas Dumai Repository
              </span>
            </Link>

            {/* Main Navigation - Desktop */}
            <div className="hidden md:ml-10 md:flex md:space-x-4">
              <NavLink href="/books" icon={BookOpenIcon}>
                Books
              </NavLink>
              <NavLink href="/papers" icon={DocumentTextIcon}>
                Papers
              </NavLink>
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <form className="relative w-full" onSubmit={handleSearch}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="search"
                placeholder="Search for books, papers, authors, ISBN, ISSN, DOI, or year..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[#009846] focus:border-[#009846] transition-all duration-200 hover:border-[#009846]"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {/* Desktop User Menu & Mobile Menu Button */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <div className="md:hidden mr-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="bg-white p-2 rounded-md text-gray-400 hover:text-[#009846] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#009846] transition-all duration-200"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* User Menu - Desktop */}
            <div className="hidden md:flex items-center">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#009846] p-2 transition-all duration-200 hover:bg-gray-50"
                  >
                    <div className="h-8 w-8 rounded-full bg-[#009846] flex items-center justify-center shadow-sm overflow-hidden">
                      {user?.profile_picture_url ? (
                        <Image
                          src={getFullUrl(user.profile_picture_url) || ''}
                          alt={user.name}
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      ) : (
                        <UserIcon className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <span className="ml-2 text-gray-700 font-medium">
                      {user?.name}
                    </span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 transform transition-all duration-200 ease-out">
                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#009846] transition-all duration-200"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          My Dashboard
                        </Link>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#009846] transition-all duration-200"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Profile
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#009846] transition-all duration-200"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#009846] transition-all duration-200"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex space-x-4">
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-[#009846] px-4 py-2 rounded-md text-base font-medium transition-all duration-200 hover:bg-gray-50"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="bg-[#009846] hover:bg-[#007a36] text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <NavLink href="/books" icon={BookOpenIcon} mobile>
              Books
            </NavLink>
            <NavLink href="/papers" icon={DocumentTextIcon} mobile>
              Papers
            </NavLink>

            {/* Mobile Search */}
            <div className="px-3 py-2">
              <form className="relative" onSubmit={handleMobileSearch}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="search"
                  placeholder="Search for books, papers, authors, ISBN, ISSN, DOI, or year..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[#009846] focus:border-[#009846] transition-all duration-200 hover:border-[#009846]"
                  value={mobileSearchQuery}
                  onChange={e => setMobileSearchQuery(e.target.value)}
                />
              </form>
            </div>

            {/* Mobile User Menu */}
            <div className="border-t border-gray-200 pt-4">
              {isAuthenticated ? (
                <div className="space-y-1">
                  <div className="px-3 py-2">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-[#009846] flex items-center justify-center shadow-sm overflow-hidden">
                        {user?.profile_picture_url ? (
                          <Image
                            src={getFullUrl(user.profile_picture_url) || ''}
                            alt={user.name}
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        ) : (
                          <UserIcon className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <span className="ml-2 text-gray-700 font-medium">
                        {user?.name}
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#009846] hover:bg-gray-50 transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#009846] hover:bg-gray-50 transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#009846] hover:bg-gray-50 transition-all duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#009846] hover:bg-gray-50 transition-all duration-200"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Link
                    href="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#009846] hover:bg-gray-50 transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="block px-3 py-2 rounded-md text-base font-medium bg-[#009846] text-white hover:bg-[#007a36] shadow-sm transition-all duration-200 hover:shadow-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 