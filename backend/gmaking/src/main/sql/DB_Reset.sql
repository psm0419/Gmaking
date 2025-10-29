DROP TABLE IF EXISTS `tb_ai_usage_log`;

CREATE TABLE `tb_ai_usage_log` (
  `usage_log_id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) DEFAULT NULL,
  `feature_type` varchar(50) NOT NULL,
  `model_name` varchar(100) NOT NULL,
  `input_token` int NOT NULL DEFAULT '0',
  `output_token` int NOT NULL DEFAULT '0',
  `total_cost` int DEFAULT NULL,
  `request_count` int DEFAULT NULL,
  `usage_status` enum('success','quota_exceeded','error') DEFAULT 'success',
  `error_message` text,
  `log_date` date DEFAULT NULL,
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
  `created_by` varchar(50) DEFAULT NULL COMMENT '생성자',
  `updated_date` datetime DEFAULT NULL COMMENT '수정 일자',
  `updated_by` varchar(50) DEFAULT NULL COMMENT '수정자',
  PRIMARY KEY (`usage_log_id`),
  UNIQUE KEY `uq_ai_usage_day` (`user_id`,`feature_type`,`model_name`,`log_date`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `tb_battle_log`;

CREATE TABLE `tb_battle_log` (
  `BATTLE_ID` int NOT NULL AUTO_INCREMENT COMMENT '배틀 ID',
  `CHARACTER_ID` varchar(50) NOT NULL COMMENT '캐릭터 ID',
  `BATTLE_TYPE` varchar(10) NOT NULL COMMENT '전투 유형: PVE',
  `OPPONENT_ID` varchar(50) NOT NULL COMMENT '상대방 ID (PVP: 상대방 ID, PVE: 몬스터 ID)',
  `IS_WIN` char(1) NOT NULL DEFAULT 'N' COMMENT '승리 여부: Y: 승리, N: 패배',
  `TURN_COUNT` bigint NOT NULL DEFAULT '0' COMMENT '최종 턴 수',
  `CREATED_DATE` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
  `CREATED_BY` varchar(50) DEFAULT NULL COMMENT '생성자',
  `UPDATED_DATE` datetime DEFAULT NULL COMMENT '수정 일자',
  `UPDATED_BY` varchar(50) DEFAULT NULL COMMENT '수정자',
  PRIMARY KEY (`BATTLE_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='배틀 로그 정보';


DROP TABLE IF EXISTS `tb_character`;

CREATE TABLE `tb_character` (
  `CHARACTER_ID` int NOT NULL AUTO_INCREMENT COMMENT '캐릭터 ID',
  `USER_ID` varchar(50) NOT NULL COMMENT '사용자 ID',
  `IMAGE_ID` int NOT NULL COMMENT '캐릭터 이미지 ID',
  `CHARACTER_PERSONALITY_ID` int NOT NULL COMMENT '캐릭터 성격 ID',
  `CHARACTER_NAME` varchar(50) NOT NULL COMMENT '캐릭터 이름',
  `BACKGROUND_INFO` text COMMENT '배경 정보',
  `GRADE_ID` int NOT NULL COMMENT '캐릭터 등급',
  `TOTAL_STAGE_CLEARS` int NOT NULL COMMENT '총 클리어 횟수',
  `EVOLUTION_STEP` int NOT NULL COMMENT '현재 진화 단계',
  `CREATED_DATE` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
  `CREATED_BY` varchar(50) DEFAULT NULL COMMENT '생성자',
  `UPDATED_DATE` datetime DEFAULT NULL COMMENT '수정 일자',
  `UPDATED_BY` varchar(50) DEFAULT NULL COMMENT '수정자',
  PRIMARY KEY (`CHARACTER_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='캐릭터 정보';

DROP TABLE IF EXISTS `tb_character_stat`;

CREATE TABLE `tb_character_stat` (
  `CHARACTER_ID` int NOT NULL COMMENT '캐릭터 ID',
  `CHARACTER_HP` int NOT NULL COMMENT '캐릭터 체력',
  `CHARACTER_ATTACK` int NOT NULL COMMENT '캐릭터 공격력',
  `CHARACTER_DEFENSE` int NOT NULL COMMENT '캐릭터 방어력',
  `CHARACTER_SPEED` int NOT NULL COMMENT '캐릭터 속도',
  `CRITICAL_RATE` int NOT NULL COMMENT '크리티컬 확률',
  `CREATED_DATE` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
  `CREATED_BY` varchar(50) DEFAULT NULL COMMENT '생성자',
  `UPDATED_DATE` datetime DEFAULT NULL COMMENT '수정 일자',
  `UPDATED_BY` varchar(50) DEFAULT NULL COMMENT '수정자',
  PRIMARY KEY (`CHARACTER_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='캐릭터 능력치 정보';

DROP TABLE IF EXISTS `tb_community_comment`;

CREATE TABLE `tb_community_comment` (
  `COMMENT_ID` bigint NOT NULL AUTO_INCREMENT,
  `POST_ID` bigint NOT NULL,
  `PARENT_ID` bigint DEFAULT NULL,
  `COMMENT_DEPTH` int NOT NULL DEFAULT '0',
  `USER_ID` varchar(50) NOT NULL,
  `CONTENT` text NOT NULL,
  `CREATED_DATE` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UPDATED_DATE` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `CREATED_BY` varchar(50) NOT NULL,
  `UPDATED_BY` varchar(50) DEFAULT NULL,
  `IS_DELETED` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`COMMENT_ID`),
  KEY `idx_post_created` (`POST_ID`,`CREATED_DATE`),
  KEY `idx_user_id` (`USER_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `tb_community_like`;

CREATE TABLE `tb_community_like` (
  `USER_ID` varchar(50) NOT NULL COMMENT '사용자 ID',
  `POST_ID` decimal(10,0) NOT NULL COMMENT '게시글 ID',
  `CREATED_DATE` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `CREATED_BY` varchar(50) DEFAULT NULL COMMENT '생성자',
  `UPDATED_DATE` datetime DEFAULT NULL COMMENT '수정 일자',
  `UPDATED_BY` varchar(50) DEFAULT NULL COMMENT '수정자',
  PRIMARY KEY (`USER_ID`,`POST_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `tb_community_post`;

CREATE TABLE `tb_community_post` (
  `POST_ID` bigint NOT NULL AUTO_INCREMENT,
  `USER_ID` varchar(50) NOT NULL COMMENT '작성자 ID',
  `CATEGORY_CODE` varchar(20) NOT NULL COMMENT '게시판 구분 코드',
  `TITLE` varchar(255) NOT NULL COMMENT '제목',
  `CONTENT` varchar(4000) NOT NULL COMMENT '내용',
  `VIEW_COUNT` decimal(10,0) NOT NULL DEFAULT '0' COMMENT '조회수',
  `LIKE_COUNT` decimal(10,0) NOT NULL DEFAULT '0' COMMENT '좋아요 수',
  `IS_DELETED` char(1) NOT NULL DEFAULT 'N' COMMENT '삭제 여부',
  `CREATED_DATE` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
  `CREATED_BY` varchar(50) DEFAULT NULL COMMENT '생성자',
  `UPDATED_DATE` datetime DEFAULT NULL COMMENT '수정 일자',
  `UPDATED_BY` varchar(50) DEFAULT NULL COMMENT '수정자',
  PRIMARY KEY (`POST_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='커뮤니티 게시글 테이블';

DROP TABLE IF EXISTS `tb_conversation`;

CREATE TABLE `tb_conversation` (
  `conversation_id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) DEFAULT NULL,
  `character_id` int NOT NULL,
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
  `created_by` varchar(50) DEFAULT NULL COMMENT '생성자',
  `updated_date` datetime DEFAULT NULL COMMENT '수정 일자',
  `updated_by` varchar(50) DEFAULT NULL COMMENT '수정자',
  `STATUS` enum('OPEN','CLOSED','ARCHIVED') NOT NULL DEFAULT 'OPEN' COMMENT '대화 상태',
  `is_first_meet` tinyint(1) NOT NULL DEFAULT '1' COMMENT '첫 인사 단계 여부',
  `calling_name` varchar(50) DEFAULT NULL COMMENT '사용자 호칭(NULL이면 마스터로 처리)',
  `delay_log_clean` tinyint(1) NOT NULL DEFAULT '0' COMMENT '지연 삭제 플래그',
  PRIMARY KEY (`conversation_id`),
  KEY `idx_conv_user_char_status` (`user_id`,`character_id`,`STATUS`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `tb_conversation_summary`;

CREATE TABLE `tb_conversation_summary` (
  `CONVERSATION_ID` int NOT NULL COMMENT '대화방 ID (1방=1행 롤링)',
  `ROLLING_SUMMARY` text NOT NULL COMMENT '최근 맥락 1장 요약(600~800자 권장)',
  `SUMMARY_VERSION` int NOT NULL DEFAULT '1' COMMENT '요약 수정 회차(선택)',
  `LAST_TURN_ID` int DEFAULT NULL COMMENT '마지막 반영된 턴/메시지 ID(선택)',
  `LENGTH_CHARS` int DEFAULT NULL COMMENT 'ROLLING_SUMMARY 길이(모니터링용)',
  `UPDATED_BY` varchar(50) DEFAULT NULL COMMENT '최근 갱신자',
  `UPDATED_DATE` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '최근 갱신 시각',
  PRIMARY KEY (`CONVERSATION_ID`),
  KEY `idx_summary_updated` (`UPDATED_DATE`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='대화 요약(Recent): 진행 중 매 턴 덮어쓰기. 프롬프트에는 항상 이 1장만 사용';

DROP TABLE IF EXISTS `tb_dialogue`;

CREATE TABLE `tb_dialogue` (
  `message_id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` int NOT NULL,
  `SENDER` enum('USER','CHARACTER','SYSTEM') NOT NULL,
  `content` text NOT NULL,
  `chat_date` date NOT NULL,
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
  `created_by` varchar(50) DEFAULT NULL COMMENT '생성자',
  `updated_date` datetime DEFAULT NULL COMMENT '수정 일자',
  `updated_by` varchar(50) DEFAULT NULL COMMENT '수정자',
  PRIMARY KEY (`message_id`),
  KEY `ix_dialogue_conv` (`conversation_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `tb_grant`;

CREATE TABLE `tb_grant` (
  `GRANT_ID` bigint NOT NULL AUTO_INCREMENT COMMENT '지급아이디',
  `PURCHASE_ID` bigint NOT NULL COMMENT '결제 아이디',
  `USER_ID` varchar(50) NOT NULL COMMENT '유저 아이디',
  `PRODUCT_ID` int NOT NULL COMMENT '상품 아이디',
  `QUANTITY` int NOT NULL DEFAULT '1' COMMENT '상품 개수',
  `EXPIRES_AT` datetime DEFAULT NULL COMMENT '만료 시간 | null 일시 만료 없음',
  `STATUS` enum('PENDING','APPLIED','REVOKED') NOT NULL DEFAULT 'PENDING' COMMENT '상태',
  `APPLIED_INVENTORY_ID` int DEFAULT NULL COMMENT '적용 인벤토리 아이디',
  `CREATED_DATE` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성날짜',
  `UPDATED_DATE` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정날짜',
  PRIMARY KEY (`GRANT_ID`),
  KEY `IDX_GRANT_PURCHASE` (`PURCHASE_ID`),
  KEY `IDX_GRANT_USER` (`USER_ID`,`STATUS`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='지급내역';

DROP TABLE IF EXISTS `tb_growth`;

CREATE TABLE `tb_growth` (
  `GROWTH_ID` int NOT NULL AUTO_INCREMENT COMMENT '성장 기록의 고유 식별자 (Primary Key)',
  `CHARACTER_ID` int NOT NULL COMMENT '성장 대상 캐릭터 ID (tb_character 테이블의 캐릭터 ID를 참조)',
  `USER_ID` varchar(50) NOT NULL COMMENT '성장 요청을 수행한 사용자 ID (tb_user 테이블의 사용자 ID를 참조)',
  `INCREMENT_ATTACK` int NOT NULL DEFAULT '0' COMMENT '성장 1회당 증가된 공격력',
  `INCREMENT_DEFENSE` int NOT NULL DEFAULT '0' COMMENT '성장 1회당 증가된 방어력',
  `INCREMENT_HP` int NOT NULL DEFAULT '0' COMMENT '성장 1회당 증가된 체력',
  `INCREMENT_SPEED` int NOT NULL DEFAULT '0' COMMENT '성장 1회당 증가된 속도',
  `INCREMENT_CRITICAL` int NOT NULL DEFAULT '0' COMMENT '성장 1회당 증가된 크리티컬 확률 (%)',
  `CREATED_BY` varchar(50) NOT NULL COMMENT '레코드 생성자 (보통 USER_ID)',
  `CREATED_DATE` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '레코드 생성 일자 및 성장 발생 시각',
  `UPDATED_BY` varchar(50) DEFAULT NULL COMMENT '레코드 수정자',
  `UPDATED_DATE` datetime DEFAULT NULL COMMENT '레코드 수정 일자',
  PRIMARY KEY (`GROWTH_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `tb_image`;

CREATE TABLE `tb_image` (
  `IMAGE_ID` int NOT NULL AUTO_INCREMENT COMMENT '이미지 ID',
  `IMAGE_ORIGINAL_NAME` varchar(100) NOT NULL COMMENT '원본 이미지 이름',
  `IMAGE_URL` varchar(255) NOT NULL,
  `IMAGE_NAME` varchar(100) NOT NULL COMMENT '서버에 저장된 이미지 이름',
  `IMAGE_TYPE` int NOT NULL COMMENT '0: profile\n1: character\n2: monster',
  `CREATED_DATE` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
  `CREATED_BY` varchar(50) DEFAULT NULL COMMENT '생성자',
  `UPDATED_DATE` datetime DEFAULT NULL COMMENT '수정 일자',
  `UPDATED_BY` varchar(50) DEFAULT NULL COMMENT '수정자',
  PRIMARY KEY (`IMAGE_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='이미지 정보';

DROP TABLE IF EXISTS `tb_long_memory`;

CREATE TABLE `tb_long_memory` (
  `MEMORY_ID` int NOT NULL AUTO_INCREMENT COMMENT 'PK',
  `USER_ID` varchar(50) NOT NULL COMMENT '유저 ID',
  `CHARACTER_ID` int NOT NULL COMMENT '캐릭터 ID',
  `TYPE` varchar(32) DEFAULT NULL COMMENT '기존 유형(PROFILE/PREFERENCE/...)',
  `CATEGORY` varchar(32) NOT NULL DEFAULT 'OTHER' COMMENT 'FAVORITE|DISLIKE|SCHEDULE|OTHER',
  `SUBJECT` varchar(200) NOT NULL COMMENT '원본 주제(표시용)',
  `SUBJECT_NORM` varchar(120) NOT NULL COMMENT '정규화 주제(슬롯 고유 키)',
  `VALUE` varchar(1000) NOT NULL COMMENT '메모 내용(요약/선호/설명)',
  `STRENGTH` tinyint NOT NULL DEFAULT '3' COMMENT '1~5 신뢰/강도',
  `CONFIDENCE` decimal(4,3) DEFAULT NULL COMMENT '0~1 LLM confidence',
  `SOURCE` varchar(32) DEFAULT NULL COMMENT 'pipeline|runtime|admin',
  `DUE_AT` datetime DEFAULT NULL COMMENT 'SCHEDULE 기한/일시',
  `META_JSON` json DEFAULT NULL COMMENT '추가 구조(예: {"place":"부산","when":"2025-11-01"})',
  `LAST_USED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '최근 사용 시각',
  `FIRST_SEEN_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '처음 감지 시각',
  `SOURCE_CONV_ID` int DEFAULT NULL COMMENT '출처 대화 ID',
  `UPDATED_BY` varchar(50) DEFAULT NULL COMMENT '갱신 주체(액터)',
  `UPDATED_DATE` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '갱신 시각',
  PRIMARY KEY (`MEMORY_ID`),
  UNIQUE KEY `UK_longmem_slot` (`USER_ID`,`CHARACTER_ID`,`CATEGORY`,`SUBJECT_NORM`),
  KEY `IDX_longmem_user_char_cat_lastused` (`USER_ID`,`CHARACTER_ID`,`CATEGORY`,`LAST_USED_AT` DESC,`STRENGTH` DESC)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='카테고리/주제 슬롯 기반 롱 메모리(업서트로 중복 방지)';

DROP TABLE IF EXISTS `tb_notice`;

CREATE TABLE `tb_notice` (
  `NOTICE_ID` int NOT NULL AUTO_INCREMENT COMMENT '공지사항 고유 번호 (PK)',
  `NOTICE_TITLE` varchar(255) NOT NULL COMMENT '공지사항 제목',
  `NOTICE_CONTENT` text NOT NULL COMMENT '공지사항 내용',
  `NOTICE_VIEW_COUNT` int NOT NULL DEFAULT '0' COMMENT '조회수',
  `IS_PINNED` tinyint(1) NOT NULL DEFAULT '0' COMMENT '상단 고정 여부 (0:미고정, 1:고정)',
  `CREATED_BY` varchar(50) NOT NULL COMMENT '생성자 ID (tb_user의 USER_ID 참조)',
  `CREATED_DATE` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
  `LAST_MODIFIED_BY` varchar(50) DEFAULT NULL COMMENT '최종 수정자 ID (tb_user의 USER_ID 참조)',
  `LAST_MODIFIED_DATE` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '최종 수정 일자',
  PRIMARY KEY (`NOTICE_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='공지사항 정보';

DROP TABLE IF EXISTS `tb_notification`;

CREATE TABLE `tb_notification` (
  `NOTIFICATION_ID` int NOT NULL AUTO_INCREMENT,
  `USER_ID` varchar(50) NOT NULL,
  `TYPE` varchar(30) NOT NULL,
  `TITLE` varchar(150) NOT NULL,
  `MESSAGE` text,
  `LINK_URL` varchar(500) DEFAULT NULL,
  `STATUS` varchar(20) NOT NULL DEFAULT 'unread' COMMENT 'UNREAD: 안읽음 , READ 읽음',
  `DELIVERED_AT` datetime DEFAULT NULL COMMENT '오프라인 사용자 미전달 감지',
  `EXPIRES_AT` datetime DEFAULT NULL COMMENT '알림 만료',
  `READ_AT` datetime DEFAULT NULL,
  `CREATED_DATE` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `CREATED_BY` varchar(50) NOT NULL DEFAULT 'system',
  `UPDATED_DATE` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `UPDATED_BY` varchar(50) NOT NULL DEFAULT 'system',
  `META_JSON` json DEFAULT NULL COMMENT '도메인별 추가 데이터',
  PRIMARY KEY (`NOTIFICATION_ID`),
  KEY `idx_notif_user_status` (`USER_ID`,`STATUS`,`CREATED_DATE`),
  KEY `idx_notif_user_read` (`USER_ID`,`READ_AT`),
  KEY `idx_notif_expires` (`EXPIRES_AT`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `tb_persona`;

CREATE TABLE `tb_persona` (
  `persona_id` int NOT NULL AUTO_INCREMENT,
  `character_id` int NOT NULL,
  `instruction_prompt` text,
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
  `created_by` varchar(50) DEFAULT NULL COMMENT '생성자',
  `updated_date` datetime DEFAULT NULL COMMENT '수정 일자',
  `updated_by` varchar(50) DEFAULT NULL COMMENT '수정자',
  PRIMARY KEY (`persona_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `tb_purchase`;

CREATE TABLE `tb_purchase` (
  `PURCHASE_ID` bigint NOT NULL AUTO_INCREMENT COMMENT '결제아이디',
  `USER_ID` varchar(50) NOT NULL COMMENT '유저아이디',
  `PRODUCT_ID` int NOT NULL COMMENT '구매 상픔 아이디',
  `QUANTITY` int NOT NULL DEFAULT '1' COMMENT '상품 구매 개수',
  `AMOUNT_PAID` int DEFAULT NULL COMMENT '결제 금액',
  `CURRENCY` varchar(10) DEFAULT 'KRW' COMMENT '결제 통화',
  `PG_PROVIDER` varchar(50) DEFAULT NULL COMMENT 'PG 제공사',
  `METHOD` varchar(50) DEFAULT NULL COMMENT '결제 수단(카드, 계좌이체, 포인트)',
  `MERCHANT_UID` varchar(100) NOT NULL COMMENT '가맹점 주문 번호 / 결제 취소 환불 등 멱등성 보장',
  `IMP_UID` varchar(100) DEFAULT NULL COMMENT '아임포트 UID',
  `STATUS` enum('READY','PAID','FAILED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'READY' COMMENT '결제 상태, ready|paid|failed|cancelled',
  `FAILED_REASON` varchar(300) DEFAULT NULL COMMENT '결제 실패 원인',
  `PRODUCT_NAME_SNAP` varchar(200) DEFAULT NULL COMMENT '상품명',
  `UNIT_PRICE_SNAP` int DEFAULT NULL COMMENT '개별가',
  `TOTAL_PRICE_SNAP` int DEFAULT NULL COMMENT '총가격',
  `APPROVED_AT` datetime DEFAULT NULL COMMENT '승인 시간',
  `APPLIED_AT` datetime DEFAULT NULL COMMENT '지급 완료시간',
  `CREATED_DATE` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성시간',
  `UPDATED_DATE` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '업데이트시간',
  PRIMARY KEY (`PURCHASE_ID`),
  UNIQUE KEY `UK_MERCHANT` (`MERCHANT_UID`),
  KEY `IDX_PURCHASE_USER` (`USER_ID`,`CREATED_DATE`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `tb_report`;

CREATE TABLE tb_report (
  report_id bigint NOT NULL AUTO_INCREMENT COMMENT '신고 고유 ID',
  target_type varchar(50) NOT NULL COMMENT '신고 대상 타입 (POST, COMMENT, USER 등)',
  target_id bigint NOT NULL COMMENT '신고 대상의 고유 ID',
  reporter_id varchar(50) NOT NULL COMMENT '신고한 사용자 ID',
  reason_code varchar(50) NOT NULL COMMENT '신고 사유 코드 (SPAM, PORNOGRAPHY, HATE_SPEECH, ETC 등)',
  reason_detail text COMMENT '기타 사유 등 상세 신고 내용',
  status varchar(20) NOT NULL DEFAULT 'PENDING' COMMENT '신고 처리 상태 (PENDING, REVIEWED, REJECTED, APPROVED)',
  created_by varchar(50) NOT NULL COMMENT '최초 생성자 (신고자 ID)',
  created_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '최초 생성일시 (신고 접수일시)',
  updated_by varchar(50) DEFAULT NULL COMMENT '마지막 수정자 (처리 관리자 ID)',
  updated_date timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 수정일시 (처리일시)',
  PRIMARY KEY (report_id),
  KEY idx_target (target_type, target_id)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='사용자 신고 기록 테이블';

DROP TABLE IF EXISTS `tb_turn_log`;

CREATE TABLE `tb_turn_log` (
  `TURN_LOG_ID` int NOT NULL AUTO_INCREMENT COMMENT '턴 로그 ID',
  `BATTLE_ID` int NOT NULL COMMENT '배틀 ID (TB_BATTLE_LOG 참조)',
  `TURN_NUMBER` int NOT NULL COMMENT '턴 번호',
  `ACTION_DETAIL` text NOT NULL COMMENT '턴별 상세 로그',
  `CREATED_DATE` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
  PRIMARY KEY (`TURN_LOG_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='전투 턴별 상세 로그';

DROP TABLE IF EXISTS `tb_user`;

CREATE TABLE `tb_user` (
  `USER_ID` varchar(50) NOT NULL COMMENT '사용자 ID',
  `USER_NAME` varchar(100) NOT NULL COMMENT '사용자 이름',
  `USER_EMAIL` varchar(100) DEFAULT NULL COMMENT '인증 및 알림용 이메일',
  `USER_PASSWORD` varchar(255) NOT NULL COMMENT '사용자 비밀번호',
  `USER_NICKNAME` varchar(50) NOT NULL COMMENT '유저 닉네임',
  `IMAGE_ID` int DEFAULT NULL COMMENT '프로필 이미지',
  `CREATED_DATE` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
  `ROLE` varchar(20) DEFAULT NULL COMMENT '유저타입 구분',
  `IS_EMAIL_VERIFIED` char(1) NOT NULL DEFAULT 'N' COMMENT '이메일 인증 완료 여부 (Y/N)',
  `CHARACTER_ID` int DEFAULT NULL,
  `HAS_CHARACTER` tinyint(1) NOT NULL DEFAULT '0' COMMENT '캐릭터 생성 여부 (TRUE/FALSE)',
  `INCUBATOR_COUNT` int NOT NULL DEFAULT '0' COMMENT '인큐베이터 총 보유 수(프로덕트 4,5 합산)',
  `IS_AD_FREE` tinyint(1) NOT NULL DEFAULT '0',
  `AD_FREE_EXPIRES_AT` datetime DEFAULT NULL COMMENT '광고 제거 만료 시각(최신 만료일)',
  PRIMARY KEY (`USER_ID`),
  UNIQUE KEY `USER_NICKNAME` (`USER_NICKNAME`),
  UNIQUE KEY `USER_EMAIL` (`USER_EMAIL`),
  UNIQUE KEY `USER_EMAIL_2` (`USER_EMAIL`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='사용자 정보';

DROP TABLE IF EXISTS `tb_user_inventory`;

CREATE TABLE `tb_user_inventory` (
  `INVENTORY_ID` int NOT NULL AUTO_INCREMENT COMMENT '인벤토리 ID',
  `USER_ID` varchar(50) NOT NULL COMMENT '유저 ID',
  `PRODUCT_ID` int NOT NULL COMMENT '상품 ID',
  `QUANTITY` int NOT NULL DEFAULT '0' COMMENT '보유개수',
  `EXPIRY_DATE` datetime DEFAULT NULL COMMENT '만료 일자 (무제한 NULL)',
  `ACQUIRED_DATE` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '획득 일자',
  `UPDATED_DATE` datetime DEFAULT NULL COMMENT '수정 일자',
  PRIMARY KEY (`INVENTORY_ID`),
  UNIQUE KEY `UK_UI_USER_PRODUCT` (`USER_ID`,`PRODUCT_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 보유 상픔';

DROP TABLE IF EXISTS `tb_user_quest`;

CREATE TABLE `tb_user_quest` (
  `USER_QUEST_ID` int NOT NULL AUTO_INCREMENT COMMENT '유저 퀘스트 진행 ID',
  `USER_ID` varchar(50) NOT NULL COMMENT '유저 ID',
  `QUEST_ID` int NOT NULL COMMENT '퀘스트 ID',
  `CURRENT_COUNT` int NOT NULL DEFAULT '0' COMMENT '현재 진행 횟수',
  `STATUS` varchar(20) NOT NULL DEFAULT 'IN_PROGRESS' COMMENT '진행 상태 (IN_PROGRESS, COMPLETED, REWARDED)',
  `STARTED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '시작 시각',
  `COMPLETED_AT` datetime DEFAULT NULL COMMENT '완료 시각',
  `LAST_RESET_DATE` date DEFAULT NULL COMMENT '마지막 초기화 일자',
  PRIMARY KEY (`USER_QUEST_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 퀘스트 진행 상태';

DROP TABLE IF EXISTS `tb_user_email_verify`;

CREATE TABLE `tb_user_email_verify` (
  `USER_ID` varchar(50) NOT NULL COMMENT '사용자 ID',
  `EMAIL` varchar(100) NOT NULL COMMENT '이메일 주소',
  `VERIFY_CODE` varchar(100) NOT NULL COMMENT '인증 코드',
  `EXPIRY_DATE` datetime NOT NULL COMMENT '만료 일시',
  `IS_VERIFIED` char(1) NOT NULL DEFAULT 'N' COMMENT '인증 성공 여부',
  `CREATED_DATE` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일자',
  `UPDATED_DATE` datetime DEFAULT NULL COMMENT '수정일자',
  PRIMARY KEY (`USER_ID`,`EMAIL`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='이메일 인증 정보';
