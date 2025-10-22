from typing import Optional
from pydantic import BaseModel
from datetime import datetime

# =========================================================================
# 1. 요청 VO (Request VO)
# =========================================================================
class GrowthRequestVO(BaseModel):
    """클라이언트가 캐릭터 성장을 요청할 때 보내는 데이터 구조입니다."""
    user_id: str         # 사용자 ID
    character_id: int    # 성장시킬 캐릭터 ID

# =========================================================================
# 2. 응답 VO (Response VO)
# =========================================================================
class GrowthResultResponseVO(BaseModel):
    """성장 API 호출 후 클라이언트에게 반환하는 최종 결과 데이터 구조입니다."""
    user_id: str
    new_evolution_step: int         # 새로운 진화 단계
    total_stage_clear_count: int    # 총 클리어 횟수

    # 새로운 총 스탯 정보
    total_attack: float
    total_defense: float
    total_hp: float
    total_speed: float
    total_critical_rate: float

    new_image_url: str              # 새로운 이미지의 URL

# =========================================================================
# 3. DAO 내부 모델 (DB에 INSERT 할 때 사용할 데이터 구조)
# =========================================================================
class GrowthModel:
    """tb_growth 테이블에 저장할 성장 기록 모델"""
    def __init__(self, character_id: int, evolution_step: int, increment_attack: float,
                 increment_defense: float, increment_hp: float, increment_speed: float,
                 increment_critical_rate: float, user_id: str, created_by: str = "SYSTEM"):
        self.CHARACTER_ID = character_id
        self.EVOLUTION_STEP = evolution_step
        self.INCREMENT_ATTACK = increment_attack
        self.INCREMENT_DEFENSE = increment_defense
        self.INCREMENT_HP = increment_hp
        self.INCREMENT_SPEED = increment_speed
        self.INCREMENT_CRITICAL_RATE = increment_critical_rate
        self.USER_ID = user_id
        self.CREATED_BY = created_by
        self.CREATED_DATE = datetime.now()
        self.UPDATED_DATE = datetime.now()
