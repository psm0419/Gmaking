package com.project.gmaking.character.service;

import com.project.gmaking.character.vo.ImageUploadResponseVO;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

public interface GcsService {

    /**
     * MultipartFile을 GCS에 업로드하고 URL을 반환
     * @param file 업로드할 파일
     * @param folderName GCS 내부에 저장될 폴더 이름 (예: "characters", "profiles")
     * @return 파일 이름 및 URL을 담은 응답 DTO
     * @throws IOException 파일 처리 중 발생 가능한 오류
     */
    ImageUploadResponseVO uploadFile(MultipartFile file, String folderName) throws IOException;

    /**
     * Base64 이미지 바이트 배열을 GCS에 업로드하고 URL을 반환
     * @param imageBytes Base64 디코딩된 이미지 바이트 배열
     * @param folderName GCS 내부에 저장될 폴더 이름 (예: "characters")
     * @param extension 파일 확장자 (예: "png", "jpg")
     * @param createdBy 생성자 ID (USER_ID)
     * @return 파일 이름 및 URL을 담은 응답 DTO
     * @throws IOException 파일 처리 중 발생 가능한 오류
     */
    ImageUploadResponseVO uploadBase64Image(byte[] imageBytes, String folderName, String extension, String createdBy) throws IOException;

    /**
     * GCS에서 파일(Blob)을 삭제
     * @param fileName GCS에 저장된 파일의 전체 경로 (예: monster/UUID.png)
     * @throws IOException 파일 처리 중 발생 가능한 오류
     */
    void deleteFile(String fileName) throws IOException;
}
