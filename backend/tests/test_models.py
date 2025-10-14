import pytest
from app.models import User, Canvas, CanvasObject, CanvasPermission, Invitation
from app.extensions import db

class TestUser:
    """Test User model."""
    
    def test_create_user(self, session):
        """Test creating a user."""
        user = User(
            id='test-user-id',
            email='test@example.com',
            name='Test User'
        )
        session.add(user)
        session.commit()
        
        assert user.id == 'test-user-id'
        assert user.email == 'test@example.com'
        assert user.name == 'Test User'
    
    def test_user_to_dict(self, session):
        """Test user serialization."""
        user = User(
            id='test-user-id',
            email='test@example.com',
            name='Test User'
        )
        session.add(user)
        session.commit()
        
        user_dict = user.to_dict()
        assert user_dict['id'] == 'test-user-id'
        assert user_dict['email'] == 'test@example.com'
        assert user_dict['name'] == 'Test User'

class TestCanvas:
    """Test Canvas model."""
    
    def test_create_canvas(self, session, sample_user):
        """Test creating a canvas."""
        canvas = Canvas(
            id='test-canvas-id',
            title='Test Canvas',
            description='Test Description',
            owner_id=sample_user.id,
            is_public=False
        )
        session.add(canvas)
        session.commit()
        
        assert canvas.id == 'test-canvas-id'
        assert canvas.title == 'Test Canvas'
        assert canvas.owner_id == sample_user.id
    
    def test_canvas_to_dict(self, session, sample_user):
        """Test canvas serialization."""
        canvas = Canvas(
            id='test-canvas-id',
            title='Test Canvas',
            description='Test Description',
            owner_id=sample_user.id,
            is_public=False
        )
        session.add(canvas)
        session.commit()
        
        canvas_dict = canvas.to_dict()
        assert canvas_dict['id'] == 'test-canvas-id'
        assert canvas_dict['title'] == 'Test Canvas'
        assert canvas_dict['owner_id'] == sample_user.id

class TestCanvasObject:
    """Test CanvasObject model."""
    
    def test_create_canvas_object(self, session, sample_user, sample_canvas):
        """Test creating a canvas object."""
        canvas_object = CanvasObject(
            id='test-object-id',
            canvas_id=sample_canvas.id,
            object_type='rectangle',
            properties='{"x": 100, "y": 100, "width": 50, "height": 50}',
            created_by=sample_user.id
        )
        session.add(canvas_object)
        session.commit()
        
        assert canvas_object.id == 'test-object-id'
        assert canvas_object.object_type == 'rectangle'
        assert canvas_object.canvas_id == sample_canvas.id
    
    def test_canvas_object_properties(self, session, sample_user, sample_canvas):
        """Test canvas object properties handling."""
        canvas_object = CanvasObject(
            id='test-object-id',
            canvas_id=sample_canvas.id,
            object_type='rectangle',
            properties='{"x": 100, "y": 100}',
            created_by=sample_user.id
        )
        session.add(canvas_object)
        session.commit()
        
        # Test get_properties
        properties = canvas_object.get_properties()
        assert properties['x'] == 100
        assert properties['y'] == 100
        
        # Test set_properties
        canvas_object.set_properties({'x': 200, 'y': 200})
        assert canvas_object.properties == '{"x": 200, "y": 200}'

class TestCanvasPermission:
    """Test CanvasPermission model."""
    
    def test_create_canvas_permission(self, session, sample_user, sample_canvas):
        """Test creating a canvas permission."""
        permission = CanvasPermission(
            canvas_id=sample_canvas.id,
            user_id=sample_user.id,
            permission_type='edit',
            granted_by=sample_user.id
        )
        session.add(permission)
        session.commit()
        
        assert permission.canvas_id == sample_canvas.id
        assert permission.user_id == sample_user.id
        assert permission.permission_type == 'edit'

class TestInvitation:
    """Test Invitation model."""
    
    def test_create_invitation(self, session, sample_user, sample_canvas):
        """Test creating an invitation."""
        invitation = Invitation(
            id='test-invitation-id',
            canvas_id=sample_canvas.id,
            inviter_id=sample_user.id,
            invitee_email='invitee@example.com',
            permission_type='view'
        )
        session.add(invitation)
        session.commit()
        
        assert invitation.canvas_id == sample_canvas.id
        assert invitation.invitee_email == 'invitee@example.com'
        assert invitation.status == 'pending'
    
    def test_invitation_expiry(self, session, sample_user, sample_canvas):
        """Test invitation expiry check."""
        from datetime import datetime, timedelta
        
        # Create expired invitation
        expired_invitation = Invitation(
            id='expired-invitation-id',
            canvas_id=sample_canvas.id,
            inviter_id=sample_user.id,
            invitee_email='expired@example.com',
            permission_type='view',
            expires_at=datetime.utcnow() - timedelta(days=1)
        )
        session.add(expired_invitation)
        session.commit()
        
        assert expired_invitation.is_expired() == True
        
        # Create valid invitation
        valid_invitation = Invitation(
            id='valid-invitation-id',
            canvas_id=sample_canvas.id,
            inviter_id=sample_user.id,
            invitee_email='valid@example.com',
            permission_type='view'
        )
        session.add(valid_invitation)
        session.commit()
        
        assert valid_invitation.is_expired() == False
