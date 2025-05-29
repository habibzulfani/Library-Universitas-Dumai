'use client';

import { useState, useEffect, useCallback } from 'react';
import { booksAPI, papersAPI, Book, Paper } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'books' | 'papers'>('overview');
  const [books, setBooks] = useState<Book[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBookForm, setShowBookForm] = useState(false);
  const [showPaperForm, setShowPaperForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [bookFormData, setBookFormData] = useState({
    title: '',
    author: '',
    publisher: '',
    published_year: '',
    isbn: '',
    subject: '',
    language: 'English',
    pages: '',
    summary: '',
    file: null as File | null,
  });
  const [paperFormData, setPaperFormData] = useState({
    title: '',
    author: '',
    advisor: '',
    university: '',
    department: '',
    year: '',
    abstract: '',
    keywords: '',
    file: null as File | null,
  });

  const fetchUserBooks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getUserBooks();
      setBooks(response.data.data);
    } catch {
      toast.error('Failed to fetch your books');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserPapers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await papersAPI.getUserPapers();
      setPapers(response.data.data);
    } catch {
      toast.error('Failed to fetch your papers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserBooks();
    fetchUserPapers();
  }, [fetchUserBooks, fetchUserPapers]);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', bookFormData.title);
    formData.append('author', bookFormData.author);
    if (bookFormData.publisher) formData.append('publisher', bookFormData.publisher);
    if (bookFormData.published_year) formData.append('published_year', bookFormData.published_year);
    if (bookFormData.isbn) formData.append('isbn', bookFormData.isbn);
    if (bookFormData.subject) formData.append('subject', bookFormData.subject);
    if (bookFormData.language) formData.append('language', bookFormData.language);
    if (bookFormData.pages) formData.append('pages', bookFormData.pages);
    if (bookFormData.summary) formData.append('summary', bookFormData.summary);
    if (bookFormData.file) formData.append('file', bookFormData.file);

    try {
      if (editingBook) {
        await booksAPI.updateUserBook(editingBook.id, formData);
        toast.success('Book updated successfully!');
      } else {
        await booksAPI.createUserBook(formData);
        toast.success('Book created successfully!');
      }
      
      setShowBookForm(false);
      setEditingBook(null);
      setBookFormData({
        title: '',
        author: '',
        publisher: '',
        published_year: '',
        isbn: '',
        subject: '',
        language: 'English',
        pages: '',
        summary: '',
        file: null,
      });
      fetchUserBooks();
    } catch {
      toast.error(editingBook ? 'Failed to update book' : 'Failed to create book');
    }
  };

  const handlePaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', paperFormData.title);
    formData.append('author', paperFormData.author);
    if (paperFormData.advisor) formData.append('advisor', paperFormData.advisor);
    if (paperFormData.university) formData.append('university', paperFormData.university);
    if (paperFormData.department) formData.append('department', paperFormData.department);
    if (paperFormData.year) formData.append('year', paperFormData.year);
    if (paperFormData.abstract) formData.append('abstract', paperFormData.abstract);
    if (paperFormData.keywords) formData.append('keywords', paperFormData.keywords);
    if (paperFormData.file) formData.append('file', paperFormData.file);

    try {
      if (editingPaper) {
        await papersAPI.updateUserPaper(editingPaper.id, formData);
        toast.success('Paper updated successfully!');
      } else {
        await papersAPI.createUserPaper(formData);
        toast.success('Paper created successfully!');
      }
      
      setShowPaperForm(false);
      setEditingPaper(null);
      setPaperFormData({
        title: '',
        author: '',
        advisor: '',
        university: '',
        department: '',
        year: '',
        abstract: '',
        keywords: '',
        file: null,
      });
      fetchUserPapers();
    } catch {
      toast.error(editingPaper ? 'Failed to update paper' : 'Failed to create paper');
    }
  };

  const handleDeleteBook = async (id: number) => {
    if (confirm('Are you sure you want to delete this book?')) {
      try {
        await booksAPI.deleteUserBook(id);
        toast.success('Book deleted successfully!');
        fetchUserBooks();
      } catch {
        toast.error('Failed to delete book');
      }
    }
  };

  const handleDeletePaper = async (id: number) => {
    if (confirm('Are you sure you want to delete this paper?')) {
      try {
        await papersAPI.deleteUserPaper(id);
        toast.success('Paper deleted successfully!');
        fetchUserPapers();
      } catch {
        toast.error('Failed to delete paper');
      }
    }
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setBookFormData({
      title: book.title,
      author: book.author,
      publisher: book.publisher || '',
      published_year: book.published_year?.toString() || '',
      isbn: book.isbn || '',
      subject: book.subject || '',
      language: book.language || 'English',
      pages: book.pages?.toString() || '',
      summary: book.summary || '',
      file: null,
    });
    setShowBookForm(true);
  };

  const handleEditPaper = (paper: Paper) => {
    setEditingPaper(paper);
    setPaperFormData({
      title: paper.title,
      author: paper.author,
      advisor: paper.advisor || '',
      university: paper.university || '',
      department: paper.department || '',
      year: paper.year?.toString() || '',
      abstract: paper.abstract || '',
      keywords: paper.keywords || '',
      file: null,
    });
    setShowPaperForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
              <p className="text-gray-600">Manage your books and papers</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'books', name: 'My Books', icon: '📚' },
              { id: 'papers', name: 'My Papers', icon: '📄' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'books' | 'papers')}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">📚</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">My Books</dt>
                    <dd className="text-lg font-medium text-gray-900">{books.length}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">📄</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">My Papers</dt>
                    <dd className="text-lg font-medium text-gray-900">{papers.length}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">📁</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Content</dt>
                    <dd className="text-lg font-medium text-gray-900">{books.length + papers.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'books' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Books</h2>
              <button
                onClick={() => {
                  setShowBookForm(true);
                  setEditingBook(null);
                  setBookFormData({
                    title: '',
                    author: '',
                    publisher: '',
                    published_year: '',
                    isbn: '',
                    subject: '',
                    language: 'English',
                    pages: '',
                    summary: '',
                    file: null,
                  });
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add New Book
              </button>
            </div>

            {showBookForm && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-medium mb-4">
                  {editingBook ? 'Edit Book' : 'Add New Book'}
                </h3>
                <form onSubmit={handleBookSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={bookFormData.title}
                      onChange={(e) => setBookFormData({ ...bookFormData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Author *
                    </label>
                    <input
                      type="text"
                      required
                      value={bookFormData.author}
                      onChange={(e) => setBookFormData({ ...bookFormData, author: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Publisher
                    </label>
                    <input
                      type="text"
                      value={bookFormData.publisher}
                      onChange={(e) => setBookFormData({ ...bookFormData, publisher: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Published Year
                    </label>
                    <input
                      type="number"
                      value={bookFormData.published_year}
                      onChange={(e) => setBookFormData({ ...bookFormData, published_year: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ISBN
                    </label>
                    <input
                      type="text"
                      value={bookFormData.isbn}
                      onChange={(e) => setBookFormData({ ...bookFormData, isbn: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={bookFormData.subject}
                      onChange={(e) => setBookFormData({ ...bookFormData, subject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <select
                      value={bookFormData.language}
                      onChange={(e) => setBookFormData({ ...bookFormData, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="English">English</option>
                      <option value="Indonesian">Indonesian</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pages
                    </label>
                    <input
                      type="number"
                      value={bookFormData.pages}
                      onChange={(e) => setBookFormData({ ...bookFormData, pages: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Summary
                    </label>
                    <textarea
                      rows={3}
                      value={bookFormData.summary}
                      onChange={(e) => setBookFormData({ ...bookFormData, summary: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File (PDF, DOC, DOCX - Max 32MB)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setBookFormData({ ...bookFormData, file: e.target.files?.[0] || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2 flex space-x-4">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      {editingBook ? 'Update Book' : 'Create Book'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBookForm(false);
                        setEditingBook(null);
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book) => (
                <div key={book.id} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{book.title}</h3>
                  <p className="text-gray-600 mb-2">by {book.author}</p>
                  {book.publisher && <p className="text-sm text-gray-500 mb-2">{book.publisher}</p>}
                  {book.published_year && <p className="text-sm text-gray-500 mb-2">Year: {book.published_year}</p>}
                  {book.subject && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                      {book.subject}
                    </span>
                  )}
                  {book.file_url && (
                    <p className="text-sm text-green-600 mb-2">📎 File attached</p>
                  )}
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() => handleEditBook(book)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBook(book.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {books.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500">You haven&apos;t created any books yet.</p>
                <button
                  onClick={() => setShowBookForm(true)}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Create Your First Book
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'papers' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Papers</h2>
              <button
                onClick={() => {
                  setShowPaperForm(true);
                  setEditingPaper(null);
                  setPaperFormData({
                    title: '',
                    author: '',
                    advisor: '',
                    university: '',
                    department: '',
                    year: '',
                    abstract: '',
                    keywords: '',
                    file: null,
                  });
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Add New Paper
              </button>
            </div>

            {showPaperForm && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-medium mb-4">
                  {editingPaper ? 'Edit Paper' : 'Add New Paper'}
                </h3>
                <form onSubmit={handlePaperSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={paperFormData.title}
                      onChange={(e) => setPaperFormData({ ...paperFormData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Author *
                    </label>
                    <input
                      type="text"
                      required
                      value={paperFormData.author}
                      onChange={(e) => setPaperFormData({ ...paperFormData, author: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Advisor
                    </label>
                    <input
                      type="text"
                      value={paperFormData.advisor}
                      onChange={(e) => setPaperFormData({ ...paperFormData, advisor: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      University
                    </label>
                    <input
                      type="text"
                      value={paperFormData.university}
                      onChange={(e) => setPaperFormData({ ...paperFormData, university: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={paperFormData.department}
                      onChange={(e) => setPaperFormData({ ...paperFormData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <input
                      type="number"
                      value={paperFormData.year}
                      onChange={(e) => setPaperFormData({ ...paperFormData, year: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Abstract
                    </label>
                    <textarea
                      rows={4}
                      value={paperFormData.abstract}
                      onChange={(e) => setPaperFormData({ ...paperFormData, abstract: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Keywords (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={paperFormData.keywords}
                      onChange={(e) => setPaperFormData({ ...paperFormData, keywords: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., machine learning, artificial intelligence, data science"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File (PDF, DOC, DOCX - Max 32MB)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setPaperFormData({ ...paperFormData, file: e.target.files?.[0] || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="md:col-span-2 flex space-x-4">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      {editingPaper ? 'Update Paper' : 'Create Paper'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPaperForm(false);
                        setEditingPaper(null);
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {papers.map((paper) => (
                <div key={paper.id} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{paper.title}</h3>
                  <p className="text-gray-600 mb-2">by {paper.author}</p>
                  {paper.university && <p className="text-sm text-gray-500 mb-1">{paper.university}</p>}
                  {paper.department && <p className="text-sm text-gray-500 mb-1">{paper.department}</p>}
                  {paper.year && <p className="text-sm text-gray-500 mb-2">Year: {paper.year}</p>}
                  {paper.keywords && (
                    <div className="mb-2">
                      {paper.keywords.split(',').slice(0, 3).map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-1 mb-1"
                        >
                          {keyword.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  {paper.file_url && (
                    <p className="text-sm text-green-600 mb-2">📎 File attached</p>
                  )}
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() => handleEditPaper(paper)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePaper(paper.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {papers.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500">You haven&apos;t created any papers yet.</p>
                <button
                  onClick={() => setShowPaperForm(true)}
                  className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Create Your First Paper
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 