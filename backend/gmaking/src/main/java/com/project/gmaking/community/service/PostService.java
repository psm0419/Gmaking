package com.project.gmaking.community.service;

import com.project.gmaking.community.dao.PostDAO;
import com.project.gmaking.community.dao.PostLikeDAO;
import com.project.gmaking.community.dao.PostCharacterImageDAO;
import com.project.gmaking.community.vo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PostService {
    private final PostDAO postDAO;
    private final PostCharacterImageDAO postCharacterImageDAO;
    private final PostLikeDAO postLikeDAO;

    // 게시글 등록 (수정 없음)
    @Transactional
    public void createPost(PostVO postVO){
        postDAO.insertPost(postVO);
    }

    // 상세 조회 (이미지 조회 로직 제거)
    @Transactional(readOnly = true)
    public PostDetailDTO getPostDetail(Long postId, String currentUserId){
        // 1. 게시글 기본 정보 조회
        PostVO postVO = postDAO.selectPostById(postId);

        if(postVO == null){
            return null;
        }

        // 2. PostDetailDTO 객체 생성
        PostDetailDTO detailDTO = new PostDetailDTO(postVO);

        // 좋아요 상태 확인 및 DTO에 설정
        if(currentUserId != null){
            boolean isLiked = postLikeDAO.checkPostLikeStatus(currentUserId, postId) > 0;
            detailDTO.setIsLiked(isLiked);
        } else {
            detailDTO.setIsLiked(false);
        }

        return detailDTO;
    }

    // 닉네임 클릭 모달을 위한 사용자 프로필 요약 정보 조회
    @Transactional(readOnly = true)
    public PostCharacterImageVO getUserProfileSummary(String userId){
        // PostCharacterImageDAO를 사용하여 DB에서 닉네임과 대표 캐릭터 이미지 URL을 조회
        return postCharacterImageDAO.selectUserCharacterImage(userId);
    }

    // 조회수 증가 매서드
    @Transactional
    public void incrementViewCount(Long postId){
        if (postId == null) {
            throw new IllegalArgumentException("게시글 ID는 필수입니다.");
        }

        int rowsAffected = postDAO.incrementViewCount(postId);

        if (rowsAffected == 0) {
            // 조회수 증가에 실패했지만, 게시글이 없으면 발생할 수 있으므로 경고만 출력
            System.err.println("경고: 게시글 ID " + postId + "의 조회수 증가 실패. 게시글이 존재하지 않을 수 있습니다.");
        }
    }

    // 목록 조회 (수정 없음)
    @Transactional(readOnly = true)
    public PostListDTO getPostList(PostPagingVO postPagingVO){
        int totalCount = postDAO.selectPostCount(postPagingVO);
        postPagingVO.setTotalCount(totalCount);

        // 페이징된 목록 데이터 조회
        List<PostVO> list = postDAO.selectPostList(postPagingVO);

        // 최종 DTO 구성 및 반환
        return new PostListDTO(list, postPagingVO);
    }

    // 게시글 삭제
    @Transactional
    public void deletePost(Long postId, String userId) throws SecurityException {
        // 1. 게시글 정보를 조회하여 작성자 ID 확보
        PostVO postVO = postDAO.selectPostById(postId);

        // 게시글이 존재하지 않는 경우
        if (postVO == null) {
            return;
        }

        // 2. 권한 검증: 게시글 작성자와 삭제를 시도하는 사용자가 일치하는지 확인
        if (!postVO.getUserId().equals(userId)) {
            throw new SecurityException("삭제 권한이 없습니다. 해당 게시글의 작성자가 아닙니다.");
        }

        // 4. tb_post에서 게시글 삭제
        postDAO.deletePost(postId);
    }

    // 게시글 수정 (이미지 수정 로직 제거)
    @Transactional
    public void updatePost(PostVO postVO, String userId) throws SecurityException {
        Long postId = postVO.getPostId();

        // 1. 기존 게시글 정보를 조회하여 작성자 ID를 가져옵니다.
        PostVO existingPost = postDAO.selectPostById(postId);

        if (existingPost == null) {
            throw new IllegalArgumentException("존재하지 않는 게시글입니다.");
        }

        // 2. 권한 검증: 게시글 작성자와 수정을 시도하는 사용자가 일치하는지 확인
        if (!existingPost.getUserId().equals(userId)) {
            throw new SecurityException("수정 권한이 없습니다. 해당 게시글의 작성자가 아닙니다.");
        }

        // 3. 게시글 기본 내용만 업데이트
        // PostVO에 있는 제목, 내용만 업데이트하도록 PostDAO.updatePost가 동작해야 합니다.
        postDAO.updatePost(postVO);
    }

    // 좋아요 토글 로직
    @Transactional
    public Map<String, Object> toggleLike(String userId, Long postId){
        PostLikeVO postLikeVO = new PostLikeVO(userId, postId);

        // 좋아요 상태 확인
        boolean isCurrentlyLiked = postLikeDAO.checkPostLikeStatus(userId, postId) > 0;

        if (isCurrentlyLiked) {
            // 2-1. 이미 좋아요를 눌렀다면: 취소 (DELETE)
            postLikeDAO.deletePostLike(postLikeVO);
            isCurrentlyLiked = false;
        } else {
            // 2-2. 안 눌렀다면: 추가 (INSERT)
            postLikeDAO.insertPostLike(postLikeVO);
            isCurrentlyLiked = true;
        }

        // Post 테이블의 LIKE_COUNT를 좋아요 기록 테이블의 실제 갯수로 동기화
        postDAO.updatePostLikeCount(postId);

        // 업데이트된 최종 카운트를 조회
        int finalCount = postLikeDAO.getPostLikeCount(postId);

        Map<String, Object> result = new HashMap<>();
        result.put("likeStatus", isCurrentlyLiked);
        result.put("newLikeCount", finalCount);

        return result;
    }

    // 카테고리별 게시글 수를 조회하는 메서드
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCategoryCounts() {
        // 1. DAO를 통해 카테고리별 개수를 가져옵니다.
        List<Map<String, Object>> categoryCounts = postDAO.selectCategoryCounts();

        // 2. [선택] '전체' 카테고리를 맨 앞에 추가하고 총합을 계산합니다.
        long totalCount = categoryCounts.stream()
                .mapToLong(map -> ((Number) map.get("postCount")).longValue())
                .sum();

        Map<String, Object> totalCategory = new HashMap<>();
        totalCategory.put("categoryCode", "ALL");
        totalCategory.put("postCount", totalCount);

        // 3. '전체' 카테고리를 리스트 맨 앞에 추가합니다.
        List<Map<String, Object>> result = new ArrayList<>();
        result.add(totalCategory);
        result.addAll(categoryCounts);

        // 4. [선택] categoryCode를 React에서 사용하기 편한 'name'으로 변환하는 로직 추가 가능

        return result;
    }

    // 좋아요 수 기준 상위 3개 인기 게시글을 조회하는 메서드
    @Transactional(readOnly = true)
    public List<PostVO> getHotPosts() {
        return postDAO.selectHotPosts();
    }
}