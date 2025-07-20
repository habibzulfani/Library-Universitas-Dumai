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
  TagIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { booksAPI } from '@/lib/api';
import { generateBookCitation } from '@/lib/citation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface Book {
  id: number;
  title: string;
  author: string;
  authors?: Array<{
    id: number;
    author_name: string;
  }>;
  publisher?: string;
  published_year?: number;
  isbn?: string;
  subject?: string;
  language?: string;
  pages?: string;
  summary?: string;
  file_url?: string;
  cover_image_url?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  categories?: Array<{
    id: number;
    name: string;
    description?: string;
    type: string;
  }>;
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [citationFormat, setCitationFormat] = useState<'apa' | 'mla' | 'chicago'>('apa');
  const [citation, setCitation] = useState('');
  // Add state for creator info
  const [creator, setCreator] = useState<any>(null);
  const [citationCount, setCitationCount] = useState<number>(0);

  const bookId = params?.id as string;
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  useEffect(() => {
    const fetchBook = async () => {
      if (!bookId) return;

      setIsLoading(true);
      try {
        const response = await booksAPI.getBook(parseInt(bookId));
        setBook(response);
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

  useEffect(() => {
    if (book && book.created_by) {
      // Fetch user info for creator
      fetch(`${API_BASE_URL}/api/v1/users/${book.created_by}`)
        .then(res => res.json())
        .then(data => setCreator(data))
        .catch(() => setCreator(null));
    }
  }, [book]);

  useEffect(() => {
    if (book) {
      // Fetch citation count
      fetch(`${API_BASE_URL}/api/v1/books/${book.id}`)
        .then(res => res.json())
        .then(data => setCitationCount(data.citation_count || 0))
        .catch(() => setCitationCount(0));
    }
  }, [book]);

  const handleDownload = async () => {
    if (!book?.file_url) return;

    setIsDownloading(true);
    try {
      await booksAPI.downloadBookPublic(book.id, book.title, book.file_url);
      toast.success('Book downloaded successfully!');
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Failed to download book');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCite = async () => {
    if (!book) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/books/${book.id}/cite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        toast.error('Failed to log citation.');
        return;
      }
      setCitationCount(citationCount + 1);
      const citation = generateBookCitation({
        title: book.title,
        authors: book.authors ? book.authors : undefined,
        author: book.author,
        published_year: book.published_year,
        publisher: book.publisher,
        isbn: book.isbn,
      }, citationFormat);
      setCitation(citation);
      setShowCitationModal(true);
      toast.success('Citation generated successfully!');
    } catch (err) {
      toast.error('Network error while citing.');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(citation);
      toast.success('Citation copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy citation:', err);
      toast.error('Failed to copy citation');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4cae8a] mx-auto mb-4"></div>
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
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#4cae8a] hover:bg-[#357a5b]"
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
            className="inline-flex items-center text-[#4cae8a] hover:text-[#357a5b]"
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
                {book.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.cover_image_url}
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
              {/* Book Header */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{book.title}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        <div className="flex flex-wrap gap-1">
                          {book.authors && book.authors.length > 0 ? (
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
                  </div>
                </div>

                {/* Download and Cite Buttons */}
                <div className="flex space-x-4">
                  {book.file_url && (
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#4cae8a] hover:bg-[#357a5b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4cae8a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <DocumentArrowDownIcon className={`h-4 w-4 mr-2 ${isDownloading ? 'animate-bounce' : ''}`} />
                      {isDownloading ? 'Downloading...' : 'Download Book'}
                    </button>
                  )}
                  <button
                    onClick={handleCite}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4cae8a]"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                    Cite
                  </button>
                </div>

                {/* Citation Modal */}
                {showCitationModal && (
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Citation</h3>
                      <div className="mb-4">
                        <select
                          value={citationFormat}
                          onChange={(e) => {
                            setCitationFormat(e.target.value as 'apa' | 'mla' | 'chicago');
                            if (book) {
                              setCitation(generateBookCitation({
                                title: book.title,
                                authors: book.authors ? book.authors : undefined,
                                author: book.author,
                                published_year: book.published_year,
                                publisher: book.publisher,
                                isbn: book.isbn,
                              }, e.target.value as 'apa' | 'mla' | 'chicago'));
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4cae8a]"
                        >
                          <option value="apa">APA</option>
                          <option value="mla">MLA</option>
                          <option value="chicago">Chicago</option>
                        </select>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-md mb-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{citation}</p>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={copyToClipboard}
                          className="px-4 py-2 bg-[#4cae8a] text-white rounded-md hover:bg-[#357a5b]"
                        >
                          Copy to Clipboard
                        </button>
                        <button
                          onClick={() => setShowCitationModal(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Book Content */}
              <div className="space-y-8">
                {/* Summary */}
                {book.summary && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                      <BookOpenIcon className="h-5 w-5 mr-2" />
                      Summary
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <p className="text-gray-700 leading-relaxed">{book.summary}</p>
                    </div>
                  </div>
                )}

                {/* Book Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Publication Details</h3>
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
                      {book.authors.map((author) => (
                        <Link
                          key={author.id}
                          href={`/authors/${encodeURIComponent(author.author_name)}`}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                          {author.author_name}
                        </Link>
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

                {/* Repository Information */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Repository Information</h3>
                  <p className="text-sm text-gray-600">
                    Added on {new Date(book.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  {book.updated_at !== book.created_at && (
                    <p className="text-sm text-gray-600">
                      Last updated on {new Date(book.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                </div>
                {book.created_by && (
                  <div className="mt-4 text-sm text-gray-600">
                    <span className="font-medium">Created by: </span>
                    {creator && creator.name ? (
                      <Link href={`/users/${creator.id}`} className="text-[#4cae8a] hover:underline">{creator.name}</Link>
                    ) : (
                      <span>Unknown</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 