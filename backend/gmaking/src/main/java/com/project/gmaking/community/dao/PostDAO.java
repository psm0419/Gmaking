package com.project.gmaking.community.dao;

import com.project.gmaking.community.vo.PostPagingVO;
import com.project.gmaking.community.vo.PostVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Map;

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

    // LIKE_COUNT를 좋아요 기록의 실제 갯수로 갱신
    int updatePostLikeCount(Long postId);

    // 게시글 조회수 1 증가
    int incrementViewCount(Long postId);

    // 카테고리별 게시글 수를 조회하는 메서드 추가
    List<Map<String, Object>> selectCategoryCounts();

    // 좋아요 수가 많은 상위 3개 게시글을 조회
    List<PostVO> selectHotPosts();
}
