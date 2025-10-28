# 🐾 2nd Project — AI 기반 캐릭터 성장형 웹 애플리케이션

> **“당신의 캐릭터가 스스로 성장하는 세계”**  
> AI를 활용한 캐릭터 생성, 성장, 전투, 커뮤니티가 결합된 웹 플랫폼  
> **Spring Boot + React + FastAPI + YOLOv8 + GPT + DALL·E 3 + Gemini + Stable Diffusion**

---

## 🎯 프로젝트 개요

이 프로젝트는 사용자가 직접 만든 캐릭터를 중심으로  
**AI 기반 성장, 전투, 커뮤니티 활동**이 이루어지는 **통합형 웹 애플리케이션**입니다.  

단순한 캐릭터 꾸미기를 넘어,  
AI가 생성한 캐릭터와 함께 **PVE / PVP 대전**, **퀘스트 수행**,  
**미니게임**, **AI 대화 시스템**, **상점**, **커뮤니티** 기능이 제공됩니다.

---

## 🧩 주요 기능 요약

| 구분 | 기능 |
|------|------|
| 🎨 **AI 캐릭터 생성** | DALL·E 3 + Stable Diffusion 기반의 이미지 생성 및 저장 |
| 🧠 **AI 캐릭터 대화** | ChatGPT 기반의 자연어 캐릭터 대화 기능 |
| ⚔️ **PVE / PVP 대전** | AI 판단 기반 전투 결과, 로그 저장, 승패 기록 |
| 🪄 **캐릭터 성장 시스템** | 경험치, 스탯, 아이템, 퀘스트 기반 성장 로직 |
| 🕹️ **미니게임 모듈** | 반응속도 테스트 / 기억력 퍼즐 / 타이핑 배틀 / AI 토론배틀 |
| 🗣️ **AI 토론배틀** | 두 캐릭터의 토론 후 GPT·Gemini·Claude 3 모델 3심제 평가 |
| 🛒 **상점 시스템** | 캐릭터 부화권 및 아이템 구매, 인벤토리 관리 |
| 💬 **커뮤니티 / 게시판** | 사용자 간 정보 공유 및 캐릭터 자랑 |
| 🔒 **회원 / 캐릭터 관리** | JWT 인증 기반 로그인, 캐릭터별 상태 동기화 |

---

## 🧱 기술 스택

| 영역 | 사용 기술 |
|------|------------|
| **Frontend** | React, TailwindCSS, Axios, React Router |
| **Backend** | Spring Boot, JPA, MySQL, JWT |
| **AI Server** | FastAPI, YOLOv8, DALL·E 3, Stable Diffusion, GPT API, Gemini |
| **collaboration tools** | Discord, Kakao, GitHub |

---

## 🚀 실행 환경 설정

> 자세한 실행 방법 및 개발 환경 구성은  
> 👉 [📄 실행환경 구성 가이드 (README.md)](./README/README.md)  
> 에서 확인할 수 있습니다.

---

## 👥 팀원 소개

> 각 팀원별 담당 기능 및 기술 설명은 아래 개인 문서에서 확인할 수 있습니다.

| [![박수민](https://github.com/psm0419.png?size=100)](https://github.com/psm0419) | [![박은희](https://github.com/dmsgml7476.png?size=100)](https://github.com/dmsgml7476) | [![박현재](https://github.com/pnow7.png?size=100)](https://github.com/pnow7) | [![정예진](https://github.com/zcx1119son.png?size=100)](https://github.com/zcx1119son) |
|:--:|:--:|:--:|:--:|
| **[박수민](https://github.com/psm0419)**<br>팀장 / 풀스택 | **[박은희](https://github.com/dmsgml7476)**<br>팀원 / 풀스택 | **[박현재](https://github.com/pnow7)**<br>팀원 / 풀스택 | **[정예진](https://github.com/zcx1119son)**<br>팀원 / AI 서버 |
| (작성 예정) | (작성 예정) | [개인 문서 →](./README/phj/README.md) | (작성 예정) |

---

## 🌈 프로젝트 방향성

이 프로젝트는 단순한 AI 기술 실험을 넘어  
“**사용자와 AI 캐릭터의 감정적 교류**”를 중심으로 설계되었습니다.  

AI가 만든 캐릭터가 성장하고, 플레이어와 대화하며,  
다른 유저와의 경쟁과 협동을 통해 진화하는 **AI 생태계 게임 플랫폼**을 목표로 합니다.

---

## 🧭 향후 개선 계획

- AI 캐릭터의 감정 상태 시각화 (표정 / 음성 / 상태 변화)
- 멀티플레이어 실시간 대전 (WebSocket)
- AI 캐릭터 간 관계 네트워크 시스템
- 모바일 최적화 및 반응형 인터페이스 강화

---

> © 2025. AI Character Growth Project Team. All rights reserved.
