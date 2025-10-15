from flask import Blueprint, request, jsonify
from flasgger import swag_from
from app.services.canvas_service import CanvasService
from app.services.auth_service import require_auth

canvas_bp = Blueprint('canvas', __name__)
canvas_service = CanvasService()

@canvas_bp.route('/', methods=['GET'])
@canvas_bp.route('', methods=['GET'])
@require_auth
@swag_from({
    'tags': ['Canvas'],
    'summary': 'Get all canvases',
    'description': 'Get all canvases accessible to the current user (owned, shared, or public)',
    'security': [{'Bearer': []}],
    'responses': {
        200: {
            'description': 'Canvases retrieved successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'canvases': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'id': {'type': 'string'},
                                'title': {'type': 'string'},
                                'description': {'type': 'string'},
                                'owner_id': {'type': 'string'},
                                'is_public': {'type': 'boolean'},
                                'created_at': {'type': 'string'},
                                'updated_at': {'type': 'string'},
                                'object_count': {'type': 'integer'},
                                'collaborator_count': {'type': 'integer'}
                            }
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
@canvas_bp.route('', methods=['POST'])
@require_auth
@swag_from({
    'tags': ['Canvas'],
    'summary': 'Create a new canvas',
    'description': 'Create a new canvas owned by the current user',
    'security': [{'Bearer': []}],
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'title': {
                        'type': 'string',
                        'description': 'Canvas title'
                    },
                    'description': {
                        'type': 'string',
                        'description': 'Canvas description (optional)'
                    },
                    'is_public': {
                        'type': 'boolean',
                        'description': 'Whether the canvas is public (optional, default: false)'
                    }
                },
                'required': ['title']
            }
        }
    ],
    'responses': {
        201: {
            'description': 'Canvas created successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'},
                    'canvas': {
                        'type': 'object',
                        'properties': {
                            'id': {'type': 'string'},
                            'title': {'type': 'string'},
                            'description': {'type': 'string'},
                            'owner_id': {'type': 'string'},
                            'is_public': {'type': 'boolean'},
                            'created_at': {'type': 'string'},
                            'updated_at': {'type': 'string'}
                        }
                    }
                }
            }
        },
        400: {
            'description': 'Bad request - missing required fields',
            'schema': {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string'}
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
def create_canvas(current_user):
    """Create a new canvas."""
    try:
        print(f"=== Canvas Creation Debug ===")
        print(f"Current user ID: {current_user.id}")
        print(f"Current user email: {current_user.email}")
        
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
@swag_from({
    'tags': ['Canvas'],
    'summary': 'Get a specific canvas',
    'description': 'Get details of a specific canvas by ID',
    'security': [{'Bearer': []}],
    'parameters': [
        {
            'name': 'canvas_id',
            'in': 'path',
            'type': 'string',
            'required': True,
            'description': 'Canvas ID'
        }
    ],
    'responses': {
        200: {
            'description': 'Canvas retrieved successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'canvas': {
                        'type': 'object',
                        'properties': {
                            'id': {'type': 'string'},
                            'title': {'type': 'string'},
                            'description': {'type': 'string'},
                            'owner_id': {'type': 'string'},
                            'is_public': {'type': 'boolean'},
                            'created_at': {'type': 'string'},
                            'updated_at': {'type': 'string'},
                            'object_count': {'type': 'integer'},
                            'collaborator_count': {'type': 'integer'}
                        }
                    }
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
        },
        404: {
            'description': 'Canvas not found',
            'schema': {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string'}
                }
            }
        }
    }
})
def get_canvas(current_user, canvas_id):
    """Get a specific canvas."""
    try:
        print(f"=== Canvas Access Debug ===")
        print(f"Canvas ID: {canvas_id}")
        print(f"Current user ID: {current_user.id}")
        print(f"Current user email: {current_user.email}")
        
        canvas = canvas_service.get_canvas_by_id(canvas_id)
        if not canvas:
            print("Canvas not found")
            return jsonify({'error': 'Canvas not found'}), 404
        
        print(f"Canvas found - Owner ID: {canvas.owner_id}")
        print(f"Canvas is public: {canvas.is_public}")
        
        # Check permission
        has_permission = canvas_service.check_canvas_permission(canvas_id, current_user.id)
        print(f"User has permission: {has_permission}")
        
        if not has_permission:
            print("Access denied - user does not have permission")
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
