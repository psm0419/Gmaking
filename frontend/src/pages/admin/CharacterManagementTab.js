import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchAllCharacters, deleteCharacter } from '../../api/admin/adminApi';
import { Trash2, Search } from 'lucide-react';

const initialCriteria = {
    page: 1,
    pageSize: 8,
    searchKeyword: '',
    filterGradeId: '', 
};

const CharacterManagementTab = () => {
    const { token, user } = useAuth();
    const [characters, setCharacters] = useState([]);
    const [criteria, setCriteria] = useState(initialCriteria);
    const [pagination, setPagination] = useState({ totalPages: 1, totalCount: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tempSearchKeyword, setTempSearchKeyword] = useState('');

    const loadCharacters = useCallback(async () => {
        if (user?.role !== 'ADMIN' || !token) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchAllCharacters(token, criteria);
            setCharacters(data.list);
            setPagination({ 
                totalPages: data.totalPages, 
                totalCount: data.totalCount,
                currentPage: data.currentPage, 
            });

        } catch (err) {
            console.error("캐릭터 목록 조회 실패:", err);
            setError('캐릭터 목록을 불러오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [token, user, criteria]);

    const handleDeleteCharacter = async (characterId, characterName) => {
        if (!window.confirm(`[${characterName}] 캐릭터를 정말로 삭제하시겠습니까?\n\n*주의: 해당 캐릭터와 관련된 모든 데이터(능력치, 배틀 로그 등)가 영구적으로 삭제됩니다.`)) {
            return;
        }

        try {
            await deleteCharacter(token, characterId);
            alert(`[${characterName}] 캐릭터가 성공적으로 삭제되었습니다.`);
            
            // 삭제 후 목록 새로고침
            // 현재 페이지의 마지막 항목을 삭제한 경우, 이전 페이지로 이동
            const isLastItemOnPage = characters.length === 1 && criteria.page > 1;
            if (isLastItemOnPage) {
                setCriteria(prev => ({ ...prev, page: prev.page - 1 }));
            } else {
                loadCharacters(); // 같은 페이지 새로고침
            }

        } catch (err) {
            console.error('캐릭터 삭제 실패:', err);
            setError(err.response?.data?.message || '캐릭터 삭제 중 오류가 발생했습니다.');
        }
    };

    useEffect(() => {
        loadCharacters();
    }, [loadCharacters]);
    
    // 검색 및 필터 핸들러
    const handleTempSearchChange = (e) => {
        setTempSearchKeyword(e.target.value);
    };
    
    const handleGradeFilterChange = (e) => {
        const value = e.target.value === '' ? '' : parseInt(e.target.value);
        setCriteria(prev => ({ ...prev, filterGradeId: value, page: 1 })); 
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

    if (isLoading) return <div className="text-center py-10 text-yellow-400">캐릭터 목록 로딩 중...</div>;
    if (error) return <div className="text-center py-10 text-red-400">에러: {error}</div>;

    return (
        <div className="overflow-x-auto">
            <div className="flex items-center justify-between mb-4 space-x-4">
                {/* 등급 필터링 */}
                <select 
                    value={criteria.filterGradeId} 
                    onChange={handleGradeFilterChange}
                    className="p-2 border rounded bg-gray-700 border-gray-600 text-gray-300 w-32"
                >
                    <option value="">전체 등급</option>
                    <option value="1">1등급</option>
                    <option value="2">2등급</option>
                    <option value="3">3등급</option>
                    <option value="4">4등급</option>
                    <option value="5">5등급</option>
                </select>
                
                {/* 검색 입력 필드 */}
                <form onSubmit={handleSearchSubmit} className="flex flex-grow max-w-md">
                    <input
                        type="text"
                        placeholder="캐릭터 이름, 닉네임 검색"
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
                        <th className="px-4 py-3 text-left min-w-[100px]">ID</th>
                        <th className="px-4 py-3 text-left min-w-[120px]">이름</th>
                        <th className="px-4 py-3 text-left min-w-[100px]">사용자 닉네임</th>
                        <th className="px-4 py-3 text-left min-w-[80px]">등급</th>
                        <th className="px-4 py-3 text-left min-w-[80px]">진화 단계</th>
                        <th className="px-4 py-3 text-left min-w-[130px]">생성일</th>
                        <th className="px-4 py-3 text-center min-w-[100px]">관리</th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {characters.map((char) => (
                        <tr key={char.characterId} className="hover:bg-gray-700/70 transition duration-150 ease-in-out">
                            <td className="px-4 py-3 text-sm text-gray-300">{char.characterId}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-yellow-400">{char.characterName}</td>
                            <td className="px-4 py-3 text-sm text-gray-400">{char.userNickname || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{char.gradeId}</td>
                            <td className="px-4 py-3 text-sm text-gray-300 text-center">{char.evolutionStep}</td>
                            <td className="px-4 py-3 text-sm text-gray-400">{new Date(char.createdDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-center space-x-2">
                                <button
                                    onClick={() => handleDeleteCharacter(char.characterId, char.characterName)}
                                    className="text-red-500 hover:text-red-400 p-1 rounded transition duration-150"
                                    title="캐릭터 삭제"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {characters.length === 0 && (<div className="py-8 text-center text-gray-500">조회된 캐릭터 목록이 없습니다.</div>)}

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

export default CharacterManagementTab;