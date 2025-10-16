package com.project.gmaking.community.service;

import com.project.gmaking.community.dao.PostImageDAO;
import com.project.gmaking.community.vo.PostImageVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PostFileUploadsService {

    private final PostImageDAO postImageDAO;

    private final String BASE_DIR = "src/main/resource/static";
    private final String IMAGE_SUB_PATH = "images/community/";

    public List<Long> uploadAndSaveImages(List<MultipartFile> files, String createdBy) throws IOException{
        if(files == null || files.isEmpty()){
            return new ArrayList<>();
        }

        List<Long> imageIds = new ArrayList<>();

        // 저장될 최종 디렉토리 설정 및 생성
        File uploadDir = new File(BASE_DIR + IMAGE_SUB_PATH);
        if(!uploadDir.exists()){
            uploadDir.mkdir();
        }

        for(MultipartFile file : files){
            if(file.isEmpty()) continue;

            // 고유 파일명 생성 및 저장 경로 정의
            String originalFileName = file.getOriginalFilename();
            String fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;

            File targetFile = new File(uploadDir, uniqueFileName);

            // 물리적인 파일 저장
            file.transferTo(targetFile);

            // ImageVO 생성 및 DB 저장
            PostImageVO postImageVO = new PostImageVO();
            postImageVO.setImageOriginalName(originalFileName);

            //클라이언트가 접근할 URL을 저장
            postImageVO.setImageUrl(IMAGE_SUB_PATH + uniqueFileName);

            postImageVO.setImageName(uniqueFileName);
            postImageVO.setImageType(file.getContentType());
            postImageVO.setCreatedBy(createdBy);

            postImageDAO.insertImage(postImageVO);

            // 생성된 imageId 확보
            imageIds.add(postImageVO.getImageId());
        }
        return imageIds;
    }
}
