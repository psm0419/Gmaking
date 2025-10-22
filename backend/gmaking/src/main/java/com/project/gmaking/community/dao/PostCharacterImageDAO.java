package com.project.gmaking.community.dao;

import com.project.gmaking.community.vo.PostCharacterImageVO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PostCharacterImageDAO {
    // 특정 사용자 ID의 닉네임과 대표 캐릭터 이미지 URL을 조회합니다.
    PostCharacterImageVO selectUserCharacterImage(String userId);
}
