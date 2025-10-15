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
                
                # Debug: Check Firebase environment variables
                print("=== Firebase Initialization Debug ===")
                print(f"FIREBASE_PROJECT_ID: {'SET' if os.environ.get('FIREBASE_PROJECT_ID') else 'NOT SET'}")
                print(f"FIREBASE_CLIENT_EMAIL: {'SET' if os.environ.get('FIREBASE_CLIENT_EMAIL') else 'NOT SET'}")
                private_key_raw = os.environ.get('FIREBASE_PRIVATE_KEY', '')
                print(f"FIREBASE_PRIVATE_KEY: {'SET' if private_key_raw else 'NOT SET'}")
                if private_key_raw:
                    print(f"Private key length: {len(private_key_raw)}")
                    print(f"Private key starts with: {private_key_raw[:50]}...")
                    print(f"Private key contains \\n: {'\\n' in private_key_raw}")
                    print(f"Private key contains actual newlines: {'\n' in private_key_raw}")
                
                # Fix private key formatting - replace escaped newlines with actual newlines
                private_key = os.environ.get('FIREBASE_PRIVATE_KEY', '')
                if private_key:
                    print(f"Original private key length: {len(private_key)}")
                    print(f"Original private key contains \\n: {'\\n' in private_key}")
                    print(f"Original private key contains actual newlines: {'\n' in private_key}")
                    
                    # Replace escaped newlines with actual newlines
                    private_key = private_key.replace('\\n', '\n')
                    
                    # Ensure proper PEM format
                    if not private_key.startswith('-----BEGIN PRIVATE KEY-----'):
                        private_key = '-----BEGIN PRIVATE KEY-----\n' + private_key
                    if not private_key.endswith('-----END PRIVATE KEY-----\n'):
                        if private_key.endswith('-----END PRIVATE KEY-----'):
                            private_key += '\n'
                        else:
                            private_key += '\n-----END PRIVATE KEY-----\n'
                    
                    print(f"Formatted private key length: {len(private_key)}")
                    print(f"Formatted private key contains actual newlines: {'\n' in private_key}")
                    print(f"Formatted private key starts with: {private_key[:50]}...")
                    print(f"Formatted private key ends with: ...{private_key[-50:]}")
                
                # Force reinitialize Firebase with properly formatted private key
                try:
                    # Delete existing app if it exists
                    existing_app = firebase_admin.get_app()
                    firebase_admin.delete_app(existing_app)
                    print("Deleted existing Firebase app to reinitialize")
                except ValueError:
                    print("No existing Firebase app found")
                
                # Initialize Firebase with service account
                firebase_config = {
                    "type": "service_account",
                    "project_id": os.environ.get('FIREBASE_PROJECT_ID'),
                    "private_key_id": os.environ.get('FIREBASE_PRIVATE_KEY_ID'),
                    "private_key": private_key,
                    "client_email": os.environ.get('FIREBASE_CLIENT_EMAIL'),
                    "client_id": os.environ.get('FIREBASE_CLIENT_ID'),
                    "auth_uri": os.environ.get('FIREBASE_AUTH_URI'),
                    "token_uri": os.environ.get('FIREBASE_TOKEN_URI'),
                    "auth_provider_x509_cert_url": os.environ.get('FIREBASE_AUTH_PROVIDER_X509_CERT_URL'),
                    "client_x509_cert_url": os.environ.get('FIREBASE_CLIENT_X509_CERT_URL'),
                }
                
                # Check if all required fields are present
                required_fields = ['project_id', 'private_key', 'client_email']
                missing_fields = [field for field in required_fields if not firebase_config.get(field)]
                
                if missing_fields:
                    print(f"Missing Firebase environment variables: {missing_fields}")
                    raise Exception(f"Missing Firebase environment variables: {missing_fields}")
                
                cred = credentials.Certificate(firebase_config)
                firebase_admin.initialize_app(cred)
                print("Firebase initialized successfully with formatted private key")
                print("=== Firebase Initialization Complete ===")
            else:
                # Mock Firebase for testing
                self._mock_firebase = True
                print("Using mock Firebase for testing")
        except ImportError:
            # Firebase not available, use mock
            self._mock_firebase = True
            print("Firebase not available, using mock")
        except Exception as e:
            print(f"Firebase initialization failed: {e}")
            self._mock_firebase = True
    
    def verify_token(self, id_token):
        """Verify Firebase ID token."""
        try:
            if hasattr(self, '_mock_firebase') and self._mock_firebase:
                # Mock token verification for testing
                if id_token == 'valid-token':
                    return {
                        'uid': 'test-user-id',
                        'email': 'test@example.com',
                        'name': 'Test User'
                    }
                else:
                    raise Exception('Invalid token')
            else:
                from firebase_admin import auth
                print(f"Verifying token, length: {len(id_token)}")
                print(f"Token starts with: {id_token[:50]}...")
                decoded_token = auth.verify_id_token(id_token)
                print(f"Token verified successfully for user: {decoded_token.get('uid', 'unknown')}")
                return decoded_token
        except Exception as e:
            print(f"Token verification failed: {str(e)}")
            raise Exception(f"Invalid token: {str(e)}")
    
    def register_user(self, id_token):
        """Register a new user."""
        decoded_token = self.verify_token(id_token)
        
        # Check if user already exists
        existing_user = User.query.filter_by(id=decoded_token['uid']).first()
        if existing_user:
            return existing_user
        
        # Create new user
        user = User(
            id=decoded_token['uid'],
            email=decoded_token.get('email', ''),
            name=decoded_token.get('name', ''),
            avatar_url=decoded_token.get('picture', '')
        )
        
        db.session.add(user)
        db.session.commit()
        
        return user
    
    def get_user_by_id(self, user_id):
        """Get user by ID."""
        return User.query.filter_by(id=user_id).first()
    
    def get_user_by_email(self, email):
        """Get user by email."""
        return User.query.filter_by(email=email).first()

def require_auth(f):
    """Decorator to require authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from flask import request, jsonify
        
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        id_token = auth_header.split(' ')[1]
        auth_service = AuthService()
        
        try:
            decoded_token = auth_service.verify_token(id_token)
            user = auth_service.get_user_by_id(decoded_token['uid'])
            if not user:
                user = auth_service.register_user(id_token)
            
            # Add user to kwargs
            kwargs['current_user'] = user
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': str(e)}), 401
    
    return decorated_function
