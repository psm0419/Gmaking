package com.project.gmaking.login.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LoginVO {

    private String userId;                  // USER_ID
    private String userName;                // USER_NAME
    private String userEmail;               // USER_EMAIL
    private String isEmailVerified;         // IS_EMAIL_VERIFIED
    private String userPassword;            // USER_PASSWORD (암호화된 비밀번호)
    private String userNickname;            // USER_NICKNAME
    private String role;                    // ROLE
    private LocalDateTime createdDate;      // CREATED_DATE
    private Integer imageId;

    private String characterName;
    private boolean hasCharacter;
    private String characterImageUrl;
    private Integer incubatorCount;
    private boolean isAdFree;

    private int characterCount;

    private Integer characterId;
}