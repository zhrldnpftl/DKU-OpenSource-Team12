# backend/app.py

from flask import Flask
from flask_cors import CORS

from routes.auth_routes import auth_bp
from routes.fridge_routes import fridge_bp
from routes.user_settings import user_settings_bp
from routes.recipe_routes import recipe_bp  

app = Flask(__name__)
CORS(app)

app.register_blueprint(auth_bp)
app.register_blueprint(fridge_bp)
app.register_blueprint(user_settings_bp)
app.register_blueprint(recipe_bp)          

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
 