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
@RequestMapping("/community")
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
        // ⭐️ NullPointerException 방지 및 인증되지 않은 사용자 방어
        if (userDetails == null || userDetails.getUsername() == null) {
            // 토큰은 있지만 유효한 사용자 정보(Principal)를 로드하지 못한 경우를 포함하여 처리
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("유효한 사용자 정보가 없습니다. 다시 로그인해 주세요.");
        }

        String userId = userDetails.getUsername();

        try{
            // 1. 파일 업로드 및 이미지 ID 확보 (userId를 파일 소유자로 지정)
            List<Long> imageIds = postFileUploadsService.uploadAndSaveImages(files, userId);

            // 2. PostVO 객체 생성
            PostVO postVO = new PostVO();
            postVO.setTitle(title);
            postVO.setContent(content);
            postVO.setUserId(userId); // 작성자 ID는 인증 주체에서 가져옴
            postVO.setImageIds(imageIds);

            // 3. 게시글 DB 저장 및 이미지 ID 연결
            postService.createPost(postVO);

            return new ResponseEntity<>("게시글 등록 성공", HttpStatus.CREATED);
        } catch (IOException e){
            // 파일 입출력 오류 처리
            return new ResponseEntity<>("파일 업로드 처리 중 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e){
            // 일반 예외 처리
            System.err.println("게시글 등록 중 오류 발생: " + e.getMessage());
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
        // ⭐️ NullPointerException 방지 및 인증되지 않은 사용자 방어
        if (userDetails == null || userDetails.getUsername() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("유효한 사용자 정보가 없습니다. 다시 로그인해 주세요.");
        }

        String userId = userDetails.getUsername(); // 사용자 ID를 인증 주체에서 안전하게 가져옴

        try{
            // 1. 새로운 파일 업로드 및 ID 확보
            List<Long> newUploadedImageIds = postFileUploadsService.uploadAndSaveImages(newFiles, userId);

            // 2. 기존 ID 목록과 새로운 파일 ID 목록을 합침 (null 체크 포함)
            if(imageIds == null){
                imageIds = newUploadedImageIds;
            } else{
                imageIds.addAll(newUploadedImageIds);
            }

            // 3. PostVO 생성 및 수정 서비스 호출
            PostVO postVO = new PostVO();
            postVO.setPostId(postId);
            postVO.setTitle(title);
            postVO.setContent(content);
            postVO.setImageIds(imageIds);

            // 서비스 계층에서 userId를 활용하여 작성자 권한 검증을 수행해야 함
            postService.updatePost(postVO, userId); // 수정 권한 검증을 위해 userId도 전달

            return new ResponseEntity<>("게시글 수정 성공", HttpStatus.OK);
        } catch (IOException e){
            return new ResponseEntity<>("파일 업로드 처리 중 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (SecurityException e) {
            // 권한 없음 예외 (예: 다른 사용자 게시글 수정 시도)
            return new ResponseEntity<>("수정 권한이 없습니다.", HttpStatus.FORBIDDEN);
        }
        catch (Exception e){
            System.err.println("게시글 수정 중 오류 발생: " + e.getMessage());
            return new ResponseEntity<>("게시글 수정 실패: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 게시글 삭제
    @DeleteMapping("/{postId}")
    public ResponseEntity<String> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetails userDetails
    ){
        // 널 체크 추가
        if (userDetails == null || userDetails.getUsername() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("유효한 사용자 정보가 없습니다. 다시 로그인해 주세요.");
        }
        String userId = userDetails.getUsername();

        try{
            // 서비스 계층에서 userId를 활용하여 삭제 권한 검증을 수행해야 함
            postService.deletePost(postId, userId); // 삭제 권한 검증을 위해 userId도 전달

            return new ResponseEntity<>("게시글 삭제 성공", HttpStatus.NO_CONTENT);
        } catch (SecurityException e) {
            // 권한 없음 예외
            return new ResponseEntity<>("삭제 권한이 없습니다.", HttpStatus.FORBIDDEN);
        }
        catch (Exception e){
            System.err.println("게시글 삭제 중 오류 발생: " + e.getMessage());
            return new ResponseEntity<>("게시글 삭제 실패", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}