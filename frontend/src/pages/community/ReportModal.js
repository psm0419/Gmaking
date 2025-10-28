import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, Loader2 } from 'lucide-react';

const ReportModal = ({ show, loading, onClose, onSubmit }) => {
    const [reason, setReason] = useState('');
    const [detail, setDetail] = useState('');
    const [isDetailRequired, setIsDetailRequired] = useState(false);

    const reportOptions = [
        { value: 'SPAM', label: '스팸/홍보' },
        { value: 'PORNOGRAPHY', label: '음란물 또는 불법 정보' },
        { value: 'HATE_SPEECH', label: '혐오 발언 또는 차별적 표현' },
        { value: 'HARASSMENT', label: '괴롭힘 및 따돌림' },
        { value: 'ETC', label: '기타 (상세 입력 필요)' },
    ];

    useEffect(() => {
        setIsDetailRequired(reason === 'ETC');
    }, [reason]);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        let finalReason = reason;
        if (!finalReason) {
            alert("신고 사유를 선택해주세요.");
            return;
        }
        if (isDetailRequired) {
            if (detail.trim().length < 5) {
                alert("기타 사유의 경우 5자 이상의 상세 내용을 입력해주세요.");
                return;
            }
            finalReason = `${reason}: ${detail.trim()}`;
        }
        onSubmit(finalReason);
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-red-700">
                <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
                    <h3 className="text-xl font-bold text-red-400 flex items-center">
                        <ShieldAlert className="w-6 h-6 mr-2" /> 게시글 신고
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                    허위 신고 시 불이익을 받을 수 있습니다. 정확한 사유를 선택해주세요.
                </p>
                <form onSubmit={handleFormSubmit}>
                    <div className="space-y-3 mb-5">
                        {reportOptions.map((option) => (
                            <label key={option.value} className="flex items-center text-white cursor-pointer">
                                <input
                                    type="radio"
                                    name="reportReason"
                                    value={option.value}
                                    checked={reason === option.value}
                                    onChange={(e) => {
                                        setReason(e.target.value);
                                        if (e.target.value !== 'ETC') setDetail('');
                                    }}
                                    className="h-4 w-4 text-red-500 border-gray-600 focus:ring-red-500 bg-gray-700"
                                />
                                <span className="ml-3 text-sm">{option.label}</span>
                            </label>
                        ))}
                    </div>
                    {isDetailRequired && (
                        <div className="mb-5">
                            <label htmlFor="reportDetail" className="block text-sm font-medium text-gray-300 mb-1">
                                상세 사유 (최소 5자)
                            </label>
                            <textarea
                                id="reportDetail"
                                value={detail}
                                onChange={(e) => setDetail(e.target.value)}
                                rows="3"
                                className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600 focus:ring-red-500 focus:border-red-500 resize-none"
                                placeholder="신고 사유를 구체적으로 작성해주세요."
                                disabled={loading}
                            />
                        </div>
                    )}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-500 transition disabled:opacity-50"
                            disabled={loading}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-500 transition disabled:opacity-50 flex items-center"
                            disabled={loading || !reason || (isDetailRequired && detail.trim().length < 5)}
                        >
                            {loading && <Loader2 className="animate-spin h-5 w-5 mr-2" />}
                            신고 접수
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;