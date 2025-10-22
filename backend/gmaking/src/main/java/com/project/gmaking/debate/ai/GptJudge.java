package com.project.gmaking.debate.ai;

import com.project.gmaking.debate.vo.DebateLineVO;
import com.project.gmaking.debate.vo.JudgeResultVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class GptJudge implements Judge {

    private final OpenAiClient openAi;

    @Override
    public String name() {
        return "gpt-4o-mini";
    }

    @Override
    public JudgeResultVO judge(String topic, List<DebateLineVO> dialogue) {
        String sys = "너는 말싸움 심사위원이다. 논리, 개성, 표현력을 기준으로 반드시 한 명의 승자를 고르고, 그 이유를 한 문장으로 요약하라. 무승부 금지.";
        String conv = dialogue.stream()
                .map(d -> d.getSpeaker() + ": " + d.getLine())
                .collect(Collectors.joining("\n"));

        String user = """
                주제: %s
                대화:
                %s
                출력 형식(딱 이 JSON만):
                {"winner":"<캐릭터명>","comment":"<이유 한 문장>"}
                """.formatted(topic, conv);

        String out = openAi.chat(sys, user).trim();
        String winner = extract(out, "winner");
        String comment = extract(out, "comment");
        return new JudgeResultVO(winner, comment);
    }

    // JSON 파싱 보조 메서드
    private String extract(String text, String key) {
        try {
            int s = text.indexOf("\"" + key + "\"");
            int q1 = text.indexOf("\"", text.indexOf(":", s) + 1);
            int q2 = text.indexOf("\"", q1 + 1);
            return text.substring(q1 + 1, q2);
        } catch (Exception e) {
            return "";
        }
    }
}

