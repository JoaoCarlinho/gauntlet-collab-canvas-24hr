from datetime import datetime
from app.extensions import db
import json

class CanvasObject(db.Model):
    __tablename__ = 'canvas_objects'
    
    id = db.Column(db.String(36), primary_key=True)  # UUID
    canvas_id = db.Column(db.String(36), db.ForeignKey('canvases.id'), nullable=False)
    object_type = db.Column(db.String(50), nullable=False)  # 'rectangle', 'circle', 'text'
    properties = db.Column(db.Text, nullable=False)  # JSON string
    created_by = db.Column(db.String(128), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', backref='created_objects')
    
    def __repr__(self):
        return f'<CanvasObject {self.object_type} on canvas {self.canvas_id}>'
    
    def get_properties(self):
        """Get properties as a dictionary."""
        try:
            return json.loads(self.properties)
        except (json.JSONDecodeError, TypeError):
            return {}
    
    def set_properties(self, properties_dict):
        """Set properties from a dictionary."""
        self.properties = json.dumps(properties_dict)
    
    def to_dict(self):
        return {
            'id': self.id,
            'canvas_id': self.canvas_id,
            'object_type': self.object_type,
            'properties': self.get_properties(),
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
