package com.project.gmaking.profileEdit.service;

import com.project.gmaking.imageUpload.ImageKind;
import com.project.gmaking.imageUpload.service.ImageUploadService;
import com.project.gmaking.profileEdit.dao.ProfileEditDAO;
import lombok.RequiredArgsConstructor;
import org.apache.catalina.security.SecurityUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.security.Security;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class ProfileEditService {
    private final ProfileEditDAO dao;
    private final PasswordEncoder passwordEncoder;
    private final ImageUploadService imageUploadService;

    // 프로필 조회
    @Transactional(readOnly = true)
    public Map<String, Object> getProfile(String userId) {
        return dao.selectProfile(userId);
    }

    // 닉네임 변경
    public void changeNickname(String userId, String nickname) {
        String nick = nickname == null ? "" : nickname.trim();
        if (nick.length() < 2 || nick.length() > 10) {
            throw new IllegalArgumentException("닉네임은 2~10자 입니다.");
        }
        if (dao.updateNickname(userId, nick) != 1) {
            throw new IllegalStateException("닉네임 변경 실패");
        }
    }

    // 비밀번호 변경
    public void changePassword(String userId, String currentPassword, String newPassword) {
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("새 비밀번호는 8자 이상이어야 합니다.");
        }
        String stored = dao.selectPasswordHash(userId);
        if (stored == null || !passwordEncoder.matches(currentPassword, stored)) {
            throw new IllegalArgumentException("현재 비밀번호가 올바르지 않습니다");
        }
        dao.updatePasswordHash(userId, passwordEncoder.encode(newPassword));
    }

//    // 프로필 이미지 업로드
//    public Map<String, Object> uploadProfile(String userId, MultipartFile file) throws Exception {
//        // 공용 업로더 호출
//        Map<String, Object> img = imageUploadService.saveFor(file, ImageKind.PROFILE, userId);
//
//    }

}
