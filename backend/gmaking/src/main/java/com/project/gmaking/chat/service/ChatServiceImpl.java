package com.project.gmaking.chat.service;

import com.project.gmaking.chat.constant.DialogueSender;
import com.project.gmaking.chat.dao.ChatDAO;
import com.project.gmaking.chat.dao.PersonaDAO;
import com.project.gmaking.chat.dao.ConversationDAO;
import com.project.gmaking.chat.llm.LlmClient;
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
    private final ConversationDAO conversationDAO; // 추가

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

        // 유저 발화 저장
        chatDAO.insertDialogue(DialogueVO.builder()
                .conversationId(convId)
                .sender(DialogueSender.user)
                .content(message)
                .createdBy(userId)
                .updatedBy(userId)
                .build());

        // 첫 대화면 플래그 종료
        ConversationVO conv = conversationDAO
                .selectConversationByUserAndCharacter(userId, characterId);
        if (conv != null && Boolean.TRUE.equals(conv.getIsFirstMeet())) {
            conversationDAO.updateFirstMeetFlag(conv.getConversationId(), false, userId);
        }

        // AI 호출
        String reply;
        try {
            reply = llmClient.chat(
                    (persona != null) ? persona.getInstructionPrompt() : null,
                    message
            );
            if (reply == null || reply.isBlank()) reply = "빈 응답입니다.";
        } catch (Exception e) {
            log.error("Gemini error userId={}, characterId={}", userId, characterId, e);
            reply = "AI 응답 생성 중 오류가 발생했습니다.";
        }

        // 캐릭터 발화 저장
        chatDAO.insertDialogue(DialogueVO.builder()
                .conversationId(convId)
                .sender(DialogueSender.character)
                .content(reply)
                .createdBy(userId)
                .updatedBy(userId)
                .build());

        return reply;
    }

    @Override
    public List<DialogueVO> history(String userId, Integer characterId, int limit) {
        Integer convId = chatDAO.findLatestConversationId(userId, characterId);
        if (convId == null) return List.of();
        return chatDAO.selectRecentDialogues(convId, limit);
    }
}
