from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
import pandas as pd
import os
import re
import requests
from bs4 import BeautifulSoup
from konlpy.tag import Okt
import sqlite3
import logging
from rasa_sdk.events import FollowupAction

okt = Okt()
logger = logging.getLogger(__name__)

dataset_path = os.path.join(os.path.dirname(__file__), '../..', 'backend', 'db', 'TB_RECIPE_SEARCH_241226.csv')
dataset = pd.read_csv(dataset_path)

def crawl_recipe(recipe_code):
    url = f"https://www.10000recipe.com/recipe/{recipe_code}"
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        res = requests.get(url, headers=headers)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, 'html.parser')
        steps = [step.get_text(strip=True) for step in soup.select("span.view_step_text")]
        if not steps:
            steps = [step.get_text(strip=True) for step in soup.select("div.view_step_cont")]
        if steps:
            return " ".join(steps[:2]), url
        else:
            return "조리법 정보를 불러오지 못했어요 😢", url
    except Exception as e:
        logger.error(f"크롤링 실패: {e}")
        return "조리법 정보를 불러오지 못했어요 😢", url

def parse_ingredients(raw_str, max_items=5):
    cleaned_str = re.sub(r'\[[^\]]*\]', '', raw_str)
    items = cleaned_str.split('|')
    parsed_items = []
    for item in items:
        parts = item.split('\a')
        name = parts[0].strip() if len(parts) > 0 else ''
        qty = parts[1].strip() if len(parts) > 1 else ''
        unit = parts[2].strip() if len(parts) > 2 else ''
        if qty and unit:
            parsed = f"{name} {qty} {unit}"
        elif qty:
            parsed = f"{name} {qty}"
        else:
            parsed = name
        if parsed:
            parsed_items.append(parsed)
    if len(parsed_items) > max_items:
        return '\n'.join(parsed_items[:max_items]) + '\n... 그 외 재료는 링크에서 확인해보세요!'
    else:
        return '\n'.join(parsed_items)

# ✅ 메뉴 추천 액션 - 재료/카테고리 유무에 따라 추천 로직 분기
class ActionRecommendMenu(Action):
    def name(self):
        return "action_recommend_menu"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: dict):
        category = tracker.get_slot("category")
        ingredient = tracker.get_slot("ingredient")
        difficulty = tracker.get_slot("difficulty")
        time = tracker.get_slot("time")
        user_message = tracker.latest_message.get('text')
        entities = tracker.latest_message.get("entities", [])
        slots = tracker.current_slot_values()

        # 🔍 로그 출력
        print("🧩 [DEBUG] action_recommend_menu 슬롯 상태 - category:", category, "ingredient:", ingredient)
        print("🗣️ [DEBUG] 사용자 입력:", user_message)
        print("📦 [DEBUG] entities:", entities)
        print("📦 [DEBUG] slots:", slots)

        # 🔄 category/difficulty/time 기반 추천
        if category or difficulty or time:
            matched_recipes = dataset[
                dataset["CKG_STA_ACTO_NM"].fillna("").str.contains(category or "", case=False) |
                dataset["CKG_KND_ACTO_NM"].fillna("").str.contains(category or "", case=False) |
                dataset["CKG_MTH_ACTO_NM"].fillna("").str.contains(category or "", case=False) |
                dataset["CKG_MTRL_ACTO_NM"].fillna("").str.contains(category or "", case=False) |
                dataset["CKG_DODF_NM"].fillna("").str.contains(difficulty or "", case=False) |
                dataset["CKG_TIME_NM"].fillna("").str.contains(time or "", case=False)
            ]

            if matched_recipes.empty:
                dispatcher.utter_message(text=f"'{category}'와 관련된 레시피를 찾지 못했어요.")
                return []
        else:
            # 🔄 ingredient 기반 추천
            candidate_ingredients = dataset["CKG_MTRL_CN"].dropna().str.extractall(r'([가-힣]+)')[0].unique()
            nouns = okt.nouns(user_message)
            matched_ingredients = [noun for noun in nouns if any(noun in known for known in candidate_ingredients)]
            print("🧪 [DEBUG] 추출된 명사:", nouns)
            print("🎯 [DEBUG] 매칭된 재료:", matched_ingredients)

            if not matched_ingredients:
                dispatcher.utter_message(text="입력하신 재료를 이해하지 못했어요 😢 다시 말씀해 주세요.")
                return []

            def contains_all_ingredients(recipe_ingredients, required_ingredients):
                return all(ingredient in recipe_ingredients for ingredient in required_ingredients)

            matched_recipes = dataset[dataset["CKG_MTRL_CN"].apply(lambda x: contains_all_ingredients(str(x), matched_ingredients))]
            if matched_recipes.empty:
                dispatcher.utter_message(text=f"{', '.join(matched_ingredients)}이(가) 모두 들어간 레시피를 찾지 못했어요.")
                return []

        # ✅ 추천 레시피 3개 샘플링
        samples = matched_recipes.sample(min(3, len(matched_recipes)))
        messages = []  # 🔸텍스트 요약용 메시지 리스트

         # ✅ 전체 요약 텍스트도 함께 전송 (기존 텍스트 유지용)
        dispatcher.utter_message(text="🔎 이런 메뉴들은 어떠세요?\n\n" + "\n\n".join(messages))

        for _, row in samples.iterrows():
            recipe_code = row["RCP_SNO"]
            recipe_title = row["CKG_NM"]
            raw_ingredients = row["CKG_MTRL_CN"]
            steps, link = crawl_recipe(recipe_code)
            short_ingredients = parse_ingredients(raw_ingredients, max_items=3)

            # ✅ Rasa → RN으로 보낼 custom 메시지 (ChatbotScreen.js에서 custom.type === 'recipe'로 분기)
            dispatcher.utter_message(
                json_message={
                    "type": "recipe",
                    "title": recipe_title,
                    "ingredients": short_ingredients,
                    "instructions": steps,
                    "url": link,
                    "rcp_sno": recipe_code
                }
            )
        return []



class ActionRecommendFromFridge(Action):
    def name(self) -> str:
        return "action_recommend_from_fridge"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: dict):
        user_id = tracker.get_slot("user_id")
        if not user_id:
            dispatcher.utter_message(text="먼저 로그인하거나 user_id를 알려주세요.")
            return []

        db_path = os.path.join(os.path.dirname(__file__), '../..', 'backend', 'db', 'fridge.db')
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE user_id = ?", (user_id,))
        row = cur.fetchone()
        if not row:
            dispatcher.utter_message(text="해당 사용자 정보를 찾을 수 없습니다.")
            conn.close()
            return []
        user_numeric_id = row["id"]

        cur.execute("SELECT item_name FROM fridge_items WHERE user_id = ?", (user_numeric_id,))
        items = [r["item_name"] for r in cur.fetchall()]
        conn.close()

        if not items:
            dispatcher.utter_message(text="냉장고에 등록된 재료가 없습니다. 재료를 먼저 등록해 주세요.")
            return []

        # 🔍 전체 재료 포함 여부 함수
        def contains_all_ingredients(recipe_ingredients, user_items):
            return all(item in str(recipe_ingredients) for item in user_items)

        matched = dataset[dataset["CKG_MTRL_CN"].apply(lambda x: contains_all_ingredients(x, items))]

        if matched.empty:
            dispatcher.utter_message(text="재료가 부족합니다! 최대한 가능한 메뉴 알려드릴게요.")

            def contains_any_ingredient(recipe_ingredients, user_items):
                return any(item in str(recipe_ingredients) for item in user_items)

            matched = dataset[dataset["CKG_MTRL_CN"].apply(lambda x: contains_any_ingredient(x, items))]

            if matched.empty:
                dispatcher.utter_message(text="냉장고 재료로 만들 수 있는 메뉴를 찾지 못했어요.")
                return []

        # ✅ 추천 메뉴 샘플
        samples = matched.sample(min(3, len(matched)))
        messages = []  # 텍스트용 메시지 저장용

            # ✅ 전체 텍스트 요약 출력
        dispatcher.utter_message(
            text=(f"🔎 냉장고 재료: {', '.join(items)}\n\n"
                  f"추천 메뉴들입니다:\n\n" + "\n\n".join(messages))
        )

        for _, choice in samples.iterrows():
            recipe_code = choice["RCP_SNO"]
            recipe_title = choice["CKG_NM"]
            raw_ing = choice["CKG_MTRL_CN"]
            steps, link = crawl_recipe(recipe_code)
            short_ing = parse_ingredients(raw_ing, max_items=3)

            # ✅ React Native용 커스텀 응답
            dispatcher.utter_message(
                json_message={
                    "type": "recipe",
                    "title": recipe_title,
                    "ingredients": short_ing,
                    "instructions": steps,
                    "url": link,
                    "rcp_sno": recipe_code
                }
            )

        return []

class ActionShoppingSuggestion(Action):
    def name(self) -> str:
        return "action_shopping_suggestion"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: dict):
        user_id = tracker.get_slot("user_id")
        if not user_id:
            dispatcher.utter_message(text="먼저 로그인하거나 user_id를 알려주세요.")
            return []

        db_path = os.path.join(os.path.dirname(__file__), '../..', 'backend', 'db', 'fridge.db')
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE user_id = ?", (user_id,))
        row = cur.fetchone()
        if not row:
            dispatcher.utter_message(text="해당 사용자 정보를 찾을 수 없습니다.")
            conn.close()
            return []
        user_numeric_id = row["id"]

        cur.execute("SELECT item_name FROM fridge_items WHERE user_id = ?", (user_numeric_id,))
        items = [r["item_name"] for r in cur.fetchall()]
        conn.close()

        common_ingredients = ["양파", "감자", "당근", "두부", "토마토", "대파", "버섯", "계란"]
        missing = [ing for ing in common_ingredients if ing not in items]

        if not items:
            dispatcher.utter_message(text="냉장고에 등록된 재료가 없습니다. 먼저 재료를 등록해 주세요.")
            return []

        if not missing:
            dispatcher.utter_message(text="냉장고에 흔히 쓰이는 재료는 충분히 있으시네요. 바로 요리해 보세요!")
            return []

        dispatcher.utter_message(
            text=(
                f"🔔 현재 냉장고 재료: {', '.join(items)}\n\n"
                f"❗ 아래 재료를 구매하면 더 다양한 레시피를 시도해볼 수 있어요:\n- " + "\n- ".join(missing[:5])
            )
        )
        return []

class ActionStoreUserId(Action):
    def name(self):
        return "action_store_user_id"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: dict):
        user_id = next(tracker.get_latest_entity_values("user_id"), None)
        if user_id:
            dispatcher.utter_message(text=f"{user_id}님, 환영합니다!")
            return [SlotSet("user_id", user_id)]
        else:
            dispatcher.utter_message(text="user_id를 인식하지 못했어요. 다시 알려주세요.")
            return []

# ✅ 카테고리만 입력되었을 경우 처리하는 핸들러 액션
class ActionHandleRecommendMenu(Action):
    def name(self) -> str:
        return "action_handle_recommend_menu"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: dict):
        category = tracker.get_slot("category")
        ingredient = tracker.get_slot("ingredient")

        print(f"🧩 [DEBUG] 현재 슬롯 상태 - category: {category}, ingredient: {ingredient}")
        print(f"🗣️ [DEBUG] 사용자 입력: {tracker.latest_message.get('text')}")
        print(f"📦 [DEBUG] entities: {tracker.latest_message.get('entities')}")
        print(f"📦 [DEBUG] slots: {tracker.current_slot_values()}")

        # ✅ 1. category 또는 ingredient 중 하나라도 있으면 메뉴 추천 액션 호출
        if category or ingredient:
            dispatcher.utter_message(text="추천 가능한 정보를 확인했어요! 메뉴를 찾아볼게요.")
            return [FollowupAction("action_recommend_menu")]

        # ❌ 둘 다 없는 경우
        dispatcher.utter_message(text="추천받고 싶은 요리 카테고리나 재료를 알려주세요.")
        return []
