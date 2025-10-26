package com.project.gmaking.community.service;

import com.project.gmaking.community.vo.PostCommentRequestVO;
import com.project.gmaking.community.vo.PostCommentResponseVO;

import java.util.List;

public interface PostCommentService {

    /**
     * 댓글 또는 대댓글을 등록합니다.
     * @param postId 게시글 ID
     * @param userId 댓글 작성자 ID
     */
    void registerComment(
            Long postId,
            String userId,
            PostCommentRequestVO requestVO
    );

    /**
     * 특정 게시글의 댓글 목록을 조회합니다. (대댓글 포함)
     * @param postId 게시글 ID
     * @return 댓글 목록
     */
    List<PostCommentResponseVO> getCommentList(Long postId);

    /**
     * 댓글을 삭제합니다. (논리적 삭제)
     * @param commentId 삭제할 댓글 ID
     * @param userId 삭제를 요청한 사용자 ID
     */
    void deleteComment(Long commentId, String userId);

    /**
     * 댓글을 수정합니다.
     * @param commentId 수정할 댓글 ID
     * @param userId 수정을 요청한 사용자 ID (권한 확인용)
     * @param requestVO 수정 내용이 담긴 VO
     */
    void updateComment(Long commentId, String userId, PostCommentRequestVO requestVO);
}