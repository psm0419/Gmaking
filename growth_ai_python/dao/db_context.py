import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import re
from pathlib import Path

# =================================================================
# 1. .env 파일 경로 지정 및 로드
# =================================================================
# 현재 파일(db_context.py) 위치
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DOTENV_PATH = PROJECT_ROOT / "backend" / "gmaking" / ".env"

# 경로 디버깅 출력: 이 경로가 터미널에 올바르게 출력되는지 확인하세요.
print(f"DEBUG: .env 파일 검색 경로: {DOTENV_PATH}")

# 지정된 경로에서 .env 파일 로드 시도
try:
    load_dotenv(dotenv_path=DOTENV_PATH)
except Exception as e:
    print(f"DEBUG: .env 파일 로드 중 오류 발생: {e}")


# =================================================================
# 2. 환경 변수 로드 및 유효성 검사
# =================================================================
DB_URL = os.getenv("DB_URL")
DB_USERNAME = os.getenv("DB_USERNAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")

# 유효성 검사 (변수 로드 확인)
if not DB_URL or not DB_USERNAME or not DB_PASSWORD:
    raise EnvironmentError(
        f"`.env` 파일에 DB 변수가 설정되지 않았습니다. "
        f"경로: {DOTENV_PATH} | DB_URL: {DB_URL}. 파일 위치와 내용을 확인하세요."
    )

# =================================================================
# 3. JDBC URL을 SQLAlchemy URL로 변환 및 파싱
# =================================================================
# JDBC URL 형식: jdbc:mysql://host:port/dbname?params

query_params_segment = ""
if '?' in DB_URL:
    try:
        # '?' 뒤의 쿼리 파라미터 추출
        query_params = DB_URL.split('?', 1)[1]

        # --- [중요 수정] serverTimezone과 characterEncoding 옵션 제거 ---
        # 쿼리 파라미터를 '&'로 분리하여 불필요한 옵션 제거
        filtered_params = []
        for param in query_params.split('&'):
            # serverTimezone 또는 characterEncoding으로 시작하는 매개변수를 제외합니다.
            if not param.startswith('serverTimezone=') and \
                    not param.startswith('characterEncoding='):
                filtered_params.append(param)

        # 필터링된 파라미터를 다시 연결
        if filtered_params:
            query_params_segment = f"?{'&'.join(filtered_params)}"

        # 호스트/포트/DB_NAME 부분 추출 ('jdbc:mysql://'와 '?' 사이)
        host_port_db = DB_URL.split('jdbc:mysql://', 1)[1].split('?', 1)[0]
    except IndexError:
        host_port_db = DB_URL.replace("jdbc:mysql://", "")
else:
    # 쿼리 파라미터가 없는 경우
    host_port_db = DB_URL.replace("jdbc:mysql://", "")

# SQLAlchemy용 URL 문자열 구성
# 형식: mysql+pymysql://user:pass@host:port/dbname?params
SQLALCHEMY_DATABASE_URL = (
    f"mysql+pymysql://{DB_USERNAME}:{DB_PASSWORD}@{host_port_db}{query_params_segment}"
)

# =================================================================
# 4. SQLAlchemy 엔진 및 세션 설정
# =================================================================
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_recycle=3600
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db_session_local():
    return SessionLocal()