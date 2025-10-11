package com.project.gmaking.chat.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonaVO {
    private Integer personaId;          // PERSONA_ID
    private Integer characterId;        // CHARACTER_ID
    private String instructionPrompt;   // INSTRUCTION_PROMPT
    private LocalDateTime createdDate;  // CREATED_DATE
    private String createdBy;           // CREATED_BY
    private LocalDateTime updatedDate;  // UPDATED_DATE
    private String updatedBy;           // UPDATED_BY
}
