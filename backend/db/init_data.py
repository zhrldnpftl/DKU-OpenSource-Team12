import sqlite3
import os

# 현재 디렉토리 기준 경로
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "fridge.db")

# 실행할 SQL 파일들 (순서 중요!)
sql_files = [
    "user_insert.sql",
    "fridge_item_insert.sql",
    "saved_recipes_insert.sql"
]

# DB 연결
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

for sql_file in sql_files:
    file_path = os.path.join(BASE_DIR, sql_file)
    print(f"📥 실행 중: {sql_file}")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            sql = f.read()
            cursor.executescript(sql)
            print(f"✅ {sql_file} 실행 완료")
    except FileNotFoundError:
        print(f"❌ 파일 없음: {sql_file}")
    except Exception as e:
        print(f"❗ 오류 발생 ({sql_file}): {e}")

conn.commit()
conn.close()
print("🎉 모든 insert SQL 실행 완료!")
