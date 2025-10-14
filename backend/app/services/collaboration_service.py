import uuid
from datetime import datetime, timedelta
from app.models import CanvasPermission, Invitation, User
from app.extensions import db
from app.services.auth_service import AuthService

class CollaborationService:
    """Collaboration related business logic."""
    
    def __init__(self):
        self.auth_service = AuthService()
    
    def invite_user_to_canvas(self, canvas_id, inviter_id, invitee_email, permission_type='view'):
        """Invite a user to collaborate on a canvas."""
        # Check if invitation already exists
        existing_invitation = Invitation.query.filter_by(
            canvas_id=canvas_id,
            invitee_email=invitee_email,
            status='pending'
        ).first()
        
        if existing_invitation:
            return existing_invitation
        
        # Create new invitation
        invitation = Invitation(
            id=str(uuid.uuid4()),
            canvas_id=canvas_id,
            inviter_id=inviter_id,
            invitee_email=invitee_email,
            permission_type=permission_type,
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        
        db.session.add(invitation)
        db.session.commit()
        
        return invitation
    
    def accept_invitation(self, invitation_id, user_id):
        """Accept an invitation and grant permission."""
        invitation = Invitation.query.filter_by(id=invitation_id).first()
        if not invitation:
            return None
        
        if invitation.is_expired():
            invitation.status = 'expired'
            db.session.commit()
            return None
        
        # Create permission
        permission = CanvasPermission(
            canvas_id=invitation.canvas_id,
            user_id=user_id,
            permission_type=invitation.permission_type,
            granted_by=invitation.inviter_id
        )
        
        # Update invitation status
        invitation.status = 'accepted'
        
        db.session.add(permission)
        db.session.commit()
        
        return permission
    
    def decline_invitation(self, invitation_id):
        """Decline an invitation."""
        invitation = Invitation.query.filter_by(id=invitation_id).first()
        if not invitation:
            return None
        
        invitation.status = 'declined'
        db.session.commit()
        
        return invitation
    
    def get_user_invitations(self, user_email):
        """Get all pending invitations for a user."""
        return Invitation.query.filter_by(
            invitee_email=user_email,
            status='pending'
        ).filter(Invitation.expires_at > datetime.utcnow()).all()
    
    def get_canvas_collaborators(self, canvas_id):
        """Get all collaborators for a canvas."""
        permissions = CanvasPermission.query.filter_by(canvas_id=canvas_id).all()
        collaborators = []
        
        for permission in permissions:
            user = User.query.filter_by(id=permission.user_id).first()
            if user:
                collaborators.append({
                    'user': user.to_dict(),
                    'permission_type': permission.permission_type,
                    'granted_at': permission.granted_at.isoformat()
                })
        
        return collaborators
    
    def update_collaborator_permission(self, canvas_id, user_id, new_permission_type, updated_by):
        """Update a collaborator's permission."""
        permission = CanvasPermission.query.filter_by(
            canvas_id=canvas_id,
            user_id=user_id
        ).first()
        
        if not permission:
            return None
        
        permission.permission_type = new_permission_type
        permission.granted_by = updated_by
        db.session.commit()
        
        return permission
    
    def remove_collaborator(self, canvas_id, user_id):
        """Remove a collaborator from a canvas."""
        permission = CanvasPermission.query.filter_by(
            canvas_id=canvas_id,
            user_id=user_id
        ).first()
        
        if not permission:
            return False
        
        db.session.delete(permission)
        db.session.commit()
        
        return True
    
    def get_canvas_pending_invitations(self, canvas_id):
        """Get all pending invitations for a canvas."""
        return Invitation.query.filter_by(
            canvas_id=canvas_id,
            status='pending'
        ).filter(Invitation.expires_at > datetime.utcnow()).all()
