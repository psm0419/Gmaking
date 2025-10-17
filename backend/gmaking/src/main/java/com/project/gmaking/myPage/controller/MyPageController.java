package com.project.gmaking.myPage.controller;

import com.project.gmaking.character.service.CharacterService;
import com.project.gmaking.character.vo.CharacterStatVO;
import com.project.gmaking.myPage.service.MyPageService;
import com.project.gmaking.myPage.vo.CharacterCardVO;
import com.project.gmaking.myPage.vo.MyPageProfileVO;
import com.project.gmaking.myPage.vo.MyPageSummaryVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/my-page")
public class MyPageController {
    private final MyPageService myPageService;
    private final CharacterService characterService;

    // 상단 프로필
    @GetMapping("/profile")
    public MyPageProfileVO getProfile(Authentication authentication) {
        String userId = currentUserId(authentication);
        return myPageService.getProfile(userId);
    }

    // 캐릭터 목록 (페이징)
    @GetMapping("/characters")
    public Map<String, Object> getCharacters(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            Authentication authentication
    ) {
        String userId = currentUserId(authentication);
        List<CharacterCardVO> items = myPageService.getCharacters(userId, page, size);
        int total = myPageService.getCharacterCount(userId);
        Map<String, Object> res = new HashMap<>();
        res.put("page", page);
        res.put("size", size);
        res.put("total", total);
        res.put("items", items);
        return res;
    }

    //요약 한번에 맏고 싶으면
    @GetMapping("/summary")
    public MyPageSummaryVO summary(
            @RequestParam(defaultValue = "50") int previewSize,
            Authentication authentication
    ) {
        String userId = currentUserId(authentication);

        MyPageProfileVO profile = myPageService.getProfile(userId);
        List<CharacterCardVO> characters = myPageService.getCharacters(userId, 0, previewSize);
        int characterCount = myPageService.getCharacterCount(userId);

        return MyPageSummaryVO.builder()
                .profile(profile)
                .characterCount(characterCount)
                .characters(characters)
                .build();
    }


    private String currentUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증이 필요합니다.");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails ud) return ud.getUsername();
        return authentication.getName(); // 기본
    }

    @GetMapping("/characters/{characterId}/stats")
    public ResponseEntity<CharacterStatVO> getCharacterStats(
            @PathVariable Integer characterId
    ) {

        CharacterStatVO vo = characterService.getCharacterStat(characterId);
        if (vo == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(vo);
    }
}
