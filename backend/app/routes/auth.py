from flask import Blueprint, request, jsonify
from app.services.auth_service import AuthService, require_auth

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
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
def get_current_user(current_user):
    """Get current user information."""
    return jsonify({
        'user': current_user.to_dict()
    }), 200

@auth_bp.route('/verify', methods=['POST'])
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
