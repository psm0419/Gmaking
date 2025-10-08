package com.project.gmaking.pve.service;

import java.util.List;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import com.project.gmaking.pve.dao.EncounterRateDAO;
import com.project.gmaking.pve.dao.MonsterDAO;
import com.project.gmaking.pve.vo.EncounterRateVO;
import com.project.gmaking.pve.vo.MonsterVO;

@Service
@RequiredArgsConstructor
public class PveBattleService {

    private final EncounterRateDAO encounterRateDAO;
    private final MonsterDAO monsterDAO;

    public MonsterVO encounterMonster(Integer mapId) {
        List<EncounterRateVO> rates = encounterRateDAO.getEncounterRates();

        double normalRate = rates.stream()
                .filter(r -> r.getEncounterType().equalsIgnoreCase("NORMAL"))
                .mapToDouble(EncounterRateVO::getEncounterRate)
                .findFirst()
                .orElse(98.0);

        double bossRate = 100.0 - normalRate;
        double random = Math.random() * 100;

        String type = random < bossRate ? "BOSS" : "NORMAL";

        // 🔹 mapId는 지금은 사용 안하지만, 나중에 맵별로 로직 확장 가능
        return monsterDAO.getRandomMonsterByType(type);
    }
}
