package com.project.gmaking.chat.service;

import com.project.gmaking.chat.constant.DialogueSender;
import com.project.gmaking.chat.dao.ChatDAO;
import com.project.gmaking.chat.dao.PersonaDAO;
import com.project.gmaking.chat.dao.ConversationDAO;
import com.project.gmaking.chat.llm.LlmClient;
import com.project.gmaking.chat.nlp.CallingNameExtractor;
import com.project.gmaking.chat.vo.ConversationVO;
import com.project.gmaking.chat.vo.DialogueVO;
import com.project.gmaking.chat.vo.PersonaVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {
    private final ChatDAO chatDAO;
    private final LlmClient llmClient;
    private final PersonaDAO personaDAO;
    private final PersonaService personaService;
    private final ConversationDAO conversationDAO;
    private final CallingNameExtractor callingNameExtractor; // 주입

    @Override
    @Transactional
    public String send(String userId, Integer characterId, String message) {

        // 대화방 확보
        Integer convId = chatDAO.findLatestConversationId(userId, characterId);
        if (convId == null) {
            chatDAO.createConversation(userId, characterId, userId);
            convId = chatDAO.findLatestConversationId(userId, characterId);
        }

        // 페르소나 확보
        PersonaVO persona = personaDAO.selectPersonaByCharacterId(characterId);
        if (persona == null) {
            persona = personaService.ensurePersona(characterId, userId);
        }

        // 1) 유저 발화 저장
        chatDAO.insertDialogue(DialogueVO.builder()
                .conversationId(convId)
                .sender(DialogueSender.user)
                .content(message)
                .createdBy(userId)
                .updatedBy(userId)
                .build());

        // 2) 첫만남 플래그 해제
        ConversationVO conv = conversationDAO.selectConversationByUserAndCharacter(userId, characterId);
        if (conv != null && Boolean.TRUE.equals(conv.getIsFirstMeet())) {
            conversationDAO.updateFirstMeetFlag(conv.getConversationId(), false, userId);
        }

        // 3) 호칭 추출 + DB 반영 (같은 요청에 즉시 반영)
        String currentCalling = conversationDAO.selectCallingName(convId);
        String newCalling = callingNameExtractor.extract(message, currentCalling);
        if (newCalling != null && !newCalling.isBlank()) {
            conversationDAO.updateCallingName(convId, newCalling, userId);
            currentCalling = newCalling;
        }

        // 4) 시스템 프롬프트에 호칭 주입
        String systemPrompt = buildSystemPrompt(
                persona != null ? persona.getInstructionPrompt() : null,
                currentCalling
        );

        // 5) LLM 호출
        String reply;
        try {
            reply = llmClient.chat(systemPrompt, message);
            if (reply == null || reply.isBlank()) reply = "빈 응답입니다.";
        } catch (Exception e) {
            log.error("Gemini error userId={}, characterId={}", userId, characterId, e);
            reply = "AI 응답 생성 중 오류가 발생했습니다.";
        }

        // 6) 캐릭터 발화 저장
        chatDAO.insertDialogue(DialogueVO.builder()
                .conversationId(convId)
                .sender(DialogueSender.character)
                .content(reply)
                .createdBy(userId)
                .updatedBy(userId)
                .build());

        return reply;
    }

    private String buildSystemPrompt(String personaPrompt, String callingName) {
        StringBuilder sb = new StringBuilder();
        if (personaPrompt != null && !personaPrompt.isBlank()) {
            sb.append(personaPrompt.trim()).append("\n\n");
        }
        String safeCalling = (callingName == null || callingName.isBlank()) ? "마스터" : callingName;
        sb.append("""
            [대화 지침 - 호칭]
            - 사용자를 부를 때 "%s" 로 호칭하라. (불분명하면 기본 "마스터")
            - 호칭은 존중하되 과도하게 반복하지 말 것.
        """.formatted(safeCalling));
        return sb.toString();
    }

    @Override
    public List<DialogueVO> history(String userId, Integer characterId, int limit) {
        Integer convId = chatDAO.findLatestConversationId(userId, characterId);
        if (convId == null) return List.of();
        return chatDAO.selectRecentDialogues(convId, limit);
    }
}
