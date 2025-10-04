package com.project.gmaking.login.vo;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class WithdrawRequestVO {

    @NotBlank(message = "아이디는 필수입니다.")
    private String userId;

    @NotBlank(message = "비밀번호는 필수입니다.")
    private String userPassword;

}