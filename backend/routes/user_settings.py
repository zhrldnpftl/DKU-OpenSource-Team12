# user_settings.py: 사용자 정보 조회, 수정 등
# 🔧 Flask의 Blueprint(라우트 그룹), request(요청 데이터), jsonify(JSON 응답) 기능 불러오기
from flask import Blueprint, request, jsonify
# 🔐 비밀번호 해시 생성 및 검증을 위한 보안 유틸리티
from werkzeug.security import check_password_hash, generate_password_hash
# 🗄️ SQLite 데이터베이스 연동을 위한 모듈
import sqlite3

# 🔧 Blueprint 정의
user_settings_bp = Blueprint('user_settings', __name__)

# 📦 DB 연결 함수
def get_db_connection():
    conn = sqlite3.connect('db/fridge.db')
    conn.row_factory = sqlite3.Row
    return conn

# ✅ 닉네임 변경 API
@user_settings_bp.route('/update-username', methods=['POST'])
def update_username():
    data = request.get_json()                   # 📥 JSON 요청 데이터 받기
    user_id = data.get('user_id')               # 사용자 ID 추출
    new_name = data.get('username')             # 새 닉네임 추출

    if not user_id or not new_name:             # ❌ 필드 누락 시 에러 반환
        return jsonify({"error": "유저 ID와 새로운 이름이 필요합니다."}), 400

    # 📡 DB 연결
    conn = get_db_connection()
    cursor = conn.cursor()

    # 🔄 사용자 닉네임 변경 쿼리 실행
    cursor.execute(
        "UPDATE users SET username = ? WHERE user_id = ?",
        (new_name, user_id)
    )
    conn.commit()                               # ✅ 변경사항 저장
    conn.close()                                # 🔚 DB 연결 종료

    return jsonify({"message": "사용자 이름이 성공적으로 업데이트되었습니다."}), 200    # 🎉 성공 메시지 반환

# ✅ 현재 비밀번호 확인 API
@user_settings_bp.route('/verify-password', methods=['POST'])
def verify_password():
    data = request.get_json()                   # 📥 클라이언트에서 전달된 데이터 파싱
    user_id = data.get("user_id")               # 사용자 ID 추출
    password = data.get("password")             # 사용자가 입력한 현재 비밀번호 추출

    # ❌ 필수 정보 누락 시 에러
    if not user_id or not password:
        return jsonify({"error": "입력 정보 부족"}), 400

    # 📡 DB 연결
    conn = get_db_connection()
    cursor = conn.cursor()

    # 🔍 사용자 정보 조회
    cursor.execute("SELECT password FROM users WHERE user_id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()

    if not user:                                                # ❌ 사용자가 존재하지 않는 경우
        return jsonify({"error": "사용자 없음"}), 404

    if not check_password_hash(user["password"], password):     # ❌ 해시된 비밀번호와 비교
        return jsonify({"error": "비밀번호 불일치"}), 401

    return jsonify({"message": "비밀번호 확인 성공"}), 200       # ✅ 일치 시 성공 메시지

# ✅ 새 비밀번호 변경 API
@user_settings_bp.route('/update-password', methods=['POST'])
def update_password():
    data = request.get_json()                               # 📥 요청 본문 데이터 가져오기
    user_id = data.get("user_id")                           # 사용자 ID 추출
    new_password = data.get("new_password")                 # 새 비밀번호 추출

    if not user_id or not new_password:                     # ❌ 필수 필드 누락 시 에러 반환
        return jsonify({"error": "입력 정보 부족"}), 400

    # 🔐 새 비밀번호 해싱
    hashed_pw = generate_password_hash(new_password)

    # 📡 DB 연결
    conn = get_db_connection()
    cursor = conn.cursor()

    # 🔄 비밀번호 변경 쿼리 실행
    cursor.execute("UPDATE users SET password = ? WHERE user_id = ?", (hashed_pw, user_id))
    conn.commit()       # ✅ DB에 변경 내용 저장
    conn.close()        # 🔚 연결 종료

    return jsonify({"message": "비밀번호가 성공적으로 변경되었습니다."}), 200   # 🎉 성공 메시지 반환