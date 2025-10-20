package com.project.gmaking.community.service;

import com.project.gmaking.community.vo.PostLikeDTO;
import java.util.Map;

public interface PostLikeService {

    // 게시글에 대한 좋아요 상태를 토글(추가 및 취소)합니다.
    Map<String, Object> togglePostLike(String userId, Long postId);

    // 특정 게시글의 현재 좋아요 개수를 조회
    int getLikeCount(Long postId);

    // 특정 사용자가 특정 게시글에 좋아요를 눌렀는지 확인
    boolean isPostLikedByUser(String userId, Long postId);
}