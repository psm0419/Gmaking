package com.project.gmaking.chat.controller;

import com.project.gmaking.aiLog.service.ChatUsageLogSevice;
import com.project.gmaking.character.service.CharacterService;
import com.project.gmaking.chat.service.ChatEnterService;
import com.project.gmaking.chat.service.ChatService;
import com.project.gmaking.chat.vo.DialogueVO;
import com.project.gmaking.chat.vo.EnterResponseVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatController {
    private final ChatService chatService;
    private final ChatEnterService chatEnterService;
    private final ChatUsageLogSevice chatUsageLogService;
    private final CharacterService characterService;

    // 채팅 입장: 페르소나 확인/생성 + 첫인사(프롬프트 기반) + 히스토리 반환
    @PostMapping("/{characterId}/enter")
    public ResponseEntity<EnterResponseVO> enterChat(
            @PathVariable Integer characterId,
            Authentication auth
    ) {
        String userId = auth.getName();
        EnterResponseVO res = chatEnterService.enterChat(userId, characterId);
        return ResponseEntity.ok(res);
    }

    // 채팅 페이지에서 캐릭터 목록 가져오기
    @GetMapping("/characters")
    public ResponseEntity<List<Map<String, Object>>> getChatCharacters(Authentication auth) {
        String userId = auth.getName();
        List<Map<String, Object>> characters = characterService.getCharactersForChat(userId);
        return ResponseEntity.ok(characters);
    }

    // 유저 메시지 전송
    @PostMapping("/{characterId}/send")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @PathVariable Integer characterId,
            @RequestBody Map<String, String> body
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();

        String message = body.get("message");
        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "message는 필수입니다."));
        }

        String modelName = "gemini-2.0-flash";
        String reply;
        String usageStatus = "success";
        String errorMessage = null;

        try {
            reply = chatService.send(userId, characterId, message);
        } catch (Exception e) {
            usageStatus = "error";
            errorMessage = e.getMessage();
            reply = "오류 발생!";
        }

        chatUsageLogService.upsertChatUsage(
                userId,
                "chat",
                modelName,
                usageStatus,
                errorMessage,
                userId
        );

        return ResponseEntity.ok(Map.of(
                "reply", reply,
                "characterId", characterId
        ));
    }

    // 최근 대화 내역 불러오기
    @GetMapping("/{characterId}/history")
    public ResponseEntity<List<DialogueVO>> getHistory(
            @PathVariable Integer characterId,
            @RequestParam(defaultValue = "30") int limit,
            Authentication authentication
    ) {
        String userId = authentication.getName(); // JwtAuthenticationFilter에서 넣은 userId

        List<DialogueVO> history = chatService.history(userId, characterId, limit);
        return ResponseEntity.ok(history);
    }

    @PostMapping("/{characterId}/exit")
    public ResponseEntity<Void> exit(@PathVariable Integer characterId, Authentication authentication) {
        String userId = authentication.getName();
        log.info("[EXIT] userId={}, characterId={}", userId, characterId);
        chatEnterService.exitChat(userId, characterId); // 내부에서 최신 OPEN을 찾아 닫기
        return ResponseEntity.noContent().build(); // 204
    }
}
