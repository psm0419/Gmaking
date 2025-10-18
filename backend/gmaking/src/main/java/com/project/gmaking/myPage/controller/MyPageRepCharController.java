package com.project.gmaking.myPage.controller;

import com.project.gmaking.myPage.service.MyPageRepCharService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/my-page") // 컨벤션에 맞춤
public class MyPageRepCharController {

    private final MyPageRepCharService service;

    /* 현재 대표 캐릭터 조회 */
    @GetMapping("/representative-character")
    public Map<String, Object> get(Authentication auth) {
        String userId = auth.getName();
        Integer cid = service.getMyRepresentativeCharId(userId);

        Map<String, Object> res = new HashMap<>();
        res.put("message", "ok");
        res.put("characterId", cid);              // null 허용
        res.put("hasCharacter", cid != null);
        return res;
    }

    /* 대표 캐릭터 설정 */
    @PatchMapping("/representative-character")
    public Map<String, Object> set(Authentication auth,
                                   @RequestBody Map<String, Object> body) {
        String userId = auth.getName();
        Integer characterId = body.get("characterId") == null ? null
                : Integer.valueOf(String.valueOf(body.get("characterId")));
        if (characterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "characterId is required");
        }

        service.setMyRepresentativeChar(userId, characterId);

        Map<String, Object> res = new HashMap<>();
        res.put("message", "ok");
        res.put("characterId", characterId);
        res.put("hasCharacter", true);
        return res;
    }

    /* 대표 캐릭터 해제 */
    @DeleteMapping("/representative-character")
    public Map<String, Object> clear(Authentication auth) {
        String userId = auth.getName();
        service.clearMyRepresentativeChar(userId);

        Map<String, Object> res = new HashMap<>();
        res.put("message", "ok");
        res.put("characterId", null);             // null도 안전
        res.put("hasCharacter", false);
        return res;
    }
}
