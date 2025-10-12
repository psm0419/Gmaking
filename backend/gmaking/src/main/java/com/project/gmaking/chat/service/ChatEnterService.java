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

        // 1) 대화방 없으면 생성
        Integer convId = chatDAO.findLatestConversationId(userId, characterId);
        if (convId == null) {
            chatDAO.createConversation(userId, characterId, userId);
            convId = chatDAO.findLatestConversationId(userId, characterId);
        }

        // 2) 페르소나 확인/생성
        PersonaVO persona = personaDAO.selectPersonaByCharacterId(characterId);
        if (persona == null) {
            persona = personaService.ensurePersona(characterId, userId);
        }

        // 3) 첫인사 여부 확인
        ConversationVO conv = conversationDAO
                .selectConversationByUserAndCharacter(userId, characterId);
        boolean isFirst = conv != null && Boolean.TRUE.equals(conv.getIsFirstMeet());

        String greeting = null;
        if (isFirst) {
            // ‘첫 만남 인사’ 요청 메시지
            String firstGreetingAsk = """
                    너는 지금 유저와 '첫 대화'를 시작한다.
                    규칙:
                    - 네 이름을 자연스럽게 밝힌다.
                    - 앞으로 상대를 뭐라고 부르면 좋을지 1문장으로 정중히 묻는다.
                    - 1~2문장, 친근하고 가볍게. 이모지는 최대 1개.
                    - 캐릭터 성격/배경은 시스템 프롬프트에 주어진다.
                    """;

            try {
                greeting = llmClient.chat(persona.getInstructionPrompt(), firstGreetingAsk);
            } catch (Exception e) {
                greeting = "안녕! 처음 보는 것 같네. 앞으로 뭐라고 부르면 좋을까?";
            }

            // 첫인사 대사 저장(플래그는 유저가 첫 메시지 보낼 때 끔)
            chatDAO.insertDialogue(DialogueVO.builder()
                    .conversationId(convId)
                    .sender(DialogueSender.character)
                    .content(greeting)
                    .createdBy(userId)
                    .updatedBy(userId)
                    .build());
        }

        // 4) 최근 대화 이력 (오래된→최신)
        List<DialogueVO> history = chatDAO.selectRecentDialogues(convId, 30);

        // 5) 응답 조립
        return EnterResponseVO.builder()
                .personaId(persona.getPersonaId())
                .greetingMessage(greeting) // 첫입장일 때만 값 존재
                .isFirstMeet(isFirst)
                .history(history)
                .build();
    }
}
