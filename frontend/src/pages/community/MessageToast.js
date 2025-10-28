// src/components/modals/MessageToast.jsx
import React from 'react';
import { XCircle, ThumbsUp } from 'lucide-react';

const MessageToast = ({ message, isError, onClose }) => {
    if (!message) return null;

    const bgColor = isError ? 'bg-red-600' : 'bg-yellow-500';
    const textColor = isError ? 'text-white' : 'text-gray-900';
    const icon = isError ? <XCircle className="w-5 h-5 mr-2" /> : <ThumbsUp className="w-5 h-5 mr-2" />;

    return (
        <div className="fixed top-20 right-5 z-50">
            <div className={`flex items-center ${bgColor} ${textColor} p-4 rounded-lg shadow-xl transition-opacity duration-300`} style={{ minWidth: '300px' }}>
                {icon}
                <span className="font-semibold">{message}</span>
                <button onClick={onClose} className="ml-auto opacity-75 hover:opacity-100 transition">
                    <XCircle className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default MessageToast;