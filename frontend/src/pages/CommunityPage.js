import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, Eye, Search, Plus, List, Tag } from 'lucide-react'; 
import Header from '../components/Header'; 
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext'; // 필요하다면 주석 해제

// 게시글 목록을 위한 서브 컴포넌트
const PostItem = ({ type, title, author, views, likes, comments, date, id, navigate }) => {
    const isNotice = type === 'notice';
    const tagColor = isNotice ? 'bg-red-600' : 'bg-yellow-600';

    return (
        <div 
            className="flex items-center justify-between p-4 border-b border-gray-700 hover:bg-gray-700 transition duration-150 cursor-pointer group"
            onClick={() => navigate(`/community/%{id}`)}   
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
                <span className="w-20 truncate text-center">{author}</span>
                
                <div className="flex items-center space-x-1.5 w-12 justify-center">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span>{views}</span>
                </div>
                
                <div className="flex items-center space-x-1.5 w-12 justify-center">
                    <ThumbsUp className="w-4 h-4 text-gray-500" />
                    <span>{likes}</span>
                </div>
                
                <div className="flex items-center space-x-1.5 w-12 justify-center">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    <span>{comments}</span>
                </div>
                
                <span className="w-20 text-center">{date}</span>
            </div>
            
        </div>
    );
};

// 더미 데이터
const dummyPosts = [
    { type: 'notice', title: '운영정책 개정 및 신규 업데이트 사전 안내', author: 'GM_게임맨', views: 8900, likes: 50, comments: 10, date: '2025.10.12' },
    { type: 'notice', title: '10/14 (화) 임시 점검 완료 및 보상 지급', author: 'GM_게임맨', views: 7200, likes: 35, comments: 5, date: '2025.10.14' },
    { type: 'free', title: 'AI 캐릭터 커스터마이징 기능 써보신 분 후기좀', author: '겜돌이99', views: 1240, likes: 120, comments: 45, date: '2025.10.14' },
    { type: 'free', title: '밸런스 패치 이대로 괜찮은가? (의견 모음)', author: '현질러짱', views: 3500, likes: 250, comments: 98, date: '2025.10.13' },
    { type: 'free', title: '다이아몬드 III 달성 팁 공유합니다! (인증샷)', author: '롤만하는애', views: 5800, likes: 450, comments: 112, date: '2025.10.12' },
    { type: 'free', title: '오늘 저녁에 같이 파티하실 분 구해요!', author: '솔로탈출', views: 420, likes: 15, comments: 5, date: '2025.10.11' },
    { type: 'free', title: '이번 이벤트 보상 효율 괜찮은가요?', author: '뉴비에요', views: 800, likes: 40, comments: 20, date: '2025.10.10' },
];

const categories = [
    { name: '전체', count: 1200 },
    { name: '자유 게시판', count: 850 },
    { name: '질문/답변', count: 250 },
    { name: '팁/정보', count: 80 },
    { name: '거래', count: 20 },
];

const CommunityPage = () => {
    // const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState('전체');

    const handleSearch = (e) => {
        e.preventDefault();
        // 실제 검색 로직 (API 호출 등)
        console.log('Searching for:', searchTerm);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
                
                {/* 1. 페이지 제목 및 검색창 */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-center border-b border-gray-700 pb-4">
                    <h1 className="text-4xl font-extrabold text-yellow-400 mb-4 md:mb-0">커뮤니티</h1>
                    
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
                                onClick={() => navigate('/create-post')}
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
                        <div className="divide-y divide-gray-700">
                            {dummyPosts.map((post, index) => (
                                <PostItem key={index} 
                                            {...post} 
                                            id={index + 1}
                                            navigate={navigate}
                                />
                            ))}
                        </div>

                        {/* 페이지네이션 (더미) */}
                        <div className="p-4 flex justify-center space-x-2">
                            <button className="px-3 py-1 text-yellow-400 bg-gray-700 rounded hover:bg-gray-600">1</button>
                            <button className="px-3 py-1 text-white bg-gray-800 rounded hover:bg-gray-700">2</button>
                            <button className="px-3 py-1 text-white bg-gray-800 rounded hover:bg-gray-700">3</button>
                        </div>
                    </div>

                    {/* 2-2. 사이드바 (오른쪽, 1/3 너비) */}
                    <div className="space-y-8">
                        
                        {/* 인기 게시글 */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <h3 className="text-2xl font-bold mb-4 text-white border-b border-yellow-400 pb-2">
                                🔥 HOT 인기 게시글
                            </h3>
                            <div className="space-y-3">
                                {dummyPosts.slice(0, 3).map((post, index) => (
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