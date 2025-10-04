package com.project.gmaking.persona.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PersonaVO {
    private Integer personaId;
    private Integer characterId;
    private String instructionPrompt;
    private LocalDateTime createdAt;
    private LocalDateTime updateAt;
}
