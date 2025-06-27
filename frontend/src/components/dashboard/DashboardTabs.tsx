interface DashboardTabsProps {
    activeTab: 'overview' | 'books' | 'papers';
    onTabChange: (tab: 'overview' | 'books' | 'papers') => void;
}

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
    return (
        <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
                {[
                    { id: 'overview', name: 'Overview', icon: '📊' },
                    { id: 'books', name: 'My Books', icon: '📚' },
                    { id: 'papers', name: 'My Papers', icon: '📄' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id as 'overview' | 'books' | 'papers')}
                        className={`${activeTab === tab.id
                                ? 'border-[#38b36c] text-[#38b36c]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.name}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
} 