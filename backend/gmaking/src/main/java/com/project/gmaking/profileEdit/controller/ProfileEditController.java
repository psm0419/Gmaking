
package com.project.gmaking.profileEdit.controller;

import com.project.gmaking.profileEdit.service.ProfileEditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/mypage")
@RequiredArgsConstructor
public class ProfileEditController {

    private final ProfileEditService service;



    /** 프로필 조회: { nickname, profileImageUrl } */
    @GetMapping("/profile/me")
    public Map<String, Object> me(Authentication auth) {
        String userId = auth.getName();                // JWT 필터에서 name=userId 세팅되어 있어야 함
        return service.getMe(userId);
    }

    /** 닉네임 변경 */
    @PatchMapping("/profile/nickname")
    public Map<String, Object> updateNickname(Authentication auth,
                                              @RequestBody Map<String, Object> body) {
        String userId = auth.getName();
        String nickname = String.valueOf(body.getOrDefault("nickname", "")).trim();
        service.changeNickname(userId, nickname);
        return Map.of("message", "ok");
    }

    /** 비밀번호 변경 */
    @PatchMapping("/profile/password")
    public ResponseEntity<Void> updatePassword(Authentication auth,
                                               @RequestBody Map<String, Object> body) {
        String userId = auth.getName();
        String currentPassword = String.valueOf(body.getOrDefault("currentPassword", ""));
        String newPassword     = String.valueOf(body.getOrDefault("newPassword", ""));
        service.changePassword(userId, currentPassword, newPassword);
        return ResponseEntity.noContent().build(); // 204
    }

    @PostMapping(value = "/profile/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> upload(Authentication auth,
                                      @RequestPart("file") MultipartFile file) throws Exception {
        String userId = auth.getName();
        return service.uploadProfile(userId, file); // { "url": "https://storage.googleapis.com/<bucket>/profile/..." }
    }

    
}
