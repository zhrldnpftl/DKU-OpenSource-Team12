from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
import requests
from bs4 import BeautifulSoup

def crawl_naver_recipe(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
    }
    res = requests.get(url, headers=headers)
    res.raise_for_status()  # 요청 실패 시 에러 발생

    soup = BeautifulSoup(res.text, 'html.parser')

    # 1) 재료 크롤링
    ingredients = []
    ingredient_elements = soup.select('ul.lst_ingrd > li')  # 네이버 레시피 구조에 따른 재료 리스트
    for item in ingredient_elements:
        ingredient_text = item.get_text(strip=True)
        if ingredient_text:
            ingredients.append(ingredient_text)

    # 2) 조리법 크롤링
    steps = []
    step_elements = soup.select('div.se-component.se-text.se-l-default > div > p')
    if not step_elements:
        # 구조가 바뀌었거나 다르면 다른 셀렉터 시도
        step_elements = soup.select('div.se-main-container > div > p')

    for step in step_elements:
        text = step.get_text(strip=True)
        if text:
            steps.append(text)

    return ingredients, steps

class ActionRecommendMenu(Action):
    def name(self):
        return "action_recommend_menu"

    def run(self, dispatcher, tracker, domain):
        query = tracker.latest_message.get('text')
        search_query = query + " 요리 레시피"
        client_id = "H3LkYEbx6DtWC3iMLU3A"
        client_secret = "U9R13UVhvI"

        url = "https://openapi.naver.com/v1/search/blog.json"
        headers = {
            "X-Naver-Client-Id": client_id,
            "X-Naver-Client-Secret": client_secret
        }
        params = {
            "query": search_query,
            "display": 1
        }

        response = requests.get(url, headers=headers, params=params)

        if response.status_code == 200:
            data = response.json()
            if data["items"]:
                item = data["items"][0]
                title = item["title"].replace("<b>", "").replace("</b>", "")
                link = item["link"]

                # 크롤링 함수 호출해서 재료와 조리법 가져오기
                try:
                    ingredients, steps = crawl_naver_recipe(link)
                    ingredients_text = "\n".join(ingredients) if ingredients else "재료 정보가 없습니다."
                    steps_text = "\n".join(steps) if steps else "조리법 정보가 없습니다."

                    dispatcher.utter_message(text=f"이런 레시피는 어때요?\n👉 {title}\n재료:\n{ingredients_text}\n\n조리법:\n{steps_text}\n\n자세한 내용은 여기를 참고하세요: {link}")

                except Exception as e:
                    dispatcher.utter_message(text=f"레시피 정보를 가져오는 중 오류가 발생했어요.\n{str(e)}\n자세한 내용은 여기를 참고하세요: {link}")

            else:
                dispatcher.utter_message(text="죄송해요, 관련된 블로그 글을 찾지 못했어요.")
        else:
            dispatcher.utter_message(text="블로그 정보를 가져오는데 문제가 발생했어요.")

        return []
    