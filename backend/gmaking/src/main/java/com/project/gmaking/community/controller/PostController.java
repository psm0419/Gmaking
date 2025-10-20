package com.project.gmaking.community.controller;

import com.project.gmaking.community.service.PostService;
// import com.project.gmaking.community.service.PostFileUploadsService; // 👈 제거
import com.project.gmaking.community.vo.PostVO;
import com.project.gmaking.community.vo.PostPagingVO;
import com.project.gmaking.community.vo.PostDetailDTO;
import com.project.gmaking.community.vo.PostListDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/community")
@RequiredArgsConstructor
public class PostController {
    private final PostService postService;

    // 게시글 등록
    @PostMapping
    public ResponseEntity<String> registerPost(
            @AuthenticationPrincipal String userId, // 403 오류 해결을 위해 String 유지
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam("category") String category
    ) {

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("유효한 사용자 정보가 없습니다. 다시 로그인해 주세요.");
        }

        try{
            // 1. 파일 업로드 및 이미지 ID 확보 로직 제거
            // List<Long> imageIds = postFileUploadsService.uploadAndSaveImages(files, userId);

            // 2. PostVO 객체 생성
            PostVO postVO = new PostVO();
            postVO.setTitle(title);
            postVO.setContent(content);
            postVO.setUserId(userId);
            postVO.setCategoryCode(category);

            // 3. 게시글 DB 저장
            postService.createPost(postVO);

            return new ResponseEntity<>("게시글 등록 성공", HttpStatus.CREATED);
        } catch (Exception e){ // IOException 처리 제거, 일반 예외 처리만 남김
            // 일반 예외 처리
            System.err.println("게시글 등록 중 오류 발생: " + e.getMessage());
            return new ResponseEntity<>("게시글 등록 실패: "+e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 게시글 상세 조회
    @GetMapping("/{postId}")
    public ResponseEntity<PostDetailDTO> getPostDetail(
            @PathVariable Long postId,
            @AuthenticationPrincipal String userId
    ){
        PostDetailDTO detail = postService.getPostDetail(postId, userId);

        if(detail == null){
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(detail, HttpStatus.OK);
    }

    @PostMapping("/view/{postId}")
    public ResponseEntity<Void> incrementViewCount(
            @PathVariable Long postId,
            @AuthenticationPrincipal String userId,
            HttpServletRequest request
    ){
        try {
            postService.incrementViewCount(postId);
            return ResponseEntity.ok().build();

        }catch (IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            System.err.println("조회수 증가 중 오류 발생: " + e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 게시글 목록 조회 (수정 없음)
    @GetMapping
    public ResponseEntity<PostListDTO> getPostList(
            @ModelAttribute PostPagingVO postPagingVO
    ) {
        PostListDTO postListDTO = postService.getPostList(postPagingVO);
        return new ResponseEntity<>(postListDTO, HttpStatus.OK);
    }

    // 게시글 수정 (이미지 로직 제거)
    @PutMapping("/{postId}")
    public ResponseEntity<String> updatePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal String userId,
            @RequestParam("title") String title,
            @RequestParam("content") String content
    ){
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("유효한 사용자 정보가 없습니다. 다시 로그인해 주세요.");
        }

        try{
            // 3. PostVO 생성 및 수정 서비스 호출
            PostVO postVO = new PostVO();
            postVO.setPostId(postId);
            postVO.setTitle(title);
            postVO.setContent(content);

            // 서비스 계층에서 userId를 활용하여 작성자 권한 검증을 수행해야 함
            postService.updatePost(postVO, userId); // 수정 권한 검증을 위해 userId도 전달

            return new ResponseEntity<>("게시글 수정 성공", HttpStatus.OK);
        } catch (SecurityException e) {
            // 권한 없음 예외 (예: 다른 사용자 게시글 수정 시도)
            return new ResponseEntity<>("수정 권한이 없습니다.", HttpStatus.FORBIDDEN);
        }
        catch (Exception e){
            // IOException 처리 제거, 일반 예외 처리만 남김
            System.err.println("게시글 수정 중 오류 발생: " + e.getMessage());
            return new ResponseEntity<>("게시글 수정 실패: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 게시글 삭제 (수정 없음)
    @DeleteMapping("/{postId}")
    public ResponseEntity<String> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal String userId
    ){
        // 널 체크 추가
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("유효한 사용자 정보가 없습니다. 다시 로그인해 주세요.");
        }

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