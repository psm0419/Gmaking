package com.project.gmaking.character.controller;

import com.project.gmaking.character.dao.CharacterDAO;
import com.project.gmaking.character.vo.CharacterStatVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.project.gmaking.character.service.CharacterService;
import com.project.gmaking.character.vo.CharacterVO;

@RestController
@RequestMapping("/api/character")
@RequiredArgsConstructor
public class CharacterController {

    private final CharacterService characterService;

    // GET /api/character/list?userId=xxxx
    @GetMapping("/list")
    public ResponseEntity<?> getCharacterList(@RequestParam String userId) {
        List<CharacterVO> list = characterService.getCharactersByUser(userId);
        return ResponseEntity.ok(list);
    }


}
