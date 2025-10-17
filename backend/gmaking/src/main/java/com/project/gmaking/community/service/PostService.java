package com.project.gmaking.community.service;

import com.project.gmaking.community.dao.PostDAO;
import com.project.gmaking.community.dao.PostImageDAO;
import com.project.gmaking.community.vo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {
    private final PostDAO postDAO;
    private final PostImageDAO postImageDAO;

    // 게시글 등록
    @Transactional
    public void createPost(PostVO postVO){
        postDAO.insertPost(postVO);

    }

    // 상세 조회
    @Transactional(readOnly = true)
    public PostDetailDTO getPostDetail(Long postId){
        // 1. 게시글 기본 정보 조회
        PostVO postVO = postDAO.selectPostById(postId);

        if(postVO == null){
            return null;
        }

        // 2. 이미지 조회: IMAGE_IDS 필드를 사용하여 이미지 정보 조회
        List<PostImageVO> imageList = Collections.emptyList();
        List<Long> imageIds = postVO.getImageIds();

        if(imageIds != null && !imageIds.isEmpty()){
            imageList = postImageDAO.selectImagesByIds(imageIds);
        }

        // 3. DTO로 변환하여 Controller에 반환
        return new PostDetailDTO(postVO, imageList);
    }

    // 목록 조회
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
    // ⭐️ [수정] userId 인자를 추가하고 권한 검증 로직을 포함합니다.
    @Transactional
    public void deletePost(Long postId, String userId) throws SecurityException {
        // 1. 게시글 정보를 조회하여 작성자 ID와 IMAGE_IDS 확보
        PostVO postVO = postDAO.selectPostById(postId);

        // 게시글이 존재하지 않는 경우
        if (postVO == null) {
            // 삭제하려는 게시글이 이미 없으므로 성공으로 간주하거나, NotFound 예외를 던질 수 있습니다.
            // 여기서는 이미 삭제된 것으로 간주하고 정상 종료합니다.
            return;
        }

        // 2. ⭐️ 권한 검증: 게시글 작성자와 삭제를 시도하는 사용자가 일치하는지 확인
        if (!postVO.getUserId().equals(userId)) {
            // 일치하지 않으면 SecurityException을 던져 Controller에서 403 (FORBIDDEN)으로 처리되도록 합니다.
            throw new SecurityException("삭제 권한이 없습니다. 해당 게시글의 작성자가 아닙니다.");
        }

        // 3. IMAGE_IDS를 기반으로 TB_IMAGE 레코드 삭제 (첨부 파일 정리)
        if (postVO.getImageIds() != null && !postVO.getImageIds().isEmpty()) {
            postImageDAO.deleteImagesByIds(postVO.getImageIds());
        }

        // 4. tb_post에서 게시글 삭제
        postDAO.deletePost(postId);
    }

    // ⭐️ [수정] 게시글 수정 (IMAGE_IDS를 활용한 이미지 수정/갱신 로직 추가 및 권한 검증)
    @Transactional
    public void updatePost(PostVO postVO, String userId) throws SecurityException {
        Long postId = postVO.getPostId();
        List<Long> newImageIds = postVO.getImageIds();

        // 1. 기존 게시글 정보를 조회하여 이전 IMAGE_IDS 목록 및 작성자 ID를 가져옵니다.
        PostVO existingPost = postDAO.selectPostById(postId);

        if (existingPost == null) {
            throw new IllegalArgumentException("존재하지 않는 게시글입니다.");
        }

        // 2. ⭐️ 권한 검증: 게시글 작성자와 수정을 시도하는 사용자가 일치하는지 확인
        if (!existingPost.getUserId().equals(userId)) {
            // 일치하지 않으면 SecurityException을 던져 Controller에서 403 (FORBIDDEN)으로 처리되도록 합니다.
            throw new SecurityException("수정 권한이 없습니다. 해당 게시글의 작성자가 아닙니다.");
        }

        // 이전 이미지 ID 목록 확보
        List<Long> existingImageIds = existingPost.getImageIds() != null ? existingPost.getImageIds() : Collections.emptyList();

        // 3. 게시글 기본 내용 및 새로운 image_ids 목록 업데이트 (DB 연결 관계 수정/갱신)
        //    PostVO에 있는 제목, 내용, ImageIds만 업데이트합니다.
        postDAO.updatePost(postVO);

        // 4. ⭐️ 이미지 레코드 삭제 로직 (실제 파일/레코드 정리)
        if(!existingImageIds.isEmpty()){
            // 이전 ID 목록에는 있었지만 새로운 ID 목록에 없는 ID를 찾습니다.
            List<Long> imagesToDelete = existingImageIds.stream()
                    .filter(id -> newImageIds == null || !newImageIds.contains(id))
                    .toList();

            // 5. 삭제될 이미지 ID가 있다면 TB_IMAGE 레코드를 삭제합니다.
            if(!imagesToDelete.isEmpty()){
                postImageDAO.deleteImagesByIds(imagesToDelete);
            }
        }
    }
}