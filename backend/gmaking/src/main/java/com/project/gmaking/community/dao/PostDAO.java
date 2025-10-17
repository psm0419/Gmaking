package com.project.gmaking.community.dao;

import com.project.gmaking.community.vo.PostPagingVO;
import com.project.gmaking.community.vo.PostVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface PostDAO {

    // 게시글 등록
    void insertPost(PostVO postVO);

    // 게시글 수정
    int updatePost(PostVO postVO);

    // 게시글 ID로 상세 정보를 조회
    PostVO selectPostById(Long postId);

    // 게시글 ID로 삭제
    int deletePost(Long postId);

    // 전체/특정 조건의 게시글 목록을 조회
    List<PostVO> selectPostList(PostPagingVO pagingVO);

    // 페이징을 위한 전체 게시글 수를 조회
    int selectPostCount(PostPagingVO pagingVO);

}
