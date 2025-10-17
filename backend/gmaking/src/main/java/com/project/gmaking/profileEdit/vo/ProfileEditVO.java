package com.project.gmaking.profileEdit.vo;

import lombok.*;
import net.minidev.json.annotate.JsonIgnore;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileEditVO {
    private String userId;
    private String userName;

    @ToString.Exclude
    @JsonIgnore
    private String userPassword;

    private String userNickname;
    private Integer imageId;
    private LocalDateTime createdDate;
}
