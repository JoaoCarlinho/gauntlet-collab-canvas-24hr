import pytest
import os
from app import create_app
from app.config import TestingConfig
from app.extensions import db

@pytest.fixture(scope='session')
def app():
    """Create application for testing."""
    os.environ['FLASK_ENV'] = 'testing'
    app = create_app(TestingConfig)
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture(scope='function')
def client(app):
    """Create test client."""
    return app.test_client()

@pytest.fixture(scope='function')
def runner(app):
    """Create test CLI runner."""
    return app.test_cli_runner()

@pytest.fixture(scope='function')
def session(app):
    """Create database session for testing."""
    with app.app_context():
        connection = db.engine.connect()
        transaction = connection.begin()
        options = dict(bind=connection, binds={})
        session = db.create_scoped_session(options=options)
        db.session = session
        yield session
        transaction.rollback()
        connection.close()
        session.remove()

@pytest.fixture
def sample_user():
    """Create a sample user for testing."""
    from app.models import User
    user = User(
        id='test-user-id',
        email='test@example.com',
        name='Test User'
    )
    return user

@pytest.fixture
def sample_canvas(sample_user):
    """Create a sample canvas for testing."""
    from app.models import Canvas
    canvas = Canvas(
        id='test-canvas-id',
        title='Test Canvas',
        description='Test Description',
        owner_id=sample_user.id,
        is_public=False
    )
    return canvas
