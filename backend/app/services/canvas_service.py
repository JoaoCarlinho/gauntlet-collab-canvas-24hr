import uuid
from datetime import datetime
from app.models import Canvas, CanvasObject, CanvasPermission, User
from app.extensions import db

class CanvasService:
    """Canvas related business logic."""
    
    def create_canvas(self, title, description, owner_id, is_public=False):
        """Create a new canvas."""
        canvas = Canvas(
            id=str(uuid.uuid4()),
            title=title,
            description=description,
            owner_id=owner_id,
            is_public=is_public
        )
        
        db.session.add(canvas)
        db.session.commit()
        
        return canvas
    
    def get_canvas_by_id(self, canvas_id):
        """Get canvas by ID."""
        return Canvas.query.filter_by(id=canvas_id).first()
    
    def get_user_canvases(self, user_id):
        """Get all canvases accessible to a user."""
        # Get owned canvases
        owned_canvases = Canvas.query.filter_by(owner_id=user_id).all()
        
        # Get canvases with permissions
        permission_canvases = Canvas.query.join(CanvasPermission).filter(
            CanvasPermission.user_id == user_id
        ).all()
        
        # Get public canvases
        public_canvases = Canvas.query.filter_by(is_public=True).all()
        
        # Combine and deduplicate
        all_canvases = list(set(owned_canvases + permission_canvases + public_canvases))
        
        return all_canvases
    
    def update_canvas(self, canvas_id, **kwargs):
        """Update canvas properties."""
        canvas = self.get_canvas_by_id(canvas_id)
        if not canvas:
            return None
        
        for key, value in kwargs.items():
            if hasattr(canvas, key):
                setattr(canvas, key, value)
        
        canvas.updated_at = datetime.utcnow()
        db.session.commit()
        
        return canvas
    
    def delete_canvas(self, canvas_id):
        """Delete a canvas."""
        canvas = self.get_canvas_by_id(canvas_id)
        if not canvas:
            return False
        
        db.session.delete(canvas)
        db.session.commit()
        
        return True
    
    def check_canvas_permission(self, canvas_id, user_id, permission_type='view'):
        """Check if user has permission on canvas."""
        canvas = self.get_canvas_by_id(canvas_id)
        if not canvas:
            return False
        
        # Owner has all permissions
        if canvas.owner_id == user_id:
            return True
        
        # Check if canvas is public (view permission only)
        if canvas.is_public and permission_type == 'view':
            return True
        
        # Check explicit permissions
        permission = CanvasPermission.query.filter_by(
            canvas_id=canvas_id,
            user_id=user_id,
            permission_type=permission_type
        ).first()
        
        return permission is not None
    
    def create_canvas_object(self, canvas_id, object_type, properties, created_by):
        """Create a new canvas object."""
        canvas_object = CanvasObject(
            id=str(uuid.uuid4()),
            canvas_id=canvas_id,
            object_type=object_type,
            properties=properties,
            created_by=created_by
        )
        
        db.session.add(canvas_object)
        db.session.commit()
        
        return canvas_object
    
    def get_canvas_objects(self, canvas_id):
        """Get all objects for a canvas."""
        return CanvasObject.query.filter_by(canvas_id=canvas_id).all()
    
    def update_canvas_object(self, object_id, **kwargs):
        """Update canvas object properties."""
        canvas_object = CanvasObject.query.filter_by(id=object_id).first()
        if not canvas_object:
            return None
        
        for key, value in kwargs.items():
            if hasattr(canvas_object, key):
                setattr(canvas_object, key, value)
        
        canvas_object.updated_at = datetime.utcnow()
        db.session.commit()
        
        return canvas_object
    
    def delete_canvas_object(self, object_id):
        """Delete a canvas object."""
        canvas_object = CanvasObject.query.filter_by(id=object_id).first()
        if not canvas_object:
            return False
        
        db.session.delete(canvas_object)
        db.session.commit()
        
        return True
