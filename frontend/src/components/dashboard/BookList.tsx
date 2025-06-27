import { Book } from '@/lib/api';
import Link from 'next/link';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface BookListProps {
    books: Book[];
    loading: boolean;
    onEdit: (book: Book) => void;
    onDelete: (id: number) => void;
    onAdd: () => void;
}

export function BookList({ books, loading, onEdit, onDelete, onAdd }: BookListProps) {
    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Books</h2>
                <button
                    onClick={onAdd}
                    className="bg-[#38b36c] text-white px-4 py-2 rounded-md hover:bg-[#2e8c55]"
                >
                    Add New Book
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map((book) => (
                    <div key={book.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
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
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => onEdit(book)}
                                        className="p-2 text-[#38b36c] hover:text-[#2e8c55] hover:bg-[#e6f4ec] rounded-lg transition-colors duration-200"
                                        title="Edit book"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(book.id)}
                                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                        title="Delete book"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {books.length === 0 && !loading && (
                <div className="text-center py-12">
                    <p className="text-gray-500">You haven&apos;t created any books yet.</p>
                    <button
                        onClick={onAdd}
                        className="mt-4 bg-[#38b36c] text-white px-4 py-2 rounded-md hover:bg-[#2e8c55]"
                    >
                        Create Your First Book
                    </button>
                </div>
            )}
        </div>
    );
} 