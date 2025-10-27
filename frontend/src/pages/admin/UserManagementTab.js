import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchAllUsers, deleteUser } from '../../api/admin/adminApi';
import { Trash2, Edit, Search } from 'lucide-react'; 

const initialCriteria = {
    page: 1,
    pageSize: 6,
    searchKeyword: '',
    filterRole: '',
};

const UserManagementTab = ({ refreshTrigger }) => {
    const { token, user } = useAuth();
    const [users, setUsers] = useState([]);
    const [criteria, setCriteria] = useState(initialCriteria); 
    const [pagination, setPagination] = useState({ totalPages: 1, totalCount: 0 }); 
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tempSearchKeyword, setTempSearchKeyword] = useState(''); 

    const loadUsers = useCallback(async () => {
        if (user?.role !== 'ADMIN' || !token) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchAllUsers(token, criteria); 
            
            setUsers(data.list);
            setPagination({ 
                totalPages: data.totalPages, 
                totalCount: data.totalCount,
                currentPage: data.currentPage, 
            });

        } catch (err) {
            console.error("사용자 목록 조회 실패:", err);
            setError('사용자 목록을 불러오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [token, user, criteria, refreshTrigger]); 

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleTempSearchChange = (e) => {
        setTempSearchKeyword(e.target.value);
    };
    
    const handleRoleFilterChange = (e) => {
        setCriteria(prev => ({ ...prev, filterRole: e.target.value, page: 1 })); 
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

    // const handleDelete = async (userId) => {
    //     if (!window.confirm(`정말로 사용자 ID: ${userId} 를 삭제하시겠습니까?`)) return;
    //     try {
    //         await deleteUser(token, userId);
    //         alert(`사용자 ${userId}가 삭제되었습니다.`);
    //         loadUsers(); // 목록 새로고침
    //     } catch (err) {
    //         alert('사용자 삭제에 실패했습니다. (권한 또는 서버 문제)');
    //         console.error(err);
    //     }
    // };

    // 로딩 및 에러 UI 
    if (isLoading) return <div className="text-center py-10 text-yellow-400">사용자 목록 로딩 중...</div>;
    if (error) return <div className="text-center py-10 text-red-400">에러: {error}</div>;

    return (
        <div className="overflow-x-auto">
            <div className="flex items-center justify-between mb-4 space-x-4">
                {/* 역할 필터링 */}
                <select 
                    value={criteria.filterRole} 
                    onChange={handleRoleFilterChange}
                    className="p-2 border rounded bg-gray-700 border-gray-600 text-gray-300 w-32"
                >
                    <option value="">유저 역할</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="USER">USER</option>
                </select>
                
                {/* 검색 입력 필드 */}
                <form onSubmit={handleSearchSubmit} className="flex flex-grow max-w-md">
                    <input
                        type="text"
                        placeholder="ID, 닉네임, 이메일 검색"
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
                        <th className="px-4 py-3 text-left min-w-[140px]">ID / 닉네임</th>
                        <th className="px-4 py-3 text-left min-w-[80px]">역할</th>
                        <th className="px-4 py-3 text-left min-w-[160px]">이메일</th>
                        <th className="px-4 py-3 text-left min-w-[120px]">대표 캐릭터</th>
                        <th className="px-4 py-3 text-left min-w-[80px]">캐릭터 수</th>
                        <th className="px-4 py-3 text-left min-w-[80px]">부화권</th>
                        <th className="px-4 py-3 text-left min-w-[130px]">가입일</th>
                        {/* <th className="px-4 py-3 text-center min-w-[100px]">관리</th> */}
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {users.map((user) => (
                        <tr key={user.userId} className="hover:bg-gray-700/70 transition duration-150 ease-in-out">
                            <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-medium text-white-400 max-w-[160px]">{user.userId}</div>
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
                            {/* <td className="px-4 py-3 text-center space-x-2">
                                <button className="text-blue-400 hover:text-blue-300 transition flex items-center justify-center mx-auto"><Edit className="w-4 h-4 mr-1" />수정</button>
                                <button
                                    onClick={() => handleDelete(user.userId)}
                                    className="text-red-400 hover:text-red-300 transition flex items-center justify-center mx-auto mt-1"
                                >
                                    <Trash2 className="w-4 h-4 mr-1" />삭제
                                </button>
                            </td> */}
                        </tr>
                    ))}
                </tbody>
            </table>
            {users.length === 0 && (<div className="py-8 text-center text-gray-500">조회된 사용자 목록이 없습니다.</div>)}
            
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

export default UserManagementTab;