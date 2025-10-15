package com.project.gmaking.imageUpload.service;

import com.project.gmaking.imageUpload.ImageKind;
import com.project.gmaking.imageUpload.dao.ImageDAO;
import com.project.gmaking.storage.LocalStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ImageUploadService {
    private final LocalStorageService storage;
    private final ImageDAO imageDAO;

    @Transactional
    public Map<String,Object> saveFor(MultipartFile file, ImageKind kind, String actor) throws Exception {
        // 디스크 저장
        String url = storage.save(file, kind.subDir);
        String imageName = storage.extractSavedName(url);

        // tb_image INSERT
        Map<String,Object> p = new HashMap<>();
        p.put("imageOriginalName", file.getOriginalFilename());
        p.put("imageUrl",  url);
        p.put("imageName", imageName);
        p.put("imageType", kind.code);   // ← DB에는 int 저장
        p.put("createdBy", actor);
        p.put("updatedBy", actor);
        imageDAO.insertImage(p);         // p.imageId 채워짐

        Integer imageId = (Integer) p.get("imageId");
        if (imageId == null) throw new IllegalStateException("IMAGE_ID 생성 실패");

        return Map.of(
                "imageId", imageId,
                "url", url,
                "imageName", imageName,
                "imageType", kind.code
        );
    }

    // 사용 법 : var img = ImageUploadService.saveFor(file, ImageKind.타입(CHARACTER/MONSTER/PROFILE), actorUserId);
}
