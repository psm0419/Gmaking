package com.project.gmaking.profileEdit.service;

import com.project.gmaking.character.service.GcsService;
import com.project.gmaking.character.vo.ImageUploadResponseVO;
import com.project.gmaking.profileEdit.dao.ProfileEditDAO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;


import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class ProfileEditService {
    private final ProfileEditDAO dao;
    private final PasswordEncoder passwordEncoder;
    private final GcsService gcsService;

    // 프로필 조회
    @Transactional(readOnly = true)
    public Map<String, Object> getMe(String userId) {
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
    @Transactional
    public void changePassword(String userId, String currentPassword, String newPassword) {
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("새 비밀번호는 8자 이상이어야 합니다.");
        }

        String stored = dao.selectPasswordHash(userId);
        if (stored == null || !passwordEncoder.matches(currentPassword, stored)) {
            throw new IllegalArgumentException("현재 비밀번호가 올바르지 않습니다");
        }

        // (선택) 기존과 동일한 비밀번호 방지
        if (passwordEncoder.matches(newPassword, stored)) {
            throw new IllegalArgumentException("이전 비밀번호와 동일합니다.");
        }

        String newHash = passwordEncoder.encode(newPassword);
        int updated = dao.updatePasswordHash(userId, newHash);
        if (updated != 1) {
            throw new IllegalStateException("비밀번호 변경에 실패했습니다");
        }
    }

    // 프로필 이미지 업로드

    public Map<String, Object> uploadProfile(String userId, MultipartFile file) throws Exception {
        // GCS 업로드 (profile 폴더에 저장)
        ImageUploadResponseVO uploaded = gcsService.uploadFile(file, "profile");

        // TB_IMAGE insert (키 자동 생성)
        Map<String, Object> p = new HashMap<>();
        p.put("imageOriginalName", file.getOriginalFilename());
        p.put("imageUrl", uploaded.getFileUrl());   // 공개 URL
        p.put("imageName", uploaded.getFileName()); // 버킷 내부 경로
        p.put("imageType", 0);
        p.put("createdBy", userId);
        p.put("updatedBy", userId);

        dao.insertImage(p);

        Object key = p.get("imageId");
        if (key == null) throw new IllegalStateException("이미지 ID 생성에 실패했습니다.");

        int imageId; // DB는 INT 이므로 최종적으로 int로 사용
        if (key instanceof Number) {
            imageId = ((Number) key).intValue(); // BigInteger, Long, Integer 모두 OK
        } else {
            imageId = Integer.parseInt(String.valueOf(key));
        }

        int updated = dao.updateUserImage(userId, imageId);
        if (updated != 1) throw new IllegalStateException("사용자 프로필 이미지 갱신 실패");

        // 프론트로 공개 URL 반환
        return Map.of("url", uploaded.getFileUrl());
    }

}
