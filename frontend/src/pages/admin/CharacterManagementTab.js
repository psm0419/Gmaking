import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchAllCharacters } from '../../api/admin/adminApi';
import { Trash2 } from 'lucide-react';

const CharacterManagementTab = () => {
    const { token, user } = useAuth();
    const [characters, setCharacters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadCharacters = useCallback(async () => {
        if (user?.role !== 'ADMIN' || !token) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchAllCharacters(token);
            setCharacters(data);
        } catch (err) {
            console.error("캐릭터 목록 조회 실패:", err);
            setError('캐릭터 목록을 불러오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [token, user]);

    useEffect(() => {
        loadCharacters();
    }, [loadCharacters]);

    // 로딩 및 에러 UI
    if (isLoading) return <div className="text-center py-10 text-yellow-400">캐릭터 목록 로딩 중...</div>;
    if (error) return <div className="text-center py-10 text-red-400">에러: {error}</div>;

    return (
        <div className="overflow-x-auto">
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
                                <button className="text-red-400 hover:text-red-300 transition flex items-center justify-center mx-auto"><Trash2 className="w-4 h-4 mr-1" />삭제</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {characters.length === 0 && (<div className="py-8 text-center text-gray-500">캐릭터 목록이 비어 있습니다.</div>)}
        </div>
    );
};

export default CharacterManagementTab;