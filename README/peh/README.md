# 🧑‍💻 팀원 박은희 (겜만중 프로젝트)

> **역할:** 팀원 / 풀스택 개발자 / 채팅 AI 및 도우미 서비스 담당  
> **담당:** 마이페이지, 상점 페이지, 결제 시스템, 알림 시스템, 회원정보 수정, 채팅 서비스, 도우미 봇  

---

## 📚 Table of Contents
1. [AI 언어 모델 기반 핵심 서비스 (채팅 AI 및 도우미 봇)](#1-ai-언어-모델-기반-핵심-서비스-채팅-ai-및-도우미-봇)
2. [주요 사용자 기능 구현 (마이페이지, 상점, 알림 시스템)](#2-주요-사용자-기능-구현-마이페이지-상점-알림-시스템)
3. [기술 스택 및 환경 (AI--Backend)](#3-기술-스택-및-환경-ai--backend)
4. [프로젝트 회고 및 성장](#4-프로젝트-회고-및-성장)

---

## 1️⃣ AI 언어 모델 기반 핵심 서비스

박은희 팀원은 사용자와 캐릭터 간의 자연스러운 상호작용을 담당하는 **채팅 AI**와,  
서비스 이용 관련 질의응답을 지원하는 **도우미 봇**을 구현했습니다.

---

### 🧠 1-1. AI 채팅 서비스 (캐릭터 대화)

사용자가 캐릭터와 대화할 때 **일관성 있는 페르소나와 기억력**을 유지하도록  
LLM 프롬프트 구조를 정교하게 설계했습니다.

| 구분 | 내용 |
|------|------|
| **사용 모델** |  |
| 메인 모델 | **Gemini 2.0 Flash**<br/>- 실시간 응답 속도 최적화 및 멀티모달(Multi-modal) 지원<br/>- 자연스러운 한국어 대화 성능<br/>- 무료 사용량 200회/일 제공 |
| 보조/Fallback 모델 | **GPT-4o-mini**<br/>- Gemini 2.0 Flash 모델의 과부하(429) 및 서버 오류(500/503) 발생 시<br/>  안정성 확보를 위한 폴백(Fallback) 구조 |
| **LLM 계층 구조** | `GeminiClientSdkImpl (primary)` → `ChatGptClientSdkImpl (backup)` → `FallbackLlmClient` |
| **프롬프트 구조** | System Prompt(캐릭터 성격·말투) + 기억 구조(History, Conversation Summary, Long Memory) + 유저 메시지 조합 |
| **기억 관리** | • **중기 기억 (Conversation Summary)**: 대화가 길어지면 요약해 비용 및 혼동 감소<br/>• **장기 기억 (Long Memory)**: 사용자의 선호·비선호·일정 등 장기적 사실을 추출하여 DB 저장 및 재주입 |
| **운영 스케줄러** | 매일 00:00에 닫힌 대화방(TB_DIALOGUE) 삭제 후, 대화 요약을 TB_CONVERSATION_SUMMARY에 저장하여 DB 부하 최소화 |

---

### 🤖 1-2. 도우미 봇 (RAG 기반 QA 시스템)

서비스 사용법에 대한 질문에 응답하기 위해 **RAG (Retrieval-Augmented Generation)** 시스템을 구축했습니다.

- **구조 목표:**  
  별도의 인프라 없이 RAG 전 과정을 **Spring Boot 서버 내부**에서 운영하는 **경량화된 구조**를 설계했습니다.

- **RAG 구성**
  - **데이터 소스:** 서비스 가이드, 회원가입/로그인, 스토리 생성 등 11개의 `.md` 가이드 문서  
  - **임베딩 모델:** `OpenAI text-embedding-3-small` (문서를 벡터화하여 의미 기반 검색 수행)  
  - **LLM 모델:** `OpenAI GPT-4o-mini` (질문과 상위 K개의 청크를 받아 자연스러운 답변 생성)  
  - **Vector DB:** MySQL 기반 `tb_rag_embedding_chunk` 테이블, LangChain4j Vector Store 사용  
  - **RAG 파이프라인:** `GuidesIndexer` → `MysqlRetriever` → `GuideService`  

- **기술적 특징**
  - 가이드 문서 근거 기반 응답으로 **환각(Hallucination) 최소화**  
  - MySQL 기반의 **경량형 RAG 설계**로 비용 효율 및 응답 속도 개선  

---

## 2️⃣ 주요 사용자 기능 구현

박은희 팀원은 **마이페이지**, **상점 페이지**, **알림 시스템** 등  
사용자 경험 전반의 핵심 기능을 담당했습니다.

| 기능 구분 | 주요 구현 내용 |
|------------|----------------|
| **마이페이지** | - 사용자 프로필, 캐릭터 목록 관리<br/>- WebSocket 기반 **실시간 알림**<br/>- 회원정보 수정 기능|
| **상점 페이지** | - 광고 제거 패스, 부화기 패키지 등 아이템 설계 및 노출<br/>- 상품별 결제 모듈 연동 |
| **결제 시스템** | - PortOne(Iamport) 기반 결제 연동<br/>- 결제 완료 후 인벤토리(`incubatorCount`, `adFree`) 갱신|
| **회원 관리** | - 회원 정보 수정 API 및 화면 구현<br/>
| **알림 시스템** | - STOMP(WebSocket) 기반 실시간 알림 구조 설계<br/>- 주요 PVP에 대해 자동 푸시 알림 전송<br/>- `NotificationService` 인터페이스 |
| **스케줄러 사용** | - 스케줄러 사용하여 무료 부화권 지급<br/>- 스케줄러 사용하여 다이얼로그 관리 |

---

## 3️⃣ 기술 스택 및 환경 (AI / Backend)

| 구분 | 기술 스택 |
|------|-------------|
| **Frontend** | React, TailwindCSS, JavaScript, Swiper, Framer Motion |
| **Backend** | Spring Boot 3.x, Java 17, MyBatis, WebSocket, Scheduler |
| **AI** | Gemini 2.0 Flash, GPT-4o-mini, LangChain4j RAG |
| **DB** | MySQL (`tb_rag_embedding_chunk` 포함) |
| **Auth** | JWT, OAuth2 |
| **Payment** | PortOne (Iamport) |
| **Infra** | IntelliJ, VSCode, Gradle, Node.js 22 |

---

## 4️⃣ 프로젝트 회고 및 성장

박은희 팀원은 본 프로젝트를 통해 다음과 같은 성장을 경험했습니다.

1. **AI 모델의 깊은 이해**  
   단순한 API 호출을 넘어, 각 모델의 특성과 제약을 분석하여  
   **서비스 환경에 최적화된 설계**의 중요성을 깨달았습니다.

2. **RAG vs Fine-tuning 전략적 선택**  
   초기에는 `TinyLlama` 기반 Fine-tuning을 시도했으나  
   제한된 데이터로 도메인 특화 응답이 어려움을 확인했습니다.  
   이후 **RAG 기반 구조**로 전환하여 **비용 효율성과 품질**을 동시에 확보했습니다.  
   → TinyLlama SFT 실험은 약 14개 메시지 샘플로 학습하였으며, 과적합 및 도메인 일관성 부족을 직접 검증했습니다.

3. **아키텍처 분석 능력 향상**  
   트렌드에 휩쓸리지 않고 **프로젝트 조건에 맞는 최적의 AI 구조**를  
   직접 분석하고 설계함으로써, 개발자로서의 **문제 해결 역량**을 강화했습니다.

---

[⬅ 메인 README로 돌아가기](../../README.md)
