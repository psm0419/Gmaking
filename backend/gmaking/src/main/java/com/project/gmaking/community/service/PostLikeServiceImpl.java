package com.project.gmaking.community.service;

import com.project.gmaking.community.dao.PostDAO;
import com.project.gmaking.community.dao.PostLikeDAO;
import com.project.gmaking.community.vo.PostLikeVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PostLikeServiceImpl implements PostLikeService { // PostLikeService로 인터페이스 이름 변경 권장

    private final PostLikeDAO postLikeDAO;
    private final PostDAO postDAO;

    // 💡 인터페이스 메서드 시그니처를 String userId로 변경해야 합니다.
    @Override
    @Transactional
    public Map<String, Object> togglePostLike(String userId, Long postId) {

        // 현재 좋아요 상태 확인
        boolean isCurrentlyLiked = postLikeDAO.checkPostLikeStatus(userId, postId) > 0;
        boolean newLikeStatus;
        String message;

        if (isCurrentlyLiked) {
            // 좋아요 취소
            PostLikeVO postLikeVO = new PostLikeVO();
            postLikeVO.setUserId(userId);
            postLikeVO.setPostId(postId);

            postLikeDAO.deletePostLike(postLikeVO);
            newLikeStatus = false;
            message ="좋아요 취소 완료";
        } else {
            // 좋아요 추가
            PostLikeVO postLikeVO = new PostLikeVO();
            postLikeVO.setUserId(userId);
            postLikeVO.setPostId(postId);

            postLikeDAO.insertPostLike(postLikeVO);
            newLikeStatus = true;
            message = "좋아요 성공";
        }

        // 변경된 좋아요 개수 조회
        int newLikeCount = postLikeDAO.getPostLikeCount(postId);

        // 결과를 Map에 담아 반환
        Map<String, Object> result = new HashMap<>();
        result.put("likeStatus", newLikeStatus);
        result.put("newLikeCount", newLikeCount);
        result.put("message", message);

        return result;
    }

    @Override // 💡 PostLikeService 인터페이스에도 이 메서드가 String userId를 받도록 수정해야 합니다.
    public boolean isPostLikedByUser(String userId, Long postId) {
        return postLikeDAO.checkPostLikeStatus(userId, postId) > 0;
    }

    @Override
    public int getLikeCount(Long postId) {
        return postLikeDAO.getPostLikeCount(postId);
    }
}