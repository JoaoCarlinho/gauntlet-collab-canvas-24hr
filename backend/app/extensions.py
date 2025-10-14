from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_migrate import Migrate
import redis
import os

db = SQLAlchemy()
socketio = SocketIO()
cors = CORS()
migrate = Migrate()

# Initialize Redis outside of the app factory for global access
# This will be mocked in testing environment
if os.environ.get('FLASK_ENV') != 'testing':
    try:
        redis_client = redis.from_url(os.environ.get('REDIS_URL', 'redis://localhost:6379/0'))
    except:
        redis_client = None
else:
    redis_client = None  # Will be mocked in tests
