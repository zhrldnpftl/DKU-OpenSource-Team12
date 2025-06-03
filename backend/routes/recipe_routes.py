# backend/routes/recipe_routes.py

from flask import Blueprint, request, jsonify
import sqlite3
import os

recipe_bp = Blueprint('recipe', __name__)

def get_db_connection():
    # recipe_routes.py 파일 기준으로 상위 폴더(backend/) 아래 db/fridge.db 경로를 지정
    db_path = os.path.join(os.path.dirname(__file__), '..', 'db', 'fridge.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

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
        return jsonify({"error": "검색할 재료를 최소 1개 이상 지정해주세요."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    sql = "SELECT RCP_SNO, RCP_TTL, CKG_MTRL_CN, CKG_STA_ACTO_NM FROM recipes_dataset WHERE 1=1"
    params = []
    for ing in ingredients:
        sql += " AND CKG_MTRL_CN LIKE ?"
        params.append(f"%{ing}%")

    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return jsonify({"error": "조건에 맞는 레시피가 없습니다."}), 404

    result = []
    for row in rows:
        result.append({
            "RCP_SNO":         row["RCP_SNO"],
            "RCP_TTL":         row["RCP_TTL"],
            "CKG_MTRL_CN":     row["CKG_MTRL_CN"] or "",
            "CKG_STA_ACTO_NM": row["CKG_STA_ACTO_NM"] or ""
        })

    return jsonify(result), 200

@recipe_bp.route('/recipes/category', methods=['GET'])
def get_recipes_by_category():
    """
    GET /recipes/category?category=아침식사
    1) request.args.get('category') 로 카테고리 문자열 얻기
    2) SQL: WHERE CKG_STA_ACTO_NM = ?
    3) 매칭된 레시피 없으면 404 + { "error": … }, 있으면 JSON 배열 리턴
    """
    category = request.args.get('category')
    if not category:
        return jsonify({"error": "카테고리 이름을 지정해주세요."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    sql = """
      SELECT RCP_SNO, RCP_TTL, CKG_MTRL_CN, CKG_STA_ACTO_NM
      FROM recipes_dataset
      WHERE CKG_STA_ACTO_NM = ?
    """
    cursor.execute(sql, (category,))
    rows = cursor.fetchall()
    conn.close()

    if not rows:
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
