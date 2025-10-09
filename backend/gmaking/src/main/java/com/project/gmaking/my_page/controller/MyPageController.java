package com.project.gmaking.my_page.controller;

import com.project.gmaking.my_page.service.MyPageService;
import com.project.gmaking.my_page.vo.CharacterCardVO;
import com.project.gmaking.my_page.vo.MyPageProfileVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/my-page")
public class MyPageController {
    private final MyPageService myPageService;

    // 상단 프로필
    @GetMapping("/profile")
    public MyPageProfileVO getProfile(@RequestParam String userId) {
        return myPageService.getProfile(userId);
    }

    // 캐릭터 목록 (페이징)
    @GetMapping("/characters")
    public Map<String, Object> getCharacters(@RequestParam String userId,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "12") int size) {
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
    public Map<String, Object> summary(@RequestParam String userId,
                                       @RequestParam(defaultValue = "6") int previewSize) {
        MyPageProfileVO profile = myPageService.getProfile(userId);
        List<CharacterCardVO> characters = myPageService.getCharacters(userId, 0, previewSize);
        int characterCount = myPageService.getCharacterCount(userId);

        Map<String, Object> res = new HashMap<>();
        res.put("profile", profile);
        res.put("characterCount", characterCount);
        res.put("characters", characters);
        return res;
    }
}
