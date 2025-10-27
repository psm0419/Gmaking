import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchAllInventory, giveItemToUser } from '../../api/admin/adminApi';
import { Search, Gift } from 'lucide-react';

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

const INCUBATOR_PRODUCT_IDS = [4, 5];

const InventoryManagementTab = ({ onUserRefresh }) => {
    const { token, user } = useAuth();
    const [inventory, setInventory] = useState([]);
    const [criteria, setCriteria] = useState(initialCriteria);
    const [pagination, setPagination] = useState({ totalPages: 1, totalCount: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tempSearchKeyword, setTempSearchKeyword] = useState('');
    const [isGiveItemModalOpen, setIsGiveItemModalOpen] = useState(false);
    const [targetUserId, setTargetUserId] = useState('');
    const [targetProductId, setTargetProductId] = useState(4);
    const [quantity, setQuantity] = useState(1);

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

    const handleGiveItem = async (e) => {
        e.preventDefault();

        if (!targetUserId || !targetProductId || quantity <= 0) {
            alert('사용자 ID, 상품, 수량을 올바르게 입력해주세요.');
            return;
        }

        if (!window.confirm(`${PRODUCT_NAME_MAP[targetProductId]} ${quantity}개를 사용자 ID: ${targetUserId} 에게 지급하시겠습니까?`)) {
            return;
        }

        try {
            setIsLoading(true);
            await giveItemToUser(token, {
                userId: targetUserId,
                productId: parseInt(targetProductId),
                quantity: quantity
            });

            alert(`${PRODUCT_NAME_MAP[targetProductId]} ${quantity}개 지급이 성공적으로 완료되었습니다.`);

            // 상태 초기화 및 모달 닫기
            setIsGiveItemModalOpen(false);
            setTargetUserId('');
            setTargetProductId(4);
            setQuantity(1);

            // 인벤토리 목록 새로고침
            loadInventory();

            if (onUserRefresh) {
                onUserRefresh();
            }

        } catch (err) {
            const errorMessage = err.response?.data || '아이템 지급 중 오류가 발생했습니다.';
            setError(errorMessage);
            alert(`아이템 지급 실패: ${errorMessage}`);
        } finally {
            setIsLoading(false);
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

                <button
                    onClick={() => setIsGiveItemModalOpen(true)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition whitespace-nowrap"
                >
                    <Gift className="w-5 h-5 mr-2" />
                    아이템 지급 (부화권)
                </button>

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

                {isGiveItemModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-gray-700 p-6 rounded-lg shadow-2xl w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4 text-white">아이템 지급</h2>
                            <form onSubmit={handleGiveItem}>
                                <div className="mb-4">
                                    <label htmlFor="userId" className="block text-sm font-medium text-gray-300 mb-1">사용자 ID</label>
                                    <input
                                        id="userId"
                                        type="text"
                                        value={targetUserId}
                                        onChange={(e) => setTargetUserId(e.target.value)}
                                        className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:ring-green-500 focus:border-green-500"
                                        placeholder="지급할 사용자 ID를 입력하세요"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="productId" className="block text-sm font-medium text-gray-300 mb-1">상품 (부화권)</label>
                                    <select
                                        id="productId"
                                        value={targetProductId}
                                        onChange={(e) => setTargetProductId(e.target.value)}
                                        className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:ring-green-500 focus:border-green-500"
                                        required
                                    >
                                        {INCUBATOR_PRODUCT_IDS.map(id => (
                                            <option key={id} value={id}>
                                                {PRODUCT_NAME_MAP[id]} (ID: {id})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-6">
                                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-1">수량</label>
                                    <input
                                        id="quantity"
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        min="1"
                                        className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:ring-green-500 focus:border-green-500"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsGiveItemModalOpen(false)}
                                        className="px-4 py-2 text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500 transition"
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition"
                                    >
                                        {isLoading ? '지급 중...' : '아이템 지급'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
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
                                <div className="text-sm font-medium text-white-400 max-w-[160px]">{item.userId}</div>
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