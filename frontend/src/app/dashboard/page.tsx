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

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getUserBooks();
      setBooks(response.data.data);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPapers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await papersAPI.getUserPapers();
      setPapers(response.data.data);
    } catch (error) {
      console.error('Error fetching papers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchBooks();
    fetchPapers();
  }, [fetchBooks, fetchPapers]);

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setShowBookForm(true);
  };

  const handleBookSuccess = () => {
    setShowBookForm(false);
    setEditingBook(null);
    fetchBooks();
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
      await booksAPI.deleteUserBook(showDeleteBookConfirm.id);
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
      await papersAPI.deleteUserPaper(showDeletePaperConfirm.id);
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
            <Overview
              books={books}
              papers={papers}
              loading={loading}
            />
          )}

          {activeTab === 'books' && (
            <BookList
              books={books}
              loading={loading}
              onEdit={handleEditBook}
              onDelete={handleDeleteBook}
              onAdd={() => {
                setEditingBook(null);
                setShowBookForm(true);
              }}
            />
          )}

          {activeTab === 'papers' && (
            <PaperList
              papers={papers}
              loading={loading}
              onEdit={handleEditPaper}
              onDelete={handleDeletePaper}
              onAdd={() => {
                setEditingPaper(null);
                setShowPaperForm(true);
              }}
            />
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