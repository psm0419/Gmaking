-- ====================================================================
-- 1. TB_ADVERTISEMENT (광고 테이블)
-- ====================================================================
CREATE TABLE TB_ADVERTISEMENT
(
    AD_ID          VARCHAR(50)    NOT NULL PRIMARY KEY COMMENT '광고 ID',
    AD_NAME        VARCHAR(100)   NOT NULL COMMENT '광고 이름',
    AD_TYPE        VARCHAR(10)    NOT NULL COMMENT '광고 유형',
    AD_LOCATION    VARCHAR(50)    NOT NULL COMMENT '노출위치',
    MEDIA_URL      VARCHAR(255)   NOT NULL COMMENT '미디어 URL/ID',
    LINK_URL       VARCHAR(255) COMMENT '연결 URL',
    VIDEO_DURATION DECIMAL(10, 0) NOT NULL DEFAULT 0 COMMENT '영상 길이',
    START_DATE     DATE           NOT NULL COMMENT '시작 일자',
    END_DATE       DATE COMMENT '종료 일자',
    SORT_ORDER     DECIMAL(10, 0) NOT NULL DEFAULT 0 COMMENT '정렬 순서',
    IS_ACTIVE      CHAR(1)        NOT NULL DEFAULT 'Y' COMMENT '활성화 여부',
    CREATED_DATE   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY     VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE   DATETIME COMMENT '수정 일자',
    UPDATED_BY     VARCHAR(50) COMMENT '수정자'
) COMMENT='광고 관련';

-- ====================================================================
-- 2. TB_AI_USAGE_LOG (AI 토큰 사용량 로그 테이블)
-- ====================================================================
CREATE TABLE TB_AI_USAGE_LOG
(
    USAGE_LOG_ID  DECIMAL(10, 0) NOT NULL PRIMARY KEY COMMENT '로그 ID',
    USER_ID       VARCHAR(50)    NOT NULL COMMENT '사용자 ID',
    FEATURE_TYPE  VARCHAR(20)    NOT NULL COMMENT '기능 유형',
    INPUT_TOKENS  DECIMAL(10, 0) NOT NULL DEFAULT 0 COMMENT '입력 토큰 수',
    OUTPUT_TOKENS DECIMAL(10, 0) NOT NULL DEFAULT 0 COMMENT '출력 토큰 수',
    TOTAL_COST    DECIMAL(10, 0) NOT NULL DEFAULT 0 COMMENT '예상 비용',
    LOG_DATE      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '기록 일시',
    CREATED_DATE  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY    VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE  DATETIME COMMENT '수정 일자',
    UPDATED_BY    VARCHAR(50) COMMENT '수정자'
) COMMENT='AI 토큰 사용량 로그 정보';

-- ====================================================================
-- 3. TB_BATTLE_ACTION (턴별 전투 로그 테이블)
-- ====================================================================
CREATE TABLE TB_BATTLE_ACTION
(
    ACTION_ID    DECIMAL(10, 0) NOT NULL PRIMARY KEY COMMENT '액션 ID',
    BATTLE_ID    VARCHAR(50)    NOT NULL COMMENT '전투 ID',
    COMMAND_ID   VARCHAR(50) COMMENT '커맨드 ID',
    TURN_NUMBER  DECIMAL(10, 0) NOT NULL COMMENT '턴 번호',
    ACTOR_TYPE   VARCHAR(10)    NOT NULL COMMENT '행위자 유형: CHARACTER, MONSTER, OPPONENT',
    DAMAGE_DEALT DECIMAL(10, 0) NOT NULL DEFAULT 0 COMMENT '가한 피해량',
    GPT_MESSAGE  VARCHAR(4000) COMMENT 'GPT 메시지',
    ACTION_DATE  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '발생 일시',
    CREATED_DATE DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY   VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE DATETIME COMMENT '수정 일자',
    UPDATED_BY   VARCHAR(50) COMMENT '수정자'
) COMMENT='턴별 전투 로그 정보';

-- ====================================================================
-- 4. TB_BATTLE_LOG (배틀 로그 테이블)
-- ====================================================================
CREATE TABLE TB_BATTLE_LOG
(
    BATTLE_ID    VARCHAR(50)    NOT NULL PRIMARY KEY COMMENT '배틀 ID',
    CHARACTER_ID VARCHAR(50)    NOT NULL COMMENT '캐릭터 ID',
    BATTLE_TYPE  VARCHAR(10)    NOT NULL COMMENT '전투 유형: PVE',
    OPPONENT_ID  VARCHAR(50)    NOT NULL COMMENT '상대방 ID (PVP: 상대방 ID, PVE: 몬스터 ID)',
    IS_WIN       CHAR(1)        NOT NULL DEFAULT 'N' COMMENT '승리 여부: Y: 승리, N: 패배',
    TURN_COUNT   DECIMAL(20, 0) NOT NULL DEFAULT 0 COMMENT '최종 턴 수',
    CREATED_DATE DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY   VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE DATETIME COMMENT '수정 일자',
    UPDATED_BY   VARCHAR(50) COMMENT '수정자'
) COMMENT='배틀 로그 정보';

-- ====================================================================
-- 5. TB_CHARACTER (캐릭터 기본 정보 테이블)
-- ====================================================================
CREATE TABLE TB_CHARACTER
(
    CHARACTER_ID             VARCHAR(50) NOT NULL PRIMARY KEY COMMENT '캐릭터 ID',
    USER_ID                  VARCHAR(50) NOT NULL COMMENT '사용자 ID',
    IMAGE_ID                 VARCHAR(50) NOT NULL COMMENT '캐릭터 이미지 ID',
    CHARACTER_PERSONALITY_ID VARCHAR(50) NOT NULL COMMENT '캐릭터 성격 ID',
    CHARACTER_NAME           VARCHAR(50) NOT NULL UNIQUE KEY COMMENT '캐릭터 이름',
    GRADE_ID                 INT(5) NOT NULL COMMENT '캐릭터 등급',
    TOTAL_STAGE_CLEARS       INT(10) NOT NULL COMMENT '총 클리어 횟수',
    EVOLUTION_STEP           INT(5) NOT NULL COMMENT '현재 진화 단계',
    CREATED_DATE             DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY               VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE             DATETIME COMMENT '수정 일자',
    UPDATED_BY               VARCHAR(50) COMMENT '수정자'
) COMMENT='캐릭터 정보';

-- ====================================================================
-- 6. TB_CHARACTER_PERSONALITY (캐릭터 성격 테이블)
-- ====================================================================
CREATE TABLE TB_CHARACTER_PERSONALITY
(
    CHARACTER_PERSONALITY_ID INT NOT NULL PRIMARY KEY COMMENT '성격 ID',
    PERSONALITY_DESCRIPTION  VARCHAR(255) COMMENT '설명'
) COMMENT='캐릭터 성격 정보';

-- ====================================================================
-- 7. TB_CHARACTER_STAT (캐릭터 스탯 테이블 - 이름 충돌 해결)
-- ====================================================================
CREATE TABLE TB_CHARACTER_STAT
(
    CHARACTER_ID      VARCHAR(50) NOT NULL PRIMARY KEY COMMENT '캐릭터 ID',
    CHARACTER_HP      INT(100) NOT NULL COMMENT '캐릭터 체력',
    CHARACTER_ATTACK  INT(100) NOT NULL COMMENT '캐릭터 공격력',
    CHARACTER_DEFENSE INT(100) NOT NULL COMMENT '캐릭터 방어력',
    CHARACTER_SPEED   INT(5) NOT NULL COMMENT '캐릭터 속도',
    CRITICAL_RATE     INT(100) NOT NULL COMMENT '크리티컬 확률',
    CREATED_DATE      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY        VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE      DATETIME COMMENT '수정 일자',
    UPDATED_BY        VARCHAR(50) COMMENT '수정자'
) COMMENT='캐릭터 스탯 정보';

-- ====================================================================
-- 8. TB_COMMAND (커맨드 테이블)
-- ====================================================================
CREATE TABLE TB_COMMAND
(
    COMMAND_ID          VARCHAR(50) NOT NULL PRIMARY KEY COMMENT '커맨드 ID',
    COMMAND_TYPE        VARCHAR(20) NOT NULL COMMENT '커맨드 유형',
    COMMAND_DESCRIPTION VARCHAR(255) COMMENT '커맨드 설명',
    CREATED_DATE        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY          VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE        DATETIME COMMENT '수정 일자',
    UPDATED_BY          VARCHAR(50) COMMENT '수정자'
) COMMENT='커맨드 정보';

-- ====================================================================
-- 9. TB_COMMUNITY_LIKE (커뮤니티 좋아요 기록 테이블)
-- ====================================================================
CREATE TABLE TB_COMMUNITY_LIKE
(
    USER_ID      VARCHAR(50)    NOT NULL COMMENT '사용자 ID',
    POST_ID      DECIMAL(10, 0) NOT NULL COMMENT '게시글 ID',
    LOG_DATE     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '기록 일시',
    CREATED_DATE DATETIME                DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY   VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE DATETIME COMMENT '수정 일자',
    UPDATED_BY   VARCHAR(50) COMMENT '수정자',
    PRIMARY KEY (USER_ID, POST_ID)
) COMMENT='커뮤니티 좋아요 기록 정보';

-- ====================================================================
-- 10. TB_COMMUNITY_POST (커뮤니티 게시글 테이블)
-- ====================================================================
CREATE TABLE TB_COMMUNITY_POST
(
    POST_ID       DECIMAL(10, 0) NOT NULL PRIMARY KEY COMMENT '게시글 ID',
    USER_ID       VARCHAR(50)    NOT NULL COMMENT '작성자 ID',
    CATEGORY_CODE VARCHAR(20)    NOT NULL COMMENT '게시판 구분 코드',
    TITLE         VARCHAR(255)   NOT NULL COMMENT '제목',
    CONTENT       VARCHAR(4000)  NOT NULL COMMENT '내용',
    VIEW_COUNT    DECIMAL(10, 0) NOT NULL DEFAULT 0 COMMENT '조회수',
    LIKE_COUNT    DECIMAL(10, 0) NOT NULL DEFAULT 0 COMMENT '좋아요 수',
    IS_DELETED    CHAR(1)        NOT NULL DEFAULT 'N' COMMENT '삭제 여부',
    CREATED_DATE  DATETIME                DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY    VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE  DATETIME COMMENT '수정 일자',
    UPDATED_BY    VARCHAR(50) COMMENT '수정자'
) COMMENT='커뮤니티 게시글 정보';

-- ====================================================================
-- 11. TB_COMMUNITY_REPORT (커뮤니티 신고 기록 테이블)
-- ====================================================================
CREATE TABLE TB_COMMUNITY_REPORT
(
    REPORT_ID          DECIMAL(10, 0) NOT NULL PRIMARY KEY COMMENT '신고 ID',
    USER_ID            VARCHAR(50)    NOT NULL COMMENT '신고자 ID',
    TARGET_TYPE        VARCHAR(20)    NOT NULL COMMENT '신고 대상 유형',
    TARGET_ID          VARCHAR(50)    NOT NULL COMMENT '시고 대상 ID',
    REPORT_REASON_CODE VARCHAR(20) COMMENT '신고 사유 코드',
    DETAIL_REASON      VARCHAR(4000) COMMENT '상세 사유',
    REPORT_STATUS      VARCHAR(20)    NOT NULL COMMENT '처리 상태',
    REPORT_DATE        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '신고 일시',
    PROCESS_DATE       DATETIME COMMENT '처리 일시',
    CREATED_DATE       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY         VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE       DATETIME COMMENT '수정 일자',
    UPDATED_BY         VARCHAR(50) COMMENT '수정자'
) COMMENT='커뮤니티 신고 기록 정보';

-- ====================================================================
-- 12. TB_DIALOGUE (AI/ 캐릭터 대화 기록 테이블)
-- ====================================================================
CREATE TABLE TB_DIALOGUE
(
    DIALOGUE_ID     DECIMAL(10, 0) NOT NULL PRIMARY KEY COMMENT '대화 ID',
    USER_ID         VARCHAR(50)    NOT NULL COMMENT '사용자 ID',
    CHARACTER_ID    VARCHAR(50)    NOT NULL COMMENT '캐릭터 ID',
    SPEAKER_TYPE    VARCHAR(10)    NOT NULL COMMENT '화자 유형: AI(CHARACTER), USER',
    MESSAGE_CONTENT VARCHAR(4000)  NOT NULL COMMENT '메시지 내용',
    CONTEXT_TAG     VARCHAR(50) COMMENT '대화 맥락 태그',
    LOG_DATE        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '기록 일시',
    CREATED_DATE    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY      VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE    DATETIME COMMENT '수정 일자',
    UPDATED_BY      VARCHAR(50) COMMENT '수정자'
) COMMENT='AI/ 캐릭터 대화 기록 정보';

-- ====================================================================
-- 13. TB_GROWTH_RULE (성장 규칙 테이블)
-- ====================================================================
CREATE TABLE TB_GROWTH_RULE
(
    RULE_ID               VARCHAR(50)    NOT NULL PRIMARY KEY COMMENT '성장 규칙 ID',
    MINIGAME_ID           VARCHAR(50) COMMENT '미니게임 ID',
    IMAGE_ID              VARCHAR(50) COMMENT '진화 이미지 ID',
    REQUIRED_CLEARS       DECIMAL(10, 0) NOT NULL DEFAULT 0 COMMENT '필요 클리어 횟수',
    TARGET_EVOLUTION_STEP DECIMAL(10, 0) COMMENT '목표 진화 단계',
    CREATED_DATE          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY            VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE          DATETIME COMMENT '수정 일자',
    UPDATED_BY            VARCHAR(50) COMMENT '수정자'
) COMMENT='성장 규칙 정보';

-- ====================================================================
-- 14. TB_IMAGE (이미지 테이블)
-- ====================================================================
CREATE TABLE TB_IMAGE
(
    IMAGE_ID     INT(50) NOT NULL PRIMARY KEY COMMENT '이미지 ID',
    IMAGE_NAME   VARCHAR(100) NOT NULL COMMENT '이미지 주소',
    IMAGE_TYPE   INT(100) NOT NULL COMMENT '이미지 타입',
    CREATED_DATE DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY   VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE DATETIME COMMENT '수정 일자',
    UPDATED_BY   VARCHAR(50) COMMENT '수정자'
) COMMENT='이미지 정보';

-- ====================================================================
-- 15. TB_MINI_GAME (미니 게임 테이블)
-- ====================================================================
CREATE TABLE TB_MINI_GAME
(
    MINI_GAME_ID          VARCHAR(50)  NOT NULL PRIMARY KEY COMMENT '미니 게임 ID',
    MINI_GAME_NAME        VARCHAR(100) NOT NULL COMMENT '미니 게임 이름',
    MINI_GAME_DESCRIPTION VARCHAR(255) COMMENT '미니 게임 설명',
    CREATED_DATE          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY            VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE          DATETIME COMMENT '수정 일자',
    UPDATED_BY            VARCHAR(50) COMMENT '수정자'
) COMMENT='미니 게임 정보';

-- ====================================================================
-- 16. TB_MINI_GAME_RESULT (미니 게임 결과 테이블)
-- ====================================================================
CREATE TABLE TB_MINI_GAME_RESULT
(
    MINI_GAME_RESULT_ID VARCHAR(50) NOT NULL PRIMARY KEY COMMENT '미니 게임 결과 ID',
    MINI_GAME_ID        VARCHAR(50) NOT NULL COMMENT '미니 게임 ID',
    CHARACTER_ID        VARCHAR(50) NOT NULL COMMENT '캐릭터 ID',
    BONUS_HP            INT         NOT NULL DEFAULT 0 COMMENT '추가 체력',
    BONUS_ATTACK        INT         NOT NULL DEFAULT 0 COMMENT '추가 공격력',
    BONUS_DEFENCE       INT         NOT NULL DEFAULT 0 COMMENT '추가 방어력',
    BONUS_SPEED         INT         NOT NULL DEFAULT 0 COMMENT '추가 스피드',
    CREATED_DATE        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY          VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE        DATETIME COMMENT '수정 일자',
    UPDATED_BY          VARCHAR(50) COMMENT '수정자'
) COMMENT='미니 게임 결과 정보';

-- ====================================================================
-- 17. TB_MONSTER (몬스터 테이블)
-- ====================================================================
CREATE TABLE TB_MONSTER
(
    MONSTER_ID            VARCHAR(50)  NOT NULL PRIMARY KEY COMMENT '몬스터 ID',
    IMAGE_ID              VARCHAR(50)  NOT NULL COMMENT '이미지 ID',
    MONSTER_NAME          VARCHAR(100) NOT NULL COMMENT '몬스터 이름',
    MONSTER_TYPE          VARCHAR(20)  NOT NULL DEFAULT 'NORMAL' COMMENT '몬스터 유형: NOMAL, BOSS',
    MONSTER_HP            INT          NOT NULL COMMENT '몬스터 체력',
    MONSTER_ATTACK        INT          NOT NULL COMMENT '몬스터 공격력',
    MONSTER_DEFENSE       INT          NOT NULL COMMENT '몬스터 방어력',
    MONSTER_CRITICAL_RATE INT COMMENT '몬스터 크리티컬 확률',
    CREATED_DATE          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY            VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE          DATETIME COMMENT '수정 일자',
    UPDATED_BY            VARCHAR(50) COMMENT '수정자'
) COMMENT='몬스터 정보';

-- ====================================================================
-- 18. TB_PAYMENT (결제 기록 테이블)
-- ====================================================================
CREATE TABLE TB_PAYMENT
(
    PAYMENT_ID     VARCHAR(100)   NOT NULL PRIMARY KEY COMMENT '결제 ID',
    USER_ID        VARCHAR(50)    NOT NULL COMMENT '사용자 ID',
    PRODUCT_ID     VARCHAR(50)    NOT NULL COMMENT '상품 ID',
    AMOUNT         DECIMAL(10, 0) NOT NULL DEFAULT 0 COMMENT '결제 금액',
    PAYMENT_STATUS VARCHAR(20)    NOT NULL DEFAULT 'PENDING' COMMENT '결제 상태',
    PAYMENT_METHOD VARCHAR(50) COMMENT '결제 수단',
    PAYMENT_DATE   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '결제 일시',
    CREATED_DATE   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY     VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE   DATETIME COMMENT '수정 일자',
    UPDATED_BY     VARCHAR(50) COMMENT '수정자'
) COMMENT='결제 기록 정보';

-- ====================================================================
-- 19. TB_PERSONA (페르소나 테이블)
-- ====================================================================
CREATE TABLE TB_PERSONA
(
    PERSONA_ID               VARCHAR(50)   NOT NULL PRIMARY KEY COMMENT '페르소나 ID',
    CHARACTER_ID             VARCHAR(50) COMMENT '캐릭터 ID',
    USER_ID                  VARCHAR(100)  NOT NULL COMMENT '유저 아이디',
    INSTRUCTION_PROMPT       VARCHAR(4000) NOT NULL COMMENT 'GPT 지시 프롬프트',
    BACKGROUND_INFO          VARCHAR(4000) COMMENT '배경 정보',
    CHARACTER_PERSONALITY_ID INT           NOT NULL COMMENT '성격',
    CREATED_DATE             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY               VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE             DATETIME COMMENT '수정 일자',
    UPDATED_BY               VARCHAR(50) COMMENT '수정자'
) COMMENT='페르소나 정보';

-- ====================================================================
-- 20. TB_PRODUCT (상품 테이블)
-- ====================================================================
CREATE TABLE TB_PRODUCT
(
    PRODUCT_ID    VARCHAR(10)    NOT NULL PRIMARY KEY COMMENT '상품 ID',
    PRODUCT_NAME  VARCHAR(100)   NOT NULL COMMENT '상품명',
    PRODUCT_TYPE  VARCHAR(20)    NOT NULL COMMENT '상품 유형: 뽑기권, 광고제거',
    PRICE         DECIMAL(10, 0) NOT NULL DEFAULT 0 COMMENT '가격',
    CURRENCY_TYPE VARCHAR(10)    NOT NULL DEFAULT 'KRW' COMMENT '통화 유형',
    IS_SALE       CHAR(1)        NOT NULL DEFAULT 'Y' COMMENT '판매 여부',
    CREATED_DATE  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY    VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE  DATETIME COMMENT '수정 일자',
    UPDATED_BY    VARCHAR(50) COMMENT '수정자'
) COMMENT='상품 정보';

-- ====================================================================
-- 21. TB_RANKING (랭킹 테이블)
-- ====================================================================
CREATE TABLE TB_RANKING
(
    RANKING_ID   DECIMAL(10, 0) NOT NULL PRIMARY KEY COMMENT '랭킹 ID',
    USER_ID      VARCHAR(50)    NOT NULL COMMENT '사용자 ID',
    RANKING_TYPE VARCHAR(20)    NOT NULL COMMENT '랭킹 유형',
    SCORE        DECIMAL(10, 0) NOT NULL DEFAULT 0 COMMENT '점수 / 기준 값',
    RANK_VALUE   DECIMAL(10, 0) NOT NULL COMMENT '현재 순위',
    REFRESH_DATE DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '갱신 일자',
    CREATED_DATE DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY   VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE DATETIME COMMENT '수정 일자',
    UPDATED_BY   VARCHAR(50) COMMENT '수정자'
) COMMENT='랭킹 정보';

-- ====================================================================
-- 22. TB_USER (사용자 테이블)
-- ====================================================================
CREATE TABLE TB_USER
(
    USER_ID       VARCHAR(50)  NOT NULL PRIMARY KEY COMMENT '사용자 ID',
    USER_NAME     VARCHAR(100) NOT NULL COMMENT '사용자 이름',
    USER_EMAIL    VARCHAR(100) NOT NULL UNIQUE KEY COMMENT '인증 및 알림용 이메일',
    IS_EMAIL_VERIFIED CHAR(1) NOT NULL DEFAULT 'N' COMMENT '이메일 인증 완료 여부 (Y/N)',
    USER_PASSWORD VARCHAR(255) NOT NULL COMMENT '사용자 비밀번호',
    USER_NICKNAME VARCHAR(50)  NOT NULL UNIQUE KEY COMMENT '유저 닉네임',
    IMAGE_ID      INT COMMENT '프로필 이미지',
    CREATED_DATE  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    ROLE          VARCHAR(20) COMMENT '유저타입 구분'
) COMMENT='사용자 정보';

-- ====================================================================
-- 23. TB_USER_EMAIL_VERIFY (이메일 인증 테이블)
-- ====================================================================
CREATE TABLE TB_USER_EMAIL_VERIFY
(
    USER_ID      VARCHAR(50)  NOT NULL PRIMARY KEY COMMENT '사용자 ID',
    VERIFY_ID    VARCHAR(50)  NOT NULL AUTO_INCREMENT COMMENT '인증 ID',
    EMAIL        VARCHAR(100) NOT NULL COMMENT '이메일 주소',
    VERIFY_CODE  VARCHAR(100) NOT NULL COMMENT '인증 코드',
    EXPIRY_DATE  DATETIME     NOT NULL COMMENT '만료 일시',
    IS_VERIFIED  CHAR(1)      NOT NULL DEFAULT 'N' COMMENT '인증 성공 여부',
    CREATED_DATE DATETIME COMMENT '생성 일자',
    CREATED_BY   VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE DATETIME COMMENT '수정일자',
    UPDATED_BY   VARCHAR(50) COMMENT '수정자'
) COMMENT='이메일 인증 정보';


-- ====================================================================
-- 24. TB_USER_PRODUCT (유저 상품/재화 테이블)
-- ====================================================================
CREATE TABLE TB_USER_PRODUCT
(
    USER_PRODUCT_ID DECIMAL(10, 0) NOT NULL PRIMARY KEY COMMENT '유저 상품 ID',
    USER_ID         VARCHAR(50)    NOT NULL COMMENT '사용자 ID',
    PRODUCT_ID      VARCHAR(50)    NOT NULL COMMENT '상품 ID',
    QUANTITY        DECIMAL(10, 0) NOT NULL DEFAULT 0 COMMENT '보유 수량',
    CREATED_DATE    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY      VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE    DATETIME COMMENT '수정 일자',
    UPDATED_BY      VARCHAR(50) COMMENT '수정자'
) COMMENT='유저 상품/재화 정보';