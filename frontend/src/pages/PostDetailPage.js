import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header'; 
import Footer from '../components/Footer';
import { ThumbsUp, Eye, Tag, MessageSquare, Edit3, Trash2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:8080/community';

// --- MessageToast Component ---
const MessageToast = ({ message, isError, onClose }) => {
    if (!message) return null;

    const bgColor = isError ? 'bg-red-600' : 'bg-yellow-500';
    const textColor = isError ? 'text-white' : 'text-gray-900';
    const icon = isError ? <XCircle className="w-5 h-5 mr-2" /> : <ThumbsUp className="w-5 h-5 mr-2" />;

    return (
        <div className="fixed top-20 right-5 z-50">
            <div 
                className={`flex items-center ${bgColor} ${textColor} p-4 rounded-lg shadow-xl transition-opacity duration-300`}
                style={{ minWidth: '300px' }}
            >
                {icon}
                <span className="font-semibold">{message}</span>
                <button onClick={onClose} className="ml-auto opacity-75 hover:opacity-100 transition">
                    <XCircle className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// --- ConfirmModal Component ---
const ConfirmModal = ({ show, title, message, onConfirm, onCancel }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700 w-full max-w-md transform transition-all duration-300 scale-100 opacity-100">
                <h3 className="text-xl font-bold text-red-400 mb-4 border-b border-gray-700 pb-2">{title}</h3>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-500 transition"
                    >
                        취소
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-500 transition"
                    >
                        삭제 실행
                    </button>
                </div>
            </div>
        </div>
    );
};

// 가상의 댓글 컴포넌트 (디자인 목업용)
const DummyComment = ({ nickname, content, date }) => (
    <div className="border-t border-gray-700 pt-3 pb-2">
        <div className="flex justify-between items-center text-sm mb-1">
            <span className="font-semibold text-yellow-400">{nickname}</span>
            <span className="text-gray-500 text-xs">{date}</span>
        </div>
        <p className="text-gray-300 text-sm">{content}</p>
    </div>
);

const PostDetailPage = () => {
    const { postId } = useParams(); 
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [currentLikeCount, setCurrentLikeCount] = useState(0); 
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { user, token } = useAuth(); 
    const currentUserId = user?.userId;
    const hasIncrementedView = useRef(false);

    // --- Toast State ---
    const [toastMessage, setToastMessage] = useState(null);
    const [isErrorToast, setIsErrorToast] = useState(false);

    const showMessage = useCallback((msg, isError = false) => {
        setIsErrorToast(isError);
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000); // 3초 후 자동 숨김
    }, []);

    // 작성자 ID와 현재 로그인 사용자 ID 일치 여부 확인 (권한 로직)
    const isAuthor = user && post?.userId && (user.userId === post.userId);


    // 1. 게시글 상세 정보를 불러오는 함수를 useCallback으로 정의
    const fetchPostDetail = useCallback(async (shouldSetLoading = true) => {
        if (!postId) {
            if (shouldSetLoading) setLoading(false);
            return;
        }
        try {
            if (shouldSetLoading) setLoading(true); // 로딩 상태를 관리
            const headers = {};
            if (token) { 
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/${postId}`, { headers });
            
            if (!response.ok) {
                if (shouldSetLoading && response.status !== 404) {
                    showMessage(`게시글 상세 정보 조회 실패: ${response.status}`, true);
                }
                throw new Error(`게시글 상세 정보 조회 실패: ${response.status}`);
            }
            const data = await response.json(); 
            
            setPost(data);
            setCurrentLikeCount(data.likeCount || 0);
            setIsLiked(data.liked || false); 

        } catch (error) {
            console.error("게시글 상세 조회 에러:", error);
            if (shouldSetLoading) setPost(null); 
        } finally {
            if (shouldSetLoading) setLoading(false);
        }
    }, [postId, token, showMessage]);

    // 1-1. 게시글 상세 정보 최초 조회 (최초 마운트 및 토큰 변경 시)
    useEffect(() => {
        fetchPostDetail(true); // 로딩 상태를 설정하며 최초 조회
    }, [fetchPostDetail]);

    // 2. 조회수 증가 및 업데이트 (페이지가 새로 로드될 때마다 실행)
    useEffect(() => {
        if (!postId) return;

        if(hasIncrementedView.current){
            return;
        }

        hasIncrementedView.current = true;
        
        const incrementViewCount = async () => {
            try {
                // 조회수 증가 API 호출
                const response = await fetch(`${API_BASE_URL}/view/${postId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    // **조회수 증가 성공 시, 최신 상세 정보를 서버에서 다시 가져와 상태 업데이트**
                    // 로딩 상태를 변경하지 않기 위해 false를 전달
                    await fetchPostDetail(false); 
                    
                } else {
                    console.warn(`View count increment failed with status: ${response.status}`);
                    // 서버 응답이 실패하면 클라이언트에서만 임시로 뷰 카운트 증가 (권장되지 않음, 서버가 확실히 최신 데이터를 줘야 함)
                    /* setPost(prev => {
                        if (prev && prev.viewCount !== undefined) {
                            return { ...prev, viewCount: prev.viewCount + 1 };
                        }
                        return prev;
                    });
                    */
                }
            } catch (error) {
                console.error("View count increment failed:", error);
            }
        };

        // 컴포넌트 마운트 시 조회수 증가 요청
        incrementViewCount();
        
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postId, fetchPostDetail]); // fetchPostDetail을 의존성 배열에 추가 (ESLint 규칙 준수)

    // 좋아요 토글 핸들러 
    const handleLikeToggle = async() =>{
        // 로그인 상태 확인 및 userId 확보
        if(!currentUserId || !token){
            showMessage('로그인 후 추천할 수 있습니다.', true);
            return;
        }

        const LIKE_TOGGLE_URL = `${API_BASE_URL}/like/toggle`;

        try{
            const response = await fetch(LIKE_TOGGLE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, 
                },
                body: JSON.stringify({ 
                    postId: postId, 
                }) 
            });

            if (!response.ok) {
                let errorDetail = `상태 코드: ${response.status}`;
                try {
                    const errorData = await response.json(); 
                    errorDetail = errorData.message || errorDetail;
                } catch (e) {}
            
                if (response.status === 401 || response.status === 403) {
                    showMessage(`권한 오류: ${errorDetail}`, true);
                } else {
                    showMessage(`추천 처리 실패: ${errorDetail}`, true);
                }
                
                throw new Error(`추천 처리 실패: ${errorDetail}`); 
            }

            const resultData = await response.json();

            // 서버 응답: { likeStatus: boolean, newLikeCount: number }
            const newIsLiked = resultData.likeStatus;
            const newCount = resultData.newLikeCount;

            setIsLiked(newIsLiked);
            setCurrentLikeCount(newCount); 
            setPost(prev => prev ? ({ ...prev, likeCount: newCount}) : null); 

            const successMsg = newIsLiked ? "게시글을 추천했습니다!" : "추천을 취소했습니다.";
            showMessage(successMsg, false);

        } catch (error){
            console.error("추천 기능 처리 중 오류 발생:", error); 
        }
    };
    
    // 수정 버튼 클릭 핸들러
    const handleEdit = () => {
        if (!isAuthor) {
            showMessage("수정 권한이 없습니다.", true);
            return;
        }
        showMessage("게시글 수정 페이지로 이동합니다.", false);
        navigate(`/community/edit/${postId}`); 
    };

    // 삭제 로직
    const executeDelete = async () => {
        setShowDeleteConfirm(false);

       if (!token || !isAuthor) {
            showMessage("삭제 권한이 없거나 인증 정보가 부족합니다.", true);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                let errorDetail = `상태 코드: ${response.status}`;
                try {
                    const errorData = await response.json(); 
                    errorDetail = errorData.message || errorData.detail || errorDetail;
                } catch (e) {}
                
                throw new Error(errorDetail);
            }

            showMessage("게시글이 성공적으로 삭제되었습니다. 🎉", false);
            // 2초 후 목록 페이지로 이동
            setTimeout(() => navigate('/community'), 2000); 

        } catch (error) {
            console.error("게시글 삭제 오류:", error);
            showMessage(`게시글 삭제 중 오류가 발생했습니다: ${error.message}`, true);
        }
    };


    // 삭제 버튼 클릭 핸들러
    const handleDelete = () => {
        if (!isAuthor) {
            showMessage("삭제 권한이 없습니다.", true);
            return;
        }
        // 커스텀 모달 표시
        setShowDeleteConfirm(true); 
    };

    // 로딩 및 에러 처리 (원래 코드 유지)
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-yellow-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                로딩 중...
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col">
                <Header />
                <div className="flex-grow flex justify-center items-center">
                    게시글을 찾을 수 없거나 삭제되었거나 로드에 실패했습니다.
                </div>
                <Footer />
            </div>
        );
    }

    // 작성 날짜 포맷팅
    const formattedDate = new Date(post.createdDate).toLocaleDateString('ko-KR', { 
        year: 'numeric', month: '2-digit', day: '2-digit' 
    }).replace(/\.\s/g, '.').replace(/\.$/, ''); 

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
            <Header />
            {/* 토스트 메시지 컴포넌트 */}
            <MessageToast 
                message={toastMessage} 
                isError={isErrorToast} 
                onClose={() => setToastMessage(null)}
            />
            <ConfirmModal
                show={showDeleteConfirm}
                title="게시글 삭제 확인"
                message="정말로 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                onConfirm={executeDelete} 
                onCancel={() => setShowDeleteConfirm(false)} 
            />

            <main className="w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
                
                <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 w-full">
                    
                    {/* 상단 메타 정보 */}
                    <div className="flex justify-between items-center text-gray-400 mb-2 border-b border-gray-700 pb-2">
                        <div className="flex items-center space-x-2 text-sm">
                            <span className="font-semibold text-white">{post.userNickname || post.userId}</span>
                            <span>|</span>
                            <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs">
                            <span className="flex items-center"><Eye className="w-3 h-3 mr-1" />{post.viewCount}</span>
                            <span className="flex items-center"><ThumbsUp className="w-3 h-3 mr-1" />{currentLikeCount}</span> 
                            <span className="flex items-center"><MessageSquare className="w-3 h-3 mr-1" />3</span> 
                            
                            {/* 관리 버튼 영역 (작성자에게만 표시) */}
                            {isAuthor && (
                                <div className="flex space-x-2 text-yellow-400 font-medium">
                                    <button 
                                        onClick={handleEdit} 
                                        className="flex items-center hover:text-yellow-300 text-sm transition"
                                    >
                                        <Edit3 className="w-3 h-3 mr-1" /> 수정
                                    </button>
                                    <button 
                                        onClick={handleDelete} 
                                        className="flex items-center hover:text-red-400 text-sm transition"
                                    >
                                        <Trash2 className="w-3 h-3 mr-1" /> 삭제
                                    </button>
                                </div>
                            )}

                            <span className="text-gray-500 text-xs flex items-center"><Tag className="w-3 h-3 mr-1" />{post.categoryCode}</span>
                        </div>
                    </div>

                    {/* 제목 */}
                    <h1 className="text-3xl font-extrabold text-white mb-6 pt-2">{post.title}</h1>
                    
                    {/* 본문 */}
                    <div className="prose prose-invert max-w-none text-white min-h-[150px] pb-6">
                        <p>{post.content}</p> 
                    </div>
                    
                    {/* 추천/신고 버튼 섹션 */}
                    <div className="flex justify-center items-center space-x-4 py-6 border-y border-gray-700 mb-8">
                        <button 
                            onClick={handleLikeToggle}
                            className={`flex items-center justify-center px-6 py-2 rounded-full font-bold transition
                                ${isLiked
                                    ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400 transform scale-105' 
                                    : 'bg-gray-700 text-white hover:bg-gray-600 border border-yellow-500' 
                                }`}
                        > 
                            <ThumbsUp className={`w-5 h-5 mr-2 ${isLiked ? '' : 'text-yellow-500'}`} /> 
                            {isLiked ? '추천 취소' : '추천'} ({currentLikeCount}) 
                        </button>
                        <button className="text-gray-400 text-sm hover:text-red-400">
                            신고
                        </button>
                    </div>

                    {/* 댓글 섹션 */}
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                        댓글 <span className="text-yellow-400 ml-2">(3)</span>
                    </h2>

                    {/* 댓글 작성 폼 */}
                    <div className="bg-gray-700 p-4 rounded-lg mb-6 border border-gray-600">
                        <textarea 
                            className="w-full bg-gray-600 text-white p-3 rounded-lg border border-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            rows="3"
                            placeholder="여기에 댓글을 작성하세요."
                        ></textarea>
                        <div className="flex justify-end mt-2">
                            <button className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-400 transition">
                                댓글 등록
                            </button>
                        </div>
                    </div>

                    {/* 댓글 목록 */}
                    <div className="space-y-4">
                        <DummyComment nickname="댓글러1" content="저도 해봤는데 진짜 신세계예요! 특히 머리카락 디테일이 인상 깊었습니다." date="2025.10.14"/>
                        <DummyComment nickname="금손이네" content="이제 저도 금손이 될 수 있겠네요 ㅠㅠ" date="2025.10.14"/>
                        <DummyComment nickname="운영자" content="좋은 후기 감사합니다! 버그는 현재 수정 작업 중에 있습니다." date="2025.10.14"/>
                    </div>
                    
                    {/* 목록으로 버튼 */}
                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={() => navigate('/community')}
                            className="px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-500 transition"
                        >
                            목록으로
                        </button>
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PostDetailPage;