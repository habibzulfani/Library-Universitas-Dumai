import { Paper } from '../../lib/types';
import Link from 'next/link';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface PaperListProps {
    papers: Paper[];
    loading: boolean;
    onEdit: (paper: Paper) => void;
    onDelete: (id: number) => void;
    onAdd: () => void;
}

export function PaperList({ papers, loading, onEdit, onDelete, onAdd }: PaperListProps) {
    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Papers</h2>
                <button
                    onClick={onAdd}
                    className="bg-[#38b36c] text-white px-4 py-2 rounded-md hover:bg-[#2e8c55]"
                >
                    Add New Paper
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(papers || []).map((paper) => (
                    <div key={paper.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                        <div className="p-6">
                            <h3 className="font-semibold text-lg mb-2 text-gray-900 line-clamp-2">
                                {paper.title}
                            </h3>
                            <p className="text-gray-600 mb-2">
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
                            </p>
                            <p className="text-gray-600 mb-2">Published: {paper.year ? paper.year : '-'}</p>
                            {paper.journal && (
                                <p className="text-gray-600 mb-2">
                                    {paper.journal}
                                    {paper.volume && `, Vol. ${paper.volume}`}
                                    {paper.issue && `, No. ${paper.issue}`}
                                </p>
                            )}
                            {paper.doi && (
                                <p className="text-gray-600 mb-2">
                                    DOI: <a
                                        href={`https://doi.org/${paper.doi}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#4cae8a] hover:text-[#357a5b] hover:underline"
                                    >
                                        {paper.doi}
                                    </a>
                                </p>
                            )}
                            <p className="text-gray-600 mb-2">ISSN: {paper.issn ? paper.issn : '-'}</p>
                            {paper.language && (
                                <p className="text-gray-600 mb-2">Language: {paper.language}</p>
                            )}
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
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => onEdit(paper)}
                                        className="p-2 text-[#38b36c] hover:text-[#2e8c55] hover:bg-[#e6f4ec] rounded-lg transition-colors duration-200"
                                        title="Edit paper"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(paper.id)}
                                        className="p-2 text-[#38b36c] hover:text-[#2e8c55] hover:bg-[#e6f4ec] rounded-lg transition-colors duration-200"
                                        title="Delete paper"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {papers.length === 0 && !loading && (
                <div className="text-center py-12">
                    <p className="text-gray-500">You haven&apos;t created any papers yet.</p>
                    <button
                        onClick={onAdd}
                        className="mt-4 bg-[#38b36c] text-white px-4 py-2 rounded-md hover:bg-[#2e8c55]"
                    >
                        Create Your First Paper
                    </button>
                </div>
            )}
        </div>
    );
} 