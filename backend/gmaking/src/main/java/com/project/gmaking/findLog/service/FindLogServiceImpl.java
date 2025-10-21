package com.project.gmaking.findLog.service;

import com.project.gmaking.character.dao.CharacterDAO;
import com.project.gmaking.character.vo.CharacterVO;
import com.project.gmaking.pve.dao.PveBattleDAO;
import com.project.gmaking.pve.dao.TurnLogDAO;
import com.project.gmaking.pve.vo.BattleLogVO;
import com.project.gmaking.pve.vo.TurnLogVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FindLogServiceImpl implements FindLogService{

    private final TurnLogDAO turnLogDAO;
    private final PveBattleDAO battleDAO;
    private final CharacterDAO characterDAO;

    @Override
    public List<BattleLogVO> getBattleLogsByUser(String userId) {

        List<CharacterVO> characters = characterDAO.selectCharactersByUser(userId);
        List<BattleLogVO> result = new ArrayList<>();
        for (CharacterVO c : characters) {
            result.addAll(battleDAO.selectBattleLogsByCharacterId(c.getCharacterId()));
        }

        // 최신순 정렬
        result.sort((a, b) -> {
            LocalDateTime ad = a.getCreatedDate();
            LocalDateTime bd = b.getCreatedDate();
            if (ad == null && bd == null) return 0;
            if (ad == null) return 1;
            if (bd == null) return -1;
            return bd.compareTo(ad); // 최신순
        });
        return result;
    }

    @Override
    public List<TurnLogVO> getTurnLogsByBattleId(Integer battleId) {
        return turnLogDAO.selectTurnLogsByBattleId(battleId);
    }
}
