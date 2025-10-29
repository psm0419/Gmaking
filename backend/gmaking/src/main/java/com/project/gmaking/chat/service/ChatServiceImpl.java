package com.project.gmaking.chat.service;

import com.project.gmaking.chat.constant.DialogueSender;
import com.project.gmaking.chat.dao.ChatDAO;
import com.project.gmaking.chat.dao.PersonaDAO;
import com.project.gmaking.chat.dao.ConversationDAO;
import com.project.gmaking.chat.dao.LongMemoryDAO;
import com.project.gmaking.chat.llm.LlmClient;
import com.project.gmaking.chat.llm.GeminiClientSdkImpl;
import com.project.gmaking.chat.nlp.CallingNameExtractor;
import com.project.gmaking.chat.vo.ConversationVO;
import com.project.gmaking.chat.vo.DialogueVO;
import com.project.gmaking.chat.vo.LongMemoryVO;
import com.project.gmaking.chat.vo.PersonaVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
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
    private final LongMemoryDAO longMemoryDAO;
    private final CallingNameExtractor callingNameExtractor;
    private final ConversationSummaryService conversationSummaryService;
    private final ConversationSummarizePipelineService pipeline;

    @Override
    @Transactional
    public String send(String userId, Integer characterId, String message) {

        // 1) 대화방 확보
        Integer convId = chatDAO.findLatestConversationId(userId, characterId);
        if (convId == null) {
            chatDAO.createConversation(userId, characterId, userId);
            convId = chatDAO.findLatestConversationId(userId, characterId);
        }

        // 2) 자정 지연 삭제 플래그 처리(요약 성공 시 로그 클린)
        cleanupIfDelayed(convId, userId);

        // 3) 페르소나 확보
        PersonaVO persona = personaDAO.selectPersonaByCharacterId(characterId);
        if (persona == null) {
            persona = personaService.ensurePersona(characterId, userId);
        }

        // 4) 유저 발화 저장
        chatDAO.insertDialogue(DialogueVO.builder()
                .conversationId(convId)
                .sender(DialogueSender.USER)
                .content(message)
                .createdBy(userId)
                .updatedBy(userId)
                .build());

        // 5) 롤링 요약/장기기억 파이프라인 (비차단/베스트에포트)
        try {
            try {
                pipeline.maybeSummarizeAndExtract(convId, null, userId, characterId, "threshold", false);
            } catch (Exception e) {
                log.warn("[SummaryPipeline] runtime force failed convId={} user={} charId={}", convId, userId, characterId, e);
            }
        } catch (Exception e) {
            log.warn("[SummaryPipeline] runtime force failed convId={} user={} charId={}", convId, userId, characterId, e);
        }

        // 6) 첫만남 플래그 해제
        ConversationVO conv = conversationDAO.selectConversationByUserAndCharacter(userId, characterId);
        if (conv != null && Boolean.TRUE.equals(conv.getIsFirstMeet())) {
            conversationDAO.updateFirstMeetFlag(conv.getConversationId(), false, userId);
        }

        // 7) 호칭 추출 + DB 반영 (같은 요청에 즉시 반영)
        String currentCalling = conversationDAO.selectCallingName(convId);
        String newCalling = callingNameExtractor.extract(message, currentCalling);
        if (newCalling != null
                && !newCalling.isBlank()
                && !"빈 응답입니다.".equalsIgnoreCase(newCalling)
                && !"no response".equalsIgnoreCase(newCalling)) {
            conversationDAO.updateCallingName(convId, newCalling, userId);
            currentCalling = newCalling;
        }

        // 8) 시스템 프롬프트에 호칭 주입
        String systemPrompt = buildSystemPrompt(
                persona != null ? persona.getInstructionPrompt() : null,
                currentCalling
        );

        // 9) LLM 컨텍스트용 히스토리 구성 (오래된→최신)
        List<DialogueVO> recent = chatDAO.selectRecentDialogues(convId, 20); // 최신→오래된
        Collections.reverse(recent); // 오래된→최신으로 정렬
        if (!recent.isEmpty()) {
            DialogueVO last = recent.get(recent.size() - 1);
            if (last.getSender() == DialogueSender.USER && message.equals(last.getContent())) {
                // 이번 턴의 유저 발화(방금 insert 한 것)는 컨텍스트에서 제외
                recent.remove(recent.size() - 1);
            }
        }

        // 10) LLM 호출 직전에 메모리 조회
        String summaryText = fetchConversationSummarySafe(convId);
        List<GeminiClientSdkImpl.MemoryItem> memories = fetchTopMemoriesSafe(userId, characterId);

        // ▶ 공통 주입용 텍스트 생성 (Gemini 미사용/폴백 대비)
        String memoryPrefix = buildMemoryContext(summaryText, memories);

        // ▶ 시스템 프롬프트에 메모리 프리픽스를 병합 (중복 방지)
        String systemPromptWithMemory = (memoryPrefix.isBlank())
                ? systemPrompt
                : systemPrompt + "\n\n" + memoryPrefix;

        // 11) LLM 호출 (요약/장기기억 주입 가능 시 사용, 아니면 폴백)
        String reply;
        try {
            if (llmClient instanceof GeminiClientSdkImpl gem) {
                // Gemini는 네이티브 메서드 사용
                reply = gem.chatWithMemory(
                        systemPrompt,
                        summaryText,
                        memories,
                        recent,
                        message
                );
            } else {
                // 폴백 모델은 systemPrompt에 메모리 프리픽스를 합쳐서 전달
                reply = llmClient.chatWithHistory(systemPromptWithMemory, recent, message);
            }
            if (reply == null || reply.isBlank()) reply = "빈 응답입니다.";
        } catch (Exception e) {
            log.error("Gemini error userId={}, characterId={}", userId, characterId, e);
            reply = "AI 응답 생성 중 오류가 발생했습니다.";
        }

        // 11) 캐릭터 발화 저장
        chatDAO.insertDialogue(DialogueVO.builder()
                .conversationId(convId)
                .sender(DialogueSender.CHARACTER)
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

    // ===========================
    // 요약/메모리 조회 헬퍼
    // ===========================

    /** 대화 롤링 요약 텍스트를 안전하게 가져옴. 없으면 null */
    private String fetchConversationSummarySafe(Integer convId) {
        try {
            return conversationSummaryService.getSummaryText(convId);
        } catch (Exception e) {
            log.warn("[Chat] fetchConversationSummarySafe failed convId={}", convId, e);
            return null;
        }
    }

    /**
     * 상위 N개 장기기억을 안전하게 가져와 Gemini 주입용 DTO로 변환. 없으면 빈 리스트.
     * LongMemoryDAO.selectListByUserAndCharacter(userId, characterId, limit)를 사용.
     * (정렬/필터는 Mapper에서: 최근 사용순/유효건 위주로 구현되어 있다고 가정)
     */
    private List<GeminiClientSdkImpl.MemoryItem> fetchTopMemoriesSafe(String userId, Integer characterId) {
        try {
            int limit = 12; // 넉넉히 읽고 아래서 필터 + 상위 6개만 사용
            List<LongMemoryVO> raw = longMemoryDAO.selectListByUserAndCharacter(userId, characterId, limit);
            if (raw == null || raw.isEmpty()) return Collections.emptyList();

            var now = java.time.LocalDateTime.now();
            List<GeminiClientSdkImpl.MemoryItem> out = new ArrayList<>();
            for (LongMemoryVO m : raw) {
                // 1) confidence 필터 (0.65 이상)
                if (m.getConfidence()!=null && m.getConfidence() < 0.65) continue;
                // 2) 만료 스케줄 제외
                if (m.getDueAt()!=null && m.getDueAt().isBefore(now)) continue;
                // 3) 카테고리 화이트리스트 (원하면 추가)
                String cat = (m.getCategory()==null? "": m.getCategory().toUpperCase());
                if (!cat.equals("FAVORITE") && !cat.equals("DISLIKE") && !cat.equals("SCHEDULE")) continue;

                out.add(GeminiClientSdkImpl.MemoryItem.builder()
                        .category(nz(m.getCategory()))
                        .subject(nz(m.getSubject()))
                        .value(nz(m.getValue()))
                        .dueAt(m.getDueAt()==null ? null : m.getDueAt().toString())
                        .build());

                if (out.size() >= 6) break; // 최종 주입 수 제한
            }
            return out;
        } catch (Exception e) {
            log.warn("[Chat] fetchTopMemoriesSafe failed userId={} charId={}", userId, characterId, e);
            return Collections.emptyList();
        }
    }

    private String buildMemoryContext(String summary, List<GeminiClientSdkImpl.MemoryItem> mems) {
        StringBuilder sb = new StringBuilder();
        if (summary != null && !summary.isBlank()) {
            sb.append("[MEMORY CONTEXT]\n");
            sb.append("## CONVERSATION_SUMMARY\n").append(cut(summary, 1200)).append("\n\n");
        }
        if (mems != null && !mems.isEmpty()) {
            if (sb.indexOf("[MEMORY CONTEXT]") < 0) sb.append("[MEMORY CONTEXT]\n");
            sb.append("## LONG_TERM_MEMORIES (user-authored only)\n");
            int n = Math.min(6, mems.size());
            for (int i=0;i<n;i++) {
                var m = mems.get(i);
                if (m == null) continue;
                sb.append("- [").append(nz(m.category())).append("] ")
                        .append(nz(m.subject())).append(" : ")
                        .append(cut(nz(m.value()), 180));
                if (m.dueAt()!=null && !m.dueAt().isBlank()) {
                    sb.append(" (due: ").append(m.dueAt()).append(")");
                }
                sb.append("\n");
            }
            sb.append("\n사용자 선호/일정은 참고용이며, **사실로 단정하지 말고** 맥락에 맞게만 활용하세요.\n");
        }
        return sb.toString().trim();
    }

    private String nz(String s){ return s==null? "": s; }
    private String cut(String s, int n){ return (s==null)? "" : (s.length()>n? s.substring(0,n)+"…" : s); }

    private String ns(String s) { return s == null ? "" : s; }


}
