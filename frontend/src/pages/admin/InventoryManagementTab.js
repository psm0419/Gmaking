import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchAllInventory } from '../../api/admin/adminApi';

const InventoryManagementTab = () => {
    const { token, user } = useAuth();
    const [inventory, setInventory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadInventory = useCallback(async () => {
        if (user?.role !== 'ADMIN' || !token) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchAllInventory(token);
            setInventory(data);
        } catch (err) {
            console.error("인벤토리 목록 조회 실패:", err);
            setError('인벤토리 목록을 불러오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [token, user]);

    useEffect(() => {
        loadInventory();
    }, [loadInventory]);

    // 로딩 및 에러 UI
    if (isLoading) return <div className="text-center py-10 text-yellow-400">인벤토리 목록 로딩 중...</div>;
    if (error) return <div className="text-center py-10 text-red-400">에러: {error}</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm text-gray-200">
                <thead className="bg-gray-700 text-xs uppercase font-semibold tracking-wider">
                    <tr>
                        <th className="px-4 py-3 text-left min-w-[80px]">ID</th>
                        <th className="px-4 py-3 text-left min-w-[120px]">닉네임</th>
                        <th className="px-4 py-3 text-left min-w-[180px]">상품 ID</th>
                        <th className="px-4 py-3 text-left min-w-[80px]">보유 개수</th>
                        <th className="px-4 py-3 text-left min-w-[130px]">획득일</th>
                        <th className="px-4 py-3 text-left min-w-[130px]">만료일</th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {inventory.map((item) => (
                        <tr key={item.inventoryId} className="hover:bg-gray-700/70 transition duration-150 ease-in-out">
                            <td className="px-4 py-3 text-sm text-gray-300">{item.inventoryId}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-yellow-400">{item.userNickname || item.userId}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{item.productId}</td>
                            <td className="px-4 py-3 text-sm text-green-400 font-bold text-center">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-gray-400">{new Date(item.acquiredDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm text-gray-400">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '무제한'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {inventory.length === 0 && (<div className="py-8 text-center text-gray-500">인벤토리 목록이 비어 있습니다.</div>)}
        </div>
    );
};

export default InventoryManagementTab;