from flask import Blueprint, request, jsonify
from app.services.canvas_service import CanvasService
from app.services.auth_service import require_auth

canvas_bp = Blueprint('canvas', __name__)
canvas_service = CanvasService()

@canvas_bp.route('/', methods=['GET'])
@require_auth
def get_canvases(current_user):
    """Get all canvases accessible to the current user."""
    try:
        canvases = canvas_service.get_user_canvases(current_user.id)
        return jsonify({
            'canvases': [canvas.to_dict() for canvas in canvases]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@canvas_bp.route('/', methods=['POST'])
@require_auth
def create_canvas(current_user):
    """Create a new canvas."""
    try:
        data = request.get_json()
        title = data.get('title')
        description = data.get('description', '')
        is_public = data.get('is_public', False)
        
        if not title:
            return jsonify({'error': 'Title is required'}), 400
        
        canvas = canvas_service.create_canvas(
            title=title,
            description=description,
            owner_id=current_user.id,
            is_public=is_public
        )
        
        return jsonify({
            'message': 'Canvas created successfully',
            'canvas': canvas.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@canvas_bp.route('/<canvas_id>', methods=['GET'])
@require_auth
def get_canvas(current_user, canvas_id):
    """Get a specific canvas."""
    try:
        canvas = canvas_service.get_canvas_by_id(canvas_id)
        if not canvas:
            return jsonify({'error': 'Canvas not found'}), 404
        
        # Check permission
        if not canvas_service.check_canvas_permission(canvas_id, current_user.id):
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify({
            'canvas': canvas.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@canvas_bp.route('/<canvas_id>', methods=['PUT'])
@require_auth
def update_canvas(current_user, canvas_id):
    """Update a canvas."""
    try:
        canvas = canvas_service.get_canvas_by_id(canvas_id)
        if not canvas:
            return jsonify({'error': 'Canvas not found'}), 404
        
        # Check if user is owner
        if canvas.owner_id != current_user.id:
            return jsonify({'error': 'Only the owner can update the canvas'}), 403
        
        data = request.get_json()
        updated_canvas = canvas_service.update_canvas(canvas_id, **data)
        
        return jsonify({
            'message': 'Canvas updated successfully',
            'canvas': updated_canvas.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@canvas_bp.route('/<canvas_id>', methods=['DELETE'])
@require_auth
def delete_canvas(current_user, canvas_id):
    """Delete a canvas."""
    try:
        canvas = canvas_service.get_canvas_by_id(canvas_id)
        if not canvas:
            return jsonify({'error': 'Canvas not found'}), 404
        
        # Check if user is owner
        if canvas.owner_id != current_user.id:
            return jsonify({'error': 'Only the owner can delete the canvas'}), 403
        
        success = canvas_service.delete_canvas(canvas_id)
        if success:
            return jsonify({'message': 'Canvas deleted successfully'}), 200
        else:
            return jsonify({'error': 'Failed to delete canvas'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@canvas_bp.route('/<canvas_id>/objects', methods=['GET'])
@require_auth
def get_canvas_objects(current_user, canvas_id):
    """Get all objects for a canvas."""
    try:
        # Check permission
        if not canvas_service.check_canvas_permission(canvas_id, current_user.id):
            return jsonify({'error': 'Access denied'}), 403
        
        objects = canvas_service.get_canvas_objects(canvas_id)
        return jsonify({
            'objects': [obj.to_dict() for obj in objects]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
