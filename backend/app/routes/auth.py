from flask import Blueprint, request, jsonify
from flasgger import swag_from
from app.services.auth_service import AuthService, require_auth

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
@swag_from({
    'tags': ['Authentication'],
    'summary': 'Register a new user',
    'description': 'Register a new user with Firebase ID token',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'idToken': {
                        'type': 'string',
                        'description': 'Firebase ID token'
                    }
                },
                'required': ['idToken']
            }
        }
    ],
    'responses': {
        201: {
            'description': 'User registered successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'},
                    'user': {
                        'type': 'object',
                        'properties': {
                            'id': {'type': 'string'},
                            'email': {'type': 'string'},
                            'name': {'type': 'string'},
                            'avatar_url': {'type': 'string'},
                            'created_at': {'type': 'string'},
                            'updated_at': {'type': 'string'}
                        }
                    }
                }
            }
        },
        400: {
            'description': 'Bad request - missing or invalid ID token',
            'schema': {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string'}
                }
            }
        }
    }
})
def register():
    """Register a new user."""
    try:
        data = request.get_json()
        id_token = data.get('idToken')
        
        if not id_token:
            return jsonify({'error': 'ID token is required'}), 400
        
        auth_service = AuthService()
        user = auth_service.register_user(id_token)
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/me', methods=['GET'])
@require_auth
@swag_from({
    'tags': ['Authentication'],
    'summary': 'Get current user information',
    'description': 'Get information about the currently authenticated user',
    'security': [{'Bearer': []}],
    'responses': {
        200: {
            'description': 'User information retrieved successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'user': {
                        'type': 'object',
                        'properties': {
                            'id': {'type': 'string'},
                            'email': {'type': 'string'},
                            'name': {'type': 'string'},
                            'avatar_url': {'type': 'string'},
                            'created_at': {'type': 'string'},
                            'updated_at': {'type': 'string'}
                        }
                    }
                }
            }
        },
        401: {
            'description': 'Unauthorized - invalid or missing token',
            'schema': {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string'}
                }
            }
        }
    }
})
def get_current_user(current_user):
    """Get current user information."""
    return jsonify({
        'user': current_user.to_dict()
    }), 200

@auth_bp.route('/verify', methods=['POST'])
@swag_from({
    'tags': ['Authentication'],
    'summary': 'Verify Firebase ID token',
    'description': 'Verify a Firebase ID token and return decoded information',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'idToken': {
                        'type': 'string',
                        'description': 'Firebase ID token to verify'
                    }
                },
                'required': ['idToken']
            }
        }
    ],
    'responses': {
        200: {
            'description': 'Token verified successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'valid': {'type': 'boolean'},
                    'user': {
                        'type': 'object',
                        'properties': {
                            'uid': {'type': 'string'},
                            'email': {'type': 'string'},
                            'name': {'type': 'string'}
                        }
                    }
                }
            }
        },
        401: {
            'description': 'Invalid token',
            'schema': {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string'}
                }
            }
        }
    }
})
def verify_token():
    """Verify Firebase ID token."""
    try:
        data = request.get_json()
        id_token = data.get('idToken')
        
        if not id_token:
            return jsonify({'error': 'ID token is required'}), 400
        
        auth_service = AuthService()
        decoded_token = auth_service.verify_token(id_token)
        
        return jsonify({
            'valid': True,
            'user': decoded_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 401
