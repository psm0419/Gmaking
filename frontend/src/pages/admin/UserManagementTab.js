import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchAllUsers, deleteUser } from '../../api/admin/adminApi';
import { Trash2, Edit } from 'lucide-react';

const UserManagementTab = () => {
    const { token, user } = useAuth();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadUsers = useCallback(async () => {
        if (user?.role !== 'ADMIN' || !token) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchAllUsers(token);
            setUsers(data);
        } catch (err) {
            console.error("사용자 목록 조회 실패:", err);
            setError('사용자 목록을 불러오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [token, user]);

    useEffect(() => {
        // 탭이 로드될 때 데이터 요청
        loadUsers();
    }, [loadUsers]);

    const handleDelete = async (userId) => {
        if (!window.confirm(`정말로 사용자 ID: ${userId} 를 삭제하시겠습니까?`)) return;
        try {
            await deleteUser(token, userId);
            alert(`사용자 ${userId}가 삭제되었습니다.`);
            loadUsers(); // 목록 새로고침
        } catch (err) {
            alert('사용자 삭제에 실패했습니다. (권한 또는 서버 문제)');
            console.error(err);
        }
    };

    // 로딩 및 에러 UI
    if (isLoading) return <div className="text-center py-10 text-yellow-400">사용자 목록 로딩 중...</div>;
    if (error) return <div className="text-center py-10 text-red-400">에러: {error}</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm text-gray-200">
                <thead className="bg-gray-700 text-xs uppercase font-semibold tracking-wider">
                    <tr>
                        <th className="px-4 py-3 text-left min-w-[140px]">ID / 닉네임</th>
                        <th className="px-4 py-3 text-left min-w-[80px]">역할</th>
                        <th className="px-4 py-3 text-left min-w-[160px]">이메일</th>
                        <th className="px-4 py-3 text-left min-w-[120px]">대표 캐릭터</th>
                        <th className="px-4 py-3 text-left min-w-[80px]">캐릭터 수</th>
                        <th className="px-4 py-3 text-left min-w-[80px]">부화권</th>
                        <th className="px-4 py-3 text-left min-w-[130px]">가입일</th>
                        <th className="px-4 py-3 text-center min-w-[100px]">관리</th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {users.map((user) => (
                        <tr key={user.userId} className="hover:bg-gray-700/70 transition duration-150 ease-in-out">
                            <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-medium text-white truncate max-w-[160px]">{user.userId}</div>
                                <div className="text-xs text-gray-400 truncate">{user.userNickname}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-red-600/20 text-red-400' : 'bg-green-600/20 text-green-400'}`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-300 truncate max-w-[180px]">{user.userEmail}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-yellow-400">{user.characterName || '-'}</td>
                            <td className="px-4 py-3 text-gray-300 text-center">{user.characterCount}</td>
                            <td className="px-4 py-3 text-gray-300 text-center">{user.incubatorCount}</td>
                            <td className="px-4 py-3 text-gray-400">{new Date(user.createdDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-center space-x-2">
                                <button className="text-blue-400 hover:text-blue-300 transition flex items-center justify-center mx-auto"><Edit className="w-4 h-4 mr-1" />수정</button>
                                <button
                                    onClick={() => handleDelete(user.userId)}
                                    className="text-red-400 hover:text-red-300 transition flex items-center justify-center mx-auto mt-1"
                                >
                                    <Trash2 className="w-4 h-4 mr-1" />삭제
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {users.length === 0 && (<div className="py-8 text-center text-gray-500">사용자 목록이 비어 있습니다.</div>)}
        </div>
    );
};

export default UserManagementTab;