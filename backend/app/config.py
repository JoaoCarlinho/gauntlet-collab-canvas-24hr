import os
import logging
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///site.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
    
    # Firebase Configuration
    FIREBASE_PROJECT_ID = os.environ.get('FIREBASE_PROJECT_ID')
    FIREBASE_PRIVATE_KEY_ID = os.environ.get('FIREBASE_PRIVATE_KEY_ID')
    FIREBASE_PRIVATE_KEY = os.environ.get('FIREBASE_PRIVATE_KEY')
    FIREBASE_CLIENT_EMAIL = os.environ.get('FIREBASE_CLIENT_EMAIL')
    FIREBASE_CLIENT_ID = os.environ.get('FIREBASE_CLIENT_ID')
    FIREBASE_AUTH_URI = os.environ.get('FIREBASE_AUTH_URI')
    FIREBASE_TOKEN_URI = os.environ.get('FIREBASE_TOKEN_URI')
    FIREBASE_AUTH_PROVIDER_X509_CERT_URL = os.environ.get('FIREBASE_AUTH_PROVIDER_X509_CERT_URL')
    FIREBASE_CLIENT_X509_CERT_URL = os.environ.get('FIREBASE_CLIENT_X509_CERT_URL')
    
    # CORS Configuration
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',')
    
    # Socket.IO Logging Configuration
    SOCKETIO_LOGGER = os.environ.get('SOCKETIO_LOGGER', 'false').lower() == 'true'
    SOCKETIO_ENGINEIO_LOGGER = os.environ.get('SOCKETIO_ENGINEIO_LOGGER', 'false').lower() == 'true'
    
    # Logging Levels
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    CURSOR_LOG_LEVEL = os.environ.get('CURSOR_LOG_LEVEL', 'WARNING')  # Reduce cursor spam

class DevelopmentConfig(Config):
    DEBUG = True
    FLASK_ENV = 'development'
    # Verbose logging for development
    SOCKETIO_LOGGER = True
    SOCKETIO_ENGINEIO_LOGGER = True
    LOG_LEVEL = 'DEBUG'
    CURSOR_LOG_LEVEL = 'INFO'

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SOCKETIO_MESSAGE_QUEUE = None
    FLASK_ENV = 'testing'
    # Minimal logging for testing
    SOCKETIO_LOGGER = False
    SOCKETIO_ENGINEIO_LOGGER = False
    LOG_LEVEL = 'WARNING'
    CURSOR_LOG_LEVEL = 'ERROR'

class ProductionConfig(Config):
    DEBUG = False
    FLASK_ENV = 'production'
    # Minimal logging for production
    SOCKETIO_LOGGER = False
    SOCKETIO_ENGINEIO_LOGGER = False
    LOG_LEVEL = 'WARNING'
    CURSOR_LOG_LEVEL = 'ERROR'  # Only log cursor errors in production
