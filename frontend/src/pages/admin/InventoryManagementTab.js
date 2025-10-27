import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchAllInventory } from '../../api/admin/adminApi';
import { Search } from 'lucide-react';

const initialCriteria = {
    page: 1,
    pageSize: 6,
    searchKeyword: '',
    filterProductId: '', 
};

const PRODUCT_NAME_MAP = {
    1: '광고 제거 패스 (30일)',
    2: '부화기 패키지 (5개)',
    3: '부화기 대용량 (15개)',
    4: '부화기',
    5: '무료 지급 부화기',
};

const InventoryManagementTab = () => {
    const { token, user } = useAuth();
    const [inventory, setInventory] = useState([]);
    const [criteria, setCriteria] = useState(initialCriteria);
    const [pagination, setPagination] = useState({ totalPages: 1, totalCount: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tempSearchKeyword, setTempSearchKeyword] = useState('');

    const loadInventory = useCallback(async () => {
        if (user?.role !== 'ADMIN' || !token) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchAllInventory(token, criteria);
            setInventory(data.list);
            setPagination({ 
                totalPages: data.totalPages, 
                totalCount: data.totalCount,
                currentPage: data.currentPage, 
            });
        } catch (err) {
            console.error("인벤토리 목록 조회 실패:", err);
            setError('인벤토리 목록을 불러오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [token, user, criteria]);

    useEffect(() => {
        loadInventory();
    }, [loadInventory]);
    
    // 검색 및 필터 핸들러
    const handleTempSearchChange = (e) => {
        setTempSearchKeyword(e.target.value);
    };
    
    const handleProductFilterChange = (e) => {
        const value = e.target.value === '' ? '' : parseInt(e.target.value);
        setCriteria(prev => ({ 
            ...prev, 
            filterProductId: value, 
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
            filterProductId: '', 
        }));
    };

    // 페이지 변경 핸들러
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setCriteria(prev => ({ ...prev, page: newPage }));
        }
    };


    if (isLoading) return <div className="text-center py-10 text-yellow-400">인벤토리 목록 로딩 중...</div>;
    if (error) return <div className="text-center py-10 text-red-400">에러: {error}</div>;

    return (
        <div className="overflow-x-auto">
            <div className="flex items-center justify-between mb-4 space-x-4">
                <select 
                    value={criteria.filterProductId} 
                    onChange={handleProductFilterChange}
                    className="p-2 border rounded bg-gray-700 border-gray-600 text-gray-300 w-32"
                >
                    <option value="">상품 ID</option>
                    <option value="1">광고 제거 패스 (30일)</option> 
                    <option value="2">부화기 패키지 (5개)</option>
                    <option value="3">부화기 대용량 (15개)</option>
                    <option value="4">부화기</option>
                    <option value="5">무료 지급 부화기</option>
                </select>
                
                {/* 검색 입력 필드 */}
                <form onSubmit={handleSearchSubmit} className="flex flex-grow max-w-md">
                    <input
                        type="text"
                        placeholder="닉네임 검색"
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
                        <th className="px-4 py-3 text-left min-w-[180px]">상품</th>
                        <th className="px-4 py-3 text-left min-w-[80px]">보유 개수</th>
                        <th className="px-4 py-3 text-left min-w-[130px]">획득일</th>
                        <th className="px-4 py-3 text-left min-w-[130px]">만료일</th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {inventory.map((item) => (
                        <tr key={item.inventoryId} className="hover:bg-gray-700/70 transition duration-150 ease-in-out">
                            <td className="px-4 py-3 text-sm text-gray-300">{item.inventoryId}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-medium text-white-400 truncate max-w-[160px]">{item.userId}</div>
                                <div className="text-xs text-gray-400 truncate">{item.userNickname}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">{PRODUCT_NAME_MAP[item.productId]}</td>
                            <td className="px-4 py-3 text-sm text-green-400 font-bold text-center">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-gray-400">{new Date(item.acquiredDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm text-gray-400">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '무제한'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {inventory.length === 0 && (<div className="py-8 text-center text-gray-500">조회된 인벤토리 목록이 없습니다.</div>)}

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

export default InventoryManagementTab;