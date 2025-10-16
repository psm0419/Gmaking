package com.project.gmaking.pve.service;

import java.net.http.*;
import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OpenAIService {

    private static final String API_URL = "https://api.openai.com/v1/chat/completions";
    private static final String MODEL = "gpt-4o-mini";
    private static final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient client = HttpClient.newHttpClient();

    // GPT 해설 스타일 정의
    private static final Map<String, String> STYLE_PROMPTS = Map.of(
            "COMIC", "한 턴 전투에 대한 **코믹하고 유머러스한** note를 생성하세요. 코믹함을 최우선으로 하되, 턴 결과에 기반하세요.",
            "FANTASY", "한 턴 전투에 대한 **웅장하고 서사적인 판타지 소설풍**의 note를 생성하세요. 캐릭터의 위엄과 전투의 중요성을 강조하세요.",
            "WUXIA", "한 턴 전투에 대한 **무협지(武俠誌) 스타일**의 note를 생성하세요. 기(氣), 초식(招式), 강호(江湖)의 분위기를 담아내세요."
    );

    // 스타일별 추가 규칙
    private static final Map<String, String> ADDITIONAL_RULES = Map.of(
            "COMIC",
            "4. note는 최대한 일상적이거나 유치한 대사, 엉뚱한 비유를 사용하여 코믹하게 작성하세요.",
            "FANTASY",
            "4. note는 캐릭터의 위엄, 전투의 서사, 마법적인 요소를 강조하며 웅장한 분위기로 작성하세요.",
            "WUXIA",
            "4. 공격자는 **매 턴마다** **새롭고 독창적인 무협 초식명**을 만들어내어 묘사에 **반드시** 사용해야 합니다."
    );

    // 모든 스타일에 공통 적용되는 기본 규칙
    private static final String BASE_RULES = """
    <필수 명령>
    1. 절대 데미지 수치 언급 금지.
    2. 반드시 JSON 형식으로 {"note":"..."}만 반환하고, 코드 블록이나 서문 사용 금지.
    """;
    // PVE 프롬프트 생성 함수 추가
    public String createPveNotePrompt(String styleKey, Map<String, Object> turnData, boolean isBattleOver) {
        String stylePromptHeader = STYLE_PROMPTS.getOrDefault(styleKey, STYLE_PROMPTS.get("COMIC"));
        String additionalRules = ADDITIONAL_RULES.getOrDefault(styleKey, "");

        // 전투 종료 여부 판단 로직
        String terminationRule = isBattleOver ?
                "5. 전투 종료 여부(IS_OVER)가 'true'이므로, 묘사를 마무리하고 **'승리!', '패배!', 또는 '전투 종료'**를 명확히 포함하세요." :
                "5. 전투 종료 여부(IS_OVER)가 'false'이므로, '다음 턴이 기대된다'는 뉘앙스로 마무리하세요.";

        return String.format("""
            %s
            아래 <규칙>을 **무조건 준수**하여 <턴 정보>에 기반한 로그를 생성하세요.

            %s
            %s
            %s
            
            <턴 정보>
            공격자: %s
            방어자: %s
            데미지: %d
            크리티컬: %s
            전투 종료 여부 (IS_OVER): %b
            """,
                stylePromptHeader,
                BASE_RULES,
                additionalRules,
                terminationRule,

                // 턴 정보 데이터
                turnData.get("actor"),
                turnData.get("target"),
                turnData.get("damage"),
                turnData.get("critical"),
                isBattleOver
        );
    }

    /**
     * PVE 비동기 note 생성 (damage, critical 반영)
     */
    public CompletableFuture<String> requestGPTNote(Map<String, Object> turnData, String styleKey, boolean isBattleOver) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String apiKey = System.getenv("OPENAI_API_KEY");
                if (apiKey == null) throw new IllegalStateException("OPENAI_API_KEY 없음");
                String prompt = createPveNotePrompt(styleKey, turnData, isBattleOver);

                Map<String, Object> body = Map.of(
                        "model", MODEL,
                        "messages", List.of(
                                // system 역할 메시지 변경: 스타일을 동적으로 적용하므로 일반적인 해설자 역할로 유지
                                Map.of("role", "system", "content", "You are a combat narrator who bases your commentary on the exact turn results (damage, critical, actor/target) following the user's stylistic instructions."),
                                Map.of("role", "user", "content", prompt)
                        ),
                        "temperature", 0.4
                );

                String json = mapper.writeValueAsString(body);

                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(API_URL))
                        .timeout(Duration.ofSeconds(30))
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Bearer " + apiKey)
                        .POST(HttpRequest.BodyPublishers.ofString(json))
                        .build();

                HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());

                // **응답 로그 출력**
                System.out.println("[GPT 원본 응답] " + res.body());

                if (res.statusCode() != 200) {
                    System.err.println("[GPT 호출 실패] HTTP 상태: " + res.statusCode());
                    return "{\"note\":\"[GPT 호출 실패: HTTP 오류]\"}";
                }

                var node = mapper.readTree(res.body());
                String content = node.path("choices").get(0).path("message").path("content").asText();

                // **파싱 전 note 내용 확인**
                System.out.println("[GPT 파싱 전 note] " + content);

                return content;

            } catch (Exception e) {
                System.err.println("[GPT 호출 실패] 이유: " + e.getMessage());
                e.printStackTrace();
                return "{\"note\":\"[GPT 호출 실패: " + e.getClass().getSimpleName() + "]\"}";
            }
        });
    }

    /**
     * 비동기 PVP 턴 결과 요약 생성 (커맨드, 피해 반영)
     */
    public CompletableFuture<String> requestGPTPvpNote(Map<String, Object> turnData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String apiKey = System.getenv("OPENAI_API_KEY");
                if (apiKey == null) throw new IllegalStateException("OPENAI_API_KEY 없음");

                // PVP 상황에 맞게 프롬프트와 입력 데이터를 수정합니다.
                String prompt = String.format("""
                        한 턴 PVP 전투에 대한 무협지스러운 note를 생성하세요.
                        당신은 이 전투의 해설자입니다. 아래 <규칙>, <턴 정보>를 **절대적으로 따라** 로그를 생성해야 합니다.
                        
                        <규칙>
                        - **행동 기반 묘사**: 플레이어 행동(%s)과 상대방 행동(%s)을 **반드시 그대로 묘사에 포함**하여 상호작용을 설명하세요. (예: '루루는 필살기를 시전하며', '가나는 방어 자세를 취했다')
                        - **승패 결정**: 피해량 (0 또는 낮은 값 vs 높은 값)과 남은 HP를 기준으로 판단합니다.
                        - **피해 수치**: 절대 언급 금지. ('치명적인 일격', '찰과상', '무위로 돌아감' 등으로 대체)
                        
                        <턴 정보>
                        플레이어: %s (행동: %s)
                        상대방: %s (행동: %s)
                        플레이어 (턴 종료 후 남은) HP: %d
                        상대방 (턴 종료 후 남은) HP: %d
                        플레이어가 입은 피해: %d
                        상대방이 입은 피해: %d
                        
                        <지시사항>
                        1. **가장 중요**: 플레이어의 행동(%s)과 상대방의 행동(%s)을 묘사에 **필수적으로 포함**하세요.
                        2. 피해 수치와 HP 수치는 언급 금지.
                        3. 플레이어나 상대방 중 누군가의 HP가 **0 이하**라면, 맨 마지막에 **반드시 '전투 종료'와 승패를 언급**하세요. HP가 남아있다면 **'전투는 계속된다'**는 뉘앙스로 마무리하세요.
                        4. note는 글자 수 150자 이내로 작성
                        5. JSON 형식으로 {"note":"..."}만 반환
                        """,
                        turnData.get("playerCommand"), // 1. 규칙 내의 행동 기반 묘사에 사용
                        turnData.get("enemyCommand"),  // 2. 규칙 내의 행동 기반 묘사에 사용
                        turnData.get("player"),
                        turnData.get("playerCommand"),
                        turnData.get("enemy"),
                        turnData.get("enemyCommand"),
                        turnData.get("playerHp"),
                        turnData.get("enemyHp"),
                        turnData.get("playerDamage"),
                        turnData.get("enemyDamage"),
                        turnData.get("playerCommand"), // 3. 지시사항 1에 사용
                        turnData.get("enemyCommand")   // 4. 지시사항 1에 사용
                );

                Map<String, Object> body = Map.of(
                        "model", MODEL,
                        "messages", List.of(
                                Map.of("role", "system", "content", "You are a PVP combat narrator who focuses on action and command interaction."),
                                Map.of("role", "user", "content", prompt)
                        ),
                        "temperature", 0.4
                );

                String json = mapper.writeValueAsString(body);

                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(API_URL))
                        .timeout(Duration.ofSeconds(30))
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Bearer " + apiKey)
                        .POST(HttpRequest.BodyPublishers.ofString(json))
                        .build();

                HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());

                // **응답 로그 출력**
                System.out.println("[GPT 원본 응답] " + res.body());

                if (res.statusCode() != 200) {
                    System.err.println("[GPT 호출 실패] HTTP 상태: " + res.statusCode());
                    return "{\"note\":\"[GPT 호출 실패: HTTP 오류]\"}";
                }

                var node = mapper.readTree(res.body());
                String content = node.path("choices").get(0).path("message").path("content").asText();

                // **파싱 전 note 내용 확인**
                System.out.println("[GPT 파싱 전 note] " + content);

                return content;

            } catch (Exception e) {
                System.err.println("[GPT 호출 실패] 이유: " + e.getMessage());
                e.printStackTrace();
                return "{\"note\":\"[GPT 호출 실패: " + e.getClass().getSimpleName() + "]\"}";
            }
        });
    }
}
