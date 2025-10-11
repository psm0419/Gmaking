package com.project.gmaking.myPage.vo;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MyPageProfileVO {
    private String userId;
    private String nickname;
    private String email;
    private boolean emailVerified;
    private String imageUrl;
    private String role;
    private Integer ticketCount;
}


