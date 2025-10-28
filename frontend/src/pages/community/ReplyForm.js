// community/ReplyForm.js
import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

const ReplyForm = ({
    parentCommentId,
    replyingToNickname,
    replyCommentContent,
    setReplyCommentContent,
    fetchComments,
    showMessage,
    token,
    postId,
    handleReplyClick
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const content = replyCommentContent.trim();
        if (!content || content === `@${replyingToNickname}`) {
            showMessage("답글 내용을 입력해주세요.", true);
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`http://localhost:8080/community/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content, parentId: parentCommentId })
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || '답글 등록 실패');
            }

            setReplyCommentContent('');
            showMessage('답글이 등록되었습니다.', false);
            handleReplyClick(null); // 폼 닫기
            await fetchComments(false);
        } catch (error) {
            showMessage(`답글 등록 실패: ${error.message}`, true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col space-y-2 p-4 bg-gray-800 border-l-4 border-yellow-500 rounded-lg">
            <div className="text-sm text-yellow-400 font-semibold flex items-center">
                @{replyingToNickname}에게 답글 작성 중
            </div>
            <textarea
                className="w-full bg-gray-600 text-white p-2 rounded-lg border border-gray-500 focus:outline-none focus:ring-1 focus:ring-yellow-400 resize-none"
                rows="2"
                placeholder={`@${replyingToNickname} 에게 답글을 입력하세요.`}
                value={replyCommentContent}
                onChange={(e) => setReplyCommentContent(e.target.value)}
                disabled={isSubmitting}
                required
            />
            <div className="flex justify-end space-x-2">
                <button
                    type="button"
                    onClick={() => handleReplyClick(null)}
                    disabled={isSubmitting}
                    className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500 transition"
                >
                    취소
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || !replyCommentContent.trim()}
                    className="px-3 py-1 bg-green-500 text-gray-900 rounded-lg font-semibold text-sm hover:bg-green-400 transition disabled:bg-gray-500 flex items-center"
                >
                    {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                    답글 등록
                </button>
            </div>
        </form>
    );
};

export default ReplyForm;