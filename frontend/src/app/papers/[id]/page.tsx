'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api, papersAPI } from '@/lib/api';
import { 
  DocumentTextIcon, 
  CalendarIcon, 
  UserIcon, 
  DocumentArrowDownIcon,
  ArrowLeftIcon,
  TagIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface Paper {
  id: number;
  title: string;
  author: string;
  advisor?: string;
  university?: string;
  department?: string;
  year: number;
  abstract: string;
  keywords?: string;
  file_url?: string;
  issn?: string;
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

export default function PaperDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const paperId = params?.id as string;

  useEffect(() => {
    const fetchPaper = async () => {
      if (!paperId) return;
      
      setIsLoading(true);
      try {
        const response = await api.get(`/papers/${paperId}`);
        setPaper(response.data);
      } catch (err) {
        console.error('Error fetching paper:', err);
        setError('Failed to load paper details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaper();
  }, [paperId]);

  const handleDownload = async () => {
    if (!paper?.file_url || !isAuthenticated) return;
    
    setIsDownloading(true);
    try {
      await papersAPI.downloadPaper(paper.id, paper.title, paper.file_url);
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
          <p className="text-gray-600">Loading paper details...</p>
        </div>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Paper Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The paper you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push('/papers')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Papers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/papers')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Papers
          </button>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-8">
            {/* Paper Header */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                  <DocumentTextIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{paper.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 mr-1" />
                      <span>{paper.author}</span>
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>{paper.year}</span>
                    </div>
                    {paper.categories && paper.categories.length > 0 && (
                      <div className="flex items-center">
                        <TagIcon className="h-4 w-4 mr-1" />
                        <span>{paper.categories[0].name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Download Button */}
              {isAuthenticated && paper.file_url && (
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  {isDownloading ? 'Downloading...' : 'Download Paper'}
                </button>
              )}

              {!isAuthenticated && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-sm text-yellow-800">
                    Please <span className="font-medium">sign in</span> to download this paper.
                  </p>
                </div>
              )}
            </div>

            {/* Paper Content */}
            <div className="space-y-8">
              {/* Abstract */}
              {paper.abstract && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <AcademicCapIcon className="h-5 w-5 mr-2" />
                    Abstract
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-gray-700 leading-relaxed">{paper.abstract}</p>
                  </div>
                </div>
              )}

              {/* Paper Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Publication Details</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  {paper.university && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">University</dt>
                      <dd className="mt-1 text-sm text-gray-900">{paper.university}</dd>
                    </div>
                  )}
                  {paper.department && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Department</dt>
                      <dd className="mt-1 text-sm text-gray-900">{paper.department}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Year</dt>
                    <dd className="mt-1 text-sm text-gray-900">{paper.year}</dd>
                  </div>
                  {paper.advisor && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Advisor</dt>
                      <dd className="mt-1 text-sm text-gray-900">{paper.advisor}</dd>
                    </div>
                  )}
                  {paper.issn && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">ISSN</dt>
                      <dd className="mt-1 text-sm text-gray-900">{paper.issn}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Keywords */}
              {paper.keywords && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {paper.keywords.split(',').map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {keyword.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Authors */}
              {paper.authors && paper.authors.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Authors</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex flex-wrap gap-2">
                      {paper.authors.map((author, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {author.author_name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Categories */}
              {paper.categories && paper.categories.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {paper.categories.map((category, index) => (
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
                  Added on {new Date(paper.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                {paper.updated_at !== paper.created_at && (
                  <p className="text-sm text-gray-600">
                    Last updated on {new Date(paper.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 