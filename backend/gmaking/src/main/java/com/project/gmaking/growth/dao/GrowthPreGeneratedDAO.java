package com.project.gmaking.growth.dao;

import com.project.gmaking.growth.vo.GrowthPreGeneratedVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface GrowthPreGeneratedDAO {

    /**
     * 사전 생성 이미지 등록
     */
    int insertPreGeneratedImage(GrowthPreGeneratedVO vo);

    /**
     * 캐릭터 + 다음 진화 단계 기준으로 사전 생성 이미지 조회
     */
    GrowthPreGeneratedVO findByCharacterAndStep(
            @Param("characterId") Integer characterId,
            @Param("nextEvolutionStep") Integer nextEvolutionStep
    );

    /**
     * 사전 생성된 캐릭터 목록 조회 (스케줄러용)
     * → 조건: 총 클리어 수 달성, 아직 tb_growth_pre_generated에 없는 캐릭터
     */
    List<Integer> findEligibleCharactersForPreGen();

    /**
     * 캐릭터 삭제 시 남은 사전 생성 데이터 정리
     */
    int deleteByCharacterId(@Param("characterId") Integer characterId);
}
