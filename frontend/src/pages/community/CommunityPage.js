import React, { useEffect, useState, useCallback } from 'react';
import { MessageSquare, ThumbsUp, Eye, Search, Plus, List, Tag } from 'lucide-react'; 
import Header from '../../components/Header'; 
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 

// API 기본 URL 설정
const API_BASE_URL = 'http://localhost:8080/community';

// 게시글 목록을 위한 서브 컴포넌트
const PostItem = ({ type, title, authorNickname, date, postId, navigate, viewCount, likeCount, replyCount, onLikeClick }) => {
    const isNotice = type === 'notice';
    const tagColor = isNotice ? 'bg-red-600' : 'bg-yellow-600';

    return (
        <div 
            className="flex items-center justify-between p-4 border-b border-gray-700 hover:bg-gray-700 transition duration-150 cursor-pointer group"
            onClick={() => navigate(`/community/${postId}`)}   
        >    
            {/* 제목 및 태그 */}
            <div className="flex-1 min-w-0 pr-4">
                <span className={`inline-block px-2 py-0.5 mr-3 text-xs font-bold rounded-md text-white ${tagColor} flex-shrink-0`}>
                    {isNotice ? '공지' : '자유'}
                </span>
                <span className={`text-white text-lg font-medium truncate ${isNotice ? 'group-hover:text-red-400' : 'group-hover:text-yellow-400'}`}>
                    {title}
                </span>
            </div>

            {/* 정보 (모바일에서는 숨김) */}
            <div className="hidden sm:flex items-center text-sm text-gray-400 space-x-6 flex-shrink-0">
                <span className="w-20 truncate text-center">{authorNickname}</span>
                <div className="flex items-center space-x-1.5 w-12 justify-center">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span>{viewCount || 0}</span>
                </div>
                <div 
                    className="flex items-center space-x-1.5 w-12 justify-center"
                    onClick={(e) => {
                        e.stopPropagation();
                        onLikeClick(postId);
                    }}
                >
                    <ThumbsUp className="w-4 h-4 text-gray-500" />
                    <span>{likeCount || 0}</span>
                </div>
                <div className="flex items-center space-x-1.5 w-12 justify-center">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    <span>{replyCount || 0}</span>
                </div>
                <span className="w-20 text-center">{new Date(date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '.').slice(0, -1)}</span>
            </div>
        </div>
    );
};

const CATEGORY_CODE_MAP = {
    'ALL': '전체',
    'FREE': '자유 게시판',
    'QNA': '질문/답변',
    'INFO': '팁/정보',
};

const CommunityPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // 카테고리 관련 상태
    const [categories, setCategories] = useState([]); 
    const [categoryMap] = useState(CATEGORY_CODE_MAP); 
    const [posts, setPosts] = useState([]);
    const [hotPosts, setHotPosts] = useState([]);
    const PAGE_AMOUNT = 5;
    const [pagingInfo, setPagingInfo] = useState({
        pageNum: 1,
        amount: PAGE_AMOUNT,
        totalCount: 0,
        startPage: 1,
        endPage: 1,
        prev: false,
        next: false
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentKeyword, setCurrentKeyword] = useState('');
    const [activeCategory, setActiveCategory] = useState('ALL'); 
    const [searchType, setSearchType] = useState('TC');

    const searchOptions = [
        { code: 'TC', name: '제목+내용' },
        { code: 'T', name: '제목만' },
        { code: 'C', name: '내용만' },
        { code: 'W', name: '작성자' },
    ];

    // 스크롤바 숨김 처리 (ShopPage와 동일)
    useEffect(() => {
        document.documentElement.classList.add("no-scrollbar");
        document.body.classList.add("no-scrollbar");
        return () => {
            document.documentElement.classList.remove("no-scrollbar");
            document.body.classList.remove("no-scrollbar");
        };
    }, []);

    // API 호출 함수들 (기존과 동일)
    const fetchPosts = useCallback(async(page, keyword = '', categoryCode = 'ALL') => {
        try {
            let url = `${API_BASE_URL}?pageNum=${page}&amount=${PAGE_AMOUNT}`;
            if (keyword) {
                url += `&searchKeyword=${keyword}&searchType=${searchType}`;
            }
            if (categoryCode !== 'ALL' && categoryCode !== '전체') {
                url += `&categoryCode=${categoryCode}`;
            }
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('네트워크 응답 실패');
            }
            const data = await response.json();
            setPosts(data.list || []);
            if (data.pagingInfo) {
                setPagingInfo(data.pagingInfo);
            } else {
                setPagingInfo(prev => ({ ...prev, totalCount: data.list ? data.list.length : 0 }));
            }
            setCurrentPage(page);
        } catch (error) {
            console.error("게시글 목록 조회 실패:", error);
            setPagingInfo(prev => ({ ...prev, totalCount: 0 }));
        }
    }, [searchType]);

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories`);
            if (!response.ok) {
                throw new Error('카테고리 목록 조회 실패');
            }
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error("카테고리 목록 조회 실패:", error);
        }
    };

    const fetchHotPosts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/hot-posts`);
            if (!response.ok) {
                throw new Error('인기 게시글 목록 조회 실패');
            }
            const data = await response.json();
            setHotPosts(data);
        } catch (error) {
            console.error("인기 게시글 목록 조회 실패:", error);
        }
    };

    const handleCategoryClick = (categoryCode) => {
        setActiveCategory(categoryCode);
        setCurrentKeyword('');
        setSearchTerm('');
        const categoryForApi = getCategoryName(categoryCode);
        fetchPosts(1, '', categoryForApi);
    };

    const handleCreatePostClick = () => {
        if (!user) {
            alert('게시글 작성을 위해 로그인이 필요합니다.');
            navigate('/login');
        } else {
            navigate('/create-post');
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const categoryForApi = getCategoryName(activeCategory);
        fetchPosts(1, searchTerm, categoryForApi, searchType);
        setCurrentKeyword(searchTerm);
    };

    const handlePageChange = (page) => {
        if (page > 0 && page <= Math.ceil(pagingInfo.totalCount / pagingInfo.amount)) {
            const categoryForApi = getCategoryName(activeCategory);
            fetchPosts(page, currentKeyword, categoryForApi);
        }
    };

    const handleLikeClick = async (postId) => {
        if (!user) {
            alert('좋아요를 위해 로그인이 필요합니다.');
            navigate('/login');
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/like/${postId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                throw new Error('좋아요 업데이트 실패');
            }
            const categoryForApi = getCategoryName(activeCategory);
            fetchPosts(currentPage, currentKeyword, categoryForApi);
        } catch (error) {
            console.error("좋아요 처리 실패:", error);
            alert('좋아요 처리 중 오류가 발생했습니다.');
        }
    };

    const getCategoryName = (code) => {
        return categoryMap[code] || code;
    };

    const renderPagination = () => {
        const pageNumbers = [];
        const totalPages = Math.ceil(pagingInfo.totalCount / pagingInfo.amount);
        for (let i = pagingInfo.startPage; i <= pagingInfo.endPage; i++) {
            pageNumbers.push(i);
        }
        return (
            <div className="p-4 flex justify-center space-x-2">
                {pagingInfo.prev && (
                    <button 
                        onClick={() => handlePageChange(1)}
                        className="px-3 py-1 text-white bg-gray-700 rounded hover:bg-gray-600"
                    >
                        &laquo;
                    </button>
                )}
                {pagingInfo.prev && (
                    <button 
                        onClick={() => handlePageChange(pagingInfo.startPage - 1)}
                        className="px-3 py-1 text-white bg-gray-700 rounded hover:bg-gray-600"
                    >
                        &lt;
                    </button>
                )}
                {pageNumbers.map(number => (
                    <button
                        key={number}
                        onClick={() => handlePageChange(number)}
                        className={`px-3 py-1 rounded transition 
                            ${number === currentPage ? 'text-gray-900 bg-yellow-400 font-bold' : 'text-white bg-gray-800 hover:bg-gray-700'}`}
                    >
                        {number}
                    </button>
                ))}
                {pagingInfo.next && (
                    <button 
                        onClick={() => handlePageChange(pagingInfo.endPage + 1)}
                        className="px-3 py-1 text-white bg-gray-700 rounded hover:bg-gray-600"
                    >
                        &gt;
                    </button>
                )}
                {pagingInfo.next && (
                    <button 
                        onClick={() => handlePageChange(totalPages)}
                        className="px-3 py-1 text-white bg-gray-700 rounded hover:bg-gray-600"
                    >
                        &raquo;
                    </button>
                )}
            </div>
        );
    };

    useEffect(() => {
        const initialCategoryForApi = getCategoryName(activeCategory);
        fetchPosts(1, currentKeyword, initialCategoryForApi);
        fetchCategories();
        fetchHotPosts();
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-gray-900 overflow-hidden">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
                {/* 페이지 제목 및 검색창 */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-center border-b border-gray-700 pb-4">
                    <h1 className="text-4xl font-extrabold text-yellow-400 mb-4 md:mb-0">커뮤니티 ({pagingInfo.totalCount}건)</h1>
                    <form onSubmit={handleSearch} className="flex w-full md:w-96">
                        <select
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                            className="p-3 bg-gray-700 text-white rounded-l-lg border border-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none flex-shrink-0"
                        >
                            {searchOptions.map(option => (
                                <option key={option.code} value={option.code}>{option.name}</option>
                            ))}
                        </select>
                        <input 
                            type="text"
                            placeholder="검색어를 입력하세요..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 bg-gray-700 text-white border border-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none"
                        />
                        <button type="submit" className="p-3 bg-gray-600 rounded-r-lg hover:bg-gray-500 transition">
                            <Search className="w-6 h-6 text-yellow-400" />
                        </button>
                    </form>
                </div>

                {/* 메인 콘텐츠 영역: 게시판 목록 (왼쪽) vs. 사이드바 (오른쪽) */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full">
                    {/* 게시판 목록 (왼쪽, 3/4 너비) */}
                    <div className="lg:col-span-3 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 flex flex-col">
                        <div className="flex justify-between items-center p-5 border-b border-gray-700">
                            <h2 className="text-2xl font-bold text-white flex items-center">
                                <List className="w-6 h-6 mr-2 text-yellow-400" />
                                {getCategoryName(activeCategory)} 게시글 목록
                            </h2>
                            <button 
                                onClick={handleCreatePostClick}
                                className="flex items-center px-4 py-2 bg-yellow-400 text-gray-900 font-bold rounded-lg shadow-md hover:bg-yellow-500 transition"
                            >
                                <Plus className="w-5 h-5 mr-1" />
                                글쓰기
                            </button>
                        </div>
                        <div className="hidden sm:flex items-center justify-between p-4 bg-gray-700 text-gray-400 text-sm font-semibold">
                            <span className="flex-1 min-w-0 pr-4">제목</span>
                            <div className="flex space-x-6 flex-shrink-0">
                                <span className="w-20 text-center">작성자</span>
                                <span className="w-12 text-center">조회</span>
                                <span className="w-12 text-center">추천</span>
                                <span className="w-12 text-center">댓글</span>
                                <span className="w-20 text-center">날짜</span>
                            </div>
                        </div>
                        {/* 게시글 목록 - 내부 스크롤 */}
                        <div className="divide-y divide-gray-700 flex-1 overflow-y-auto">
                            {posts.length > 0 ? (
                                posts.map((post) => (
                                    <PostItem 
                                        key={post.postId} 
                                        type={post.categoryCode === 'NOTICE' ? 'notice' : 'free'}
                                        title={post.title}
                                        authorNickname={post.userNickname || post.userId}
                                        date={post.createdDate}
                                        postId={post.postId}
                                        navigate={navigate}
                                        viewCount={post.viewCount}
                                        likeCount={post.likeCount}
                                        replyCount={post.replyCount || 0}
                                        onLikeClick={handleLikeClick}
                                    />
                                ))
                            ) : (
                                <div className="text-center p-10 text-gray-400">
                                    {currentKeyword ? `'${currentKeyword}'에 대한 검색 결과가 없습니다.` : '등록된 게시글이 없습니다.'}
                                </div>
                            )}
                        </div>
                        {pagingInfo.totalCount > 0 && renderPagination()}
                    </div>

                    {/* 사이드바 (오른쪽, 1/4 너비) */}
                    <div className="space-y-8 flex flex-col">
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex-1 overflow-y-auto">
                            <h3 className="text-2xl font-bold mb-4 text-white border-b border-yellow-400 pb-2">
                                🔥 HOT 인기 게시글
                            </h3>
                            <div className="space-y-3">
                                {hotPosts.length > 0 ? (
                                    hotPosts.map((post, index) => (
                                        <p 
                                            key={post.postId} 
                                            className="text-gray-300 text-sm hover:text-yellow-400 transition cursor-pointer flex justify-between"
                                            onClick={() => navigate(`/community/${post.postId}`)}
                                        >
                                            <span className="font-medium truncate pr-2">{index + 1}. {post.title}</span>
                                            <span className="text-gray-500 flex-shrink-0"><ThumbsUp className="w-4 h-4 inline mr-1" />{post.likeCount}</span>
                                        </p>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 text-sm">인기 게시글이 없습니다.</p>
                                )}
                            </div>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <h3 className="text-2xl font-bold mb-4 text-white border-b border-yellow-400 pb-2 flex items-center">
                                <Tag className="w-5 h-5 mr-2 text-yellow-400" />
                                카테고리
                            </h3>
                            <div className="space-y-2">
                                {categories.map((cat) => (
                                    <div 
                                        key={cat.categoryCode}
                                        onClick={() => handleCategoryClick(cat.categoryCode)}
                                        className={`flex justify-between items-center p-3 rounded-lg transition cursor-pointer 
                                            ${activeCategory === cat.categoryCode ? 'bg-yellow-400 text-gray-900 font-bold' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                    >
                                        <span>{getCategoryName(cat.categoryCode)}</span>
                                        <span>({cat.postCount})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default CommunityPage;