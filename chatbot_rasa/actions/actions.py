from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
import pandas as pd
import os
import re
import requests
from bs4 import BeautifulSoup
from konlpy.tag import Okt

okt = Okt()

# 데이터 로드
dataset_path = os.path.join(os.path.dirname(__file__), '../..', 'backend', 'db', 'TB_RECIPE_SEARCH_241226.csv')
dataset = pd.read_csv(dataset_path)

# 조리법 크롤링
def crawl_recipe(recipe_code):
    url = f"https://www.10000recipe.com/recipe/{recipe_code}"
    headers = {"User-Agent": "Mozilla/5.0"}
    res = requests.get(url, headers=headers)
    res.raise_for_status()

    soup = BeautifulSoup(res.text, 'html.parser')

    steps = []
    for step in soup.select("span.view_step_text"):
        text = step.get_text(strip=True)
        if text:
            steps.append(text)
    if not steps:
        for step in soup.select("div.view_step_cont"):
            text = step.get_text(strip=True)
            if text:
                steps.append(text)
    step_text = "\n".join(steps) if steps else "조리법 정보를 불러오지 못했어요 😢"

    return step_text, url

# 재료 파싱
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

# 액션 클래스
class ActionRecommendMenu(Action):
    def name(self):
        return "action_recommend_menu"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain):
        user_message = tracker.latest_message.get('text')
        candidate_ingredients = dataset["CKG_MTRL_CN"].dropna().str.extractall(r'([가-힣]+)')[0].unique()

        nouns = okt.nouns(user_message)
        print(f"사용자 명사 추출: {nouns}")

        matched_ingredients = []
        for noun in nouns:
            for known in candidate_ingredients:
                if noun in known:
                    matched_ingredients.append(noun)
                    break

        if not matched_ingredients:
            dispatcher.utter_message(text="입력하신 재료를 이해하지 못했어요 😢 다시 한 번 말씀해 주세요.")
            return []

        # AND 조건: 모든 재료가 포함된 레시피만 필터링
        def contains_all_ingredients(recipe_ingredients, required_ingredients):
            return all(ingredient in recipe_ingredients for ingredient in required_ingredients)

        matched_recipes = dataset[dataset["CKG_MTRL_CN"].apply(
            lambda x: contains_all_ingredients(str(x), matched_ingredients)
        )]

        if matched_recipes.empty:
            dispatcher.utter_message(text=f"{', '.join(matched_ingredients)}이(가) 모두 들어간 레시피를 찾지 못했어요.")
            return []

        recipe_row = matched_recipes.sample().iloc[0]
        recipe_code = recipe_row["RCP_SNO"]
        recipe_title = recipe_row["CKG_NM"]
        raw_ingredients = recipe_row["CKG_MTRL_CN"]

        try:
            steps, link = crawl_recipe(recipe_code)
            short_ingredients = parse_ingredients(raw_ingredients, max_items=5)

            steps_lines = steps.split('\n') if steps else []
            short_steps = '\n'.join(steps_lines[:5]) if steps_lines else "조리법 정보를 불러오지 못했어요 😢"
            if len(steps_lines) > 5:
                short_steps += "\n\n... 자세한 조리법은 링크에서 확인하세요!"

            dispatcher.utter_message(
                text=(f"🔎 이런 레시피는 어때요?\n\n"
                      f"🍽️ 메뉴명: {recipe_title}\n\n"
                      f"🧂 재료:\n{short_ingredients}\n\n"
                      f"📝 조리법:\n{short_steps}\n\n"
                      f"🔗 자세히 보기: {link}")
            )

        except Exception as e:
            dispatcher.utter_message(text=f"레시피를 가져오는 중 오류가 발생했어요: {str(e)}")

        return []
    