package com.project.gmaking.character.service;

import com.google.cloud.storage.*;
import com.project.gmaking.character.service.GcsService;
import com.project.gmaking.character.vo.ImageUploadResponseVO;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.util.UUID;

@Service
public class GcsServiceImpl implements GcsService {

    @Value("${gcp.storage.bucket-name}")
    private String bucketName;

    private final Storage storage;

    // 서비스 계정 키 파일 경로를 사용하여 Storage 객체를 초기화
    public GcsServiceImpl(@Value("${gcp.storage.key-file-path}") String keyFilePath) throws IOException {

        File keyFile = new File(System.getProperty("user.dir"), keyFilePath);


        if (!keyFile.exists()) {
            throw new FileNotFoundException("❌ GCP 키 파일을 찾을 수 없습니다: " + keyFile.getAbsolutePath());
        }

        // 인증 및 Storage 객체 초기화
        storage = StorageOptions.newBuilder()
                .setCredentials(
                        com.google.auth.oauth2.GoogleCredentials.fromStream(
                                Files.newInputStream(keyFile.toPath())
                        )
                )
                .build()
                .getService();

        // 디버깅용 로그
        System.out.println("GCP 인증 성공: " + keyFile.getAbsolutePath());
    }

    @Override
    public ImageUploadResponseVO uploadFile(MultipartFile file, String folderName) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("파일이 비어있습니다.");
        }

        // 1. GCS에 저장될 고유 파일 이름 생성 (중복 방지)
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".") ?
                originalFilename.substring(originalFilename.lastIndexOf('.')) : "";
        String savedFileName = folderName + "/" + UUID.randomUUID().toString() + extension;

        // 2. GCS 업로드
        BlobId blobId = BlobId.of(bucketName, savedFileName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(file.getContentType())
                .build();

        storage.createFrom(blobInfo, file.getInputStream());

        // 3. 응답 객체 생성 및 반환
        String publicUrl = String.format("https://storage.googleapis.com/%s/%s", bucketName, savedFileName);

        ImageUploadResponseVO response = new ImageUploadResponseVO();
        response.setFileName(savedFileName);
        response.setFileUrl(publicUrl);

        return response;
    }

    @Override
    public ImageUploadResponseVO uploadBase64Image(byte[] imageBytes, String folderName, String extension, String createdBy) throws IOException {

        if (imageBytes == null || imageBytes.length == 0) {
            throw new IOException("이미지 바이트가 비어있습니다.");
        }

        // 1. GCS에 저장될 고유 파일 이름 생성
        String savedFileName = folderName + "/" + UUID.randomUUID().toString() + "." + extension;

        // 2. GCS 업로드
        BlobId blobId = BlobId.of(bucketName, savedFileName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType("image/" + extension)
                .build();

        // 바이트 배열을 직접 업로드
        storage.create(blobInfo, imageBytes);

        // 3. 응답 객체 생성 및 반환
        String publicUrl = String.format("https://storage.googleapis.com/%s/%s", bucketName, savedFileName);

        ImageUploadResponseVO response = new ImageUploadResponseVO();
        response.setFileName(savedFileName);
        response.setFileUrl(publicUrl);

        return response;
    }

    @Override
    public void deleteFile(String fileName) throws IOException {
        if (fileName == null || fileName.isEmpty()) {
            return;
        }

        BlobId blobId = BlobId.of(bucketName, fileName);
        boolean deleted = storage.delete(blobId);

        if (!deleted) {
            System.err.println("GCS 파일 삭제 실패 또는 파일 없음: " + fileName);
        }
    }

}