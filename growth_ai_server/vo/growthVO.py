# growth_ai_python/vo/growthVO.py

from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

# =========================================================================
# 1. 요청 VO (Request VO)
# =========================================================================
class GrowthRequestVO(BaseModel):
    """
    Java 백엔드로부터 AI 서버로 전달되는 메타데이터.
    """
    user_id: str
    character_id: int
    target_modification: str # 예: "sky", "default_growth"
    style_prompt: Optional[str] = None

# =========================================================================
# 2. 응답 VO (Response VO) - AI 서버가 Java 백엔드에게 반환하는 최종 구조
# =========================================================================
class AiServerResponseVO(BaseModel):
    """
    AI 서버의 최종 응답 구조. Base64 이미지와 모든 계산된 스탯 데이터를 포함합니다.
    """
    status: str = "success"
    image_base64: str           # 변형된 이미지의 Base64 문자열
    image_format: str           # 이미지 파일 포맷 (예: 'png')

    # DB 업데이트 및 최종 응답에 필요한 식별/단계 정보
    user_id: str
    character_id: int
    new_evolution_step: int
    total_stage_clear_count: int # DB 조회 당시 클리어 횟수

    # 새로운 총 스탯 (BASE + TOTAL_INC + NEW_INC)
    new_total_attack: float
    new_total_defense: float
    new_total_hp: float
    new_total_speed: float
    new_total_critical_rate: float

    # 스탯 증분 (tb_growth에 기록된 NEW_INC 값)
    increment_attack: float
    increment_defense: float
    increment_hp: float
    increment_speed: float
    increment_critical_rate: float
    message: Optional[str] = None


# =========================================================================
# 3. DAO 내부 모델 (DB에 INSERT 할 때 사용할 데이터 구조) - 수정 완료
# =========================================================================
class GrowthModel:
    """
    tb_growth 테이블에 저장할 성장 기록 모델.
    EVOLUTION_STEP은 tb_growth에 없으므로 제거하고, tb_character에만 업데이트합니다.
    """
    def __init__(self, character_id: int, increment_attack: float, # 👈 evolution_step 제거
                 increment_defense: float, increment_hp: float, increment_speed: float,
                 increment_critical_rate: float, user_id: str):
        # 기존 필드
        # 스탯 필드
        self.CHARACTER_ID = character_id
        self.INCREMENT_ATTACK = increment_attack
        self.INCREMENT_DEFENSE = increment_defense
        self.INCREMENT_HP = increment_hp
        self.INCREMENT_SPEED = increment_speed
        self.INCREMENT_CRITICAL = increment_critical_rate

        # 감사 필드
        self.USER_ID = user_id
        self.CREATED_BY = user_id
        self.UPDATED_BY = user_id
        self.CREATED_DATE = datetime.now()
        self.UPDATED_DATE = datetime.now()