-- 1. 사용자 테이블
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,         -- 고유 사용자 번호 (내부 PK, 자동 증가)
    user_id TEXT NOT NULL UNIQUE,                 -- 사용자가 직접 입력하는 ID (로그인용, 유니크)
    username TEXT,                                -- 사용자 이름 (닉네임이나 화면에 표시될 이름)
    password TEXT NOT NULL,                       -- 암호화된 비밀번호
    email TEXT NOT NULL UNIQUE,                   -- 이메일 주소 (유니크)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,-- 가입 일시 (기본값: 현재 시간)
    preferred_style TEXT                          -- 선호 요리 스타일 (예: 건강식, 간단요리 등)
);

-- 2. 냉장고 재료 테이블
CREATE TABLE fridge_items (
    fridge_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 고유 재료 항목 번호 (PK)
    user_id INTEGER NOT NULL,                     -- 소유 사용자 ID (users.id를 참조)
    item_name TEXT NOT NULL,                      -- 재료 이름 (예: 계란, 대파)
    is_seasoning BOOLEAN DEFAULT 0,               -- 조미료 여부 (0: 일반 재료, 1: 조미료)
    FOREIGN KEY (user_id) REFERENCES users(id)    -- 외래키 연결 (users 테이블의 id 참조)
);
.
-- 3. 즐겨찾기 레시피 테이블
CREATE TABLE saved_recipes (
    recipe_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 고유 레시피 번호 (PK)
    user_id INTEGER NOT NULL,                     -- 저장한 사용자 ID (users.id를 참조)
    recipe_title TEXT NOT NULL,                   -- 레시피 제목
    recipe_url TEXT,                              -- 레시피 출처 링크
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 저장 일시 (기본값: 현재 시간)
    FOREIGN KEY (user_id) REFERENCES users(id)    -- 외래키 연결 (users 테이블의 id 참조)
);

-- 4. 추천 레시피 기록 테이블
CREATE TABLE recipe_recommendations (
    recommendation_id INTEGER PRIMARY KEY AUTOINCREMENT, -- 고유 추천 ID (PK)
    user_id INTEGER NOT NULL,                            -- 추천 요청 사용자 ID (users.id 참조)
    recommended_query TEXT,                              -- 사용자의 요청 문장 (예: “10분 요리 알려줘”)
    recommended_title TEXT,                              -- 추천된 레시피 제목
    recommended_url TEXT,                                -- 추천된 레시피 링크
    recommended_at DATETIME DEFAULT CURRENT_TIMESTAMP,   -- 추천 일시 (기본값: 현재 시간)
    FOREIGN KEY (user_id) REFERENCES users(id)           -- 외래키 연결 (users 테이블의 id 참조)
);

-- 5. 외부 레시피 데이터 테이블 (만개의 레시피에서 가져온 것)
CREATE TABLE recipes_dataset (
    RCP_SNO INTEGER PRIMARY KEY,           -- 레시피 일련번호 (고유값)
    RCP_TTL TEXT,                          -- 레시피 제목
    CKG_NM TEXT,                           -- 요리명
    RGTR_ID TEXT,                          -- 등록자 ID
    RGTR_NM TEXT,                          -- 등록자명
    INQ_CNT INTEGER,                       -- 조회수
    RCMM_CNT INTEGER,                      -- 추천수
    SRAP_CNT INTEGER,                      -- 스크랩수
    CKG_MTH_ACTO_NM TEXT,                  -- 요리 방법
    CKG_STA_ACTO_NM TEXT,                  -- 요리 상황
    CKG_MTRL_ACTO_NM TEXT,                 -- 요리 재료 분류
    CKG_KND_ACTO_NM TEXT,                  -- 요리 종류
    CKG_IPDC TEXT,                         -- 요리 소개
    CKG_MTRL_CN TEXT,                      -- 요리 재료 내용
    CKG_INBUN_NM TEXT,                     -- 인분 정보
    CKG_DODF_NM TEXT,                      -- 난이도
    CKG_TIME_NM TEXT,                      -- 요리 시간
    FIRST_REG_DT TEXT                      -- 최초 등록일시 (문자열로 저장)
);
