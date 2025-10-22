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
    private final CallingNameExtractor callingNameExtractor;
    private final ConversationSummaryService conversationSummaryService;
    private final ConversationSummarizePipelineService pipeline;


    @Override
    @Transactional
    public String send(String userId, Integer characterId, String message) {

        // 대화방 확보
        Integer convId = chatDAO.findLatestConversationId(userId, characterId);
        if (convId == null) {
            chatDAO.createConversation(userId, characterId, userId);
            convId = chatDAO.findLatestConversationId(userId, characterId);
        }

        // 자정 지연 삭제 플래그 처리
        cleanupIfDelayed(convId, userId);

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

        try {
            try {
                pipeline.maybeSummarizeAndExtract(convId, null, userId, characterId, "threshold", false);
            } catch (Exception e) {
                log.warn("[SummaryPipeline] runtime force failed convId={} user={} charId={}", convId, userId, characterId, e);
            }
        } catch (Exception e) {
            log.warn("[SummaryPipeline] runtime force failed convId={} user={} charId={}", convId, userId, characterId, e);
        }

        // 첫만남 플래그 해제
        ConversationVO conv = conversationDAO.selectConversationByUserAndCharacter(userId, characterId);
        if (conv != null && Boolean.TRUE.equals(conv.getIsFirstMeet())) {
            conversationDAO.updateFirstMeetFlag(conv.getConversationId(), false, userId);
        }

        // 호칭 추출 + DB 반영 (같은 요청에 즉시 반영)
        String currentCalling = conversationDAO.selectCallingName(convId);
        String newCalling = callingNameExtractor.extract(message, currentCalling);

        if (newCalling != null
                && !newCalling.isBlank()
                && !"빈 응답입니다.".equalsIgnoreCase(newCalling)
                && !"no response".equalsIgnoreCase(newCalling)) { // 혹시 영문 대응도
            conversationDAO.updateCallingName(convId, newCalling, userId);
            currentCalling = newCalling;
        }

        // 시스템 프롬프트에 호칭 주입
        String systemPrompt = buildSystemPrompt(
                persona != null ? persona.getInstructionPrompt() : null,
                currentCalling
        );

        // LLM 컨트렉트용 히스토리 구성
        List<DialogueVO> recent = chatDAO.selectRecentDialogues(convId, 20); // 최신→오래된
        java.util.Collections.reverse(recent); // 오래된→최신으로 정렬

        if (!recent.isEmpty()) {
            DialogueVO last = recent.get(recent.size() - 1);
            if (last.getSender() == DialogueSender.user && message.equals(last.getContent())) {
                // 이번 턴의 유저 발화(방금 insert 한 것)는 컨텍스트에서 제외
                recent.remove(recent.size() - 1);
            }
        }

        // 5) LLM 호출
        String reply;
        try {
            reply = llmClient.chatWithHistory(systemPrompt, recent, message);
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

    private void cleanupIfDelayed(Integer convId, String actor) {
        // 동시성 방지 위해 FOR UPDATE로 읽는 DAO 쿼리 권장
        Boolean delayed = conversationDAO.selectDelayLogCleanForUpdate(convId);
        if (Boolean.TRUE.equals(delayed)) {
            boolean summarized = conversationSummaryService.summarizeAndSave(convId, actor);
            if (!summarized) {
                // 요약 실패 시 삭제하지 않음 (데이터 보존)
                return;
            }
            chatDAO.deleteDialoguesByConversationId(convId);
            conversationDAO.updateDelayLogClean(convId, false, actor);
        }
    }


}
