# backend/db/import_recipes.py

# TB_RECIPE_SEARCH_241226.csv의 내용을 recipes_dataset에 삽입하는 코드드

import pandas as pd
import sqlite3
import os

# 1. DB 및 CSV 경로 설정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "fridge.db")
CSV_FILE = os.path.join(BASE_DIR, "TB_RECIPE_SEARCH_241226.csv")

# 2. CSV 불러오기 (인코딩 설정 → CP949 또는 EUC-KR)
# 인코딩: 한글 안 깨지고 잘 열리면 utf-8 또는 utf-8-sig
try:
    df = pd.read_csv(CSV_FILE, encoding='utf-8-sig')
except UnicodeDecodeError:
    df = pd.read_csv(CSV_FILE, encoding='utf-8')

print(f"✅ 데이터 불러오기 완료: {len(df)} 행")

# 3. DB 연결
conn = sqlite3.connect(DB_PATH)

# 4. recipes_dataset 테이블에 저장
df.to_sql("recipes_dataset", conn, if_exists="replace", index=False)
print("✅ DB 삽입 완료: recipes_dataset 테이블에 저장됨")

conn.close()
