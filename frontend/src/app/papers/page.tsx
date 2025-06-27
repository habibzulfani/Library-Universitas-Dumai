'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, DocumentTextIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { papersAPI, Paper, SearchParams } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import PaperForm from '@/components/forms/PaperForm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function PapersPage() {
  const { user } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [showPaperForm, setShowPaperForm] = useState(false);
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: number; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPapers = useCallback(async (params: SearchParams = {}) => {
    try {
      setLoading(true);
      const response = await papersAPI.getPapers({
        query: searchQuery,
        page: currentPage,
        limit: 12,
        ...params,
      });
      setPapers(response.data.data);
      setTotalPages(response.data.total_pages);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching papers:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage]);

  useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPapers({ query: searchQuery, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditPaper = (paper: Paper) => {
    setEditingPaper(paper);
    setShowPaperForm(true);
  };

  const handlePaperSuccess = () => {
    setShowPaperForm(false);
    setEditingPaper(null);
    fetchPapers();
  };

  const handleDeletePaper = async (id: number) => {
    const paper = papers.find(p => p.id === id);
    if (paper) {
      setShowDeleteConfirm({ id, title: paper.title });
    }
  };

  const confirmDeletePaper = async () => {
    if (!showDeleteConfirm) return;

    setIsDeleting(true);
    try {
      await papersAPI.deleteUserPaper(showDeleteConfirm.id);
      toast.success('Paper deleted successfully');
      fetchPapers();
    } catch (error) {
      toast.error('Failed to delete paper');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Papers</h1>
              <p className="text-gray-600">Discover academic papers and research</p>
            </div>
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  setShowPaperForm(true);
                  setEditingPaper(null);
                }}
                className="bg-[#38b36c] text-white px-4 py-2 rounded-md hover:bg-[#2e8c55]"
              >
                Add New Paper
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="search"
                placeholder="Search papers by title, author, abstract, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[#4cae8a] focus:border-[#4cae8a]"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  type="submit"
                  className="bg-[#4cae8a] text-white px-4 py-2 rounded-md hover:bg-[#357a5b] focus:outline-none focus:ring-2 focus:ring-[#4cae8a]"
                >
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Results count */}
        {!loading && (
          <div className="mb-6">
            <p className="text-gray-600">
              {total === 0 ? 'No papers found' : `Showing ${total} paper${total !== 1 ? 's' : ''}`}
            </p>
          </div>
        )}

        {/* Papers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No papers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search terms or browse all papers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {papers.map((paper) => (
              <div key={paper.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 line-clamp-2">
                    {paper.title}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    {Array.isArray(paper.authors) && paper.authors.length > 0 ? (
                      paper.authors.map((author, index) => (
                        <React.Fragment key={author.id}>
                          <Link
                            href={`/authors/${encodeURIComponent(author.author_name)}`}
                            className="text-[#4cae8a] hover:text-[#357a5b] hover:underline"
                          >
                            {author.author_name}
                          </Link>
                          {index < paper.authors.length - 1 && <span>, </span>}
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
                  </p>
                  <p className="text-gray-600 mb-2">Published: {paper.year ? paper.year : '-'}</p>
                  <p className="text-gray-600 mb-2">ISSN: {paper.issn ? paper.issn : '-'}</p>
                  {paper.advisor && (
                    <p className="text-sm text-gray-500 mb-2">Advisor: {paper.advisor}</p>
                  )}
                  {paper.university && (
                    <p className="text-sm text-gray-500 mb-2">{paper.university}</p>
                  )}
                  {paper.department && (
                    <p className="text-sm text-gray-500 mb-2">{paper.department}</p>
                  )}
                  {paper.abstract && (
                    <p className="text-sm text-gray-700 line-clamp-3 mb-4">
                      {paper.abstract}
                    </p>
                  )}
                  {paper.keywords && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {paper.keywords.split(',').slice(0, 3).map((keyword, index) => (
                          <span
                            key={index}
                            className="inline-block bg-[#eaf6f1] text-[#357a5b] text-xs px-2 py-1 rounded"
                          >
                            {keyword.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-4">
                    <Link
                      href={`/papers/${paper.id}`}
                      className="mt-4 inline-block bg-[#38b36c] text-white px-4 py-2 rounded hover:bg-[#2e8c55] transition-colors border-2 border-[#38b36c] hover:border-[#2e8c55] hover:shadow-md"
                    >
                      View Details
                    </Link>
                    {user?.role === 'admin' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditPaper(paper)}
                          className="p-2 text-[#38b36c] hover:text-[#2e8c55] hover:bg-[#e6f4ec] rounded-lg transition-colors duration-200"
                          title="Edit paper"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePaper(paper.id)}
                          className="p-2 text-[#38b36c] hover:text-[#2e8c55] hover:bg-[#e6f4ec] rounded-lg transition-colors duration-200"
                          title="Delete paper"
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
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = i + Math.max(1, currentPage - 2);
                if (page > totalPages) return null;

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${currentPage === page
                      ? 'bg-[#4cae8a] text-white'
                      : 'text-gray-700 hover:text-[#4cae8a]'
                      }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
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
            isAdmin={user?.role === 'admin'}
          />
        )}

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={!!showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={confirmDeletePaper}
          title="Delete Paper"
          message={`Are you sure you want to delete "${showDeleteConfirm?.title}"? This action cannot be undone.`}
          confirmText="Delete Paper"
          cancelText="Cancel"
          type="danger"
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
} 