package com.project.gmaking.community.vo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostCommentRequestVO {
    @NotBlank(message = "댓글 내용은 필수 입력 사항입니다.")
    @Size(max = 500, message = "댓글 내용은 최대 500자까지 입력 가능합니다.")
    private String content;

    // 일반 댓글일 경우 null이 들어옵니다.
    private Long parentId;

}
