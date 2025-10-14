from app.models import Canvas, CanvasObject, CanvasPermission
from app.extensions import db

class CanvasService:
    """Canvas service for managing canvas operations."""
    
    def create_canvas(self, title: str, description: str, owner_id: str, is_public: bool = False) -> Canvas:
        """Create a new canvas."""
        canvas = Canvas(
            title=title,
            description=description,
            owner_id=owner_id,
            is_public=is_public
        )
        
        db.session.add(canvas)
        db.session.commit()
        return canvas
    
    def get_canvas_by_id(self, canvas_id: str) -> Canvas:
        """Get canvas by ID."""
        canvas = Canvas.query.filter_by(id=canvas_id).first()
        if not canvas:
            raise Exception("Canvas not found")
        return canvas
    
    def get_user_canvases(self, user_id: str) -> list:
        """Get all canvases accessible to a user."""
        # Get owned canvases
        owned_canvases = Canvas.query.filter_by(owner_id=user_id).all()
        
        # Get shared canvases
        shared_permissions = CanvasPermission.query.filter_by(user_id=user_id).all()
        shared_canvases = [permission.canvas for permission in shared_permissions]
        
        # Get public canvases
        public_canvases = Canvas.query.filter_by(is_public=True).all()
        
        # Combine and deduplicate
        all_canvases = list(set(owned_canvases + shared_canvases + public_canvases))
        
        # Add object count and collaborator count
        for canvas in all_canvases:
            canvas.object_count = len(canvas.objects)
            canvas.collaborator_count = len(canvas.permissions)
        
        return all_canvases
    
    def update_canvas(self, canvas_id: str, update_data: dict) -> Canvas:
        """Update canvas data."""
        canvas = self.get_canvas_by_id(canvas_id)
        
        for key, value in update_data.items():
            if hasattr(canvas, key):
                setattr(canvas, key, value)
        
        db.session.commit()
        return canvas
    
    def delete_canvas(self, canvas_id: str) -> bool:
        """Delete a canvas."""
        canvas = self.get_canvas_by_id(canvas_id)
        
        # Delete all objects
        for obj in canvas.objects:
            db.session.delete(obj)
        
        # Delete all permissions
        for permission in canvas.permissions:
            db.session.delete(permission)
        
        # Delete the canvas
        db.session.delete(canvas)
        db.session.commit()
        return True
    
    def check_canvas_access(self, user_id: str, canvas_id: str) -> bool:
        """Check if user has access to canvas."""
        canvas = Canvas.query.filter_by(id=canvas_id).first()
        if not canvas:
            return False
        
        # Owner has access
        if canvas.owner_id == user_id:
            return True
        
        # Public canvases are accessible to everyone
        if canvas.is_public:
            return True
        
        # Check if user has permission
        permission = CanvasPermission.query.filter_by(
            user_id=user_id, 
            canvas_id=canvas_id
        ).first()
        return permission is not None
    
    def check_canvas_edit_permission(self, user_id: str, canvas_id: str) -> bool:
        """Check if user can edit canvas."""
        canvas = Canvas.query.filter_by(id=canvas_id).first()
        if not canvas:
            return False
        
        # Owner can edit
        if canvas.owner_id == user_id:
            return True
        
        # Check if user has edit permission
        permission = CanvasPermission.query.filter_by(
            user_id=user_id, 
            canvas_id=canvas_id
        ).first()
        return permission and permission.permission_type == 'edit'