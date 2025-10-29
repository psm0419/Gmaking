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
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatEnterService {

    private final ChatDAO chatDAO;
    private final PersonaDAO personaDAO;
    private final PersonaService personaService;
    private final ConversationDAO conversationDAO;
    private final LlmClient llmClient;
    private final ConversationSummaryService conversationSummaryService;

    @Transactional
    public EnterResponseVO enterChat(String userId, Integer characterId) {

        Integer convId = chatDAO.findLatestConversationId(userId, characterId);
        if (convId == null) {
            chatDAO.createConversation(userId, characterId, userId);
            convId = chatDAO.findLatestConversationId(userId, characterId);
        }

        int rows = conversationDAO.updateStatus(convId, ConversationStatus.OPEN, userId);
        log.info("[ENTER] set OPEN convId={} rows={}", convId, rows);

        // 입장시 지연청소
        cleanupDelayedIfClosed(convId, userId);

        var convNow = conversationDAO.selectById(convId);
        if (convNow != null && convNow.getStatus() != ConversationStatus.OPEN) {
            conversationDAO.updateStatus(convId, ConversationStatus.OPEN, userId);
        }

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

        // 재인사 방지 가드
        int userCnt = chatDAO.countUserMessages(convId);
        int charCnt = chatDAO.countCharacterMessages(convId);


        if (isFirstMeet) {
            if (userCnt > 0) {
                // 유저가 이미 말했으면 더 이상 첫만남 아님
                conversationDAO.updateFirstMeetFlag(convId, false, userId);
                isFirstMeet = false;
            } else if (charCnt == 0) {
                // 완전 빈 대화일 때만 '첫만남 인사' 1회 생성
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
                // 첫 메시지는 send()에서 is_first_meet=false 로 내림 (기존 로직 유지)
            }
            // charCnt > 0 인 경우 이미 인사를 남긴 상태 → 아무 것도 하지 않음
        }

        // 이미 만난 사이 → 오늘 첫 인사 (오늘 총 메시지 0일 때만)
        if (!isFirstMeet) {
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
                .conversationId(convId)
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
                .sender(DialogueSender.CHARACTER)
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
        boolean summarized = conversationSummaryService.summarizeAndSave(convId, actor);
        if (!summarized) {
            // 실패 시 보존: 플래그 유지 → 다음 입장/스케줄에 재시도
            return;
        }

        // 3) 대화 로그 삭제 + 플래그 해제 + 터치(업데이트 시각만)
        chatDAO.deleteDialoguesByConversationId(convId);
        conversationDAO.updateDelayLogClean(convId, false, actor);
        conversationDAO.touch(convId, actor);
    }

    @Transactional
    public void exitChat(String userId, Integer characterId) {
        // 1) 최신 OPEN 찾기
        Integer convId = conversationDAO.findLatestOpenConversationId(userId, characterId);
        log.info("[EXIT] open convId={}", convId);
        if (convId == null) return;

        // 2) 닫기
        int updated = conversationDAO.closeConversation(convId, userId);
        log.info("[EXIT] closed rows={}", updated);

    }
}
