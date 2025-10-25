package com.project.gmaking.community.vo;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostPagingVO {

    // 요청 파라미터
    private int pageNum = 1; // 현재 페이지 번호(기본 1)
    private int amount = 5; // 페이지당 게시글 수(기본 5)

    private String userId;
    private String searchType;
    private String keyword;

    private String categoryCode;

    // 계산된 필드
    private int totalCount;         // 전체 게시글 수
    private int startPage;          // 시작 페이지 번호
    private int endPage;            // 마지막 페이지 번호
    private boolean prev;           // 이전 페이지 버튼 활성화 여부
    private boolean next;           // 다음 페이지 버튼 활성화 여부
    private int displayPageNum = 5; // 페이지 버튼 개수

    public PostPagingVO(int pageNum, int amount){
        this.pageNum = pageNum;
        this.amount = amount;
    }

    // 검색 필터링 조건까지 포함하는 생성자
    public PostPagingVO(int pageNum, int amount, String userId, String searchType, String keyword){
        this.pageNum = pageNum;
        this.amount = amount;
        this.userId = userId;
        this.searchType = searchType;
        this.keyword = keyword;
        this.categoryCode = categoryCode;
    }

    // LIMIT 절의 OFFSET 계산
    public int getSkip(){
        return (this.pageNum - 1) * this.amount;
    }

    // 전체 게시글 수를 설정하고 페이징 관련 정보를 계산
    public void setTotalCount(int totalCount) {
        this.totalCount = totalCount;
        calculatePaging();
    }

    private void calculatePaging(){
        // 끝 페이지 번호
        this.endPage = (int)(Math.ceil(this.pageNum / (double) displayPageNum)) * displayPageNum;

        // 시작 페이지 번호
        this.startPage = (this.endPage - displayPageNum) + 1;

        // 실제 마지막 페이지 번호
        int realEnd = (int)(Math.ceil((this.totalCount * 1.0) / this.amount));

        // 끝 페이지 번호 보정
        if(realEnd < this.endPage){
            this.endPage = realEnd;
        }

        // 이전/다음 버튼 활성화 여부
        this.prev = this.startPage > 1;
        this.next = this.endPage < realEnd;
    }
}
