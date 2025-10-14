from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_migrate import Migrate
from .config import Config
from .extensions import db, socketio, cors, migrate

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*", manage_session=False)
    cors.init_app(app)
    migrate.init_app(app, db)
    
    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.canvas import canvas_bp
    from .routes.objects import objects_bp
    from .routes.collaboration import collaboration_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(canvas_bp, url_prefix='/api/canvas')
    app.register_blueprint(objects_bp, url_prefix='/api/objects')
    app.register_blueprint(collaboration_bp, url_prefix='/api/collaboration')
    
    # Register socket handlers
    from .socket_handlers import register_socket_handlers
    register_socket_handlers(socketio)
    
    return app
