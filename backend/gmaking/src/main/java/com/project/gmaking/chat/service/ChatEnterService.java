package com.project.gmaking.chat.service;

import com.project.gmaking.chat.constant.ConversationStatus;
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
    private final LongMemoryService longMemoryService;

    @Transactional
    public EnterResponseVO enterChat(String userId, Integer characterId) {

        Integer convId = chatDAO.findLatestConversationId(userId, characterId);
        if (convId == null) {
            chatDAO.createConversation(userId, characterId, userId);
            convId = chatDAO.findLatestConversationId(userId, characterId);
        }

        // 입장시 지연청소
        cleanupDelayedIfClosed(convId, userId);

        PersonaVO persona = personaDAO.selectPersonaByCharacterId(characterId);
        if (persona == null) {
            persona = personaService.ensurePersona(characterId, userId);
        }

        // 첫 대화 여부: 유저가 아직 말 안했으면 true
        ConversationVO conv = conversationDAO.selectConversationByUserAndCharacter(userId, characterId);
        boolean isFirstMeet = conv != null && Boolean.TRUE.equals(conv.getIsFirstMeet());

        String calling = conversationDAO.selectCallingName(convId);
        String sysPrompt = (persona != null) ? persona.getInstructionPrompt() : "";
        if (calling != null && !calling.isBlank()) {
            sysPrompt += "\n\n[대화 지침 - 호칭]\n- 사용자를 '" + calling + "'로 호칭하라. 과도 반복은 피함.\n";
        }

        if (isFirstMeet) {
            // 만남 첫 인사: 캐릭터 메시지 중복 방지(선택) 후 1회 생성
            String ask = """
            너는 지금 유저와 '첫 대화'를 시작한다.
            규칙:
            - 네 이름을 자연스럽게 밝힌다.
            - 앞으로 상대를 뭐라고 부르면 좋을지 1문장으로 정중히 묻는다.
            - 1~2문장, 친근하고 가볍게. 이모지는 최대 1개.
        """;
            String greeting = safeChat(sysPrompt, ask,
                    "안녕! 처음 보는 것 같네. 앞으로 뭐라고 부르면 좋을까?");
            saveCharacterLine(convId, userId, greeting);
            // isFirstMeet는 "유저가 첫 메시지 보낼 때" send()에서 false로 내림 (유지)

        } else {
            // 이미 만난 사이 → 하루 첫 인사: 오늘 메시지가 0일 때만
            int todayAll = chatDAO.countAllMessagesToday(convId);
            if (todayAll == 0) {
                String ask = """
                오늘의 첫 인사로 짧게 말을 걸어라.
                규칙:
                - 1~2문장, 가볍고 상냥하게.
                - 어제 대화와 자연스럽게 연결되는 말투.
                - 이모지는 최대 1개.
            """;
                String greeting = safeChat(sysPrompt, ask,
                        "좋은 하루야! 오늘은 어떻게 시작하고 있어?");
                saveCharacterLine(convId, userId, greeting);
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

    private String safeChat(String sys, String user, String fallback) {
        try {
            String r = llmClient.chat(sys, user);
            return (r == null || r.isBlank()) ? fallback : r;
        } catch (Exception e) {
            return fallback;
        }
    }

    private void saveCharacterLine(Integer convId, String userId, String content) {
        chatDAO.insertDialogue(DialogueVO.builder()
                .conversationId(convId)
                .sender(DialogueSender.character)
                .content(content)
                .createdBy(userId)
                .updatedBy(userId)
                .build());
    }

    private void cleanupDelayedIfClosed(Integer convId, String actor) {
        // 1) 지연 플래그 잠금 조회 (동시성 방지)
        Boolean delayed = conversationDAO.selectDelayLogCleanForUpdate(convId);
        if (delayed == null || !delayed) return; // 딜레이 아니면 종료

        // 2) 요약 시도
        boolean summarized = longMemoryService.summarizeAndSave(convId, actor);
        if (!summarized) {
            // 실패 시 보존: 플래그 유지 → 다음 입장/스케줄에 재시도
            return;
        }

        // 3) 대화 로그 삭제 + 플래그 해제 + 터치(업데이트 시각만)
        chatDAO.deleteDialoguesByConversationId(convId);
        conversationDAO.updateDelayLogClean(convId, false, actor);
        conversationDAO.touch(convId, actor);
    }
}
