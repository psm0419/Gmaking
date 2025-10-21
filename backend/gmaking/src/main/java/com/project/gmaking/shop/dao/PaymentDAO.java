package com.project.gmaking.shop.dao;

import com.project.gmaking.shop.vo.GrantVO;
import com.project.gmaking.shop.vo.PurchaseVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PaymentDAO {
    int insertReadyPurchase(@Param("p") PurchaseVO p);

    PurchaseVO selectByMerchantUid(@Param("merchantUid") String merchantUid);

    int markPaid(@Param("merchantUid") String merchantUid,
                 @Param("impUid") String impUid,
                 @Param("amountPaid") int amountPaid,
                 @Param("pg") String pg,
                 @Param("method") String method);

    int markFailed(@Param("merchantUid") String merchantUid,
                   @Param("reason") String reason);

    int markApplied(@Param("purchaseId") long purchaseId);

    int insertGrant(@Param("g") GrantVO g);

    int markGrantApplied(@Param("grantId") long grantId,
                         @Param("inventoryId") Integer inventoryId);
}
