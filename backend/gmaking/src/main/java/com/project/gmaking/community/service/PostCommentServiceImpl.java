package com.project.gmaking.community.service;

import com.project.gmaking.community.dao.PostCommentDAO;
import com.project.gmaking.community.service.PostCommentService;
import com.project.gmaking.community.vo.PostCommentRequestVO;
import com.project.gmaking.community.vo.PostCommentResponseVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PostCommentServiceImpl implements PostCommentService {

    private final PostCommentDAO commentDAO;

    @Override
    @Transactional
    public void registerComment(Long postId, String userId, PostCommentRequestVO requestVO) {

        // 1. depth 계산
        int commentDepth = (requestVO.getParentId() != null) ? 1 : 0;

        // 2. Map에 필요한 모든 데이터 준비 (MyBatis에 전달할 최종 데이터)
        Map<String, Object> params = new HashMap<>();
        params.put("postId", postId);
        params.put("userId", userId);
        params.put("content", requestVO.getContent());

        // 3. 계산된 parentId와 depth를 Map에 추가
        params.put("parentId", requestVO.getParentId());
        params.put("commentDepth", commentDepth);
        params.put("createdBy", userId);

        // 4. Mapper 호출
        commentDAO.insertComment(params);
    }

    @Override
    public List<PostCommentResponseVO> getCommentList(Long postId) {
        // 1. 게시글 ID 유효성 검사
        if (postId == null) {
            throw new IllegalArgumentException("게시글 ID는 필수입니다.");
        }

        // 2. DAO를 통해 댓글 목록 조회 (XML 쿼리에서 이미 대댓글 구조 정렬 포함)
        return commentDAO.selectCommentList(postId);
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId, String userId) {
        // 1. 댓글 ID 유효성 검사 및 권한 확인
        String authorId = commentDAO.selectCommentUserId(commentId);

        if (authorId == null) {
            throw new RuntimeException("해당 댓글을 찾을 수 없습니다.");
        }

        // 요청한 사용자가 댓글 작성자인지 확인
        if (!authorId.equals(userId)) {
            // 403 Forbidden 대신 비즈니스 예외 처리
            throw new SecurityException("댓글 삭제 권한이 없습니다.");
        }

        // 2. DAO를 통해 논리적 삭제 실행
        int result = commentDAO.deleteComment(commentId, userId);

        if (result != 1) {
            // 이미 삭제되었거나, 업데이트 실패 등
            throw new RuntimeException("댓글 삭제 처리 중 오류가 발생했습니다.");
        }
    }

    /**
     * 💡 댓글 수정 메서드 구현
     */
    @Override
    @Transactional
    public void updateComment(Long commentId, String userId, PostCommentRequestVO requestVO) {
        // 1. 댓글 내용 유효성 검사
        if (requestVO.getContent() == null || requestVO.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("댓글 내용은 필수 입력 항목입니다.");
        }

        // 2. 댓글 작성자 ID 조회 및 권한 확인
        String authorId = commentDAO.selectCommentUserId(commentId);

        if (authorId == null) {
            throw new RuntimeException("수정하려는 댓글을 찾을 수 없습니다.");
        }

        // 요청한 사용자가 댓글 작성자인지 확인
        if (!authorId.equals(userId)) {
            // 수정 권한 없음 예외
            throw new SecurityException("댓글 수정 권한이 없습니다.");
        }

        // 3. DAO에 전달할 데이터 준비
        Map<String, Object> params = new HashMap<>();
        params.put("commentId", commentId);
        params.put("content", requestVO.getContent());
        params.put("modifiedBy", userId); // 수정자 기록

        // 4. DAO를 호출하여 DB 업데이트
        int result = commentDAO.updateComment(params);

        if (result != 1) {
            // 업데이트 실패 (0건 수정)
            throw new RuntimeException("댓글 수정 처리 중 오류가 발생했습니다.");
        }
    }
}