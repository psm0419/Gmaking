package com.project.gmaking.growth.dao;

import com.project.gmaking.growth.vo.GrowthPreGeneratedVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface GrowthPreGeneratedDAO {

    /** 사전 생성 이미지 등록 */
    int insertPreGeneratedImage(GrowthPreGeneratedVO vo);

    /** 캐릭터 + 다음 진화 단계 기준으로 사전 생성 이미지 조회 */
    GrowthPreGeneratedVO findByCharacterAndStep(
            @Param("characterId") Long characterId,
            @Param("nextEvolutionStep") Integer nextEvolutionStep
    );

    /** 스케줄러용: 조건 달성 캐릭터 조회 */
    List<Long> findEligibleCharactersForPreGen();

    /** 캐릭터 삭제 시 남은 사전 생성 데이터 정리 */
    int deleteByCharacterId(@Param("characterId") Long characterId);

    /** ✅ 사전생성 이미지 사용 완료 처리 */
    int markAsUsed(@Param("preGenId") Integer preGenId);

}
