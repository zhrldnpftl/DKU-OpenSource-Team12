# backend/routes/recipe_routes.py

from flask import Blueprint, request, jsonify
import sqlite3
import os
from datetime import datetime


recipe_bp = Blueprint('recipe', __name__)

# ✅ DB 연결 함수 정의
def get_db_connection():
    # 현재 파일 기준 상위 폴더(backend) 하위에 있는 db/fridge.db 경로 설정
    db_path = os.path.join(os.path.dirname(__file__), '..', 'db', 'fridge.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # 결과를 딕셔너리처럼 반환
    return conn

# 🔧 외부 user_id (문자열 ID) → 내부 users.id (정수형 PK)로 변환
def get_user_numeric_id(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # users 테이블에서 user_id에 해당하는 고유 id 조회
    cursor.execute("SELECT id FROM users WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()

    return row["id"] if row else None  # 조회 성공 시 id 반환, 실패 시 None


# ✅ [1] 재료 기반 레시피 검색
@recipe_bp.route('/recipes/search', methods=['GET'])
def search_recipes():
    """
    GET /recipes/search?ingredients=감자&ingredients=양파&…
    1) request.args.getlist('ingredients') 로 재료 목록(리스트) 얻기
    2) SQL: WHERE CKG_MTRL_CN LIKE '%재료1%' AND LIKE '%재료2%' … 형태로 조회
    3) 매칭된 레시피 없으면 404 + { "error": … }, 있으면 JSON 배열 리턴
    """
    ingredients = request.args.getlist('ingredients')
    if not ingredients:
        # ❌ 재료가 1개도 없을 경우 오류 반환
        return jsonify({"error": "검색할 재료를 최소 1개 이상 지정해주세요."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # ✅ SQL 기본 조건 (WHERE 1=1은 뒤에 조건을 추가하기 쉽게 함)
    sql = "SELECT RCP_SNO, RCP_TTL, CKG_MTRL_CN, CKG_STA_ACTO_NM FROM recipes_dataset WHERE 1=1"
    params = []

    # ✅ 각각의 재료에 대해 LIKE 조건 추가
    for ing in ingredients:
        sql += " AND CKG_MTRL_CN LIKE ?"
        params.append(f"%{ing}%")

    cursor.execute(sql, params)         # ✅ SQL 실행
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        # ❌ 조건에 맞는 레시피 없음
        return jsonify({"error": "조건에 맞는 레시피가 없습니다."}), 404

    # ✅ 결과 리스트로 가공
    result = []
    for row in rows:
        result.append({
            "RCP_SNO":         row["RCP_SNO"],
            "RCP_TTL":         row["RCP_TTL"],
            "CKG_MTRL_CN":     row["CKG_MTRL_CN"] or "",
            "CKG_STA_ACTO_NM": row["CKG_STA_ACTO_NM"] or ""
        })

    return jsonify(result), 200         # ✅ 결과 반환

# ✅ [2] 카테고리 기반 레시피 검색
@recipe_bp.route('/recipes/category', methods=['GET'])
def get_recipes_by_category():
    """
    GET /recipes/category?category=아침식사
    1) request.args.get('category') 로 카테고리 문자열 얻기
    2) SQL: WHERE CKG_STA_ACTO_NM = ?
    3) 매칭된 레시피 없으면 404 + { "error": … }, 있으면 JSON 배열 리턴
    """
    category = request.args.get('category')     # ✅ 카테고리 값 받기
    if not category:
        # ❌ 파라미터 없음
        return jsonify({"error": "카테고리 이름을 지정해주세요."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # ✅ 해당 카테고리의 레시피만 선택
    sql = """
      SELECT RCP_SNO, RCP_TTL, CKG_MTRL_CN, CKG_STA_ACTO_NM
      FROM recipes_dataset
      WHERE CKG_STA_ACTO_NM = ?
    """
    cursor.execute(sql, (category,))
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        # ❌ 해당 카테고리에 레시피 없음
        return jsonify({"error": f"'{category}' 카테고리의 레시피가 없습니다."}), 404

    result = []
    for row in rows:
        result.append({
            "RCP_SNO":         row["RCP_SNO"],
            "RCP_TTL":         row["RCP_TTL"],
            "CKG_MTRL_CN":     row["CKG_MTRL_CN"] or "",
            "CKG_STA_ACTO_NM": row["CKG_STA_ACTO_NM"] or ""
        })

    return jsonify(result), 200

# ✅ [3] 저장된 레시피 목록 조회
@recipe_bp.route('/recipes/saved', methods=['POST', 'OPTIONS'])
def get_saved_recipes():
    if request.method == 'OPTIONS':
        return '', 200

    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id가 전달되지 않았습니다.'}), 400

    user_numeric_id = get_user_numeric_id(user_id)
    if not user_numeric_id:
        return jsonify({'error': '사용자를 찾을 수 없습니다.'}), 404

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT 
            sr.recipe_id,
            sr.recipe_url,
            r.CKG_NM AS recipe_name,
            r.CKG_MTRL_CN,
            r.CKG_KND_ACTO_NM,
            r.CKG_TIME_NM,
            r.CKG_DODF_NM
        FROM saved_recipes sr
        JOIN recipes_dataset r ON sr.RCP_SNO = r.RCP_SNO
        WHERE sr.user_id = ?
        ORDER BY sr.saved_at DESC
    ''', (user_numeric_id,))

    recipes = [{
        'recipe_id': row['recipe_id'],
        'title': row['recipe_name'],
        'url': row['recipe_url'],
        'ingredients': row['CKG_MTRL_CN'],
        'category': row['CKG_KND_ACTO_NM'],
        'time': row['CKG_TIME_NM'],
        'level': row['CKG_DODF_NM']
    } for row in cursor.fetchall()]

    conn.close()
    return jsonify({'recipes': recipes}), 200

# ✅ [4] 레시피 저장
@recipe_bp.route('/recipes/save', methods=['POST', 'OPTIONS'])
def save_recipe():
    if request.method == 'OPTIONS':
        return '', 200

    data = request.get_json()
    user_id = data.get('userId')  # ✅ JS의 키 이름과 일치하게 변경
    recipe_title = data.get('recipe_title')
    recipe_url = data.get('recipe_url')
    rcp_sno = data.get('rcp_sno')

    if not all([user_id, recipe_title, recipe_url]):
        return jsonify({'error': '필수 정보가 누락되었습니다.'}), 400

    user_numeric_id = get_user_numeric_id(user_id)
    if not user_numeric_id:
        return jsonify({'error': '사용자를 찾을 수 없습니다.'}), 404

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT 1 FROM saved_recipes WHERE user_id = ? AND RCP_SNO = ?",
        (user_numeric_id, rcp_sno)
    )
    if cursor.fetchone():
        conn.close()
        return jsonify({'error': '이미 저장된 레시피입니다.'}), 409

    saved_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")  # ✅ 현재 시간 저장

    cursor.execute(
        "INSERT INTO saved_recipes (user_id, RCP_SNO, recipe_url, saved_at) VALUES (?, ?, ?, ?)",
        (user_numeric_id, rcp_sno, recipe_url, saved_at)
    )
    conn.commit()
    conn.close()

    return jsonify({'message': '레시피가 저장되었습니다.'}), 201


# ✅ [5] 저장된 레시피 삭제
@recipe_bp.route('/recipes/delete', methods=['POST', 'OPTIONS'])
def delete_recipe():
    if request.method == 'OPTIONS':
        return '', 200

    data = request.get_json()
    user_id = data.get('user_id')
    recipe_id = data.get('recipe_id')

    if not all([user_id, recipe_id]):
        return jsonify({'error': '필수 정보가 누락되었습니다.'}), 400

    user_numeric_id = get_user_numeric_id(user_id)
    if not user_numeric_id:
        return jsonify({'error': '사용자를 찾을 수 없습니다.'}), 404

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM saved_recipes WHERE user_id = ? AND recipe_id = ?",
        (user_numeric_id, recipe_id)
    )
    conn.commit()
    conn.close()

    return jsonify({'message': '레시피가 삭제되었습니다.'}), 200