'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useBookForm } from '@/hooks/useBookForm';
import { usePaperForm } from '@/hooks/usePaperForm';
import { Book, Paper } from '@/lib/api';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import BookForm from '@/components/forms/BookForm';
import PaperForm from '@/components/forms/PaperForm';
import { BookList } from '@/components/dashboard/BookList';
import { PaperList } from '@/components/dashboard/PaperList';
import { Overview } from '@/components/dashboard/Overview';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { booksAPI } from '@/lib/api';
import { papersAPI } from '@/lib/api';
import SearchBar from '@/components/ui/SearchBar';
import Pagination from '@/components/ui/Pagination';
import { getUserStats, getUserCitationsPerMonth, getBooksPerMonth, getPapersPerMonth, getUserDownloadsPerMonth } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'books' | 'papers'>('overview');
  const [books, setBooks] = useState<Book[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookForm, setShowBookForm] = useState(false);
  const [showPaperForm, setShowPaperForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [showDeleteBookConfirm, setShowDeleteBookConfirm] = useState<{ id: number; title: string } | null>(null);
  const [showDeletePaperConfirm, setShowDeletePaperConfirm] = useState<{ id: number; title: string } | null>(null);
  const [isDeletingBook, setIsDeletingBook] = useState(false);
  const [isDeletingPaper, setIsDeletingPaper] = useState(false);

  // Add state for search and pagination for books and papers
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [bookCurrentPage, setBookCurrentPage] = useState(1);
  const [bookTotalPages, setBookTotalPages] = useState(0);
  const [bookTotal, setBookTotal] = useState(0);

  const [paperSearchQuery, setPaperSearchQuery] = useState('');
  const [paperCurrentPage, setPaperCurrentPage] = useState(1);
  const [paperTotalPages, setPaperTotalPages] = useState(0);
  const [paperTotal, setPaperTotal] = useState(0);

  const [userStats, setUserStats] = useState<{ totalBooks: number; totalPapers: number; totalDownloads: number; totalCitations: number }>({ totalBooks: 0, totalPapers: 0, totalDownloads: 0, totalCitations: 0 });
  const [userCitationStats, setUserCitationStats] = useState<{ year: number; month: number; count: number }[]>([]);
  const [isLoadingUserStats, setIsLoadingUserStats] = useState(false);
  const [isLoadingUserCitationStats, setIsLoadingUserCitationStats] = useState(false);

  const [booksPerMonth, setBooksPerMonth] = useState<{ year: number; month: number; count: number }[]>([]);
  const [papersPerMonth, setPapersPerMonth] = useState<{ year: number; month: number; count: number }[]>([]);
  const [userDownloadsPerMonth, setUserDownloadsPerMonth] = useState<{ year: number; month: number; count: number }[]>([]);
  const [isLoadingBooksPerMonth, setIsLoadingBooksPerMonth] = useState(false);
  const [isLoadingPapersPerMonth, setIsLoadingPapersPerMonth] = useState(false);
  const [isLoadingUserDownloadsPerMonth, setIsLoadingUserDownloadsPerMonth] = useState(false);

  const fetchBooks = useCallback(async (params: any = {}) => {
    try {
      setLoading(true);
      const response = await booksAPI.getUserBooks({
        query: bookSearchQuery,
        page: bookCurrentPage,
        limit: 12,
        ...params,
      });
      setBooks(response.data.data);
      setBookTotalPages(response.data.total_pages);
      setBookTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  }, [bookSearchQuery, bookCurrentPage]);

  const fetchPapers = useCallback(async (params: any = {}) => {
    try {
      setLoading(true);
      const response = await papersAPI.getUserPapers({
        query: paperSearchQuery,
        page: paperCurrentPage,
        limit: 12,
        ...params,
      });
      setPapers(response.data.data);
      setPaperTotalPages(response.data.total_pages);
      setPaperTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching papers:', error);
    } finally {
      setLoading(false);
    }
  }, [paperSearchQuery, paperCurrentPage]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading) return; // Still loading auth, do nothing
    if (!user) {
      setIsLoadingUserStats(false);
      setIsLoadingUserCitationStats(false);
      setIsLoadingBooksPerMonth(false);
      setIsLoadingPapersPerMonth(false);
      setIsLoadingUserDownloadsPerMonth(false);
      return;
    }
    if (activeTab === 'overview') {
      setIsLoadingUserStats(true);
      setIsLoadingUserCitationStats(true);
      setIsLoadingBooksPerMonth(true);
      setIsLoadingPapersPerMonth(true);
      setIsLoadingUserDownloadsPerMonth(true);
      getUserStats()
        .then(res => setUserStats(res.data))
        .catch(() => setUserStats({ totalBooks: 0, totalPapers: 0, totalDownloads: 0, totalCitations: 0 }))
        .finally(() => setIsLoadingUserStats(false));
      getUserCitationsPerMonth()
        .then(res => setUserCitationStats(Array.isArray(res.data) ? res.data : []))
        .catch(() => setUserCitationStats([]))
        .finally(() => setIsLoadingUserCitationStats(false));
      getBooksPerMonth()
        .then(res => setBooksPerMonth(Array.isArray(res.data) ? res.data : []))
        .catch(() => setBooksPerMonth([]))
        .finally(() => setIsLoadingBooksPerMonth(false));
      getPapersPerMonth()
        .then(res => setPapersPerMonth(Array.isArray(res.data) ? res.data : []))
        .catch(() => setPapersPerMonth([]))
        .finally(() => setIsLoadingPapersPerMonth(false));
      getUserDownloadsPerMonth()
        .then(res => setUserDownloadsPerMonth(Array.isArray(res.data) ? res.data : []))
        .catch(() => setUserDownloadsPerMonth([]))
        .finally(() => setIsLoadingUserDownloadsPerMonth(false));
    }
  }, [authLoading, user, activeTab]);

  useEffect(() => {
    if (activeTab === 'books') fetchBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchBooks, activeTab]);
  useEffect(() => {
    if (activeTab === 'papers') fetchPapers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPapers, activeTab]);

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

  const handleEditPaper = (paper: Paper) => {
    // Fetch the full paper data including authors
    papersAPI.getPaper(paper.id)
      .then((response) => {
        const fullPaper = response;
        setEditingPaper(fullPaper);
        setShowPaperForm(true);
      })
      .catch((error: any) => {
        console.error('Error loading paper details:', error);
        toast.error('Failed to load paper details');
      });
  };

  const handlePaperSuccess = () => {
    setShowPaperForm(false);
    setEditingPaper(null);
    fetchPapers();
  };

  const handleDeleteBook = async (id: number) => {
    const book = books.find(b => b.id === id);
    if (book) {
      setShowDeleteBookConfirm({ id, title: book.title });
    }
  };

  const confirmDeleteBook = async () => {
    if (!showDeleteBookConfirm) return;

    setIsDeletingBook(true);
    try {
      if (user?.role === 'admin') {
        await booksAPI.deleteBook(showDeleteBookConfirm.id);
      } else {
        await booksAPI.deleteUserBook(showDeleteBookConfirm.id);
      }
      toast.success('Book deleted successfully');
      fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error('Failed to delete book');
    } finally {
      setIsDeletingBook(false);
      setShowDeleteBookConfirm(null);
    }
  };

  const handleDeletePaper = async (id: number) => {
    const paper = papers.find(p => p.id === id);
    if (paper) {
      setShowDeletePaperConfirm({ id, title: paper.title });
    }
  };

  const confirmDeletePaper = async () => {
    if (!showDeletePaperConfirm) return;

    setIsDeletingPaper(true);
    try {
      if (user?.role === 'admin') {
        await papersAPI.deletePaper(showDeletePaperConfirm.id);
      } else {
        await papersAPI.deleteUserPaper(showDeletePaperConfirm.id);
      }
      toast.success('Paper deleted successfully');
      fetchPapers();
    } catch (error) {
      console.error('Error deleting paper:', error);
      toast.error('Failed to delete paper');
    } finally {
      setIsDeletingPaper(false);
      setShowDeletePaperConfirm(null);
    }
  };

  // Handlers for search and pagination
  const handleBookSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setBookCurrentPage(1);
    fetchBooks({ query: bookSearchQuery, page: 1 });
  };
  const handleBookPageChange = (page: number) => {
    setBookCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaperSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPaperCurrentPage(1);
    fetchPapers({ query: paperSearchQuery, page: 1 });
  };
  const handlePaperPageChange = (page: number) => {
    setPaperCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mt-6">
          {activeTab === 'overview' && (
            <>
              <Overview books={books} papers={papers} loading={loading} stats={userStats} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Books Added Per Month</h3>
                  {isLoadingBooksPerMonth ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={booksPerMonth.map(d => ({ ...d, label: `${d.year}-${String(d.month).padStart(2, '0')}` }))} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" name="Books" stroke="#38b36c" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Papers Added Per Month</h3>
                  {isLoadingPapersPerMonth ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={papersPerMonth.map(d => ({ ...d, label: `${d.year}-${String(d.month).padStart(2, '0')}` }))} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" name="Papers" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Downloads Per Month (My Works)</h3>
                {isLoadingUserDownloadsPerMonth ? (
                  <div className="text-center py-8">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={userDownloadsPerMonth.map(d => ({ ...d, label: `${d.year}-${String(d.month).padStart(2, '0')}` }))} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" name="Downloads" stroke="#f59e42" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Citations Per Month</h3>
                {isLoadingUserCitationStats ? (
                  <div className="text-center py-8">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={userCitationStats.map(d => ({ ...d, label: `${d.year}-${String(d.month).padStart(2, '0')}` }))} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
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
            </>
          )}

          {activeTab === 'books' && (
            <>
              {/* Searchbar for My Books */}
              <div className="mb-8 max-w-2xl">
                <SearchBar
                  value={bookSearchQuery}
                  onChange={e => setBookSearchQuery(e.target.value)}
                  onSubmit={handleBookSearch}
                  placeholder="Search books by title, author, subject, or ISBN..."
                />
              </div>
              {/* Results count */}
              {!loading && (
                <div className="mb-6">
                  <p className="text-gray-600">
                    {bookTotal === 0 ? 'No books found' : `Showing ${bookTotal} book${bookTotal !== 1 ? 's' : ''}`}
                  </p>
                </div>
              )}
              <BookList
                books={books || []}
                loading={loading}
                onEdit={handleEditBook}
                onDelete={handleDeleteBook}
                onAdd={() => {
                  setEditingBook(null);
                  setShowBookForm(true);
                }}
              />
              {/* Pagination for My Books */}
              {bookTotalPages > 1 && (
                <div className="mt-12 flex justify-center">
                  <Pagination
                    currentPage={bookCurrentPage}
                    totalPages={bookTotalPages}
                    onPageChange={handleBookPageChange}
                  />
                </div>
              )}
            </>
          )}

          {activeTab === 'papers' && (
            <>
              {/* Searchbar for My Papers */}
              <div className="mb-8 max-w-2xl">
                <SearchBar
                  value={paperSearchQuery}
                  onChange={e => setPaperSearchQuery(e.target.value)}
                  onSubmit={handlePaperSearch}
                  placeholder="Search papers by title, author, abstract, keywords, or DOI..."
                />
              </div>
              {/* Results count */}
              {!loading && (
                <div className="mb-6">
                  <p className="text-gray-600">
                    {paperTotal === 0 ? 'No papers found' : `Showing ${paperTotal} paper${paperTotal !== 1 ? 's' : ''}`}
                  </p>
                </div>
              )}
              <PaperList
                papers={papers || []}
                loading={loading}
                onEdit={handleEditPaper}
                onDelete={handleDeletePaper}
                onAdd={() => {
                  setEditingPaper(null);
                  setShowPaperForm(true);
                }}
              />
              {/* Pagination for My Papers */}
              {paperTotalPages > 1 && (
                <div className="mt-12 flex justify-center">
                  <Pagination
                    currentPage={paperCurrentPage}
                    totalPages={paperTotalPages}
                    onPageChange={handlePaperPageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {showBookForm && (
          <BookForm
            editingBook={editingBook}
            onClose={() => {
              setShowBookForm(false);
              setEditingBook(null);
            }}
            onSuccess={handleBookSuccess}
          />
        )}

        {showPaperForm && (
          <PaperForm
            editingPaper={editingPaper}
            onClose={() => {
              setShowPaperForm(false);
              setEditingPaper(null);
            }}
            onSuccess={handlePaperSuccess}
          />
        )}

        {/* Confirm Delete Book Dialog */}
        <ConfirmDialog
          isOpen={!!showDeleteBookConfirm}
          onClose={() => setShowDeleteBookConfirm(null)}
          onConfirm={confirmDeleteBook}
          title="Delete Book"
          message={`Are you sure you want to delete "${showDeleteBookConfirm?.title}"? This action cannot be undone.`}
          confirmText="Delete Book"
          cancelText="Cancel"
          type="danger"
          isLoading={isDeletingBook}
        />

        {/* Confirm Delete Paper Dialog */}
        <ConfirmDialog
          isOpen={!!showDeletePaperConfirm}
          onClose={() => setShowDeletePaperConfirm(null)}
          onConfirm={confirmDeletePaper}
          title="Delete Paper"
          message={`Are you sure you want to delete "${showDeletePaperConfirm?.title}"? This action cannot be undone.`}
          confirmText="Delete Paper"
          cancelText="Cancel"
          type="danger"
          isLoading={isDeletingPaper}
        />
      </div>
    </div>
  );
} 