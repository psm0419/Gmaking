package com.project.gmaking.debate.ai;

import com.project.gmaking.debate.vo.DebateLineVO;
import com.project.gmaking.debate.vo.JudgeResultVO;

import java.util.List;

public interface Judge {
    String name();
    // winner 캐릭터명 리턴 (무승부 금지 프롬프트)
    JudgeResultVO judge(String topic, List<DebateLineVO> dialogue);
}
