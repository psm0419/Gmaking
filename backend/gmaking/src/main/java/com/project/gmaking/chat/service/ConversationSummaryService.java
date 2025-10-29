package com.project.gmaking.chat.service;

import com.project.gmaking.chat.dao.ChatDAO;
import com.project.gmaking.chat.dao.ConversationDAO;
import com.project.gmaking.chat.dao.ConversationSummaryDAO;
import com.project.gmaking.chat.llm.LlmClient;
import com.project.gmaking.chat.vo.ConversationSummaryVO;
import com.project.gmaking.chat.vo.DialogueVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationSummaryService {

    private final ChatDAO chatDAO;
    private final ConversationDAO conversationDAO;
    private final LlmClient llmClient;
    private final ConversationSummaryDAO conversationSummaryDAO;

    /**
     * 현재 저장된 롤링 요약 텍스트를 반환.
     * - 저장 레코드가 없거나 비어있으면 null 반환(상위 레이어에서 '없음' 판단을 쉽게 하기 위함)
     */
    @Transactional(readOnly = true)
    public String getSummaryText(Integer convId) {
        try {
            ConversationSummaryVO vo = conversationSummaryDAO.selectByConversationId(convId);
            if (vo == null) return null;
            String s = vo.getRollingSummary();
            return (s == null || s.isBlank()) ? null : s;
        } catch (Exception e) {
            log.warn("[ConversationSummary] getSummaryText failed convId={}", convId, e);
            return null;
        }
    }

    /**
     * 최근 로그를 요약하여 upsert 저장(독립 트랜잭션).
     * - 대화 로그가 없으면 false
     * - 요약 실패/빈 요약이면 false (저장하지 않음)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW, noRollbackFor = Exception.class)
    public boolean summarizeAndSave(Integer convId, String actor) {
        var conv = conversationDAO.selectById(convId);
        if (conv == null) {
            log.warn("ConversationSummary: conversation not found. convId={}", convId);
            return false;
        }

        List<DialogueVO> logs = chatDAO.selectRecentDialogues(convId, 100);
        if (logs == null || logs.isEmpty()) {
            log.info("ConversationSummary: no logs to summarize. convId={}", convId);
            return false;
        }

        // 정렬 보장(오래된 → 최신)
        logs.sort(Comparator.comparing(DialogueVO::getMessageId));

        String systemPrompt = """
            다음 대화 로그를 핵심 사실/설정/관계/약속/선호로 요약해.
            - 리스트로 핵심 포인트 정리
            - 중요한 숫자/날짜/닉네임 보존
            - 민감정보 생성 금지
            """;

        String textBlock = buildPlainText(logs);

        String summary;
        try {
            summary = llmClient.chat(systemPrompt, textBlock);
        } catch (Exception e) {
            log.error("ConversationSummary: LLM summarize failed. convId={}", convId, e);
            return false;
        }

        if (summary == null || summary.isBlank()) {
            log.warn("ConversationSummary: empty summary. convId={}", convId);
            return false; // 빈/실패는 저장하지 않음
        }

        Integer lastTurnId = logs.get(logs.size() - 1).getMessageId();
        if (lastTurnId == null) lastTurnId = 0;

        ConversationSummaryVO vo = ConversationSummaryVO.builder()
                .conversationId(convId)
                .rollingSummary(summary.trim())
                .lastTurnId(lastTurnId)
                .updatedBy(actor)
                .build();

        int affected = conversationSummaryDAO.upsertRollingSummary(vo);
        if (affected <= 0) {
            log.error("ConversationSummary: upsert failed. convId={}, rows={}", convId, affected);
            return false;
        }
        return true;
    }

    private String buildPlainText(List<DialogueVO> logs) {
        StringBuilder sb = new StringBuilder(logs.size() * 32);
        for (DialogueVO d : logs) {
            String content = d.getContent();
            if (content != null && content.length() > 2000) {
                content = content.substring(0, 2000) + "...";
            }
            sb.append(d.getSender() == null ? "unknown" : d.getSender().name())
                    .append(": ")
                    .append(content == null ? "" : content)
                    .append("\n");
        }
        return sb.toString();
    }
}
