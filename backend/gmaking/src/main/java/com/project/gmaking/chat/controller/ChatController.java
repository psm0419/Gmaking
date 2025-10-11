package com.project.gmaking.chat.controller;

import com.project.gmaking.aiLog.service.ChatUsageLogSevice;
import com.project.gmaking.character.service.CharacterService;
import com.project.gmaking.chat.service.ChatService;
import com.project.gmaking.chat.vo.DialogueVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatController {
    private final ChatService chatService;
    private final ChatUsageLogSevice chatUsageLogService;
    private final CharacterService characterService;

    // 채팅 페이지에서 캐릭터 목록 가져오기
    @GetMapping("/characters")
    public ResponseEntity<List<Map<String, Object>>> getChatCharacters(Authentication auth) {
        String userId = auth.getName();
        List<Map<String, Object>> characters = characterService.getCharactersForChat(userId);
        return ResponseEntity.ok(characters);
    }

    @PostMapping("/{characterId}/send")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @PathVariable Integer characterId,
            @RequestBody Map<String, String> body
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName(); // 일반적으로 username(userId)로 세팅되어 있음

        String message = body.get("message");
        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "message는 필수입니다."));
        }

        String modelName = "gemini-1.5-flash";
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
}
