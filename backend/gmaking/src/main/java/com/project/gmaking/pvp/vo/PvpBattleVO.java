package com.project.gmaking.pvp.vo;

import com.project.gmaking.character.vo.CharacterVO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PvpBattleVO {
    private Integer battleId;
    private CharacterVO player;
    private CharacterVO enemy;
    private int playerHp;
    private int enemyHp;
    private int turn;
    private List<String> logs;
    private boolean battleOver;
    private String enemyCommand;
}
