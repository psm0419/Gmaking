package com.project.gmaking.pvp.service;

import com.project.gmaking.character.vo.CharacterVO;
import com.project.gmaking.pvp.vo.PvpBattleVO;

import java.util.List;

public interface PvpBattleService {
    String findRandomOpponent(String userId);
    List<CharacterVO> getOpponentCharacters(String opponentId);
    PvpBattleVO startBattle(Integer myCharacterId, Integer opponentCharacterId);
    PvpBattleVO processTurn(PvpBattleVO battle, String myCommand);
    void endBattle(PvpBattleVO result);
    PvpBattleVO getBattleById(Integer battleId);
}
