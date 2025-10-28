// src/pages/community/Comment.js
import React, { useState } from 'react';
import { Edit3, Trash2, Clock, Loader2, Send, XCircle } from 'lucide-react';

const Comment = ({
    comment,
    currentUserId,
    token,
    postId,
    fetchComments,
    showMessage,
    onReplyClick,
    replyingToCommentId,
    onNicknameClick,
    onReportComment
}) => {
    const isAuthor = comment.userId === currentUserId;
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isReplying = replyingToCommentId === comment.commentId;

    const formattedDate = new Date(comment.createdDate)
        .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        .replace(/\.\s/g, '.').replace(/\.$/, '').replace(/(\d{4}\.\d{2}\.\d{2})/g, '$1 ');

    const handleDeleteComment = async () => {
        if (!window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;

        try {
            const response = await fetch(`http://localhost:8080/community/${postId}/comments/${comment.commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || '삭제 실패');
            }

            showMessage("댓글이 삭제되었습니다.", false);
            fetchComments();
        } catch (error) {
            showMessage(`삭제 실패: ${error.message}`, true);
        }
    };

    const handleEditComment = async () => {
        if (!editedContent.trim() || editedContent.trim() === comment.content) {
            setIsEditing(false);
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`http://localhost:8080/community/${postId}/comments/${comment.commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: editedContent.trim() })
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || '수정 실패');
            }

            showMessage("댓글이 수정되었습니다.", false);
            setIsEditing(false);
            fetchComments(false);
        } catch (error) {
            showMessage(`수정 실패: ${error.message}`, true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReportComment = () => {
        if (!token || !currentUserId) {
            showMessage('로그인 후 신고할 수 있습니다.', true);
            return;
        }
        onReportComment(comment.commentId);
    };

    const indentStyle = {
        marginLeft: comment.commentDepth > 0 ? `${comment.commentDepth * 40}px` : '0',
        paddingLeft: comment.commentDepth > 0 ? '10px' : '0',
        borderLeft: comment.commentDepth > 0 ? '2px solid #4B5563' : 'none'
    };

    return (
        <div className="border-t border-gray-700 pt-3 pb-2 flex flex-col" style={indentStyle}>
            <div className="flex justify-between items-center text-sm mb-1">
                <div className="flex items-center">
                    <span
                        className={`font-bold mr-2 cursor-pointer transition ${isAuthor ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-200 hover:text-white'}`}
                        onClick={() => onNicknameClick(comment.userId)}
                    >
                        {comment.commentDepth > 0 && <span className="mr-1 text-gray-500">ㄴ</span>}
                        {comment.userNickname}
                        {isAuthor && <span className="text-xs text-red-400 ml-1">(작성자)</span>}
                    </span>
                    <span className="text-gray-500 text-xs flex items-center">
                        <Clock className="w-3 h-3 mr-1" />{formattedDate}
                    </span>
                </div>
                <div className="flex items-center space-x-3">
                    {currentUserId && (
                        <button
                            onClick={() => onReplyClick(isReplying ? null : comment.commentId, comment.userNickname)}
                            className="flex items-center text-sm text-green-400 opacity-70 hover:opacity-100 transition hover:text-green-300 p-1 rounded-md"
                            title="답글 작성"
                        >
                            {isReplying ? '답글 취소' : '답글'}
                        </button>
                    )}
                    <button
                        onClick={handleReportComment}
                        className="flex items-center text-sm text-blue-400 opacity-70 hover:opacity-100 transition hover:text-blue-300 p-1 rounded-md"
                        title="댓글 신고"
                    >
                        신고
                    </button>
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
        </div>
    );
};

export default Comment;