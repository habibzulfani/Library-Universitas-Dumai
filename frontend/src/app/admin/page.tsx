'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import { 
  BookOpenIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface Stats {
  totalBooks: number;
  totalPapers: number;
  totalUsers: number;
  totalDownloads: number;
}

interface Book {
  id: number;
  title: string;
  author: string;
  publisher?: string;
  published_year?: number;
  isbn?: string;
  subject?: string;
  language?: string;
  pages?: number;
  summary?: string;
  file_url?: string;
  created_at: string;
}

interface Paper {
  id: number;
  title: string;
  author: string;
  advisor?: string;
  university?: string;
  department?: string;
  year?: number;
  abstract?: string;
  keywords?: string;
  file_url?: string;
  created_at: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  nim?: string;
  jurusan?: string;
  role: string;
  created_at: string;
}

export default function AdminPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalBooks: 0,
    totalPapers: 0,
    totalUsers: 0,
    totalDownloads: 0
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Form states
  const [showBookForm, setShowBookForm] = useState(false);
  const [showPaperForm, setShowPaperForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'book' | 'paper'; id: number; title: string } | null>(null);

  // File upload states
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [paperFile, setPaperFile] = useState<File | null>(null);

  // Form data states
  const [bookFormData, setBookFormData] = useState({
    title: '', author: '', publisher: '', published_year: new Date().getFullYear(),
    isbn: '', subject: '', language: 'English', pages: 0, summary: ''
  });
  const [paperFormData, setPaperFormData] = useState({
    title: '', author: '', advisor: '', university: 'Universitas Dumai',
    department: '', year: new Date().getFullYear(), abstract: '', keywords: ''
  });

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadStats();
      if (activeTab === 'books') loadBooks();
      if (activeTab === 'papers') loadPapers();
      if (activeTab === 'users') loadUsers();
    }
  }, [isAuthenticated, isAdmin, activeTab]);

  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const [booksRes, papersRes] = await Promise.all([
        api.get('/books'),
        api.get('/papers')
      ]);
      
      setStats({
        totalBooks: booksRes.data.total || booksRes.data.length || 0,
        totalPapers: papersRes.data.total || papersRes.data.length || 0,
        totalUsers: 150,
        totalDownloads: 850
      });
    } catch (error) {
      setError('Failed to load dashboard statistics');
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/books');
      setBooks(response.data.data || response.data || []);
    } catch (error) {
      setError('Failed to load books');
      console.error('Error loading books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPapers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/papers');
      setPapers(response.data.data || response.data || []);
    } catch (error) {
      setError('Failed to load papers');
      console.error('Error loading papers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setUsers([
        { id: 1, email: 'admin@demo.com', name: 'Administrator', role: 'admin', created_at: '2025-01-01' },
        { id: 2, email: 'user@demo.com', name: 'Regular User', role: 'user', created_at: '2025-01-02' },
        { id: 3, email: 'john.smith@demo.com', name: 'John Smith', nim: '12345', jurusan: 'Computer Science', role: 'user', created_at: '2025-01-03' }
      ]);
    } catch (error) {
      setError('Failed to load users');
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(bookFormData).forEach(([key, value]) => {
        if (value !== '' && value !== 0) {
          formData.append(key, value.toString());
        }
      });
      
      if (bookFile) {
        formData.append('file', bookFile);
      }

      await api.post('/admin/books', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccessMessage('Book created successfully!');
      resetBookForm();
      loadBooks();
    } catch (error) {
      setError('Failed to create book');
      console.error('Error creating book:', error);
    }
  };

  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    
    try {
      const formData = new FormData();
      Object.entries(bookFormData).forEach(([key, value]) => {
        if (value !== '' && value !== 0) {
          formData.append(key, value.toString());
        }
      });
      
      if (bookFile) {
        formData.append('file', bookFile);
      }

      await api.put(`/admin/books/${editingBook.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccessMessage('Book updated successfully!');
      resetBookForm();
      loadBooks();
    } catch (error) {
      setError('Failed to update book');
      console.error('Error updating book:', error);
    }
  };

  const handleDeleteBook = async (id: number) => {
    try {
      await api.delete(`/admin/books/${id}`);
      setSuccessMessage('Book deleted successfully!');
      setBooks(books.filter(book => book.id !== id));
      setShowDeleteConfirm(null);
    } catch (error) {
      setError('Failed to delete book');
      console.error('Error deleting book:', error);
    }
  };

  const handleCreatePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(paperFormData).forEach(([key, value]) => {
        if (value !== '' && value !== 0) {
          formData.append(key, value.toString());
        }
      });
      
      if (paperFile) {
        formData.append('file', paperFile);
      }

      await api.post('/admin/papers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccessMessage('Paper created successfully!');
      resetPaperForm();
      loadPapers();
    } catch (error) {
      setError('Failed to create paper');
      console.error('Error creating paper:', error);
    }
  };

  const handleUpdatePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPaper) return;
    
    try {
      const formData = new FormData();
      Object.entries(paperFormData).forEach(([key, value]) => {
        if (value !== '' && value !== 0) {
          formData.append(key, value.toString());
        }
      });
      
      if (paperFile) {
        formData.append('file', paperFile);
      }

      await api.put(`/admin/papers/${editingPaper.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccessMessage('Paper updated successfully!');
      resetPaperForm();
      loadPapers();
    } catch (error) {
      setError('Failed to update paper');
      console.error('Error updating paper:', error);
    }
  };

  const handleDeletePaper = async (id: number) => {
    try {
      await api.delete(`/admin/papers/${id}`);
      setSuccessMessage('Paper deleted successfully!');
      setPapers(papers.filter(paper => paper.id !== id));
      setShowDeleteConfirm(null);
    } catch (error) {
      setError('Failed to delete paper');
      console.error('Error deleting paper:', error);
    }
  };

  const resetBookForm = () => {
    setBookFormData({
      title: '', author: '', publisher: '', published_year: new Date().getFullYear(),
      isbn: '', subject: '', language: 'English', pages: 0, summary: ''
    });
    setBookFile(null);
    setShowBookForm(false);
    setEditingBook(null);
  };

  const resetPaperForm = () => {
    setPaperFormData({
      title: '', author: '', advisor: '', university: 'Universitas Dumai',
      department: '', year: new Date().getFullYear(), abstract: '', keywords: ''
    });
    setPaperFile(null);
    setShowPaperForm(false);
    setEditingPaper(null);
  };

  const startEditBook = (book: Book) => {
    setEditingBook(book);
    setBookFormData({
      title: book.title,
      author: book.author,
      publisher: book.publisher || '',
      published_year: book.published_year || new Date().getFullYear(),
      isbn: book.isbn || '',
      subject: book.subject || '',
      language: book.language || 'English',
      pages: book.pages || 0,
      summary: book.summary || ''
    });
    setShowBookForm(true);
  };

  const startEditPaper = (paper: Paper) => {
    setEditingPaper(paper);
    setPaperFormData({
      title: paper.title,
      author: paper.author,
      advisor: paper.advisor || '',
      university: paper.university || 'Universitas Dumai',
      department: paper.department || '',
      year: paper.year || new Date().getFullYear(),
      abstract: paper.abstract || '',
      keywords: paper.keywords || ''
    });
    setShowPaperForm(true);
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPapers = papers.filter(paper =>
    paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-xl p-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please sign in to access the admin panel.</p>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-xl p-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You need administrator privileges to access this page.</p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-lg text-gray-600">Manage your e-repository system</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                <p className="text-sm text-gray-500">Last updated</p>
                <p className="font-semibold text-gray-900">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
            <div className="flex">
              <CheckIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-auto text-green-400 hover:text-green-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm p-2">
            <nav className="flex space-x-2">
              {[
                { id: 'dashboard', name: 'Dashboard', icon: ChartBarIcon, color: 'blue' },
                { id: 'books', name: 'Books', icon: BookOpenIcon, color: 'indigo' },
                { id: 'papers', name: 'Papers', icon: DocumentTextIcon, color: 'green' },
                { id: 'users', name: 'Users', icon: UserGroupIcon, color: 'purple' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? `bg-${tab.color}-500 text-white shadow-lg scale-105`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-3" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Overview</h2>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <BookOpenIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Books</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalBooks}</p>
                        <p className="text-xs text-green-600 mt-1">↗ Active collection</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 rounded-xl">
                        <DocumentTextIcon className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Papers</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalPapers}</p>
                        <p className="text-xs text-green-600 mt-1">↗ Research archive</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 rounded-xl">
                        <UserGroupIcon className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                        <p className="text-xs text-blue-600 mt-1">↗ Registered members</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center">
                      <div className="p-3 bg-yellow-100 rounded-xl">
                        <ArrowDownTrayIcon className="h-8 w-8 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Downloads</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalDownloads}</p>
                        <p className="text-xs text-green-600 mt-1">↗ Total downloads</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    setActiveTab('books');
                    setShowBookForm(true);
                  }}
                  className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                >
                  <PlusIcon className="h-6 w-6 text-blue-600 mr-3" />
                  <span className="font-medium text-blue-900">Add New Book</span>
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab('papers');
                    setShowPaperForm(true);
                  }}
                  className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200"
                >
                  <PlusIcon className="h-6 w-6 text-green-600 mr-3" />
                  <span className="font-medium text-green-900">Add New Paper</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('users')}
                  className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200"
                >
                  <EyeIcon className="h-6 w-6 text-purple-600 mr-3" />
                  <span className="font-medium text-purple-900">View Users</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Books Management Tab */}
        {activeTab === 'books' && (
          <div className="space-y-6">
            {/* Add/Edit Book Form */}
            {showBookForm && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {editingBook ? 'Edit Book' : 'Add New Book'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {editingBook ? 'Update book information' : 'Fill in the details to add a new book'}
                    </p>
                  </div>
                  <button
                    onClick={resetBookForm}
                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <form onSubmit={editingBook ? handleUpdateBook : handleCreateBook} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={bookFormData.title}
                        onChange={(e) => setBookFormData({...bookFormData, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter book title"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Author <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={bookFormData.author}
                        onChange={(e) => setBookFormData({...bookFormData, author: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter author name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Publisher</label>
                      <input
                        type="text"
                        value={bookFormData.publisher}
                        onChange={(e) => setBookFormData({...bookFormData, publisher: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter publisher name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Publication Year</label>
                      <input
                        type="number"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        value={bookFormData.published_year}
                        onChange={(e) => setBookFormData({...bookFormData, published_year: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pages</label>
                      <input
                        type="number"
                        min="1"
                        value={bookFormData.pages}
                        onChange={(e) => setBookFormData({...bookFormData, pages: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Number of pages"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ISBN</label>
                      <input
                        type="text"
                        value={bookFormData.isbn}
                        onChange={(e) => setBookFormData({...bookFormData, isbn: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ISBN number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                      <input
                        type="text"
                        value={bookFormData.subject}
                        onChange={(e) => setBookFormData({...bookFormData, subject: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Book subject/category"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select
                        value={bookFormData.language}
                        onChange={(e) => setBookFormData({...bookFormData, language: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="English">English</option>
                        <option value="Indonesian">Indonesian</option>
                        <option value="Mandarin">Mandarin</option>
                        <option value="Arabic">Arabic</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">File Upload</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label htmlFor="book-file" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              {bookFile ? bookFile.name : 'Click to upload book file'}
                            </span>
                            <span className="mt-1 block text-xs text-gray-500">
                              PDF, DOC, DOCX up to 32MB
                            </span>
                          </label>
                          <input
                            id="book-file"
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setBookFile(e.target.files?.[0] || null)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
                      <textarea
                        rows={4}
                        value={bookFormData.summary}
                        onChange={(e) => setBookFormData({...bookFormData, summary: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Brief description of the book"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={resetBookForm}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                    >
                      {editingBook ? 'Update Book' : 'Add Book'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Books List */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Books Management</h2>
                  <p className="text-gray-600 mt-1">Manage your book collection</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search books..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => setShowBookForm(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Book
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-6 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : filteredBooks.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No books found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first book.'}
                  </p>
                  {!searchTerm && (
                    <div className="mt-6">
                      <button
                        onClick={() => setShowBookForm(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Book
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredBooks.map((book) => (
                    <div key={book.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-16 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                              <BookOpenIcon className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">{book.title}</h3>
                              <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                              <div className="flex flex-wrap gap-2 text-xs">
                                {book.subject && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                    {book.subject}
                                  </span>
                                )}
                                {book.published_year && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                                    {book.published_year}
                                  </span>
                                )}
                                {book.pages && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                    {book.pages} pages
                                  </span>
                                )}
                                {book.language && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                    {book.language}
                                  </span>
                                )}
                                {book.file_url && (
                                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                                    File Available
                                  </span>
                                )}
                              </div>
                              {book.summary && (
                                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                  {book.summary}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 ml-4">
                          <button
                            onClick={() => startEditBook(book)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="Edit book"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm({ type: 'book', id: book.id, title: book.title })}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Delete book"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Papers Management Tab */}
        {activeTab === 'papers' && (
          <div className="space-y-6">
            {/* Add/Edit Paper Form */}
            {showPaperForm && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {editingPaper ? 'Edit Paper' : 'Add New Paper'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {editingPaper ? 'Update paper information' : 'Fill in the details to add a new research paper'}
                    </p>
                  </div>
                  <button
                    onClick={resetPaperForm}
                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <form onSubmit={editingPaper ? handleUpdatePaper : handleCreatePaper} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={paperFormData.title}
                        onChange={(e) => setPaperFormData({...paperFormData, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter paper title"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Author <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={paperFormData.author}
                        onChange={(e) => setPaperFormData({...paperFormData, author: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter author name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Advisor</label>
                      <input
                        type="text"
                        value={paperFormData.advisor}
                        onChange={(e) => setPaperFormData({...paperFormData, advisor: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter advisor name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">University</label>
                      <input
                        type="text"
                        value={paperFormData.university}
                        onChange={(e) => setPaperFormData({...paperFormData, university: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="University name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                      <input
                        type="text"
                        value={paperFormData.department}
                        onChange={(e) => setPaperFormData({...paperFormData, department: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Department/Faculty"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                      <input
                        type="number"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        value={paperFormData.year}
                        onChange={(e) => setPaperFormData({...paperFormData, year: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">File Upload</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label htmlFor="paper-file" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              {paperFile ? paperFile.name : 'Click to upload paper file'}
                            </span>
                            <span className="mt-1 block text-xs text-gray-500">
                              PDF, DOC, DOCX up to 32MB
                            </span>
                          </label>
                          <input
                            id="paper-file"
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setPaperFile(e.target.files?.[0] || null)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Abstract</label>
                      <textarea
                        rows={4}
                        value={paperFormData.abstract}
                        onChange={(e) => setPaperFormData({...paperFormData, abstract: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Brief abstract of the research"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                      <input
                        type="text"
                        placeholder="Separate keywords with commas (e.g., machine learning, AI, research)"
                        value={paperFormData.keywords}
                        onChange={(e) => setPaperFormData({...paperFormData, keywords: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={resetPaperForm}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
                    >
                      {editingPaper ? 'Update Paper' : 'Add Paper'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Papers List */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Papers Management</h2>
                  <p className="text-gray-600 mt-1">Manage your research papers collection</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search papers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => setShowPaperForm(true)}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Paper
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-6 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : filteredPapers.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No papers found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first research paper.'}
                  </p>
                  {!searchTerm && (
                    <div className="mt-6">
                      <button
                        onClick={() => setShowPaperForm(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Paper
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredPapers.map((paper) => (
                    <div key={paper.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-16 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                              <DocumentTextIcon className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">{paper.title}</h3>
                              <p className="text-sm text-gray-600 mb-2">by {paper.author}</p>
                              <div className="flex flex-wrap gap-2 text-xs">
                                {paper.university && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                    {paper.university}
                                  </span>
                                )}
                                {paper.department && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                    {paper.department}
                                  </span>
                                )}
                                {paper.year && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                                    {paper.year}
                                  </span>
                                )}
                                {paper.advisor && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                    Advisor: {paper.advisor}
                                  </span>
                                )}
                                {paper.file_url && (
                                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                                    File Available
                                  </span>
                                )}
                              </div>
                              {paper.abstract && (
                                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                  {paper.abstract}
                                </p>
                              )}
                              {paper.keywords && (
                                <div className="mt-2">
                                  <span className="text-xs text-gray-400">Keywords: </span>
                                  <span className="text-xs text-gray-600">{paper.keywords}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 ml-4">
                          <button
                            onClick={() => startEditPaper(paper)}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors duration-200"
                            title="Edit paper"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm({ type: 'paper', id: paper.id, title: paper.title })}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Delete paper"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Management Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Users Management</h2>
                  <p className="text-gray-600 mt-1">Manage system users and their roles</p>
                </div>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-6 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'Try adjusting your search terms.' : 'No users match the current criteria.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                            <span className="text-lg font-semibold text-purple-600">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              {user.nim && (
                                <p className="text-xs text-gray-500 mt-1">NIM: {user.nim}</p>
                              )}
                              {user.jurusan && (
                                <p className="text-xs text-gray-500">Department: {user.jurusan}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                user.role === 'admin' 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </span>
                              <span className="text-xs text-gray-500">
                                Joined: {new Date(user.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Delete {showDeleteConfirm.type === 'book' ? 'Book' : 'Paper'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to delete &quot;{showDeleteConfirm.title}&quot;? This action cannot be undone.
                  </p>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (showDeleteConfirm.type === 'book') {
                          handleDeleteBook(showDeleteConfirm.id);
                        } else {
                          handleDeletePaper(showDeleteConfirm.id);
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 