package com.project.gmaking.chat.service;

import com.project.gmaking.chat.constant.DialogueSender;
import com.project.gmaking.chat.dao.ChatDAO;
import com.project.gmaking.chat.dao.ConversationDAO;
import com.project.gmaking.chat.dao.PersonaDAO;
import com.project.gmaking.chat.llm.LlmClient;
import com.project.gmaking.chat.vo.ConversationVO;
import com.project.gmaking.chat.vo.DialogueVO;
import com.project.gmaking.chat.vo.EnterResponseVO;
import com.project.gmaking.chat.vo.PersonaVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatEnterService {

    private final ChatDAO chatDAO;
    private final PersonaDAO personaDAO;
    private final PersonaService personaService;
    private final ConversationDAO conversationDAO;
    private final LlmClient llmClient;

    @Transactional
    public EnterResponseVO enterChat(String userId, Integer characterId) {

        Integer convId = chatDAO.findLatestConversationId(userId, characterId);
        if (convId == null) {
            chatDAO.createConversation(userId, characterId, userId);
            convId = chatDAO.findLatestConversationId(userId, characterId);
        }

        PersonaVO persona = personaDAO.selectPersonaByCharacterId(characterId);
        if (persona == null) {
            persona = personaService.ensurePersona(characterId, userId);
        }

        // 첫 대화 여부: 유저가 아직 말 안했으면 true
        int userMsgCount = chatDAO.countUserMessages(convId);
        boolean isFirstMeet = (userMsgCount == 0);

        if (isFirstMeet) {
            // 캐릭터 메시지가 이미 있는지 확인
            int characterMsgCount = chatDAO.countCharacterMessages(convId);

            if (characterMsgCount > 0) {
                // 이미 첫인사가 있음 → LLM 호출 스킵
                // (혹시 중복이면 최신 1개만 남기고 정리)
                chatDAO.deleteOldCharacterMessagesExceptLatest(convId);
            } else {
                // 아무 캐릭터 메시지도 없으면 첫인사 1개 생성
                String firstGreetingAsk = """
                너는 지금 유저와 '첫 대화'를 시작한다.
                규칙:
                - 네 이름을 자연스럽게 밝힌다.
                - 앞으로 상대를 뭐라고 부르면 좋을지 1문장으로 정중히 묻는다.
                - 1~2문장, 친근하고 가볍게. 이모지는 최대 1개.
                - 캐릭터 성격/배경은 시스템 프롬프트에 주어진다.
                """;

                String greeting;
                try {
                    greeting = llmClient.chat(persona.getInstructionPrompt(), firstGreetingAsk);
                    if (greeting == null || greeting.isBlank()) {
                        greeting = "안녕! 처음 보는 것 같네. 앞으로 뭐라고 부르면 좋을까?";
                    }
                } catch (Exception e) {
                    greeting = "안녕! 처음 보는 것 같네. 앞으로 뭐라고 부르면 좋을까?";
                }

                chatDAO.insertDialogue(DialogueVO.builder()
                        .conversationId(convId)
                        .sender(DialogueSender.character)
                        .content(greeting)
                        .createdBy(userId)
                        .updatedBy(userId)
                        .build());
            }
        }

        List<DialogueVO> history = chatDAO.selectRecentDialogues(convId, 30);

        return EnterResponseVO.builder()
                .personaId(persona.getPersonaId())
                .greetingMessage(null)     // history에 포함되므로 굳이 별도 필드 필요 X
                .isFirstMeet(isFirstMeet)
                .history(history)
                .build();
    }
}
