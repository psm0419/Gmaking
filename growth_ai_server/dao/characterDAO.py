from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any, Optional, List
from vo.growthVO import GrowthModel

class CharacterDAO:
    """
    캐릭터 성장과 관련된 데이터베이스 접근 로직(DAO)을 처리합니다.
    (성장 시 최종 스탯을 tb_character_stat에 직접 반영하는 방식으로 수정)
    """
    def __init__(self, db: Session):
        self.db = db

    def get_growth_info(self, user_id: str, character_id: int) -> Optional[Dict[str, Any]]:
        """
        성장 로직 처리에 필요한 현재 캐릭터 정보를 가져옵니다.
        (tb_growth의 SUM 로직은 제거가 필요하나, 기존 로직 유지를 위해 임시로 둡니다.)

        *주의: 이제 tb_character_stat에 최종 스탯이 담기므로, BASE_XX는 최종 스탯을 의미하게 됩니다.*
        """
        query = text("""
            SELECT 
                c.EVOLUTION_STEP,
                c.TOTAL_STAGE_CLEARS,
                tb.CHARACTER_ATTACK AS BASE_ATTACK,
                tb.CHARACTER_DEFENSE AS BASE_DEFENSE,
                tb.CHARACTER_HP AS BASE_HP,
                tb.CHARACTER_SPEED AS BASE_SPEED,
                tb.CRITICAL_RATE AS BASE_CRITICAL_RATE,
                ti.IMAGE_URL AS CURRENT_IMAGE_URL
                # Note: tb_growth의 SUM 로직은 최종 스탯 반영 방식에서는 제거 필요
            FROM 
                tb_character c
            JOIN 
                tb_character_stat tb ON c.CHARACTER_ID = tb.CHARACTER_ID
            JOIN 
                tb_image ti ON c.IMAGE_ID = ti.IMAGE_ID
            WHERE 
                c.USER_ID = :user_id AND c.CHARACTER_ID = :character_id
        """)

        params = {"user_id": user_id, "character_id": character_id}
        result = self.db.execute(query, params).fetchone()

        if result:
            return dict(result._mapping)
        return None

    def insert_new_growth_record(self, growth_model: GrowthModel) -> bool:
        """
        tb_growth 테이블에 새로운 성장 기록을 삽입합니다. (히스토리 기록용)

        *NOTE: 현재 tb_growth 스키마에 IMAGE_ID_AFTER_GROWTH 컬럼이 없으므로 제거했습니다.*
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

        user_id = growth_model.USER_ID

        params = {
            "character_id": growth_model.CHARACTER_ID,
            "inc_attack": growth_model.INCREMENT_ATTACK,
            "inc_defense": growth_model.INCREMENT_DEFENSE,
            "inc_hp": growth_model.INCREMENT_HP,
            "inc_speed": growth_model.INCREMENT_SPEED,
            "inc_critical": growth_model.INCREMENT_CRITICAL,
            "user_id": user_id,
            "created_by": user_id,
            "updated_by": user_id,
        }

        result = self.db.execute(insert_growth_query, params)
        return result.rowcount == 1

    # 🌟 [추가] tb_character_stat 업데이트 메서드 (요청하신 핵심 수정 사항)
    def update_character_stats(self, character_id: int, user_id: str, new_stats: Dict[str, Any]) -> bool:
        """
        tb_character_stat 테이블의 스탯을 직접 계산된 최종 스탯으로 업데이트합니다.
        """
        update_stats_query = text("""
            UPDATE tb_character_stat
            SET 
                CHARACTER_ATTACK = :attack, 
                CHARACTER_DEFENSE = :defense, 
                CHARACTER_HP = :hp,
                CHARACTER_SPEED = :speed,
                CRITICAL_RATE = :critical_rate,
                UPDATED_DATE = NOW(),
                UPDATED_BY = :user_id
            WHERE 
                CHARACTER_ID = :character_id
        """)

        params = {
            "character_id": character_id,
            "user_id": user_id,
            "attack": new_stats["attack"],
            "defense": new_stats["defense"],
            "hp": new_stats["hp"],
            "speed": new_stats["speed"],
            "critical_rate": new_stats["critical_rate"],
        }

        result = self.db.execute(update_stats_query, params)
        return result.rowcount == 1

    # 🌟 [추가] tb_character 업데이트 메서드
    def update_character_evolution(self, character_id: int, user_id: str, next_step: int, new_image_id: int) -> bool:
        """
        tb_character 테이블의 진화 단계(EVOLUTION_STEP)와 이미지 ID를 업데이트합니다.
        """
        update_char_query = text("""
            UPDATE tb_character
            SET 
                EVOLUTION_STEP = :next_step, 
                IMAGE_ID = :new_image_id,
                TOTAL_STAGE_CLEARS = 0, -- 진화 조건 클리어 횟수 초기화 (가정)
                UPDATED_DATE = NOW(),
                UPDATED_BY = :user_id
            WHERE 
                CHARACTER_ID = :character_id AND USER_ID = :user_id
        """)

        params = {
            "character_id": character_id,
            "user_id": user_id,
            "next_step": next_step,
            "new_image_id": new_image_id,
        }

        result = self.db.execute(update_char_query, params)
        return result.rowcount == 1