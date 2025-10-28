# ⚙️ 실행환경 구성 가이드 (Development Environment Setup)

> 이 문서는 프로젝트를 로컬 환경에서 실행하기 위한 서버, 프론트엔드, AI 서버 구성 방법을 안내합니다.
> `.env` 등 민감한 환경 변수 설정은 포함되어 있지 않습니다.

---

## 🧩 전체 구조

| 구분 | 기술 스택 | 주요 기능 | 포트 |
|------|-------------|------------|------|
| Frontend | React, TailwindCSS | UI, 사용자 상호작용 | 3000 |
| Backend | Spring Boot, JPA, MySQL, JWT | 인증, 전투, 성장 로직 | 8080 |
| AI 생성 서버 | FastAPI, DALL·E 3, Stable Diffusion | 캐릭터 이미지 생성 | 8000 |
| 성장 제어 서버 | FastAPI | 캐릭터 성장 및 제어 로직 | 8001 |

---

## 🧠 AI 캐릭터 이미지 생성 서버 (Port 8000)

이 서버는 DALL·E 3 / Stable Diffusion / YOLOv8 모델을 이용해
사용자가 입력한 프롬프트로 캐릭터 이미지를 생성합니다.

1. 디렉토리 이동

```bash
cd ai_server
```

2. 가상 환경 생성

```bash
python -m venv venv
```

3. 가상 환경 활성화

```bash
venv\Scripts\activate # Windows
source venv/bin/activate # Mac / Linux
```

4. 의존성 설치

```bash
pip install -r requirements.txt
```

5. 서버 실행

```bash
uvicorn model_server:app --reload --port 8000
```

---

## 🌱 캐릭터 성장 제어 서버 (Port 8001)

이 서버는 캐릭터의 경험치, 퀘스트, 전투 승패 결과에 따른
성장 로직 및 상태 업데이트를 담당합니다.

1. 디렉토리 이동

```bash
cd growth_ai_server
```

2. 가상 환경 설정 및 실행 (통합)

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn controller.main:app --reload --host 0.0.0.0 --port 8001
```

---

## 💻 프론트엔드 (React)

1. 디렉토리 이동

```bash
cd frontend
```

2. 의존성 설치

```bash
npm install
```

3. 실행

```bash
npm start
```

> 기본 실행 주소: http://localhost:3000

---

## 🧱 백엔드 (Spring Boot)

1. 서버 실행

```bash
./gradlew bootRun
```

> 기본 실행 주소: http://localhost:8080

---

## 🧪 통합 실행 순서 요약

1. React 프론트엔드 실행 → Port **3000**
2. Spring Boot 백엔드 실행 → Port **8080**
3. AI 이미지 생성 서버 실행 → Port **8000**
4. 성장 서버 실행 → Port **8001**

---

## ⚡ 개발 환경 버전 정보

| 항목 | 권장 버전 |
|------|------------|
| Node.js | v20+ |
| Python | 3.10+ |
| Java | 17 |
| Gradle | 8.5+ |
| MySQL | 8.0+ |

---

> 참고:
> 환경 설정 관련 세부 내용 및 .env 파일 키값은 보안을 위해 별도 문서에서 관리됩니다.

[⬅ 메인 README로 돌아가기](../README.md)