package com.project.gmaking.debate.service;

import com.project.gmaking.character.dao.CharacterDAO;
import com.project.gmaking.character.vo.CharacterVO;
import com.project.gmaking.character.vo.CharacterPersonalityVO;
import com.project.gmaking.debate.ai.Judge;
import com.project.gmaking.debate.ai.OpenAiClient;
import com.project.gmaking.debate.vo.*;
import com.project.gmaking.quest.service.QuestService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DebateServiceImpl implements DebateService {

    private final CharacterDAO characterDAO;
    private final OpenAiClient openAi;
    private final List<Judge> judges; // GptJudge, GeminiJudge, o1-mini 자동 주입
    private final QuestService questService;

    @Override
    public CharacterVO getCharacter(Integer characterId) {
        return characterDAO.selectCharacterById(characterId);
    }

    @Override
    public CharacterPersonalityVO getPersonality(Integer personalityId) {
        return characterDAO.selectPersonalityById(personalityId);
    }

    @Override
    public String generateLine(String me, String myPersonality,
                               String opponent, String opponentLast,
                               String topic, boolean isFirstTurn) {

        String system = "너는 말싸움 참가자다. 캐릭터의 성격을 반영해 1~2문장만 말한다. 공격적·재치있는 응수 허용, 욕설 금지.";

        String user;
        if (isFirstTurn) {
            user = """
            주제: %s
            나: %s (성격: %s)
            상대: %s
            상황: 토론이 막 시작되었고, 너가 첫 발언자이다.
            지시: 주제에 대한 첫 주장 발언을 만들어라. 출력은 순수 대사만.
            (예: 한두 문장, 불필요한 설명 금지)
            """.formatted(topic, me, myPersonality, opponent);
        } else {
            user = """
            주제: %s
            나: %s (성격: %s)
            상대: %s
            상대의 직전 발언: %s
            지시: 내 캐릭터의 말투로 짧게 응수하라. 출력은 순수 대사만.
            (예: 한두 문장, 불필요한 설명 금지)
            """.formatted(topic, me, myPersonality, opponent, opponentLast);
        }

        String line = openAi.chat(system, user).trim();
        // 첫턴 빈문장 보정
        if (isFirstTurn && (line == null || line.isBlank())) {
            line = me + "이(가) 단호하게 첫 발언을 던진다: '내가 바로 이 주제의 승자다!'";
        } else if (line.isBlank()) {
            line = me + "이(가) 말을 아끼며 상대를 바라본다.";
        }
        if (line.length() > 200) line = line.substring(0, 200);
        return line.replaceAll("^\"|\"$", "");
    }

    @Override
    public Map<String, Object> judge(String topic, List<DebateLineVO> dialogue) {
        Map<String, String> votes = new LinkedHashMap<>();
        Map<String, String> comments = new LinkedHashMap<>();

        for (Judge j : judges) {
            JudgeResultVO result = j.judge(topic, dialogue);
            votes.put(j.name(), result.getWinner());
            comments.put(j.name(), result.getComment());
        }

        String winner = decideWinner(votes);

        Map<String, Object> resultMap = new LinkedHashMap<>();
        resultMap.put("votes", votes);
        resultMap.put("comments", comments);
        resultMap.put("winner", winner);
        return resultMap;
    }

    @SuppressWarnings("unchecked")
    @Override
    public DebateResultVO run(DebateRequestVO req) {
        CharacterVO a = characterDAO.selectCharacterById(req.getCharacterAId());
        CharacterVO b = characterDAO.selectCharacterById(req.getCharacterBId());

        CharacterPersonalityVO aP = characterDAO.selectPersonalityById(a.getCharacterPersonalityId());
        CharacterPersonalityVO bP = characterDAO.selectPersonalityById(b.getCharacterPersonalityId());

        String topic = (req.getTopic() == null || req.getTopic().isBlank())
                ? "누가 더 설득력 있는 영웅인가?"
                : req.getTopic();

        List<DebateLineVO> dialogue = new ArrayList<>(req.getTurnsPerSide() * 2);
        String lastLine = "";

        for (int turn = 1; turn <= req.getTurnsPerSide(); turn++) {
            // A 발언
            String aLine = generateLine(
                    a.getCharacterName(), aP.getPersonalityDescription(),
                    b.getCharacterName(), lastLine, topic, turn == 1
            );
            dialogue.add(new DebateLineVO(a.getCharacterName(), aLine));
            lastLine = aLine;

            // B 발언
            String bLine = generateLine(
                    b.getCharacterName(), bP.getPersonalityDescription(),
                    a.getCharacterName(), lastLine, topic, false
            );
            dialogue.add(new DebateLineVO(b.getCharacterName(), bLine));
            lastLine = bLine;
        }

        Map<String, Object> judged = judge(topic, dialogue);

        return DebateResultVO.builder()
                .topic(topic)
                .dialogue(dialogue)
                .judgeVotes((Map<String, String>) judged.get("votes"))
                .judgeComments((Map<String, String>) judged.get("comments"))
                .winner((String) judged.get("winner"))
                .build();
    }

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
