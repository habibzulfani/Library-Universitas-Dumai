import React from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    type = 'danger',
    isLoading = false
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const getIconColor = () => {
        switch (type) {
            case 'danger':
                return 'text-red-600';
            case 'warning':
                return 'text-yellow-600';
            case 'info':
                return 'text-blue-600';
            default:
                return 'text-red-600';
        }
    };

    const getIconBgColor = () => {
        switch (type) {
            case 'danger':
                return 'bg-red-100';
            case 'warning':
                return 'bg-yellow-100';
            case 'info':
                return 'bg-blue-100';
            default:
                return 'bg-red-100';
        }
    };

    const getConfirmButtonColor = () => {
        switch (type) {
            case 'danger':
                return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
            case 'warning':
                return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
            case 'info':
                return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
            default:
                return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
                <div className="p-6">
                    <div className="flex items-center justify-center mb-4">
                        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${getIconBgColor()}`}>
                            <ExclamationTriangleIcon className={`h-6 w-6 ${getIconColor()}`} />
                        </div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            {message}
                        </p>
                        <div className="flex justify-center space-x-3">
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={`px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${getConfirmButtonColor()} disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
                            >
                                {isLoading && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                )}
                                {confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 