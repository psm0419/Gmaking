import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchAllProducts, updateProduct, deleteProduct } from '../../api/admin/adminApi';
import { Search, Edit, Trash2, Save, X } from 'lucide-react'; // ✏️ Edit, Trash2, Save, X 아이콘 임포트

const SALE_STATUS_OPTIONS = [
    { value: '', label: '전체 판매 여부' },
    { value: 'Y', label: '판매 중 (Y)' },
    { value: 'N', label: '판매 중지 (N)' },
];

const PRODUCT_TYPE_OPTIONS = [
    { value: 'ENTITLEMENT', label: 'ENTITLEMENT' },
    { value: 'CONSUMABLE', label: 'CONSUMABLE' },
];

const CURRENCY_TYPE_OPTIONS = [
    { value: 'FREE', label: 'FREE' },
    { value: 'FLAT', label: 'FLAT' },
];

const initialCriteria = {
    page: 1,
    pageSize: 6,
    searchKeyword: '',
    filterType: '',
    filterIsSale: '',
};

const ProductManagementTab = () => {
    const { token, user } = useAuth();
    const [products, setProducts] = useState([]);
    const [criteria, setCriteria] = useState(initialCriteria);
    const [pagination, setPagination] = useState({ totalPages: 1, totalCount: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tempSearchKeyword, setTempSearchKeyword] = useState('');
    const [editingProduct, setEditingProduct] = useState(null);
    const [editData, setEditData] = useState({});

    const loadProducts = useCallback(async () => {
        if (user?.role !== 'ADMIN' || !token) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchAllProducts(token, criteria);
            setProducts(data.list);
            setPagination({
                totalPages: data.totalPages,
                totalCount: data.totalCount,
                currentPage: data.currentPage,
            });
            setEditingProduct(null); // 목록 로드 시 편집 상태 초기화
        } catch (err) {
            console.error("상품 목록 조회 실패:", err);
            setError('상품 목록을 불러오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [token, user, criteria]);

    const handleEditClick = (product) => {
        setEditingProduct(product.productId);
        setEditData({
            productId: product.productId,
            productName: product.productName,
            productType: product.productType,
            price: product.price,
            currencyType: product.currencyType,
            isSale: product.isSale,
            durationDays: product.durationDays,
            packSize: product.packSize,
            grantProductId: product.grantProductId,
            salePrice: product.salePrice,
        });
    };

    const handleCancelEdit = () => {
        setEditingProduct(null);
        setEditData({});
    };

    /**
     * 수정 데이터 변경
     */
    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 'Y' : 'N') : (
                name === 'price' || name === 'durationDays' || name === 'packSize' || name === 'grantProductId' || name === 'salePrice'
                    ? (value === '' ? null : parseInt(value) || 0)
                    : value
            )
        }));
    };

    /**
     * 상품 정보 저장
     */
    const handleSaveEdit = async () => {
        if (!window.confirm(`[${editData.productName}] 상품 정보를 수정하시겠습니까?`)) return;

        try {
            const dataToSave = {
                ...editData,
                updatedBy: user.userId || 'ADMIN',
                price: editData.price === null ? null : Number(editData.price),
                durationDays: editData.durationDays === null ? null : Number(editData.durationDays),
                packSize: editData.packSize === null ? null : Number(editData.packSize),
                grantProductId: editData.grantProductId === null ? null : Number(editData.grantProductId),
                salePrice: editData.salePrice === null ? null : Number(editData.salePrice),
            };

            await updateProduct(token, editingProduct, dataToSave);
            alert('상품 정보가 성공적으로 수정되었습니다.');
            setEditingProduct(null);
            loadProducts(); // 목록 새로고침

        } catch (err) {
            console.error('상품 수정 실패:', err);
            setError(err.response?.data?.message || '상품 수정 중 오류가 발생했습니다.');
        }
    };

    /**
     * 상품 삭제
     */
    const handleDeleteProduct = async (productId, productName) => {
        if (!window.confirm(`[${productName}] 상품을 정말로 삭제하시겠습니까?\n\n*주의: 이 상품과 관련된 모든 기록(인벤토리, 구매 내역 등)은 연쇄적으로 삭제되지 않지만, 해당 상품이 인벤토리 등에 남아있다면 추후 문제가 발생할 수 있습니다. 신중하게 삭제하세요.`)) {
            return;
        }

        try {
            await deleteProduct(token, productId);
            alert(`[${productName}] 상품이 성공적으로 삭제되었습니다.`);

            const isLastItemOnPage = products.length === 1 && criteria.page > 1;
            if (isLastItemOnPage) {
                setCriteria(prev => ({ ...prev, page: prev.page - 1 }));
            } else {
                loadProducts();
            }

        } catch (err) {
            console.error('상품 삭제 실패:', err);
            setError(err.response?.data?.message || '상품 삭제 중 오류가 발생했습니다.');
        }
    };

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    // 검색 및 필터 핸들러
    const handleTempSearchChange = (e) => {
        setTempSearchKeyword(e.target.value);
    };

    // 판매 여부 필터 변경
    const handleSaleFilterChange = (e) => {
        setCriteria(prev => ({
            ...prev,
            filterIsSale: e.target.value,
            page: 1,
            searchKeyword: '',
        }));
        setTempSearchKeyword('');
    };

    // 상품 유형 필터 변경 (추가)
    const handleTypeFilterChange = (e) => {
        setCriteria(prev => ({
            ...prev,
            filterType: e.target.value,
            page: 1,
            searchKeyword: '',
        }));
        setTempSearchKeyword('');
    };

    // 상품명 검색
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCriteria(prev => ({
            ...prev,
            searchKeyword: tempSearchKeyword,
            page: 1,
            
        }));
    };

    // 페이지 변경 핸들러
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setCriteria(prev => ({ ...prev, page: newPage }));
        }
    };


    if (isLoading) return <div className="text-center py-10 text-yellow-400">상품 목록 로딩 중...</div>;
    if (error) return <div className="text-center py-10 text-red-400">에러: {error}</div>;

    // 인라인 편집을 위한 공통 Input 컴포넌트
    const InlineInput = ({ name, value, type = 'text', onChange, className = '' }) => (
        <input
            type={type === 'number' ? 'text' : type} 
            name={name}
            value={value === null || value === undefined ? '' : value}
            onChange={e => {
                let finalValue = e.target.value;
                if (type === 'number') {
                    finalValue = finalValue.replace(/[^0-9]/g, '');
                }
                onChange({ target: { name, value: finalValue } });
            }}
            className={`w-full p-1 text-xs rounded bg-gray-600 border border-gray-500 text-gray-100 ${className}`}
        />
    );


    return (
        <div className="overflow-x-auto">
            <div className="flex items-center justify-between mb-4 space-x-4">
                {/* 판매 여부 필터 */}
                <select
                    value={criteria.filterIsSale}
                    onChange={handleSaleFilterChange}
                    className="p-2 border rounded bg-gray-700 border-gray-600 text-gray-300 w-40"
                >
                    {SALE_STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>

                {/* 상품 유형 필터 */}
                <select
                    value={criteria.filterType}
                    onChange={handleTypeFilterChange}
                    className="p-2 border rounded bg-gray-700 border-gray-600 text-gray-300 w-40"
                >
                    {PRODUCT_TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>

                {/* 검색 입력 필드 */}
                <form onSubmit={handleSearchSubmit} className="flex flex-grow max-w-md">
                    <input
                        type="text"
                        placeholder="상품명 검색"
                        value={tempSearchKeyword}
                        onChange={handleTempSearchChange}
                        className="p-2 border rounded-l bg-gray-700 border-gray-600 text-gray-300 w-full"
                    />
                    <button type="submit" className="p-2 bg-blue-600 hover:bg-blue-700 rounded-r text-white flex items-center">
                        <Search className="w-5 h-5" />
                    </button>
                </form>
            </div>

            <table className="w-full border-collapse text-sm text-gray-200">
                <thead className="bg-gray-700 text-xs uppercase font-semibold tracking-wider">
                    <tr>
                        <th className="px-4 py-3 text-left min-w-[80px]">ID</th>
                        <th className="px-4 py-3 text-left min-w-[200px]">상품명</th>
                        <th className="px-4 py-3 text-left min-w-[100px]">유형</th>
                        <th className="px-4 py-3 text-right min-w-[100px]">가격</th>
                        <th className="px-4 py-3 text-left min-w-[80px]">화폐</th>
                        <th className="px-4 py-3 text-center min-w-[100px]">판매여부</th>
                        <th className="px-4 py-3 text-center min-w-[60px]">기간</th>
                        <th className="px-4 py-3 text-center min-w-[60px]">패키지</th>
                        <th className="px-4 py-3 text-center min-w-[60px]">증정ID</th>
                        <th className="px-4 py-3 text-right min-w-[80px]">할인 가격</th>
                        <th className="px-4 py-3 text-left min-w-[130px]">등록일</th>
                        <th className="px-4 py-3 text-center min-w-[80px]">액션</th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {products.map((item) => {
                        const isEditing = editingProduct === item.productId;

                        return (
                            <tr key={item.productId} className="hover:bg-gray-700/70 transition duration-150 ease-in-out">
                                {/* 1. ID */}
                                <td className="px-4 py-3 text-sm text-gray-300">{item.productId}</td>

                                {/* 2. 상품명 */}
                                <td className="px-4 py-3 text-sm font-semibold text-yellow-400">
                                    {isEditing ? (
                                        <InlineInput
                                            name="productName"
                                            value={editData.productName}
                                            onChange={handleEditChange}
                                        />
                                    ) : (
                                        item.productName
                                    )}
                                </td>

                                {/* 3. 유형 */}
                                <td className="px-4 py-3 text-sm text-gray-300">
                                    {isEditing ? (
                                        <select
                                            name="productType"
                                            value={editData.productType}
                                            onChange={handleEditChange}
                                            className="w-full p-1 text-xs rounded bg-gray-600 border border-gray-500 text-gray-100"
                                        >
                                            {PRODUCT_TYPE_OPTIONS.slice(1).map(option => ( // 전체 유형 제외
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        item.productType
                                    )}
                                </td>

                                {/* 4. 가격 */}
                                <td className="px-4 py-3 text-sm text-right text-green-400 font-bold">
                                    {isEditing ? (
                                        <InlineInput
                                            name="price"
                                            value={editData.price}
                                            type="number"
                                            onChange={handleEditChange}
                                            className="text-right"
                                        />
                                    ) : (
                                        item.price?.toLocaleString()
                                    )}
                                </td>

                                {/* 5. 화폐 */}
                                <td className="px-4 py-3 text-sm text-gray-300">
                                    {isEditing ? (
                                        <select
                                            name="currencyType"
                                            value={editData.currencyType}
                                            onChange={handleEditChange}
                                            className="w-full p-1 text-xs rounded bg-gray-600 border border-gray-500 text-gray-100"
                                        >
                                            {CURRENCY_TYPE_OPTIONS.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        item.currencyType
                                    )}
                                </td>

                                {/* 6. 판매여부 */}
                                <td className="px-4 py-3 text-center">
                                    {isEditing ? (
                                        <input
                                            type="checkbox"
                                            name="isSale"
                                            checked={editData.isSale === 'Y'}
                                            onChange={handleEditChange}
                                            className="form-checkbox h-4 w-4 text-yellow-400 bg-gray-700 border-gray-500 rounded focus:ring-yellow-500"
                                        />
                                    ) : (
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.isSale === 'Y' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                                            {item.isSale === 'Y' ? '판매 중' : '중지'}
                                        </span>
                                    )}
                                </td>

                                {/* 7. 기간 */}
                                <td className="px-4 py-3 text-sm text-center">
                                    {isEditing ? (
                                        <InlineInput
                                            name="durationDays"
                                            value={editData.durationDays}
                                            type="number"
                                            onChange={handleEditChange}
                                            className="text-center"
                                        />
                                    ) : (
                                        item.durationDays || '-'
                                    )}
                                </td>

                                {/* 8. 패키지 사이즈 */}
                                <td className="px-4 py-3 text-sm text-center">
                                    {isEditing ? (
                                        <InlineInput
                                            name="packSize"
                                            value={editData.packSize}
                                            type="number"
                                            onChange={handleEditChange}
                                            className="text-center"
                                        />
                                    ) : (
                                        item.packSize || '-'
                                    )}
                                </td>

                                {/* 9. 증정 상품 ID */}
                                <td className="px-4 py-3 text-sm text-center">
                                    {isEditing ? (
                                        <InlineInput
                                            name="grantProductId"
                                            value={editData.grantProductId}
                                            type="number"
                                            onChange={handleEditChange}
                                            className="text-center"
                                        />
                                    ) : (
                                        item.grantProductId || '-'
                                    )}
                                </td>

                                {/* 할인 가격 */}
                                <td className="px-4 py-3 text-sm text-right">
                                    {isEditing ? (
                                        <InlineInput
                                            name="salePrice"
                                            value={editData.salePrice}
                                            type="number"
                                            onChange={handleEditChange}
                                            className="text-right"
                                        />
                                    ) : (
                                        item.salePrice?.toLocaleString() || '-'
                                    )}
                                </td>

                                {/* 등록일 */}
                                <td className="px-4 py-3 text-sm text-gray-400">{new Date(item.createdDate).toLocaleDateString()}</td>

                                {/* 액션 */}
                                <td className="px-4 py-3 text-center space-x-2 whitespace-nowrap">
                                    {isEditing ? (
                                        <>
                                            <button
                                                onClick={handleSaveEdit}
                                                className="text-green-500 hover:text-green-400 p-1 rounded transition duration-150"
                                                title="저장"
                                            >
                                                <Save className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="text-gray-400 hover:text-white p-1 rounded transition duration-150"
                                                title="취소"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleEditClick(item)}
                                                className="text-yellow-500 hover:text-yellow-400 p-1 rounded transition duration-150"
                                                title="수정"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(item.productId, item.productName)}
                                                className="text-red-500 hover:text-red-400 p-1 rounded transition duration-150"
                                                title="삭제"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {products.length === 0 && (<div className="py-8 text-center text-gray-500">조회된 상품 목록이 없습니다.</div>)}

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

export default ProductManagementTab;