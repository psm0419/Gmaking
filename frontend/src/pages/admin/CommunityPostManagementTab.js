import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchAllPosts } from '../../api/admin/adminApi';
import { Search } from 'lucide-react';

const CATEGORY_OPTIONS = [
    { value: '', label: '전체 게시판' },
    { value: '자유 게시판', label: '자유 게시판' },  
    { value: '팁/정보', label: '팁/정보' }, 
    { value: '질문/답변', label: '질문/답변' },    
];

// 삭제 여부 옵션
const DELETE_STATUS_OPTIONS = [
    { value: '', label: '전체 상태' },
    { value: 'N', label: '정상 게시글 (N)' },
    { value: 'Y', label: '삭제된 게시글 (Y)' },
];

const initialCriteria = {
    page: 1,
    pageSize: 8,
    searchKeyword: '',
    filterCategory: '',    
    filterIsDeleted: 'N', 
};

const CommunityPostManagementTab = () => {
    const { token, user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [criteria, setCriteria] = useState(initialCriteria);
    const [pagination, setPagination] = useState({ totalPages: 1, totalCount: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tempSearchKeyword, setTempSearchKeyword] = useState(''); 

    const loadPosts = useCallback(async () => {
        if (user?.role !== 'ADMIN' || !token) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchAllPosts(token, criteria);
            setPosts(data.list);
            setPagination({ 
                totalPages: data.totalPages, 
                totalCount: data.totalCount,
                currentPage: data.currentPage, 
            });
        } catch (err) {
            console.error("게시글 목록 조회 실패:", err);
            setError('게시글 목록을 불러오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [token, user, criteria]);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);
    
    // 임시 검색어 변경
    const handleTempSearchChange = (e) => {
        setTempSearchKeyword(e.target.value);
    };
    
    // 카테고리 필터 변경
    const handleCategoryFilterChange = (e) => {
        setCriteria(prev => ({ 
            ...prev, 
            filterCategory: e.target.value, 
            page: 1, 
            searchKeyword: '',
        })); 
        setTempSearchKeyword('');
    };

    // 삭제 여부 필터 변경
    const handleDeleteFilterChange = (e) => {
        setCriteria(prev => ({ 
            ...prev, 
            filterIsDeleted: e.target.value, 
            page: 1,
            searchKeyword: '',
        })); 
        setTempSearchKeyword('');
    };
    
    // 검색 실행 (제목 또는 닉네임)
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


    if (isLoading) return <div className="text-center py-10 text-yellow-400">게시글 목록 로딩 중...</div>;
    if (error) return <div className="text-center py-10 text-red-400">에러: {error}</div>;

    return (
        <div className="overflow-x-auto">
            <div className="flex items-center justify-start mb-4 space-x-4">
                
                {/* 게시판 카테고리 필터 */}
                <select 
                    value={criteria.filterCategory} 
                    onChange={handleCategoryFilterChange}
                    className="p-2 border rounded bg-gray-700 border-gray-600 text-gray-300 w-40"
                >
                    {CATEGORY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>

                {/* 삭제 여부 필터 */}
                <select 
                    value={criteria.filterIsDeleted} 
                    onChange={handleDeleteFilterChange}
                    className="p-2 border rounded bg-gray-700 border-gray-600 text-gray-300 w-48"
                >
                    {DELETE_STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
                
                {/* 검색 입력 필드 */}
                <form onSubmit={handleSearchSubmit} className="flex flex-grow max-w-md">
                    <input
                        type="text"
                        placeholder="제목 또는 닉네임 검색"
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
                        <th className="px-4 py-3 text-left min-w-[50px]">ID</th>
                        <th className="px-4 py-3 text-left min-w-[100px]">카테고리</th>
                        <th className="px-4 py-3 text-left min-w-[300px]">제목</th>
                        <th className="px-4 py-3 text-left min-w-[100px]">작성자</th>
                        <th className="px-4 py-3 text-center min-w-[60px]">조회</th>
                        <th className="px-4 py-3 text-center min-w-[60px]">좋아요</th>
                        <th className="px-4 py-3 text-center min-w-[60px]">댓글</th>
                        <th className="px-4 py-3 text-center min-w-[80px]">상태</th>
                        <th className="px-4 py-3 text-left min-w-[100px]">등록일</th>
                        <th className="px-4 py-3 text-center min-w-[80px]">액션</th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {posts.map((item) => (
                        <tr key={item.postId} className="hover:bg-gray-700/70 transition duration-150 ease-in-out">
                            <td className="px-4 py-3 text-sm text-gray-300">{item.postId}</td>
                            <td className="px-4 py-3 text-sm text-cyan-400">{item.categoryCode}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-white truncate max-w-xs">{item.title}</td>
                            <td className="px-4 py-3 text-sm text-yellow-400">{item.userNickname}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-400">{item.viewCount?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-center text-red-400">{item.likeCount?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-center text-blue-400">{item.commentCount?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.isDeleted === 'N' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                                    {item.isDeleted === 'N' ? '정상' : '삭제됨'}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-400">{new Date(item.createdDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-center space-x-2">
                                {/* 게시글 상세 수정/삭제는 다음 단계에 구현 */}
                                <button className="text-blue-400 hover:text-blue-300 transition text-xs">상세</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {posts.length === 0 && (<div className="py-8 text-center text-gray-500">조회된 게시글 목록이 없습니다.</div>)}

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

export default CommunityPostManagementTab;