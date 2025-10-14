package com.project.gmaking.chat.service;

import com.project.gmaking.chat.constant.ConversationStatus;
import org.springframework.transaction.annotation.Propagation;
import com.project.gmaking.chat.dao.ChatDAO;
import com.project.gmaking.chat.dao.ConversationDAO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationCleanupService {

    private final ConversationDAO conversationDAO;
    private final ChatDAO chatDAO;
    private final ConversationSummaryService conversationSummaryService;


    /** 한 번 실행에 한 페이지만 처리 */
    @Transactional
    public int cleanClosedConversationsBatch(int batchSize) {
        List<Integer> ids = conversationDAO.findConversationIdsByStatusPaged(ConversationStatus.CLOSED, batchSize);
        if (ids == null || ids.isEmpty()) {
            log.info("[Cleaner] no CLOSED conversations to clean.");
            return 0;
        }

        int total = 0;
        for (Integer convId : ids) {
            try {
                if (cleanOneConversation(convId)) {
                    total++;
                }
            } catch (Exception e) {
                log.error("[Cleaner] error convId={}", convId, e);
            }
        }

        log.info("[Cleaner] closed cleaned={}", total);
        return total;
    }

    /** 각 대화방은 독립 트랜잭션으로 처리 (부분 실패 허용) */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean cleanOneConversation(Integer convId) {
        // 대화가 없으면 바로 ARCHIVED
        int remain = chatDAO.countByConversationId(convId);
        if (remain <= 0) {
            conversationDAO.updateStatus(convId, ConversationStatus.ARCHIVED, "system@cleaner");
            log.info("[Cleaner] no dialogues, archived convId={}", convId);
            return true;
        }

        // 요약 시도
        boolean summarized = conversationSummaryService.summarizeAndSave(convId, "system@cleaner");
        if (!summarized) {
            // 다음 회차에 재시도 (updated_date만 갱신)
            conversationDAO.touch(convId, "system@cleaner");
            log.warn("[Cleaner] summarize failed. keep CLOSED. convId={}", convId);
            return false;
        }

        // 로그 삭제 후 ARCHIVED 전환
        chatDAO.deleteDialoguesByConversationId(convId);
        conversationDAO.updateStatus(convId, ConversationStatus.ARCHIVED, "system@cleaner");
        log.info("[Cleaner] archived convId={}", convId);
        return true;
    }

    @Transactional
    public int markOpenForDelay() {
        int updated = conversationDAO.markDelayLogCleanForOpen();
        log.info("[Cleaner] open marked delay_log_clean=1 -> {}", updated);
        return updated;
    }
}
