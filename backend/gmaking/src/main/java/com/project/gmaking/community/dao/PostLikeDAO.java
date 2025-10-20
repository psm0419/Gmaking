package com.project.gmaking.community.dao;

import com.project.gmaking.community.vo.PostLikeVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PostLikeDAO {
    // 특정 게시글에 좋아요를 기록
    // 💡 PostLikeVO 내부의 userId도 String으로 변경했어야 합니다.
    int insertPostLike(PostLikeVO postLikeVO);

    // 특정 게시글에 기록된 좋아요를 삭제
    // 💡 수정: userId 타입을 String으로 변경
    int deletePostLike(PostLikeVO postLikeVO);

    // 특정 사용자가 특정 게시글에 좋아요를 눌렀는지 확인
    // 💡 수정: userId 타입을 String으로 변경
    int checkPostLikeStatus(@Param("userId") String userId, @Param("postId") Long postId);

    // 특정 게시글의 전체 좋아요 개수를 조회
    int getPostLikeCount(Long postId);
}