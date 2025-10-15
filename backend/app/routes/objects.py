from flask import Blueprint, request, jsonify
from flasgger import swag_from
from app.services.canvas_service import CanvasService
from app.services.auth_service import require_auth
from app.schemas.validation_schemas import CanvasObjectSchema
from app.middleware.rate_limiting import object_rate_limit
from app.utils.validators import ValidationError
from app.services.sanitization_service import SanitizationService
import json

objects_bp = Blueprint('objects', __name__)
canvas_service = CanvasService()

@objects_bp.route('/', methods=['POST'])
@require_auth
@object_rate_limit('create')
@swag_from({
    'tags': ['Objects'],
    'summary': 'Create a new canvas object',
    'description': 'Create a new object (rectangle, circle, or text) on a canvas',
    'security': [{'Bearer': []}],
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'canvas_id': {
                        'type': 'string',
                        'description': 'ID of the canvas to add the object to'
                    },
                    'object_type': {
                        'type': 'string',
                        'enum': ['rectangle', 'circle', 'text'],
                        'description': 'Type of object to create'
                    },
                    'properties': {
                        'type': 'object',
                        'description': 'Object properties (position, size, color, etc.)',
                        'properties': {
                            'x': {'type': 'number', 'description': 'X coordinate'},
                            'y': {'type': 'number', 'description': 'Y coordinate'},
                            'width': {'type': 'number', 'description': 'Width (for rectangle)'},
                            'height': {'type': 'number', 'description': 'Height (for rectangle)'},
                            'radius': {'type': 'number', 'description': 'Radius (for circle)'},
                            'text': {'type': 'string', 'description': 'Text content (for text)'},
                            'fill': {'type': 'string', 'description': 'Fill color'},
                            'stroke': {'type': 'string', 'description': 'Stroke color'},
                            'strokeWidth': {'type': 'number', 'description': 'Stroke width'},
                            'fontSize': {'type': 'number', 'description': 'Font size (for text)'},
                            'fontFamily': {'type': 'string', 'description': 'Font family (for text)'}
                        }
                    }
                },
                'required': ['canvas_id', 'object_type', 'properties']
            }
        }
    ],
    'responses': {
        201: {
            'description': 'Object created successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'},
                    'object': {
                        'type': 'object',
                        'properties': {
                            'id': {'type': 'string'},
                            'canvas_id': {'type': 'string'},
                            'object_type': {'type': 'string'},
                            'properties': {'type': 'object'},
                            'created_by': {'type': 'string'},
                            'created_at': {'type': 'string'},
                            'updated_at': {'type': 'string'}
                        }
                    }
                }
            }
        },
        400: {
            'description': 'Bad request - missing required fields or invalid object type',
            'schema': {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string'}
                }
            }
        },
        403: {
            'description': 'Access denied - insufficient permissions',
            'schema': {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string'}
                }
            }
        }
    }
})
def create_object(current_user):
    """Create a new canvas object."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        # Validate input using schema
        schema = CanvasObjectSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as e:
            return jsonify({'error': 'Validation failed', 'details': e.messages}), 400
        
        canvas_id = validated_data['canvas_id']
        object_type = validated_data['object_type']
        properties = validated_data['properties']
        
        # Check permission
        if not canvas_service.check_canvas_permission(canvas_id, current_user.id, 'edit'):
            return jsonify({'error': 'Edit permission required'}), 403
        
        # Sanitize object properties
        sanitized_properties = SanitizationService.sanitize_object_properties(properties)
        
        # Convert properties to JSON string
        properties_json = json.dumps(sanitized_properties)
        
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
        
    except ValidationError as e:
        return jsonify({'error': 'Validation failed', 'details': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

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
