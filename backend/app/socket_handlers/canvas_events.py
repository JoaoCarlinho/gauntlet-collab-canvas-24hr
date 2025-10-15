from flask_socketio import emit, join_room, leave_room
from app.services.auth_service import AuthService
from app.services.canvas_service import CanvasService
from app.extensions import redis_client
import json

def register_canvas_handlers(socketio):
    """Register canvas-related Socket.IO event handlers."""
    
    def authenticate_socket_user(id_token):
        """Authenticate user for Socket.IO events."""
        try:
            print(f"=== Socket.IO Authentication Debug ===")
            print(f"Token length: {len(id_token) if id_token else 0}")
            print(f"Token starts with: {id_token[:50] if id_token else 'None'}...")
            
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
            print(f"Socket.IO authentication failed: {str(e)}")
            print(f"Exception type: {type(e)}")
            raise e
    
    @socketio.on('join_canvas')
    def handle_join_canvas(data):
        """Handle user joining a canvas room."""
        try:
            canvas_id = data.get('canvas_id')
            id_token = data.get('id_token')
            
            print(f"=== Join Canvas Debug ===")
            print(f"Canvas ID: {canvas_id}")
            print(f"Token provided: {bool(id_token)}")
            
            if not canvas_id or not id_token:
                emit('error', {'message': 'canvas_id and id_token are required'})
                return
            
            # Verify authentication
            try:
                user = authenticate_socket_user(id_token)
            except Exception as e:
                emit('error', {'message': f'Authentication failed: {str(e)}'})
                return
            
            # Check canvas permission
            canvas_service = CanvasService()
            if not canvas_service.check_canvas_permission(canvas_id, user.id):
                emit('error', {'message': 'Access denied to canvas'})
                return
            
            # Join the canvas room
            join_room(canvas_id)
            
            # Store user info in session
            emit('joined_canvas', {
                'canvas_id': canvas_id,
                'user': user.to_dict()
            })
            
            # Notify others in the room
            emit('user_joined', {
                'user': user.to_dict()
            }, room=canvas_id, include_self=False)
            
        except Exception as e:
            emit('error', {'message': str(e)})
    
    @socketio.on('leave_canvas')
    def handle_leave_canvas(data):
        """Handle user leaving a canvas room."""
        try:
            canvas_id = data.get('canvas_id')
            id_token = data.get('id_token')
            
            if not canvas_id or not id_token:
                return
            
            # Verify authentication
            auth_service = AuthService()
            try:
                decoded_token = auth_service.verify_token(id_token)
                user = auth_service.get_user_by_id(decoded_token['uid'])
            except Exception:
                return
            
            # Leave the canvas room
            leave_room(canvas_id)
            
            # Notify others in the room
            emit('user_left', {
                'user_id': user.id,
                'user_name': user.name
            }, room=canvas_id, include_self=False)
            
        except Exception as e:
            emit('error', {'message': str(e)})
    
    @socketio.on('object_created')
    def handle_object_created(data):
        """Handle canvas object creation."""
        try:
            canvas_id = data.get('canvas_id')
            id_token = data.get('id_token')
            object_data = data.get('object')
            
            if not all([canvas_id, id_token, object_data]):
                emit('error', {'message': 'canvas_id, id_token, and object are required'})
                return
            
            # Verify authentication
            auth_service = AuthService()
            try:
                decoded_token = auth_service.verify_token(id_token)
                user = auth_service.get_user_by_id(decoded_token['uid'])
            except Exception as e:
                emit('error', {'message': f'Authentication failed: {str(e)}'})
                return
            
            # Check edit permission
            canvas_service = CanvasService()
            if not canvas_service.check_canvas_permission(canvas_id, user.id, 'edit'):
                emit('error', {'message': 'Edit permission required'})
                return
            
            # Create object in database
            canvas_object = canvas_service.create_canvas_object(
                canvas_id=canvas_id,
                object_type=object_data['type'],
                properties=json.dumps(object_data['properties']),
                created_by=user.id
            )
            
            # Broadcast to all users in the canvas room (including the creator)
            emit('object_created', {
                'object': canvas_object.to_dict()
            }, room=canvas_id, include_self=True)
            
        except Exception as e:
            emit('error', {'message': str(e)})
    
    @socketio.on('object_updated')
    def handle_object_updated(data):
        """Handle canvas object update."""
        try:
            canvas_id = data.get('canvas_id')
            id_token = data.get('id_token')
            object_id = data.get('object_id')
            properties = data.get('properties')
            
            if not all([canvas_id, id_token, object_id, properties]):
                emit('error', {'message': 'canvas_id, id_token, object_id, and properties are required'})
                return
            
            # Verify authentication
            auth_service = AuthService()
            try:
                decoded_token = auth_service.verify_token(id_token)
                user = auth_service.get_user_by_id(decoded_token['uid'])
            except Exception as e:
                emit('error', {'message': f'Authentication failed: {str(e)}'})
                return
            
            # Check edit permission
            canvas_service = CanvasService()
            if not canvas_service.check_canvas_permission(canvas_id, user.id, 'edit'):
                emit('error', {'message': 'Edit permission required'})
                return
            
            # Update object in database
            updated_object = canvas_service.update_canvas_object(
                object_id=object_id,
                properties=json.dumps(properties)
            )
            
            if updated_object:
                # Broadcast to all users in the canvas room (including the updater)
                emit('object_updated', {
                    'object': updated_object.to_dict()
                }, room=canvas_id, include_self=True)
            
        except Exception as e:
            emit('error', {'message': str(e)})
    
    @socketio.on('object_deleted')
    def handle_object_deleted(data):
        """Handle canvas object deletion."""
        try:
            canvas_id = data.get('canvas_id')
            id_token = data.get('id_token')
            object_id = data.get('object_id')
            
            if not all([canvas_id, id_token, object_id]):
                emit('error', {'message': 'canvas_id, id_token, and object_id are required'})
                return
            
            # Verify authentication
            auth_service = AuthService()
            try:
                decoded_token = auth_service.verify_token(id_token)
                user = auth_service.get_user_by_id(decoded_token['uid'])
            except Exception as e:
                emit('error', {'message': f'Authentication failed: {str(e)}'})
                return
            
            # Check edit permission
            canvas_service = CanvasService()
            if not canvas_service.check_canvas_permission(canvas_id, user.id, 'edit'):
                emit('error', {'message': 'Edit permission required'})
                return
            
            # Delete object from database
            success = canvas_service.delete_canvas_object(object_id)
            
            if success:
                # Broadcast to all users in the canvas room (including the deleter)
                emit('object_deleted', {
                    'object_id': object_id
                }, room=canvas_id, include_self=True)
            
        except Exception as e:
            emit('error', {'message': str(e)})
