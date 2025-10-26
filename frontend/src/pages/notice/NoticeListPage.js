import React, { useEffect, useState } from 'react';
import { Plus, Eye } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 
import { getNotices } from '../../api/notice/noticeApi'; 

const NoticeItem = ({ title, authorNickname, date, noticeId, navigate, viewCount, isPinned }) => {
    const tagColor = isPinned ? 'bg-red-600' : 'bg-gray-600';
    const titleStyle = isPinned ? 'font-bold text-red-300' : 'font-medium text-white';
    const displayAuthor = authorNickname === 'admin' ? '관리자' : authorNickname;

    return (
        <div 
            className="flex items-center justify-between p-4 border-b border-gray-700 hover:bg-gray-700 transition duration-150 cursor-pointer group"
            onClick={() => navigate(`/notice/${noticeId}`)}   
        >    
            {/* 제목 및 태그 */}
            <div className="flex-1 min-w-0 pr-4 flex items-center">
                <span className={`inline-block px-2 py-0.5 mr-3 text-xs font-bold rounded-md text-white ${tagColor} flex-shrink-0`}>
                    {isPinned ? '📌 공지' : '일반'}
                </span>
                <span className={`text-lg truncate group-hover:text-yellow-400 ${titleStyle}`}>
                    {title}
                </span>
            </div>

            {/* 정보 (모바일에서는 숨김) */}
            <div className="hidden sm:flex items-center text-sm text-gray-400 space-x-6 flex-shrink-0">
                <span className="w-20 truncate text-center">{displayAuthor}</span>
                
                <div className="flex items-center space-x-1.5 w-12 justify-center">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span>{viewCount || 0}</span>
                </div>
                
                <span className="w-20 text-center">{new Date(date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '-').slice(0, -1)}</span>
            </div>
        </div>
    );
};


const NoticeListPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [notices, setNotices] = useState([]);
    const [pagingInfo, setPagingInfo] = useState({
        totalCount: 0,
        currentPage: 1,
        pageSize: 10,
        totalPages: 1,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const IS_ADMIN = user && user.role === 'ADMIN';

    // API 호출 함수: getNotices 함수 사용
    const fetchNotices = async(page) =>{
        try{
            const data = await getNotices(page, 5);
            
            const totalPages = Math.ceil(data.totalCount / data.pageSize);

            setNotices(data.noticeList || []); 
            setPagingInfo({
                totalCount: data.totalCount,
                currentPage: data.currentPage,
                pageSize: data.pageSize,
                totalPages: totalPages
            });
            setCurrentPage(page);

        } catch(error){
            console.error("공지사항 목록 조회 실패:", error);
        }
    };
    
    const handleCreateNoticeClick = () => {
        if(!IS_ADMIN){
            alert('공지사항 등록은 관리자만 가능합니다.');
            return;
        }
        navigate('/admin/notice/new');
    }

    const handlePageChange = (page) => {
        if (page > 0 && page <= pagingInfo.totalPages) {
            fetchNotices(page);
        }
    };

    const renderPagination = () => {
        const totalPages = pagingInfo.totalPages;
        const pageGroupSize = 5;
        const startPage = Math.floor((currentPage - 1) / pageGroupSize) * pageGroupSize + 1;
        const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);
        
        const pageNumbers = [];
        for(let i = startPage; i <= endPage; i++){
            pageNumbers.push(i);
        }

        return (
            <div className="p-4 flex justify-center space-x-2">
                {startPage > 1 && (
                    <button 
                        onClick={() => handlePageChange(startPage - 1)} 
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
                            ${number === currentPage ? 'text-gray-900 bg-yellow-400 font-bold' : 'text-white bg-gray-800 hover:bg-gray-700'}`
                        }
                    >
                        {number}
                    </button>
                ))}
                {endPage < totalPages && (
                    <button 
                        onClick={() => handlePageChange(endPage + 1)} 
                        className="px-3 py-1 text-white bg-gray-700 rounded hover:bg-gray-600"
                    >
                        &gt;
                    </button>
                )}
            </div>
        );
    };

    // 컴포넌트 마운트 및 페이지 변경 시 데이터 로드
    useEffect(() => {
        fetchNotices(1);
    }, []);

    return (
        <div className="h-screen flex flex-col bg-gray-900 overflow-hidden">
            <Header />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full">
                
                <div className="mb-8 flex justify-between items-center border-b border-gray-700 pb-4">
                    <h1 className="text-4xl font-extrabold text-yellow-400">공지사항 ({pagingInfo.totalCount}건)</h1>
                    
                    {IS_ADMIN && (
                        <button 
                            onClick={handleCreateNoticeClick}
                            className="flex items-center px-4 py-2 bg-yellow-400 text-gray-900 font-bold rounded-lg shadow-md hover:bg-yellow-500 transition"
                        >
                            <Plus className="w-5 h-5 mr-1" />
                            공지 등록
                        </button>
                    )}
                </div>

                <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
                    
                    <div className="hidden sm:flex items-center justify-between p-4 bg-gray-700 text-gray-400 text-sm font-semibold">
                        <span className="flex-1 min-w-0 pr-4">제목</span>
                        <div className="flex space-x-6 flex-shrink-0">
                            <span className="w-20 text-center">작성자</span>
                            <span className="w-12 text-center">조회</span>
                            <span className="w-20 text-center">날짜</span>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-700 min-h-[300px]">
                        {notices.length > 0 ? (
                            notices.map((notice) => (
                                <NoticeItem 
                                    key={notice.noticeId} 
                                    title={notice.noticeTitle}
                                    authorNickname={notice.createdBy}
                                    date={notice.createdDate}
                                    noticeId={notice.noticeId}
                                    navigate={navigate}
                                    viewCount={notice.noticeViewCount}
                                    isPinned={notice.isPinned}
                                />
                            ))
                        ) : (
                            <div className="text-center p-10 text-gray-400">
                                등록된 공지사항이 없습니다.
                            </div>
                        )}
                    </div>

                    {pagingInfo.totalCount > 0 && renderPagination()}
                </div>
            </main>
            
            <Footer />
        </div>
    );
};

export default NoticeListPage;