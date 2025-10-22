import random
from sqlalchemy.orm import Session
from typing import Optional, Tuple

# 상대 경로 임포트 (DAO, VO)
from ..dao.characterDAO import CharacterDAO
from ..vo.growthVO import GrowthRequestVO, GrowthResultResponseVO, GrowthModel

# === 성장 로직 상수 ===
MAX_EVOLUTION_STEP = 5
GROWTH_INCREMENT_RANGE = (1, 5) # 성장 시 스탯 증가 범위 (랜덤)

# 각 진화 단계로 넘어가기 위해 필요한 클리어 횟수
REQUIRED_CLEARS = {
    1: 10,  # Step 1 -> Step 2
    2: 20,  # Step 2 -> Step 3
    3: 30,  # Step 3 -> Step 4
}

class GrowthService:
    def __init__(self, db: Session):
        self.character_dao = CharacterDAO(db)
        self.db = db

    def evolve_character(self, request: GrowthRequestVO) -> Tuple[Optional[GrowthResultResponseVO], str]:
        """
        캐릭터 성장 로직을 실행합니다. (클리어 횟수 조건 확인)
        모든 DB 작업은 하나의 트랜잭션으로 처리됩니다.
        """
        try:
            # 1. 캐릭터 현재 상태 조회
            growth_data = self.character_dao.get_growth_info(request.user_id, request.character_id)
            if growth_data is None:
                self.db.rollback()
                return None, "Character not found or does not belong to the user."

            current_step = growth_data['EVOLUTION_STEP']
            total_clear = growth_data['TOTAL_STAGE_CLEARS']

            # 2. 성장 가능 조건 검토 (최대 진화 단계)
            if current_step >= MAX_EVOLUTION_STEP:
                self.db.rollback()
                return None, "Character is already at max evolution stage."

            # 3. 성장 조건 충족 확인 (클리어 횟수)
            required_clear = REQUIRED_CLEARS.get(current_step, float('inf'))
            if total_clear < required_clear:
                self.db.rollback()
                return None, f"Insufficient stage clear count. Requires {required_clear} clears to reach step {current_step + 1}, current is {total_clear}."

            # 4. 스탯 증가분 계산 및 다음 단계 설정
            inc_attack = random.randint(*GROWTH_INCREMENT_RANGE)
            inc_defense = random.randint(*GROWTH_INCREMENT_RANGE)
            inc_hp = random.randint(*GROWTH_INCREMENT_RANGE)
            inc_speed = random.randint(*GROWTH_INCREMENT_RANGE)
            inc_critical_rate = random.randint(*GROWTH_INCREMENT_RANGE)
            new_step = current_step + 1

            # 4.1. 다음 단계 진화 이미지 정보 조회 (DAO 보강 사항 반영)
            image_data = self.character_dao.get_image_data_by_step(new_step)
            if not image_data:
                self.db.rollback()
                return None, f"Image data not configured for evolution step {new_step}. Cannot proceed."

            new_image_id = image_data['IMAGE_ID']
            new_image_url = image_data['IMAGE_URL']

            # 5. tb_character의 EVOLUTION_STEP 및 이미지 ID 업데이트
            if not self.character_dao.update_evolution_data(
                    request.user_id,
                    request.character_id,
                    new_step,
                    new_image_id
            ):
                self.db.rollback()
                return None, "Failed to update character evolution data."

            # 6. 새로운 성장 기록 모델 생성 및 tb_growth에 삽입
            new_growth_record = GrowthModel(
                character_id=request.character_id,
                evolution_step=new_step,
                increment_attack=inc_attack,
                increment_defense=inc_defense,
                increment_hp=inc_hp,
                increment_speed=inc_speed,
                increment_critical_rate=inc_critical_rate,
                user_id=request.user_id
            )

            if not self.character_dao.insert_new_growth_record(new_growth_record):
                self.db.rollback()
                return None, "Failed to record new growth data to tb_growth."

            # 7. 모든 DB 작업 성공, 트랜잭션 커밋
            self.db.commit()

            # 8. 최종 결과 반환 객체 생성 및 반환

            # 최종 스탯 합계 계산 (Base + Total_Inc + New_Inc)
            new_total_attack = growth_data['BASE_ATTACK'] + growth_data['TOTAL_INCREMENT_ATTACK'] + inc_attack
            new_total_defense = growth_data['BASE_DEFENSE'] + growth_data['TOTAL_INCREMENT_DEFENSE'] + inc_defense
            new_total_hp = growth_data['BASE_HP'] + growth_data['TOTAL_INCREMENT_HP'] + inc_hp
            new_total_speed = growth_data['BASE_SPEED'] + growth_data['TOTAL_INCREMENT_SPEED'] + inc_speed
            new_total_critical_rate = growth_data['BASE_CRITICAL_RATE'] + growth_data['TOTAL_INCREMENT_CRATE'] + inc_critical_rate

            response = GrowthResultResponseVO(
                user_id=request.user_id,
                new_evolution_step=new_step,
                total_stage_clear_count=total_clear,
                total_attack=new_total_attack,
                total_defense=new_total_defense,
                total_hp=new_total_hp,
                total_speed=new_total_speed,
                total_critical_rate=new_total_critical_rate,
                new_image_url=new_image_url # ★ 수정된 새로운 URL 사용 ★
            )

            return response, "Success"

        except Exception as e:
            print(f"🚨 캐릭터 성장 중 예외 발생: {e}")
            self.db.rollback()
            return None, "Internal server error during growth process."
