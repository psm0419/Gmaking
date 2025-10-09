-- ====================================================================
-- TB_ADVERTISEMENT.sql (광고 테이블)
-- ====================================================================
CREATE TABLE TB_ADVERTISEMENT
(
    AD_ID          INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '광고 ID',
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
    CREATED_BY     INT COMMENT '생성자',
    UPDATED_DATE   DATETIME COMMENT '수정 일자',
    UPDATED_BY     INT COMMENT '수정자'
) COMMENT='광고 관련';

-- ====================================================================
-- TB_USER.sql (사용자 테이블)
-- ====================================================================
CREATE TABLE TB_USER
(
    USER_ID       VARCHAR NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '사용자 ID',
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
-- TB_CHARACTER_PERSONALITY.sql (캐릭터 성격)
-- ====================================================================
CREATE TABLE TB_CHARACTER_PERSONALITY
(
    CHARACTER_PERSONALITY_ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '성격 ID',
    PERSONALITY_DESCRIPTION  VARCHAR(255) COMMENT '설명'
) COMMENT='캐릭터 성격 정보';

-- ====================================================================
-- TB_CHARACTER.sql (캐릭터 기본 정보)
-- ====================================================================
CREATE TABLE TB_CHARACTER
(
    CHARACTER_ID             INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '캐릭터 ID',
    USER_ID                  VARCHAR(50) NOT NULL COMMENT '사용자 ID',
    IMAGE_ID                 INT NOT NULL COMMENT '캐릭터 이미지 ID',
    CHARACTER_PERSONALITY_ID INT NOT NULL COMMENT '캐릭터 성격 ID',
    CHARACTER_NAME           VARCHAR(50) NOT NULL UNIQUE KEY COMMENT '캐릭터 이름',
    GRADE_ID                 INT NOT NULL COMMENT '캐릭터 등급',
    TOTAL_STAGE_CLEARS       INT NOT NULL COMMENT '총 클리어 횟수',
    EVOLUTION_STEP           INT NOT NULL COMMENT '현재 진화 단계',
    CREATED_DATE             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY               INT COMMENT '생성자',
    UPDATED_DATE             DATETIME COMMENT '수정 일자',
    UPDATED_BY               INT COMMENT '수정자',
    FOREIGN KEY (USER_ID) REFERENCES TB_USER (USER_ID),
    FOREIGN KEY (CHARACTER_PERSONALITY_ID) REFERENCES TB_CHARACTER_PERSONALITY (CHARACTER_PERSONALITY_ID)
) COMMENT='캐릭터 정보';

-- ====================================================================
-- TB_COMMAND.sql (커맨드 테이블)
-- ====================================================================
CREATE TABLE TB_COMMAND
(
    COMMAND_ID          INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '커맨드 ID',
    COMMAND_TYPE        VARCHAR(20) NOT NULL COMMENT '커맨드 유형',
    COMMAND_DESCRIPTION VARCHAR(255) COMMENT '커맨드 설명',
    CREATED_DATE        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY          INT COMMENT '생성자',
    UPDATED_DATE        DATETIME COMMENT '수정 일자',
    UPDATED_BY          INT COMMENT '수정자'
) COMMENT='커맨드 정보';

-- ====================================================================
-- TB_MINI_GAME.sql
-- ====================================================================
CREATE TABLE TB_MINI_GAME
(
    MINI_GAME_ID   INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '미니 게임 ID',
    MINI_GAME_NAME VARCHAR(100) NOT NULL COMMENT '미니 게임 이름',
    MINI_GAME_DESCRIPTION VARCHAR(255) COMMENT '미니 게임 설명',
    CREATED_DATE   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY     INT COMMENT '생성자',
    UPDATED_DATE   DATETIME COMMENT '수정 일자',
    UPDATED_BY     INT COMMENT '수정자'
) COMMENT='미니 게임 정보';

-- ====================================================================
-- TB_MINI_GAME_RESULT.sql
-- ====================================================================
CREATE TABLE TB_MINI_GAME_RESULT
(
    MINI_GAME_RESULT_ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '미니 게임 결과 ID',
    MINI_GAME_ID        INT NOT NULL COMMENT '미니 게임 ID',
    CHARACTER_ID        INT NOT NULL COMMENT '캐릭터 ID',
    BONUS_HP            INT NOT NULL DEFAULT 0 COMMENT '추가 체력',
    BONUS_ATTACK        INT NOT NULL DEFAULT 0 COMMENT '추가 공격력',
    BONUS_DEFENCE       INT NOT NULL DEFAULT 0 COMMENT '추가 방어력',
    BONUS_SPEED         INT NOT NULL DEFAULT 0 COMMENT '추가 스피드',
    CREATED_DATE        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY          INT COMMENT '생성자',
    UPDATED_DATE        DATETIME COMMENT '수정 일자',
    UPDATED_BY          INT COMMENT '수정자',
    FOREIGN KEY (MINI_GAME_ID) REFERENCES TB_MINI_GAME (MINI_GAME_ID),
    FOREIGN KEY (CHARACTER_ID) REFERENCES TB_CHARACTER (CHARACTER_ID)
) COMMENT='미니 게임 결과 정보';

-- ====================================================================
-- TB_IMAGE.sql
-- ====================================================================
CREATE TABLE TB_IMAGE
(
    IMAGE_ID     INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '이미지 ID',
    IMAGE_NAME   VARCHAR(100) NOT NULL COMMENT '이미지 주소',
    IMAGE_TYPE   INT NOT NULL COMMENT '이미지 타입',
    CREATED_DATE DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY   INT COMMENT '생성자',
    UPDATED_DATE DATETIME COMMENT '수정 일자',
    UPDATED_BY   INT COMMENT '수정자'
) COMMENT='이미지 정보';

-- ====================================================================
-- TB_MONSTER.sql
-- ====================================================================
CREATE TABLE TB_MONSTER
(
    MONSTER_ID            INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '몬스터 ID',
    IMAGE_ID              INT NOT NULL COMMENT '이미지 ID',
    MONSTER_NAME          VARCHAR(100) NOT NULL COMMENT '몬스터 이름',
    MONSTER_TYPE          VARCHAR(20) NOT NULL DEFAULT 'NORMAL' COMMENT '몬스터 유형: NOMAL, BOSS',
    MONSTER_HP            INT NOT NULL COMMENT '몬스터 체력',
    MONSTER_ATTACK        INT NOT NULL COMMENT '몬스터 공격력',
    MONSTER_DEFENSE       INT NOT NULL COMMENT '몬스터 방어력',
    MONSTER_CRITICAL_RATE INT COMMENT '몬스터 크리티컬 확률',
    CREATED_DATE          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY            INT COMMENT '생성자',
    UPDATED_DATE          DATETIME COMMENT '수정 일자',
    UPDATED_BY            INT COMMENT '수정자',
    FOREIGN KEY (IMAGE_ID) REFERENCES TB_IMAGE (IMAGE_ID)
) COMMENT='몬스터 정보';

-- ====================================================================
-- TB_PRODUCT.sql
-- ====================================================================
CREATE TABLE TB_PRODUCT
(
    PRODUCT_ID    INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '상품 ID',
    PRODUCT_NAME  VARCHAR(100) NOT NULL COMMENT '상품명',
    PRODUCT_TYPE  VARCHAR(20) NOT NULL COMMENT '상품 유형: 뽑기권, 광고제거',
    PRICE         DECIMAL(10, 0) NOT NULL DEFAULT 0 COMMENT '가격',
    CURRENCY_TYPE VARCHAR(10) NOT NULL DEFAULT 'KRW' COMMENT '통화 유형',
    IS_SALE       CHAR(1) NOT NULL DEFAULT 'Y' COMMENT '판매 여부',
    CREATED_DATE  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY    INT COMMENT '생성자',
    UPDATED_DATE  DATETIME COMMENT '수정 일자',
    UPDATED_BY    INT COMMENT '수정자'
) COMMENT='상품 정보';

-- ====================================================================
-- TB_USER_PRODUCT.sql
-- ====================================================================
CREATE TABLE TB_USER_PRODUCT
(
    USER_PRODUCT_ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '유저 상품 ID',
    USER_ID         VARCHAR(50) NOT NULL COMMENT '사용자 ID',
    PRODUCT_ID      INT NOT NULL COMMENT '상품 ID',
    QUANTITY        DECIMAL(10, 0) NOT NULL DEFAULT 0 COMMENT '보유 수량',
    CREATED_DATE    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
    CREATED_BY      INT COMMENT '생성자',
    UPDATED_DATE    DATETIME COMMENT '수정 일자',
    UPDATED_BY      INT COMMENT '수정자',
    FOREIGN KEY (USER_ID) REFERENCES TB_USER (USER_ID),
    FOREIGN KEY (PRODUCT_ID) REFERENCES TB_PRODUCT (PRODUCT_ID)
) COMMENT='유저 상품/재화 정보';
