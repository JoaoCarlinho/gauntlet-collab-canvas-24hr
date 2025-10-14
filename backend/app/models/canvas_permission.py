from datetime import datetime
from app.extensions import db

class CanvasPermission(db.Model):
    __tablename__ = 'canvas_permissions'
    
    id = db.Column(db.Integer, primary_key=True)
    canvas_id = db.Column(db.String(36), db.ForeignKey('canvases.id'), nullable=False)
    user_id = db.Column(db.String(128), db.ForeignKey('users.id'), nullable=False)
    permission_type = db.Column(db.String(20), nullable=False)  # 'view', 'edit'
    granted_at = db.Column(db.DateTime, default=datetime.utcnow)
    granted_by = db.Column(db.String(128), db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    granter = db.relationship('User', backref='granted_permissions', foreign_keys=[granted_by])
    
    # Unique constraint
    __table_args__ = (db.UniqueConstraint('canvas_id', 'user_id', name='_canvas_user_uc'),)
    
    def __repr__(self):
        return f'<CanvasPermission {self.permission_type} for user {self.user_id} on canvas {self.canvas_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'canvas_id': self.canvas_id,
            'user_id': self.user_id,
            'permission_type': self.permission_type,
            'granted_at': self.granted_at.isoformat() if self.granted_at else None,
            'granted_by': self.granted_by
        }
