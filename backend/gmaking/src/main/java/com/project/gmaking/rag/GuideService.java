// src/main/java/com/project/gmaking/rag/GuideService.java
package com.project.gmaking.rag;

import dev.langchain4j.model.chat.ChatLanguageModel;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

import static com.project.gmaking.rag.GuideDtos.*;

@Service
public class GuideService {

    private final ChatLanguageModel chat;
    private final MysqlRetriever retriever;
    private final RagProperties props;

    public GuideService(ChatLanguageModel chat, MysqlRetriever retriever, RagProperties props) {
        this.chat = chat;
        this.retriever = retriever;
        this.props = props;
    }

    public AskResponse ask(String question) {
        if (question == null || question.isBlank()) {
            return new AskResponse("질문을 입력해 주세요.");
        }
        question = question.trim();

        var top = retriever.topK(question, props.getTopK());

        // 컨텍스트 구성
        String context = top.stream()
                .map(c -> "- [src: " + c.docPath() + " | score: " + String.format("%.3f", c.score()) + "]\n"
                        + c.text() + "\n")
                .collect(Collectors.joining("\n"));

        String system = """
          너는 '겜만중'의 사용자 안내 도우미야.
          - 톤: 친근하고 공손하게, 너무 딱딱하지 않게. (필요하면 이모지 1개까지 OK)
          - 길이: 핵심만 5~8줄 이내. 꼭 필요한 경우에만 간단한 목록 사용.
          - 절차/방법은 단계별로 짧게.
          - 링크/경로는 자연스럽게 본문 안에 녹여서 언급.
          - 절대 '참고:'나 출처 목록은 붙이지 마.
           - 모르면 추측 금지. 대신 사용자가 시도해볼 메뉴/페이지를 제안.
          """;

        String prompt = """
            [컨텍스트]
            %s

            [질문]
            %s

            위 컨텍스트를 바탕으로 간결하고 정확하게 한국어로 답하세요.
            """.formatted(context, question);

        String answer = chat.generate(system + "\n\n" + prompt);

        // 출처 목록 (front-matter 메타 포함)
        List<Source> sources = top.stream()
                .map(c -> new Source(
                        c.docPath(),
                        c.chunkIndex(),
                        c.score(),
                        MysqlRetriever.preview(c.text()),
                        c.guideKey(),
                        c.docUrl(),
                        c.appUrl()
                ))
                .toList();

        // '참고:' 꼬리표 붙이지 않고 그대로 반환
        return new AskResponse(answer, sources);
    }
}
