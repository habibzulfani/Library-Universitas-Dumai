'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api, papersAPI } from '@/lib/api';
import {
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  DocumentArrowDownIcon,
  ArrowLeftIcon,
  TagIcon,
  AcademicCapIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { generatePaperCitation } from '@/lib/citation';

interface Paper {
  id: number;
  title: string;
  author: string;
  authors?: Array<{
    id: number;
    author_name: string;
  }>;
  advisor?: string;
  university?: string;
  department?: string;
  year?: number;
  issn?: string;
  journal?: string;
  volume?: number;
  issue?: number;
  pages?: string;
  doi?: string;
  abstract?: string;
  keywords?: string;
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

export default function PaperDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [citationFormat, setCitationFormat] = useState<'apa' | 'mla' | 'chicago'>('apa');
  const [citation, setCitation] = useState('');

  const paperId = params?.id as string;

  useEffect(() => {
    const fetchPaper = async () => {
      if (!paperId) return;

      setIsLoading(true);
      try {
        const response = await papersAPI.getPaper(parseInt(paperId));
        setPaper(response);
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

  const handleCite = () => {
    if (!paper) return;
    const citation = generatePaperCitation({
      title: paper.title,
      author: paper.author,
      year: paper.year || new Date().getFullYear(),
      university: paper.university,
      department: paper.department,
      issn: paper.issn,
      journal: paper.journal,
      volume: paper.volume,
      issue: paper.issue,
      pages: paper.pages,
      doi: paper.doi
    }, citationFormat);
    setCitation(citation);
    setShowCitationModal(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(citation);
      alert('Citation copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy citation:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4cae8a] mx-auto mb-4"></div>
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
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#4cae8a] hover:bg-[#357a5b]"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/papers')}
            className="inline-flex items-center text-[#4cae8a] hover:text-[#357a5b]"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Papers
          </button>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
            {/* Paper Cover */}
            <div className="lg:col-span-4">
              <div className="aspect-w-3 aspect-h-4 bg-gray-200 overflow-hidden">
                {paper.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={paper.cover_image_url}
                    alt={paper.title}
                    className="w-full h-full object-center object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-96 bg-gray-100">
                    <DocumentTextIcon className="h-24 w-24 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Paper Details */}
            <div className="lg:col-span-8 p-8">
              {/* Paper Header */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{paper.title}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        <div className="flex flex-wrap gap-1">
                          {paper.authors && paper.authors.length > 0 ? (
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
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>{paper.year}</span>
                      </div>
                      {paper.department && (
                        <div className="flex items-center">
                          <TagIcon className="h-4 w-4 mr-1" />
                          <span>{paper.department}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Download and Cite Buttons */}
                <div className="flex space-x-4">
                  {isAuthenticated && paper.file_url && (
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#4cae8a] hover:bg-[#357a5b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4cae8a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <DocumentArrowDownIcon className={`h-4 w-4 mr-2 ${isDownloading ? 'animate-bounce' : ''}`} />
                      {isDownloading ? 'Downloading...' : 'Download Paper'}
                    </button>
                  )}

                  {isAuthenticated && (
                    <button
                      onClick={handleCite}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4cae8a]"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                      Cite
                    </button>
                  )}
                </div>

                {!isAuthenticated && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <p className="text-sm text-yellow-800">
                      Please <span className="font-medium">sign in</span> to download or cite this paper.
                    </p>
                  </div>
                )}

                {/* Citation Modal */}
                {showCitationModal && (
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Citation</h3>
                      <div className="mb-4">
                        <select
                          value={citationFormat}
                          onChange={(e) => setCitationFormat(e.target.value as 'apa' | 'mla' | 'chicago')}
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
                    {paper.journal && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Journal</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {paper.journal}
                          {paper.volume && `, Vol. ${paper.volume}`}
                          {paper.issue && `, No. ${paper.issue}`}
                          {paper.pages && `, pp. ${paper.pages}`}
                        </dd>
                      </div>
                    )}
                    {paper.doi && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">DOI</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <a
                            href={`https://doi.org/${paper.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#4cae8a] hover:text-[#357a5b] hover:underline"
                          >
                            {paper.doi}
                          </a>
                        </dd>
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
                    <div className="flex flex-wrap gap-2">
                      {paper.authors.map((author) => (
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
    </div>
  );
} 