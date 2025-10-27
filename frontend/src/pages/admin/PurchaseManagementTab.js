import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchAllPurchases } from '../../api/admin/adminApi';
import { Search } from 'lucide-react';

const initialCriteria = {
    page: 1,
    pageSize: 6,
    searchKeyword: '',
    filterStatus: '',
};

const PurchaseManagementTab = () => {
    const { token, user } = useAuth();
    const [purchases, setPurchases] = useState([]);
    const [criteria, setCriteria] = useState(initialCriteria);
    const [pagination, setPagination] = useState({ totalPages: 1, totalCount: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tempSearchKeyword, setTempSearchKeyword] = useState('');

    const loadPurchases = useCallback(async () => {
        if (user?.role !== 'ADMIN' || !token) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchAllPurchases(token, criteria);
            setPurchases(data.list);
            setPagination({ 
                totalPages: data.totalPages, 
                totalCount: data.totalCount,
                currentPage: data.currentPage, 
            });
        } catch (err) {
            console.error("구매 내역 조회 실패:", err);
            setError('구매 내역 목록을 불러오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [token, user, criteria]);

    useEffect(() => {
        loadPurchases();
    }, [loadPurchases]);
    
    // 검색 및 필터 핸들러
    const handleTempSearchChange = (e) => {
        setTempSearchKeyword(e.target.value);
    };
    
    const handleStatusFilterChange = (e) => {
        setCriteria(prev => ({ ...prev, filterStatus: e.target.value, page: 1 })); 
    };
    
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCriteria(prev => ({ ...prev, searchKeyword: tempSearchKeyword, page: 1 }));
    };

    // 페이지 변경 핸들러
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setCriteria(prev => ({ ...prev, page: newPage }));
        }
    };

    if (isLoading) return <div className="text-center py-10 text-yellow-400">구매 내역 목록 로딩 중...</div>;
    if (error) return <div className="text-center py-10 text-red-400">에러: {error}</div>;

    return (
        <div className="overflow-x-auto">
            <div className="flex items-center justify-between mb-4 space-x-4">
                {/* 상태 필터링 */}
                <select 
                    value={criteria.filterStatus} 
                    onChange={handleStatusFilterChange}
                    className="p-2 border rounded bg-gray-700 border-gray-600 text-gray-300 w-32"
                >
                    <option value="">전체 상태</option>
                    <option value="PAID">결제 완료 (PAID)</option>
                    <option value="CANCELLED">결제 취소 (CANCELLED)</option>
                    <option value="REFUNDED">환불 완료 (REFUNDED)</option>
                    <option value="READY">결제 대기 (READY)</option>
                </select>
                
                {/* 검색 입력 필드 */}
                <form onSubmit={handleSearchSubmit} className="flex flex-grow max-w-md">
                    <input
                        type="text"
                        placeholder="닉네임, 상품명 검색"
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
                        <th className="px-4 py-3 text-left min-w-[80px]">ID</th>
                        <th className="px-4 py-3 text-left min-w-[120px]">ID / 닉네임</th>
                        <th className="px-4 py-3 text-left min-w-[180px]">상품명 (ID)</th>
                        <th className="px-4 py-3 text-left min-w-[100px]">결제 금액</th>
                        <th className="px-4 py-3 text-left min-w-[80px]">상태</th>
                        <th className="px-4 py-3 text-left min-w-[100px]">결제 수단</th>
                        <th className="px-4 py-3 text-left min-w-[130px]">승인일</th>
                        <th className="px-4 py-3 text-left min-w-[130px]">주문 번호</th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {purchases.map((p) => (
                        <tr key={p.purchaseId} className="hover:bg-gray-700/70 transition duration-150 ease-in-out">
                            <td className="px-4 py-3 text-sm text-gray-300">{p.purchaseId}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-medium text-white-400 truncate max-w-[160px]">{p.userId}</div>
                                <div className="text-xs text-gray-400 truncate">{p.userNickname}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300 truncate max-w-[200px]">{p.productNameSnap} ({p.productId})</td>
                            <td className="px-4 py-3 text-sm text-green-400 font-bold">{p.totalPriceSnap?.toLocaleString() || p.amountPaid?.toLocaleString()} 원</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${p.status === 'PAID' ? 'bg-green-600/20 text-green-400' : p.status === 'CANCELLED' || p.status === 'REFUNDED' ? 'bg-red-600/20 text-red-400' : 'bg-gray-600/20 text-gray-400'}`}>
                                    {p.status}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">{p.method || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-400">{p.approvedAt ? new Date(p.approvedAt).toLocaleDateString() : '-'}</td>
                            <td className="px-4 py-3 text-xs text-gray-400 truncate max-w-[130px]">{p.merchantUid}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {purchases.length === 0 && (<div className="py-8 text-center text-gray-500">조회된 구매 내역이 없습니다.</div>)}

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

export default PurchaseManagementTab;