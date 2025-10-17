//package com.project.gmaking.imageUpload.service;
//
//import com.project.gmaking.imageUpload.ImageKind;
//import com.project.gmaking.imageUpload.dao.ImageDAO;
//import com.project.gmaking.imageUpload.vo.ImageVO;
//import com.project.gmaking.storage.LocalStorageService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//import org.springframework.web.multipart.MultipartFile;
//
//import java.util.HashMap;
//import java.util.Map;
//
//@Service
//@RequiredArgsConstructor
//public class ImageUploadService {
//    private final LocalStorageService storage;
//    private final ImageDAO imageDAO;
//
//    @Transactional
//    public ImageVO saveFor(MultipartFile file, ImageKind kind, String actor) throws Exception {
//        String url = storage.save(file, kind.subDir);
//        String imageName = storage.extractSavedName(url);
//
//        ImageVO image = ImageVO.builder()
//                .imageOriginalName(file.getOriginalFilename())
//                .imageUrl(url)
//                .imageName(imageName)
//                .imageType(kind.code)
//                .createdBy(actor)
//                .updatedBy(actor)
//                .build();
//
//        int rows = imageDAO.insertImage(image);
//        if (rows != 1 || image.getImageId() == null) {
//            throw new IllegalStateException("IMAGE_ID 생성 실패");
//        }
//        return image;
//    }
//
//    // 사용 법 : var img = ImageUploadService.saveFor(file, ImageKind.타입(CHARACTER/MONSTER/PROFILE), actorUserId);
//}
