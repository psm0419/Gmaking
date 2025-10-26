import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchAllPurchases } from '../../api/admin/adminApi';

const PurchaseManagementTab = () => {
    const { token, user } = useAuth();
    const [purchases, setPurchases] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadPurchases = useCallback(async () => {
        if (user?.role !== 'ADMIN' || !token) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchAllPurchases(token);
            setPurchases(data);
        } catch (err) {
            console.error("구매 내역 조회 실패:", err);
            setError('구매 내역 목록을 불러오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [token, user]);

    useEffect(() => {
        loadPurchases();
    }, [loadPurchases]);

    // 로딩 및 에러 UI
    if (isLoading) return <div className="text-center py-10 text-yellow-400">구매 내역 목록 로딩 중...</div>;
    if (error) return <div className="text-center py-10 text-red-400">에러: {error}</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm text-gray-200">
                <thead className="bg-gray-700 text-xs uppercase font-semibold tracking-wider">
                    <tr>
                        <th className="px-4 py-3 text-left min-w-[80px]">ID</th>
                        <th className="px-4 py-3 text-left min-w-[120px]">닉네임</th>
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
                            <td className="px-4 py-3 text-sm font-semibold text-yellow-400">{p.userNickname || p.userId}</td>
                            <td className="px-4 py-3 text-sm text-gray-300 truncate max-w-[200px]">{p.productNameSnap} ({p.productId})</td>
                            <td className="px-4 py-3 text-sm text-green-400 font-bold">{p.totalPriceSnap?.toLocaleString() || p.amountPaid?.toLocaleString()} {p.currency}</td>
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
            {purchases.length === 0 && (<div className="py-8 text-center text-gray-500">구매 내역이 비어 있습니다.</div>)}
        </div>
    );
};

export default PurchaseManagementTab;