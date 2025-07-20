'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { booksAPI, papersAPI, Book, Paper } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import BookForm from '@/components/forms/BookForm';
import PaperForm from '@/components/forms/PaperForm';
import Pagination from '@/components/ui/Pagination';

function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams?.get('query') || '';
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'all' | 'books' | 'papers'>('all');
    const [books, setBooks] = useState<Book[]>([]);
    const [papers, setPapers] = useState<Paper[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDeleteBookConfirm, setShowDeleteBookConfirm] = useState<{ id: number; title: string } | null>(null);
    const [showDeletePaperConfirm, setShowDeletePaperConfirm] = useState<{ id: number; title: string } | null>(null);
    const [isDeletingBook, setIsDeletingBook] = useState(false);
    const [isDeletingPaper, setIsDeletingPaper] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
    const [showBookForm, setShowBookForm] = useState(false);
    const [showPaperForm, setShowPaperForm] = useState(false);
    // Add pagination state for books and papers
    const [booksPage, setBooksPage] = useState(1);
    const [papersPage, setPapersPage] = useState(1);
    const pageSize = 10;
    const booksTotalPages = Math.ceil(books.length / pageSize);
    const papersTotalPages = Math.ceil(papers.length / pageSize);
    const paginatedBooks = books.slice((booksPage - 1) * pageSize, booksPage * pageSize);
    const paginatedPapers = papers.slice((papersPage - 1) * pageSize, papersPage * pageSize);

    const fetchResults = async () => {
        if (!query) return;
        setLoading(true);
        try {
            const [booksResponse, papersResponse] = await Promise.all([
                booksAPI.search({ query }),
                papersAPI.search({ query })
            ]);
            setBooks(booksResponse.data.data);
            setPapers(papersResponse.data.data);
        } catch {
            toast.error('Failed to fetch search results');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResults();
    }, [query]);

    const handleEditBook = async (book: Book) => {
        try {
            const response = await booksAPI.getBook(book.id);
            setEditingBook(response);
            setShowBookForm(true);
        } catch (error) {
            toast.error('Failed to load book details');
        }
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
            await booksAPI.deleteBook(showDeleteBookConfirm.id);
            setBooks(books.filter(book => book.id !== showDeleteBookConfirm.id));
            toast.success('Book deleted successfully');
        } catch {
            toast.error('Failed to delete book');
        } finally {
            setIsDeletingBook(false);
            setShowDeleteBookConfirm(null);
        }
    };

    const handleEditPaper = async (paper: Paper) => {
        try {
            const response = await papersAPI.getPaper(paper.id);
            setEditingPaper(response);
            setShowPaperForm(true);
        } catch (error) {
            toast.error('Failed to load paper details');
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
            await papersAPI.deletePaper(showDeletePaperConfirm.id);
            setPapers(papers.filter(paper => paper.id !== showDeletePaperConfirm.id));
            toast.success('Paper deleted successfully');
        } catch {
            toast.error('Failed to delete paper');
        } finally {
            setIsDeletingPaper(false);
            setShowDeletePaperConfirm(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#38b36c]"></div>
            </div>
        );
    }

    if (!query) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
                <p className="text-gray-500">Enter a search query to begin</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex space-x-4 mb-6">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 rounded-md ${activeTab === 'all'
                        ? 'bg-[#38b36c] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    All
                </button>
                <button
                    onClick={() => setActiveTab('books')}
                    className={`px-4 py-2 rounded-md ${activeTab === 'books'
                        ? 'bg-[#38b36c] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Books
                </button>
                <button
                    onClick={() => setActiveTab('papers')}
                    className={`px-4 py-2 rounded-md ${activeTab === 'papers'
                        ? 'bg-[#38b36c] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Papers
                </button>
            </div>

            <div className="space-y-6">
                {(activeTab === 'all' || activeTab === 'books') && books.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Books</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedBooks.map((book) => (
                                <div
                                    key={book.id}
                                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                                >
                                    <div className="p-6">
                                        <h3 className="font-semibold text-lg mb-2 text-gray-900 line-clamp-2">
                                            {book.title}
                                        </h3>
                                        <p className="text-gray-600 mb-2">
                                            by {book.authors && book.authors.length > 0 ? (
                                                book.authors.map((author, index) => (
                                                    <>
                                                        <Link
                                                            key={author.id}
                                                            href={`/authors/${encodeURIComponent(author.author_name)}`}
                                                            className="text-[#4cae8a] hover:text-[#357a5b] hover:underline"
                                                        >
                                                            {author.author_name}
                                                        </Link>
                                                        {index < book.authors.length - 1 && <span>, </span>}
                                                    </>
                                                ))
                                            ) : (
                                                <Link
                                                    href={`/authors/${encodeURIComponent(book.author)}`}
                                                    className="text-[#4cae8a] hover:text-[#357a5b] hover:underline"
                                                >
                                                    {book.author}
                                                </Link>
                                            )}
                                        </p>
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
                        {/* Books Pagination */}
                        {booksTotalPages > 1 && (
                            <div className="mt-8 flex justify-center">
                                <Pagination
                                    currentPage={booksPage}
                                    totalPages={booksTotalPages}
                                    onPageChange={setBooksPage}
                                />
                            </div>
                        )}
                    </div>
                )}

                {(activeTab === 'all' || activeTab === 'papers') && papers.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Papers</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedPapers.map((paper) => (
                                <div
                                    key={paper.id}
                                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                                >
                                    <div className="p-6">
                                        <h3 className="font-semibold text-lg mb-2 text-gray-900 line-clamp-2">
                                            {paper.title}
                                        </h3>
                                        <p className="text-gray-600 mb-2">
                                            by {paper.authors && paper.authors.length > 0 ? (
                                                paper.authors.map((author, index) => (
                                                    <>
                                                        <Link
                                                            key={author.id}
                                                            href={`/authors/${encodeURIComponent(author.author_name)}`}
                                                            className="text-[#4cae8a] hover:text-[#357a5b] hover:underline"
                                                        >
                                                            {author.author_name}
                                                        </Link>
                                                        {index < paper.authors.length - 1 && <span>, </span>}
                                                    </>
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
                        {/* Papers Pagination */}
                        {papersTotalPages > 1 && (
                            <div className="mt-8 flex justify-center">
                                <Pagination
                                    currentPage={papersPage}
                                    totalPages={papersTotalPages}
                                    onPageChange={setPapersPage}
                                />
                            </div>
                        )}
                    </div>
                )}

                {books.length === 0 && papers.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No results found for &quot;{query}&quot;</p>
                    </div>
                )}
            </div>

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

            {/* Book Edit Modal */}
            {showBookForm && (
                <BookForm
                    editingBook={editingBook}
                    onClose={() => { setShowBookForm(false); setEditingBook(null); }}
                    onSuccess={() => { setShowBookForm(false); setEditingBook(null); fetchResults(); }}
                    isAdmin={user?.role === 'admin'}
                />
            )}
            {/* Paper Edit Modal */}
            {showPaperForm && (
                <PaperForm
                    editingPaper={editingPaper}
                    onClose={() => { setShowPaperForm(false); setEditingPaper(null); }}
                    onSuccess={() => { setShowPaperForm(false); setEditingPaper(null); fetchResults(); }}
                    isAdmin={user?.role === 'admin'}
                />
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#38b36c]"></div>
                </div>
            }
        >
            <SearchResults />
        </Suspense>
    );
} 