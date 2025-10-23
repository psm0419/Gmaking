package com.project.gmaking.growth.controller;

import com.project.gmaking.growth.service.GrowthService;
import com.project.gmaking.growth.vo.GrowthRequestVO;
import com.project.gmaking.growth.vo.GrowthResponseVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/growth")
@RequiredArgsConstructor
public class GrowthController {
    private final GrowthService growthService;

    @PostMapping("/character")
    public ResponseEntity<?> growCharacter(
            @RequestBody GrowthRequestVO growthRequestVO,
            @AuthenticationPrincipal String userId) {
        // 인증된 사용자 ID 검증
        if(userId == null){
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("{\"message\":\"유효한 사용자 정보가 없습니다. 다시 로그인해 주세요.\"}");
        }

        // 주입받은 안전한 userId를 VO에 설정
        growthRequestVO.setUserId(userId);

        try{
            // 서비스 호출 및 최종 DB 업데이트 실행
            GrowthResponseVO growthResponseVO = growthService.processCharacterGrowth(growthRequestVO);

            // 클라이언트에 최종 스탯과 AI 결과 반환
            return ResponseEntity.ok(growthResponseVO);
        } catch (RuntimeException e){
            // 서비스 계층에서 발생한 모든 RuntimeException은 500 에러로 처리
            System.err.println("캐릭터 성장 처리 중 오류 발생: " + e.getMessage());
            // 사용자에게는 일반적인 서버 오류 메시지를 반환
            return new ResponseEntity<>("{\"message\":\"캐릭터 성장 처리 중 서버 오류가 발생했습니다.\", \"detail\":\"" + e.getMessage() + "\"}", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}