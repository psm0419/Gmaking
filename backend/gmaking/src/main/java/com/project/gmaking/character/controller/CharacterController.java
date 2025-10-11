package com.project.gmaking.character.controller;

import com.project.gmaking.character.dao.CharacterDAO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

import com.project.gmaking.character.service.CharacterService;
import com.project.gmaking.character.vo.CharacterVO;

@RestController
@RequestMapping("/api/character")
@RequiredArgsConstructor
public class CharacterController {

    private final CharacterService characterService;


    @GetMapping("/list")
    public List<CharacterVO> getCharactersByUser(@RequestParam String userId) {
        return characterService.getCharactersByUser(userId);
    }


}

