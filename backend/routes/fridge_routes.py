# fridge_routes.py : 냉장고 재료 추가/조회/삭제
from flask import Blueprint, request, jsonify
import sqlite3

fridge_bp = Blueprint('fridge', __name__)

def get_db_connection():
    conn = sqlite3.connect('db/fridge.db')
    conn.row_factory = sqlite3.Row
    return conn

# 🔧 내부 user_id → users.id 변환
def get_user_numeric_id(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return row["id"] if row else None

# ✅ 재료 추가 API
@fridge_bp.route('/fridge/add', methods=['POST'])
def add_ingredient():
    data = request.get_json()
    user_id = data.get('user_id')
    item_name = data.get('item_name')
    is_seasoning = int(data.get('is_seasoning', 0))

    if not user_id or not item_name:
        return jsonify({"error": "필수 정보가 누락되었습니다."}), 400

    user_numeric_id = get_user_numeric_id(user_id)
    if not user_numeric_id:
        return jsonify({"error": "사용자 정보를 찾을 수 없습니다."}), 404

    conn = get_db_connection()
    cursor = conn.cursor()

    # 🔍 중복 체크
    cursor.execute(
        "SELECT 1 FROM fridge_items WHERE user_id = ? AND item_name = ? AND is_seasoning = ?",
        (user_numeric_id, item_name, is_seasoning)
    )
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "이미 등록된 재료입니다."}), 409

    cursor.execute(
        "INSERT INTO fridge_items (user_id, item_name, is_seasoning) VALUES (?, ?, ?)",
        (user_numeric_id, item_name, is_seasoning)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "재료가 추가되었습니다."}), 201

# ✅ 재료 삭제 API
@fridge_bp.route('/fridge/delete', methods=['POST'])
def delete_fridge_item():
    data = request.get_json()
    user_id = data.get('user_id')
    item_name = data.get('item_name')
    is_seasoning = int(data.get('is_seasoning', 0))

    if not user_id or not item_name:
        return jsonify({"error": "필수 정보가 누락되었습니다."}), 400

    user_numeric_id = get_user_numeric_id(user_id)
    if not user_numeric_id:
        return jsonify({"error": "사용자 정보를 찾을 수 없습니다."}), 404

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM fridge_items WHERE user_id = ? AND item_name = ? AND is_seasoning = ?",
        (user_numeric_id, item_name, is_seasoning)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "재료가 삭제되었습니다."}), 200


# ✅ 사용자의 모든 재료 조회 API
@fridge_bp.route('/fridge/list/<user_id>', methods=['GET'])
def get_fridge_items(user_id):
    user_numeric_id = get_user_numeric_id(user_id)
    if not user_numeric_id:
        return jsonify({"error": "사용자를 찾을 수 없습니다."}), 404

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT item_name, is_seasoning FROM fridge_items WHERE user_id = ?", (user_numeric_id,))
    items = cursor.fetchall()
    conn.close()

    result = [{"item_name": row["item_name"], "is_seasoning": row["is_seasoning"]} for row in items]
    return jsonify({"items": result}), 200
