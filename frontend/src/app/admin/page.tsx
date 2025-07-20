'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api, authAPI, publicAPI, adminAPI } from '@/lib/api';
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
  CheckIcon,
  AcademicCapIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { useToast } from '@chakra-ui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Add imports at the top
import BookForm from '@/components/forms/BookForm';
import PaperForm from '@/components/forms/PaperForm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LecturerApproval from '@/components/admin/LecturerApproval';
import SearchBar from '@/components/ui/SearchBar';
import Pagination from '@/components/ui/Pagination';

interface Stats {
  totalBooks: number;
  totalPapers: number;
  totalUsers: number;
  totalDownloads: number;
  totalCitations: number;
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
  pages?: string;
  summary?: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
  authors: { id: number; author_name: string }[];
  doi?: string;
}

interface Paper {
  id: number;
  title: string;
  author: string;
  authors: { id: number; author_name: string }[];
  abstract: string;
  keywords: string;
  journal: string;
  pages: string;
  year?: number;
  advisor?: string;
  university?: string;
  department?: string;
  issn?: string;
  volume?: number;
  issue?: number;
  doi?: string;
  file_url?: string;
  cover_image_url?: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  user_type: 'student' | 'lecturer';
  nim_nidn: string;
  faculty: string;
  department_id: number;
  email_verified: boolean;
  is_approved: boolean;
  created_at: string;
  address?: string; // Add missing address field
}

interface BookFormData {
  title: string;
  author: string;
  authors: string[];
  publisher: string;
  published_year: number;
  isbn: string;
  subject: string;
  language: string;
  pages: string;
  summary: string;
}

interface PaperFormData {
  title: string;
  author: string;
  authors: string[];
  advisor: string;
  university: string;
  department: string;
  year: number;
  issn: string;
  journal: string;
  volume: number;
  issue: number;
  pages: string;
  doi: string;
  abstract: string;
  keywords: string;
}

export default function AdminPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalBooks: 0,
    totalPapers: 0,
    totalUsers: 0,
    totalDownloads: 0,
    totalCitations: 0,
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [bookSearch, setBookSearch] = useState('');
  const [paperSearch, setPaperSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Pagination states
  const [booksPage, setBooksPage] = useState(1);
  const [booksTotalPages, setBooksTotalPages] = useState(0);
  const [booksTotal, setBooksTotal] = useState(0);
  const [papersPage, setPapersPage] = useState(1);
  const [papersTotalPages, setPapersTotalPages] = useState(0);
  const [papersTotal, setPapersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(0);
  const [usersTotal, setUsersTotal] = useState(0);

  // Form states
  const [showBookForm, setShowBookForm] = useState(false);
  const [showPaperForm, setShowPaperForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'book' | 'paper'; id: number; title: string } | null>(null);

  // Bulk delete states
  const [selectedBooks, setSelectedBooks] = useState<number[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<number[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState<{ type: 'book' | 'paper' | 'user'; count: number } | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Add state for editing user and user form
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [isUserSubmitting, setIsUserSubmitting] = useState(false);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState<{ id: number; name: string } | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<User & { address?: string }>>({});

  // Add state for add user modal and form
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'user' | 'admin',
    user_type: 'student' as 'student' | 'lecturer',
    nim_nidn: '',
    faculty: 'Fakultas Ilmu Komputer' as 'Fakultas Ekonomi' | 'Fakultas Ilmu Komputer' | 'Fakultas Hukum',
    department_id: 1,
  });
  const [isAddUserSubmitting, setIsAddUserSubmitting] = useState(false);

  // Add after addUserForm state:
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);

  const toast = useToast();
  const [pendingLecturerCount, setPendingLecturerCount] = useState(0);
  const [lastPendingLecturerCount, setLastPendingLecturerCount] = useState(0);

  // Add state for user and download stats
  const [userStats, setUserStats] = useState<{ year: number; month: number; count: number }[]>([]);
  const [downloadStats, setDownloadStats] = useState<{ year: number; month: number; count: number }[]>([]);
  const [isLoadingUserStats, setIsLoadingUserStats] = useState(false);
  const [isLoadingDownloadStats, setIsLoadingDownloadStats] = useState(false);
  const [citationStats, setCitationStats] = useState<{ year: number; month: number; count: number }[]>([]);
  const [isLoadingCitationStats, setIsLoadingCitationStats] = useState(false);

  // Fetch departments when faculty changes in add user form
  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoadingDepartments(true);
      try {
        const response = await publicAPI.getDepartments(addUserForm.faculty);
        setDepartments(response.data);
        setAddUserForm(prev => ({ ...prev, department_id: response.data[0]?.id || 0 }));
      } catch (err) {
        setDepartments([]);
        setAddUserForm(prev => ({ ...prev, department_id: 0 }));
      } finally {
        setIsLoadingDepartments(false);
      }
    };
    if (addUserForm.faculty) {
      fetchDepartments();
    }
  }, [addUserForm.faculty]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadStats();
      if (activeTab === 'books') loadBooks(1, bookSearch);
      if (activeTab === 'papers') loadPapers(1, paperSearch);
      if (activeTab === 'users') loadUsers(1, userSearch);
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

  // Poll for pending lecturers every 15 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchPendingLecturers = async () => {
      try {
        const response = await adminAPI.getPendingLecturers();
        const count = Array.isArray(response.data) ? response.data.length : 0;
        setPendingLecturerCount(count);
        if (count > lastPendingLecturerCount) {
          toast({
            title: 'New lecturer registration',
            description: 'There are new lecturers pending approval.',
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
        }
        setLastPendingLecturerCount(count);
      } catch { }
    };
    fetchPendingLecturers();
    interval = setInterval(fetchPendingLecturers, 15000);
    return () => clearInterval(interval);
  }, [lastPendingLecturerCount, toast]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const [booksRes, papersRes, usersRes, downloadsRes, citationsRes] = await Promise.all([
        api.get('/books'),
        api.get('/papers'),
        api.get('/users/count'),
        api.get('/downloads/count'),
        api.get('/citations/count'),
      ]).catch(error => {
        throw new Error('Failed to fetch dashboard statistics: ' + (error.response?.data?.message || error.message));
      });

      setStats({
        totalBooks: booksRes.data.total || 0,
        totalPapers: papersRes.data.total || 0,
        totalUsers: usersRes.data.count || 0,
        totalDownloads: downloadsRes.data.count || 0,
        totalCitations: citationsRes.data.count || 0,
      });
    } catch (error: any) {
      setError(error.message || 'Failed to load dashboard statistics');
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBooks = async (page: number = 1, search: string = '') => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(search && { query: search })
      });

      const response = await api.get(`/admin/books?${params}`).catch(error => {
        throw new Error('Failed to fetch books: ' + (error.response?.data?.message || error.message));
      });

      setBooks(response.data.data || []);
      setBooksTotalPages(response.data.total_pages || 0);
      setBooksTotal(response.data.total || 0);
      setBooksPage(page);
    } catch (error: any) {
      setError(error.message || 'Failed to load books');
      console.error('Error loading books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPapers = async (page: number = 1, search: string = '') => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(search && { query: search })
      });

      const response = await api.get(`/admin/papers?${params}`).catch(error => {
        throw new Error('Failed to fetch papers: ' + (error.response?.data?.message || error.message));
      });

      setPapers(response.data.data || []);
      setPapersTotalPages(response.data.total_pages || 0);
      setPapersTotal(response.data.total || 0);
      setPapersPage(page);
    } catch (error: any) {
      setError(error.message || 'Failed to load papers');
      console.error('Error loading papers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async (page: number = 1, search: string = '') => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(search && { query: search })
      });

      const response = await api.get(`/admin/users?${params}`).catch(error => {
        throw new Error('Failed to fetch users: ' + (error.response?.data?.message || error.message));
      });

      setUsers(response.data.data || []);
      setUsersTotalPages(response.data.total_pages || 0);
      setUsersTotal(response.data.total || 0);
      setUsersPage(page);
    } catch (error: any) {
      setError(error.message || 'Failed to load users');
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Search handlers
  const handleBookSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setBooksPage(1);
    loadBooks(1, bookSearch);
  };

  const handlePaperSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPapersPage(1);
    loadPapers(1, paperSearch);
  };

  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setUsersPage(1);
    loadUsers(1, userSearch);
  };

  // Pagination handlers
  const handleBooksPageChange = (page: number) => {
    setBooksPage(page);
    loadBooks(page, bookSearch);
  };

  const handlePapersPageChange = (page: number) => {
    setPapersPage(page);
    loadPapers(page, paperSearch);
  };

  const handleUsersPageChange = (page: number) => {
    setUsersPage(page);
    loadUsers(page, userSearch);
  };

  const validateFile = (file: File) => {
    const maxSize = 32 * 1024 * 1024; // 32MB
    const allowedTypes = ['.pdf', '.doc', '.docx'];

    if (file.size > maxSize) {
      throw new Error('File size must be less than 32MB');
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(`.${extension}`)) {
      throw new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed');
    }
  };

  const handleFileUpload = async (file: File, type: 'book' | 'paper') => {
    try {
      validateFile(file);
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/upload/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      return response.data.fileUrl;
    } catch (error: any) {
      throw new Error('File upload failed: ' + (error.message || 'Unknown error'));
    }
  };

  const logActivity = async (action: string, itemId: number, itemType: 'book' | 'paper') => {
    try {
      await api.post('/activity-logs', {
        action,
        item_id: itemId,
        item_type: itemType
      });
    } catch (error: any) {
      console.error('Failed to log activity:', error);
    }
  };

  const handleDeleteBook = async (id: number) => {
    try {
      const response = await api.delete(`/admin/books/${id}`);
      await logActivity('delete_book', id, 'book');
      setSuccessMessage('Book deleted successfully');
      setBooks(books.filter(book => book.id !== id));
      setShowDeleteConfirm(null);
      console.log('Book deleted, backend response:', response?.data);
    } catch (error: any) {
      setError('Failed to delete book');
      console.error('Error deleting book:', error);
    }
  };

  const handleDeletePaper = async (id: number) => {
    try {
      await api.delete(`/admin/papers/${id}`);
      await logActivity('delete_paper', id, 'paper');
      setSuccessMessage('Paper deleted successfully');
      setPapers(papers.filter(paper => paper.id !== id));
      setShowDeleteConfirm(null);
    } catch (error: any) {
      setError('Failed to delete paper');
      console.error('Error deleting paper:', error);
    }
  };

  const handleBookSuccess = () => {
    setShowBookForm(false);
    setEditingBook(null);
    loadBooks();
  };

  const startEditBook = async (book: Book) => {
    try {
      // Fetch the full book data including authors
      const response = await api.get(`/books/${book.id}`);
      const fullBook = response.data;
      setEditingBook(fullBook);
      setShowBookForm(true);
    } catch (error: any) {
      setError('Failed to load book details: ' + (error.response?.data?.message || error.message));
      console.error('Error loading book details:', error);
    }
  };

  const handlePaperSuccess = () => {
    setShowPaperForm(false);
    setEditingPaper(null);
    loadPapers();
  };

  const startEditPaper = async (paper: Paper) => {
    try {
      // Fetch the full paper data including authors
      const response = await api.get(`/papers/${paper.id}`);
      const fullPaper = response.data;
      setEditingPaper(fullPaper);
      setShowPaperForm(true);
    } catch (error: any) {
      setError('Failed to load paper details: ' + (error.response?.data?.message || error.message));
      console.error('Error loading paper details:', error);
    }
  };

  // Enhanced filteredBooks
  const filteredBooks = books.filter(book => {
    const search = bookSearch.toLowerCase();
    return (
      book.title.toLowerCase().includes(search) ||
      book.author.toLowerCase().includes(search) ||
      (book.authors && book.authors.some(a => a.author_name.toLowerCase().includes(search))) ||
      (book.publisher && book.publisher.toLowerCase().includes(search)) ||
      (book.published_year && book.published_year.toString().includes(search)) ||
      (book.isbn && book.isbn.toLowerCase().includes(search)) ||
      (book.subject && book.subject.toLowerCase().includes(search)) ||
      (book.language && book.language.toLowerCase().includes(search)) ||
      (book.summary && book.summary.toLowerCase().includes(search)) ||
      (book.doi && book.doi.toLowerCase().includes(search))
    );
  });

  // Enhanced filteredPapers
  const filteredPapers = papers.filter(paper => {
    const search = paperSearch.toLowerCase();
    return (
      paper.title.toLowerCase().includes(search) ||
      paper.author.toLowerCase().includes(search) ||
      (paper.authors && paper.authors.some(a => a.author_name.toLowerCase().includes(search))) ||
      (paper.advisor && paper.advisor.toLowerCase().includes(search)) ||
      (paper.university && paper.university.toLowerCase().includes(search)) ||
      (paper.department && paper.department.toLowerCase().includes(search)) ||
      (paper.year && paper.year.toString().includes(search)) ||
      (paper.journal && paper.journal.toLowerCase().includes(search)) ||
      (paper.volume && paper.volume.toString().includes(search)) ||
      (paper.issue && paper.issue.toString().includes(search)) ||
      (paper.pages && paper.pages.toLowerCase().includes(search)) ||
      (paper.doi && paper.doi.toLowerCase().includes(search)) ||
      (paper.abstract && paper.abstract.toLowerCase().includes(search)) ||
      (paper.keywords && paper.keywords.toLowerCase().includes(search))
    );
  });

  // Add after departments state
  useEffect(() => {
    if (activeTab === 'users' && departments.length === 0) {
      publicAPI.getDepartments().then(res => {
        setDepartments(res.data);
      }).catch(() => setDepartments([]));
    }
  }, [activeTab, departments.length]);

  // Helper to get department name by id
  const getDepartmentName = (id: number) => {
    const dep = departments.find(d => d.id === id);
    return dep ? dep.name : '';
  };

  // Update filteredUsers to include nim/nidn and department name
  const filteredUsers = users.filter(user => {
    const search = userSearch.toLowerCase();
    return (
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.role.toLowerCase().includes(search) ||
      (user.nim_nidn && user.nim_nidn.toLowerCase().includes(search)) ||
      getDepartmentName(user.department_id).toLowerCase().includes(search)
    );
  });

  const approveUser = async (userId: number) => {
    try {
      await api.put(`/admin/users/${userId}/approve`);
      setSuccessMessage('User approved successfully');
      loadUsers();
    } catch (error) {
      setError('Failed to approve user');
    }
  };

  const updateUserRole = async (userId: number, newRole: 'admin' | 'user') => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error('User not found');
      await authAPI.updateUser(userId, {
        name: user.name,
        email: user.email,
        role: newRole,
        user_type: user.user_type,
        nim_nidn: user.nim_nidn,
        faculty: user.faculty as 'Fakultas Ekonomi' | 'Fakultas Ilmu Komputer' | 'Fakultas Hukum' | undefined,
        department_id: user.department_id,
        is_approved: user.is_approved,
      });
      setSuccessMessage('User role updated successfully');
      loadUsers();
    } catch (error) {
      setError('Failed to update user role');
    }
  };

  // Bulk delete handlers
  const handleSelectAllBooks = (checked: boolean) => {
    if (checked) {
      setSelectedBooks(books.map(book => book.id));
    } else {
      setSelectedBooks([]);
    }
  };

  const handleSelectBook = (bookId: number, checked: boolean) => {
    if (checked) {
      setSelectedBooks(prev => [...prev, bookId]);
    } else {
      setSelectedBooks(prev => prev.filter(id => id !== bookId));
    }
  };

  const handleSelectAllPapers = (checked: boolean) => {
    if (checked) {
      setSelectedPapers(papers.map(paper => paper.id));
    } else {
      setSelectedPapers([]);
    }
  };

  const handleSelectPaper = (paperId: number, checked: boolean) => {
    if (checked) {
      setSelectedPapers(prev => [...prev, paperId]);
    } else {
      setSelectedPapers(prev => prev.filter(id => id !== paperId));
    }
  };

  const handleSelectAllUsers = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleBulkDeleteBooks = async () => {
    if (selectedBooks.length === 0) return;

    setIsBulkDeleting(true);
    try {
      for (const bookId of selectedBooks) {
        const response = await api.delete(`/admin/books/${bookId}`);
        await logActivity('delete_book', bookId, 'book');
        console.log('Bulk book deleted, backend response:', response?.data);
      }
      setSuccessMessage(`${selectedBooks.length} book(s) deleted successfully`);
      setSelectedBooks([]);
      loadBooks();
    } catch (error: any) {
      setError('Failed to delete some books');
      console.error('Error bulk deleting books:', error);
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteConfirm(null);
    }
  };

  const handleBulkDeletePapers = async () => {
    if (selectedPapers.length === 0) return;

    setIsBulkDeleting(true);
    try {
      // Delete papers one by one (or implement bulk delete API if available)
      for (const paperId of selectedPapers) {
        await api.delete(`/admin/papers/${paperId}`);
        await logActivity('delete_paper', paperId, 'paper');
      }
      setSuccessMessage(`${selectedPapers.length} paper(s) deleted successfully`);
      setSelectedPapers([]);
      loadPapers();
    } catch (error: any) {
      setError('Failed to delete some papers');
      console.error('Error bulk deleting papers:', error);
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteConfirm(null);
    }
  };

  const handleBulkDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;

    setIsBulkDeleting(true);
    try {
      // Delete users one by one (or implement bulk delete API if available)
      for (const userId of selectedUsers) {
        await api.delete(`/admin/users/${userId}`);
      }
      setSuccessMessage(`${selectedUsers.length} user(s) deleted successfully`);
      setSelectedUsers([]);
      loadUsers();
    } catch (error: any) {
      setError('Failed to delete some users');
      console.error('Error bulk deleting users:', error);
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteConfirm(null);
    }
  };

  // Reset selections when tab changes
  useEffect(() => {
    setShowBookForm(false);
    setShowPaperForm(false);
    setEditingBook(null);
    setEditingPaper(null);
    setBookSearch('');
    setPaperSearch('');
    setUserSearch('');
    setSelectedBooks([]);
    setSelectedPapers([]);
    setSelectedUsers([]);
  }, [activeTab]);

  const tabColors: Record<string, string> = {
    dashboard: 'bg-blue-500',
    books: 'bg-indigo-500',
    papers: 'bg-green-500',
    users: 'bg-purple-500',
    'lecturer-approval': 'bg-yellow-500'
  };

  // Handler to start editing a user
  const startEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      user_type: user.user_type,
      faculty: user.faculty,
      department_id: user.department_id,
      nim_nidn: user.nim_nidn,
      is_approved: user.is_approved,
      address: user.address || '', // Add missing address field
    });
    setShowUserForm(true);
  };

  // Handler to submit user edit
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUserSubmitting(true);
    try {
      // Ensure faculty is one of the allowed values
      const allowedFaculties = [
        'Fakultas Ekonomi',
        'Fakultas Ilmu Komputer',
        'Fakultas Hukum',
      ] as const;
      let faculty: typeof allowedFaculties[number] | undefined = undefined;
      if (
        userFormData.faculty &&
        allowedFaculties.includes(userFormData.faculty as typeof allowedFaculties[number])
      ) {
        faculty = userFormData.faculty as typeof allowedFaculties[number];
      }
      await authAPI.updateUser(editingUser.id, {
        ...userFormData,
        faculty,
        address: userFormData.address, // Ensure address is included
        department_id: userFormData.department_id, // Ensure department_id is included
      });
      setSuccessMessage('User updated successfully');
      setShowUserForm(false);
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      setError('Failed to update user');
    } finally {
      setIsUserSubmitting(false);
    }
  };

  // Handler to delete user
  const handleDeleteUser = async (id: number) => {
    try {
      await authAPI.deleteUser(id);
      setSuccessMessage('User deleted successfully');
      setShowDeleteUserConfirm(null);
      loadUsers();
    } catch (error) {
      setError('Failed to delete user');
    }
  };

  const handleAddUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddUserForm(prev => ({
      ...prev,
      [name]: name === 'department_id' ? parseInt(value, 10) : value
    }));
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddUserSubmitting(true);
    try {
      const formDataObj = new FormData();
      Object.entries(addUserForm).forEach(([key, value]) => {
        formDataObj.append(key, value as string);
      });
      await authAPI.register(formDataObj);
      setSuccessMessage('User added successfully');
      setShowAddUserModal(false);
      setAddUserForm({
        name: '',
        email: '',
        password: '',
        role: 'user',
        user_type: 'student',
        nim_nidn: '',
        faculty: 'Fakultas Ilmu Komputer',
        department_id: 1,
      });
      loadUsers();
    } catch (error) {
      setError('Failed to add user');
    } finally {
      setIsAddUserSubmitting(false);
    }
  };

  // Add after addUserForm useEffect for departments:
  useEffect(() => {
    if (!showUserForm) return;
    const fetchDepartments = async () => {
      setIsLoadingDepartments(true);
      try {
        const response = await publicAPI.getDepartments(userFormData.faculty);
        setDepartments(response.data);
      } catch (err) {
        setDepartments([]);
      } finally {
        setIsLoadingDepartments(false);
      }
    };
    if (userFormData.faculty) {
      fetchDepartments();
    }
  }, [userFormData.faculty, showUserForm]);

  // Fetch user and download stats for graphs
  useEffect(() => {
    if (activeTab === 'dashboard' && isAuthenticated && isAdmin) {
      setIsLoadingUserStats(true);
      setIsLoadingDownloadStats(true);
      api.get('/users-per-month')
        .then(res => setUserStats(Array.isArray(res.data) ? res.data : []))
        .catch(() => setUserStats([]))
        .finally(() => setIsLoadingUserStats(false));
      api.get('/downloads-per-month')
        .then(res => setDownloadStats(Array.isArray(res.data) ? res.data : []))
        .catch(() => setDownloadStats([]))
        .finally(() => setIsLoadingDownloadStats(false));
    }
  }, [activeTab, isAuthenticated, isAdmin]);

  // Fetch citation stats for graph
  useEffect(() => {
    if (activeTab === 'dashboard' && isAuthenticated && isAdmin) {
      setIsLoadingCitationStats(true);
      api.get('/citations-per-month')
        .then(res => setCitationStats(Array.isArray(res.data) ? res.data : []))
        .catch(() => setCitationStats([]))
        .finally(() => setIsLoadingCitationStats(false));
    }
  }, [activeTab, isAuthenticated, isAdmin]);

  // Helper to format month labels
  const formatMonth = (year: number, month: number) => {
    return `${year}-${month.toString().padStart(2, '0')}`;
  };

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
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#38b36c] hover:bg-[#2e8c55] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38b36c]"
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
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#38b36c] hover:bg-[#2e8c55] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38b36c]"
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
              <p className="text-lg text-gray-600">Manage your Universitas Dumai Library system</p>
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
                { id: 'users', name: 'Users', icon: UserGroupIcon, color: 'purple' },
                { id: 'lecturer-approval', name: 'Lecturer Approval', icon: AcademicCapIcon, color: 'yellow' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === tab.id
                    ? `${tabColors[tab.id]} text-white shadow-lg scale-105`
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                  <tab.icon className="h-5 w-5 mr-3" />
                  {tab.name}
                  {tab.id === 'lecturer-approval' && pendingLecturerCount > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500 text-white">
                      {pendingLecturerCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
                      <div className="flex items-center">
                        <div className="p-3 bg-gray-200 rounded-xl h-14 w-14"></div>
                        <div className="ml-4 flex-1">
                          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                          <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-32"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center">
                      <div className="p-3 bg-[#e6f4ec] rounded-xl">
                        <BookOpenIcon className="h-8 w-8 text-[#38b36c]" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Books</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalBooks}</p>
                        <p className="text-xs text-[#38b36c] mt-1">↗ Active collection</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center">
                      <div className="p-3 bg-[#e6f4ec] rounded-xl">
                        <DocumentTextIcon className="h-8 w-8 text-[#38b36c]" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Papers</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalPapers}</p>
                        <p className="text-xs text-[#38b36c] mt-1">↗ Research archive</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center">
                      <div className="p-3 bg-[#e6f4ec] rounded-xl">
                        <UserGroupIcon className="h-8 w-8 text-[#38b36c]" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                        <p className="text-xs text-[#38b36c] mt-1">↗ Registered members</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center">
                      <div className="p-3 bg-[#e6f4ec] rounded-xl">
                        <ArrowDownTrayIcon className="h-8 w-8 text-[#38b36c]" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Downloads</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalDownloads}</p>
                        <p className="text-xs text-[#38b36c] mt-1">↗ Total downloads</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center">
                      <div className="p-3 bg-[#e6f4ec] rounded-xl">
                        <ClipboardDocumentIcon className="h-8 w-8 text-[#38b36c]" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Citations</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalCitations}</p>
                        <p className="text-xs text-[#38b36c] mt-1">↗ Total citations</p>
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
                  className="flex items-center p-4 bg-[#e6f4ec] rounded-lg hover:bg-[#b2e5c7] transition-colors duration-200"
                >
                  <PlusIcon className="h-6 w-6 text-[#38b36c] mr-3" />
                  <span className="font-medium text-[#2e8c55]">Add New Book</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('papers');
                    setShowPaperForm(true);
                  }}
                  className="flex items-center p-4 bg-[#e6f4ec] rounded-lg hover:bg-[#b2e5c7] transition-colors duration-200"
                >
                  <PlusIcon className="h-6 w-6 text-[#38b36c] mr-3" />
                  <span className="font-medium text-[#2e8c55]">Add New Paper</span>
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className="flex items-center p-4 bg-[#e6f4ec] rounded-lg hover:bg-[#b2e5c7] transition-colors duration-200"
                >
                  <EyeIcon className="h-6 w-6 text-[#38b36c] mr-3" />
                  <span className="font-medium text-[#2e8c55]">View Users</span>
                </button>
              </div>
            </div>

            {/* User Registrations Graph */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Registrations Per Month</h3>
              {isLoadingUserStats ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userStats.map(d => ({ ...d, label: formatMonth(d.year, d.month) }))} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" name="Users" stroke="#38b36c" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Downloads Graph */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Downloads Per Month</h3>
              {isLoadingDownloadStats ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={downloadStats.map(d => ({ ...d, label: formatMonth(d.year, d.month) }))} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" name="Downloads" stroke="#009846" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Citations Graph */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Citations Per Month</h3>
              {isLoadingCitationStats ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={citationStats.map(d => ({ ...d, label: formatMonth(d.year, d.month) }))} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" name="Citations" stroke="#eab308" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Books Management Tab */}
        {activeTab === 'books' && (
          <div className="space-y-6">
            {/* Add/Edit Book Form */}

            {/* Books List */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 flex-wrap">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Books Management</h2>
                  <p className="text-gray-600 mt-1">Manage your book collection</p>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-center w-full sm:w-auto">
                  <form onSubmit={handleBookSearch} className="flex w-full sm:w-auto flex-1 min-w-[220px] gap-2">
                    <input
                      type="search"
                      placeholder="Search books by title, author, subject, ISBN, or DOI..."
                      value={bookSearch}
                      onChange={e => setBookSearch(e.target.value)}
                      className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[#38b36c] focus:border-[#38b36c]"
                    />
                    <button
                      type="submit"
                      className="bg-[#38b36c] text-white px-4 py-2 rounded-md hover:bg-[#2e8c55] focus:outline-none focus:ring-2 focus:ring-[#38b36c]"
                    >
                      Search
                    </button>
                  </form>
                  <button
                    onClick={() => {
                      setEditingBook(null);
                      setShowBookForm(true);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-[#38b36c] text-white text-sm font-medium rounded-lg hover:bg-[#2e8c55] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38b36c] transition-colors duration-200"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Book
                  </button>
                  {selectedBooks.length > 0 && (
                    <button
                      onClick={() => setShowBulkDeleteConfirm({ type: 'book', count: selectedBooks.length })}
                      className="inline-flex items-center px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                      disabled={isBulkDeleting}
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedBooks.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Table header for checkboxes */}
              {books.length > 0 && (
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={selectedBooks.length === books.length}
                    onChange={e => handleSelectAllBooks(e.target.checked)}
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-[#38b36c] focus:ring-[#38b36c]"
                  />
                  <span className="text-sm text-gray-700">Select All</span>
                </div>
              )}

              {isLoading ? (
                <div className="grid gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : books.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No books found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {bookSearch ? 'Try adjusting your search terms.' : 'Get started by adding your first book.'}
                  </p>
                  {!bookSearch && (
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          setEditingBook(null);
                          setShowBookForm(true);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#38b36c] hover:bg-[#2e8c55]"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Book
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid gap-4">
                  {books.map((book) => (
                    <div key={book.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200 flex items-start">
                      <input
                        type="checkbox"
                        checked={selectedBooks.includes(book.id)}
                        onChange={e => handleSelectBook(book.id, e.target.checked)}
                        className="mr-4 mt-2 h-4 w-4 rounded border-gray-300 text-[#38b36c] focus:ring-[#38b36c]"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start space-x-4">
                              <div className="flex-shrink-0 w-16 h-20 bg-gradient-to-br from-[#e6f4ec] to-[#b2e5c7] rounded-lg flex items-center justify-center">
                                <BookOpenIcon className="h-8 w-8 text-[#38b36c]" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  <Link
                                    href={`/books/${book.id}`}
                                    className="text-gray-900 hover:text-[#4cae8a] hover:underline transition-colors duration-200"
                                  >
                                    {book.title}
                                  </Link>
                                </h3>
                                <div className="text-sm text-gray-600 mb-2">
                                  by {book.authors && book.authors.length > 0 ? (
                                    book.authors.map((author, index) => (
                                      <React.Fragment key={author.id}>
                                        <Link
                                          href={`/authors/${encodeURIComponent(author.author_name)}`}
                                          className="text-[#4cae8a] hover:text-[#357a5b] hover:underline"
                                        >
                                          {author.author_name}
                                        </Link>
                                        {index < book.authors!.length - 1 && <span>, </span>}
                                      </React.Fragment>
                                    ))
                                  ) : (
                                    <Link
                                      href={`/authors/${encodeURIComponent(book.author)}`}
                                      className="text-[#4cae8a] hover:text-[#357a5b] hover:underline"
                                    >
                                      {book.author}
                                    </Link>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                  {book.subject && (
                                    <span className="px-2 py-1 bg-[#e6f4ec] text-[#2e8c55] rounded-full">
                                      {book.subject}
                                    </span>
                                  )}
                                  {book.published_year && (
                                    <span className="px-2 py-1 bg-[#e6f4ec] text-[#2e8c55] rounded-full">
                                      {book.published_year}
                                    </span>
                                  )}
                                  {book.pages && (
                                    <span className="px-2 py-1 bg-[#e6f4ec] text-[#2e8c55] rounded-full">
                                      {book.pages} pages
                                    </span>
                                  )}
                                  {book.language && (
                                    <span className="px-2 py-1 bg-[#e6f4ec] text-[#2e8c55] rounded-full">
                                      {book.language}
                                    </span>
                                  )}
                                  {book.file_url && (
                                    <span className="px-2 py-1 bg-[#e6f4ec] text-[#2e8c55] rounded-full">
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
                              className="p-2 text-[#38b36c] hover:text-[#2e8c55] hover:bg-[#e6f4ec] rounded-lg transition-colors duration-200"
                              title="Edit book"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm({ type: 'book', id: book.id, title: book.title })}
                              className="p-2 text-[#38b36c] hover:text-[#2e8c55] hover:bg-[#e6f4ec] rounded-lg transition-colors duration-200"
                              title="Delete book"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bulk Delete Confirm Dialog */}
              {showBulkDeleteConfirm && showBulkDeleteConfirm.type === 'book' && (
                <ConfirmDialog
                  isOpen={true}
                  title="Delete Selected Books"
                  message={`Are you sure you want to delete ${showBulkDeleteConfirm.count} selected book(s)? This action cannot be undone.`}
                  isLoading={isBulkDeleting}
                  onClose={() => setShowBulkDeleteConfirm(null)}
                  onConfirm={handleBulkDeleteBooks}
                />
              )}
            </div>
            {booksTotalPages > 1 && (
              <Pagination
                currentPage={booksPage}
                totalPages={booksTotalPages}
                onPageChange={handleBooksPageChange}
              />
            )}
          </div>
        )}

        {/* Papers Management Tab */}
        {activeTab === 'papers' && (
          <div className="space-y-6">
            {/* Add/Edit Paper Form */}

            {/* Papers List */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 flex-wrap">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Papers Management</h2>
                  <p className="text-gray-600 mt-1">Manage your research papers collection</p>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-center w-full sm:w-auto">
                  <form onSubmit={handlePaperSearch} className="flex w-full sm:w-auto flex-1 min-w-[220px] gap-2">
                    <input
                      type="search"
                      placeholder="Search papers by title, author, abstract, keywords, ISSN, or DOI..."
                      value={paperSearch}
                      onChange={e => setPaperSearch(e.target.value)}
                      className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[#38b36c] focus:border-[#38b36c]"
                    />
                    <button
                      type="submit"
                      className="bg-[#38b36c] text-white px-4 py-2 rounded-md hover:bg-[#2e8c55] focus:outline-none focus:ring-2 focus:ring-[#38b36c]"
                    >
                      Search
                    </button>
                  </form>
                  <button
                    onClick={() => {
                      setEditingPaper(null);
                      setShowPaperForm(true);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-[#38b36c] text-white text-sm font-medium rounded-lg hover:bg-[#2e8c55] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38b36c] transition-colors duration-200"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Paper
                  </button>
                  {selectedPapers.length > 0 && (
                    <button
                      onClick={() => setShowBulkDeleteConfirm({ type: 'paper', count: selectedPapers.length })}
                      className="inline-flex items-center px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                      disabled={isBulkDeleting}
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedPapers.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Table header for checkboxes */}
              {papers.length > 0 && (
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={selectedPapers.length === papers.length}
                    onChange={e => handleSelectAllPapers(e.target.checked)}
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-[#38b36c] focus:ring-[#38b36c]"
                  />
                  <span className="text-sm text-gray-700">Select All</span>
                </div>
              )}

              {isLoading ? (
                <div className="grid gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : papers.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No papers found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {paperSearch ? 'Try adjusting your search terms.' : 'Get started by adding your first research paper.'}
                  </p>
                  {!paperSearch && (
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          setEditingPaper(null);
                          setShowPaperForm(true);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#38b36c] hover:bg-[#2e8c55]"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Paper
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid gap-4">
                  {papers.map((paper) => (
                    <div key={paper.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200 flex items-start">
                      <input
                        type="checkbox"
                        checked={selectedPapers.includes(paper.id)}
                        onChange={e => handleSelectPaper(paper.id, e.target.checked)}
                        className="mr-4 mt-2 h-4 w-4 rounded border-gray-300 text-[#38b36c] focus:ring-[#38b36c]"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start space-x-4">
                              <div className="flex-shrink-0 w-16 h-20 bg-gradient-to-br from-[#e6f4ec] to-[#b2e5c7] rounded-lg flex items-center justify-center">
                                <DocumentTextIcon className="h-8 w-8 text-[#38b36c]" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  <Link
                                    href={`/papers/${paper.id}`}
                                    className="text-gray-900 hover:text-[#4cae8a] hover:underline transition-colors duration-200"
                                  >
                                    {paper.title}
                                  </Link>
                                </h3>
                                <div className="text-sm text-gray-600 mb-2">
                                  by {paper.authors && paper.authors.length > 0 ? (
                                    paper.authors.map((author, index) => (
                                      <React.Fragment key={author.id}>
                                        <Link
                                          href={`/authors/${encodeURIComponent(author.author_name)}`}
                                          className="text-[#4cae8a] hover:text-[#357a5b] hover:underline"
                                        >
                                          {author.author_name}
                                        </Link>
                                        {index < paper.authors!.length - 1 && <span>, </span>}
                                      </React.Fragment>
                                    ))
                                  ) : (
                                    <Link
                                      href={`/authors/${encodeURIComponent(paper.author)}`}
                                      className="text-[#4cae8a] hover:text-[#357a5b] hover:underline"
                                    >
                                      {paper.author}
                                    </Link>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                  {paper.university && (
                                    <span className="px-2 py-1 bg-[#e6f4ec] text-[#2e8c55] rounded-full">
                                      {paper.university}
                                    </span>
                                  )}
                                  {paper.department && (
                                    <span className="px-2 py-1 bg-[#e6f4ec] text-[#2e8c55] rounded-full">
                                      {paper.department}
                                    </span>
                                  )}
                                  {paper.year && (
                                    <span className="px-2 py-1 bg-[#e6f4ec] text-[#2e8c55] rounded-full">
                                      {paper.year}
                                    </span>
                                  )}
                                  {paper.advisor && (
                                    <span className="px-2 py-1 bg-[#e6f4ec] text-[#2e8c55] rounded-full">
                                      Advisor: {paper.advisor}
                                    </span>
                                  )}
                                  {paper.file_url && (
                                    <span className="px-2 py-1 bg-[#e6f4ec] text-[#2e8c55] rounded-full">
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
                              className="p-2 text-[#38b36c] hover:text-[#2e8c55] hover:bg-[#e6f4ec] rounded-lg transition-colors duration-200"
                              title="Edit paper"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm({ type: 'paper', id: paper.id, title: paper.title })}
                              className="p-2 text-[#38b36c] hover:text-[#2e8c55] hover:bg-[#e6f4ec] rounded-lg transition-colors duration-200"
                              title="Delete paper"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bulk Delete Confirm Dialog */}
              {showBulkDeleteConfirm && showBulkDeleteConfirm.type === 'paper' && (
                <ConfirmDialog
                  isOpen={true}
                  title="Delete Selected Papers"
                  message={`Are you sure you want to delete ${showBulkDeleteConfirm.count} selected paper(s)? This action cannot be undone.`}
                  isLoading={isBulkDeleting}
                  onClose={() => setShowBulkDeleteConfirm(null)}
                  onConfirm={handleBulkDeletePapers}
                />
              )}
            </div>
            {papersTotalPages > 1 && (
              <Pagination
                currentPage={papersPage}
                totalPages={papersTotalPages}
                onPageChange={handlePapersPageChange}
              />
            )}
          </div>
        )}

        {/* Users Management Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 flex-wrap">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Users Management</h2>
                  <p className="text-gray-600 mt-1">Manage system users and their roles</p>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-center w-full sm:w-auto">
                  <form onSubmit={handleUserSearch} className="relative w-full sm:w-auto flex-1 min-w-[220px]">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#38b36c] focus:border-transparent w-full"
                    />
                  </form>
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-[#38b36c] text-white text-sm font-medium rounded-lg hover:bg-[#2e8c55] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38b36c] transition-colors duration-200"
                  >
                    Add User
                  </button>
                  {selectedUsers.length > 0 && (
                    <button
                      onClick={() => setShowBulkDeleteConfirm({ type: 'user', count: selectedUsers.length })}
                      className="inline-flex items-center px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                      disabled={isBulkDeleting}
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedUsers.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Table header for checkboxes */}
              {filteredUsers.length > 0 && (
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length}
                    onChange={e => handleSelectAllUsers(e.target.checked)}
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-[#38b36c] focus:ring-[#38b36c]"
                  />
                  <span className="text-sm text-gray-700">Select All</span>
                </div>
              )}

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {userSearch ? 'Try adjusting your search terms.' : 'No users match the current criteria.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200 flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={e => handleSelectUser(user.id, e.target.checked)}
                        className="mr-4 h-4 w-4 rounded border-gray-300 text-[#38b36c] focus:ring-[#38b36c]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 bg-gradient-to-br from-[#e6f4ec] to-[#b2e5c7] rounded-full flex items-center justify-center">
                              <span className="text-lg font-semibold text-[#38b36c]">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  <Link href={`/users/${user.id}`} className="text-[#38b36c] hover:underline">{user.name}</Link>
                                </h3>
                                <p className="text-sm text-gray-600">{user.email}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {user.user_type === 'student' ? 'NIM' : 'NIDN'}: {user.nim_nidn}
                                </p>
                                <p className="text-xs text-gray-500">Faculty: {user.faculty}</p>
                              </div>
                              <div className="flex flex-col items-end space-y-2">
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                  </span>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.user_type === 'lecturer' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {!user.is_approved && (
                                    <button
                                      onClick={() => approveUser(user.id)}
                                      className="text-xs text-green-600 hover:text-green-800"
                                    >
                                      Approve
                                    </button>
                                  )}
                                  <button
                                    onClick={() => updateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    {user.role === 'admin' ? 'Demote' : 'Promote'}
                                  </button>
                                  <button
                                    onClick={() => startEditUser(user)}
                                    className="p-1 text-[#38b36c] hover:text-[#2e8c55] hover:bg-[#e6f4ec] rounded-lg transition-colors duration-200"
                                    title="Edit user"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteUserConfirm({ id: user.id, name: user.name })}
                                    className="p-1 text-[#38b36c] hover:text-[#2e8c55] hover:bg-[#e6f4ec] rounded-lg transition-colors duration-200"
                                    title="Delete user"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                                <span className="text-xs text-gray-500">
                                  Joined: {new Date(user.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bulk Delete Confirm Dialog */}
              {showBulkDeleteConfirm && showBulkDeleteConfirm.type === 'user' && (
                <ConfirmDialog
                  isOpen={true}
                  title="Delete Selected Users"
                  message={`Are you sure you want to delete ${showBulkDeleteConfirm.count} selected user(s)? This action cannot be undone.`}
                  isLoading={isBulkDeleting}
                  onClose={() => setShowBulkDeleteConfirm(null)}
                  onConfirm={handleBulkDeleteUsers}
                />
              )}
            </div>
            {usersTotalPages > 1 && (
              <Pagination
                currentPage={usersPage}
                totalPages={usersTotalPages}
                onPageChange={handleUsersPageChange}
              />
            )}
            {/* Edit User Modal */}
            {showUserForm && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
                      <button
                        onClick={() => { setShowUserForm(false); setEditingUser(null); }}
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                    <form onSubmit={handleUserSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#38b36c] focus:border-[#38b36c] sm:text-sm"
                          value={userFormData.name || ''}
                          onChange={e => setUserFormData({ ...userFormData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#38b36c] focus:border-[#38b36c] sm:text-sm"
                          value={userFormData.email || ''}
                          onChange={e => setUserFormData({ ...userFormData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#38b36c] focus:border-[#38b36c] sm:text-sm"
                          value={userFormData.role || 'user'}
                          onChange={e => setUserFormData({ ...userFormData, role: e.target.value as 'admin' | 'user' })}
                          required
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Occupation</label>
                        <select
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#38b36c] focus:border-[#38b36c] sm:text-sm"
                          value={userFormData.user_type || 'student'}
                          onChange={e => setUserFormData({ ...userFormData, user_type: e.target.value as 'student' | 'lecturer' })}
                          required
                        >
                          <option value="student">Student</option>
                          <option value="lecturer">Lecturer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Faculty</label>
                        <select
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#38b36c] focus:border-[#38b36c] sm:text-sm"
                          value={userFormData.faculty || ''}
                          onChange={e => setUserFormData({ ...userFormData, faculty: e.target.value })}
                          required
                        >
                          <option value="">Select Faculty</option>
                          <option value="Fakultas Ekonomi">Fakultas Ekonomi</option>
                          <option value="Fakultas Ilmu Komputer">Fakultas Ilmu Komputer</option>
                          <option value="Fakultas Hukum">Fakultas Hukum</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Department</label>
                        <select
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#38b36c] focus:border-[#38b36c] sm:text-sm"
                          value={userFormData.department_id || ''}
                          onChange={e => setUserFormData({ ...userFormData, department_id: Number(e.target.value) })}
                          required
                          disabled={isLoadingDepartments || departments.length === 0}
                        >
                          {isLoadingDepartments ? (
                            <option>Loading...</option>
                          ) : departments.length === 0 ? (
                            <option value="">No departments found</option>
                          ) : (
                            departments.map(dep => (
                              <option key={dep.id} value={dep.id}>{dep.name}</option>
                            ))
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">NIM/NIDN</label>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#38b36c] focus:border-[#38b36c] sm:text-sm"
                          value={userFormData.nim_nidn || ''}
                          onChange={e => setUserFormData({ ...userFormData, nim_nidn: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <textarea
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#38b36c] focus:border-[#38b36c] sm:text-sm"
                          rows={3}
                          value={userFormData.address || ''}
                          onChange={e => setUserFormData({ ...userFormData, address: e.target.value })}
                          placeholder="Enter user address..."
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {userFormData.user_type === 'student'
                          ? 'NIM must be at least 7 digits.'
                          : 'NIDN must be at least 10 digits.'}
                      </p>
                      <div className="flex items-center">
                        <input
                          id="is_approved"
                          type="checkbox"
                          checked={!!userFormData.is_approved}
                          onChange={e => setUserFormData({ ...userFormData, is_approved: e.target.checked })}
                          className="h-4 w-4 text-[#38b36c] border-gray-300 rounded focus:ring-[#38b36c]"
                        />
                        <label htmlFor="is_approved" className="ml-2 block text-sm text-gray-700">
                          Approved
                        </label>
                      </div>
                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => { setShowUserForm(false); setEditingUser(null); }}
                          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 bg-[#38b36c] text-white rounded-lg hover:bg-[#2e8c55] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38b36c] flex items-center"
                          disabled={isUserSubmitting}
                        >
                          {isUserSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
            {/* Delete User Confirmation Modal */}
            {showDeleteUserConfirm && (
              <ConfirmDialog
                isOpen={true}
                title="Delete User"
                message={`Are you sure you want to delete user '${showDeleteUserConfirm ? showDeleteUserConfirm.name : ''}'? This action cannot be undone.`}
                isLoading={isBulkDeleting}
                onClose={() => setShowDeleteUserConfirm(null)}
                onConfirm={() => showDeleteUserConfirm && handleDeleteUser(showDeleteUserConfirm.id)}
              />
            )}
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

        {/* Add User Modal - move this here, inside the main div */}
        {showAddUserModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Add New User</h3>
                  <button
                    onClick={() => setShowAddUserModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleAddUserSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#38b36c] focus:border-[#38b36c] sm:text-sm"
                      value={addUserForm.name}
                      onChange={handleAddUserChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#38b36c] focus:border-[#38b36c] sm:text-sm"
                      value={addUserForm.email}
                      onChange={handleAddUserChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#38b36c] focus:border-[#38b36c] sm:text-sm"
                      value={addUserForm.password}
                      onChange={handleAddUserChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#38b36c] focus:border-[#38b36c] sm:text-sm"
                      value={addUserForm.role}
                      onChange={handleAddUserChange}
                      required
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Occupation <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="user_type"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#38b36c] focus:border-[#38b36c] sm:text-sm"
                      value={addUserForm.user_type}
                      onChange={handleAddUserChange}
                      required
                    >
                      <option value="student">Student</option>
                      <option value="lecturer">Lecturer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      NIM/NIDN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nim_nidn"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#38b36c] focus:border-[#38b36c] sm:text-sm"
                      value={addUserForm.nim_nidn}
                      onChange={handleAddUserChange}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {addUserForm.user_type === 'student'
                        ? 'NIM must be at least 7 digits.'
                        : 'NIDN must be at least 10 digits.'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Faculty <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="faculty"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#38b36c] focus:border-[#38b36c] sm:text-sm"
                      value={addUserForm.faculty}
                      onChange={handleAddUserChange}
                      required
                    >
                      <option value="Fakultas Ekonomi">Fakultas Ekonomi</option>
                      <option value="Fakultas Ilmu Komputer">Fakultas Ilmu Komputer</option>
                      <option value="Fakultas Hukum">Fakultas Hukum</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="department_id"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#38b36c] focus:border-[#38b36c] sm:text-sm"
                      value={addUserForm.department_id}
                      onChange={handleAddUserChange}
                      required
                      disabled={isLoadingDepartments || departments.length === 0}
                    >
                      {isLoadingDepartments ? (
                        <option>Loading...</option>
                      ) : departments.length === 0 ? (
                        <option value="">No departments found</option>
                      ) : (
                        departments.map(dep => (
                          <option key={dep.id} value={dep.id}>{dep.name}</option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#38b36c] text-white rounded-lg hover:bg-[#2e8c55] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38b36c] flex items-center"
                      disabled={isAddUserSubmitting}
                    >
                      {isAddUserSubmitting ? 'Adding...' : 'Add User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Book Form Modal */}
        {showBookForm && (
          <BookForm
            editingBook={editingBook}
            onClose={() => {
              setShowBookForm(false);
              setEditingBook(null);
            }}
            onSuccess={handleBookSuccess}
            isAdmin={true}
          />
        )}

        {/* Paper Form Modal */}
        {showPaperForm && (
          <PaperForm
            editingPaper={editingPaper}
            onClose={() => {
              setShowPaperForm(false);
              setEditingPaper(null);
            }}
            onSuccess={handlePaperSuccess}
            isAdmin={true}
          />
        )}

        {/* Lecturer Approval Tab */}
        {activeTab === 'lecturer-approval' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Lecturer Approval</h2>
                  <p className="text-gray-600 mt-1">Review and approve pending lecturer registrations</p>
                </div>
              </div>
              <LecturerApproval />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 