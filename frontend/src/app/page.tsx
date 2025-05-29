'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpenIcon, DocumentTextIcon, AcademicCapIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { booksAPI, papersAPI, Book, Paper } from '@/lib/api';

export default function HomePage() {
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [recentPapers, setRecentPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [booksResponse, papersResponse] = await Promise.all([
          booksAPI.getBooks({ limit: 4, page: 1 }),
          papersAPI.getPapers({ limit: 4, page: 1 }),
        ]);
        setRecentBooks(booksResponse.data.data);
        setRecentPapers(papersResponse.data.data);
      } catch (error) {
        console.error('Error fetching data:', error);
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to E-Repository
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Your gateway to academic knowledge. Discover books, research papers, 
              and scholarly resources from Universitas Dumai.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/books"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Browse Books
              </Link>
              <Link
                href="/papers"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
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
                  <stat.icon className="h-8 w-8 text-blue-600" />
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
                className="text-blue-600 hover:text-blue-800 font-medium"
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
                      <p className="text-gray-600 mb-2">by {book.author}</p>
                      <p className="text-sm text-gray-500 mb-4">
                        {book.published_year}
                      </p>
                      <Link
                        href={`/books/${book.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
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
                className="text-blue-600 hover:text-blue-800 font-medium"
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
                      <p className="text-gray-600 mb-2">by {paper.author}</p>
                      <p className="text-sm text-gray-500 mb-4">
                        {paper.year}
                      </p>
                      <Link
                        href={`/papers/${paper.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
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
