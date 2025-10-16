package com.project.gmaking.community.controller;

import com.project.gmaking.community.service.PostService;
import com.project.gmaking.community.service.PostFileUploadsService;
import com.project.gmaking.community.vo.PostVO;
import com.project.gmaking.community.vo.PostPagingVO;
import com.project.gmaking.community.vo.PostDetailDTO;
import com.project.gmaking.community.vo.PostListDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class PostController {
    private final PostService postService;
    private final PostFileUploadsService postFileUploadsService;

    // 게시글 등록
    @PostMapping
    public ResponseEntity<String> registerPost(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam(value = "files", required = false) List<MultipartFile> files
    ) {
        String authorId = userDetails.getUsername();

        try{
            List<Long> imageIds = postFileUploadsService.uploadAndSaveImages(files, authorId);

            // PostVO 객체 생성 및 이미지 ID 목록 설정
            PostVO postVO = new PostVO();
            postVO.setTitle(title);
            postVO.setContent(content);
            postVO.setAuthorId(authorId);
            postVO.setImageIds(imageIds);

            // service를 통해 게시글 DB 저장 및 이미지 ID 연결
            postService.createPost(postVO);

            return new ResponseEntity<>("게시글 등록 성공", HttpStatus.CREATED);
        } catch (IOException e){
            return new ResponseEntity<>("파일 업로드 오류", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e){
            return new ResponseEntity<>("게시글 등록 실패: "+e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    // 게시글 상세 조회
    @GetMapping("/{postId}")
    public ResponseEntity<PostDetailDTO> getPostDetail(@PathVariable Long postId){
        PostDetailDTO detail = postService.getPostDetail(postId);

        if(detail == null){
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(detail, HttpStatus.OK);
    }

    // 게시글 목록 조회
    @GetMapping
    public ResponseEntity<PostListDTO> getPostList(
            @ModelAttribute PostPagingVO postPagingVO
    ) {
        PostListDTO postListDTO = postService.getPostList(postPagingVO);
        return new ResponseEntity<>(postListDTO, HttpStatus.OK);
    }

    // 게시글 수정
    @PutMapping("/{postId}")
    public ResponseEntity<String> updatePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam(value = "imageIds", required = false) List<Long> imageIds,
            @RequestParam(value = "files", required = false) List<MultipartFile> newFiles
    ){
        // 파일 업로드 처리
        String authorId = userDetails.getUsername();
        try{
            // 새로운 파일이 있다면 업로드하고 ID 확보
            List<Long> newUploadedImageIds = postFileUploadsService.uploadAndSaveImages(newFiles, authorId);

            // 기존 ID 목록과 새로운 파일 ID 목록을 합칩니다.
            if(imageIds == null){
                imageIds = newUploadedImageIds;
            } else{
                imageIds.addAll(newUploadedImageIds);
            }

            // PostVO 생성 및 수정 서비스 호출
            PostVO postVO = new PostVO();
            postVO.setPostId(postId);
            postVO.setTitle(title);
            postVO.setContent(content);
            postVO.setImageIds(imageIds);

            postService.updatePost(postVO);

            return new ResponseEntity<>("게시글 수정 성공", HttpStatus.OK);
        } catch (IOException e){
            return new ResponseEntity<>("파일 업로드 오류", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e){
            return new ResponseEntity<>("게시글 수정 실패: " +e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 게시글 삭제
    @DeleteMapping("/{postId}")
    public ResponseEntity<String> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetails userDetails
    ){
        try{
            postService.deletePost(postId);
            return new ResponseEntity<>("게시글 삭제 성공", HttpStatus.NO_CONTENT);
        } catch (Exception e){
            return new ResponseEntity<>("게시글 삭제 실패", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
