import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchAllReports, processReport } from '../../api/admin/adminApi';
import { Search } from 'lucide-react';

// 신고 대상 타입 옵션
const TARGET_TYPE_OPTIONS = [
    { value: '', label: '전체 대상' },
    { value: 'POST', label: '게시글 신고' },
    { value: 'COMMENT', label: '댓글 신고' },
];

// 신고 처리 상태 옵션
const STATUS_OPTIONS = [
    { value: '', label: '전체 상태' },
    { value: 'PENDING', label: '처리 대기 (PENDING)' },
    { value: 'REVIEWED', label: '검토 완료 (REVIEWED)' },
    { value: 'REJECTED', label: '거절 (REJECTED)' },
    { value: 'APPROVED', label: '승인/조치 (APPROVED)' },
];

const REPORT_REASON_OPTIONS = [
    { value: 'SPAM', label: '스팸/홍보' },
    { value: 'PORNOGRAPHY', label: '음란물 또는 불법 정보' },
    { value: 'HATE_SPEECH', label: '혐오 발언 또는 차별적 표현' },
    { value: 'HARASSMENT', label: '괴롭힘 및 따돌림' },
    { value: 'ETC', label: '기타' }
];

const REASON_CODE_MAP = REPORT_REASON_OPTIONS.reduce((acc, option) => {
    acc[option.value] = option.label;
    return acc;
}, {});

const getReasonLabel = (code) => {
    return REASON_CODE_MAP[code] || code;
};

const initialCriteria = {
    page: 1,
    pageSize: 7,
    searchKeyword: '',
    filterType: '',
    filterStatus: 'PENDING',
};

const ReportManagementTab = () => {
    const { token, user } = useAuth();
    const [reports, setReports] = useState([]);
    const [criteria, setCriteria] = useState(initialCriteria);
    const [pagination, setPagination] = useState({ totalPages: 1, totalCount: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tempSearchKeyword, setTempSearchKeyword] = useState('');
    const navigate = useNavigate();

    const loadReports = useCallback(async () => {
        if (user?.role !== 'ADMIN' || !token) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchAllReports(token, criteria);
            setReports(data.list);
            setPagination({
                totalPages: data.totalPages,
                totalCount: data.totalCount,
                currentPage: data.currentPage,
            });
        } catch (err) {
            console.error("신고 목록 조회 실패:", err);
            setError('신고 목록을 불러오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [token, user, criteria]);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    const handleProcessReport = useCallback(async (reportId, newStatus) => {
        if (!window.confirm(`선택한 신고(ID: ${reportId})를 [${newStatus}] 상태로 처리하시겠습니까?\n\n- APPROVED: 신고 대상(게시글/댓글)이 삭제 조치됩니다.\n- REJECTED/REVIEWED: 대상은 유지되고 신고 상태만 업데이트됩니다.`)) {
            return;
        }

        setIsLoading(true);
        try {
            await processReport(token, reportId, newStatus); // API 호출
            alert(`신고 ID ${reportId} 처리가 [${newStatus}]로 완료되었습니다.`);
            await loadReports();
        } catch (err) {
            console.error(`신고 처리 실패 (ID: ${reportId}, Status: ${newStatus}):`, err);
            const errorMessage = err.response?.data || '신고 처리에 실패했습니다.';
            alert(`처리 실패: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [token, loadReports]);

    const handleTempSearchChange = (e) => setTempSearchKeyword(e.target.value);

    const handleTypeFilterChange = (e) => {
        setCriteria(prev => ({
            ...prev,
            filterType: e.target.value,
            page: 1,
            searchKeyword: '',
        }));
        setTempSearchKeyword('');
    };

    const handleStatusFilterChange = (e) => {
        setCriteria(prev => ({
            ...prev,
            filterStatus: e.target.value,
            page: 1,
            searchKeyword: '',
        }));
        setTempSearchKeyword('');
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCriteria(prev => ({
            ...prev,
            searchKeyword: tempSearchKeyword,
            page: 1,
        }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setCriteria(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleCopy = useCallback((text, label) => {
        if (text) {
            navigator.clipboard.writeText(text).then(() => {
                alert(`${label} ${text}가(이) 복사되었습니다.`);
            }).catch(err => {
                console.error('복사 실패:', err);
                alert('복사에 실패했습니다. 브라우저 설정을 확인해 주세요.');
            });
        }
    }, []);

    const handleNavigateTarget = useCallback((navigationId) => {
        if (navigationId) {
            const path = `/community/${navigationId}`;
            navigate(path);
        } else {
            alert('이동할 게시글 ID를 찾을 수 없습니다. (게시글/댓글이 삭제되었을 수 있습니다)');
        }
    }, [navigate]);


    if (isLoading) return <div className="text-center py-10 text-yellow-400">신고 목록 로딩 중...</div>;
    if (error) return <div className="text-center py-10 text-red-400">에러: {error}</div>;

    return (
        <div className="overflow-x-auto">
            <div className="flex items-center justify-between mb-4 space-x-4">
                {/* 신고 대상 타입 필터 */}
                <select
                    value={criteria.filterType}
                    onChange={handleTypeFilterChange}
                    className="p-2 border rounded bg-gray-700 border-gray-600 text-gray-300 w-40"
                >
                    {TARGET_TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>

                {/* 신고 처리 상태 필터 */}
                <select
                    value={criteria.filterStatus}
                    onChange={handleStatusFilterChange}
                    className="p-2 border rounded bg-gray-700 border-gray-600 text-gray-300 w-48"
                >
                    {STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>

                {/* 검색 입력 필드 (신고자 닉네임 또는 상세 내용 검색) */}
                <form onSubmit={handleSearchSubmit} className="flex flex-grow max-w-md">
                    <input
                        type="text"
                        placeholder="신고자 닉네임 또는 상세 내용 검색"
                        value={tempSearchKeyword}
                        onChange={handleTempSearchChange}
                        className="p-2 border rounded-l bg-gray-700 border-gray-600 text-gray-300 w-full"
                    />
                    <button type="submit" className="p-2 bg-gray-600 hover:bg-blue-700 rounded-r text-white flex items-center">
                        <Search className="w-5 h-5" />
                    </button>
                </form>
            </div>

            <table className="w-full border-collapse text-sm text-gray-200">
                <thead className="bg-gray-700 text-xs uppercase font-semibold tracking-wider">
                    <tr>
                        <th className="px-4 py-3 text-left min-w-[50px]">ID</th>
                        <th className="px-4 py-3 text-left min-w-[70px]">대상 타입</th>
                        <th className="px-4 py-3 text-left min-w-[120px]">대상 ID</th>
                        <th className="px-4 py-3 text-left min-w-[140px]">신고자</th>
                        <th className="px-4 py-3 text-left min-w-[100px]">사유 코드</th>
                        <th className="px-4 py-3 text-left w-full min-w-[200px]">상세 내용</th>
                        <th className="px-4 py-3 text-center min-w-[100px]">상태</th>
                        <th className="px-4 py-3 text-left min-w-[100px]">접수일</th>
                        <th className="px-4 py-3 text-left min-w-[120px]">처리 관리자</th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {reports.map((item) => (
                        <tr key={item.reportId} className="hover:bg-gray-700/70 transition duration-150 ease-in-out">
                            <td className="px-4 py-3 text-sm text-gray-300">{item.reportId}</td>
                            <td
                                className="px-4 py-3 text-sm text-yellow-400 cursor-pointer hover:text-yellow-300 transition"
                                onClick={() => handleNavigateTarget(item.navigationId)}
                            >
                                {item.targetType}
                            </td>
                            <td
                                className="px-4 py-3 text-sm font-semibold text-white max-w-[120px] truncate cursor-pointer"
                                title={`${item.targetId} (${item.targetUserId})`}
                                onClick={() => handleCopy(item.targetUserId, '대상 작성자 ID')}
                            >
                                {item.targetId} ({item.targetUserId})
                            </td>
                            <td
                                className="px-4 py-3 text-sm font-semibold text-white max-w-[140px] truncate cursor-pointer"
                                title={`${item.reporterNickname} (${item.reporterId})`}
                                onClick={() => handleCopy(item.reporterId, '신고자 ID')}
                            >
                                {item.reporterNickname} ({item.reporterId})
                            </td>
                            <td className="px-4 py-3 text-sm text-red-400">{getReasonLabel(item.reasonCode)}</td>
                            <td className="px-4 py-3 text-sm text-gray-300 truncate max-w-xs">{item.reasonDetail || '없음'}</td>
                            <td className="px-4 py-3 text-center">
                                {item.status === 'PENDING' ? (
                                    <div className="flex justify-center space-x-1">
                                        <button
                                            onClick={() => handleProcessReport(item.reportId, 'APPROVED')}
                                            className="px-2 py-1 border border-red-500 text-red-300 hover:bg-red-500 hover:text-white rounded-md text-xs transition whitespace-nowrap"
                                        >
                                            삭제 조치
                                        </button>
                                        <button
                                            onClick={() => handleProcessReport(item.reportId, 'REJECTED')}
                                            className="px-2 py-1 border border-green-500 text-green-300 hover:bg-green-500 hover:text-white rounded-md text-xs transition whitespace-nowrap"
                                        >
                                            거절
                                        </button>
                                        <button
                                            onClick={() => handleProcessReport(item.reportId, 'REVIEWED')}
                                            className="px-2 py-1 border border-yellow-500 text-yellow-300 hover:bg-yellow-500 hover:text-white rounded-md text-xs transition whitespace-nowrap"
                                        >
                                            검토 완료
                                        </button>
                                    </div>
                                ) : (
                                    <span 
                                        className={`font-semibold text-xs py-1 px-2 rounded-full 
                                            ${item.status === 'APPROVED' ? 'bg-red-900/50 text-red-300' : 
                                            item.status === 'REJECTED' ? 'bg-green-900/50 text-green-300' : 
                                            'bg-yellow-900/50 text-yellow-300'}`}
                                    >
                                        {STATUS_OPTIONS.find(opt => opt.value === item.status)?.label.split(' ')[0] || item.status}
                                    </span>
                                )}
                            </td>

                            <td className="px-4 py-3 text-sm text-gray-400">{new Date(item.createdDate).toLocaleDateString()}</td>
                            <td
                                className="px-4 py-3 text-sm text-cyan-400 max-w-[120px] truncate cursor-pointer"
                                title={item.processorNickname || '대기 중'}
                                onClick={() => handleCopy(item.updatedBy, '처리 관리자 ID')}
                            >
                                {item.processorNickname || '대기 중'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {reports.length === 0 && (<div className="py-8 text-center text-gray-500">조회된 신고 목록이 없습니다.</div>)}

            {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-6">
                    <button
                        onClick={() => handlePageChange(criteria.page - 1)}
                        disabled={criteria.page <= 1}
                        className="px-3 py-1 border rounded bg-gray-700 text-gray-300 disabled:opacity-50 hover:bg-gray-600 transition"
                    >
                        이전
                    </button>
                    <span className="text-gray-300">
                        페이지 <span className="font-bold text-white">{criteria.page}</span> / {pagination.totalPages} (총 {pagination.totalCount}개)
                    </span>
                    <button
                        onClick={() => handlePageChange(criteria.page + 1)}
                        disabled={criteria.page >= pagination.totalPages}
                        className="px-3 py-1 border rounded bg-gray-700 text-gray-300 disabled:opacity-50 hover:bg-gray-600 transition"
                    >
                        다음
                    </button>
                </div>
            )}
        </div>
    );
};

export default ReportManagementTab;