import os
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

class DevelopmentConfig(Config):
    DEBUG = True
    FLASK_ENV = 'development'

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SOCKETIO_MESSAGE_QUEUE = None
    FLASK_ENV = 'testing'

class ProductionConfig(Config):
    DEBUG = False
    FLASK_ENV = 'production'
