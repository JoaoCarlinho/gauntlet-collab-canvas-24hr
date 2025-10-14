import os
import uuid
from app.models import User
from app.extensions import db
from functools import wraps

class AuthService:
    """Authentication service for Firebase integration."""
    
    def __init__(self):
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK."""
        try:
            # Only initialize Firebase if not in testing mode
            if os.environ.get('FLASK_ENV') != 'testing':
                import firebase_admin
                from firebase_admin import auth, credentials
                
                # Check if Firebase is already initialized
                if not firebase_admin._apps:
                    # Initialize Firebase Admin SDK
                    if os.environ.get('FUNCTIONS_EMULATOR'):
                        # Running in Firebase Functions emulator
                        cred = credentials.ApplicationDefault()
                        initialize_app(cred)
                    else:
                        # Running in production
                        initialize_app()
                        
        except Exception as e:
            print(f"Firebase initialization error: {e}")
            # In testing mode, we'll mock the Firebase functionality
    
    def verify_token(self, id_token: str) -> dict:
        """Verify Firebase ID token and return decoded token."""
        try:
            if os.environ.get('FLASK_ENV') == 'testing':
                # Mock token verification for testing
                return {
                    'uid': 'test-user-id',
                    'email': 'test@example.com',
                    'name': 'Test User'
                }
            
            # Verify the ID token
            import firebase_admin
            from firebase_admin import auth
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        except Exception as e:
            raise Exception(f"Invalid token: {str(e)}")
    
    def register_user(self, id_token: str) -> User:
        """Register a new user or return existing user."""
        try:
            # Verify the token
            decoded_token = self.verify_token(id_token)
            
            # Check if user already exists
            existing_user = User.query.filter_by(firebase_uid=decoded_token['uid']).first()
            if existing_user:
                return existing_user
            
            # Create new user
            user = User(
                id=str(uuid.uuid4()),
                firebase_uid=decoded_token['uid'],
                email=decoded_token.get('email', ''),
                name=decoded_token.get('name', ''),
                avatar_url=decoded_token.get('picture', '')
            )
            
            db.session.add(user)
            db.session.commit()
            return user
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Registration failed: {str(e)}")
    
    def get_user_by_id(self, user_id: str) -> User:
        """Get user by ID."""
        user = User.query.filter_by(id=user_id).first()
        if not user:
            raise Exception("User not found")
        return user
    
    def get_user_by_firebase_uid(self, firebase_uid: str) -> User:
        """Get user by Firebase UID."""
        user = User.query.filter_by(firebase_uid=firebase_uid).first()
        if not user:
            raise Exception("User not found")
        return user

def require_auth(f):
    """Decorator to require authentication for routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            from flask import request, jsonify
            
            # Get the Authorization header
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Missing or invalid authorization header'}), 401
            
            # Extract the token
            id_token = auth_header.split('Bearer ')[1]
            
            # Verify the token
            auth_service = AuthService()
            decoded_token = auth_service.verify_token(id_token)
            
            # Get user data
            user = auth_service.get_user_by_firebase_uid(decoded_token['uid'])
            
            # Add user to kwargs
            kwargs['current_user'] = user
            
            return f(*args, **kwargs)
            
        except Exception as e:
            from flask import jsonify
            return jsonify({'error': str(e)}), 401
    
    return decorated_function