package com.project.gmaking.email.vo;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EmailVerificationVO {

    private String userId;              // USER_ID
    private String email;               // EMAIL
    private String verifyCode;          // VERIFY_CODE
    private LocalDateTime expiryDate;   // EXPIRY_DATE
    private String isVerified;          // IS_VERIFIED (Y/N)

}