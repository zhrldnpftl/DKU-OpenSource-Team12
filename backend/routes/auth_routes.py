# 📤 SMTP 메일 전송을 위한 표준 파이썬 모듈
import smtplib
# 🔐 임시 비밀번호 생성 시 사용할 랜덤 문자 및 숫자 도구
import random
import string
# 📨 메일 본문 작성 및 포맷 설정을 위한 모듈 (plain text, subject 등 포함 가능)
from email.message import EmailMessage
# 🔧 Flask 기본 구성 요소: 라우팅 블루프린트, 요청 처리, JSON 응답 등
from flask import Blueprint, request, jsonify
# 🔐 비밀번호 해싱 및 검증을 위한 Werkzeug 유틸리티
from werkzeug.security import check_password_hash, generate_password_hash
# 📁 메일 발송을 위한 설정 값 (이메일 주소, 비밀번호, 서버, 포트) 가져오기
from config import EMAIL_ADDRESS, EMAIL_PASSWORD, SMTP_SERVER, SMTP_PORT
# 🗄️ SQLite 데이터베이스 연동을 위한 모듈
import sqlite3


# 🔧 Blueprint 정의
auth_bp = Blueprint('auth', __name__)

# 📦 DB 연결 함수
def get_db_connection():
    conn = sqlite3.connect('db/fridge.db')
    conn.row_factory = sqlite3.Row
    return conn

# ✅ 회원가입 API
@auth_bp.route('/signup', methods=['POST'])
def signup():
    # 📥 클라이언트로부터 JSON 데이터 수신
    data = request.get_json()

    # 📌 사용자 입력 필드 추출  
    user_id = data.get('user_id')       # 사용자 ID (로그인용)
    username = data.get('username')     # 닉네임 또는 사용자 이름
    email = data.get('email')           # 이메일
    password = data.get('password')     # 평문 비밀번호

    # ❌ 필수 입력값 누락 시 오류 반환
    if not user_id or not username or not email or not password:
        return jsonify({"error": "모든 필드를 입력해주세요."}), 400

    # 📡 DB 연결
    conn = get_db_connection()
    # 🧭 커서 객체 생성
    cursor = conn.cursor()

    # 🔁 아이디 중복 검사
    cursor.execute("SELECT 1 FROM users WHERE user_id = ?", (user_id,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "이미 사용 중인 아이디입니다."}), 409

    # 🔁 이메일 중복 검사
    cursor.execute("SELECT 1 FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "이미 가입된 이메일입니다."}), 409

    # 🔐 비밀번호 해시 처리 (보안 강화)
    hashed_pw = generate_password_hash(password)

    # 💾 회원정보 DB에 저장
    cursor.execute(
        "INSERT INTO users (user_id, username, email, password) VALUES (?, ?, ?, ?)",
        (user_id, username, email, hashed_pw)
    )
    conn.commit()   # ✅ 변경사항 커밋
    conn.close()    # 🔚 DB 연결 종료

    return jsonify({"message": "회원가입이 완료되었습니다."}), 201  # 🎉 가입 완료 응답

# ✅ 사용자 이름(username) 업데이트 API
@auth_bp.route('/update-username', methods=['POST'])
def update_username():
    data = request.get_json()               # 📥 JSON 데이터 파싱
    user_id = data.get('user_id')           # 🔑 사용자 ID 추출
    new_name = data.get('username')         # 🆕 새로운 닉네임 추출

    # ❌ 필드 누락 시 에러
    if not user_id or not new_name:
        return jsonify({"error": "유저 ID와 새로운 이름이 필요합니다."}), 400

    # 📡 DB 연결
    conn = get_db_connection()
    # 🧭 커서 객체 생성
    cursor = conn.cursor()

    # 🔄 사용자 이름 업데이트 쿼리
    cursor.execute(
        "UPDATE users SET username = ? WHERE user_id = ?",
        (new_name, user_id)
    )
    conn.commit()   # ✅ 변경사항 저장
    conn.close()    # 🔚 DB 연결 종료

    return jsonify({"message": "사용자 이름이 성공적으로 업데이트되었습니다."}), 200

# ✅ 아이디 중복 확인 API
@auth_bp.route('/check-id/<user_id>', methods=['GET'])
def check_id(user_id):
    # 📡 DB 연결
    conn = get_db_connection()
    # 🧭 커서 객체 생성
    cursor = conn.cursor()

    # DB에서 존재 여부 확인
    cursor.execute("SELECT 1 FROM users WHERE user_id = ?", (user_id,))
    # 📛 이미 존재하는 경우
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "이미 사용 중인 아이디입니다."}), 409
    conn.close()
    return jsonify({"message": "✅ 사용 가능한 아이디입니다."}), 200    # ✅ 사용 가능

# ✅ 이메일 중복 확인 API
@auth_bp.route('/check-email/<email>', methods=['GET'])
def check_email(email):
    # 📡 DB 연결
    conn = get_db_connection()
    # 🧭 커서 객체 생성
    cursor = conn.cursor()

    # DB에서 이메일 존재 여부 조회
    cursor.execute("SELECT 1 FROM users WHERE email = ?", (email,))

    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "이미 가입된 이메일입니다."}), 409     # 📛 중복
    conn.close()
    return jsonify({"message": "✅ 사용 가능한 이메일입니다."}), 200    # ✅ 사용 가능

# ✅ 로그인 API
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()           # JSON 데이터 파싱
    user_id = data.get('user_id')       # 입력받은 사용자 ID
    password = data.get('password')     # 입력받은 비밀번호

    # ❌ 필수 입력 누락 시 에러
    if not user_id or not password:
        return jsonify({"error": "아이디와 비밀번호를 입력해주세요."}), 400

    # 📡 DB 연결
    conn = get_db_connection()
    # 🧭 커서 객체 생성
    cursor = conn.cursor()

    # DB에서 사용자 정보 조회
    cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()

    # 📛 존재하지 않는 ID
    if not user:
        return jsonify({"error": "존재하지 않는 아이디입니다."}), 404
    # ❌ 비밀번호 불일치
    if not check_password_hash(user['password'], password):
        return jsonify({"error": "비밀번호가 일치하지 않습니다."}), 401

    # ✅ 로그인 성공 시 사용자 정보 반환
    return jsonify({
        "message": "로그인 성공",
        "user_id": user['user_id'],
        "email": user['email'],
        "username": user['username']
    }), 200

# ✅ 이메일로 아이디 찾기 API
@auth_bp.route('/find-id/<email>', methods=['GET'])
def find_id(email):
    # 📡 DB 연결
    conn = get_db_connection()
    # 🧭 커서 객체 생성
    cursor = conn.cursor()

    # DB에서 ID 검색
    cursor.execute("SELECT user_id FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()

    # ✅ ID 반환
    if row:
        return jsonify({"user_id": row["user_id"]}), 200
    # ❌ 미존재
    else:
        return jsonify({"error": "해당 이메일로 가입된 아이디가 없습니다."}), 404

# ✅ 비밀번호 재설정 API
@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()           # JSON 데이터 파싱
    email = data.get("email")           # 사용자 입력 이메일
    user_id = data.get("user_id")       # 사용자 입력 ID

    # ❌ 필수 필드 누락
    if not email or not user_id:
        return jsonify({"error": "이메일과 아이디를 모두 입력해주세요."}), 400

    # 📡 DB 연결
    conn = get_db_connection()
    # 🧭 커서 객체 생성
    cursor = conn.cursor()

    # 사용자 정보 조회
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()

    # ❌ 이메일 없음
    if not user:
        return jsonify({"error": "해당 이메일로 가입된 정보가 없습니다."}), 404
    # ❌ 이메일은 맞지만 ID 불일치
    if user["user_id"] != user_id:
        return jsonify({"error": "아이디가 일치하지 않습니다."}), 401

    # 🔐 임시 비밀번호 생성 (영문 + 숫자 8자리)
    temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
    hashed_pw = generate_password_hash(temp_password)

    # ✅ DB에 임시 비밀번호 저장
    cursor.execute("UPDATE users SET password = ? WHERE email = ?", (hashed_pw, email))
    conn.commit()
    conn.close()

    try:
        # 📧 이메일 전송 구성
        msg = EmailMessage()
        msg["Subject"] = "ByteBite 비밀번호 재설정 안내"
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = email
        msg.set_content(f"""
        안녕하세요, ByteBite 사용자님.

        요청하신 임시 비밀번호는 아래와 같습니다:

        임시 비밀번호: {temp_password}

        로그인 후 반드시 비밀번호를 변경해 주세요.
        """)

        # 📤 SMTP 서버를 통해 이메일 전송
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()

        return jsonify({"message": "비밀번호 재설정 이메일이 발송되었습니다."}), 200    # ✅ 전송 성공

    except Exception as e:
        return jsonify({"error": "메일 전송 실패", "details": str(e)}), 500            # ❌ 전송 실패