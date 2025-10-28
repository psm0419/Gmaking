# 🐾 2nd Project

> AI 기반 캐릭터 생성 및 성장형 웹 애플리케이션  
> Spring Boot + React + YOLOv8 + FastAPI + GPT + DALL·E 3 + Gemini + Stable Diffusion 기반 통합 프로젝트

---

## 📖 Table of Contents
1. [실행 환경 설정 (Development Environment Setup)](#-실행-환경-설정-development-environment-setup)
2. [유저 기능](#-유저-기능)
3. [캐릭터 생성 기능](#-캐릭터-생성-기능)
4. [공지사항 기능](#-공지사항-기능)
5. [관리자 페이지](#-관리자-페이지)
6. [기술 스택](#-기술-스택)

---

## ⚙️ 실행 환경 설정 (Development Environment Setup)

`.env` 등 민감한 환경 변수 설정은 제외하고, 프로젝트를 로컬에서 실행하기 위한 서버 및 프론트엔드의 설정 및 구동 방법을 안내합니다.

---

### 🧠 캐릭터 이미지 생성 서버 (Port 8000)

이 서버는 **FastAPI** 기반으로 캐릭터 이미지 생성 관련 기능을 담당합니다.

1. **디렉토리 이동**
   ```bash
   cd ai_server
   ```
2. **의존성 설치**
   ```bash
   pip install -r requirements.txt
   ```
3. **서버 실행**
   ```bash
   uvicorn model_server:app --reload --port 8000
   ```

---

### 🌱 캐릭터 성장 관련 서버 (Port 8001)

이 서버는 캐릭터 성장 로직 및 제어를 담당합니다.

1. **디렉토리 이동**
   ```bash
   cd growth_ai_server
   ```
2. **의존성 설치**
   ```bash
   pip install -r requirements.txt
   ```
3. **가상 환경 생성**
   ```bash
   python -m venv venv
   ```
4. **서버 실행**
   ```bash
   uvicorn controller.main:app --reload --host 0.0.0.0 --port 8001
   ```

---

## 💻 프론트엔드 설정

1. **디렉토리 이동**
   ```bash
   cd frontend
   ```
2. **의존성 설치**
   ```bash
   npm install
   ```
3. **실행**
   ```bash
   npm start
   ```

---

## 🔐 유저 기능

- **소셜 로그인**: 구글, 네이버, 카카오 연동  
- **JWT 인증**: 로그인 시 토큰 생성 및 Local Storage 저장  
- **이메일 인증(SMTP)**: SMTP 서버를 이용한 이메일 인증 기능 구현  
  - 회원가입, 아이디 찾기, 비밀번호 찾기 시 인증 진행  
  - 회원 탈퇴 시 1차 이메일 인증 + 비밀번호 입력 후 탈퇴  
- **보안 강화**: 모든 주요 요청에서 JWT 및 이메일 인증 절차 적용

---

## 🧬 캐릭터 생성 기능

- **AI 통신 구조**
  - FastAPI ↔ 백엔드 서버 간 통신  
  - YOLOv8 모델로 동물 분류 → `predictedAnimal` (`penguin`, `bear`, `eagle`, `turtle`)  
  - GPT DALL·E 3 API와 조합하여 캐릭터 생성  

- **데이터 저장**
  - *시도 단계*: DB 미저장, Google Cloud 임시 저장  
  - *최종 생성*: DB + Google Cloud 저장  

- **생성 규칙**
  - 지원 동물: 곰, 독수리, 펭귄, 거북이  
  - 페이지 진입 시 **부화권 1개 차감**  
  - **시도 3회 제한**, **되돌리기 불가**

- **사용자 흐름**
  1. 사진 업로드  
  2. 캐릭터 이름 지정  
  3. (선택) 프롬프트 작성 여부 선택  
  4. “캐릭터 생성하기” 클릭  
  5. 결과 확인 후 재시도 가능  
  6. “최종생성” 클릭 시 DB + Cloud 저장  

---

## 📢 공지사항 기능

- **JWT 기반 권한 제어**
  - `role`이 `ADMIN`인 사용자만 작성/수정/삭제 가능
- **게시글 관리**
  - 공지 등록, 수정, 삭제 가능  
  - **최상단 고정 기능** 지원  

---

## 🛠️ 관리자 페이지

- **관리 항목**
  - 사용자 / 인벤토리 / 구매내역 / 캐릭터 / 상품 / 게시글 / 신고 / 몬스터 관리  
- **기술 특징**
  - 모든 DB 데이터 **CRUD 구현**  
  - **페이징 처리 완료** (대용량 대응)

---

## 🧩 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React, TailwindCSS |
| Backend | Spring Boot, JPA, MyBatis |
| AI Server | FastAPI, YOLOv8, GPT, DALL·E 3 |
| DB | MySQL, Google Cloud Storage |
| Auth | JWT, OAuth2 (Google/Naver/Kakao) |
| Infra | Docker, Nginx (optional) |
