from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional

from dao.db_context import get_db_session_local

from service.growthService import GrowthService
from vo.growthVO import AiServerResponseVO, GrowthRequestVO # GrowthRequestVO 임포트 유지

app = FastAPI()

# ⚠️ CORS 설정 (필수)
origins = ["http://localhost:3000", "http://localhost:8080"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "AI Image and Growth Server is running"}

@app.post("/api/v1/grow-character", response_model=AiServerResponseVO)
async def grow_character_endpoint(
        request_vo: GrowthRequestVO, # 💡 수정: Form 대신 JSON Body (Pydantic Model)로 받음
        db: Session = Depends(get_db_session_local)
):
    """
    Java 백엔드로부터 요청(JSON Body)을 받아 성장 로직을 실행하고,
    AI 이미지(Base64)와 스탯 계산 결과를 반환합니다.
    """
    try:
        # 1. request_vo가 이미 Pydantic 모델로 유효성 검사를 통과했으므로 그대로 사용

        # 2. 서비스 계층 호출
        service = GrowthService(db=db)
        # 💡 수정: request_vo를 바로 전달
        result_dict, error_message = service.evolve_character(request_vo)

        if result_dict is None:
            raise HTTPException(status_code=400, detail=error_message)

        # 3. 응답 구성
        return AiServerResponseVO(**result_dict)

    except HTTPException:
        raise
    except Exception as e:
        # DB 트랜잭션 오류나 예상치 못한 서버 오류 처리
        print(f"Controller Error: {e}")
        raise HTTPException(status_code=500, detail=f"Server side processing failed: {str(e)}")
