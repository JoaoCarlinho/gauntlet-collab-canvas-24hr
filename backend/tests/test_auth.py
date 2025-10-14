import pytest
from app.services.auth_service import AuthService

class TestAuthService:
    """Test authentication service."""
    
    def test_verify_token_mock(self):
        """Test token verification with mock."""
        auth_service = AuthService()
        
        # Test valid token
        decoded_token = auth_service.verify_token('valid-token')
        assert decoded_token['uid'] == 'test-user-id'
        assert decoded_token['email'] == 'test@example.com'
        assert decoded_token['name'] == 'Test User'
        
        # Test invalid token
        with pytest.raises(Exception):
            auth_service.verify_token('invalid-token')
    
    def test_register_user(self, session):
        """Test user registration."""
        auth_service = AuthService()
        
        # Mock the verify_token method
        auth_service.verify_token = lambda token: {
            'uid': 'new-user-id',
            'email': 'newuser@example.com',
            'name': 'New User'
        }
        
        user = auth_service.register_user('valid-token')
        
        assert user.id == 'new-user-id'
        assert user.email == 'newuser@example.com'
        assert user.name == 'New User'
        
        # Test registering existing user
        existing_user = auth_service.register_user('valid-token')
        assert existing_user.id == 'new-user-id'
    
    def test_get_user_by_id(self, session, sample_user):
        """Test getting user by ID."""
        session.add(sample_user)
        session.commit()
        
        auth_service = AuthService()
        user = auth_service.get_user_by_id('test-user-id')
        
        assert user is not None
        assert user.id == 'test-user-id'
        assert user.email == 'test@example.com'
    
    def test_get_user_by_email(self, session, sample_user):
        """Test getting user by email."""
        session.add(sample_user)
        session.commit()
        
        auth_service = AuthService()
        user = auth_service.get_user_by_email('test@example.com')
        
        assert user is not None
        assert user.email == 'test@example.com'
        assert user.id == 'test-user-id'
