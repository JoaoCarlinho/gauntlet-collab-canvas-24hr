from flask import Blueprint, request, jsonify
from flasgger import swag_from
from app.services.collaboration_service import CollaborationService
from app.services.canvas_service import CanvasService
from app.services.auth_service import require_auth

collaboration_bp = Blueprint('collaboration', __name__)
collaboration_service = CollaborationService()
canvas_service = CanvasService()

@collaboration_bp.route('/invite', methods=['POST'])
@require_auth
@swag_from({
    'tags': ['Collaboration'],
    'summary': 'Invite a user to collaborate on a canvas',
    'description': 'Send an invitation to a user to collaborate on a canvas with specified permissions',
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
                        'description': 'ID of the canvas to invite user to'
                    },
                    'invitee_email': {
                        'type': 'string',
                        'format': 'email',
                        'description': 'Email address of the user to invite'
                    },
                    'permission_type': {
                        'type': 'string',
                        'enum': ['view', 'edit'],
                        'description': 'Permission level to grant (view or edit)'
                    }
                },
                'required': ['canvas_id', 'invitee_email']
            }
        }
    ],
    'responses': {
        201: {
            'description': 'Invitation sent successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'},
                    'invitation': {
                        'type': 'object',
                        'properties': {
                            'id': {'type': 'string'},
                            'canvas_id': {'type': 'string'},
                            'inviter_id': {'type': 'string'},
                            'invitee_email': {'type': 'string'},
                            'permission_type': {'type': 'string'},
                            'status': {'type': 'string'},
                            'expires_at': {'type': 'string'},
                            'created_at': {'type': 'string'}
                        }
                    }
                }
            }
        },
        400: {
            'description': 'Bad request - missing required fields or invalid permission type',
            'schema': {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string'}
                }
            }
        },
        403: {
            'description': 'Access denied - only canvas owner can invite users',
            'schema': {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string'}
                }
            }
        }
    }
})
def invite_user(current_user):
    """Invite a user to collaborate on a canvas."""
    try:
        data = request.get_json()
        canvas_id = data.get('canvas_id')
        invitee_email = data.get('invitee_email')
        permission_type = data.get('permission_type', 'view')
        
        if not all([canvas_id, invitee_email]):
            return jsonify({'error': 'canvas_id and invitee_email are required'}), 400
        
        # Check if user is owner
        canvas = canvas_service.get_canvas_by_id(canvas_id)
        if not canvas or canvas.owner_id != current_user.id:
            return jsonify({'error': 'Only the owner can invite users'}), 403
        
        # Validate permission type
        valid_permissions = ['view', 'edit']
        if permission_type not in valid_permissions:
            return jsonify({'error': f'Invalid permission type. Must be one of: {valid_permissions}'}), 400
        
        invitation = collaboration_service.invite_user_to_canvas(
            canvas_id=canvas_id,
            inviter_id=current_user.id,
            invitee_email=invitee_email,
            permission_type=permission_type
        )
        
        return jsonify({
            'message': 'Invitation sent successfully',
            'invitation': invitation.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@collaboration_bp.route('/invitations', methods=['GET'])
@require_auth
def get_invitations(current_user):
    """Get all pending invitations for the current user."""
    try:
        invitations = collaboration_service.get_user_invitations(current_user.email)
        return jsonify({
            'invitations': [invitation.to_dict() for invitation in invitations]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@collaboration_bp.route('/invitations/<invitation_id>/accept', methods=['POST'])
@require_auth
def accept_invitation(current_user, invitation_id):
    """Accept an invitation."""
    try:
        permission = collaboration_service.accept_invitation(invitation_id, current_user.id)
        if not permission:
            return jsonify({'error': 'Invitation not found or expired'}), 404
        
        return jsonify({
            'message': 'Invitation accepted successfully',
            'permission': permission.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@collaboration_bp.route('/invitations/<invitation_id>/decline', methods=['POST'])
@require_auth
def decline_invitation(current_user, invitation_id):
    """Decline an invitation."""
    try:
        invitation = collaboration_service.decline_invitation(invitation_id)
        if not invitation:
            return jsonify({'error': 'Invitation not found'}), 404
        
        return jsonify({
            'message': 'Invitation declined successfully',
            'invitation': invitation.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@collaboration_bp.route('/canvas/<canvas_id>/collaborators', methods=['GET'])
@require_auth
def get_collaborators(current_user, canvas_id):
    """Get all collaborators for a canvas."""
    try:
        # Check permission
        if not canvas_service.check_canvas_permission(canvas_id, current_user.id):
            return jsonify({'error': 'Access denied'}), 403
        
        collaborators = collaboration_service.get_canvas_collaborators(canvas_id)
        return jsonify({
            'collaborators': collaborators
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@collaboration_bp.route('/canvas/<canvas_id>/collaborators/<user_id>', methods=['PUT'])
@require_auth
def update_collaborator_permission(current_user, canvas_id, user_id):
    """Update a collaborator's permission."""
    try:
        # Check if user is owner
        canvas = canvas_service.get_canvas_by_id(canvas_id)
        if not canvas or canvas.owner_id != current_user.id:
            return jsonify({'error': 'Only the owner can update permissions'}), 403
        
        data = request.get_json()
        new_permission_type = data.get('permission_type')
        
        if not new_permission_type:
            return jsonify({'error': 'permission_type is required'}), 400
        
        # Validate permission type
        valid_permissions = ['view', 'edit']
        if new_permission_type not in valid_permissions:
            return jsonify({'error': f'Invalid permission type. Must be one of: {valid_permissions}'}), 400
        
        permission = collaboration_service.update_collaborator_permission(
            canvas_id=canvas_id,
            user_id=user_id,
            new_permission_type=new_permission_type,
            updated_by=current_user.id
        )
        
        if not permission:
            return jsonify({'error': 'Collaborator not found'}), 404
        
        return jsonify({
            'message': 'Permission updated successfully',
            'permission': permission.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@collaboration_bp.route('/canvas/<canvas_id>/collaborators/<user_id>', methods=['DELETE'])
@require_auth
def remove_collaborator(current_user, canvas_id, user_id):
    """Remove a collaborator from a canvas."""
    try:
        # Check if user is owner
        canvas = canvas_service.get_canvas_by_id(canvas_id)
        if not canvas or canvas.owner_id != current_user.id:
            return jsonify({'error': 'Only the owner can remove collaborators'}), 403
        
        success = collaboration_service.remove_collaborator(canvas_id, user_id)
        if not success:
            return jsonify({'error': 'Collaborator not found'}), 404
        
        return jsonify({
            'message': 'Collaborator removed successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@collaboration_bp.route('/canvas/<canvas_id>/invitations', methods=['GET'])
@require_auth
def get_canvas_invitations(current_user, canvas_id):
    """Get all pending invitations for a canvas."""
    try:
        # Check if user is owner
        canvas = canvas_service.get_canvas_by_id(canvas_id)
        if not canvas or canvas.owner_id != current_user.id:
            return jsonify({'error': 'Only the owner can view invitations'}), 403
        
        invitations = collaboration_service.get_canvas_pending_invitations(canvas_id)
        return jsonify({
            'invitations': [invitation.to_dict() for invitation in invitations]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
