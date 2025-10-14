import pytest
from app.services.canvas_service import CanvasService
from app.models import User, Canvas, CanvasObject

class TestCanvasService:
    """Test canvas service."""
    
    def test_create_canvas(self, session, sample_user):
        """Test creating a canvas."""
        canvas_service = CanvasService()
        
        canvas = canvas_service.create_canvas(
            title='Test Canvas',
            description='Test Description',
            owner_id=sample_user.id,
            is_public=False
        )
        
        assert canvas.title == 'Test Canvas'
        assert canvas.owner_id == sample_user.id
        assert canvas.is_public == False
    
    def test_get_canvas_by_id(self, session, sample_user, sample_canvas):
        """Test getting canvas by ID."""
        session.add(sample_canvas)
        session.commit()
        
        canvas_service = CanvasService()
        canvas = canvas_service.get_canvas_by_id('test-canvas-id')
        
        assert canvas is not None
        assert canvas.id == 'test-canvas-id'
        assert canvas.title == 'Test Canvas'
    
    def test_get_user_canvases(self, session, sample_user, sample_canvas):
        """Test getting user canvases."""
        session.add(sample_canvas)
        session.commit()
        
        canvas_service = CanvasService()
        canvases = canvas_service.get_user_canvases(sample_user.id)
        
        assert len(canvases) == 1
        assert canvases[0].id == 'test-canvas-id'
    
    def test_update_canvas(self, session, sample_user, sample_canvas):
        """Test updating a canvas."""
        session.add(sample_canvas)
        session.commit()
        
        canvas_service = CanvasService()
        updated_canvas = canvas_service.update_canvas(
            'test-canvas-id',
            title='Updated Title',
            description='Updated Description'
        )
        
        assert updated_canvas.title == 'Updated Title'
        assert updated_canvas.description == 'Updated Description'
    
    def test_delete_canvas(self, session, sample_user, sample_canvas):
        """Test deleting a canvas."""
        session.add(sample_canvas)
        session.commit()
        
        canvas_service = CanvasService()
        success = canvas_service.delete_canvas('test-canvas-id')
        
        assert success == True
        
        # Verify canvas is deleted
        canvas = canvas_service.get_canvas_by_id('test-canvas-id')
        assert canvas is None
    
    def test_check_canvas_permission(self, session, sample_user, sample_canvas):
        """Test canvas permission checking."""
        session.add(sample_canvas)
        session.commit()
        
        canvas_service = CanvasService()
        
        # Test owner permission
        assert canvas_service.check_canvas_permission('test-canvas-id', sample_user.id) == True
        assert canvas_service.check_canvas_permission('test-canvas-id', sample_user.id, 'edit') == True
        
        # Test non-owner permission
        assert canvas_service.check_canvas_permission('test-canvas-id', 'other-user-id') == False
    
    def test_create_canvas_object(self, session, sample_user, sample_canvas):
        """Test creating a canvas object."""
        session.add(sample_canvas)
        session.commit()
        
        canvas_service = CanvasService()
        canvas_object = canvas_service.create_canvas_object(
            canvas_id='test-canvas-id',
            object_type='rectangle',
            properties='{"x": 100, "y": 100}',
            created_by=sample_user.id
        )
        
        assert canvas_object.object_type == 'rectangle'
        assert canvas_object.canvas_id == 'test-canvas-id'
        assert canvas_object.created_by == sample_user.id
    
    def test_get_canvas_objects(self, session, sample_user, sample_canvas):
        """Test getting canvas objects."""
        session.add(sample_canvas)
        
        # Create test objects
        obj1 = CanvasObject(
            id='obj1',
            canvas_id='test-canvas-id',
            object_type='rectangle',
            properties='{"x": 100}',
            created_by=sample_user.id
        )
        obj2 = CanvasObject(
            id='obj2',
            canvas_id='test-canvas-id',
            object_type='circle',
            properties='{"x": 200}',
            created_by=sample_user.id
        )
        session.add_all([obj1, obj2])
        session.commit()
        
        canvas_service = CanvasService()
        objects = canvas_service.get_canvas_objects('test-canvas-id')
        
        assert len(objects) == 2
        assert objects[0].object_type in ['rectangle', 'circle']
        assert objects[1].object_type in ['rectangle', 'circle']
    
    def test_update_canvas_object(self, session, sample_user, sample_canvas):
        """Test updating a canvas object."""
        session.add(sample_canvas)
        
        obj = CanvasObject(
            id='test-obj',
            canvas_id='test-canvas-id',
            object_type='rectangle',
            properties='{"x": 100}',
            created_by=sample_user.id
        )
        session.add(obj)
        session.commit()
        
        canvas_service = CanvasService()
        updated_obj = canvas_service.update_canvas_object(
            'test-obj',
            properties='{"x": 200, "y": 200}'
        )
        
        assert updated_obj.properties == '{"x": 200, "y": 200}'
    
    def test_delete_canvas_object(self, session, sample_user, sample_canvas):
        """Test deleting a canvas object."""
        session.add(sample_canvas)
        
        obj = CanvasObject(
            id='test-obj',
            canvas_id='test-canvas-id',
            object_type='rectangle',
            properties='{"x": 100}',
            created_by=sample_user.id
        )
        session.add(obj)
        session.commit()
        
        canvas_service = CanvasService()
        success = canvas_service.delete_canvas_object('test-obj')
        
        assert success == True
        
        # Verify object is deleted
        objects = canvas_service.get_canvas_objects('test-canvas-id')
        assert len(objects) == 0
