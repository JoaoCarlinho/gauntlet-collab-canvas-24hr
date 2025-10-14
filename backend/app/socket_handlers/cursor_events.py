from flask_socketio import emit, join_room, leave_room
from app.services.auth_service import AuthService
from app.extensions import redis_client
import json

def register_cursor_handlers(socketio):
    """Register cursor-related Socket.IO event handlers."""
    
    @socketio.on('cursor_move')
    def handle_cursor_move(data):
        """Handle cursor movement."""
        try:
            canvas_id = data.get('canvas_id')
            id_token = data.get('id_token')
            position = data.get('position')
            
            if not all([canvas_id, id_token, position]):
                return
            
            # Verify authentication
            auth_service = AuthService()
            try:
                decoded_token = auth_service.verify_token(id_token)
                user = auth_service.get_user_by_id(decoded_token['uid'])
            except Exception:
                return
            
            # Store cursor position in Redis for caching
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
            
            # Broadcast cursor position to other users in the room
            emit('cursor_moved', {
                'user_id': user.id,
                'user_name': user.name,
                'position': position,
                'timestamp': data.get('timestamp')
            }, room=canvas_id, include_self=False)
            
        except Exception as e:
            emit('error', {'message': str(e)})
    
    @socketio.on('cursor_leave')
    def handle_cursor_leave(data):
        """Handle cursor leaving the canvas."""
        try:
            canvas_id = data.get('canvas_id')
            id_token = data.get('id_token')
            
            if not all([canvas_id, id_token]):
                return
            
            # Verify authentication
            auth_service = AuthService()
            try:
                decoded_token = auth_service.verify_token(id_token)
                user = auth_service.get_user_by_id(decoded_token['uid'])
            except Exception:
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
            emit('error', {'message': str(e)})
    
    @socketio.on('get_cursors')
    def handle_get_cursors(data):
        """Get all active cursors for a canvas."""
        try:
            canvas_id = data.get('canvas_id')
            id_token = data.get('id_token')
            
            if not all([canvas_id, id_token]):
                return
            
            # Verify authentication
            auth_service = AuthService()
            try:
                decoded_token = auth_service.verify_token(id_token)
                user = auth_service.get_user_by_id(decoded_token['uid'])
            except Exception:
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
            emit('error', {'message': str(e)})
