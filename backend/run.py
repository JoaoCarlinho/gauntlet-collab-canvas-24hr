import os
from app import create_app, socketio
from app.config import DevelopmentConfig, ProductionConfig, TestingConfig

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Determine configuration based on environment
env = os.environ.get('FLASK_ENV', 'development')
if env == 'production':
    config_class = ProductionConfig
elif env == 'testing':
    config_class = TestingConfig
else:
    config_class = DevelopmentConfig

app = create_app(config_class)

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)
