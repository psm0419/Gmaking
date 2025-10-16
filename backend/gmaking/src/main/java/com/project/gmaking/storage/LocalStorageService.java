package com.project.gmaking.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;


@Service
public class LocalStorageService {

    // 프로필 이미지 저장 서비스

    @Value("${app.upload.profile-dir:C:/Gmaking}")
    private String baseDir;  // 실제 저장 경로(서버 로컬 디스크)

    @Value("${app.upload.profile-url-prefix:/images}")
    private String publicPrefix;

    // 파일 저장, 프론트에서 바로 쓸 수 있는 공개 URL 문자열 반환
    public String save(MultipartFile file, String subDir) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("empty file");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드 할 수 있습니다.");
        }

        Path dir = Paths.get(baseDir, subDir);
        Files.createDirectories(dir);

        String ext = getExt(file.getOriginalFilename());
        String name = ts()
                + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;

        try (InputStream in = file.getInputStream()) {
            Files.copy(in, dir.resolve(name), StandardCopyOption.REPLACE_EXISTING);
        }

        return publicPrefix + "/" + subDir + "/" + name;
    }


    // 공개 URL 에서 실제 저장된 파일명만 추출
    public String extractSavedName(String url) {
        int p = url.lastIndexOf('/');
        return p >= 0 ? url.substring(p + 1) : url;
    }

    // 이미지 파일 필터
    public String getExt(String filename) {
        if (filename == null) return ".png";
        int p = filename.lastIndexOf('.');
        return p >= 0 ? filename.substring(p) : ".png";
    }

    private String ts() {
        return DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss").format(LocalDateTime.now());
    }


}
