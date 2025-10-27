import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchAllMonsters, fetchMonsterById, createMonster, updateMonster, deleteMonster } from '../../api/admin/adminApi';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';

const initialCriteria = {
    page: 1,
    pageSize: 6,
    searchKeyword: '',
    filterMonsterType: '', 
};

const MonsterFormModal = ({ monsterData, onClose, onSuccess }) => {
    const { token, user } = useAuth(); // user 정보도 활용
    const isEditMode = !!monsterData;
    const [formData, setFormData] = useState({
        monsterName: monsterData?.monsterName || '',
        monsterType: monsterData?.monsterType || 'NORMAL',
        monsterHp: monsterData?.monsterHp || 100,
        monsterAttack: monsterData?.monsterAttack || 10,
        monsterDefense: monsterData?.monsterDefense || 5,
        monsterSpeed: monsterData?.monsterSpeed || 5,
        monsterCriticalRate: monsterData?.monsterCriticalRate || 0,
        imageFile: null,
    });

    // GCS URL 필드명에 맞게 imagePath -> imageUrl로 수정
    const [previewImage, setPreviewImage] = useState(monsterData?.imageUrl || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const newValue = type === 'number' ? (value === '' ? '' : Number(value)) : value;
        setFormData(prev => ({ ...prev, [name]: newValue }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData(prev => ({ ...prev, imageFile: file }));
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            // 파일 선택 취소 시 기존 이미지 또는 null로 복원
            setPreviewImage(monsterData?.imageUrl || null);
        }
    };

    // 몬스터 생성/수정 시 Multipart/form-data 구성 
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const formDataPayload = new FormData();

            // 1. 몬스터 데이터를 JSON 문자열로 변환하여 'monsterData' 파트로 추가
            const monsterDataJson = JSON.stringify({
                // 수정 시에만 monsterId 포함
                monsterId: isEditMode ? monsterData.monsterId : undefined,
                monsterName: formData.monsterName,
                monsterType: formData.monsterType,
                monsterHp: parseInt(formData.monsterHp),
                monsterAttack: parseInt(formData.monsterAttack),
                monsterDefense: parseInt(formData.monsterDefense),
                monsterSpeed: parseInt(formData.monsterSpeed),
                monsterCriticalRate: parseInt(formData.monsterCriticalRate),
                // createdBy/updatedBy를 JSON 본문에 포함
                createdBy: !isEditMode ? 'ADMIN' : undefined,
                updatedBy: isEditMode ? 'ADMIN' : undefined,
            });

            // Spring의 @RequestPart("monsterData")에 대응하기 위해 Blob으로 감싸서 전송
            formDataPayload.append('monsterData', new Blob([monsterDataJson], { type: 'application/json' }));

            // 2. 이미지 파일 추가 (멀티파트 파트)
            if (isEditMode) {
                if (formData.imageFile) {
                    // Spring의 @RequestPart(value = "newImageFile")에 대응
                    formDataPayload.append('newImageFile', formData.imageFile);
                }
            } else {
                // 등록 모드: imageFile은 필수
                if (!formData.imageFile) {
                    setError("새 몬스터를 생성하려면 이미지 파일을 선택해야 합니다.");
                    setLoading(false);
                    return;
                }
                // Spring의 @RequestPart("imageFile")에 대응
                formDataPayload.append('imageFile', formData.imageFile);
            }

            if (isEditMode) {
                await updateMonster(token, monsterData.monsterId, formDataPayload);
            } else {
                await createMonster(token, formDataPayload);
            }

            alert(`몬스터가 성공적으로 ${isEditMode ? '수정' : '생성'}되었습니다.`);
            onSuccess();
            onClose();

        } catch (err) {
            console.error("Submission Error:", err.response || err);
            const errorMessage = err.response?.data?.message || err.message || `몬스터 ${isEditMode ? '수정' : '생성'} 중 오류가 발생했습니다.`;
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-4 sticky top-0 bg-gray-800 z-10">
                    <h3 className="text-xl font-bold text-yellow-400">{isEditMode ? '몬스터 수정' : '몬스터 생성'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition"><X className="w-6 h-6" /></button>
                </div>

                {error && <div className="p-3 mb-4 bg-red-800 text-red-100 rounded text-sm">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">

                        {/* 이미지 미리보기 및 업로드 */}
                        <div className="flex flex-col items-center p-4 border border-gray-700 rounded-lg">
                            <label className="text-sm font-medium mb-2 text-gray-300">몬스터 이미지</label>
                            <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center mb-2 overflow-hidden">
                                {previewImage ? (
                                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-gray-500 text-center text-sm">이미지 없음</span>
                                )}
                            </div>
                            <input
                                type="file"
                                name="imageFile"
                                onChange={handleFileChange}
                                accept="image/*"
                                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-white hover:file:bg-yellow-600 transition"
                            />
                            {isEditMode && !formData.imageFile && <p className="text-xs text-gray-500 mt-1">새 파일을 선택하지 않으면 기존 이미지가 유지됩니다.</p>}
                        </div>

                        {/* 몬스터 이름 */}
                        <div>
                            <label htmlFor="monsterName" className="block text-sm font-medium mb-1 text-gray-300">몬스터 이름</label>
                            <input
                                type="text"
                                id="monsterName"
                                name="monsterName"
                                value={formData.monsterName}
                                onChange={handleChange}
                                required
                                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-yellow-500 focus:border-yellow-500"
                            />
                        </div>

                        {/* 몬스터 유형 */}
                        <div>
                            <label htmlFor="monsterType" className="block text-sm font-medium mb-1 text-gray-300">몬스터 유형</label>
                            <select
                                id="monsterType"
                                name="monsterType"
                                value={formData.monsterType}
                                onChange={handleChange}
                                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-yellow-500 focus:border-yellow-500"
                            >
                                <option value="NORMAL">NORMAL</option>
                                <option value="BOSS">BOSS</option>
                            </select>
                        </div>

                        {/* 능력치 입력 (HP, ATTACK, DEFENSE, SPEED, CRITICAL_RATE) */}
                        <div className="grid grid-cols-2 gap-4">
                            {['monsterHp', 'monsterAttack', 'monsterDefense', 'monsterSpeed', 'monsterCriticalRate'].map(key => (
                                <div key={key}>
                                    <label htmlFor={key} className="block text-sm font-medium mb-1 text-gray-300">
                                        {key.replace('monster', '').toUpperCase().replace('RATE', ' 확률(%)')}
                                    </label>
                                    <input
                                        type="number"
                                        id={key}
                                        name={key}
                                        value={formData[key]}
                                        onChange={handleChange}
                                        required
                                        min={key === 'monsterCriticalRate' ? "0" : "1"}
                                        max={key === 'monsterCriticalRate' ? "100" : undefined}
                                        className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-yellow-500 focus:border-yellow-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition duration-200"
                            disabled={loading}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-yellow-600 text-white rounded font-semibold hover:bg-yellow-700 transition duration-200 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? '처리 중...' : (isEditMode ? '몬스터 수정' : '몬스터 생성')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ---------------------------------------------------------------------------------


const MonsterManagementTab = () => {
    const { token } = useAuth();
    const [monsters, setMonsters] = useState([]);
    const [criteria, setCriteria] = useState(initialCriteria);
    const [pagination, setPagination] = useState({ totalPages: 1, totalCount: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tempSearchKeyword, setTempSearchKeyword] = useState('');

    const fetchMonsters = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchAllMonsters(token, {
                page: criteria.page,
                pageSize: criteria.pageSize,
                searchKeyword: criteria.searchKeyword,
                filterMonsterType: criteria.filterMonsterType // ⭐️ 올바른 필터 이름 사용
            });

            setMonsters(data.list);
            setPagination({
                currentPage: data.currentPage,
                totalPages: data.totalPages,
                totalCount: data.totalCount,
            });
        } catch (err) {
            console.error("몬스터 목록 조회 실패:", err);
            setError("몬스터 목록을 불러오는 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [token, criteria]);

    useEffect(() => {
        fetchMonsters();
    }, [fetchMonsters]);

    const handleTempSearchChange = (e) => {
        setTempSearchKeyword(e.target.value);
    };

    const handleTypeFilterChange = (e) => {
        setCriteria(prev => ({ ...prev, filterMonsterType: e.target.value, page: 1 }));
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCriteria(prev => ({ ...prev, searchKeyword: tempSearchKeyword, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setCriteria(prev => ({ ...prev, page: newPage }));
        }
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMonster, setCurrentMonster] = useState(null);

    const handleCreate = () => {
        setCurrentMonster(null);
        setIsModalOpen(true);
    };

    const handleUpdate = async (monsterId) => {
        try {
            const data = await fetchMonsterById(token, monsterId);
            setCurrentMonster(data);
            setIsModalOpen(true);
        } catch (err) {
            console.error("몬스터 상세 조회 실패:", err);
            alert("몬스터 상세 정보를 불러오는 데 실패했습니다.");
        }
    };

    const handleDelete = async (monsterId) => {
        if (!window.confirm(`몬스터 ID ${monsterId} (${monsters.find(m => m.monsterId === monsterId)?.monsterName})를 정말로 삭제하시겠습니까?`)) return;

        try {
            await deleteMonster(token, monsterId);
            alert('몬스터가 삭제되었습니다.');

            const remainingMonsters = monsters.filter(m => m.monsterId !== monsterId);
            const newPage = remainingMonsters.length === 0 && criteria.page > 1 ? criteria.page - 1 : criteria.page;

            setCriteria(prev => ({ ...prev, page: newPage }));
        } catch (err) {
            console.error("몬스터 삭제 실패:", err);
            alert('몬스터 삭제 중 오류가 발생했습니다. (권한 또는 서버 오류)');
        }
    };

    const handleModalSuccess = () => {
        setIsModalOpen(false);
        fetchMonsters();
    };

    // ----------------------------

    if (isLoading) return <div className="text-center py-10 text-yellow-400">몬스터 목록 로딩 중...</div>;
    if (error) return <div className="text-center py-10 text-red-400">에러: {error}</div>;

    return (
        <div className="relative">
            {/* 검색 및 필터링 UI */}
            <div className="flex flex-wrap items-center justify-between space-x-4 mb-4">
                <div className="flex space-x-4">
                    {/* 몬스터 유형 필터링 */}
                    <select
                        value={criteria.filterMonsterType}
                        onChange={handleTypeFilterChange}
                        className="p-2 rounded bg-gray-700 text-white border border-gray-600"
                    >
                        <option value="">모든 유형</option>
                        <option value="NORMAL">NORMAL</option>
                        <option value="BOSS">BOSS</option>
                    </select>

                    {/* 검색 입력 필드 */}
                    <form onSubmit={handleSearchSubmit} className="flex max-w-sm">
                        <input
                            type="text"
                            placeholder="몬스터 이름 검색"
                            value={tempSearchKeyword}
                            onChange={handleTempSearchChange}
                            className="p-2 border rounded-l bg-gray-700 border-gray-600 text-gray-300 w-full"
                        />
                        <button type="submit" className="p-2 bg-gray-600 hover:bg-gray-500 rounded-r text-white flex items-center">
                            <Search className="w-5 h-5" />
                        </button>
                    </form>
                </div>

                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded transition duration-200 flex items-center"
                >
                    <Plus className="w-4 h-4 mr-1" /> 몬스터 생성
                </button>
            </div>


            <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-left whitespace-nowrap">
                    <thead className="border-b border-gray-700">
                        <tr className="text-gray-400">
                            <th className="px-4 py-2">ID</th>
                            <th className="px-4 py-2">이미지</th>
                            <th className="px-4 py-2">이름</th>
                            <th className="px-4 py-2">유형</th>
                            <th className="px-4 py-2">HP</th>
                            <th className="px-4 py-2">공격</th>
                            <th className="px-4 py-2">방어</th>
                            <th className="px-4 py-2">스피드</th>
                            <th className="px-4 py-2">치명타(%)</th>
                            <th className="px-4 py-2">생성일</th>
                            <th className="px-4 py-2">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {monsters.length === 0 ? (
                            <tr>
                                <td colSpan="11" className="py-8 text-center text-gray-500">
                                    조회된 몬스터 목록이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            monsters.map((monster) => (
                                <tr key={monster.monsterId} className="border-b border-gray-800 hover:bg-gray-700 transition duration-150">
                                    <td className="px-4 py-2">{monster.monsterId}</td>
                                    <td className="px-4 py-2">
                                        {monster.imageUrl ? (
                                            <img
                                                src={monster.imageUrl} // ⭐️ imageUrl 필드 사용
                                                alt={monster.monsterName}
                                                className="w-10 h-10 object-cover rounded mx-auto"
                                            />
                                        ) : 'No Image'}
                                    </td>
                                    <td className="px-4 py-2 font-medium">{monster.monsterName}</td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded ${monster.monsterType === 'BOSS'
                                            ? 'bg-red-900 text-red-300'
                                            : 'bg-green-900 text-green-300'
                                            }`}>
                                            {monster.monsterType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">{monster.monsterHp}</td>
                                    <td className="px-4 py-2">{monster.monsterAttack}</td>
                                    <td className="px-4 py-2">{monster.monsterDefense}</td>
                                    <td className="px-4 py-2">{monster.monsterSpeed}</td>
                                    <td className="px-4 py-2">{monster.monsterCriticalRate || 0}%</td>
                                    <td className="px-4 py-2 text-sm">{new Date(monster.createdDate).toLocaleDateString('ko-KR')}</td>
                                    <td className="px-4 py-2">
                                        <button
                                            onClick={() => handleUpdate(monster.monsterId)}
                                            className="text-blue-400 hover:text-blue-300 mr-2 p-1"
                                            title="수정"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(monster.monsterId)}
                                            className="text-red-400 hover:text-red-300 p-1"
                                            title="삭제"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* 인라인 페이지네이션 */}
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

            {/* 몬스터 생성/수정 모달 */}
            {isModalOpen && (
                <MonsterFormModal
                    monsterData={currentMonster}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleModalSuccess}
                />
            )}
        </div>
    );
};

export default MonsterManagementTab;