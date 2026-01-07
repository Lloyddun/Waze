from flask import Flask, jsonify
from config import config
from dotenv import load_dotenv
import logging

load_dotenv()

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def create_app(config_name="default"):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    register_blueprints(app)
    register_error_handlers(app)

    logger.info(f"Application started in {config_name} mode")
    return app


def register_blueprints(app):
    from routes.auth import auth_bp
    from routes.main import main_bp
    from routes.api import api_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp, url_prefix="/api")
    logger.info("Blueprints registered")


def register_error_handlers(app):
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"status": "error", "message": "Not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}")
        return jsonify({"status": "error", "message": "Internal server error"}), 500

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"status": "error", "message": "Bad request"}), 400

    logger.info("Error handlers registered")


app = create_app()


if __name__ == "__main__":
    app.run(host=app.config["HOST"], port=app.config["PORT"], debug=app.config["DEBUG"])
