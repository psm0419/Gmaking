package com.project.gmaking.community.dao;

import com.project.gmaking.community.vo.PostCommentRequestVO;
import com.project.gmaking.community.vo.PostCommentResponseVO;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PostCommentDAO {
    // 댓글 추가
    int insertComment(Map<String, Object> params);

    // 특정 게시글의 논리적으로 삭제되지 않은 댓글 목록을 조회
    List<PostCommentResponseVO> selectCommentList(@Param("postId") Long postId);

    // 댓글 삭제
    int deleteComment(@Param("commentId") Long commentId, @Param("userId") String userId);

    // 특정 댓글의 작성자 ID를 조회하여 삭제 권한을 확인
    String selectCommentUserId(@Param("commentId") Long commentId);

    // 특정 게시글의 전체 댓글 개수를 조회
    long countComments(@Param("postId") Long postId);

    // 댓글 수정 메서드 추가
    int updateComment(Map<String, Object> params);
}
