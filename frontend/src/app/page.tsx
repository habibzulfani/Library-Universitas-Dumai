'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpenIcon, DocumentTextIcon, AcademicCapIcon, UserGroupIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { booksAPI, papersAPI, Book, Paper } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [recentPapers, setRecentPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [booksResponse, papersResponse] = await Promise.all([
          booksAPI.getBooks({ limit: 4, page: 1, sort: 'created_at:desc' }),
          papersAPI.getPapers({ limit: 4, page: 1, sort: 'created_at:desc' }),
        ]);
        setRecentBooks(booksResponse.data.data);
        setRecentPapers(papersResponse.data.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load recent content. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    { name: 'Total Books', value: '1,200+', icon: BookOpenIcon },
    { name: 'Research Papers', value: '850+', icon: DocumentTextIcon },
    { name: 'Students', value: '5,000+', icon: AcademicCapIcon },
    { name: 'Faculty', value: '200+', icon: UserGroupIcon },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#4cae8a] to-[#357a5b] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to Repository of Universitas Dumai
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-[#eaf6f1] max-w-3xl mx-auto">
              Your gateway to academic knowledge. Discover books, research papers,
              and scholarly resources from Universitas Dumai.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for books, papers, authors, ISBN, ISSN, DOI, or year..."
                  className="w-full px-6 py-4 rounded-lg text-gray-900 bg-white border-2 border-gray-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#4cae8a] focus:border-[#4cae8a]"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#4cae8a] p-2 rounded-lg hover:bg-[#357a5b] transition-colors"
                >
                  <MagnifyingGlassIcon className="h-6 w-6 text-white" />
                </button>
              </div>
            </form>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/books"
                className="bg-white text-[#4cae8a] px-8 py-3 rounded-lg font-semibold hover:bg-[#eaf6f1] transition-colors"
              >
                Browse Books
              </Link>
              <Link
                href="/papers"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-[#4cae8a] transition-colors"
              >
                Research Papers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.name} className="text-center">
                <div className="flex justify-center mb-4">
                  <stat.icon className="h-8 w-8 text-[#4cae8a]" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Content */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Recent Books */}
          <div className="mb-16">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Recent Books</h2>
              <Link
                href="/books"
                className="text-[#4cae8a] hover:text-[#357a5b] font-medium"
              >
                View all books →
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {recentBooks.map((book) => (
                  <div key={book.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
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
                      <div className="text-sm text-gray-500 space-y-1 mb-4">
                        <p>Published: {book.published_year}</p>
                        {book.publisher && <p>Publisher: {book.publisher}</p>}
                        {book.isbn && <p>ISBN: {book.isbn}</p>}
                      </div>
                      <Link
                        href={`/books/${book.id}`}
                        className="text-[#4cae8a] hover:text-[#357a5b] font-medium"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Papers */}
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Recent Papers</h2>
              <Link
                href="/papers"
                className="text-[#4cae8a] hover:text-[#357a5b] font-medium"
              >
                View all papers →
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {recentPapers.map((paper) => (
                  <div key={paper.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <h3 className="font-semibold text-lg mb-2 text-gray-900 line-clamp-2">
                        {paper.title}
                      </h3>
                      <div className="text-gray-600 mb-2">
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
                      <div className="text-sm text-gray-500 space-y-1 mb-4">
                        <p>Year: {paper.year}</p>
                        {paper.journal && <p>Journal: {paper.journal}</p>}
                        {paper.doi && <p>DOI: {paper.doi}</p>}
                        {paper.university && <p>University: {paper.university}</p>}
                      </div>
                      <Link
                        href={`/papers/${paper.id}`}
                        className="text-[#4cae8a] hover:text-[#357a5b] font-medium"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
