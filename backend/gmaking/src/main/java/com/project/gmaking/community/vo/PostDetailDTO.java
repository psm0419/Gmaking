package com.project.gmaking.community.vo;

import com.project.gmaking.community.vo.PostImageVO;
import com.project.gmaking.community.vo.PostVO;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
public class PostDetailDTO {
    private Long postId;
    private String title;
    private String content;
    private String userId;

    private String categoryCode;
    private Long viewCount;
    private Long likeCount;
    private String isDeleted;

    private LocalDateTime createdDate;
    private String createdBy;
    private LocalDateTime updatedDate;
    private String updatedBy;

    // 클라이언트에게는 ID 대신 실제 이미지 정보를 담은 객체 목록을 전달합니다.
    private  List<PostImageVO> images;

    // PostVO와 List<ImageVO>를 받아 DTO를 생성하는 생성자
    public PostDetailDTO(PostVO postVO, List<PostImageVO> images){
        this.postId = postVO.getPostId();
        this.title = postVO.getTitle();
        this.content = postVO.getContent();
        this.userId = postVO.getUserId();
        this.categoryCode = postVO.getCategoryCode();
        this.viewCount = postVO.getLikeCount();
        this.likeCount = postVO.getLikeCount();
        this.isDeleted = postVO.getIsDeleted();

        this.createdDate = postVO.getCreatedDate();
        this.createdBy = postVO.getCreatedBy();
        this.updatedDate = postVO.getUpdatedDate();
        this.updatedBy = postVO.getUpdatedBy();

        this.images = images;
    }
}
