from flask import Flask
from flask_cors import CORS
from routes.auth_routes import auth_bp  # 로그인 및 회원가입 관련 라우터터
from routes.fridge_routes import fridge_bp # 냉장고 관리 라우터
from routes.user_settings import user_settings_bp # 사용자 정보 변경

app = Flask(__name__)
CORS(app)

# 📌 
app.register_blueprint(auth_bp)
app.register_blueprint(fridge_bp)
app.register_blueprint(user_settings_bp)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
