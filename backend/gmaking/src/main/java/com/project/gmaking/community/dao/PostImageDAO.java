package com.project.gmaking.community.dao;

import com.project.gmaking.community.vo.PostImageVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface PostImageDAO {

    // 1. 이미지 생성
    void insertImage(PostImageVO postImageVO);

    // PostImageVO 전체를 받아 해당 ID의 레코드를 수정합니다.
    int updateImage(PostImageVO postImageVO);

    // 3. ID 목록으로 이미지 레코드 조회
    List<PostImageVO> selectImagesByIds(@Param("imageIds") List<Long> imageIds);

    // 4. 이미지 레코드 삭제
    int deleteImagesByIds(@Param("imageIds") List<Long> imageIds);
}