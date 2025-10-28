from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any, Optional, List

# VO 모듈 임포트
from vo.growthVO import GrowthModel

class CharacterDAO:
    """
    캐릭터 성장과 관련된 데이터베이스 접근 로직(DAO)을 처리합니다.
    """
    def __init__(self, db: Session):
        self.db = db

    def get_growth_info(self, user_id: str, character_id: int) -> Optional[Dict[str, Any]]:
        # 이 함수는 그대로 유지
        query = text("""
            SELECT 
                c.EVOLUTION_STEP,
                c.TOTAL_STAGE_CLEARS,
                tb.CHARACTER_ATTACK AS BASE_ATTACK,
                tb.CHARACTER_DEFENSE AS BASE_DEFENSE,
                tb.CHARACTER_HP AS BASE_HP,
                tb.CHARACTER_SPEED AS BASE_SPEED,
                tb.CRITICAL_RATE AS BASE_CRITICAL_RATE,
                COALESCE(SUM(tg.INCREMENT_ATTACK), 0) AS TOTAL_INCREMENT_ATTACK,
                COALESCE(SUM(tg.INCREMENT_DEFENSE), 0) AS TOTAL_INCREMENT_DEFENSE,
                COALESCE(SUM(tg.INCREMENT_HP), 0) AS TOTAL_INCREMENT_HP,
                COALESCE(SUM(tg.INCREMENT_SPEED), 0) AS TOTAL_INCREMENT_SPEED,
                COALESCE(SUM(tg.INCREMENT_CRITICAL), 0) AS TOTAL_INCREMENT_CRATE,
                ti.IMAGE_URL AS CURRENT_IMAGE_URL
            FROM 
                tb_character c
            JOIN 
                tb_character_stat tb ON c.CHARACTER_ID = tb.CHARACTER_ID
            LEFT JOIN 
                tb_growth tg ON c.CHARACTER_ID = tg.CHARACTER_ID AND c.USER_ID = tg.USER_ID
            JOIN 
                tb_image ti ON c.IMAGE_ID = ti.IMAGE_ID
            WHERE 
                c.USER_ID = :user_id AND c.CHARACTER_ID = :character_id
            GROUP BY 
                c.CHARACTER_ID, ti.IMAGE_ID,
                tb.CHARACTER_ID, tb.CHARACTER_ATTACK, tb.CHARACTER_DEFENSE, tb.CHARACTER_HP, tb.CHARACTER_SPEED, tb.CRITICAL_RATE
        """)

        params = {"user_id": user_id, "character_id": character_id}
        result = self.db.execute(query, params).fetchone()

        if result:
            return dict(result._mapping)
        return None

    def insert_new_growth_record(self, growth_model: GrowthModel) -> bool:
        """
        tb_growth 테이블에 새로운 성장 기록을 삽입합니다.
        UPDATED_BY 필드를 추가하고, 날짜 필드는 NOW()를 사용합니다.
        """
        insert_growth_query = text("""
            INSERT INTO tb_growth (
                CHARACTER_ID, 
                INCREMENT_ATTACK, INCREMENT_DEFENSE, INCREMENT_HP, 
                INCREMENT_SPEED, INCREMENT_CRITICAL,
                USER_ID, CREATED_BY, UPDATED_BY, CREATED_DATE, UPDATED_DATE
            ) VALUES (
                :character_id, 
                :inc_attack, :inc_defense, :inc_hp, 
                :inc_speed, :inc_critical,
                :user_id, :created_by, :updated_by, NOW(), NOW()
            )
        """)

        # 💡 GrowthModel의 필드를 기반으로 파라미터 구성
        # CREATED_BY와 UPDATED_BY가 USER_ID와 동일하다고 가정합니다.
        user_id = growth_model.USER_ID

        params = {
            "character_id": growth_model.CHARACTER_ID,
            "inc_attack": growth_model.INCREMENT_ATTACK,
            "inc_defense": growth_model.INCREMENT_DEFENSE,
            "inc_hp": growth_model.INCREMENT_HP,
            "inc_speed": growth_model.INCREMENT_SPEED,
            "inc_critical": growth_model.INCREMENT_CRITICAL,
            "user_id": user_id,
            "created_by": user_id, # 💡 USER_ID 사용
            "updated_by": user_id, # 💡 UPDATED_BY 추가
        }

        # SQL Alchemy는 트랜잭션을 자동으로 관리하므로, execute만 하면 됩니다.
        result = self.db.execute(insert_growth_query, params)
        return result.rowcount == 1