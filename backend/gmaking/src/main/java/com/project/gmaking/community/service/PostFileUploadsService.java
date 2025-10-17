package com.project.gmaking.community.service;

import com.project.gmaking.community.dao.PostImageDAO;
import com.project.gmaking.community.vo.PostImageVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PostFileUploadsService {

    private final PostImageDAO postImageDAO;

    // ⭐️ BASE_DIR은 실제 배포 환경에서 변경되어야 합니다.
    private final String BASE_DIR = "src/main/resource/static";
    private final String IMAGE_SUB_PATH = "images/community/";

    @Transactional
    public List<Long> uploadAndSaveImages(List<MultipartFile> files, String createdBy) throws IOException{
        if(files == null || files.isEmpty()){
            return new ArrayList<>();
        }

        List<Long> imageIds = new ArrayList<>();

        // 저장될 최종 디렉토리 설정 및 생성
        File uploadDir = new File(BASE_DIR + IMAGE_SUB_PATH);
        if(!uploadDir.exists()){
            // mkdirs()를 사용하여 상위 디렉토리까지 생성하도록 안전하게 변경
            uploadDir.mkdirs();
        }

        for(MultipartFile file : files){
            if(file.isEmpty()) continue;

            // 고유 파일명 생성 및 저장 경로 정의
            String originalFileName = file.getOriginalFilename();
            // null 체크 추가
            if (originalFileName == null || originalFileName.isEmpty()) continue;

            String fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;

            File targetFile = new File(uploadDir, uniqueFileName);

            // 물리적인 파일 저장
            file.transferTo(targetFile);

            // ImageVO 생성 및 DB 저장
            PostImageVO postImageVO = new PostImageVO();
            postImageVO.setImageOriginalName(originalFileName);

            // 클라이언트가 접근할 URL을 저장
            postImageVO.setImageUrl(IMAGE_SUB_PATH + uniqueFileName);

            postImageVO.setImageName(uniqueFileName);
            // DB INT 타입에 맞춤 (1L은 일반 이미지 타입 코드라고 가정)
            postImageVO.setImageType(1L);

            postImageVO.setCreatedBy(createdBy);

            postImageDAO.insertImage(postImageVO);

            // 생성된 imageId 확보
            imageIds.add(postImageVO.getImageId());
        }
        return imageIds;
    }

    // ⭐️ [추가] 이미지 레코드 정보 수정 메서드
    // PostImageDAO.updateImage를 호출하여 레코드 자체의 정보를 수정합니다.
    @Transactional
    public int updateImageInfo(PostImageVO postImageVO){
        // 수정 시간과 수정자를 업데이트합니다.
        postImageVO.setUpdatedBy(postImageVO.getCreatedBy()); // createdBy를 updatedBy로 사용한다고 가정
        return postImageDAO.updateImage(postImageVO);
    }
}