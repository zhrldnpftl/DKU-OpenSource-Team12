-- 1. 사용자 테이블
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,              -- 고유 사용자 번호 (내부 PK, 자동 증가)
    user_id TEXT NOT NULL UNIQUE,                      -- 사용자가 직접 입력한 ID (로그인용, 유니크)
    username TEXT,                                     -- 사용자 이름 또는 닉네임
    password TEXT NOT NULL,                            -- 암호화된 비밀번호
    email TEXT NOT NULL UNIQUE,                        -- 사용자 이메일 (유니크)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,     -- 가입 일시 (기본값: 현재 시간)
    preferred_style TEXT                               -- 선호 요리 스타일 (예: 건강식, 다이어트 등)
);

-- 2. 냉장고 재료 테이블
CREATE TABLE fridge_items (
    fridge_id INTEGER PRIMARY KEY AUTOINCREMENT,       -- 고유 냉장고 항목 번호 (PK)
    user_id INTEGER NOT NULL,                          -- 소유 사용자 ID (users.id 참조)
    item_name TEXT NOT NULL,                           -- 재료 이름 (예: 양파, 간장)
    item_category TEXT,                                -- 재료 분류 (예: 채소, 육류 등)
    is_seasoning BOOLEAN DEFAULT 0,                    -- 조미료 여부 (0: 일반 재료, 1: 조미료)
    FOREIGN KEY (user_id) REFERENCES users(id)         -- users 테이블의 id와 외래키 연결
);

-- 3. 즐겨찾기 레시피 테이블
CREATE TABLE saved_recipes (
    recipe_id INTEGER PRIMARY KEY AUTOINCREMENT,       -- 즐겨찾기 고유 번호 (PK)
    user_id INTEGER NOT NULL,                          -- 저장한 사용자 ID (users.id 참조)
    RCP_SNO INTEGER NOT NULL,                          -- 레시피 고유번호 (recipes_dataset.RCP_SNO 참조)
    recipe_url TEXT,                                   -- 레시피 링크 (출처 URL)
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,       -- 저장 일시 (기본값: 현재 시간)
    FOREIGN KEY (user_id) REFERENCES users(id),        -- 사용자 테이블과 외래키 연결
    FOREIGN KEY (RCP_SNO) REFERENCES recipes_dataset(RCP_SNO) -- 레시피 테이블과 외래키 연결
);

-- 4. 추천 레시피 기록 테이블
CREATE TABLE recipe_recommendations (
    recommendation_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 추천 기록 고유 번호 (PK)
    user_id INTEGER NOT NULL,                             -- 추천 사용자 ID (users.id 참조)
    RCP_SNO INTEGER NOT NULL,                             -- 추천된 레시피 ID (recipes_dataset.RCP_SNO 참조)
    recommended_query TEXT,                               -- 사용자 요청 문장 (예: "10분 요리 알려줘")
    recommended_url TEXT,                                 -- 추천된 레시피 링크
    recommended_at DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 추천 일시 (기본값: 현재 시간)
    FOREIGN KEY (user_id) REFERENCES users(id),           -- 사용자 테이블과 외래키 연결
    FOREIGN KEY (RCP_SNO) REFERENCES recipes_dataset(RCP_SNO) -- 레시피 테이블과 외래키 연결
);

-- 5. 외부 레시피 데이터셋 테이블 (만개의 레시피)
CREATE TABLE recipes_dataset (
    RCP_SNO INTEGER PRIMARY KEY,         -- 레시피 일련번호 (고유 ID)
    RCP_TTL TEXT,                        -- 레시피 제목
    CKG_NM TEXT,                         -- 요리명
    RGTR_ID TEXT,                        -- 등록자 ID
    RGTR_NM TEXT,                        -- 등록자명
    INQ_CNT INTEGER,                     -- 조회수
    RCMM_CNT INTEGER,                    -- 추천수
    SRAP_CNT INTEGER,                    -- 스크랩수
    CKG_MTH_ACTO_NM TEXT,                -- 요리 방법 (예: 볶기, 끓이기 등)
    CKG_STA_ACTO_NM TEXT,                -- 요리 상황 (예: 손님접대, 아침식사 등)
    CKG_MTRL_ACTO_NM TEXT,               -- 요리 재료 분류 (예: 돼지고기, 채소 등)
    CKG_KND_ACTO_NM TEXT,                -- 요리 종류 (예: 찌개, 볶음 등)
    CKG_IPDC TEXT,                       -- 요리 소개
    CKG_MTRL_CN TEXT,                    -- 요리 재료 내용 (예: 양파 1개, 간장 1큰술 등)
    CKG_INBUN_NM TEXT,                   -- 인분 정보 (예: 2인분, 4인분 등)
    CKG_DODF_NM TEXT,                    -- 난이도 (예: 초보, 중급)
    CKG_TIME_NM TEXT,                    -- 요리 시간 (예: 10분, 30분 이상)
    FIRST_REG_DT TEXT                    -- 최초 등록 일시
);
