import React, { useEffect, useState } from 'react';
import { MessageSquare, ThumbsUp, Eye, Search, Plus, List, Tag, UserStar } from 'lucide-react'; 
import Header from '../components/Header'; 
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

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

const categories = [
    { name: '전체', count: 1200 },
    { name: '자유 게시판', count: 850 },
    { name: '질문/답변', count: 250 },
    { name: '팁/정보', count: 80 },
    { name: '거래', count: 20 },
];

const CommunityPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [posts, setPosts] = useState([]); // 실제 게시글 목록
    const [pagingInfo, setPagingInfo] = useState({
        pageNum: 1,
        amount: 10,
        totalCount: 0,
        startPage: 1,
        endPage: 1,
        prev: false,
        next: false
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentKeyword, setCurrentKeyword] = useState('');
    const [activeCategory, setActiveCategory] = useState('전체');

    // API 호출 함수
    const fetchPosts = async(page, keyword = '') =>{
        try{
            let url = `${API_BASE_URL}?pageNum=${page}&amount=${pagingInfo.amount}`;
            
            if(keyword){
                url += `&searchKeyword=${keyword}`;
            }

            const response = await fetch(url);

            if(!response.ok){
                throw new Error('네트워크 응답 실패');
            }

            const data = await response.json();

            setPosts(data.list || []); 
            setPagingInfo(data.pageNum || pagingInfo); // 페이징 정보 업데이트
            setCurrentPage(page);

        } catch(error){
            console.error("게시글 목록 조회 실패:", error);
        }
    };
    
    // 글쓰기 버튼 클릭 핸들러
    const handleCreatePostClick = () => {
        if(!user){
            // 로그인되어 있지 않다면
            alert('게시글 작성을 위해 로그인이 필요합니다.');
            navigate('/login');
        } else{
            // 로그인되어 있다면
            navigate('/create-post');
        }
    }

    // 검색 버튼/엔터 클릭 핸들러
    const handleSearch = (e) => {
        e.preventDefault();
        
        // 검색 실행: vpdlwlfmf 1로 초기화하고, 입력된 검색어로 API 호출
        fetchPosts(1, searchTerm);
    };

    // 페이지 번호 클릭 핸들러
    const handlePageChange = (page) => {
        if (page > 0 && page <= Math.ceil(pagingInfo.totalCount / pagingInfo.amount)) {
            fetchPosts(page, currentKeyword);
        }
    };

    // 컴포넌트 마운트 시 최초 데이터 로드
    useEffect(() => {
        // 최초 로딩 시, 기본 페이지(1)와 빈 검색어로 호출
        fetchPosts(1, currentKeyword);
    }, []);

    const renderPagination = () => {
        const pageNumbers = [];
        for(let i = pagingInfo.startPage; i <= pagingInfo.endPage; i++){
            pageNumbers.push(i);
        }

        return (
            <div className="p-4 flex justify-center space-x-2">
                {/* 이전 페이지 버튼 */}
                {pagingInfo.prev && (
                    <button 
                        onClick={() => handlePageChange(pagingInfo.startPage - 1)} 
                        className="px-3 py-1 text-white bg-gray-700 rounded hover:bg-gray-600"
                    >
                        &lt;
                    </button>
                )}

                {/* 페이지 번호 */}
                {pageNumbers.map(number => (
                    <button
                        key={number}
                        onClick={() => handlePageChange(number)}
                        className={`px-3 py-1 rounded transition 
                            ${number === currentPage ? 'text-gray-900 bg-yellow-400 font-bold' : 'text-white bg-gray-800 hover:bg-gray-700'}`
                        }
                    >
                        {number}
                    </button>
                ))}

                {/* 다음 페이지 버튼 */}
                {pagingInfo.next && (
                    <button 
                        onClick={() => handlePageChange(pagingInfo.endPage + 1)} 
                        className="px-3 py-1 text-white bg-gray-700 rounded hover:bg-gray-600"
                    >
                        &gt;
                    </button>
                )}
            </div>
        );
    };

    const handleLikeClick = async (postId) => {
        if (!user) {
            alert('좋아요를 위해 로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/like/${postId}`, {
                method: 'POST', // 좋아요는 보통 POST나 PUT
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('좋아요 업데이트 실패');
            }

            fetchPosts(currentPage, currentKeyword); 

        } catch (error) {
            console.error("좋아요 처리 실패:", error);
            alert('좋아요 처리 중 오류가 발생했습니다.');
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
                
                {/* 1. 페이지 제목 및 검색창 */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-center border-b border-gray-700 pb-4">
                    <h1 className="text-4xl font-extrabold text-yellow-400 mb-4 md:mb-0">커뮤니티 ({pagingInfo.totalCount}건)</h1>
                    
                    {/* 검색 폼 */}
                    <form onSubmit={handleSearch} className="flex w-full md:w-96">
                        <input 
                            type="text"
                            placeholder="제목, 내용, 작성자 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 bg-gray-700 text-white rounded-l-lg border border-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none"
                        />
                        <button type="submit" className="p-3 bg-gray-600 rounded-r-lg hover:bg-gray-500 transition">
                            <Search className="w-6 h-6 text-yellow-400" />
                        </button>
                    </form>
                </div>

                {/* 2. 메인 콘텐츠 영역: 게시판 목록 (왼쪽) vs. 사이드바 (오른쪽) */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* 2-1. 게시판 목록 (왼쪽, 2/3 너비) */}
                    <div className="lg:col-span-3 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
                        
                        {/* 게시판 헤더 및 글쓰기 버튼 */}
                        <div className="flex justify-between items-center p-5 border-b border-gray-700">
                            <h2 className="text-2xl font-bold text-white flex items-center">
                                <List className="w-6 h-6 mr-2 text-yellow-400" />
                                {activeCategory} 게시글 목록
                            </h2>
                            <button 
                                onClick={handleCreatePostClick}
                                className="flex items-center px-4 py-2 bg-yellow-400 text-gray-900 font-bold rounded-lg shadow-md hover:bg-yellow-500 transition"
                            >
                                <Plus className="w-5 h-5 mr-1" />
                                글쓰기
                            </button>
                        </div>

                        {/* 게시글 리스트 헤더 (PC 전용) */}
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

                        {/* 게시글 목록 */}
                        <div className="divide-y divide-gray-700 min-h-[300px]">
                            {posts.length > 0 ? (
                                posts.map((post) => (
                                    <PostItem 
                                        key={post.postId} 
                                        type={'free'} 
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

                        {/* 페이지네이션 */}
                        {pagingInfo.totalCount > 0 && renderPagination()}
                    </div>

                    {/* 2-2. 사이드바 (오른쪽, 1/3 너비) */}
                    <div className="space-y-8">
                        
                        {/* 인기 게시글 */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <h3 className="text-2xl font-bold mb-4 text-white border-b border-yellow-400 pb-2">
                                🔥 HOT 인기 게시글
                            </h3>
                            <div className="space-y-3">
                                {categories.slice(0, 3).map((post, index) => (
                                    <p key={index} className="text-gray-300 text-sm hover:text-yellow-400 transition cursor-pointer flex justify-between">
                                        <span className="font-medium truncate pr-2">{index + 1}. {post.title}</span>
                                        <span className="text-gray-500 flex-shrink-0"><ThumbsUp className="w-4 h-4 inline mr-1" />{post.likes}</span>
                                    </p>
                                ))}
                            </div>
                        </div>

                        {/* 카테고리 */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <h3 className="text-2xl font-bold mb-4 text-white border-b border-yellow-400 pb-2 flex items-center">
                                <Tag className="w-5 h-5 mr-2 text-yellow-400" />
                                카테고리
                            </h3>
                            <div className="space-y-2">
                                {categories.map((cat, index) => (
                                    <div 
                                        key={index}
                                        onClick={() => setActiveCategory(cat.name)}
                                        className={`flex justify-between items-center p-3 rounded-lg transition cursor-pointer 
                                            ${activeCategory === cat.name ? 'bg-yellow-400 text-gray-900 font-bold' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                    >
                                        <span>{cat.name}</span>
                                        <span>({cat.count})</span>
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