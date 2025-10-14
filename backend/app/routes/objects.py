from flask import Blueprint, request, jsonify
from app.services.canvas_service import CanvasService
from app.services.auth_service import require_auth
import json

objects_bp = Blueprint('objects', __name__)
canvas_service = CanvasService()

@objects_bp.route('/', methods=['POST'])
@require_auth
def create_object(current_user):
    """Create a new canvas object."""
    try:
        data = request.get_json()
        canvas_id = data.get('canvas_id')
        object_type = data.get('object_type')
        properties = data.get('properties', {})
        
        if not all([canvas_id, object_type]):
            return jsonify({'error': 'canvas_id and object_type are required'}), 400
        
        # Check permission
        if not canvas_service.check_canvas_permission(canvas_id, current_user.id, 'edit'):
            return jsonify({'error': 'Edit permission required'}), 403
        
        # Validate object type
        valid_types = ['rectangle', 'circle', 'text']
        if object_type not in valid_types:
            return jsonify({'error': f'Invalid object type. Must be one of: {valid_types}'}), 400
        
        # Convert properties to JSON string
        properties_json = json.dumps(properties)
        
        canvas_object = canvas_service.create_canvas_object(
            canvas_id=canvas_id,
            object_type=object_type,
            properties=properties_json,
            created_by=current_user.id
        )
        
        return jsonify({
            'message': 'Object created successfully',
            'object': canvas_object.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@objects_bp.route('/<object_id>', methods=['GET'])
@require_auth
def get_object(current_user, object_id):
    """Get a specific canvas object."""
    try:
        from app.models import CanvasObject
        canvas_object = CanvasObject.query.filter_by(id=object_id).first()
        if not canvas_object:
            return jsonify({'error': 'Object not found'}), 404
        
        # Check permission
        if not canvas_service.check_canvas_permission(canvas_object.canvas_id, current_user.id):
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify({
            'object': canvas_object.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@objects_bp.route('/<object_id>', methods=['PUT'])
@require_auth
def update_object(current_user, object_id):
    """Update a canvas object."""
    try:
        from app.models import CanvasObject
        canvas_object = CanvasObject.query.filter_by(id=object_id).first()
        if not canvas_object:
            return jsonify({'error': 'Object not found'}), 404
        
        # Check permission
        if not canvas_service.check_canvas_permission(canvas_object.canvas_id, current_user.id, 'edit'):
            return jsonify({'error': 'Edit permission required'}), 403
        
        data = request.get_json()
        properties = data.get('properties')
        
        if properties is not None:
            # Convert properties to JSON string
            properties_json = json.dumps(properties)
            data['properties'] = properties_json
        
        updated_object = canvas_service.update_canvas_object(object_id, **data)
        
        return jsonify({
            'message': 'Object updated successfully',
            'object': updated_object.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@objects_bp.route('/<object_id>', methods=['DELETE'])
@require_auth
def delete_object(current_user, object_id):
    """Delete a canvas object."""
    try:
        from app.models import CanvasObject
        canvas_object = CanvasObject.query.filter_by(id=object_id).first()
        if not canvas_object:
            return jsonify({'error': 'Object not found'}), 404
        
        # Check permission
        if not canvas_service.check_canvas_permission(canvas_object.canvas_id, current_user.id, 'edit'):
            return jsonify({'error': 'Edit permission required'}), 403
        
        success = canvas_service.delete_canvas_object(object_id)
        if success:
            return jsonify({'message': 'Object deleted successfully'}), 200
        else:
            return jsonify({'error': 'Failed to delete object'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
