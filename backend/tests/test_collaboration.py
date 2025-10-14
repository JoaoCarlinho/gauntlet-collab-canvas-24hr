import pytest
from app.services.collaboration_service import CollaborationService
from app.models import User, Canvas, CanvasPermission, Invitation

class TestCollaborationService:
    """Test collaboration service."""
    
    def test_invite_user_to_canvas(self, session, sample_user, sample_canvas):
        """Test inviting a user to a canvas."""
        session.add(sample_canvas)
        session.commit()
        
        collaboration_service = CollaborationService()
        invitation = collaboration_service.invite_user_to_canvas(
            canvas_id='test-canvas-id',
            inviter_id=sample_user.id,
            invitee_email='invitee@example.com',
            permission_type='view'
        )
        
        assert invitation.canvas_id == 'test-canvas-id'
        assert invitation.invitee_email == 'invitee@example.com'
        assert invitation.permission_type == 'view'
        assert invitation.status == 'pending'
    
    def test_accept_invitation(self, session, sample_user, sample_canvas):
        """Test accepting an invitation."""
        session.add(sample_canvas)
        
        # Create invitation
        invitation = Invitation(
            id='test-invitation-id',
            canvas_id='test-canvas-id',
            inviter_id=sample_user.id,
            invitee_email='invitee@example.com',
            permission_type='view'
        )
        session.add(invitation)
        session.commit()
        
        collaboration_service = CollaborationService()
        permission = collaboration_service.accept_invitation('test-invitation-id', 'invitee-user-id')
        
        assert permission is not None
        assert permission.canvas_id == 'test-canvas-id'
        assert permission.user_id == 'invitee-user-id'
        assert permission.permission_type == 'view'
        
        # Check invitation status updated
        updated_invitation = session.query(Invitation).filter_by(id='test-invitation-id').first()
        assert updated_invitation.status == 'accepted'
    
    def test_decline_invitation(self, session, sample_user, sample_canvas):
        """Test declining an invitation."""
        session.add(sample_canvas)
        
        # Create invitation
        invitation = Invitation(
            id='test-invitation-id',
            canvas_id='test-canvas-id',
            inviter_id=sample_user.id,
            invitee_email='invitee@example.com',
            permission_type='view'
        )
        session.add(invitation)
        session.commit()
        
        collaboration_service = CollaborationService()
        declined_invitation = collaboration_service.decline_invitation('test-invitation-id')
        
        assert declined_invitation is not None
        assert declined_invitation.status == 'declined'
    
    def test_get_user_invitations(self, session, sample_user, sample_canvas):
        """Test getting user invitations."""
        session.add(sample_canvas)
        
        # Create invitations
        invitation1 = Invitation(
            id='inv1',
            canvas_id='test-canvas-id',
            inviter_id=sample_user.id,
            invitee_email='user@example.com',
            permission_type='view'
        )
        invitation2 = Invitation(
            id='inv2',
            canvas_id='test-canvas-id',
            inviter_id=sample_user.id,
            invitee_email='user@example.com',
            permission_type='edit'
        )
        session.add_all([invitation1, invitation2])
        session.commit()
        
        collaboration_service = CollaborationService()
        invitations = collaboration_service.get_user_invitations('user@example.com')
        
        assert len(invitations) == 2
        assert invitations[0].invitee_email == 'user@example.com'
        assert invitations[1].invitee_email == 'user@example.com'
    
    def test_get_canvas_collaborators(self, session, sample_user, sample_canvas):
        """Test getting canvas collaborators."""
        session.add(sample_canvas)
        
        # Create collaborator user
        collaborator = User(
            id='collaborator-id',
            email='collaborator@example.com',
            name='Collaborator'
        )
        session.add(collaborator)
        
        # Create permission
        permission = CanvasPermission(
            canvas_id='test-canvas-id',
            user_id='collaborator-id',
            permission_type='edit',
            granted_by=sample_user.id
        )
        session.add(permission)
        session.commit()
        
        collaboration_service = CollaborationService()
        collaborators = collaboration_service.get_canvas_collaborators('test-canvas-id')
        
        assert len(collaborators) == 1
        assert collaborators[0]['user']['id'] == 'collaborator-id'
        assert collaborators[0]['permission_type'] == 'edit'
    
    def test_update_collaborator_permission(self, session, sample_user, sample_canvas):
        """Test updating collaborator permission."""
        session.add(sample_canvas)
        
        # Create permission
        permission = CanvasPermission(
            canvas_id='test-canvas-id',
            user_id='collaborator-id',
            permission_type='view',
            granted_by=sample_user.id
        )
        session.add(permission)
        session.commit()
        
        collaboration_service = CollaborationService()
        updated_permission = collaboration_service.update_collaborator_permission(
            canvas_id='test-canvas-id',
            user_id='collaborator-id',
            new_permission_type='edit',
            updated_by=sample_user.id
        )
        
        assert updated_permission.permission_type == 'edit'
        assert updated_permission.granted_by == sample_user.id
    
    def test_remove_collaborator(self, session, sample_user, sample_canvas):
        """Test removing a collaborator."""
        session.add(sample_canvas)
        
        # Create permission
        permission = CanvasPermission(
            canvas_id='test-canvas-id',
            user_id='collaborator-id',
            permission_type='edit',
            granted_by=sample_user.id
        )
        session.add(permission)
        session.commit()
        
        collaboration_service = CollaborationService()
        success = collaboration_service.remove_collaborator('test-canvas-id', 'collaborator-id')
        
        assert success == True
        
        # Verify permission is removed
        remaining_permission = session.query(CanvasPermission).filter_by(
            canvas_id='test-canvas-id',
            user_id='collaborator-id'
        ).first()
        assert remaining_permission is None
    
    def test_get_canvas_pending_invitations(self, session, sample_user, sample_canvas):
        """Test getting canvas pending invitations."""
        session.add(sample_canvas)
        
        # Create invitations
        invitation1 = Invitation(
            id='inv1',
            canvas_id='test-canvas-id',
            inviter_id=sample_user.id,
            invitee_email='user1@example.com',
            permission_type='view'
        )
        invitation2 = Invitation(
            id='inv2',
            canvas_id='test-canvas-id',
            inviter_id=sample_user.id,
            invitee_email='user2@example.com',
            permission_type='edit'
        )
        session.add_all([invitation1, invitation2])
        session.commit()
        
        collaboration_service = CollaborationService()
        invitations = collaboration_service.get_canvas_pending_invitations('test-canvas-id')
        
        assert len(invitations) == 2
        assert invitations[0].canvas_id == 'test-canvas-id'
        assert invitations[1].canvas_id == 'test-canvas-id'
