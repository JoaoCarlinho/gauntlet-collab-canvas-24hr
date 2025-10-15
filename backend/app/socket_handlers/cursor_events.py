from flask_socketio import emit, join_room, leave_room
from app.services.auth_service import AuthService
from app.extensions import redis_client
from app.utils.logger import SmartLogger
import json

def register_cursor_handlers(socketio):
    """Register cursor-related Socket.IO event handlers."""
    
    # Initialize logger
    cursor_logger = SmartLogger('cursor_events', 'INFO')
    
    def authenticate_socket_user_quiet(id_token):
        """Authenticate user with minimal logging."""
        try:
            auth_service = AuthService()
            decoded_token = auth_service.verify_token(id_token)
            user = auth_service.get_user_by_id(decoded_token['uid'])
            
            if not user:
                user = auth_service.register_user(id_token)
                cursor_logger.log_auth(user.id, "registered")
            else:
                cursor_logger.log_auth(user.id, "authenticated")
            
            return user
        except Exception as e:
            cursor_logger.log_error(f"Authentication failed", e)
            raise e
    
    def authenticate_socket_user(id_token):
        """Authenticate user for Socket.IO events (verbose for debugging)."""
        try:
            print(f"=== Socket.IO Cursor Authentication Debug ===")
            print(f"Token length: {len(id_token) if id_token else 0}")
            
            auth_service = AuthService()
            decoded_token = auth_service.verify_token(id_token)
            print(f"Token verified for user: {decoded_token.get('uid', 'unknown')}")
            
            user = auth_service.get_user_by_id(decoded_token['uid'])
            if not user:
                print("User not found in database, registering...")
                user = auth_service.register_user(id_token)
                print(f"User registered: {user.email}")
            else:
                print(f"User found in database: {user.email}")
            
            return user
        except Exception as e:
            print(f"Socket.IO cursor authentication failed: {str(e)}")
            print(f"Exception type: {type(e)}")
            raise e
    
    @socketio.on('cursor_move')
    def handle_cursor_move(data):
        """Handle cursor movement with reduced logging."""
        try:
            canvas_id = data.get('canvas_id')
            id_token = data.get('id_token')
            position = data.get('position')
            
            if not all([canvas_id, id_token, position]):
                return
            
            # Verify authentication (with reduced logging)
            try:
                user = authenticate_socket_user_quiet(id_token)
            except Exception as e:
                cursor_logger.log_error(f"Cursor authentication failed", e)
                return
            
            # Log cursor movement (rate limited)
            cursor_logger.log_cursor_move(user.id, position)
            
            # Store cursor position in Redis
            if redis_client:
                cursor_data = {
                    'user_id': user.id,
                    'user_name': user.name,
                    'position': position,
                    'timestamp': data.get('timestamp')
                }
                redis_client.setex(
                    f'cursor:{canvas_id}:{user.id}',
                    30,  # 30 seconds TTL
                    json.dumps(cursor_data)
                )
            
            # Broadcast cursor position
            emit('cursor_moved', {
                'user_id': user.id,
                'user_name': user.name,
                'position': position,
                'timestamp': data.get('timestamp')
            }, room=canvas_id, include_self=False)
            
        except Exception as e:
            cursor_logger.log_error(f"Cursor move handler error", e)
            emit('error', {'message': str(e)})
    
    @socketio.on('cursor_leave')
    def handle_cursor_leave(data):
        """Handle cursor leaving the canvas."""
        try:
            canvas_id = data.get('canvas_id')
            id_token = data.get('id_token')
            
            if not all([canvas_id, id_token]):
                return
            
            # Verify authentication (with reduced logging)
            try:
                user = authenticate_socket_user_quiet(id_token)
            except Exception as e:
                cursor_logger.log_error(f"Cursor leave authentication failed", e)
                return
            
            # Remove cursor from Redis
            if redis_client:
                redis_client.delete(f'cursor:{canvas_id}:{user.id}')
            
            # Notify other users
            emit('cursor_left', {
                'user_id': user.id,
                'user_name': user.name
            }, room=canvas_id, include_self=False)
            
        except Exception as e:
            cursor_logger.log_error(f"Cursor leave handler error", e)
            emit('error', {'message': str(e)})
    
    @socketio.on('get_cursors')
    def handle_get_cursors(data):
        """Get all active cursors for a canvas."""
        try:
            canvas_id = data.get('canvas_id')
            id_token = data.get('id_token')
            
            if not all([canvas_id, id_token]):
                return
            
            # Verify authentication (with reduced logging)
            try:
                user = authenticate_socket_user_quiet(id_token)
            except Exception as e:
                cursor_logger.log_error(f"Get cursors authentication failed", e)
                return
            
            # Get all active cursors from Redis
            cursors = []
            if redis_client:
                cursor_keys = redis_client.keys(f'cursor:{canvas_id}:*')
                for key in cursor_keys:
                    cursor_data = redis_client.get(key)
                    if cursor_data:
                        try:
                            cursor_info = json.loads(cursor_data)
                            cursors.append(cursor_info)
                        except json.JSONDecodeError:
                            continue
            
            # Send cursors to the requesting user
            emit('cursors_data', {
                'cursors': cursors
            })
            
        except Exception as e:
            cursor_logger.log_error(f"Get cursors handler error", e)
            emit('error', {'message': str(e)})
