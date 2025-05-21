# user_settings.py: 사용자 정보 조회, 수정 등
from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
import sqlite3

# 🔧 Blueprint 정의
user_settings_bp = Blueprint('user_settings', __name__)

# 📦 DB 연결 함수
def get_db_connection():
    conn = sqlite3.connect('db/fridge.db')
    conn.row_factory = sqlite3.Row
    return conn

# ✅ 닉네임 변경경 API
@user_settings_bp.route('/update-username', methods=['POST'])
def update_username():
    data = request.get_json()
    user_id = data.get('user_id')
    new_name = data.get('username')

    if not user_id or not new_name:
        return jsonify({"error": "유저 ID와 새로운 이름이 필요합니다."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET username = ? WHERE user_id = ?",
        (new_name, user_id)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "사용자 이름이 성공적으로 업데이트되었습니다."}), 200

# ✅ 현재 비밀번호 확인 API
@user_settings_bp.route('/verify-password', methods=['POST'])
def verify_password():
    data = request.get_json()
    user_id = data.get("user_id")
    password = data.get("password")

    if not user_id or not password:
        return jsonify({"error": "입력 정보 부족"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT password FROM users WHERE user_id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "사용자 없음"}), 404

    if not check_password_hash(user["password"], password):
        return jsonify({"error": "비밀번호 불일치"}), 401

    return jsonify({"message": "비밀번호 확인 성공"}), 200

# ✅ 새 비밀번호 변경 API
@user_settings_bp.route('/update-password', methods=['POST'])
def update_password():
    data = request.get_json()
    user_id = data.get("user_id")
    new_password = data.get("new_password")

    if not user_id or not new_password:
        return jsonify({"error": "입력 정보 부족"}), 400

    hashed_pw = generate_password_hash(new_password)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET password = ? WHERE user_id = ?", (hashed_pw, user_id))
    conn.commit()
    conn.close()

    return jsonify({"message": "비밀번호가 성공적으로 변경되었습니다."}), 200