'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getUserProfile, getUserStatsById, getUserCitationsPerMonthById, getUserDownloadsPerMonthById, getBooksByUserId, getPapersByUserId, getBookStats, getPaperStats, getFullUrl } from '@/lib/api';
import Pagination from '@/components/ui/Pagination';
import SearchBar from '@/components/ui/SearchBar';

interface UserStats {
    totalBooks: number;
    totalPapers: number;
    totalDownloads: number;
    totalCitations: number;
    hIndex?: number;
    i10Index?: number;
}

interface Work {
    id: number;
    title: string;
    cover_image_url?: string;
    citation_count?: number;
    download_count?: number;
    type: 'book' | 'paper';
}

export default function UserProfilePage() {
    const params = useParams();
    const userId = params?.id as string;
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [works, setWorks] = useState<Work[]>([]);
    const [citationStats, setCitationStats] = useState<{ year: number; month: number; count: number }[]>([]);
    const [downloadStats, setDownloadStats] = useState<{ year: number; month: number; count: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [books, setBooks] = useState<Work[]>([]);
    const [papers, setPapers] = useState<Work[]>([]);
    const [booksPage, setBooksPage] = useState(1);
    const [booksTotalPages, setBooksTotalPages] = useState(1);
    const [papersPage, setPapersPage] = useState(1);
    const [papersTotalPages, setPapersTotalPages] = useState(1);
    const BOOKS_LIMIT = 8;
    const PAPERS_LIMIT = 8;
    const [booksSearch, setBooksSearch] = useState('');
    const [papersSearch, setPapersSearch] = useState('');

    useEffect(() => {
        if (!userId) return;
        setLoading(true);
        Promise.all([
            getUserProfile(userId),
            getUserStatsById(userId),
            getUserCitationsPerMonthById(userId),
            getUserDownloadsPerMonthById(userId),
            getBooksByUserId(userId, booksPage, BOOKS_LIMIT, booksSearch),
            getPapersByUserId(userId, papersPage, PAPERS_LIMIT, papersSearch),
        ])
            .then(async ([userRes, statsRes, citationStatsRes, downloadStatsRes, booksRes, papersRes]) => {
                setUser(userRes.data);
                setStats(statsRes.data);
                setCitationStats(Array.isArray(citationStatsRes.data) ? citationStatsRes.data : []);
                setDownloadStats(Array.isArray(downloadStatsRes.data) ? downloadStatsRes.data : []);
                setBooksTotalPages(booksRes.data?.total_pages || 1);
                setPapersTotalPages(papersRes.data?.total_pages || 1);
                const booksArr = Array.isArray(booksRes.data?.data) ? booksRes.data.data : [];
                const papersArr = Array.isArray(papersRes.data?.data) ? papersRes.data.data : [];
                const booksWithStats = await Promise.all(
                    booksArr.map(async (b: any) => {
                        const stats = await getBookStats(b.id).then(r => r.data).catch(() => ({}));
                        return { ...b, type: 'book', citation_count: stats.citation_count || 0, download_count: stats.download_count || 0 };
                    })
                );
                setBooks(booksWithStats);
                const papersWithStats = await Promise.all(
                    papersArr.map(async (p: any) => {
                        const stats = await getPaperStats(p.id).then(r => r.data).catch(() => ({}));
                        return { ...p, type: 'paper', citation_count: stats.citation_count || 0, download_count: stats.download_count || 0 };
                    })
                );
                setPapers(papersWithStats);
                setWorks([...booksWithStats, ...papersWithStats]);
                setError('');
            })
            .catch(() => setError('Failed to load user info'))
            .finally(() => setLoading(false));
    }, [userId, booksPage, papersPage, booksSearch, papersSearch]);

    // Calculate h-index and i10-index
    const hIndex = (() => {
        if (!Array.isArray(works) || works.length === 0) return 0;
        const citations = works.map(w => w.citation_count || 0).sort((a, b) => b - a);
        let h = 0;
        for (let i = 0; i < citations.length; i++) {
            if (citations[i] >= i + 1) h = i + 1;
            else break;
        }
        return h;
    })();
    const i10Index = Array.isArray(works) ? works.filter(w => (w.citation_count || 0) >= 10).length : 0;

    if (loading) {
        return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">Loading...</div>;
    }
    if (error || !user) {
        return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">{error || 'User not found'}</div>;
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">
                {/* Left: Profile & Stats */}
                <div className="w-full lg:w-1/3 space-y-6">
                    <div className="bg-white shadow rounded-lg p-8 flex flex-col items-center">
                        {user.profile_picture_url ? (
                            <img src={getFullUrl(user.profile_picture_url) || ''} alt={user.name} className="w-24 h-24 rounded-full object-cover border mb-4" />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-400 mb-4">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <h1 className="text-2xl font-bold text-gray-900 text-center">{user.name}</h1>
                        <p className="text-gray-600 text-center">{user.email}</p>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs justify-center">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">{user.role}</span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{user.user_type}</span>
                            {user.nim_nidn && <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">NIM/NIDN: {user.nim_nidn}</span>}
                            {user.faculty && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">{user.faculty}</span>}
                            {user.department && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">{user.department.name}</span>}
                        </div>
                        {user.address && <div className="mt-2 text-gray-500 text-sm text-center">{user.address}</div>}
                    </div>
                    {/* Stats Card */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <div className="text-lg font-bold text-gray-900">{stats?.totalBooks ?? 0}</div>
                                <div className="text-xs text-gray-500">Books</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-gray-900">{stats?.totalPapers ?? 0}</div>
                                <div className="text-xs text-gray-500">Papers</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-gray-900">{stats?.totalDownloads ?? 0}</div>
                                <div className="text-xs text-gray-500">Downloads</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-gray-900">{stats?.totalCitations ?? 0}</div>
                                <div className="text-xs text-gray-500">Citations</div>
                            </div>
                            <div className="text-center col-span-1">
                                <div className="text-lg font-bold text-gray-900">{hIndex}</div>
                                <div className="text-xs text-gray-500">h-index</div>
                            </div>
                            <div className="text-center col-span-1">
                                <div className="text-lg font-bold text-gray-900">{i10Index}</div>
                                <div className="text-xs text-gray-500">i10-index</div>
                            </div>
                        </div>
                    </div>
                    {/* Citation Graph */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-base font-semibold mb-2">Citations Per Month</h3>
                        <div className="h-40">
                            {/* Simple bar graph using citationStats */}
                            <svg width="100%" height="100%" viewBox="0 0 320 120">
                                {citationStats.length > 0 && (
                                    citationStats.map((stat, i) => {
                                        const max = Math.max(...citationStats.map(s => s.count));
                                        const barHeight = max ? (stat.count / max) * 100 : 0;
                                        return (
                                            <rect
                                                key={i}
                                                x={i * 25 + 10}
                                                y={120 - barHeight}
                                                width={20}
                                                height={barHeight}
                                                fill="#38b36c"
                                            />
                                        );
                                    })
                                )}
                            </svg>
                            <div className="flex justify-between text-xs mt-2">
                                {citationStats.map((stat, i) => (
                                    <span key={i}>{stat.month}/{stat.year.toString().slice(-2)}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Downloads Graph */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-base font-semibold mb-2">Downloads Per Month</h3>
                        <div className="h-40">
                            <svg width="100%" height="100%" viewBox="0 0 320 120">
                                {downloadStats.length > 0 && (
                                    downloadStats.map((stat, i) => {
                                        const max = Math.max(...downloadStats.map(s => s.count));
                                        const barHeight = max ? (stat.count / max) * 100 : 0;
                                        return (
                                            <rect
                                                key={i}
                                                x={i * 25 + 10}
                                                y={120 - barHeight}
                                                width={20}
                                                height={barHeight}
                                                fill="#2563eb"
                                            />
                                        );
                                    })
                                )}
                            </svg>
                            <div className="flex justify-between text-xs mt-2">
                                {downloadStats.map((stat, i) => (
                                    <span key={i}>{stat.month}/{stat.year.toString().slice(-2)}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                {/* Right: Works List */}
                <div className="w-full lg:w-2/3 space-y-6">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Books</h2>
                        <div className="mb-4">
                            <SearchBar
                                value={booksSearch}
                                onChange={e => setBooksSearch(e.target.value)}
                                onSubmit={e => { e.preventDefault(); setBooksPage(1); }}
                                placeholder="Search books by title, author, subject, or DOI..."
                                buttonLabel="Search"
                                className="max-w-2xl"
                            />
                        </div>
                        {books.length === 0 ? (
                            <p className="text-gray-500">No books posted.</p>
                        ) : (
                            <div className="space-y-4">
                                {books.map(book => (
                                    <Link key={book.id} href={`/books/${book.id}`} className="block hover:bg-gray-50 rounded p-4 border transition">
                                        <div className="flex items-center gap-4">
                                            {book.cover_image_url ? (
                                                <img src={book.cover_image_url} alt={book.title} className="w-12 h-16 object-cover rounded" />
                                            ) : (
                                                <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center text-lg text-gray-400">📚</div>
                                            )}
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">{book.title}</div>
                                                <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                                    <span>Citations: <span className="font-bold text-green-700">{book.citation_count}</span></span>
                                                    <span>Downloads: <span className="font-bold text-blue-700">{book.download_count}</span></span>
                                                </div>
                                            </div>
                                            <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700 uppercase">Book</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                        <Pagination currentPage={booksPage} totalPages={booksTotalPages} onPageChange={setBooksPage} />
                    </div>
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Papers</h2>
                        <div className="mb-4">
                            <SearchBar
                                value={papersSearch}
                                onChange={e => setPapersSearch(e.target.value)}
                                onSubmit={e => { e.preventDefault(); setPapersPage(1); }}
                                placeholder="Search papers by title, author, abstract, keywords, or DOI..."
                                buttonLabel="Search"
                                className="max-w-2xl"
                            />
                        </div>
                        {papers.length === 0 ? (
                            <p className="text-gray-500">No papers posted.</p>
                        ) : (
                            <div className="space-y-4">
                                {papers.map(paper => (
                                    <Link key={paper.id} href={`/papers/${paper.id}`} className="block hover:bg-gray-50 rounded p-4 border transition">
                                        <div className="flex items-center gap-4">
                                            {paper.cover_image_url ? (
                                                <img src={paper.cover_image_url} alt={paper.title} className="w-12 h-16 object-cover rounded" />
                                            ) : (
                                                <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center text-lg text-gray-400">📄</div>
                                            )}
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">{paper.title}</div>
                                                <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                                    <span>Citations: <span className="font-bold text-green-700">{paper.citation_count}</span></span>
                                                    <span>Downloads: <span className="font-bold text-blue-700">{paper.download_count}</span></span>
                                                </div>
                                            </div>
                                            <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700 uppercase">Paper</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                        <Pagination currentPage={papersPage} totalPages={papersTotalPages} onPageChange={setPapersPage} />
                    </div>
                </div>
            </div>
        </div>
    );
} 