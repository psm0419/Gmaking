package com.project.gmaking.chat.service;

import com.project.gmaking.chat.dao.ChatDAO;
import com.project.gmaking.chat.dao.ConversationDAO;
import com.project.gmaking.chat.dao.ConversationSummaryDAO;
import com.project.gmaking.chat.llm.LlmClient;
import com.project.gmaking.chat.vo.DialogueVO;
import com.project.gmaking.chat.vo.ConversationSummaryVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationSummaryService {
    private final ChatDAO chatDAO;
    private final ConversationDAO conversationDAO;
    private final LlmClient llmClient;
    private final ConversationSummaryDAO conversationSummaryDAO;


    @Transactional
    public boolean summarizeAndSave(Integer convId, String actor) {
        // 메타 확인
        var conv = conversationDAO.selectById(convId); // 없으면 null
        if (conv == null) {
            log.warn("ConversationSummary: conversation not found. convId={}", convId);
            return false;
        }

        // 최근 N개만 (예: 100개) — 너무 길면 모델 품질/비용 저하
        List<DialogueVO> logs = chatDAO.selectRecentDialogues(convId, 100);
        if (logs == null || logs.isEmpty()) {
            log.info("ConversationSummary: no logs to summarize. convId={}", convId);
            return false;
        }

        // LLM 프롬프트
        String systemPrompt = """
            다음 대화 로그를 핵심 사실/설정/관계/약속/선호로 요약해.
            - 리스트로 핵심 포인트 정리
            - 중요한 숫자/날짜/닉네임 보존
            - 민감정보 생성 금지
            """;

        String textBlock = buildPlainText(logs);

        String summary;
        try {
            // LlmClient.chat(systemPrompt, userMessage) 시그니처에 맞춤
            summary = llmClient.chat(systemPrompt, textBlock);
        } catch (Exception e) {
            log.error("ConversationSummary: LLM summarize failed. convId={}", convId, e);
            return false;
        }

        if (summary == null || summary.isBlank()) {
            log.warn("ConversationSummary : empty summary. convId={}", convId);
            return false;
        }

        Integer lastTurnId = null;
        DialogueVO last = logs.get(logs.size() - 1);

        if (last != null) {
            try {
                lastTurnId = last.getMessageId();
            } catch (NoSuchMethodError | Exception ignore) {
                lastTurnId = last.getMessageId();
            }
        }

        // TB_Conversation_Summary는 summary만 저장 (memory_date/created_date는 DB default)
        ConversationSummaryVO vo = ConversationSummaryVO.builder()
                .conversationId(convId)
                .rollingSummary(summary)
                .lastTurnId(lastTurnId)
                .updatedBy(actor)
                .build();

        int inserted = conversationSummaryDAO.upsertRollingSummary(vo);
        if (inserted <= 0) { // 0만 실패로 보고, 1(INSERT)·2(UPDATE) 모두 성공
            log.error("ConversationSummary: insert failed. convId={}, rows={}", convId, inserted);
            return false;
        }
        return true;
    }


    private String buildPlainText(List<DialogueVO> logs) {
        StringBuilder sb = new StringBuilder(logs.size() * 32);
        for (DialogueVO d : logs) {
            // 필요하면 내용 길이 컷팅 (예: 2000자)
            String content = d.getContent();
            if (content != null && content.length() > 2000) {
                content = content.substring(0, 2000) + "...";
            }
            sb.append(d.getSender().name()).append(": ")
                    .append(content == null ? "" : content)
                    .append("\n");
        }
        return sb.toString();
    }
}
