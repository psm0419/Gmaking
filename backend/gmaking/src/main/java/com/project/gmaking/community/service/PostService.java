package com.project.gmaking.community.service;

import com.project.gmaking.community.dao.PostDAO;
import com.project.gmaking.community.dao.PostImageDAO;
import com.project.gmaking.community.vo.PostVO;
import com.project.gmaking.community.vo.PostImageVO;
import com.project.gmaking.community.vo.PostPagingVO;
import com.project.gmaking.community.vo.PostDetailDTO;
import com.project.gmaking.community.vo.PostListDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.swing.*;
import java.util.Collection;
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

        Long newPostId = postVO.getPostId();
        List<Long> imageIds = postVO.getImageIds();

        // image_ids 목록이 있다면, tb_image의 post_id를 업데이트하여 게시글 최종 연결
        if(imageIds != null && !imageIds.isEmpty()){
            postImageDAO.updateImagePostId(newPostId, imageIds);
        }
    }

    // 상세 조회
    @Transactional(readOnly = true)
    public PostDetailDTO getPostDetail(Long postId){
        // 게시글 기본 정보 조회
        PostVO postVO = postDAO.selectPostById(postId);

        if(postVO == null){
            return null;
        }
        // post_id를 사용하여 tb_image에서 실제 이미지 URL 정보 조회
        List<PostImageVO> imageList = postImageDAO.selectImagesByPostId(postId);

        // DTO로 변환하여 Controller에 반환
        return new PostDetailDTO(postVO, imageList != null ? imageList : Collections.emptyList());
    }

    // 목록 조회
    @Transactional(readOnly = true)
    public PostListDTO getPostList(PostPagingVO postPagingVO){
        // 전체 게시글 수 조회
        int totalCount = postDAO.selectPostCount();
        postPagingVO.setTotalCount(totalCount);

        // 페이징된 목록 데이터 조회
        List<PostVO> list = postDAO.selectPostList(postPagingVO);

        // 최종 DTO 구성 및 반환
        return new PostListDTO(list, postPagingVO);
    }

    // 게시글 삭제
    @Transactional
    public void deletePost(Long postId){
        // 이미지 레코드를을 삭제
        postImageDAO.deleteImagesByPostId(postId);

        // tb_post에서 게시글 삭제
        postDAO.deletePost(postId);
    }

    // 게시글 수정
    @Transactional
    public void updatePost(PostVO postVO){
        Long postId = postVO.getPostId();
        List<Long> newImageIds = postVO.getImageIds();

        // 게시글 기본 내용 및 새로운 image_ids 목록업데이트
        postDAO.updatePost(postVO);

        // 이미지 연결 갱신 로직
        // 기존 이미지 목록 조회
        List<PostImageVO> existingImages = postImageDAO.selectImagesByPostId(postId);
        List<Long> existingImageIds = existingImages.stream().map(PostImageVO::getImageId).toList();

        // 삭제될 이미지 ID
        List<Long> imagesToDelete = existingImageIds.stream()
                .filter(id -> newImageIds == null || !newImageIds.contains(id))
                .toList();

        // 새로 연결될 이미지 ID
        List<Long> imagesToConnect = newImageIds.stream()
                .filter(id -> !existingImageIds.contains(id))
                .toList();

        // 삭제 처리
        if(!imagesToDelete.isEmpty()){
            postImageDAO.deleteImagesByIds(imagesToDelete);
        }

        // 연결 처리: 새로 추가된 이미지들의 post_id 업데이트
        if(!imagesToConnect.isEmpty()){
            postImageDAO.updateImagePostId(postId, imagesToConnect);
        }
    }
}
