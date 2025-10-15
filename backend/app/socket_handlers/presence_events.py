from flask_socketio import emit, join_room, leave_room
from app.services.auth_service import AuthService
from app.extensions import redis_client
import json

def register_presence_handlers(socketio):
    """Register presence-related Socket.IO event handlers."""
    
    @socketio.on('user_online')
    def handle_user_online(data):
        """Handle user coming online."""
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
            
            # Store user presence in Redis (if available)
            if redis_client:
                presence_data = {
                    'user_id': user.id,
                    'user_name': user.name,
                    'user_email': user.email,
                    'avatar_url': user.avatar_url,
                    'timestamp': data.get('timestamp')
                }
                redis_client.setex(
                    f'presence:{canvas_id}:{user.id}',
                    60,  # 60 seconds TTL
                    json.dumps(presence_data)
                )
            
            # Join the presence room
            join_room(f'presence:{canvas_id}')
            
            # Notify other users
            emit('user_came_online', {
                'user': user.to_dict()
            }, room=f'presence:{canvas_id}', include_self=False)
            
        except Exception as e:
            emit('error', {'message': str(e)})
    
    @socketio.on('user_offline')
    def handle_user_offline(data):
        """Handle user going offline."""
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
            
            # Remove user presence from Redis
            if redis_client:
                redis_client.delete(f'presence:{canvas_id}:{user.id}')
                redis_client.delete(f'cursor:{canvas_id}:{user.id}')
            
            # Leave the presence room
            leave_room(f'presence:{canvas_id}')
            
            # Notify other users
            emit('user_went_offline', {
                'user_id': user.id,
                'user_name': user.name
            }, room=f'presence:{canvas_id}', include_self=False)
            
        except Exception as e:
            emit('error', {'message': str(e)})
    
    @socketio.on('get_online_users')
    def handle_get_online_users(data):
        """Get all online users for a canvas."""
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
            
            # Get all online users from Redis
            online_users = []
            if redis_client:
                presence_keys = redis_client.keys(f'presence:{canvas_id}:*')
                for key in presence_keys:
                    presence_data = redis_client.get(key)
                    if presence_data:
                        try:
                            user_info = json.loads(presence_data)
                            online_users.append(user_info)
                        except json.JSONDecodeError:
                            continue
            
            # Send online users to the requesting user
            emit('online_users', {
                'users': online_users
            })
            
        except Exception as e:
            emit('error', {'message': str(e)})
    
    @socketio.on('heartbeat')
    def handle_heartbeat(data):
        """Handle user heartbeat to maintain presence."""
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
            
            # Update presence timestamp in Redis
            if redis_client:
                presence_data = {
                    'user_id': user.id,
                    'user_name': user.name,
                    'user_email': user.email,
                    'avatar_url': user.avatar_url,
                    'timestamp': data.get('timestamp')
                }
                redis_client.setex(
                    f'presence:{canvas_id}:{user.id}',
                    60,  # 60 seconds TTL
                    json.dumps(presence_data)
                )
            
        except Exception as e:
            emit('error', {'message': str(e)})
