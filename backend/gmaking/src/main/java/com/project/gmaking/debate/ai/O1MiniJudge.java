package com.project.gmaking.debate.ai;

import com.project.gmaking.debate.vo.DebateLineVO;
import com.project.gmaking.debate.vo.JudgeResultVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class O1MiniJudge implements Judge {

    private final OpenAiClient openAi;

    // 기본값 o1-mini, 필요 시 properties에서 덮어쓸 수 있음
    @Value("${openai.reasoner.model:o1-mini}")
    private String model;

    @Override
    public String name() {
        return "gpt-o1-mini";
    }

    @Override
    public JudgeResultVO judge(String topic, List<DebateLineVO> dialogue) {
        // 대화 문자열 구성
        String conv = dialogue.stream()
                .map(d -> d.getSpeaker() + ": " + d.getLine())
                .collect(Collectors.joining("\n"));

        // o1-mini는 system prompt를 지원하지 않으므로 전체를 user prompt로 통합
        String prompt = """
                너는 말싸움 심사위원이다. 논리·개성·표현력을 기준으로 반드시 한 명의 승자를 고르고,
                그 이유를 한 문장으로 요약하라. 무승부 금지.

                주제: %s
                대화:
                %s
                출력(JSON만):
                {"winner":"<캐릭터명>","comment":"<이유 한 문장>"}
                """.formatted(topic, conv);

        try {
            // system 프롬프트는 비워두고 user 프롬프트만 전달
            String output = openAi.chat("", prompt).trim();

            String winner = extract(output, "winner");
            String comment = extract(output, "comment");

            if (winner.isBlank()) winner = "UNKNOWN";
            if (comment.isBlank()) comment = "형식 파싱 실패";

            return new JudgeResultVO(winner, comment);

        } catch (Exception e) {
            e.printStackTrace();
            return new JudgeResultVO("UNKNOWN", "o1-mini 호출 실패");
        }
    }

    // JSON 문자열 파싱 유틸 (GptJudge와 동일)
    private String extract(String text, String key) {
        try {
            int s = text.indexOf("\"" + key + "\"");
            if (s < 0) return "";
            int q1 = text.indexOf("\"", text.indexOf(":", s) + 1);
            int q2 = text.indexOf("\"", q1 + 1);
            if (q1 < 0 || q2 < 0) return "";
            return text.substring(q1 + 1, q2);
        } catch (Exception e) {
            return "";
        }
    }
}
