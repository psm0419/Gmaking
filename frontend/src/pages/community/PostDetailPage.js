// community/PostDetailPage.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ThumbsUp, Eye, Tag, MessageSquare, Edit3, Trash2, Loader2, Send, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// 같은 폴더 내 모달 & 컴포넌트 import
import ReportModal from './ReportModal';
import ProfileSummaryModal from './ProfileSummaryModal';
import ConfirmModal from './ConfirmModal';
import Comment from './Comment';
import ReplyForm from './ReplyForm';

const API_BASE_URL = 'http://localhost:8080/community';

const PostDetailPage = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();

    // 상태 관리
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentLikeCount, setCurrentLikeCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const hasIncrementedView = useRef(false);

    const [comments, setComments] = useState([]);
    const [newCommentContent, setNewCommentContent] = useState('');
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentSubmitting, setCommentSubmitting] = useState(false);

    const [replyingToCommentId, setReplyingToCommentId] = useState(null);
    const [replyingToNickname, setReplyingToNickname] = useState(null);
    const [replyCommentContent, setReplyCommentContent] = useState('');

    const [toastMessage, setToastMessage] = useState(null);
    const [isErrorToast, setIsErrorToast] = useState(false);

    const [showProfileModal, setShowProfileModal] = useState(false);
    const [modalProfileData, setModalProfileData] = useState(null);

    const [showReportModal, setShowReportModal] = useState(false);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportTarget, setReportTarget] = useState({ type: null, id: null });

    const currentUserId = user?.userId;
    const isAuthor = user && post?.userId && (user.userId === post.userId);

    // 스크롤바 방지
    useEffect(() => {
        document.documentElement.classList.add("no-scrollbar");
        document.body.classList.add("no-scrollbar");
        return () => {
            document.documentElement.classList.remove("no-scrollbar");
            document.body.classList.remove("no-scrollbar");
        };
    }, []);

    // 토스트 메시지
    const showMessage = useCallback((msg, isError = false) => {
        setIsErrorToast(isError);
        setToastMessage(msg);
        const timer = setTimeout(() => setToastMessage(null), 3000);
        return () => clearTimeout(timer);
    }, []);

    // 댓글 가져오기
    const fetchComments = useCallback(async (shouldSetLoading = true) => {
        if (!postId) return;
        if (shouldSetLoading) setCommentsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/${postId}/comments`);
            if (!response.ok) throw new Error(`댓글 로드 실패: ${response.status}`);
            const data = await response.json();
            const sorted = data.sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate));
            setComments(sorted);
        } catch (error) {
            console.error("댓글 로드 실패:", error);
            if (shouldSetLoading) showMessage('댓글 로드 실패', true);
        } finally {
            if (shouldSetLoading) setCommentsLoading(false);
        }
    }, [postId, showMessage]);

    // 게시글 가져오기
    const fetchPostDetail = useCallback(async (shouldSetLoading = true) => {
        if (!postId) {
            if (shouldSetLoading) setLoading(false);
            return;
        }
        try {
            if (shouldSetLoading) setLoading(true);
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`${API_BASE_URL}/${postId}`, { headers });
            if (!response.ok) {
                if (response.status === 404) return setPost(null);
                throw new Error(`게시글 로드 실패: ${response.status}`);
            }
            const data = await response.json();
            setPost(data);
            setCurrentLikeCount(data.likeCount || 0);
            setIsLiked(data.liked || false);
        } catch (error) {
            console.error("게시글 로드 실패:", error);
            if (shouldSetLoading) setPost(null);
        } finally {
            if (shouldSetLoading) setLoading(false);
        }
    }, [postId, token]);

    // 답글 토글
    const handleReplyClick = useCallback((commentId, nickname) => {
        if (replyingToCommentId === commentId) {
            setReplyingToCommentId(null);
            setReplyingToNickname(null);
            setReplyCommentContent('');
        } else {
            setReplyingToCommentId(commentId);
            setReplyingToNickname(nickname);
            setReplyCommentContent(`@${nickname} `);
        }
    }, [replyingToCommentId]);

    // 프로필 모달
    const fetchUserProfileSummary = useCallback(async (userId) => {
        if (!userId) return;
        setModalProfileData(null);
        setShowProfileModal(true);
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}/profile-summary`, {
                headers: { 'Authorization': token ? `Bearer ${token}` : '' }
            });
            if (!response.ok) throw new Error(`프로필 로드 실패: ${response.status}`);
            const data = await response.json();
            setModalProfileData(data);
        } catch (error) {
            showMessage(`프로필 로드 실패: ${error.message}`, true);
            setShowProfileModal(false);
        }
    }, [token, showMessage]);

    const handleNicknameClick = useCallback((userId) => {
        fetchUserProfileSummary(userId);
    }, [fetchUserProfileSummary]);

    // 추천 토글
    const handleLikeToggle = async () => {
        if (!currentUserId || !token) return showMessage('로그인 후 추천 가능', true);
        try {
            const response = await fetch(`${API_BASE_URL}/like/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ postId })
            });
            if (!response.ok) throw new Error(`추천 실패: ${response.status}`);
            const { likeStatus, newLikeCount } = await response.json();
            setIsLiked(likeStatus);
            setCurrentLikeCount(newLikeCount);
            setPost(prev => prev ? { ...prev, likeCount: newLikeCount } : null);
            showMessage(likeStatus ? "추천했습니다!" : "추천 취소", false);
        } catch (error) {
            showMessage(`추천 실패: ${error.message}`, true);
        }
    };

    // 수정/삭제
    const handleEdit = () => isAuthor ? navigate(`/community/edit/${postId}`) : showMessage("수정 권한 없음", true);
    const executeDelete = async () => {
        setShowDeleteConfirm(false);
        if (!token || !isAuthor) return showMessage("삭제 권한 없음", true);
        try {
            const response = await fetch(`${API_BASE_URL}/${postId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`삭제 실패: ${response.status}`);
            showMessage("게시글 삭제됨", false);
            setTimeout(() => navigate('/community'), 2000);
        } catch (error) {
            showMessage(`삭제 실패: ${error.message}`, true);
        }
    };
    const handleDelete = () => isAuthor ? setShowDeleteConfirm(true) : showMessage("삭제 권한 없음", true);

    // 댓글 등록
    const handleSubmitComment = async (e) => {
        e.preventDefault();
        const content = newCommentContent.trim();
        if (!content) return showMessage("댓글을 입력하세요", true);
        if (content.startsWith('@')) {
            showMessage("대댓글은 '답글' 버튼으로 작성하세요", true);
            return;
        }
        if (!user || !token) return showMessage("로그인 필요", true);
        setCommentSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ content })
            });
            if (!response.ok) throw new Error(`댓글 등록 실패: ${response.status}`);
            setNewCommentContent('');
            showMessage('댓글이 등록되었습니다.', false);
            await fetchComments(false);
            await fetchPostDetail(false);
        } catch (error) {
            showMessage(`댓글 등록 실패: ${error.message}`, true);
        } finally {
            setCommentSubmitting(false);
        }
    };

    // 신고
    const handleReport = () => {
        if (!token || !currentUserId) return showMessage('로그인 후 신고 가능', true);
        setReportTarget({ type: 'POST', id: postId });
        setShowReportModal(true);
    };

    const handleReportComment = (commentId) => {
        setReportTarget({ type: 'COMMENT', id: commentId });
        setShowReportModal(true);
    };

    const executeReport = async (reason) => {
        if (!token) return;
        setReportLoading(true);
        const { type, id } = reportTarget;
        const url = type === 'POST'
            ? `${API_BASE_URL}/posts/${id}/report`
            : `${API_BASE_URL}/comments/${id}/report`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                // 서버가 targetType을 요구하지 않으면 body에서 제거할 수 있음.
                body: JSON.stringify({ reason }) 
            });

            if (!response.ok) {
                
                // 🚩 1. HTTP 상태 코드 409 (Conflict)는 중복 신고로 간주하고 즉시 처리
                if (response.status === 409) {
                    showMessage(`${type === 'POST' ? '게시글' : '댓글'} 신고가 **이미 접수되었습니다.**`, true);
                    return; // 409 처리 후 바로 함수 종료
                }

                // 🚩 2. 그 외 다른 모든 오류 상태 코드 (400, 500 등) 처리
                let errorDetail = `상태 코드: ${response.status}`;
                try {
                    // 오류 메시지를 포함하는 JSON 본문이 있다면 파싱
                    const errorData = await response.json();
                    // 서버 메시지가 없다면 기본 상태 코드 사용
                    errorDetail = errorData.message || errorDetail; 
                } catch (e) {
                    // JSON 파싱 에러 발생 시 원래 상태 코드를 유지하고 진행
                }
                
                // 중복이 아닌 다른 종류의 오류는 throw하여 catch 블록에서 최종 처리
                throw new Error(errorDetail); 
            }

            // 성공 로직
            showMessage(`${type === 'POST' ? '게시글' : '댓글'} 신고 접수됨. 감사합니다.`, false);
            
        } catch (error) {
            // 중복 신고는 409에서 이미 처리되었으므로, 여기는 일반적인 네트워크/API 오류 처리
            console.error(`${type === 'POST' ? '게시글' : '댓글'} 신고 오류:`, error);
            showMessage(`신고 처리 중 오류가 발생했습니다: ${error.message}`, true);
            
        } finally {
            setReportLoading(false);
            setShowReportModal(false);
            setReportTarget({ type: null, id: null });
        }
    };

    // 초기 로드
    useEffect(() => {
        const load = async () => {
            await fetchPostDetail(true);
            await fetchComments();
        };
        load();
    }, [postId, token, fetchPostDetail, fetchComments]);

    // 조회수 증가 (1회)
    useEffect(() => {
        if (!postId || hasIncrementedView.current) return;
        const increment = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/view/${postId}`, { method: 'POST' });
                if (res.ok) await fetchPostDetail(false);
            } catch (err) { console.error(err); }
        };
        increment();
        hasIncrementedView.current = true;
    }, [postId, fetchPostDetail]);

    // 로딩 중
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-900 text-white">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin h-8 w-8 text-yellow-400" />
                    <span className="ml-3 text-lg">로딩 중...</span>
                </main>
                <Footer />
            </div>
        );
    }

    // 게시글 없음
    if (!post) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-900 text-white">
                <Header />
                <main className="flex-1 flex flex-col items-center justify-center">
                    <h2 className="text-xl font-bold mb-4">게시글을 찾을 수 없습니다.</h2>
                    <button onClick={() => navigate('/community')} className="px-6 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition">
                        목록으로
                    </button>
                </main>
                <Footer />
            </div>
        );
    }

    const formattedDate = new Date(post.createdDate)
        .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
        .replace(/\.\s/g, '.').replace(/\.$/, '');

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <Header />

            {/* 토스트 메시지 */}
            {toastMessage && (
                <div className={`fixed top-20 right-5 z-50 flex items-center p-4 rounded-lg shadow-xl min-w-[300px] transition-all duration-300 ${
                    isErrorToast ? 'bg-red-600 text-white' : 'bg-yellow-500 text-gray-900'
                }`}>
                    {/* 라벨 제거 → 메시지만 표시 */}
                    <span className="font-semibold">{toastMessage}</span>
                    <button onClick={() => setToastMessage(null)} className="ml-auto text-lg opacity-75 hover:opacity-100">×</button>
                </div>
            )}

            {/* 모달들 */}
            <ConfirmModal show={showDeleteConfirm} title="삭제 확인" message="정말 삭제하시겠습니까?" onConfirm={executeDelete} onCancel={() => setShowDeleteConfirm(false)} />
            <ProfileSummaryModal show={showProfileModal} profileData={modalProfileData} onClose={() => setShowProfileModal(false)} />
            <ReportModal show={showReportModal} loading={reportLoading} onClose={() => setShowReportModal(false)} onSubmit={executeReport} />

            <main className="w-[1200px] mx-auto px-4 py-10 flex-grow">
                <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-700">
                    {/* 헤더 */}
                    <div className="flex justify-between items-center text-gray-400 mb-2 border-b border-gray-700 pb-2 text-sm">
                        <div className="flex items-center space-x-2">
                            <span className="font-semibold text-yellow-400 cursor-pointer hover:text-yellow-300" onClick={() => handleNicknameClick(post.userId)}>
                                {post.userNickname || post.userId}
                            </span>
                            <span>|</span>
                            <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs">
                            <span className="flex items-center"><Eye className="w-3 h-3 mr-1" />{post.viewCount}</span>
                            <span className="flex items-center"><ThumbsUp className="w-3 h-3 mr-1" />{currentLikeCount}</span>
                            <span className="flex items-center"><MessageSquare className="w-3 h-3 mr-1" />{comments.length}</span>
                            {isAuthor && (
                                <div className="flex space-x-2 text-yellow-400 ml-4">
                                    <button onClick={handleEdit} className="flex items-center hover:text-yellow-300 text-sm"><Edit3 className="w-3 h-3 mr-1" /> 수정</button>
                                    <button onClick={handleDelete} className="flex items-center hover:text-red-400 text-sm"><Trash2 className="w-3 h-3 mr-1" /> 삭제</button>
                                </div>
                            )}
                            <span className="text-gray-500 flex items-center ml-auto"><Tag className="w-3 h-3 mr-1" /> {post.categoryCode === 'NOTICE' ? '공지' : post.categoryCode}</span>
                        </div>
                    </div>

                    {/* 제목 & 내용 */}
                    <h1 className="text-3xl font-extrabold mb-6 pt-2">{post.title}</h1>
                    <div className="prose prose-invert max-w-none text-white min-h-[150px] pb-6 whitespace-pre-wrap">{post.content}</div>

                    {/* 추천 & 신고 */}
                    <div className="flex justify-center items-center space-x-4 py-6 border-y border-gray-700 mb-8">
                        <button onClick={handleLikeToggle} className={`flex items-center px-6 py-2 rounded-full font-bold transition ${isLiked ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400' : 'bg-gray-700 text-white hover:bg-gray-600 border border-yellow-500'}`}>
                            <ThumbsUp className={`w-5 h-5 mr-2 ${isLiked ? 'text-gray-900' : 'text-yellow-500'}`} />
                            {isLiked ? '추천 취소' : '추천'} ({currentLikeCount})
                        </button>
                        <button onClick={handleReport} className="text-gray-400 text-sm hover:text-red-400 opacity-80">신고</button>
                    </div>

                    {/* 댓글 섹션 */}
                    <h2 className="text-xl font-bold mb-4 flex items-center">댓글 <span className="text-yellow-400 ml-2">({comments.length})</span></h2>

                    {/* 댓글 작성 폼 */}
                    <form onSubmit={handleSubmitComment} className="bg-gray-700 p-4 rounded-lg mb-6 border border-gray-600">
                        <textarea
                            className="w-full bg-gray-600 text-white p-3 rounded-lg border border-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                            rows="3"
                            placeholder={user ? `${user.userNickname}님, 댓글을 작성하세요.` : "로그인 후 작성 가능"}
                            value={newCommentContent}
                            onChange={(e) => setNewCommentContent(e.target.value)}
                            disabled={!user || commentSubmitting}
                        />
                        <div className="flex justify-end mt-2">
                            <button type="submit" disabled={!user || commentSubmitting || !newCommentContent.trim()} className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-400 transition disabled:bg-gray-500 flex items-center">
                                {commentSubmitting && <Loader2 className="animate-spin h-5 w-5 mr-2" />}
                                댓글 등록
                            </button>
                        </div>
                    </form>

                    {/* 댓글 리스트 */}
                    <div className="divide-y divide-gray-700 overflow-y-auto no-scrollbar">
                        {commentsLoading ? (
                            <div className="text-center py-4 text-gray-400 flex items-center justify-center">
                                <Loader2 className="animate-spin h-4 w-4 mr-2" /> 로드 중...
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="text-center py-4 text-gray-400">댓글이 없습니다.</div>
                        ) : (
                            comments.map(comment => (
                                <React.Fragment key={comment.commentId}>
                                    <Comment
                                        comment={comment}
                                        currentUserId={currentUserId}
                                        token={token}
                                        postId={postId}
                                        fetchComments={fetchComments}
                                        showMessage={showMessage}
                                        onReplyClick={handleReplyClick}
                                        replyingToCommentId={replyingToCommentId}
                                        onNicknameClick={handleNicknameClick}
                                        onReportComment={handleReportComment}
                                    />
                                    {replyingToCommentId === comment.commentId && (
                                        <div className="mt-2 p-3 bg-gray-700 rounded-lg border-l-4 border-yellow-500" style={{ marginLeft: `${(comment.commentDepth + 1) * 40}px` }}>
                                            <ReplyForm
                                                parentCommentId={comment.commentId}
                                                replyingToNickname={replyingToNickname}
                                                replyCommentContent={replyCommentContent}
                                                setReplyCommentContent={setReplyCommentContent}
                                                fetchComments={fetchComments}
                                                showMessage={showMessage}
                                                token={token}
                                                postId={postId}
                                                handleReplyClick={handleReplyClick}
                                            />
                                        </div>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </div>

                    {/* 목록 버튼 */}
                    <div className="mt-8 flex justify-end">
                        <button onClick={() => navigate('/community')} className="px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-500 transition">
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