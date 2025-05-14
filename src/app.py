# src/app.py
import os
from flask import Flask, jsonify, send_from_directory
from flask_migrate import Migrate
from flask_swagger import swagger
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from api.utils import APIException, generate_sitemap
from api.models import db
from api.routes import api as api_bp
from api.admin import setup_admin
from api.commands import setup_commands


def create_app():
    app = Flask(__name__, static_folder=None)
    app.url_map.strict_slashes = False

    # Configuración DB
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace(
            "postgres://", "postgresql://")
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:////tmp/test.db"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # JWT
    app.config['JWT_SECRET_KEY'] = os.getenv(
        'JWT_SECRET_KEY', 'cambia-esta-secreta')
    JWTManager(app)

    # CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}},
         supports_credentials=True)

    # Inicializa DB + Migraciones
    db.init_app(app)
    Migrate(app, db, compare_type=True)

    # Admin y comandos custom
    setup_admin(app)
    setup_commands(app)

    # Blueprint API
    app.register_blueprint(api_bp, url_prefix='/api')

    # Error handler
    @app.errorhandler(APIException)
    def handle_invalid_usage(error):
        return jsonify(error.to_dict()), error.status_code

    # Sitemap o SPA
    ENV = "development" if os.getenv(
        "FLASK_ENV") == "development" else "production"
    static_dir = os.path.join(os.path.dirname(__file__), '../public/')

    @app.route('/')
    def sitemap():
        if ENV == "development":
            return generate_sitemap(app)
        return send_from_directory(static_dir, 'index.html')

    @app.route('/<path:path>')
    def serve_spa(path):
        full = os.path.join(static_dir, path)
        if not os.path.isfile(full):
            path = 'index.html'
        resp = send_from_directory(static_dir, path)
        resp.cache_control.max_age = 0
        return resp

    return app


app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3001))
    app.run(host='0.0.0.0', port=port, debug=(
        os.getenv("FLASK_ENV") == "development"))
