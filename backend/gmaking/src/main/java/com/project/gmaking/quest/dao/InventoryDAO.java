package com.project.gmaking.quest.dao;

import org.apache.ibatis.annotations.*;

@Mapper
public interface InventoryDAO {

    @Update("""
        UPDATE TB_USER_INVENTORY
        SET QUANTITY = QUANTITY + #{quantity}, UPDATED_DATE = NOW()
        WHERE USER_ID = #{userId} AND PRODUCT_ID = #{productId}
    """)
    int addQuantity(@Param("userId") String userId, @Param("productId") int productId, @Param("quantity") int quantity);

    @Insert("""
        INSERT INTO TB_USER_INVENTORY (USER_ID, PRODUCT_ID, QUANTITY)
        VALUES (#{userId}, #{productId}, #{quantity})
    """)
    void insert(@Param("userId") String userId, @Param("productId") int productId, @Param("quantity") int quantity);

    /** 부화권 합산 수를 TB_USER.INCUBATOR_COUNT에 동기화 */
    @Update("""
        UPDATE TB_USER u
        LEFT JOIN (
            SELECT USER_ID, COALESCE(SUM(QUANTITY),0) AS CNT
            FROM TB_USER_INVENTORY
            WHERE PRODUCT_ID IN (4,5) AND USER_ID = #{userId}
            GROUP BY USER_ID
        ) s ON s.USER_ID = u.USER_ID
        SET u.INCUBATOR_COUNT = COALESCE(s.CNT, 0)
        WHERE u.USER_ID = #{userId}
    """)
    void refreshUserIncubatorCache(@Param("userId") String userId);
}
