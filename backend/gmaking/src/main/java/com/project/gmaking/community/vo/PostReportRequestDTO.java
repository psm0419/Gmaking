package com.project.gmaking.community.vo;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostReportRequestDTO {

    /**
     * 신고 사유 및 상세 내용 (예: "SPAM: 광고성 게시글입니다.")
     * 프론트엔드에서 코드를 조합하여 전달하는 방식을 따릅니다.
     */
    @NotBlank(message = "신고 사유는 필수입니다.")
    @Size(min = 3, max = 500, message = "신고 사유는 최소 3자에서 500자 이내여야 합니다.")
    private String reason;

    /**
     * 신고 대상 타입 (POST인지 확인)
     */
    @NotNull(message = "신고 대상 타입은 필수입니다.")
    private String targetType;

}