-- =========================================================================================
-- TB_ADVERTISEMENT (광고 테이블)
-- =========================================================================================
CREATE TABLE TB_ADVERTISEMENT
(
    AD_ID          INT    NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '광고 ID',
    AD_NAME        VARCHAR(100)   NOT NULL COMMENT '광고 이름',
    AD_TYPE        VARCHAR(10)    NOT NULL COMMENT '광고 유형',
    AD_LOCATION    VARCHAR(50)    NOT NULL COMMENT '노출위치',
    MEDIA_URL      VARCHAR(255)   NOT NULL COMMENT '미디어 URL/ID',
    LINK_URL       VARCHAR(255) COMMENT '연결 URL',
    VIDEO_DURATION INT            NOT NULL DEFAULT 0 COMMENT '영상 길이',
    START_DATE     DATE           NOT NULL COMMENT '시작 일자',
    END_DATE       DATE COMMENT '종료 일자',
    SORT_ORDER     INT            NOT NULL DEFAULT 0 COMMENT '정렬 순서',
    IS_ACTIVE      CHAR(1)        NOT NULL DEFAULT 'Y' COMMENT '활성화 여부',
    CREATED_DATE   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY     VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE   DATETIME COMMENT '수정 일자',
    UPDATED_BY     VARCHAR(50) COMMENT '수정자'
) COMMENT='광고 관련';

-- =========================================================================================
-- TB_AI_USAGE_LOG (AI 토큰 사용량 로그 테이블 - 상세 버전 채택 및 USER_ID 타입 통일)
-- =========================================================================================
CREATE TABLE TB_AI_USAGE_LOG (
  USAGE_LOG_ID INT NOT NULL AUTO_INCREMENT,
  USER_ID VARCHAR(50) DEFAULT NULL,
  FEATURE_TYPE VARCHAR(50) NOT NULL,
  MODEL_NAME VARCHAR(100) NOT NULL,
  INPUT_TOKEN INT NOT NULL DEFAULT 0,
  OUTPUT_TOKEN INT NOT NULL DEFAULT 0,
  TOTAL_COST INT DEFAULT NULL,
  REQUEST_COUNT INT DEFAULT NULL,
  USAGE_STATUS ENUM('success','quota_exceeded','error') DEFAULT 'success',
  ERROR_MESSAGE TEXT,
  LOG_DATE DATE DEFAULT NULL,
  CREATED_DATE DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
  CREATED_BY VARCHAR(50) DEFAULT NULL COMMENT '생성자',
  UPDATED_DATE DATETIME DEFAULT NULL COMMENT '수정 일자',
  UPDATED_BY VARCHAR(50) DEFAULT NULL COMMENT '수정자',
  PRIMARY KEY (USAGE_LOG_ID),
  UNIQUE KEY UQ_AI_USAGE_DAY (USER_ID, FEATURE_TYPE, MODEL_NAME, LOG_DATE)
) COMMENT='AI 토큰 사용량 로그 정보';


-- =========================================================================================
-- TB_BATTLE_ACTION (턴별 전투 로그 테이블)
-- =========================================================================================
CREATE TABLE TB_BATTLE_ACTION
(
    ACTION_ID    INT            NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '액션 ID',
    BATTLE_ID    INT            NOT NULL COMMENT '전투 ID',
    COMMAND_ID   INT COMMENT '커맨드 ID',
    TURN_NUMBER  INT            NOT NULL COMMENT '턴 번호',
    ACTOR_TYPE   VARCHAR(10)    NOT NULL COMMENT '행위자 유형: CHARACTER, MONSTER, OPPONENT',
    DAMAGE_DEALT INT            NOT NULL DEFAULT 0 COMMENT '가한 피해량',
    GPT_MESSAGE  TEXT COMMENT 'GPT 메시지',
    ACTION_DATE  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '발생 일시',
    CREATED_DATE DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY   VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE DATETIME COMMENT '수정 일자',
    UPDATED_BY   VARCHAR(50) COMMENT '수정자'
) COMMENT='턴별 전투 로그 정보';

-- =========================================================================================
-- TB_BATTLE_LOG (배틀 로그 테이블)
-- =========================================================================================
CREATE TABLE TB_BATTLE_LOG
(
    BATTLE_ID    INT    NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '배틀 ID',
    CHARACTER_ID INT    NOT NULL COMMENT '캐릭터 ID',
    BATTLE_TYPE  VARCHAR(10)    NOT NULL COMMENT '전투 유형: PVE',
    OPPONENT_ID  INT    NOT NULL COMMENT '상대방 ID (PVP: 상대방 ID, PVE: 몬스터 ID)',
    IS_WIN       CHAR(1)        NOT NULL DEFAULT 'N' COMMENT '승리 여부: Y: 승리, N: 패배',
    TURN_COUNT   BIGINT         NOT NULL DEFAULT 0 COMMENT '최종 턴 수',
    CREATED_DATE DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY   VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE DATETIME COMMENT '수정 일자',
    UPDATED_BY   VARCHAR(50) COMMENT '수정자'
) COMMENT='배틀 로그 정보';

-- =========================================================================================
-- TB_TURN_LOG  (전투 턴별 상세 로그 테이블)
-- =========================================================================================

CREATE TABLE TB_TURN_LOG (
    TURN_LOG_ID   INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '턴 로그 ID',
    BATTLE_ID     INT NOT NULL COMMENT '배틀 ID (TB_BATTLE_LOG 참조)',
    TURN_NUMBER   INT NOT NULL COMMENT '턴 번호',
    ACTION_DETAIL TEXT NOT NULL COMMENT '턴별 상세 로그',
    CREATED_DATE  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자'
) COMMENT='전투 턴별 상세 로그';

-- =========================================================================================
-- TB_CHARACTER (캐릭터 테이블)
-- =========================================================================================
CREATE TABLE TB_CHARACTER
(
    CHARACTER_ID             INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '캐릭터 ID',
    USER_ID                  VARCHAR(50) NOT NULL COMMENT '사용자 ID',
    IMAGE_ID                 VARCHAR(50) NOT NULL COMMENT '캐릭터 이미지 ID',
    CHARACTER_PERSONALITY_ID INT NOT NULL COMMENT '캐릭터 성격 ID',
    CHARACTER_NAME           VARCHAR(50) NOT NULL UNIQUE KEY COMMENT '캐릭터 이름',
    BACKGROUND_INFO          TEXT COMMENT '배경 정보',
    GRADE_ID                 INT NOT NULL COMMENT '캐릭터 등급',
    TOTAL_STAGE_CLEARS       INT NOT NULL COMMENT '총 클리어 횟수',
    EVOLUTION_STEP           INT NOT NULL COMMENT '현재 진화 단계',
    CREATED_DATE             DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY               VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE             DATETIME COMMENT '수정 일자',
    UPDATED_BY               VARCHAR(50) COMMENT '수정자'
) COMMENT='캐릭터 정보';

-- =========================================================================================
-- TB_CHARACTER_PERSONALITY (캐릭터 성격 테이블)
-- =========================================================================================
CREATE TABLE TB_CHARACTER_PERSONALITY
(
    CHARACTER_PERSONALITY_ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '성격 ID',
    PERSONALITY_DESCRIPTION  VARCHAR(255) COMMENT '설명'
) COMMENT='캐릭터 성격 정보';

-- =========================================================================================
-- TB_CHARACTER_STAT (캐릭터 능력치 테이블)
-- =========================================================================================
CREATE TABLE TB_CHARACTER_STAT
(
    CHARACTER_ID      INT NOT NULL PRIMARY KEY COMMENT '캐릭터 ID',
    CHARACTER_HP      INT NOT NULL COMMENT '캐릭터 체력',
    CHARACTER_ATTACK  INT NOT NULL COMMENT '캐릭터 공격력',
    CHARACTER_DEFENSE INT NOT NULL COMMENT '캐릭터 방어력',
    CHARACTER_SPEED   INT NOT NULL COMMENT '캐릭터 속도',
    CRITICAL_RATE     INT NOT NULL COMMENT '크리티컬 확률',
    CREATED_DATE      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY        VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE      DATETIME COMMENT '수정 일자',
    UPDATED_BY        VARCHAR(50) COMMENT '수정자'
) COMMENT='캐릭터 능력치 정보';

-- =========================================================================================
-- TB_COMMAND (커맨드 테이블)
-- =========================================================================================
CREATE TABLE TB_COMMAND
(
    COMMAND_ID          INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '커맨드 ID',
    COMMAND_TYPE        VARCHAR(20) NOT NULL COMMENT '커맨드 유형',
    COMMAND_DESCRIPTION VARCHAR(255) COMMENT '커맨드 설명',
    CREATED_DATE        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY          VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE        DATETIME COMMENT '수정 일자',
    UPDATED_BY          VARCHAR(50) COMMENT '수정자'
) COMMENT='커맨드 정보';

-- =========================================================================================
-- TB_COMMUNITY_LIKE (커뮤니티 좋아요 기록 테이블)
-- =========================================================================================
CREATE TABLE TB_COMMUNITY_LIKE
(
    USER_ID      VARCHAR(50)    NOT NULL COMMENT '사용자 ID',
    POST_ID      INT NOT NULL COMMENT '게시글 ID',
    LOG_DATE     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '기록 일시',
    CREATED_DATE DATETIME       DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY   VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE DATETIME COMMENT '수정 일자',
    UPDATED_BY   VARCHAR(50) COMMENT '수정자',
    PRIMARY KEY (USER_ID, POST_ID)
) COMMENT='커뮤니티 좋아요 기록 정보';

-- =========================================================================================
-- TB_COMMUNITY_POST (커뮤니티 게시글 테이블)
-- =========================================================================================
CREATE TABLE TB_COMMUNITY_POST
(
    POST_ID       INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '게시글 ID',
    USER_ID       VARCHAR(50)    NOT NULL COMMENT '작성자 ID',
    CATEGORY_CODE VARCHAR(20)    NOT NULL COMMENT '게시판 구분 코드',
    TITLE         VARCHAR(255)   NOT NULL COMMENT '제목',
    CONTENT       TEXT  NOT NULL COMMENT '내용',
    VIEW_COUNT    INT NOT NULL DEFAULT 0 COMMENT '조회수',
    LIKE_COUNT    INT NOT NULL DEFAULT 0 COMMENT '좋아요 수',
    IS_DELETED    CHAR(1)        NOT NULL DEFAULT 'N' COMMENT '삭제 여부',
    CREATED_DATE  DATETIME       DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY    VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE  DATETIME COMMENT '수정 일자',
    UPDATED_BY    VARCHAR(50) COMMENT '수정자'
) COMMENT='커뮤니티 게시글 정보';

-- =========================================================================================
-- TB_COMMUNITY_REPORT (커뮤니티 신고 기록 테이블)
-- =========================================================================================
CREATE TABLE TB_COMMUNITY_REPORT
(
    REPORT_ID          INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '신고 ID',
    USER_ID            VARCHAR(50)    NOT NULL COMMENT '신고자 ID',
    TARGET_TYPE        VARCHAR(20)    NOT NULL COMMENT '신고 대상 유형',
    TARGET_ID          VARCHAR(50)    NOT NULL COMMENT '신고 대상 ID',
    REPORT_REASON_CODE VARCHAR(20) COMMENT '신고 사유 코드',
    DETAIL_REASON      TEXT COMMENT '상세 사유',
    REPORT_STATUS      VARCHAR(20)    NOT NULL COMMENT '처리 상태',
    REPORT_DATE        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '신고 일시',
    PROCESS_DATE       DATETIME COMMENT '처리 일시',
    CREATED_DATE       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY         VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE       DATETIME COMMENT '수정 일자',
    UPDATED_BY         VARCHAR(50) COMMENT '수정자'
) COMMENT='커뮤니티 신고 기록 정보';

-- =========================================================================================
-- TB_CONVERSATION (대화 세션 테이블 - USER_ID, CHARACTER_ID 타입 VARCHAR로 수정)
-- =========================================================================================
CREATE TABLE TB_CONVERSATION (
  CONVERSATION_ID INT NOT NULL AUTO_INCREMENT,
  USER_ID VARCHAR(50) DEFAULT NULL,
  CHARACTER_ID INT NOT NULL,
  CREATED_DATE DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
  CREATED_BY VARCHAR(50) DEFAULT NULL COMMENT '생성자',
  UPDATED_DATE DATETIME DEFAULT NULL COMMENT '수정 일자',
  UPDATED_BY VARCHAR(50) DEFAULT NULL COMMENT '수정자',
  STATUS ENUM('OPEN','CLOSED','ARCHIVED') NOT NULL DEFAULT 'OPEN' COMMENT '대화 상태',
  IS_FIRST_MEET TINYINT(1) NOT NULL DEFAULT 1 COMMENT '첫 인사 단계 여부',
  CALLING_NAME VARCHAR(50) DEFAULT NULL COMMENT '사용자 호칭(NULL이면 마스터)',
  DELAY_LOG_CLEAN TINYINT(1) NOT NULL DEFAULT 0 COMMENT '지연 삭제 플래그',
  PRIMARY KEY (CONVERSATION_ID),
  KEY IDX_CONV_USER_CHAR_STATUS (USER_ID, CHARACTER_ID, STATUS)
) COMMENT='대화방목록';

-- =========================================================================================
-- TB_DIALOGUE (대화 메시지 테이블)
-- =========================================================================================
CREATE TABLE TB_DIALOGUE (
  MESSAGE_ID INT NOT NULL AUTO_INCREMENT COMMENT '메시지 아이디',
  CONVERSATION_ID INT NOT NULL COMMENT '대화방 아이디',
  SENDER ENUM('user','character','system') NOT NULL COMMENT '메시지 발송자',
  CONTENT TEXT NOT NULL COMMENT '메시지 내용',
  CHAT_DATE DATE NOT NULL COMMENT '대화한 날',
  CREATED_DATE DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
  CREATED_BY VARCHAR(50) DEFAULT NULL COMMENT '생성자',
  UPDATED_DATE DATETIME DEFAULT NULL COMMENT '수정 일자',
  UPDATED_BY VARCHAR(50) DEFAULT NULL COMMENT '수정자',
  PRIMARY KEY (MESSAGE_ID),
  KEY IX_DIALOGUE_CONV (CONVERSATION_ID)
)


-- =========================================================================================
-- TB_CONVERSATION_SUMMARY (대화 요약 테이블)
-- =========================================================================================
CREATE TABLE TB_CONVERSATION_SUMMARY (
  CONVERSATION_ID INT NOT NULL COMMENT '대화방 ID (1방=1행 롤링)',
  ROLLING_SUMMARY TEXT NOT NULL COMMENT '최근 맥락 1장 요약(600~800자 권장)',
  SUMMARY_VERSION INT NOT NULL DEFAULT 1 COMMENT '요약 수정 회차',
  LAST_TURN_ID INT DEFAULT NULL COMMENT '마지막 반영된 턴/메시지 ID',
  LENGTH_CHARS INT DEFAULT NULL COMMENT '요약 길이(모니터링용)',
  UPDATED_BY VARCHAR(50) DEFAULT NULL COMMENT '최근 갱신자',
  UPDATED_DATE DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '최근 갱신 시각',
  PRIMARY KEY (CONVERSATION_ID),
  KEY IDX_SUMMARY_UPDATED (UPDATED_DATE)
) COMMENT='대화 요약(Recent): 진행 중 매 턴 덮어쓰기. 프롬프트에는 항상 이 1장만 사용';


-- =========================================================================================
-- TB_LONG_MEMORY (장기 기억 테이블)
-- =========================================================================================
CREATE TABLE TB_LONG_MEMORY (
  MEMORY_ID INT NOT NULL AUTO_INCREMENT COMMENT 'PK',
  USER_ID VARCHAR(50) NOT NULL COMMENT '유저 ID',
  CHARACTER_ID INT DEFAULT NULL COMMENT '캐릭터 ID (전역 선호면 NULL)',
  TYPE ENUM('PROFILE','PREFERENCE','FACT','GOAL','CORRECTION','STYLE') NOT NULL COMMENT '메모리 유형',
  SUBJECT VARCHAR(100) NOT NULL COMMENT '주제 키 (예: tone, relationship, goal 등)',
  VALUE TEXT NOT NULL COMMENT '1~2문장 요약(200~300자 권장)',
  STRENGTH TINYINT NOT NULL DEFAULT 1 COMMENT '중요도/확신(1~5)',
  LAST_USED_AT DATETIME DEFAULT NULL COMMENT '최근 프롬프트 사용 시각',
  FIRST_SEEN_AT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '최초 생성 시각',
  SOURCE_CONV_ID INT DEFAULT NULL COMMENT '유래한 대화방 ID',
  UPDATED_BY VARCHAR(50) DEFAULT NULL COMMENT '최근 갱신자',
  UPDATED_DATE DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '최근 갱신 시각',
  PRIMARY KEY (MEMORY_ID),
  UNIQUE KEY UQ_LTM (USER_ID, CHARACTER_ID, TYPE, SUBJECT),
  KEY IDX_LTM_USER_CHAR (USER_ID, CHARACTER_ID),
  KEY IDX_LTM_LAST_USED (LAST_USED_AT),
  KEY IDX_LTM_STRENGTH (STRENGTH)
) COMMENT='LTM: 사용자/캐릭터별 지속 규칙·선호·정정·목표';

-- =========================================================================================
-- TB_GROWTH_RULE (성장 규칙 테이블)
-- =========================================================================================
CREATE TABLE TB_GROWTH_RULE
(
    RULE_ID               INT    NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '성장 규칙 ID',
    MINIGAME_ID           VARCHAR(50) COMMENT '미니게임 ID',
    IMAGE_ID              VARCHAR(50) COMMENT '진화 이미지 ID',
    REQUIRED_CLEARS       INT NOT NULL DEFAULT 0 COMMENT '필요 클리어 횟수',
    TARGET_EVOLUTION_STEP INT COMMENT '목표 진화 단계',
    CREATED_DATE          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY            VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE          DATETIME COMMENT '수정 일자',
    UPDATED_BY            VARCHAR(50) COMMENT '수정자'
) COMMENT='성장 규칙 정보';

-- =========================================================================================
-- TB_IMAGE (이미지 테이블 - INT AUTO_INCREMENT 및 VARCHAR 타입 통일)
-- =========================================================================================
CREATE TABLE TB_IMAGE
(
    IMAGE_ID     INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '이미지 ID',
    IMAGE_ORIGINAL_NAME   VARCHAR(100) NOT NULL COMMENT '원본 이미지 이름',
    IMAGE_ADDRESS   VARCHAR(100) NOT NULL COMMENT '이미지 주소',
    IMAGE_NAME   VARCHAR(100) NOT NULL COMMENT '서버에 저장된 이미지 이름',
    IMAGE_TYPE   INT NOT NULL COMMENT '0: profile 1: character 2: monster',
    CREATED_DATE DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY   VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE DATETIME COMMENT '수정 일자',
    UPDATED_BY   VARCHAR(50) COMMENT '수정자'
) COMMENT='이미지 정보';

-- =========================================================================================
-- TB_LONG_MEMORY (장기 기억 테이블)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS TB_LONG_MEMORY (
  MEMORY_ID        INT AUTO_INCREMENT PRIMARY KEY COMMENT 'PK',
  USER_ID          VARCHAR(50)   NOT NULL COMMENT '유저 ID',
  CHARACTER_ID     INT           NULL COMMENT '캐릭터 ID (전역 선호면 NULL)',
  TYPE             ENUM('PROFILE','PREFERENCE','FACT','GOAL','CORRECTION','STYLE') NOT NULL COMMENT '메모리 유형',
  SUBJECT          VARCHAR(100)  NOT NULL COMMENT '주제 키(예: tone, relationship, goal 등)',
  VALUE            TEXT          NOT NULL COMMENT '1~2문장 요약(200~300자 권장)',
  STRENGTH         TINYINT       NOT NULL DEFAULT 1 COMMENT '중요도/확신(1~5)',
  LAST_USED_AT     DATETIME      NULL COMMENT '최근 프롬프트 사용 시각',
  FIRST_SEEN_AT    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '최초 생성 시각',
  SOURCE_CONV_ID   INT           NULL COMMENT '유래한 대화방 ID(선택)',
  UPDATED_BY       VARCHAR(50)   NULL COMMENT '최근 갱신자',
  UPDATED_DATE     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '최근 갱신 시각',
  CONSTRAINT uq_ltm UNIQUE (USER_ID, CHARACTER_ID, TYPE, SUBJECT),
  INDEX idx_ltm_user_char (USER_ID, CHARACTER_ID),
  INDEX idx_ltm_last_used (LAST_USED_AT),
  INDEX idx_ltm_strength (STRENGTH)
) ENGINE=InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT='LTM: 사용자/캐릭터별 지속 규칙·선호·정정·목표. 동일 주제는 업서트로 덮어씀';


-- =========================================================================================
-- TB_CONVERSATION_SUMMARY (대화 요약)
-- =========================================================================================

CREATE TABLE IF NOT EXISTS TB_CONVERSATION_SUMMARY (
  CONVERSATION_ID  INT        NOT NULL PRIMARY KEY COMMENT '대화방 ID (1방=1행 롤링)',
  ROLLING_SUMMARY  TEXT       NOT NULL COMMENT '최근 맥락 1장 요약(600~800자 권장)',
  SUMMARY_VERSION  INT        NOT NULL DEFAULT 1 COMMENT '요약 수정 회차(선택)',
  LAST_TURN_ID     INT        NULL COMMENT '마지막 반영된 턴/메시지 ID(선택)',
  LENGTH_CHARS     INT        NULL COMMENT 'ROLLING_SUMMARY 길이(모니터링용)',
  UPDATED_BY       VARCHAR(50) NULL COMMENT '최근 갱신자',
  UPDATED_DATE     DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '최근 갱신 시각',
  INDEX idx_summary_updated (UPDATED_DATE)
) ENGINE=InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT='대화 요약(Recent): 진행 중 매 턴 덮어쓰기. 프롬프트에는 항상 이 1장만 사용';

-- =========================================================================================
-- TB_MINI_GAME (미니 게임 테이블)
-- =========================================================================================
CREATE TABLE TB_MINI_GAME
(
    MINI_GAME_ID          INT  NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '미니 게임 ID',
    MINI_GAME_NAME        VARCHAR(100) NOT NULL COMMENT '미니 게임 이름',
    MINI_GAME_DESCRIPTION VARCHAR(255) COMMENT '미니 게임 설명',
    CREATED_DATE          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY            VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE          DATETIME COMMENT '수정 일자',
    UPDATED_BY            VARCHAR(50) COMMENT '수정자'
) COMMENT='미니 게임 정보';

-- =========================================================================================
-- TB_MINI_GAME_RESULT (미니 게임 결과 테이블)
-- =========================================================================================
CREATE TABLE TB_MINI_GAME_RESULT
(
    MINI_GAME_RESULT_ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '미니 게임 결과 ID',
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

-- =========================================================================================
-- TB_MONSTER (몬스터 테이블)
-- =========================================================================================
CREATE TABLE TB_MONSTER
(
    MONSTER_ID            INT  NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '몬스터 ID',
    IMAGE_ID              INT NOT NULL COMMENT '이미지 ID',
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

-- =========================================================================================
-- TB_PAYMENT (결제 기록 테이블)
-- =========================================================================================
CREATE TABLE TB_PAYMENT
(
    PAYMENT_ID     INT   NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '결제 ID',
    USER_ID        VARCHAR(50)    NOT NULL COMMENT '사용자 ID',
    PRODUCT_ID     VARCHAR(50)    NOT NULL COMMENT '상품 ID',
    AMOUNT         INT NOT NULL DEFAULT 0 COMMENT '결제 금액',
    PAYMENT_STATUS VARCHAR(20)    NOT NULL DEFAULT 'PENDING' COMMENT '결제 상태',
    PAYMENT_METHOD VARCHAR(50) COMMENT '결제 수단',
    PAYMENT_DATE   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '결제 일시',
    CREATED_DATE   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY     VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE   DATETIME COMMENT '수정 일자',
    UPDATED_BY     VARCHAR(50) COMMENT '수정자'
) COMMENT='결제 기록 정보';

-- =========================================================================================
-- TB_PERSONA (페르소나 테이블 - CHARACTER_ID 타입 VARCHAR로 수정)
-- =========================================================================================
CREATE TABLE TB_PERSONA (
  PERSONA_ID INT NOT NULL AUTO_INCREMENT,
  CHARACTER_ID INT NOT NULL,
  INSTRUCTION_PROMPT TEXT,
  CREATED_DATE DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
  CREATED_BY VARCHAR(50) DEFAULT NULL COMMENT '생성자',
  UPDATED_DATE DATETIME DEFAULT NULL COMMENT '수정 일자',
  UPDATED_BY VARCHAR(50) DEFAULT NULL COMMENT '수정자',
  PRIMARY KEY (PERSONA_ID)
) COMMENT='페르소나 테이블';

-- =========================================================================================
-- TB_PRODUCT (상품 테이블)
-- =========================================================================================
CREATE TABLE TB_PRODUCT (
  PRODUCT_ID INT NOT NULL AUTO_INCREMENT COMMENT '상품 ID',
  PRODUCT_NAME VARCHAR(100) NOT NULL COMMENT '상품명',
  PRODUCT_TYPE VARCHAR(20) NOT NULL COMMENT '상품 유형: 뽑기권, 광고제거',
  PRICE INT NOT NULL DEFAULT 0 COMMENT '가격',
  CURRENCY_TYPE VARCHAR(10) NOT NULL DEFAULT 'KRW' COMMENT '통화 유형',
  IS_SALE CHAR(1) NOT NULL DEFAULT 'Y' COMMENT '판매 여부',
  CREATED_DATE DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
  CREATED_BY VARCHAR(50) DEFAULT NULL COMMENT '생성자',
  UPDATED_DATE DATETIME DEFAULT NULL COMMENT '수정 일자',
  UPDATED_BY VARCHAR(50) DEFAULT NULL COMMENT '수정자',
  DURATION_DAYS INT DEFAULT NULL COMMENT '사용기간(일단위, 영구적이면 NULL)',
  PACK_SIZE INT DEFAULT NULL COMMENT '지급 수량',
  GRANT_PRODUCT_ID INT DEFAULT NULL COMMENT '지급대상 아이템 아이디',
  SALE_PRICE INT DEFAULT NULL COMMENT '할인금액',
  PRIMARY KEY (PRODUCT_ID)
) COMMENT='상품 정보';



-- =========================================================================================
-- TB_PURCHASE (상품 테이블)
-- =========================================================================================
CREATE TABLE TB_PURCHASE (
  PURCHASE_ID BIGINT NOT NULL AUTO_INCREMENT,
  USER_ID VARCHAR(50) NOT NULL,
  PRODUCT_ID INT NOT NULL,
  PRODUCT_NAME_SNAP VARCHAR(200) DEFAULT NULL,
  PRODUCT_TYPE_SNAP VARCHAR(20) DEFAULT NULL,
  UNIT_PRICE_SNAP INT DEFAULT NULL,
  SALE_PRICE_SNAP INT DEFAULT NULL,
  CURRENCY_SNAP VARCHAR(10) DEFAULT NULL,
  QUANTITY INT NOT NULL DEFAULT 1,
  DURATION_DAYS_SNAP INT DEFAULT NULL,
  PACK_SIZE_SNAP INT DEFAULT NULL,
  GRANT_PRODUCT_ID_SNAP INT DEFAULT NULL,
  PG_PROVIDER VARCHAR(50) DEFAULT NULL,
  METHOD VARCHAR(50) DEFAULT NULL,
  AMOUNT_PAID INT DEFAULT NULL,
  PG_TID VARCHAR(100) DEFAULT NULL,
  MERCHANT_UID VARCHAR(100) NOT NULL,
  APPROVED_AT DATETIME DEFAULT NULL,
  APPLIED_AT DATETIME DEFAULT NULL,
  RECEIPT_URL VARCHAR(500) DEFAULT NULL,
  RAW_PAYLOAD JSON DEFAULT NULL,
  ENTRY_TYPE ENUM('PAY','REFUND') NOT NULL DEFAULT 'PAY',
  ORIGIN_PURCHASE_ID BIGINT DEFAULT NULL,
  CREATED_DATE DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (PURCHASE_ID),
  UNIQUE KEY UQ_PURCHASE_MERCHANT (MERCHANT_UID),
  KEY IDX_PURCHASE_USER_DATE (USER_ID, CREATED_DATE),
  KEY IDX_PURCHASE_ORIGIN (ORIGIN_PURCHASE_ID),
  KEY IDX_PURCHASE_ENTRY (ENTRY_TYPE)
) COMMENT="구매 테이블";


-- =========================================================================================
-- TB_USER_INVENTORY (유저 인벤토리 테이블)
-- =========================================================================================
CREATE TABLE TB_USER_INVENTORY (
  INVENTORY_ID INT NOT NULL AUTO_INCREMENT COMMENT '인벤토리 ID',
  USER_ID VARCHAR(50) NOT NULL COMMENT '유저 ID',
  PRODUCT_ID INT NOT NULL COMMENT '상품 ID',
  QUANTITY INT NOT NULL DEFAULT 0 COMMENT '보유개수',
  EXPIRY_DATE DATETIME DEFAULT NULL COMMENT '만료 일자 (무제한 NULL)',
  ACQUIRED_DATE DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '획득 일자',
  UPDATED_DATE DATETIME DEFAULT NULL COMMENT '수정 일자',
  PRIMARY KEY (INVENTORY_ID),
  UNIQUE KEY UK_UI_USER_PRODUCT (USER_ID, PRODUCT_ID)
) COMMENT='유저 보유 상품';


-- =========================================================================================
-- TB_RANKING (랭킹 테이블)
-- =========================================================================================
CREATE TABLE TB_RANKING
(
    RANKING_ID   INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '랭킹 ID',
    USER_ID      VARCHAR(50)    NOT NULL COMMENT '사용자 ID',
    RANKING_TYPE VARCHAR(20)    NOT NULL COMMENT '랭킹 유형',
    SCORE        INT NOT NULL DEFAULT 0 COMMENT '점수 / 기준 값',
    RANK_VALUE   INT NOT NULL COMMENT '현재 순위',
    REFRESH_DATE DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '갱신 일자',
    CREATED_DATE DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY   VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE DATETIME COMMENT '수정 일자',
    UPDATED_BY   VARCHAR(50) COMMENT '수정자'
) COMMENT='랭킹 정보';

-- =========================================================================================
-- TB_USER (사용자 테이블)
-- =========================================================================================
CREATE TABLE TB_USER (
  USER_ID VARCHAR(50) NOT NULL PRIMARY KEY  COMMENT '사용자 ID',
  USER_NAME VARCHAR(100) NOT NULL COMMENT '사용자 이름',
  USER_EMAIL VARCHAR(100) DEFAULT NULL COMMENT '인증 및 알림용 이메일',
  USER_PASSWORD VARCHAR(255) NOT NULL COMMENT '사용자 비밀번호',
  USER_NICKNAME VARCHAR(50) NOT NULL COMMENT '유저 닉네임',
  IMAGE_ID INT DEFAULT NULL COMMENT '프로필 이미지',
  CREATED_DATE DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
  ROLE VARCHAR(20) DEFAULT NULL COMMENT '유저타입 구분',
  IS_EMAIL_VERIFIED CHAR(1) NOT NULL DEFAULT 'N' COMMENT '이메일 인증 완료 여부 (Y/N)',
  CHARACTER_ID INT DEFAULT NULL,
  HAS_CHARACTER TINYINT(1) NOT NULL DEFAULT 0 COMMENT '캐릭터 생성 여부 (TRUE/FALSE)',
  INCUBATOR_COUNT INT NOT NULL DEFAULT 0 COMMENT '인큐베이터 총 보유 수(프로덕트 4,5 합산)',
  IS_AD_FREE TINYINT(1) NOT NULL DEFAULT 0,
  AD_FREE_EXPIRES_AT DATETIME DEFAULT NULL COMMENT '광고 제거 만료 시각(최신 만료일)',

  UNIQUE KEY USER_NICKNAME (USER_NICKNAME),
  UNIQUE KEY USER_EMAIL (USER_EMAIL),
  UNIQUE KEY USER_EMAIL_2 (USER_EMAIL)
) COMMENT='사용자 정보';


-- =========================================================================================
-- TB_USER_EMAIL_VERIFY (이메일 인증 테이블 - PK/AUTO_INCREMENT 수정)
-- =========================================================================================
CREATE TABLE TB_USER_EMAIL_VERIFY
(
    VERIFY_ID    INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '인증 ID',
    USER_ID      VARCHAR(50)  NOT NULL UNIQUE COMMENT '사용자 ID',
    EMAIL        VARCHAR(100) NOT NULL COMMENT '이메일 주소',
    VERIFY_CODE  VARCHAR(100) NOT NULL COMMENT '인증 코드',
    EXPIRY_DATE  DATETIME     NOT NULL COMMENT '만료 일시',
    IS_VERIFIED  CHAR(1)      NOT NULL DEFAULT 'N' COMMENT '인증 성공 여부',
    CREATED_DATE DATETIME COMMENT '생성 일자',
    CREATED_BY   VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE DATETIME COMMENT '수정일자',
    UPDATED_BY   VARCHAR(50) COMMENT '수정자'
) COMMENT='이메일 인증 정보';

-- =========================================================================================
-- TB_USER_PRODUCT (유저 상품/재화 테이블)
-- =========================================================================================
CREATE TABLE TB_USER_PRODUCT
(
    USER_PRODUCT_ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '유저 상품 ID',
    USER_ID         VARCHAR(50)    NOT NULL COMMENT '사용자 ID',
    PRODUCT_ID      VARCHAR(50)    NOT NULL COMMENT '상품 ID',
    QUANTITY        INT NOT NULL DEFAULT 0 COMMENT '보유 수량',
    CREATED_DATE    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY      VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE    DATETIME COMMENT '수정 일자',
    UPDATED_BY      VARCHAR(50) COMMENT '수정자'
) COMMENT='유저 상품/재화 정보';

-- =========================================================================================
-- TB_Map (맵 정보 테이블)
-- =========================================================================================

CREATE TABLE TB_Map
(
    MAP_ID          INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '맵 ID',
    MAP_NAME        VARCHAR(50) COMMENT '맵 이름',
    MAP_IMAGE_URL   VARCHAR(255) COMMENT '맵 이미지 파일 경로',
    CREATED_DATE    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY      VARCHAR(50) COMMENT '생성자',
    UPDATED_DATE    DATETIME COMMENT '수정 일자',
    UPDATED_BY      VARCHAR(50) COMMENT '수정자'
) COMMENT='맵 정보';

-- =========================================================================================
-- TB_ENCOUNTER_RATE (보스몬스터 등장 확률 테이블)
-- =========================================================================================

CREATE TABLE TB_ENCOUNTER_RATE (
    ENCOUNTER_TYPE VARCHAR(20) PRIMARY KEY,  -- 'NORMAL', 'BOSS'
    ENCOUNTER_RATE DECIMAL(5,2) NOT NULL,    -- 예: 98.00, 2.00 (%)
    DESCRIPTION VARCHAR(100),
    UPDATED_DATE DATETIME DEFAULT CURRENT_TIMESTAMP
)COMMENT='보스몬스터 등장 확률';


-- =========================================================================================
-- TB_USER_INVENTORY (유저 보유 상점 아이템)
-- =========================================================================================

CREATE TABLE TB_USER_INVENTORY
(
		INVENTORY_ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '인벤토리 ID',
        USER_ID VARCHAR(50) NOT NULL COMMENT '유저 ID',
        PRODUCT_ID INT NOT NULL COMMENT '상품 ID',
		QUANTITY INT NOT NULL DEFAULT 0 COMMENT '보유개수',
        EXPIRY_DATE DATETIME COMMENT '만료 일자 (무제한 NULL)',
        ACQUIRED_DATE DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '획득 일자',
		UPDATED_DATE  DATETIME COMMENT '수정 일자'
) COMMENT ='유저 보유 상픔';

-- 퀘스트 정의
CREATE TABLE TB_QUEST (
  QUEST_ID INT NOT NULL AUTO_INCREMENT COMMENT '퀘스트 ID',
  QUEST_NAME VARCHAR(100) NOT NULL COMMENT '퀘스트 이름',
  QUEST_TYPE VARCHAR(30) NOT NULL COMMENT '퀘스트 타입 (PVE, PVP, DEBATE, MINIGAME 등)',
  TARGET_COUNT INT NOT NULL DEFAULT 1 COMMENT '목표 횟수',
  REWARD_PRODUCT_ID INT NOT NULL DEFAULT 4 COMMENT '보상 상품 ID (기본: 부화권)',
  REWARD_QUANTITY INT NOT NULL DEFAULT 1 COMMENT '보상 수량',
  IS_REPEATABLE CHAR(1) NOT NULL DEFAULT 'N' COMMENT '반복 가능 여부',
  QUEST_CYCLE VARCHAR(20) NOT NULL DEFAULT 'DAILY' COMMENT '퀘스트 주기 (DAILY, WEEKLY 등)',
  CREATED_AT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (QUEST_ID)
) COMMENT='퀘스트 정의 테이블';

-- 유저의 퀘스트 진행 상태 관리
CREATE TABLE TB_USER_QUEST (
  USER_QUEST_ID INT NOT NULL AUTO_INCREMENT COMMENT '유저 퀘스트 진행 ID',
  USER_ID VARCHAR(50) NOT NULL COMMENT '유저 ID',
  QUEST_ID INT NOT NULL COMMENT '퀘스트 ID',
  CURRENT_COUNT INT NOT NULL DEFAULT 0 COMMENT '현재 진행 횟수',
  STATUS VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS' COMMENT '진행 상태 (IN_PROGRESS, COMPLETED, REWARDED)',
  STARTED_AT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '시작 시각',
  COMPLETED_AT DATETIME DEFAULT NULL COMMENT '완료 시각',
  LAST_RESET_DATE DATE DEFAULT NULL COMMENT '마지막 초기화 일자',
  PRIMARY KEY (USER_QUEST_ID)
) COMMENT='유저 퀘스트 진행 상태';