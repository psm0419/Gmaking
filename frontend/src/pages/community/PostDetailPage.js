import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header'; 
import Footer from '../../components/Footer';
import { ThumbsUp, Eye, Tag, MessageSquare, Edit3, Trash2, XCircle, Loader2, Send, Clock, Trophy, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; 

const API_BASE_URL = 'http://localhost:8080/community';

const ReportModal = ({ show, loading, onClose, onSubmit }) => {
    // 신고 사유를 관리하는 State
    const [reason, setReason] = useState('');
    const [detail, setDetail] = useState(''); // 기타 사유를 위한 상세 내용
    const [isDetailRequired, setIsDetailRequired] = useState(false); // 상세 사유 입력 필요 여부

    // 신고 사유 목록 (API 스펙에 맞춰 수정 필요)
    const reportOptions = [
        { value: 'SPAM', label: '스팸/홍보' },
        { value: 'PORNOGRAPHY', label: '음란물 또는 불법 정보' },
        { value: 'HATE_SPEECH', label: '혐오 발언 또는 차별적 표현' },
        { value: 'HARASSMENT', label: '괴롭힘 및 따돌림' },
        { value: 'ETC', label: '기타 (상세 입력 필요)' },
    ];

    useEffect(() => {
        // 사유가 'ETC'인 경우에만 상세 입력 필드를 활성화
        setIsDetailRequired(reason === 'ETC');
    }, [reason]);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        
        let finalReason = reason;

        if (!finalReason) {
            alert("신고 사유를 선택해주세요.");
            return;
        }

        if (isDetailRequired) {
            if (detail.trim().length < 5) {
                alert("기타 사유의 경우 5자 이상의 상세 내용을 입력해주세요.");
                return;
            }
            // 최종 사유에 상세 내용을 포함하여 전달
            finalReason = `${reason}: ${detail.trim()}`;
        }
        
        // PostDetailPage에서 전달받은 onSubmit (executeReport) 함수 호출
        onSubmit(finalReason);
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-red-700">
                
                {/* 모달 헤더 */}
                <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
                    <h3 className="text-xl font-bold text-red-400 flex items-center">
                        <ShieldAlert className="w-6 h-6 mr-2" /> 게시글 신고
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <p className="text-sm text-gray-400 mb-4">
                    허위 신고 시 불이익을 받을 수 있습니다. 정확한 사유를 선택해주세요.
                </p>

                <form onSubmit={handleFormSubmit}>
                    {/* 신고 사유 선택 */}
                    <div className="space-y-3 mb-5">
                        {reportOptions.map((option) => (
                            <label key={option.value} className="flex items-center text-white cursor-pointer">
                                <input
                                    type="radio"
                                    name="reportReason"
                                    value={option.value}
                                    checked={reason === option.value}
                                    onChange={(e) => {
                                        setReason(e.target.value);
                                        if (e.target.value !== 'ETC') setDetail('');
                                    }}
                                    className="h-4 w-4 text-red-500 border-gray-600 focus:ring-red-500 bg-gray-700"
                                />
                                <span className="ml-3 text-sm">{option.label}</span>
                            </label>
                        ))}
                    </div>

                    {/* 기타 사유 상세 입력 */}
                    {isDetailRequired && (
                        <div className="mb-5">
                            <label htmlFor="reportDetail" className="block text-sm font-medium text-gray-300 mb-1">
                                상세 사유 (최소 5자)
                            </label>
                            <textarea
                                id="reportDetail"
                                value={detail}
                                onChange={(e) => setDetail(e.target.value)}
                                rows="3"
                                className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600 focus:ring-red-500 focus:border-red-500 resize-none"
                                placeholder="신고 사유를 구체적으로 작성해주세요."
                                disabled={loading}
                            />
                        </div>
                    )}

                    {/* 버튼 */}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-500 transition disabled:opacity-50"
                            disabled={loading}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-500 transition disabled:opacity-50 flex items-center"
                            disabled={loading || !reason || (isDetailRequired && detail.trim().length < 5)}
                        >
                            {loading && <Loader2 className="animate-spin h-5 w-5 mr-2" />}
                            신고 접수
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- ProfileSummaryModal Component ---
const ProfileSummaryModal = ({ show, profileData, onClose }) => {
    if (!show || !profileData) return null;

    // 백엔드 VO 필드명 사용
    const profileImageUrl = profileData.characterImageUrl 
        ? profileData.characterImageUrl 
        : 'https://via.placeholder.com/150/000000/FFFFFF?text=No+Img'; 
        
    const userLevel = profileData.gradeId || 1; // Level (gradeId 사용)
    const totalClears = profileData.totalStageClears || 0; // Total Stage Clears (새로 추가)

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex justify-center items-center p-4" onClick={onClose}>
            <div 
                className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-yellow-500 w-full max-w-sm transform transition-all duration-300 scale-100 opacity-100 relative"
                onClick={(e) => e.stopPropagation()} 
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-gray-400 hover:text-white transition"
                    title="닫기"
                >
                    <XCircle className="w-6 h-6" />
                </button>

                <div className="flex flex-col items-center">
                    {/* 프로필 이미지 */}
                    <img 
                        src={profileImageUrl} 
                        alt="Profile Character" 
                        className="w-24 h-24 object-cover rounded-full border-4 border-yellow-500 mb-4 shadow-lg"
                    />
                    
                    {/* 닉네임 */}
                    <h3 className="text-2xl font-bold text-white mb-2">{profileData.userNickname}</h3>
                    
                    {/* 레벨 (gradeId) */}
                    <p className="text-md text-yellow-400 font-semibold mb-6">
                        Lv. {userLevel} 
                    </p>

                    {/* ✅ 총 스테이지 클리어 횟수 추가 */}
                    <div className="w-full space-y-3 p-4 bg-gray-700 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 flex items-center">
                                <Trophy className="w-4 h-4 mr-2 text-blue-400"/>총 클리어 스테이지 
                            </span>
                            <span className="text-lg font-bold text-white">{totalClears} 회</span>
                        </div>
                    </div>
                    
                </div>

                <div className="mt-6 text-center">
                    <button
                        onClick={onClose}
                        className="w-full py-2 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-400 transition"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MessageToast Component (기존 유지) ---
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

// --- Comment Component (수정/삭제/신고 기능 추가) ---
const Comment = ({ comment, currentUserId, token, postId, fetchComments, showMessage, onReplyClick, replyingToCommentId, onNicknameClick, onReportComment }) => {
    const isAuthor = comment.userId === currentUserId;
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 현재 댓글이 활성화된 답글 폼의 부모인지 확인
    const isReplying = replyingToCommentId === comment.commentId;

    // 날짜 포맷팅
    const formattedDate = new Date(comment.createdDate).toLocaleDateString('ko-KR', { 
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    }).replace(/\.\s/g, '.').replace(/\.$/, '').replace(/(\d{4}\.\d{2}\.\d{2})/g, '$1 ');

    // 댓글 삭제 핸들러 (기존 로직 유지)
    const handleDeleteComment = async () => {
        if (!window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/${postId}/comments/${comment.commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                let errorDetail = `상태 코드: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorDetail = errorData.message || errorDetail;
                } catch (e) {}
                
                throw new Error(errorDetail);
            }

            showMessage("댓글이 성공적으로 삭제되었습니다.", false);
            fetchComments();

        } catch (error) {
            console.error("댓글 삭제 오류:", error);
            showMessage(`댓글 삭제 중 오류가 발생했습니다: ${error.message}`, true);
        }
    };
    
    // 댓글 수정 핸들러 (API 호출 로직 추가)
    const handleEditComment = async () => {
        if (!editedContent.trim() || editedContent.trim() === comment.content) {
            setIsEditing(false); // 내용 변경 없으면 수정 모드 종료
            return;
        }

        setIsSubmitting(true);

        try {
            // TODO: [API 연동] 댓글 수정 API 엔드포인트 사용
            const response = await fetch(`${API_BASE_URL}/${postId}/comments/${comment.commentId}`, {
                method: 'PUT', // 또는 PATCH
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ content: editedContent.trim() })
            });
            
            if (!response.ok) {
                let errorDetail = `상태 코드: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorDetail = errorData.message || errorDetail;
                } catch (e) {}
                
                throw new Error(errorDetail);
            }
            
            showMessage("댓글이 수정되었습니다.", false);
            setIsEditing(false);
            fetchComments(false); // 목록 새로고침 (로딩 표시 없음)

        } catch (error) {
            console.error("댓글 수정 오류:", error);
            showMessage(`댓글 수정 중 오류가 발생했습니다: ${error.message}`, true);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 댓글 신고 핸들러 (프론트엔드 알림만 구현)
    const handleReportComment = () => {
        if (!token || !currentUserId) {
            showMessage('로그인 후 신고할 수 있습니다.', true);
            return;
        }
        onReportComment(comment.commentId); // 상위 컴포넌트로 commentId 전달
    };

    // 1차 대댓글만 허용한다고 가정하고, 40px를 적용합니다.
    const indentStyle = {
        marginLeft: comment.commentDepth > 0 ? `${comment.commentDepth * 40}px` : '0',
        paddingLeft: comment.commentDepth > 0 ? '10px' : '0', // 시각적 구분
        borderLeft: comment.commentDepth > 0 ? '2px solid #4B5563' : 'none' // 구분선
    };

    return (
        <div className="border-t border-gray-700 pt-3 pb-2 flex flex-col"
            style={indentStyle}
        >
            <div className="flex justify-between items-center text-sm mb-1">
                <div className="flex items-center">
                    <span className={`font-bold mr-2 cursor-pointer transition 
                            ${isAuthor ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-200 hover:text-white'}`}
                        onClick={() => onNicknameClick(comment.userId)}
                    >
                        {/* 깊이가 있으면 "ㄴ" 표시 */}
                        {comment.commentDepth > 0 && <span className="mr-1 text-gray-500">ㄴ</span>}
                        {comment.userNickname}
                        {isAuthor && <span className="text-xs text-red-400 ml-1">(작성자)</span>}
                    </span>
                    <span className="text-gray-500 text-xs flex items-center">
                        <Clock className="w-3 h-3 mr-1" />{formattedDate}
                    </span>
                </div>
                
                <div className="flex items-center space-x-3">
                    {/* 답글 버튼 */}
                    {currentUserId && (
                         <button 
                            onClick={() => onReplyClick(isReplying ? null : comment.commentId, comment.userNickname)}
                            className="flex items-center text-sm text-green-400 opacity-70 hover:opacity-100 transition hover:text-green-300 p-1 rounded-md"
                            title="답글 작성"
                        >
                            {isReplying ? '답글 취소' : '답글'}
                        </button>
                    )}

                    {/* 신고 버튼 (모두에게 보임) */}
                    <button 
                        onClick={handleReportComment}
                        className="flex items-center text-sm text-blue-400 opacity-70 hover:opacity-100 transition hover:text-blue-300 p-1 rounded-md"
                        title="댓글 신고"
                    >
                        신고
                    </button>

                    {/* 작성자에게만 보임 */}
                    {isAuthor && !isEditing && (
                        <>
                            <button 
                                onClick={() => { setIsEditing(true); setEditedContent(comment.content); }}
                                className="flex items-center text-sm text-yellow-400 opacity-80 hover:opacity-100 transition hover:text-yellow-300 p-1 rounded-md"
                                title="댓글 수정"
                            >
                                <Edit3 className="w-3 h-3" />
                            </button>
                            <button 
                                onClick={handleDeleteComment}
                                className="flex items-center text-sm text-red-400 opacity-80 hover:opacity-100 transition hover:text-red-300 p-1 rounded-md"
                                title="댓글 삭제"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* 댓글 내용/수정 폼 */}
            {isEditing ? (
                <form onSubmit={(e) => { e.preventDefault(); handleEditComment(); }} className="mt-1 flex space-x-2">
                    <textarea
                        className="flex-grow p-2 bg-gray-600 text-white rounded-lg border border-yellow-400 focus:outline-none resize-none"
                        rows="2"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        disabled={isSubmitting}
                        required
                    />
                    <div className="flex flex-col space-y-1">
                        <button
                            type="submit"
                            className="p-1 bg-yellow-500 text-gray-900 rounded-md font-semibold hover:bg-yellow-400 transition disabled:bg-gray-500 flex items-center justify-center"
                            disabled={isSubmitting || !editedContent.trim() || editedContent.trim() === comment.content}
                            title="수정 완료"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="p-1 bg-gray-600 text-white rounded-md font-semibold hover:bg-gray-500 transition"
                            disabled={isSubmitting}
                            title="수정 취소"
                        >
                            <XCircle className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            ) : (
                <p className="text-gray-300 text-sm whitespace-pre-wrap mt-1">{comment.content}</p>
            )}
            {/* 답글 폼 렌더링 위치 (PostDetailPage에서 관리) */}
            {isReplying && <div className="mt-2" id={`reply-form-${comment.commentId}`}></div>}
        </div>
    );
};

// --- ConfirmModal Component (기존 유지) ---
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
                        삭제
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- ReplyForm Component ---
const ReplyForm = ({ 
    parentCommentId, 
    replyingToNickname, 
    replyCommentContent, 
    setReplyCommentContent, 
    fetchComments, 
    showMessage, 
    token, 
    postId,
    handleReplyClick // 답글 폼을 닫기 위한 핸들러
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 디버깅: parentCommentId가 올바르게 전달되었는지 확인
    console.log('ReplyForm rendered with:', { parentCommentId, replyingToNickname });

    const handleSubmitReply = async (e) => {
        e.preventDefault();
        const trimmedContent = replyCommentContent.trim();
        
        if (!trimmedContent || trimmedContent === `@${replyingToNickname}`) {
            showMessage("답글 내용을 입력해주세요.", true);
            return;
        }

        // 디버깅: 요청 바디 확인
        const requestBody = { content: trimmedContent, parentId: parentCommentId };
        console.log('Submitting reply with:', requestBody);

        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });
            
            if (!response.ok) {
                let errorDetail = `상태 코드: ${response.status}`;
                try {
                    const errorData = await response.json(); 
                    errorDetail = errorData.message || errorDetail;
                } catch (e) {}

                throw new Error(errorDetail);
            }

            setReplyCommentContent(''); 
            showMessage('답글이 등록되었습니다. 📝', false);
            
            // 폼 닫기 (ReplyingToCommentId를 null로 설정)
            handleReplyClick(null); 
            
            // 댓글 목록 새로고침
            await fetchComments(false); 

        } catch (error) {
            console.error("답글 등록 오류:", error);
            showMessage(`답글 등록에 실패했습니다: ${error.message}`, true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmitReply} className="flex flex-col space-y-2 p-4 bg-gray-800 border-l-4 border-yellow-500 rounded-lg">
            <div className="text-sm text-yellow-400 font-semibold flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                @{replyingToNickname}에게 답글 작성 중
            </div>
            <textarea
                className="w-full bg-gray-600 text-white p-2 rounded-lg border border-gray-500 focus:outline-none focus:ring-1 focus:ring-yellow-400 resize-none"
                rows="2"
                placeholder={`@${replyingToNickname} 에게 보낼 답글을 입력하세요.`}
                value={replyCommentContent}
                onChange={(e) => setReplyCommentContent(e.target.value)}
                disabled={isSubmitting}
                required
            />
            <div className="flex justify-end space-x-2">
                <button
                    type="button"
                    onClick={() => handleReplyClick(null)} // 취소 버튼
                    className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500 transition"
                    disabled={isSubmitting}
                >
                    취소
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || !replyCommentContent.trim() || replyCommentContent.trim() === `@${replyingToNickname}`}
                    className="px-3 py-1 bg-green-500 text-gray-900 rounded-lg font-semibold text-sm hover:bg-green-400 transition disabled:bg-gray-500 flex items-center"
                >
                    {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                    답글 등록
                </button>
            </div>
        </form>
    );
};

// --- PostDetailPage Component (기존 로직 유지 및 함수 통합) ---
const PostDetailPage = () => {
    const { postId } = useParams(); 
    const navigate = useNavigate();
    const { user, token } = useAuth(); 
    
    // --- State Variables ---
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentLikeCount, setCurrentLikeCount] = useState(0); 
    const [isLiked, setIsLiked] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const hasIncrementedView = useRef(false);

    // 댓글 관련 State
    const [comments, setComments] = useState([]);
    const [newCommentContent, setNewCommentContent] = useState('');
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentSubmitting, setCommentSubmitting] = useState(false);

    // 대댓글 관련 State 
    const [replyingToCommentId, setReplyingToCommentId] = useState(null);
    const [replyingToNickname, setReplyingToNickname] = useState(null);
    const [replyCommentContent, setReplyCommentContent] = useState(''); // 대댓글 내용

    // Toast State
    const [toastMessage, setToastMessage] = useState(null);
    const [isErrorToast, setIsErrorToast] = useState(false);

    // 닉네임 모달 관련 State
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [modalUserId, setModalUserId] = useState(null);
    const [modalProfileData, setModalProfileData] = useState(null);
    const [modalLoading, setModalLoading] = useState(false); // 모달 로딩 상태

    // 신고 모달 관련 state
    const [showReportModal, setShowReportModal] = useState(false); // 신고 모달 표시 여부
    const [reportReason, setReportReason] = useState(''); // 신고 사유 (선택된 값)
    const [reportLoading, setReportLoading] = useState(false); // 신고 API 호출 중 여부
    const [reportTarget, setReportTarget] = useState({ type: null, id: null });

    // 현재 로그인 사용자 ID
    const currentUserId = user?.userId;
    // 작성자 ID와 현재 로그인 사용자 ID 일치 여부 확인 (권한 로직)
    const isAuthor = user && post?.userId && (user.userId === post.userId);

    // --- Toast Handler ---
    const showMessage = useCallback((msg, isError = false) => {
        setIsErrorToast(isError);
        setToastMessage(msg);
        const timer = setTimeout(() => setToastMessage(null), 3000); 
        return () => clearTimeout(timer);
    }, []);

    // --- Fetch Comments Handler ---
    const fetchComments = useCallback(async (shouldSetLoading = true) => {
        if (!postId) return;
        if (shouldSetLoading) setCommentsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/${postId}/comments`);
            if (!response.ok) {
                throw new Error(`댓글 로드 실패: ${response.status}`);
            }
            const data = await response.json();
            
            const sortedComments = data.sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate));
            setComments(sortedComments);

        } catch (error) {
            console.error("댓글 목록 조회 에러:", error);
            if (shouldSetLoading) showMessage('댓글 로드에 실패했습니다.', true);
        } finally {
            if (shouldSetLoading) setCommentsLoading(false);
        }
    }, [postId, showMessage]);

    // --- Fetch Post Detail Handler ---
    const fetchPostDetail = useCallback(async (shouldSetLoading = true) => {
        if (!postId) {
            if (shouldSetLoading) setLoading(false);
            return;
        }
        try {
            if (shouldSetLoading) setLoading(true); 
            const headers = {};
            if (token) { 
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/${postId}`, { headers });
            
            if (!response.ok) {
                if (response.status === 404) {
                    setPost(null); 
                    return;
                }
                if (shouldSetLoading) {
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

    // 대댓글 클릭 핸들러 (Comment 컴포넌트로 전달될 함수)
    const handleReplyClick = useCallback((commentId, nickname) => {
        console.log('handleReplyClick called with:', { commentId, nickname });
        // 이미 선택된 댓글을 다시 누르면 취소
        if (replyingToCommentId === commentId) {
            setReplyingToCommentId(null);
            setReplyingToNickname(null);
            setReplyCommentContent('');
        } else {
            setReplyingToCommentId(commentId);
            setReplyingToNickname(nickname);
            setReplyCommentContent(`@${nickname} `); // 닉네임을 포함한 초기값 설정
        }
    }, [replyingToCommentId]); // replyingToCommentId가 변경될 때마다 함수 재생성
    
    // --- Data Loading Effects (Core) ---

    // 1. 게시글 상세 정보 및 댓글 목록 최초 조회
    useEffect(() => {
        const loadData = async () => {
            await fetchPostDetail(true);
            await fetchComments();
        };
        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postId, token]); 

    // 2. 조회수 증가 및 업데이트 (컴포넌트 마운트 시 1회)
    useEffect(() => {
        if (!postId || hasIncrementedView.current) return;
        
        const incrementViewCount = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/view/${postId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    await fetchPostDetail(false); 
                } else {
                    console.warn(`View count increment failed with status: ${response.status}`);
                }
            } catch (error) {
                console.error("View count increment failed:", error);
            }
        };

        incrementViewCount();
        hasIncrementedView.current = true;
        
    }, [postId, fetchPostDetail]); 

    // --- Fetch Profile Summary Handler ---
const fetchUserProfileSummary = useCallback(async (userId) => {
    if (!userId) return;
    
    setModalLoading(true);
    setModalUserId(userId);
    setModalProfileData(null); // 이전 데이터 초기화
    setShowProfileModal(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/profile-summary`, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
            }
        });

        if (!response.ok) {
            let errorDetail = `상태 코드: ${response.status}`;
            try {
                const errorData = await response.json();
                errorDetail = errorData.message || errorDetail;
            } catch (e) {}
            
            throw new Error(errorDetail);
        }

        const data = await response.json();
        setModalProfileData(data);
        
    } catch (error) {
        console.error("프로필 요약 정보 로드 에러:", error);
        showMessage(`프로필 로드에 실패했습니다: ${error.message}`, true);
        setShowProfileModal(false); // 로드 실패 시 모달 닫기
    } finally {
        setModalLoading(false);
    }
}, [token, showMessage]);

// --- 닉네임 클릭 핸들러 (게시글 작성자, 댓글 작성자 모두 사용) ---
const handleNicknameClick = useCallback((userId) => {
    if (!userId) return;
    fetchUserProfileSummary(userId);
}, [fetchUserProfileSummary]); 

    // --- Action Handlers  ---

    // 좋아요 토글 핸들러 
    const handleLikeToggle = async() =>{
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
                body: JSON.stringify({ postId: postId }) 
            });

            if (!response.ok) {
                let errorDetail = `상태 코드: ${response.status}`;
                try {
                    const errorData = await response.json(); 
                    errorDetail = errorData.message || errorDetail;
                } catch (e) {}
            
                throw new Error(`추천 처리 실패: ${errorDetail}`); 
            }

            const resultData = await response.json();
            const newIsLiked = resultData.likeStatus;
            const newCount = resultData.newLikeCount;

            setIsLiked(newIsLiked);
            setCurrentLikeCount(newCount); 
            setPost(prev => prev ? ({ ...prev, likeCount: newCount}) : null); 

            const successMsg = newIsLiked ? "게시글을 추천했습니다!" : "추천을 취소했습니다.";
            showMessage(successMsg, false);

        } catch (error){
            console.error("추천 기능 처리 중 오류 발생:", error); 
            showMessage(`추천 기능 처리 중 오류 발생: ${error.message}`, true);
        }
    };
    
    // 수정 버튼 클릭 핸들러
    const handleEdit = () => {
        if (!isAuthor) {
            showMessage("수정 권한이 없습니다.", true);
            return;
        }
        navigate(`/community/edit/${postId}`); 
    };

    // 삭제 로직 실행
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

            showMessage("게시글이 성공적으로 삭제되었습니다.", false);
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
        setShowDeleteConfirm(true); 
    };

    // 댓글 작성 핸들러
    const handleSubmitComment = async (e) => {
        e.preventDefault();
        const trimmedContent = newCommentContent.trim();
        
        // '@'로 시작하는 경우 경고 표시
        if (trimmedContent.startsWith('@')) {
            const confirmReply = window.confirm(
                '대댓글로 작성하시겠습니까? 대댓글은 댓글의 "답글" 버튼을 통해 작성해주세요.'
            );
            if (!confirmReply) {
                showMessage("댓글 작성 취소됨", true);
                return;
            }
            showMessage("대댓글은 '답글' 버튼을 통해 작성해주세요.", true);
            return;
        }

        if (!trimmedContent) {
            showMessage("댓글 내용을 입력해주세요.", true);
            return;
        }
        if (!user || !token) {
            showMessage("로그인 후 댓글을 작성할 수 있습니다.", true);
            return;
        }

        setCommentSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ content: trimmedContent }),
            });
            
            if (!response.ok) {
                let errorDetail = `상태 코드: ${response.status}`;
                try {
                    const errorData = await response.json(); 
                    errorDetail = errorData.message || errorDetail;
                } catch (e) {}

                throw new Error(errorDetail);
            }

            setNewCommentContent(''); 
            showMessage('댓글이 등록되었습니다. 💬', false);

            await fetchComments(false); 
            await fetchPostDetail(false); 

        } catch (error) {
            console.error("댓글 등록 오류:", error);
            showMessage(`댓글 등록에 실패했습니다: ${error.message}`, true);
        } finally {
            setCommentSubmitting(false);
        }
    };

    // --- Render Logic (기존 유지) ---
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
                <Loader2 className="animate-spin h-8 w-8 text-yellow-400" />
                <span className="ml-3 text-lg">게시글 로딩 중...</span>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col">
                <Header />
                <div className="flex-grow flex flex-col justify-center items-center text-center p-8 mt-20">
                    <XCircle className="w-12 h-12 text-red-500 mb-4" />
                    <h2 className="text-xl font-bold mb-4">게시글을 찾을 수 없거나 삭제되었습니다.</h2>
                    <button
                        onClick={() => navigate('/community')}
                        className="px-6 py-2 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-400 transition"
                    >
                        목록으로 돌아가기
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    const handleReport = () => {
        if (!token || !currentUserId) {
            showMessage('로그인 후 신고할 수 있습니다.', true);
            return;
        }
        setReportTarget({ type: 'POST', id: postId });
        setShowReportModal(true);
    };

    // --- 댓글 신고 핸들러 ---
    const handleReportComment = (commentId) => {
        setReportTarget({ type: 'COMMENT', id: commentId });
        setShowReportModal(true);
    };


    // --- 신고 실행 로직 (ReportModal에서 실행될 함수) ---
    const executeReport = async (reason) => {
        if (!token || !postId) return;
        
        setReportLoading(true);
        
        // 신고 사유를 담아 POST 요청을 보냅니다.
        const { type, id } = reportTarget;
        const REPORT_URL = type === 'POST' 
            ? `${API_BASE_URL}/posts/${id}/report`
            : `${API_BASE_URL}/comments/${id}/report`;

       try {
            const response = await fetch(REPORT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ 
                    reason: reason,
                    targetType: type
                })
            });
            if (!response.ok) {
                let errorDetail = `상태 코드: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorDetail = errorData.message || errorDetail;
                } catch (e) {}
                throw new Error(errorDetail);
            }
            showMessage(`${type === 'POST' ? '게시글' : '댓글'}이 신고 접수되었습니다. 감사합니다.`, false);
        } catch (error) {
            console.error(`${type === 'POST' ? '게시글' : '댓글'} 신고 오류:`, error);
            showMessage(`신고 처리 중 오류가 발생했습니다: ${error.message}`, true);
        } finally {
            setReportLoading(false);
            setShowReportModal(false);
            setReportTarget({ type: null, id: null });
        }
    };

    const formattedDate = new Date(post.createdDate).toLocaleDateString('ko-KR', { 
        year: 'numeric', month: '2-digit', day: '2-digit' 
    }).replace(/\.\s/g, '.').replace(/\.$/, ''); 

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
            <Header />
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

            {/* 닉네임 프로필 요약 모달 추가 */}
            <ProfileSummaryModal
                show={showProfileModal}
                profileData={modalProfileData}
                onClose={() => setShowProfileModal(false)}
            />

            {/* 신고 모달 추가 */}
            <ReportModal 
                show={showReportModal}
                loading={reportLoading}
                onClose={() => setShowReportModal(false)}
                onSubmit={executeReport} 
            />

            <main className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-20 flex-grow">
                
                <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 w-full">
                    
                    {/* 상단 메타 정보 */}
                    <div className="flex justify-between items-center text-gray-400 mb-2 border-b border-gray-700 pb-2">
                        <div className="flex items-center space-x-2 text-sm">
                            {/* 게시글 작성자 닉네임 클릭 핸들러 연결 */}
                            <span 
                                className="font-semibold text-yellow-400 cursor-pointer hover:text-yellow-300 transition"
                                onClick={() => handleNicknameClick(post.userId)}
                            >
                                {post.userNickname || post.userId}
                            </span>
                            <span>|</span>
                            <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs">
                            <span className="flex items-center"><Eye className="w-3 h-3 mr-1" />{post.viewCount}</span>
                            <span className="flex items-center"><ThumbsUp className="w-3 h-3 mr-1" />{currentLikeCount}</span> 
                            <span className="flex items-center"><MessageSquare className="w-3 h-3 mr-1" />{comments.length}</span> 
                            
                            {/* 관리 버튼 영역 */}
                            {isAuthor && (
                                <div className="flex space-x-2 text-yellow-400 font-medium ml-4">
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

                            <span className="text-gray-500 text-xs flex items-center ml-auto"><Tag className="w-3 h-3 mr-1" />{post.categoryCode}</span>
                        </div>
                    </div>

                    {/* 제목 */}
                    <h1 className="text-3xl font-extrabold text-white mb-6 pt-2">{post.title}</h1>
                    
                    {/* 본문 */}
                    <div className="prose prose-invert max-w-none text-white min-h-[150px] pb-6 whitespace-pre-wrap">
                        {post.content} 
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
                            <ThumbsUp className={`w-5 h-5 mr-2 ${isLiked ? 'text-gray-900' : 'text-yellow-500'}`} /> 
                            {isLiked ? '추천 취소' : '추천'} ({currentLikeCount}) 
                        </button>
                        <button 
                            className="text-gray-400 text-sm hover:text-red-400 opacity-80 transition"
                            onClick={handleReport}
                        >
                            신고
                        </button>
                    </div>

                    {/* 댓글 섹션 */}
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                        댓글 <span className="text-yellow-400 ml-2">({comments.length})</span>
                    </h2>

                    {/* 댓글 작성 폼 */}
                    <form onSubmit={handleSubmitComment} className="bg-gray-700 p-4 rounded-lg mb-6 border border-gray-600">
                        <textarea 
                            className="w-full bg-gray-600 text-white p-3 rounded-lg border border-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                            rows="3"
                            placeholder={user ? `${user.userNickname}님, 여기에 댓글을 작성하세요.` : "로그인 후 댓글을 작성할 수 있습니다."}
                            value={newCommentContent}
                            onChange={(e) => setNewCommentContent(e.target.value)}
                            disabled={!user || commentSubmitting}
                        ></textarea>
                        <div className="flex justify-end mt-2">
                            <button 
                                type="submit"
                                disabled={!user || commentSubmitting || !newCommentContent.trim()}
                                className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-400 transition disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed flex items-center"
                            >
                                {commentSubmitting && <Loader2 className="animate-spin h-5 w-5 mr-2" />}
                                댓글 등록
                            </button>
                        </div>
                    </form>

                    {/* 댓글 목록 */}
                    <div className="space-y-4">
                        {commentsLoading ? (
                            <div className="text-center py-4 text-gray-400 flex items-center justify-center">
                                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                댓글 로드 중...
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="text-center py-4 text-gray-400">아직 등록된 댓글이 없습니다.</div>
                        ) : (
                            comments.map((comment) => (
                                <React.Fragment key={comment.commentId}>
                                    <Comment 
                                        key={comment.commentId} 
                                        comment={comment} 
                                        currentUserId={currentUserId}
                                        token={token}
                                        postId={postId}
                                        fetchComments={fetchComments}
                                        showMessage={showMessage}
                                        // onReplyClick 프롭스를 전달합니다.
                                        onReplyClick={handleReplyClick}
                                        // 대댓글 폼을 활성화할 댓글 ID를 전달합니다.
                                        replyingToCommentId={replyingToCommentId}
                                        onNicknameClick={handleNicknameClick}
                                        onReportComment={handleReportComment}
                                    />

                                    {/* 대댓글 폼 렌더링 (replyingToCommentId가 일치할 때) */}
                                    {replyingToCommentId === comment.commentId && (
                                        <div 
                                            className="mt-2 p-3 bg-gray-700 rounded-lg border-l-4 border-yellow-500"
                                            style={{ marginLeft: `${(comment.commentDepth + 1) * 40}px` }} // 원 댓글보다 깊게 들여쓰기
                                        >
                                            <ReplyForm 
                                                parentCommentId={comment.commentId}
                                                replyingToNickname={replyingToNickname}
                                                replyCommentContent={replyCommentContent}
                                                setReplyCommentContent={setReplyCommentContent}
                                                fetchComments={fetchComments}
                                                showMessage={showMessage}
                                                token={token}
                                                postId={postId}
                                                handleReplyClick={handleReplyClick} // 폼 제출 후 닫기 위해 전달
                                            />
                                        </div>
                                    )}
                                </React.Fragment>
                            ))
                        )}
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