# fridge_routes.py : 냉장고 재료 추가/조회/삭제

# ✅ Flask 기본 기능 import: 라우팅, 요청 처리, 응답 생성
from flask import Blueprint, request, jsonify
# ✅ SQLite DB 연동
import sqlite3

# ✅ 냉장고 관련 API들을 모은 Blueprint 생성
fridge_bp = Blueprint('fridge', __name__)

# ✅ DB 연결 함수 정의
def get_db_connection():
    conn = sqlite3.connect('db/fridge.db')
    conn.row_factory = sqlite3.Row
    return conn

# 🔧 외부 user_id (문자열 ID) → 내부 users.id (정수형 PK)로 변환
def get_user_numeric_id(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # users 테이블에서 user_id에 해당하는 고유 id 조회
    cursor.execute("SELECT id FROM users WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()

    return row["id"] if row else None                   # 조회 성공 시 id 반환, 실패 시 None

# ✅ 재료 추가 API
@fridge_bp.route('/fridge/add', methods=['POST'])
def add_ingredient():
    data = request.get_json()                           # 클라이언트에서 보낸 JSON 데이터 파싱
    user_id = data.get('user_id')                       # 사용자 ID
    item_name = data.get('item_name')                   # 재료명
    is_seasoning = int(data.get('is_seasoning', 0))     # 조미료 여부 (0 또는 1)

    # ❌ 필수 항목 누락 시 에러 반환
    if not user_id or not item_name:
        return jsonify({"error": "필수 정보가 누락되었습니다."}), 400

    # 🔄 문자열 user_id → 내부 DB의 numeric id
    user_numeric_id = get_user_numeric_id(user_id)
    if not user_numeric_id:
        return jsonify({"error": "사용자 정보를 찾을 수 없습니다."}), 404

    conn = get_db_connection()
    cursor = conn.cursor()

    # 🔍 이미 같은 이름/종류의 재료가 존재하는지 확인
    cursor.execute(
        "SELECT 1 FROM fridge_items WHERE user_id = ? AND item_name = ? AND is_seasoning = ?",
        (user_numeric_id, item_name, is_seasoning)
    )
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "이미 등록된 재료입니다."}), 409       # 중복 에러 반환

    # ✅ 중복이 아니면 재료 추가
    cursor.execute(
        "INSERT INTO fridge_items (user_id, item_name, is_seasoning) VALUES (?, ?, ?)",
        (user_numeric_id, item_name, is_seasoning)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "재료가 추가되었습니다."}), 201          # 🎉 추가 성공 응답

# ✅ 재료 삭제 API
@fridge_bp.route('/fridge/delete', methods=['POST'])
def delete_fridge_item():
    data = request.get_json()
    user_id = data.get('user_id')                                       # 사용자 ID
    item_name = data.get('item_name')                                   # 삭제할 재료명
    is_seasoning = int(data.get('is_seasoning', 0))                     # 조미료 여부

    # ❌ 필수 정보 누락 시 에러
    if not user_id or not item_name:
        return jsonify({"error": "필수 정보가 누락되었습니다."}), 400

    # 내부 ID로 변환
    user_numeric_id = get_user_numeric_id(user_id)
    if not user_numeric_id:
        return jsonify({"error": "사용자 정보를 찾을 수 없습니다."}), 404

    conn = get_db_connection()
    cursor = conn.cursor()

    # 🔄 해당 조건에 맞는 재료 삭제
    cursor.execute(
        "DELETE FROM fridge_items WHERE user_id = ? AND item_name = ? AND is_seasoning = ?",
        (user_numeric_id, item_name, is_seasoning)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "재료가 삭제되었습니다."}), 200           # ✅ 삭제 완료 응답


# ✅ 사용자의 모든 재료 조회 API
@fridge_bp.route('/fridge/list/<user_id>', methods=['GET'])
def get_fridge_items(user_id):
    user_numeric_id = get_user_numeric_id(user_id)                      # 문자열 ID → 내부 정수 ID 변환
    if not user_numeric_id:
        return jsonify({"error": "사용자를 찾을 수 없습니다."}), 404

    conn = get_db_connection()
    cursor = conn.cursor()

    # 해당 사용자에 등록된 재료 전체 조회
    cursor.execute("SELECT item_name, is_seasoning FROM fridge_items WHERE user_id = ?", (user_numeric_id,))
    items = cursor.fetchall()
    conn.close()

    # JSON 형식으로 응답 구성
    result = [{"item_name": row["item_name"], "is_seasoning": row["is_seasoning"]} for row in items]
    return jsonify({"items": result}), 200                                # ✅ 전체 목록 반환
