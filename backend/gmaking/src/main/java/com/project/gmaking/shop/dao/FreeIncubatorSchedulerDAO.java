package com.project.gmaking.shop.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface FreeIncubatorSchedulerDAO {
    // 다중 인스턴스 환경에서 일일 작업 락
    Integer acquireDailyLock();

    // 락해제
    Integer releaseDailyLock();

    // 전 유저 대상 무료 부화기 지급
    int grantDailyFreeToAllUsers();

    // 전 유저 대상 캐시 갱신
    int refreshIncubatorCacheForAllUsers();

}
