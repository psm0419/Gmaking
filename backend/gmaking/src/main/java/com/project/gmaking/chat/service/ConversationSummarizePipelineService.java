package com.project.gmaking.chat.service;

import com.project.gmaking.chat.constant.DialogueSender;
import com.project.gmaking.chat.dao.ChatDAO;
import com.project.gmaking.chat.dao.ConversationDAO;
import com.project.gmaking.chat.dao.ConversationSummaryDAO;
import com.project.gmaking.chat.dao.LongMemoryDAO;
import com.project.gmaking.chat.llm.LlmClient;
import com.project.gmaking.chat.llm.SummarizeResult;
import com.project.gmaking.chat.vo.ConversationSummaryVO;
import com.project.gmaking.chat.vo.DialogueVO;
import com.project.gmaking.chat.vo.LongMemoryVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationSummarizePipelineService {

    // 최근 몇 턴까지 조회해 누적 길이를 계산할지
    private static final int PATCH_TURN_LIMIT = 24;

    // "마지막 요약 이후" 누적 길이 임계치(정규화 후 문자 수)
    private static final int DELTA_LEN_THRESHOLD = 180;

    // 저장 허용 카테고리
    private static final Set<String> CAT_WHITELIST =
            Set.of("FAVORITE", "DISLIKE", "SCHEDULE");

    // (옵션) 한 유저×캐릭터 최대 롱메모 수/초과 시 삭제 배치
    private static final int LM_CAP = 100;
    private static final int LM_EVICT_BATCH = 5;

    private final ChatDAO chatDAO;
    private final ConversationDAO conversationDAO;
    private final ConversationSummaryDAO conversationSummaryDAO;
    private final LongMemoryDAO longMemoryDAO;
    private final LlmClient llmClient;

    /**
     * 마지막 요약 이후 누적 길이 기준으로 요약/롱메모리 추출 수행.
     * forced=true면 임계치와 무관하게 수행.
     *
     * 트랜잭션은 새로 열어 실패가 바깥으로 전파되지 않도록 함.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW, noRollbackFor = Exception.class)
    public boolean maybeSummarizeAndExtract(Integer convId,
                                            Integer currentTurnId,
                                            String userId,
                                            Integer characterId,
                                            String actor,
                                            boolean forced) {
        try {
            var conv = conversationDAO.selectById(convId);
            if (conv == null) {
                log.warn("[SummaryPipeline] conversation not found convId={}", convId);
                return false;
            }

            // 기존 요약 조회(있으면 사용, 없으면 null)
            ConversationSummaryVO saved = conversationSummaryDAO.selectByConversationId(convId);

            // 1) 최근 턴 수집 (오래된 → 최신) 후 역전 방지용 정렬
            List<DialogueVO> recent = chatDAO.selectRecentDialogues(convId, PATCH_TURN_LIMIT);
            if (recent == null || recent.isEmpty()) {
                log.info("[SummaryPipeline] no recent dialogues convId={}", convId);
                return false;
            }
            // DAO가 최신→오래된 순서를 줄 수 있으므로 정렬을 보장
            recent.sort(Comparator.comparing(DialogueVO::getMessageId));

            // 마지막 요약 이후만 필터링
            int lastTurnIdSaved = (saved == null || saved.getLastTurnId() == null) ? 0 : saved.getLastTurnId();
            List<DialogueVO> deltaTurns = recent.stream()
                    .filter(d -> d.getMessageId() != null && d.getMessageId() > lastTurnIdSaved)
                    .collect(Collectors.toList());

            // 누적 길이(코드블록 제거 + 공백 압축 후 길이 합)
            int deltaCharsSinceLast = 0;
            for (var t : deltaTurns) {
                String c = (t.getContent() == null) ? "" : t.getContent();
                c = c.replaceAll("```[\\s\\S]*?```", "") // 코드블록 제거
                        .replaceAll("\\s+", " ")            // 공백 압축
                        .trim();
                deltaCharsSinceLast += c.length();
            }

            log.debug("[SummaryPipeline] conv={} deltaChars={} deltaTurns={} lastSavedTurn={}",
                    convId, deltaCharsSinceLast, deltaTurns.size(), lastTurnIdSaved);

            // 2) 트리거: (강제) OR (길이 임계치) OR (턴수 4 이상)
            boolean trigger = forced
                    || deltaCharsSinceLast >= DELTA_LEN_THRESHOLD
                    || deltaTurns.size() >= 4;

            if (!trigger) return false;

            if (deltaTurns.isEmpty()) {
                // 강제 실행인데도 delta가 없으면 할 게 없음
                log.debug("[SummaryPipeline] nothing new since last summary convId={}", convId);
                return false;
            }

            // 3) LLM 1회 호출 (deltaTurns만으로 패치 생성)
            String patch = buildPatch(deltaTurns); // U#/A# 형식 유지

            SummarizeResult result;
            try {
                String existing = (saved == null || saved.getRollingSummary() == null) ? "" : saved.getRollingSummary();
                result = llmClient.summarizeAndExtract(existing, patch, "ko");
            } catch (Exception e) {
                log.error("[SummaryPipeline] LLM failed convId={}", convId, e);
                return false;
            }

            // 4) 요약 저장 (빈 요약은 저장 금지)
            String updated = (result.getUpdatedSummary() == null) ? "" : result.getUpdatedSummary().trim();
            if (updated.isEmpty()) {
                log.warn("[SummaryPipeline] empty updated summary. skip save convId={}", convId);
                return false;
            }

            // 최신 turnId 계산 보강(명시 전달 > delta 최대값 > 저장된 값)
            Integer lastTurnId = (currentTurnId != null) ? currentTurnId
                    : deltaTurns.stream()
                    .map(DialogueVO::getMessageId)
                    .filter(Objects::nonNull)
                    .max(Integer::compareTo)
                    .orElse(lastTurnIdSaved);

            ConversationSummaryVO vo = new ConversationSummaryVO();
            vo.setConversationId(convId);
            vo.setRollingSummary(updated);
            vo.setLastTurnId(lastTurnId);
            vo.setUpdatedBy(actorOrPipeline(actor));

            // 성공시에만 upsert
            conversationSummaryDAO.upsertRollingSummary(vo);

            // 5) 장기 기억 저장(업서트) — 반드시 "사용자 발화" 근거만
            if (result.getMemories() != null && !result.getMemories().isEmpty()) {
                // delta 기준으로 sender 매핑 (근거 검증)
                Map<Integer, DialogueSender> idToSender = senderMap(deltaTurns);

                int cand = result.getMemories().size();
                int kept = 0, dropNoMeta = 0, dropNotUser = 0, dropCat = 0, dropLen = 0, dropConf = 0, dropRange = 0, dropOther = 0;

                for (var m : result.getMemories()) {
                    try {
                        if (m == null || Boolean.TRUE.equals(m.getPii())) { dropOther++; continue; }

                        String cat = m.getCategory()==null ? "" : m.getCategory().toUpperCase(Locale.ROOT);
                        if (!CAT_WHITELIST.contains(cat)) { dropCat++; continue; }

                        Integer srcMid = getSourceMid(m);
                        if (srcMid == null) { dropNoMeta++; continue; }

                        // sourceMid 범위 검증: lastSavedTurn < srcMid <= lastTurnId
                        if (!(srcMid > lastTurnIdSaved && srcMid <= lastTurnId)) { dropRange++; continue; }

                        if (idToSender.get(srcMid) != DialogueSender.USER) { dropNotUser++; continue; }

                        String subjectRaw  = safe(m.getSubject());
                        String subjectNorm = normalizeSubject(subjectRaw);
                        String value       = safe(m.getValue());
                        int maxLen = "SCHEDULE".equals(cat) ? 200 : 120;
                        if (subjectNorm.length()<1 || subjectNorm.length()>120 || value.length()<5 || value.length()>maxLen) { dropLen++; continue; }

                        double conf = m.getConfidence()==null ? 0.0 : m.getConfidence();
                        if (conf < 0.65) { dropConf++; continue; }

                        // --- 통과: upsert ---
                        value = truncate(value, 1000);
                        int strength = clampStrength(m.getStrengthSuggest(), m.getConfidence());
                        evictIfOverCapacity(userId, characterId, LM_CAP, LM_EVICT_BATCH);

                        LongMemoryVO mem = new LongMemoryVO();
                        mem.setUserId(userId);
                        mem.setCharacterId(characterId);
                        mem.setType(m.getType()); // 호환용
                        mem.setCategory(cat);
                        mem.setSubject(subjectRaw);
                        mem.setSubjectNorm(subjectNorm);
                        mem.setValue(value);
                        mem.setStrength(strength);
                        mem.setConfidence(conf);
                        mem.setSource("pipeline");
                        mem.setSourceConvId(convId);
                        mem.setUpdatedBy(actorOrPipeline(actor));

                        // meta에 sourceMid 남기기
                        String metaJson = toJsonString(mergeMetaWithSourceMid(m.getMeta(), srcMid));
                        mem.setMetaJson(metaJson);
                        if ("SCHEDULE".equals(cat)) {
                            mem.setDueAt(parseDueAt(m.getDueAt()));
                        }

                        longMemoryDAO.upsertSlot(mem);
                        kept++;
                        if (kept >= 4) break; // 한 번에 최대 4개만 저장
                    } catch (Exception ex) {
                        dropOther++;
                        log.debug("[LM] drop by exception: {}", ex.toString());
                    }
                }

                log.debug("[LM] mem candidates={} kept={} drop(noMeta={},notUser={},cat={},len={},conf={},range={},other={})",
                        cand, kept, dropNoMeta, dropNotUser, dropCat, dropLen, dropConf, dropRange, dropOther);
            }

            return true;
        } catch (Exception e) {
            // 어떤 예외도 바깥으로 던지지 않는다 → 메인 트랜잭션 보호
            log.warn("[SummaryPipeline] failed but isolated tx will rollback only this work", e);
            return false;
        }
    }

    /* ===================== 유틸들 ===================== */

    private String buildPatch(List<DialogueVO> turns) {
        StringBuilder sb = new StringBuilder();
        for (var t : turns) {
            if (t.getContent() == null || t.getContent().isBlank()) continue;

            String content = t.getContent()
                    .replaceAll("```[\\s\\S]*?```","[코드 생략]")
                    .replaceAll("\\s+"," ").trim();
            if (content.length() > 600) content = content.substring(0, 600) + "…";

            String roleTag = (t.getSender() == DialogueSender.USER) ? "U" : "A"; // U=user, A=assistant
            int mid = (t.getMessageId() == null ? -1 : t.getMessageId());

            // 예: U#123: 사탕을 좋아해
            sb.append(roleTag).append("#").append(mid).append(": ").append(content).append('\n');
        }
        return sb.toString();
    }

    // messageId → sender 매핑
    private Map<Integer, DialogueSender> senderMap(List<DialogueVO> turns) {
        Map<Integer, DialogueSender> m = new HashMap<>();
        for (var t : turns) {
            if (t.getMessageId() != null) m.put(t.getMessageId(), t.getSender());
        }
        return m;
    }

    // meta에서 sourceMid 뽑기
    private Integer getSourceMid(SummarizeResult.MemoryCandidate m) {
        try {
            Object meta = m.getMeta();
            if (meta instanceof Map<?,?> map) {
                Object v = map.get("sourceMid");
                if (v instanceof Number) return ((Number) v).intValue();
                if (v != null) return Integer.parseInt(v.toString());
            }
        } catch (Exception ignore) {}
        return null;
    }

    // meta + sourceMid 병합
    private Map<String,Object> mergeMetaWithSourceMid(Object meta, Integer sourceMid) {
        Map<String,Object> out = new HashMap<>();
        if (meta instanceof Map<?,?> m) {
            for (var e : m.entrySet()) {
                if (e.getKey() != null) out.put(String.valueOf(e.getKey()), e.getValue());
            }
        }
        if (sourceMid != null) out.put("sourceMid", sourceMid);
        return out;
    }

    // 주제 정규화
    private String normalizeSubject(String s) {
        if (s == null) return "";
        String t = s.toLowerCase(Locale.ROOT)
                .replaceAll("[^\\p{IsAlphabetic}\\p{IsDigit}\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        // 간단 동의어/후처리(예시)
        if (t.equals("bear")) t = "곰";
        if (t.endsWith(" 좋아")) t = t.substring(0, t.length() - 3);
        if (t.endsWith(" 좋아함")) t = t.substring(0, t.length() - 4);
        if (t.endsWith("이 좋아")) t = t.substring(0, t.length() - 3);
        return t;
    }

    private String actorOrPipeline(String actor) {
        return (actor == null || actor.isBlank()) ? "summary-pipeline" : actor;
    }

    private String safe(String v) { return v == null ? "" : v.trim(); }

    private String truncate(String v, int n) {
        return (v == null) ? null : (v.length() > n ? v.substring(0, n) : v);
    }

    private int clampStrength(Integer suggest, Double conf) {
        int base = (suggest != null && suggest >= 1 && suggest <= 5)
                ? suggest
                : (conf != null ? Math.max(1, Math.min(5, (int) Math.round(conf * 5))) : 3);
        return Math.max(1, Math.min(5, base));
    }

    private LocalDateTime parseDueAt(String iso) {
        if (iso == null || iso.isBlank()) return null;
        try {
            if (iso.length() == 10) { // YYYY-MM-DD
                return LocalDate.parse(iso).atStartOfDay();
            }
            return LocalDateTime.parse(iso); // ISO_LOCAL_DATE_TIME 기대
        } catch (Exception e) {
            log.debug("[SummaryPipeline] dueAt parse failed: {}", iso);
            return null;
        }
    }

    private String toJsonString(Object o) {
        if (o == null) return null;
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(o);
        } catch (Exception e) {
            log.debug("[SummaryPipeline] meta json serialize failed", e);
            return null;
        }
    }

    // (옵션) 용량 제어
    private void evictIfOverCapacity(String userId, Integer characterId, int max, int batchDelete) {
        try {
            int cnt = longMemoryDAO.countByUserAndCharacter(userId, characterId);
            if (cnt >= max) {
                longMemoryDAO.deleteWeakestOldest(userId, characterId, Math.max(1, batchDelete));
            }
        } catch (Exception ignore) {}
    }
}
