from datetime import datetime, timedelta
from app.models import Invitation, CanvasPermission, User
from app.extensions import db

class CollaborationService:
    """Collaboration service for managing invitations and permissions."""
    
    def invite_user(self, canvas_id: str, inviter_id: str, invitee_email: str, permission_type: str = 'view') -> Invitation:
        """Invite a user to collaborate on a canvas."""
        # Check if invitation already exists
        existing_invitation = Invitation.query.filter_by(
            canvas_id=canvas_id,
            invitee_email=invitee_email,
            status='pending'
        ).first()
        
        if existing_invitation:
            raise Exception("Invitation already sent to this user")
        
        # Create invitation
        invitation = Invitation(
            canvas_id=canvas_id,
            inviter_id=inviter_id,
            invitee_email=invitee_email,
            permission_type=permission_type,
            status='pending',
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        
        db.session.add(invitation)
        db.session.commit()
        return invitation
    
    def get_user_invitations(self, user_email: str) -> list:
        """Get all invitations for a user."""
        return Invitation.query.filter_by(invitee_email=user_email).all()
    
    def accept_invitation(self, invitation_id: str, user_id: str) -> CanvasPermission:
        """Accept an invitation and create permission."""
        invitation = Invitation.query.filter_by(id=invitation_id).first()
        if not invitation:
            raise Exception("Invitation not found")
        
        if invitation.status != 'pending':
            raise Exception("Invitation is no longer valid")
        
        if datetime.utcnow() > invitation.expires_at:
            raise Exception("Invitation has expired")
        
        # Create canvas permission
        permission = CanvasPermission(
            canvas_id=invitation.canvas_id,
            user_id=user_id,
            permission_type=invitation.permission_type,
            invited_by=invitation.inviter_id
        )
        
        db.session.add(permission)
        
        # Update invitation status
        invitation.status = 'accepted'
        
        db.session.commit()
        return permission
    
    def decline_invitation(self, invitation_id: str) -> Invitation:
        """Decline an invitation."""
        invitation = Invitation.query.filter_by(id=invitation_id).first()
        if not invitation:
            raise Exception("Invitation not found")
        
        if invitation.status != 'pending':
            raise Exception("Invitation is no longer valid")
        
        # Update invitation status
        invitation.status = 'declined'
        db.session.commit()
        return invitation
    
    def get_canvas_collaborators(self, canvas_id: str) -> list:
        """Get all collaborators for a canvas."""
        permissions = CanvasPermission.query.filter_by(canvas_id=canvas_id).all()
        collaborators = []
        
        for permission in permissions:
            user = User.query.filter_by(id=permission.user_id).first()
            if user:
                collaborator = {
                    'user_id': user.id,
                    'email': user.email,
                    'name': user.name,
                    'avatar_url': user.avatar_url,
                    'permission_type': permission.permission_type,
                    'joined_at': permission.created_at
                }
                collaborators.append(collaborator)
        
        return collaborators
    
    def update_collaborator_permission(self, canvas_id: str, user_id: str, permission_type: str) -> CanvasPermission:
        """Update collaborator permission."""
        permission = CanvasPermission.query.filter_by(
            canvas_id=canvas_id,
            user_id=user_id
        ).first()
        
        if not permission:
            raise Exception("Permission not found")
        
        permission.permission_type = permission_type
        db.session.commit()
        return permission
    
    def remove_collaborator(self, canvas_id: str, user_id: str) -> bool:
        """Remove a collaborator from canvas."""
        permission = CanvasPermission.query.filter_by(
            canvas_id=canvas_id,
            user_id=user_id
        ).first()
        
        if not permission:
            raise Exception("Permission not found")
        
        db.session.delete(permission)
        db.session.commit()
        return True