package com.project.gmaking.community.dao;

import com.project.gmaking.community.vo.PostImageVO;
import com.project.gmaking.community.vo.PostPagingVO;
import com.project.gmaking.community.vo.PostVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface PostImageDAO {

    // 이미지 생성
    void insertImage(PostImageVO postImageVO);

    // 이미지 수정
    int updateImagePostId(@Param("postId") Long postId, @Param("imageIds") List<Long> imageIds);

    // 게시글 이미지 조회
    List<PostImageVO> selectImagesByPostId(Long postId);

    // 게시글 이미지 삭제
    int deleteImagesByPostId(Long postId);

    // 이미지 레코드 삭제
    int deleteImagesByIds(@Param("imageIds") List<Long> imageIds);

    // 페이징을 위한 전체 게시글 수를 조회
    int selectPostCount();

    // 페이징 처리된 게시글 목록을 조회
    List<PostVO> selectPostList(PostPagingVO postPagingVO);
}
