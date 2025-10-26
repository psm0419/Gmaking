import random
import time
import base64
import requests
from io import BytesIO
from PIL import Image
from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import Optional, Tuple, Dict, Any

from dao.characterDAO import CharacterDAO
from vo.growthVO import GrowthRequestVO, GrowthModel

# === AI 통신 설정 (유지) ===
HORDE_API_KEY = "z_RIG25C3-Bpx7-kZ7i-hQ".strip() # 실제 키 사용
HORDE_API_URL_SUBMIT = "https://stablehorde.net/api/v2/generate/async"
HORDE_API_URL_FETCH = "https://stablehorde.net/api/v2/generate/status"
HEADERS = {
    "apikey": HORDE_API_KEY,
    "Accept": "application/json",
    "Content-Type": "application/json"
}

# === 성장 로직 상수 (유지) ===
MAX_EVOLUTION_STEP = 5
GROWTH_INCREMENT_RANGE = (1, 5)
REQUIRED_CLEARS = {1: 10, 2: 20, 3: 30}

# =========================================================================
# 🛠️ AI 변형 프롬프트 정의 (키 이름만 Java 백엔드와 일치하도록 수정)
#    - 프롬프트 내용(base_prompt, negative_prompt)은 요청에 따라 그대로 유지됩니다.
# =========================================================================
MODIFICATIONS = {
    "EVO_KEY_EGG": {
        "output_suffix": "stage_1_egg.png",
        "base_prompt": (
            "Depict the same creature in its earliest egg form, small and round, "
            "simple smooth surface with faint color hints of the original creature. "
            "Keep the silhouette minimal, add a gentle magical glow, "
            "solid light blue background, pixel-art fantasy RPG style, centered composition."
        ),
        "negative_prompt": (
            "text, watermark, blur, 3D render, photorealistic, humanoid, multiple creatures, mutation"
        )
    },
    "EVO_KEY_BABY": {
        "output_suffix": "stage_2_baby.png",
        "base_prompt": (
            "Evolve the creature into a baby form, small and cute with tiny limbs and bright eyes. "
            "Maintain the same body colors and species traits, add a cheerful expression, "
            "and faint magical aura around it. "
            "Solid green background, clean pixel-art style, high detail but consistent design."
        ),
        "negative_prompt": (
            "photorealistic, extra heads, messy scene, background scenery, multiple creatures, human-like shape"
        )
    },
    "EVO_KEY_TEEN": {
        "output_suffix": "stage_3_teen.png",
        "base_prompt": (
            "Evolve the same creature into a teenage form, larger and stronger posture. "
            "Add slight armor details, glowing patterns, or elemental effects (like fire, wind, or light aura). "
            "Keep the face and body proportions consistent with the input. "
            "Solid red background, dynamic pixel-art fantasy RPG illustration."
        ),
        "negative_prompt": (
            "distorted face, new species, photorealistic, messy background, 3D, blur, multiple creatures"
        )
    },
    "EVO_KEY_FINAL": {
        "output_suffix": "stage_4_final.png",
        "base_prompt": (
            "Depict the same creature in its final evolved form, fully mature and majestic. "
            "Keep the same color palette, silhouette, and facial identity as the input image. "
            "Add visible power effects such as magical aura, refined armor or wings, glowing eyes, "
            "and dynamic energy motion. "
            "Solid golden yellow background with light burst. "
            "Epic pixel-art fantasy RPG style, centered composition, high detail, sharp lines."
        ),
        "negative_prompt": (
            "photorealistic, human-like, deformed limbs, new creature design, low-res, blur, text, watermark"
        )
    }
}


# =========================================================================


# === 유틸리티 함수 (유지) ===
def is_valid_image_data(img_data):
    # ... (함수 내용 유지)
    if len(img_data) < 4: return False, None
    if img_data.startswith(b'\x89PNG'): return True, "PNG"
    elif img_data.startswith(b'\xff\xd8\xff'): return True, "JPEG"
    # Stable Horde에서 WEBP 결과물이 나올 가능성도 고려 (선택적)
    elif img_data.startswith(b'RIFF') and img_data[8:12] == b'WEBP': return True, "WEBP"
    return False, None

def _download_and_encode_image(url: str) -> str:
    # ... (함수 내용 유지)
    """외부 URL에서 이미지를 다운로드하여 Base64 문자열로 인코딩합니다."""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return base64.b64encode(response.content).decode('utf-8')
    except requests.exceptions.RequestException as e:
        print(f"❌ 이미지 다운로드 실패 (URL: {url}): {e}")
        raise HTTPException(status_code=500, detail=f"Failed to download current image for AI processing: {e}")

class GrowthService:
    def __init__(self, db: Session):
        self.character_dao = CharacterDAO(db)
        self.db = db

    # ------------------------------------------------------------------
    # 🚨 _submit_job 함수 수정: 모델 및 파라미터 최적화 (유지)
    # ------------------------------------------------------------------
    def _submit_job(self, prompt, negative_prompt, input_img_b64):
        payload = {
            "prompt": prompt, "negative_prompt": negative_prompt,
            "models": ["Anything Diffusion"], # 🌟 Anything Diffusion으로 변경 (더 빠르고 안정적인 2D 스타일)
            "source_image": input_img_b64,
            "source_processing": "img2img",
            "params": {
                "sampler_name": "k_euler_a",
                "cfg_scale": 12,
                "steps": 28, 
                "width": 1024,
                "height": 1024,
                "denoising_strength": 0.68 # 강도
            },
            "nsfw": False
        }
        response = requests.post(HORDE_API_URL_SUBMIT, headers=HEADERS, json=payload, timeout=60)
        if response.status_code not in (200, 202):
            raise HTTPException(status_code=500, detail=f"Horde API submission failed: {response.status_code} {response.text}")
        data = response.json()
        job_id = data.get("id")
        if not job_id:
            raise HTTPException(status_code=500, detail=f"Horde API did not return Job ID: {data}")
        return job_id

    # ------------------------------------------------------------------
    # 🌟 [FINAL FIX] _fetch_result 함수: 이미지 데이터 진단 로직 추가 (유지)
    # ------------------------------------------------------------------
    def _fetch_result(self, job_id):
        max_wait = 1800 # 최대 30분 대기
        start = time.time()
        last_queue = -1 # 이전 대기열 위치
        last_wait_time = -1 # 이전 예상 대기 시간

        # 첫 번째 요청은 대기 없이 즉시 실행
        is_first_check = True

        while time.time() - start < max_wait:

            # 첫 번째 체크가 아니면 10초 대기
            if not is_first_check:
                time.sleep(10)
            is_first_check = False

            try:
                response = requests.get(f"{HORDE_API_URL_FETCH}/{job_id}", headers=HEADERS, timeout=30)
                if response.status_code == 404:
                    raise HTTPException(status_code=404, detail=f"Job ID not found: {job_id}")

                response.raise_for_status()
                data = response.json()

            except requests.exceptions.RequestException as e:
                print(f"❌ [AI 통신 오류] Job ID: {job_id} 상태 확인 실패: {e}")
                continue
            except Exception as e:
                print(f"❌ [AI 처리 오류] Job ID: {job_id} 응답 처리 중 심각한 오류 발생: {e}")
                raise HTTPException(status_code=500, detail="Error processing AI response data.")


            state = data.get("state")

            # 1. 완료 상태 확인
            if state == "completed" or data.get("done", False):
                gens = data.get("generations", [])
                if not gens or not gens[0].get("img"):
                    print(f"⚠️ 결과 이미지가 없습니다 (워커 실패): Job ID: {job_id}")
                    raise HTTPException(status_code=500, detail="Horde API returned no image or generation failed.")

                img_field = gens[0]["img"]
                img_data = None

                # 1.1. URL 또는 Base64 디코딩
                if img_field.startswith("http"):
                    try:
                        img_response = requests.get(img_field, headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
                        img_response.raise_for_status() # HTTP 오류 (4xx, 5xx) 발생 시 예외 처리
                        img_data = img_response.content
                        print(f"🔎 [이미지 진단] URL 다운로드 성공. 데이터 길이: {len(img_data)}")
                    except requests.exceptions.RequestException as e:
                        print(f"❌ [이미지 진단] URL 다운로드 실패: {e}")
                        # 다운로드 실패 시에도 'Invalid image data received' 대신 더 구체적인 오류를 반환
                        raise HTTPException(status_code=500, detail=f"Failed to download AI result from URL: {e}")
                else:
                    try:
                        img_data = base64.b64decode(img_field)
                        print(f"🔎 [이미지 진단] Base64 디코딩 성공. 데이터 길이: {len(img_data)}")
                    except Exception as e:
                        print(f"❌ [이미지 진단] Base64 디코딩 실패: {e}")
                        raise HTTPException(status_code=500, detail="Base64 decoding failed.")

                # 🌟🌟🌟 이 로그를 추가합니다. 이미지 데이터가 유효한지 확인하는 결정적인 단서입니다. 🌟🌟🌟
                if img_data:
                    print(f"🔍 [데이터 헤더] 이미지 데이터 시작 (16바이트): {img_data[:16]}")

                # 1.2. 유효성 검사
                is_valid, format_type = is_valid_image_data(img_data)
                if not is_valid:
                    print(f"❌ [유효성 검사] 받은 데이터가 유효한 이미지 포맷이 아닙니다. 헤더 확인 필요.")
                    raise HTTPException(status_code=500, detail="Invalid image data received.")

                # 1.3. PIL 이미지 변환 및 반환
                try:
                    img = Image.open(BytesIO(img_data)).convert("RGBA")
                    output_buffer = BytesIO()
                    img.save(output_buffer, "PNG")
                    final_base64 = base64.b64encode(output_buffer.getvalue()).decode('utf-8')

                    print(f"🎉 [AI 성공] Job ID: {job_id} - 이미지 생성 완료. 소요 시간: {int(time.time() - start)}s")
                    return {"image_base64": final_base64, "image_format": "png"}
                except Exception as e:
                    print(f"❌ [PIL 오류] 이미지 데이터는 유효하나 PIL 변환 중 실패: {e}")
                    raise HTTPException(status_code=500, detail="Failed to process image data with PIL.")

            # 2. 대기/진행 상태 확인 (완료되지 않은 모든 상태)
            queue = data.get("queue_position", 0)
            wait_time = data.get("wait_time", 0)

            # 대기열이나 예상 시간이 변한 경우, 또는 최소 60초마다 로그를 출력
            if queue != last_queue or wait_time != last_wait_time or (time.time() - start) % 60 < 1:
                current_state = data.get("state", "None") # None일 경우 None 출력

                # 상세 대기 로그 출력
                print(f"🔍 [AI 대기] Job ID: {job_id} | State: {current_state} | 남은 예상: {wait_time}s / 대기열: {queue}")

                last_queue = queue
                last_wait_time = wait_time

            # 대기 중임을 확인했으므로 루프를 계속합니다.
            continue

        # 3. 시간 초과
        print(f"\n⏰ [AI 타임아웃] Job ID: {job_id} - 대기 시간 초과 ({max_wait}s)")
        raise HTTPException(status_code=504, detail="AI image generation timed out.")


    # ------------------------------------------------------------------
    # ✅ [최종 수정] 핵심 성장 로직 (evolve_character) (유지)
    # ------------------------------------------------------------------
    def evolve_character(self, request: GrowthRequestVO) -> Tuple[Optional[Dict[str, Any]], str]:
        """캐릭터 성장, AI 이미지 생성, DB 성장 기록(tb_growth)을 처리합니다."""
        try:
            print("--- 1. [로그] 캐릭터 정보 조회 시도 (DB) ---")
            # 1. 캐릭터 현재 상태 조회
            growth_data = self.character_dao.get_growth_info(request.user_id, request.character_id)
            if growth_data is None:
                self.db.rollback()
                return None, "Character not found or does not belong to the user."

            current_step = growth_data['EVOLUTION_STEP']
            total_clear = growth_data['TOTAL_STAGE_CLEARS']

            # 2. ~ 3. 성장 가능 조건 검토 (로직 유지)
            if current_step >= MAX_EVOLUTION_STEP:
                self.db.rollback()
                return None, "Character is already at max evolution stage."
            required_clear = REQUIRED_CLEARS.get(current_step, float('inf'))
            if total_clear < required_clear:
                self.db.rollback()
                return None, f"Insufficient clear count. Requires {required_clear} to reach step {current_step + 1}, current is {total_clear}."

            # 4. 스탯 증가분 계산 및 다음 단계 설정 (로직 유지)
            inc_attack = random.randint(*GROWTH_INCREMENT_RANGE)
            inc_defense = random.randint(*GROWTH_INCREMENT_RANGE)
            inc_hp = random.randint(*GROWTH_INCREMENT_RANGE)
            inc_speed = random.randint(*GROWTH_INCREMENT_RANGE)
            inc_critical_rate = random.randint(*GROWTH_INCREMENT_RANGE)
            new_step = current_step + 1

            # 4.1. [AI 이미지 생성] (로직 유지)
            print("--- 2. [로그] 이미지 다운로드 및 Base64 인코딩 시도 ---")
            current_image_url = growth_data['CURRENT_IMAGE_URL']
            if current_image_url.startswith('/'):
                # Java 서버 주소 (8080)를 사용하여 절대 경로로 만듭니다.
                current_image_url = f"http://localhost:8080{current_image_url}"
            input_b64 = _download_and_encode_image(current_image_url)
            print("--- 3. [로그] AI 작업 제출 직전 (Horde API) ---")

            mod_type = request.target_modification
            mod = MODIFICATIONS.get(mod_type)

            if not mod:
                # 요청된 modification 키가 유효하지 않으면 오류 반환
                self.db.rollback()
                return None, f"AI modification type '{mod_type}' is invalid or not defined."

            job_id = self._submit_job(mod["base_prompt"], mod["negative_prompt"], input_b64)
            print(f"--- 4. [로그] AI 작업 제출 성공. Job ID: {job_id}. 결과 대기 시작 ---")
            ai_result = self._fetch_result(job_id)

            # 4.2. [새 이미지 ID 조회] 단계 제거:
            # 해당 로직이 'tb_image'에 EVOLUTION_STEP 컬럼이 없어 오류를 발생시켰으므로 제거합니다.
            print(f"--- 4.5. [로그] 새 이미지 ID 조회 로직 제거. Java 백엔드에서 처리 예정 ---")
            # new_image_info = self.character_dao.get_image_data_by_step(new_step) # ❌ 제거
            # new_image_id = new_image_info['IMAGE_ID'] # ❌ 제거


            # 5. [DB 업데이트]
            print("--- 5. [로그] DB 업데이트 (성장 기록만) 시도 ---")

            # 5.1. tb_growth에 능력치 증가분 기록 (tb_growth에만 데이터 삽입)
            new_growth_record = GrowthModel(
                character_id=request.character_id,
                user_id=request.user_id,
                increment_attack=inc_attack, increment_defense=inc_defense, increment_hp=inc_hp,
                increment_speed=inc_speed, increment_critical_rate=inc_critical_rate
            )
            if not self.character_dao.insert_new_growth_record(new_growth_record):
                self.db.rollback()
                return None, "Failed to record new growth data to tb_growth."

            # 5.3. 최종 커밋 (tb_growth 기록만 커밋)
            self.db.commit()


            # 6. 최종 결과 반환 객체 생성 및 반환 (Java 백엔드에 전달)
            new_total_attack = growth_data['BASE_ATTACK'] + growth_data['TOTAL_INCREMENT_ATTACK'] + inc_attack
            new_total_defense = growth_data['BASE_DEFENSE'] + growth_data['TOTAL_INCREMENT_DEFENSE'] + inc_defense
            new_total_hp = growth_data['BASE_HP'] + growth_data['TOTAL_INCREMENT_HP'] + inc_hp
            new_total_speed = growth_data['BASE_SPEED'] + growth_data['TOTAL_INCREMENT_SPEED'] + inc_speed
            new_total_critical_rate = growth_data['BASE_CRITICAL_RATE'] + growth_data['TOTAL_INCREMENT_CRATE'] + inc_critical_rate

            return {
                "status": "success",
                "image_base64": ai_result['image_base64'],
                "image_format": ai_result['image_format'],
                "user_id": request.user_id,
                "character_id": request.character_id,
                "new_evolution_step": new_step, # 💡 새 진화 단계 정보는 Java 백엔드에 전달
                "total_stage_clear_count": total_clear,
                "new_total_attack": new_total_attack,
                "new_total_defense": new_total_defense,
                "new_total_hp": new_total_hp,
                "new_total_speed": new_total_speed,
                "new_total_critical_rate": new_total_critical_rate,
                "increment_attack": inc_attack,
                "increment_defense": inc_defense,
                "increment_hp": inc_hp,
                "increment_speed": inc_speed,
                "increment_critical_rate": inc_critical_rate
            }, "Success"

        except HTTPException as e:
            self.db.rollback()
            return None, e.detail
        except Exception as e:
            print(f"🚨 캐릭터 성장 중 예외 발생: {e}")
            self.db.rollback()
            return None, "Internal server error during growth process."
