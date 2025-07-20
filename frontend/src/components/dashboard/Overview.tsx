import { Book, Paper } from '@/lib/api';

interface OverviewProps {
    books: Book[];
    papers: Paper[];
    loading: boolean;
    stats: { totalBooks: number; totalPapers: number; totalDownloads: number; totalCitations: number };
}

export function Overview({ books, papers, loading, stats }: OverviewProps) {
    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-[#38b36c] rounded-md flex items-center justify-center">
                            <span className="text-white text-sm font-medium">📚</span>
                        </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">My Books</dt>
                            <dd className="text-lg font-medium text-gray-900">{stats.totalBooks}</dd>
                        </dl>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-[#38b36c] rounded-md flex items-center justify-center">
                            <span className="text-white text-sm font-medium">📄</span>
                        </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">My Papers</dt>
                            <dd className="text-lg font-medium text-gray-900">{stats.totalPapers}</dd>
                        </dl>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-[#38b36c] rounded-md flex items-center justify-center">
                            <span className="text-white text-sm font-medium">⬇️</span>
                        </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Downloads</dt>
                            <dd className="text-lg font-medium text-gray-900">{stats.totalDownloads}</dd>
                        </dl>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-[#38b36c] rounded-md flex items-center justify-center">
                            <span className="text-white text-sm font-medium">🔗</span>
                        </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Citations</dt>
                            <dd className="text-lg font-medium text-gray-900">{stats.totalCitations}</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
} 