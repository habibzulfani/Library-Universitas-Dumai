'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authorsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import React from 'react';
import { Book, Paper, AuthorDetail } from '@/lib/api';

export default function AuthorDetailPage({
    params,
}: {
    params: { name: string };
}) {
    const [author, setAuthor] = useState<AuthorDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        fetchAuthorDetail();
    }, [params.name]);

    const fetchAuthorDetail = async () => {
        try {
            setIsLoading(true);
            const response = await authorsAPI.getAuthorWorks(params.name);
            setAuthor(response.data);
        } catch (error) {
            console.error('Error fetching author details:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch author details',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleBookClick = (bookId: number) => {
        router.push(`/books/${bookId}`);
    };

    const handlePaperClick = (paperId: number) => {
        router.push(`/papers/${paperId}`);
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-8">
                <div className="animate-pulse space-y-8">
                    <div className="h-8 w-1/4 bg-muted rounded" />
                    <div className="space-y-4">
                        <div className="h-4 w-1/2 bg-muted rounded" />
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {[...Array(6)].map((_, i) => (
                                <Card key={i}>
                                    <CardHeader>
                                        <div className="h-6 w-3/4 bg-muted rounded" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-4 w-1/2 bg-muted rounded mb-2" />
                                        <div className="h-4 w-1/3 bg-muted rounded" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!author) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Author Not Found</h1>
                    <p className="text-muted-foreground">
                        The author you're looking for doesn't exist.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col gap-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{author.name}</h1>
                    <p className="text-muted-foreground">
                        {author.books.length + author.papers.length} works in the repository
                    </p>
                </div>

                {author.books.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Books</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {author.books.map((book) => (
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
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {author.papers.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Papers</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {author.papers.map((paper) => (
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
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 