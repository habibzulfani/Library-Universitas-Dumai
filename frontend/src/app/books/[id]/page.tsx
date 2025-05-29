'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { 
  BookOpenIcon, 
  CalendarIcon, 
  UserIcon, 
  DocumentArrowDownIcon,
  ArrowLeftIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { booksAPI } from '@/lib/api';

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  published_year: number;
  pages: number;
  language: string;
  summary: string;
  file_url?: string;
  cover_image?: string;
  subject: string;
  categories: Array<{
    id: number;
    name: string;
    description: string;
    type: string;
  }>;
  authors: Array<{
    id: number;
    author_name: string;
  }>;
  created_at: string;
  updated_at: string;
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const bookId = params?.id as string;

  useEffect(() => {
    const fetchBook = async () => {
      if (!bookId) return;
      
      setIsLoading(true);
      try {
        const response = await api.get(`/books/${bookId}`);
        setBook(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching book:', err);
        setError('Failed to load book details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [bookId]);

  const handleDownload = async () => {
    if (!book?.file_url || !isAuthenticated) return;
    
    setIsDownloading(true);
    try {
      await booksAPI.downloadBook(book.id, book.title, book.file_url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Book Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The book you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push('/books')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Books
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/books')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Books
          </button>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
            {/* Book Cover */}
            <div className="lg:col-span-4">
              <div className="aspect-w-3 aspect-h-4 bg-gray-200 overflow-hidden">
                {book.cover_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.cover_image}
                    alt={book.title}
                    className="w-full h-full object-center object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-96 bg-gray-100">
                    <BookOpenIcon className="h-24 w-24 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Book Details */}
            <div className="lg:col-span-8 p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    <span>{book.author}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    <span>{book.published_year}</span>
                  </div>
                  {book.subject && (
                    <div className="flex items-center">
                      <TagIcon className="h-4 w-4 mr-1" />
                      <span>{book.subject}</span>
                    </div>
                  )}
                </div>
                
                {/* Download Button */}
                {isAuthenticated && book.file_url && (
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    {isDownloading ? 'Downloading...' : 'Download Book'}
                  </button>
                )}

                {!isAuthenticated && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <p className="text-sm text-yellow-800">
                      Please <span className="font-medium">sign in</span> to download this book.
                    </p>
                  </div>
                )}
              </div>

              {/* Book Information */}
              <div className="space-y-6">
                {book.summary && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Summary</h3>
                    <p className="text-gray-700 leading-relaxed">{book.summary}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Details</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">ISBN</dt>
                      <dd className="mt-1 text-sm text-gray-900">{book.isbn || 'Not available'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Publisher</dt>
                      <dd className="mt-1 text-sm text-gray-900">{book.publisher || 'Not available'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Pages</dt>
                      <dd className="mt-1 text-sm text-gray-900">{book.pages || 'Not available'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Language</dt>
                      <dd className="mt-1 text-sm text-gray-900">{book.language || 'Not available'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Publication Year</dt>
                      <dd className="mt-1 text-sm text-gray-900">{book.published_year}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Subject</dt>
                      <dd className="mt-1 text-sm text-gray-900">{book.subject || 'Not available'}</dd>
                    </div>
                  </dl>
                </div>

                {/* Authors */}
                {book.authors && book.authors.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Authors</h3>
                    <div className="flex flex-wrap gap-2">
                      {book.authors.map((author, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {author.author_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories */}
                {book.categories && book.categories.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {book.categories.map((category, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Added to Repository</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(book.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 