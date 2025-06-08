from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, FollowupAction
import pandas as pd
import os
import re
import requests
from bs4 import BeautifulSoup
from konlpy.tag import Okt
import sqlite3
import logging

# 형태소 분석기 및 로거 초기화
oct = Okt()
logger = logging.getLogger(__name__)

# 단위 목록 정의 (NLU에서 분리한 unit 엔티티 추가 필터링 용)
UNIT_LIST = ["컵", "큰술", "작은술", "티스푼", "스푼", "g", "ml", "개"]

# 난이도 매핑 (사용자 표현 -> 데이터셋의 난이도)
DIFFICULTY_MAP = {
    '초보용': '초급', '초보': '초급', '초급': '초급',
    '중급용': '중급', '중급': '중급',
    '고급용': '고급', '고급': '고급'
}

# 데이터셋 로드 및 전처리
dataset_path = os.path.join(
    os.path.dirname(__file__),
    '../..',
    'backend',
    'db',
    'TB_RECIPE_SEARCH_241226.csv'
)
dataset = pd.read_csv(dataset_path)

# 시간 문자열을 분 단위 정수로 변환 (예: '1시간 30분 이내' -> 90분)
def parse_time_to_minutes(time_str):
    if pd.isna(time_str):
        return float('inf')
    hours = re.search(r"(\d+)\s*시간", time_str)
    mins = re.search(r"(\d+)\s*분", time_str)
    total = 0
    if hours:
        total += int(hours.group(1)) * 60
    if mins:
        total += int(mins.group(1))
    return total

# 분 단위 숫자 칼럼 생성
dataset['time_min'] = dataset['CKG_TIME_NM'].apply(parse_time_to_minutes)

# 10000recipe.com 크롤러 함수
def crawl_recipe(recipe_code):
    url = f"https://www.10000recipe.com/recipe/{recipe_code}"
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        res = requests.get(url, headers=headers)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, 'html.parser')
        steps = (
            [step.get_text(strip=True) for step in soup.select("span.view_step_text")]  
            or [step.get_text(strip=True) for step in soup.select("div.view_step_cont")]
        )
        if steps:
            return " ".join(steps[:3]), url
        return "조리법 정보를 불러오지 못했어요 😢", url
    except Exception as e:
        logger.error(f"크롤링 실패: {e}")
        return "조리법 정보를 불러오지 못했어요 😢", url

# CSV 원재료 문자열 파싱 함수
def parse_ingredients(raw_str, max_items=5):
    cleaned = re.sub(r'\[[^\]]*\]', '', raw_str)
    parts = cleaned.split('|')
    items = []
    for itm in parts:
        seg = itm.split('\a')
        name = seg[0].strip() if seg else ''
        qty  = seg[1].strip() if len(seg) > 1 else ''
        unit = seg[2].strip() if len(seg) > 2 else ''
        txt = f"{name} {qty} {unit}".strip()
        if txt:
            items.append(txt)
    if len(items) > max_items:
        return "\n".join(items[:max_items]) + "\n... 그 외 재료는 링크에서 확인해보세요!"
    return "\n".join(items)

class ActionRecommendMenu(Action):
    def name(self):
        return "action_recommend_menu"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: dict):
        category   = tracker.get_slot("category")
        ingredient = tracker.get_slot("ingredient")
        difficulty = tracker.get_slot("difficulty")
        time_slot  = tracker.get_slot("time")
        user_msg   = tracker.latest_message.get('text', "")

        # 기본 필터 생성
        cond = pd.Series(True, index=dataset.index)

        # 재료 필터
        if ingredient:
            cond &= dataset["CKG_MTRL_CN"].fillna("").str.contains(ingredient, case=False)
        # 카테고리 필터
        if category:
            cat_cond = (
                dataset["CKG_STA_ACTO_NM"].fillna("").str.contains(category, case=False) |
                dataset["CKG_KND_ACTO_NM"].fillna("").str.contains(category, case=False) |
                dataset["CKG_MTH_ACTO_NM"].fillna("").str.contains(category, case=False) |
                dataset["CKG_MTRL_ACTO_NM"].fillna("").str.contains(category, case=False)
            )
            cond &= cat_cond
            if category == '비건':
                cond &= ~dataset["CKG_MTRL_CN"].fillna("").str.contains('닭|소고기|돼지고기|계란', case=False)
        # 난이도 필터
        if difficulty:
            diff = DIFFICULTY_MAP.get(difficulty, difficulty)
            cond &= dataset["CKG_DODF_NM"].fillna("").str.contains(diff, case=False)
        # 시간 필터
        if time_slot:
            threshold = parse_time_to_minutes(time_slot)
            cond &= dataset['time_min'] <= threshold

        # 슬롯 기반 검색
        if any([ingredient, category, difficulty, time_slot]):
            matched = dataset[cond]
            if matched.empty:
                dispatcher.utter_message(text=f"죄송해요. '{ingredient or category or difficulty or time_slot}' 관련 레시피를 찾지 못했어요.")
                return []
        else:
            candidate = dataset["CKG_MTRL_CN"].dropna().str.extractall(r'([가-힣]+)')[0].unique()
            nouns = oct.nouns(user_msg)
            filtered = [n for n in nouns if n not in UNIT_LIST]
            matched_ing = [n for n in filtered if n in candidate]
            if not matched_ing:
                dispatcher.utter_message(text="입력하신 재료를 이해하지 못했어요 😢 다시 입력해주세요.")
                return []
            def all_in(x, req): return all(r in str(x) for r in req)
            matched = dataset[dataset["CKG_MTRL_CN"].apply(lambda x: all_in(x, matched_ing))]
            if matched.empty:
                dispatcher.utter_message(text=f"{', '.join(matched_ing)} 모두 들어간 레시피를 찾지 못했어요.")
                return []

        # 추천 샘플링 & 응답
        samples = matched.sample(min(3, len(matched)))
        for _, row in samples.iterrows():
            code      = row["RCP_SNO"]
            title     = row["CKG_NM"]
            raw_ing   = row["CKG_MTRL_CN"]
            cat       = row["CKG_KND_ACTO_NM"]
            raw_time  = row["CKG_TIME_NM"]
            cook_time = raw_time if pd.notna(raw_time) else ""
            steps, link = crawl_recipe(code)
            ingredients = parse_ingredients(raw_ing, max_items=3)

            dispatcher.utter_message(json_message={
                "type": "recipe",
                "title": title,
                "category": cat,
                "time": cook_time,
                "ingredients": ingredients,
                "instructions": steps,
                "url": link,
                "rcp_sno": code
            })
        return []

class ActionRecommendFromFridge(Action):
    def name(self):
        return "action_recommend_from_fridge"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: dict):
        user_id    = tracker.get_slot("user_id")
        category   = tracker.get_slot("category")
        difficulty = tracker.get_slot("difficulty")
        time_slot  = tracker.get_slot("time")

        if not user_id:
            dispatcher.utter_message(text="먼저 로그인하거나 user_id를 알려주세요.")
            return []

        # DB에서 냉장고 재료 조회
        db_path = os.path.join(
            os.path.dirname(__file__),
            '../..',
            'backend',
            'db',
            'fridge.db'
        )
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE user_id = ?", (user_id,))
        row = cur.fetchone()
        if not row:
            dispatcher.utter_message(text="사용자 정보를 찾을 수 없습니다.")
            conn.close()
            return []
        uid = row["id"]
        cur.execute("SELECT item_name FROM fridge_items WHERE user_id = ?", (uid,))
        items = [r["item_name"] for r in cur.fetchall()]
        conn.close()

        if not items:
            dispatcher.utter_message(text="냉장고에 등록된 재료가 없습니다. 먼저 재료를 등록해 주세요.")
            return []

        # 헬퍼 함수 정의
        def all_in(x, req):
            return all(i in str(x) for i in req)

        def any_in(x, req):
            return any(i in str(x) for i in req)

        def category_cond(df):
            cond = pd.Series(True, index=df.index)
            if category:
                cat_c = (
                    df["CKG_STA_ACTO_NM"].fillna("").str.contains(category, case=False) |
                    df["CKG_KND_ACTO_NM"].fillna("").str.contains(category, case=False) |
                    df["CKG_MTH_ACTO_NM"].fillna("").str.contains(category, case=False) |
                    df["CKG_MTRL_ACTO_NM"].fillna("").str.contains(category, case=False)
                )
                cond &= cat_c
                if category == '비건':
                    cond &= ~df["CKG_MTRL_CN"].fillna("").str.contains('닭|소고기|돼지고기|계란', case=False)
            if difficulty:
                diff = DIFFICULTY_MAP.get(difficulty, difficulty)
                cond &= df["CKG_DODF_NM"].fillna("").str.contains(diff, case=False)
            if time_slot:
                threshold = parse_time_to_minutes(time_slot)
                cond &= df['time_min'] <= threshold
            return cond

        # 완전 매칭 우선 검색
        df_full = dataset[
            dataset["CKG_MTRL_CN"].apply(lambda x: all_in(x, items)) &
            category_cond(dataset)
        ]
        partial = False
        if df_full.empty:
            dispatcher.utter_message(text="냉장고 재료만으로는 부족합니다! 추가적인 재료를 구매해서 요리해보세요!")
            df_full = dataset[
                dataset["CKG_MTRL_CN"].apply(lambda x: any_in(x, items)) &
                category_cond(dataset)
            ]
            partial = True
            if df_full.empty:
                dispatcher.utter_message(text="냉장고 재료로 만들 수 있는 메뉴를 찾지 못했어요.")
                return []

        # 안내 메시지
        dispatcher.utter_message(
            text=(
                f"🔎 냉장고 재료: {', '.join(items)}\n"
                f"🔖 카테고리: {category or '전체'}\n"
                + ("✅ 완전 매칭만 추천 중입니다." if not partial else "✅ 일부 매칭도 함께 보여드립니다.")
            )
        )

        # 샘플링 및 응답
        samples = df_full.sample(min(3, len(df_full)))
        for _, row in samples.iterrows():
            code      = row["RCP_SNO"]
            title     = row["CKG_NM"]
            raw_ing   = row["CKG_MTRL_CN"]
            cat       = row["CKG_KND_ACTO_NM"]
            raw_time  = row["CKG_TIME_NM"]
            cook_time = raw_time if pd.notna(raw_time) else ""
            steps, link = crawl_recipe(code)
            ingredients = parse_ingredients(raw_ing, max_items=3)

            if partial:
                needed = []
                for itm in raw_ing.split('|'):
                    seg = itm.split('\a')
                    name = seg[0].strip() if seg else ''
                    if name and name not in UNIT_LIST and name not in items:
                        needed.append(name)
                dispatcher.utter_message(text=f"냉장고에 있는 재료 외에 {', '.join(needed)} 재료가 더 필요한 메뉴예요!")

            dispatcher.utter_message(json_message={
                "type": "recipe",
                "title": title,
                "category": cat,
                "time": cook_time,
                "ingredients": ingredients,
                "instructions": steps,
                "url": link,
                "rcp_sno": code
            })
        return []
