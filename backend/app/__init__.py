from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_migrate import Migrate
from flasgger import Swagger
from .config import Config
from .extensions import db, socketio, cors, migrate

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    
    # Configure CORS for production
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173", 
        "https://gauntlet-collab-canvas-24hr.vercel.app",
        "https://gauntlet-collab-canvas-24hr-h7jvqmw9s-j-skeetes-projects.vercel.app",
        "https://gauntlet-collab-canvas-24hr-6l0tp5fsf-j-skeetes-projects.vercel.app",
        "https://gauntlet-collab-canvas-24hr-72qpaeq3m-j-skeetes-projects.vercel.app",
        "https://*.vercel.app"
    ]
    
    socketio.init_app(app, cors_allowed_origins=allowed_origins, manage_session=False)
    cors.init_app(app, origins=allowed_origins, supports_credentials=True)
    migrate.init_app(app, db)
    
    # Initialize Swagger
    swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": 'apispec_1',
                "route": '/apispec_1.json',
                "rule_filter": lambda rule: True,
                "model_filter": lambda tag: True,
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/docs"
    }
    
    swagger_template = {
        "swagger": "2.0",
        "info": {
            "title": "CollabCanvas API",
            "description": "Real-time collaborative canvas API",
            "version": "1.0.0",
            "contact": {
                "name": "CollabCanvas Team",
                "email": "support@collabcanvas.com"
            }
        },
        "host": "localhost:5000",
        "basePath": "/api",
        "schemes": ["http", "https"],
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "Firebase ID token in format: Bearer <token>"
            }
        },
        "security": [
            {
                "Bearer": []
            }
        ]
    }
    
    swagger = Swagger(app, config=swagger_config, template=swagger_template)
    
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
    
    # Add health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'message': 'CollabCanvas API is running'}, 200
    
    @app.route('/')
    def root():
        return {'message': 'CollabCanvas API', 'version': '1.0.0'}, 200
    
    return app
