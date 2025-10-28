package com.project.gmaking.community.vo;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostReportRequestDTO {

    /**
     * 신고 사유 및 상세 내용 (예: "SPAM: 광고성 게시글입니다.")
     * 400 BAD REQUEST 오류 방지를 위해 최소 길이를 1로 완화했습니다.
     */
    @NotBlank(message = "신고 사유는 필수입니다.")
    @Size(min = 1, max = 500, message = "신고 사유는 최소 1자에서 500자 이내여야 합니다.")
    private String reason;

    /**
     * 신고 대상 타입 (POST인지 COMMENT인지 확인)
     * 이 값은 컨트롤러에서 경로를 통해 이미 명확하므로, DTO에서는 @NotNull 등의 제약을 제거하여 유연성을 높입니다.
     */
    private String targetType;
}