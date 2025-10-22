from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Generator

from ..dao.db_context import get_db_session_local
from ..vo.growthVO import GrowthRequestVO, GrowthResultResponseVO
from ..service.growthService import GrowthService

# FastAPI 애플리케이션 초기화
app = FastAPI(title="Character Growth API", version="1.0.0")

# Dependency: 데이터베이스 세션 가져오기
def get_db() -> Generator[Session, None, None]:
    """DB 세션을 생성하고 요청 완료 후 닫습니다."""
    db = get_db_session_local()
    try:
        yield db
    finally:
        db.close()

# POST /api/growth 엔드포인트 (Controller 역할 수행)
@app.post(
    "/api/growth",
    response_model=GrowthResultResponseVO,
    status_code=status.HTTP_200_OK,
    summary="캐릭터 성장 처리",
    description="클리어 횟수 조건을 충족하면 캐릭터를 다음 단계로 진화시키고 스탯을 부여합니다. (비용 없음)"
)
async def evolve_character_endpoint(
        request: GrowthRequestVO,
        db: Session = Depends(get_db)
):
    """
    요청된 캐릭터 ID와 사용자 ID를 사용하여 성장을 시도하고,
    성공하면 업데이트된 스탯과 진화 단계를 반환합니다.
    """
    growth_service = GrowthService(db)

    # Service 계층 호출
    result_vo, message = growth_service.evolve_character(request)

    if result_vo:
        return result_vo
    else:
        # 실패 메시지에 따라 HTTP 예외 반환 (Controller의 응답 처리)
        if "Character not found" in message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=message
            )
        elif "max evolution" in message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        elif "Insufficient stage clear" in message:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, # 조건 불충분 (클리어 횟수 부족)
                detail=message
            )
        else:
            # 기타 내부 서버 오류
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=message
            )

# Health Check Endpoint
@app.get("/")
def health_check():
    """API 서버 상태 확인용 엔드포인트"""
    return {"status": "ok", "message": "Character Growth API is running."}