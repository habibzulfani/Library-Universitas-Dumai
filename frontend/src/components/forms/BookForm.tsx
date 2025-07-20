import { XMarkIcon, PlusIcon, XCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useBookForm } from '@/hooks/useBookForm';
import { Book } from '@/lib/api';
import MetadataExtractor from './MetadataExtractor';

interface BookFormProps {
    editingBook?: Book | null;
    onClose: () => void;
    onSuccess: () => void;
    isAdmin?: boolean;
}

export default function BookForm({
    editingBook,
    onClose,
    onSuccess,
    isAdmin = false,
}: BookFormProps) {
    const {
        bookFormData,
        setBookFormData,
        handleBookSubmit,
        handleBookCoverChange,
        handleBookFileChange,
        handleAddAuthor,
        handleEditAuthor,
        handleRemoveAuthor,
        handleKeyPress,
        isSubmitting,
        coverPreview,
        existingFile,
        existingFileUrl,
    } = useBookForm({
        editingBook,
        onSuccess,
        isAdmin,
    });

    const handleMetadataExtracted = (metadata: any, file?: File) => {
        setBookFormData(prev => ({
            ...prev,
            title: metadata.title || "",
            publisher: metadata.publisher || "",
            published_year: metadata.year ? String(metadata.year) : "",
            isbn: metadata.isbn || "",
            subject: metadata.subject || "",
            language: metadata.language || "",
            pages: metadata.pages || "",
            summary: metadata.abstract || metadata.summary || "",
            authors: Array.isArray(metadata.authors) ? metadata.authors : [],
            author: Array.isArray(metadata.authors) && metadata.authors.length > 0 ? metadata.authors[0] : "",
            file: file || prev.file,
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setBookFormData({ ...bookFormData, [name]: value });
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Don't automatically add author from input field - user must click Add button
        handleBookSubmit(e);
    };

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <form onSubmit={handleFormSubmit} className="space-y-6">
                    {/* Metadata Extractor */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                            <SparklesIcon className="h-5 w-5 text-blue-500" />
                            <h3 className="text-lg font-medium text-gray-900">Auto-fill with AI</h3>
                        </div>
                        <MetadataExtractor
                            onMetadataExtracted={handleMetadataExtracted}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                name="title"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4cae8a] focus:border-[#4cae8a]"
                                value={bookFormData.title}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Authors <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="author"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4cae8a] focus:border-[#4cae8a]"
                                    value={bookFormData.author}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Type author name and click Add"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddAuthor}
                                    className="px-4 py-2 bg-[#4cae8a] text-white rounded-md hover:bg-[#357a5b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4cae8a]"
                                >
                                    Add
                                </button>
                            </div>
                            {bookFormData.authors.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {bookFormData.authors.map((author, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#4cae8a] text-white"
                                        >
                                            {author}
                                            <button
                                                type="button"
                                                onClick={() => handleEditAuthor(index)}
                                                className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#357a5b] focus:outline-none"
                                                title="Edit author"
                                            >
                                                <PlusIcon className="h-3 w-3" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveAuthor(index)}
                                                className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#357a5b] focus:outline-none"
                                            >
                                                <span className="sr-only">Remove author</span>
                                                <XCircleIcon className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Publisher</label>
                            <input
                                type="text"
                                name="publisher"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4cae8a] focus:border-[#4cae8a]"
                                value={bookFormData.publisher}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Published Year</label>
                            <input
                                type="number"
                                name="published_year"
                                min="1800"
                                max={new Date().getFullYear() + 1}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4cae8a] focus:border-[#4cae8a]"
                                value={bookFormData.published_year}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
                            <input
                                type="text"
                                name="isbn"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4cae8a] focus:border-[#4cae8a]"
                                value={bookFormData.isbn}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                            <input
                                type="text"
                                name="subject"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4cae8a] focus:border-[#4cae8a]"
                                value={bookFormData.subject}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                            <select
                                name="language"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4cae8a] focus:border-[#4cae8a]"
                                value={bookFormData.language}
                                onChange={handleChange}
                            >
                                <option value="English">English</option>
                                <option value="Indonesian">Indonesian</option>
                                <option value="Spanish">Spanish</option>
                                <option value="French">French</option>
                                <option value="German">German</option>
                                <option value="Chinese">Chinese</option>
                                <option value="Japanese">Japanese</option>
                                <option value="Korean">Korean</option>
                                <option value="Arabic">Arabic</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pages</label>
                            <input
                                type="text"
                                name="pages"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4cae8a] focus:border-[#4cae8a]"
                                value={bookFormData.pages}
                                onChange={handleChange}
                                placeholder="e.g., 300, xii + 300 hlm.; 21 cm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                        <textarea
                            name="summary"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4cae8a] focus:border-[#4cae8a]"
                            rows={4}
                            value={bookFormData.summary}
                            onChange={handleChange}
                            placeholder="Enter a brief summary of the book..."
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Book File (PDF, max 32MB)
                            </label>
                            <div className="mt-1 flex items-center">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleBookFileChange}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#4cae8a] file:text-white hover:file:bg-[#357a5b]"
                                />
                            </div>
                            {existingFile && !bookFormData.file && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        Current file: {existingFile}
                                    </p>
                                    {existingFileUrl && (
                                        <a
                                            href={existingFileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-[#38b36c] hover:text-[#2e8c55]"
                                        >
                                            View current file
                                        </a>
                                    )}
                                </div>
                            )}
                            {bookFormData.file && (
                                <p className="mt-2 text-sm text-gray-500">
                                    New file selected: {bookFormData.file.name}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cover Image
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#4cae8a] file:text-white hover:file:bg-[#357a5b]"
                                onChange={handleBookCoverChange}
                            />
                            {coverPreview && (
                                <div className="mt-2">
                                    <img
                                        src={coverPreview}
                                        alt="Cover preview"
                                        className="h-32 w-auto object-cover rounded"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#38b36c] rounded-md hover:bg-[#2e8c55] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38b36c] disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : editingBook ? 'Update Book' : 'Add Book'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 