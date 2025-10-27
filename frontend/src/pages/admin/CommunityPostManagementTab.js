import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchAllPosts, deletePost } from '../../api/admin/adminApi';
import { Trash2, Search } from 'lucide-react';

const CATEGORY_OPTIONS = [
    { value: '', label: '전체 게시판' },
    { value: 'FREE', label: '자유 게시판' },
    { value: 'TIP', label: '팁/정보' },
    { value: 'QNA', label: '질문/답변' },
];

const initialCriteria = {
    page: 1,
    pageSize: 7,
    searchKeyword: '',
    filterCategory: '',
    filterIsDeleted: 'N',
};

const getCategoryLabel = (value) => {
  const option = CATEGORY_OPTIONS.find(opt => opt.value === value);
  return option ? option.label : value; // 없으면 원래 값 표시
};

const CommunityPostManagementTab = () => {
    const { token, user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [criteria, setCriteria] = useState(initialCriteria);
    const [searchInputValue, setSearchInputValue] = useState(initialCriteria.searchKeyword);
    const [pagination, setPagination] = useState({ totalPages: 1, totalCount: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPosts = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await fetchAllPosts(token, criteria);
            setPosts(data.list);
            setPagination({
                totalPages: data.totalPages,
                totalCount: data.totalCount,
            });
            setError(null);
        } catch (err) {
            console.error('게시글 목록 조회 실패:', err);
            setError('게시글 목록을 불러오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [token, criteria]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleSearchInputChange = (e) => {
        setSearchInputValue(e.target.value);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCriteria(prev => ({ 
            ...prev, 
            page: 1, 
            searchKeyword: searchInputValue 
        }));
    };

    const handlePageChange = (newPage) => {
        setCriteria(prev => ({ ...prev, page: newPage }));
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setCriteria(prev => ({ ...prev, [name]: value, page: 1 }));
    };

    const handlePostClick = (postId) => {
        const postDetailUrl = `/community/${postId}`;
        window.open(postDetailUrl, '_blank');
    };

    // 게시글 삭제
    const handleDeletePost = async (postId) => {
        if (!window.confirm(`정말로 POST ID [${postId}] 게시글을 삭제(IS_DELETED='Y' 처리)하시겠습니까?`)) {
            return;
        }

        try {
            await deletePost(token, postId);
            alert(`게시글 ID [${postId}] 삭제 처리가 완료되었습니다.`);
            console.log(`게시글 ID [${postId}] 삭제 처리가 완료되었습니다. (IS_DELETED='Y')`);
            fetchPosts(); // 목록 새로고침
        } catch (error) {
            console.error('게시글 삭제 처리 실패:', error);
            alert(`게시글 삭제 처리 실패: ${error.response?.data?.message || error.message}`);
            console.error(`게시글 삭제 처리 실패: ${error.response?.data?.message || error.message}`);

        }
    };


    if (isLoading) return <div className="p-4 text-center text-gray-400">게시글 목록을 불러오는 중입니다...</div>;
    if (error) return <div className="p-4 text-center text-red-400">오류: {error}</div>;

    return (
        <div className="overflow-x-auto">
            {/* 검색 및 필터 영역 */}
            <div className="flex flex-wrap items-center justify-between mb-4 space-x-4">
                <select
                    name="filterCategory"
                    value={criteria.filterCategory}
                    onChange={handleFilterChange}
                    className="p-2 border rounded bg-gray-700 border-gray-600 text-gray-300 w-40"
                >
                    {CATEGORY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>

                <form onSubmit={handleSearch} className="flex flex-grow max-w-sm mt-2 sm:mt-0">
                    <input
                        type="text"
                        name="searchKeyword"
                        value={searchInputValue} 
                        onChange={handleSearchInputChange} 
                        placeholder="제목, 작성자 닉네임, 내용 검색"
                        className="p-2 border rounded-l bg-gray-700 border-gray-600 text-gray-300 w-full focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button type="submit" className="p-2 bg-gray-600 hover:bg-blue-700 rounded-r text-white flex items-center">
                        <Search size={20} />
                    </button>
                </form>
            </div>

            {/* 게시글 목록 테이블 */}
            <table className="w-full border-collapse text-sm text-gray-200">
                <thead className="bg-gray-700 text-xs uppercase font-semibold tracking-wider">
                    <tr>
                        <th className="px-4 py-3 text-left min-w-[40px]">ID</th>
                        <th className="px-4 py-3 text-left min-w-[120px]">구분</th>
                        <th className="px-4 py-3 text-left min-w-[180px]">제목</th>
                        <th className="px-4 py-3 text-left min-w-[120px]">작성자</th>
                        <th className="px-4 py-3 text-center min-w-[60px]">조회수</th>
                        <th className="px-4 py-3 text-center min-w-[60px]">좋아요</th>
                        <th className="px-4 py-3 text-center min-w-[80px]">상태</th>
                        <th className="px-4 py-3 text-center min-w-[100px]">작성일</th>
                        <th className="px-4 py-3 text-center min-w-[80px]">액션</th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {posts.map((post) => (
                        <tr key={post.postId} className="hover:bg-gray-700/70 transition duration-150 ease-in-out">
                            <td className="px-4 py-3 text-sm text-gray-300">{post.postId}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{getCategoryLabel(post.categoryCode)}</td>
                            <td
                                className="px-4 py-3 text-sm text-white font-medium cursor-pointer hover:text-blue-400 transition truncate max-w-[200px]"
                                onClick={() => handlePostClick(post.postId)}
                                title="상세 게시글 보기 (새 탭)"
                            >
                                {post.title}
                                <span className="ml-1 text-blue-400 text-xs">
                                    [{post.commentCount || 0}]
                                </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-400 truncate max-w-[150px]">{post.userNickname} ({post.userId})</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-400">{post.viewCount}</td>
                            <td className="px-4 py-3 text-sm text-center text-green-400 font-bold">{post.likeCount}</td>
                            <td className="px-4 py-3 text-sm text-center">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${post.isDeleted === 'Y' ? 'bg-red-600/20 text-red-400' : 'bg-green-600/20 text-green-400'}`}>
                                    {post.isDeleted === 'Y' ? '삭제됨' : '정상'}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-400">
                                {new Date(post.createdDate).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' })}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                                {post.isDeleted === 'N' ? (
                                    <button
                                        onClick={() => handleDeletePost(post.postId)}
                                        className="text-red-500 hover:text-red-400 p-1 rounded transition duration-150"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <span className="text-gray-500 text-xs">처리 완료</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {posts.length === 0 && (
                <div className="py-8 text-center text-gray-500">조회된 게시글 목록이 없습니다.</div>
            )}

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
