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
}
