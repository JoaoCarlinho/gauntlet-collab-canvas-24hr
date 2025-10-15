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
# This will be mocked in testing environment or if Redis is not available
redis_client = None
if os.environ.get('FLASK_ENV') != 'testing':
    try:
        redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
        redis_client = redis.from_url(redis_url, socket_connect_timeout=5, socket_timeout=5)
        # Test the connection
        redis_client.ping()
        print("Redis connection established successfully")
    except Exception as e:
        print(f"Redis connection failed: {e}")
        print("Continuing without Redis - some features may be limited")
        redis_client = None
else:
    redis_client = None  # Will be mocked in tests
