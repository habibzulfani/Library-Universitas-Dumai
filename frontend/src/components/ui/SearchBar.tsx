import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SearchBarProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    placeholder?: string;
    buttonLabel?: string;
    className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChange,
    onSubmit,
    placeholder = 'Search...',
    buttonLabel = 'Search',
    className = '',
}) => (
    <form onSubmit={onSubmit} className={`relative w-full ${className}`}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
            type="search"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[#38b36c] focus:border-[#38b36c]"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button
                type="submit"
                className="bg-[#38b36c] text-white px-4 py-2 rounded-md hover:bg-[#2e8c55] focus:outline-none focus:ring-2 focus:ring-[#38b36c]"
            >
                {buttonLabel}
            </button>
        </div>
    </form>
);

export default SearchBar; 