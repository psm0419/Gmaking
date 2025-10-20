package com.project.gmaking.debate.service;

import com.project.gmaking.character.dao.CharacterDAO;
import com.project.gmaking.character.vo.CharacterVO;
import com.project.gmaking.character.vo.CharacterPersonalityVO;
import com.project.gmaking.debate.ai.Judge;
import com.project.gmaking.debate.vo.JudgeResultVO;
import com.project.gmaking.debate.ai.OpenAiClient;
import com.project.gmaking.debate.vo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class DebateServiceImpl implements DebateService {

    private final CharacterDAO characterDAO;
    private final OpenAiClient openAi;
    private final List<Judge> judges; // GptJudge, GeminiJudge, GrokJudge 자동 주입됨

    @Override
    public DebateResultVO run(DebateRequestVO req) {

        // --- 1. 캐릭터 및 성격 불러오기 ---
        CharacterVO a = characterDAO.selectCharacterById(req.getCharacterAId());
        CharacterVO b = characterDAO.selectCharacterById(req.getCharacterBId());

        CharacterPersonalityVO aP = characterDAO.selectPersonalityById(a.getCharacterPersonalityId());
        CharacterPersonalityVO bP = characterDAO.selectPersonalityById(b.getCharacterPersonalityId());

        String topic = (req.getTopic() == null || req.getTopic().isBlank())
                ? "누가 더 설득력 있는 영웅인가?"
                : req.getTopic();

        List<DebateLineVO> dialogue = new ArrayList<>(req.getTurnsPerSide() * 2);
        String lastLine = "";

        // --- 2. 턴 기반 대화 생성 ---
        for (int turn = 1; turn <= req.getTurnsPerSide(); turn++) {
            // 캐릭터 A 발언
            String aLine = generateLine(
                    a.getCharacterName(),
                    aP.getPersonalityDescription(),
                    b.getCharacterName(),
                    lastLine,
                    topic
            );
            dialogue.add(new DebateLineVO(a.getCharacterName(), aLine));
            lastLine = aLine;

            // 캐릭터 B 발언
            String bLine = generateLine(
                    b.getCharacterName(),
                    bP.getPersonalityDescription(),
                    a.getCharacterName(),
                    lastLine,
                    topic
            );
            dialogue.add(new DebateLineVO(b.getCharacterName(), bLine));
            lastLine = bLine;
        }

        // --- 3. 심사 단계 ---
        Map<String, String> votes = new LinkedHashMap<>();
        Map<String, String> comments = new LinkedHashMap<>();

        for (Judge j : judges) {
            JudgeResultVO result = j.judge(topic, dialogue);
            votes.put(j.name(), result.getWinner());
            comments.put(j.name(), result.getComment());
        }

        String winner = decideWinner(votes);

        // --- 4. 결과 반환 ---
        return DebateResultVO.builder()
                .topic(topic)
                .dialogue(dialogue)
                .judgeVotes(votes)
                .judgeComments(comments)
                .winner(winner)
                .build();
    }

    // GPT로 한 캐릭터의 대사 생성
    private String generateLine(String me, String myPersonality,
                                String opponent, String opponentLast,
                                String topic) {

        String system = "너는 말싸움 참가자다. 캐릭터의 성격을 반영해 1~2문장만 말한다. 공격적·재치있는 응수 허용, 욕설 금지.";
        String user = """
                주제: %s
                나: %s (성격: %s)
                상대: %s
                상대의 직전 발언: %s
                지시: 내 캐릭터의 말투로 짧게 응수하라. 출력은 순수 대사만.
                (예: 한두 문장, 불필요한 설명 금지)
                """.formatted(topic, me, myPersonality, opponent,
                opponentLast == null || opponentLast.isBlank() ? "없음" : opponentLast);

        String line = openAi.chat(system, user).trim();
        if (line.length() > 200) line = line.substring(0, 200);
        return line.replaceAll("^\"|\"$", "");
    }

    // 과반 득표로 승자 결정
    private String decideWinner(Map<String, String> votes) {
        Map<String, Long> byCount = votes.values().stream()
                .filter(v -> v != null && !v.isBlank())
                .map(String::trim)
                .collect(java.util.stream.Collectors.groupingBy(v -> v, java.util.stream.Collectors.counting()));

        return byCount.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("UNKNOWN");
    }
}
