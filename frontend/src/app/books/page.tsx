'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, BookOpenIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { booksAPI, Book, SearchParams } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import BookForm from '@/components/forms/BookForm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SearchBar from '@/components/ui/SearchBar';
import Pagination from '@/components/ui/Pagination';

export default function BooksPage() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [showBookForm, setShowBookForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: number; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBooks = useCallback(async (params: SearchParams = {}) => {
    try {
      setLoading(true);
      const response = await booksAPI.getBooks({
        query: searchQuery,
        page: currentPage,
        limit: 12,
        ...params,
      });
      setBooks(response.data.data);
      setTotalPages(response.data.total_pages);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    // Do not call fetchBooks here; useEffect will handle it
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBook = async (id: number) => {
    const book = books.find(b => b.id === id);
    if (book) {
      setShowDeleteConfirm({ id, title: book.title });
    }
  };

  const confirmDeleteBook = async () => {
    if (!showDeleteConfirm) return;

    setIsDeleting(true);
    try {
      if (user?.role === 'admin') {
        await booksAPI.deleteBook(showDeleteConfirm.id);
      } else {
        await booksAPI.deleteUserBook(showDeleteConfirm.id);
      }
      setBooks(books.filter(book => book.id !== showDeleteConfirm.id));
      toast.success('Book deleted successfully');
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error('Failed to delete book');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(null);
    }
  };

  const handleEditBook = async (book: Book) => {
    try {
      // Fetch the full book data including authors
      const response = await booksAPI.getBook(book.id);
      const fullBook = response;
      setEditingBook(fullBook);
      setShowBookForm(true);
    } catch (error: any) {
      console.error('Error loading book details:', error);
      toast.error('Failed to load book details');
    }
  };

  const handleBookSuccess = () => {
    setShowBookForm(false);
    setEditingBook(null);
    fetchBooks();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Books</h1>
              <p className="text-gray-600">Discover academic books and resources</p>
            </div>
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  setShowBookForm(true);
                  setEditingBook(null);
                }}
                className="bg-[#38b36c] text-white px-4 py-2 rounded-md hover:bg-[#2e8c55]"
              >
                Add New Book
              </button>
            )}
          </div>
        </div>

        {/* Book Form Modal */}
        {showBookForm && (
          <BookForm
            editingBook={editingBook}
            onClose={() => {
              setShowBookForm(false);
              setEditingBook(null);
            }}
            onSuccess={handleBookSuccess}
            isAdmin={user?.role === 'admin'}
          />
        )}

        {/* Search */}
        <div className="mb-8">
          <SearchBar
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onSubmit={handleSearch}
            placeholder="Search books by title, author, subject, or DOI..."
            buttonLabel="Search"
            className="max-w-2xl"
          />
        </div>

        {/* Results count */}
        {!loading && (
          <div className="mb-6">
            <p className="text-gray-600">
              {total === 0 ? 'No books found' : `Showing ${total} book${total !== 1 ? 's' : ''}`}
            </p>
          </div>
        )}

        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No books found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search terms or browse all books.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(books || []).map((book) => (
              <div key={book.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 line-clamp-2">
                    {book.title}
                  </h3>
                  <div className="text-gray-600 mb-2">
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
                  {book.publisher && (
                    <p className="text-sm text-gray-500 mb-2">{book.publisher}</p>
                  )}
                  {book.published_year && (
                    <p className="text-sm text-gray-500 mb-2">Year: {book.published_year}</p>
                  )}
                  {book.isbn && (
                    <p className="text-sm text-gray-500 mb-2">ISBN: {book.isbn}</p>
                  )}
                  {book.language && (
                    <p className="text-sm text-gray-500 mb-2">Language: {book.language}</p>
                  )}
                  {book.pages && (
                    <p className="text-sm text-gray-500 mb-2">Pages: {book.pages}</p>
                  )}
                  {book.subject && (
                    <span className="inline-block bg-[#e6f4ec] text-[#2e8c55] text-xs px-2 py-1 rounded-full mb-2">
                      {book.subject}
                    </span>
                  )}
                  {book.summary && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                      {book.summary}
                    </p>
                  )}
                  {book.file_url && (
                    <p className="text-sm text-green-600 mb-4">📎 File attached</p>
                  )}
                  <div className="flex justify-between items-center mt-4">
                    <Link
                      href={`/books/${book.id}`}
                      className="inline-block bg-[#38b36c] text-white px-4 py-2 rounded hover:bg-[#2e8c55] transition-colors border-2 border-[#38b36c] hover:border-[#2e8c55] hover:shadow-md"
                    >
                      View Details
                    </Link>
                    {user?.role === 'admin' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditBook(book)}
                          className="p-2 text-[#38b36c] hover:text-[#2e8c55] hover:bg-[#e6f4ec] rounded-lg transition-colors duration-200"
                          title="Edit book"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book.id)}
                          className="p-2 text-[#38b36c] hover:text-[#2e8c55] hover:bg-[#e6f4ec] rounded-lg transition-colors duration-200"
                          title="Delete book"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={!!showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={confirmDeleteBook}
          title="Delete Book"
          message={`Are you sure you want to delete "${showDeleteConfirm?.title}"? This action cannot be undone.`}
          confirmText="Delete Book"
          cancelText="Cancel"
          type="danger"
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
} 