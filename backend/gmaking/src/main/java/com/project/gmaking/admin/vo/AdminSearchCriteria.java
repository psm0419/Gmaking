package com.project.gmaking.admin.vo;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

// 모든 관리자 목록 조회(페이징, 검색, 필터링)에 사용되는 공통 검색 조건 객체
@Getter
@Setter
public class AdminSearchCriteria {

    private int page;                   // 현재 페이지 번호 (기본값: 1)
    private int pageSize;               // 페이지당 항목 수 (요청: 8)
    private int offset;                 // DB 쿼리에서 사용할 OFFSET 값 (LIMIT 시작점)

    // 공통 검색어
    private String searchKeyword;

    private String filterRole;          // 사용자 목록: 역할 (ROLE)
    private Integer filterGradeId;      // 캐릭터 목록: 등급 (GRADE_ID)
    private String filterStatus;        // 구매 내역 목록: 상태 (STATUS)
    private Integer filterProductId;    // 인벤토리 목록: 상품 ID (PRODUCT_ID)
    private String filterIsSale;        // 상품 목록: 판매 여부 (IS_SALE) (Y/N)
    private String filterCategory;      // 게시글 목록: 카테고리 (CATEGORY_CODE)
    private String filterIsDeleted;     // 게시글 목록: 삭제 여부 (IS_DELETED) (Y/N)
    private String filterType;          // 신고 목록: 대상 타입 (TARGET_TYPE)
    private String filterMonsterType;   // 몬스터 목록: 몬스터 유형 (NORMAL, BOSS)

    public AdminSearchCriteria() {
        this.page = 1;
        this.pageSize = 6;
        calculateOffset();
    }

    public AdminSearchCriteria(int page, int pageSize, String searchKeyword) {
        this.setPage(page);
        this.setPageSize(pageSize);
        this.searchKeyword = searchKeyword;
    }

    public void setPage(int page) {
        this.page = (page <= 0) ? 1 : page;
        calculateOffset();
    }

    public void setPageSize(int pageSize) {
        this.pageSize = (pageSize <= 0) ? 6 : pageSize;
        calculateOffset();
    }

    private void calculateOffset() {
        this.offset = (this.page - 1) * this.pageSize;
        if (this.offset < 0) {
            this.offset = 0;
        }
    }
}