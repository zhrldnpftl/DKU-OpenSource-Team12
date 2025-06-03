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

class ActionRecommendMenu(Action):
    def name(self):
        return "action_recommend_menu"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain):
        category = tracker.get_slot("category")
        user_message = tracker.latest_message.get('text')

        if category:
            matched_recipes = dataset[dataset["CATEGORY"].str.contains(category, na=False, case=False)]
            if matched_recipes.empty:
                dispatcher.utter_message(text=f"'{category}' 카테고리에 맞는 레시피를 찾지 못했어요.")
                return []
        else:
            candidate_ingredients = dataset["CKG_MTRL_CN"].dropna().str.extractall(r'([가-힣]+)')[0].unique()
            nouns = okt.nouns(user_message)
            matched_ingredients = [noun for noun in nouns if any(noun in known for known in candidate_ingredients)]
            if not matched_ingredients:
                dispatcher.utter_message(text="입력하신 재료를 이해하지 못했어요 😢 다시 한 번 말씀해 주세요.")
                return []

            def contains_all_ingredients(recipe_ingredients, required_ingredients):
                return all(ingredient in recipe_ingredients for ingredient in required_ingredients)

            matched_recipes = dataset[dataset["CKG_MTRL_CN"].apply(lambda x: contains_all_ingredients(str(x), matched_ingredients))]
            if matched_recipes.empty:
                dispatcher.utter_message(text=f"{', '.join(matched_ingredients)}이(가) 모두 들어간 레시피를 찾지 못했어요.")
                return []

        samples = matched_recipes.sample(min(3, len(matched_recipes)))
        messages = []
        for _, row in samples.iterrows():
            recipe_code = row["RCP_SNO"]
            recipe_title = row["CKG_NM"]
            raw_ingredients = row["CKG_MTRL_CN"]
            steps, link = crawl_recipe(recipe_code)
            short_ingredients = parse_ingredients(raw_ingredients, max_items=3)
            msg = (f"🍽️ {recipe_title}\n"
                   f"🧂 재료:\n{short_ingredients}\n"
                   f"📝 조리법 요약: {steps}\n"
                   f"🔗 자세히 보기: {link}")
            messages.append(msg)

        dispatcher.utter_message(text="🔎 이런 메뉴들은 어떠세요?\n\n" + "\n\n".join(messages))
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

        samples = matched.sample(min(3, len(matched)))
        messages = []
        for _, choice in samples.iterrows():
            recipe_code = choice["RCP_SNO"]
            recipe_title = choice["CKG_NM"]
            raw_ing = choice["CKG_MTRL_CN"]

            try:
                steps, link = crawl_recipe(recipe_code)
            except Exception:
                steps, link = "조리법 정보를 불러오지 못했어요.", f"https://www.10000recipe.com/recipe/{recipe_code}"

            short_ing = parse_ingredients(raw_ing, max_items=3)

            message = (f"🍽️ {recipe_title}\n"
                       f"🧂 재료:\n{short_ing}\n"
                       f"📝 조리법 요약: {steps}\n"
                       f"🔗 상세 레시피 보기: {link}")
            messages.append(message)

        dispatcher.utter_message(
            text=(f"🔎 냉장고 재료: {', '.join(items)}\n\n"
                  f"추천 메뉴들입니다:\n\n" + "\n\n".join(messages))
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

class ActionHandleRecommendMenu(Action):
    def name(self) -> str:
        return "action_handle_recommend_menu"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: dict) -> list:
        category = tracker.get_slot("category")

        if category:
            dispatcher.utter_message(text=f"'{category}' 카테고리 메뉴를 추천해드릴게요!")
            # 실제 추천 로직을 여기에 구현하거나 호출
        else:
            dispatcher.utter_message(text="추천받고 싶은 카테고리를 알려주세요.")
        
        return []