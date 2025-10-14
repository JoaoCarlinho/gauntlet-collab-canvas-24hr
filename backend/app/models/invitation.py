from datetime import datetime, timedelta
from app.extensions import db

class Invitation(db.Model):
    __tablename__ = 'invitations'
    
    id = db.Column(db.String(36), primary_key=True)  # UUID
    canvas_id = db.Column(db.String(36), db.ForeignKey('canvases.id'), nullable=False)
    inviter_id = db.Column(db.String(128), db.ForeignKey('users.id'), nullable=False)
    invitee_email = db.Column(db.String(255), nullable=False)
    permission_type = db.Column(db.String(20), nullable=False)  # 'view', 'edit'
    status = db.Column(db.String(20), default='pending')  # 'pending', 'accepted', 'declined', 'expired'
    expires_at = db.Column(db.DateTime, default=lambda: datetime.utcnow() + timedelta(days=7))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Invitation {self.invitee_email} to canvas {self.canvas_id}>'
    
    def is_expired(self):
        """Check if the invitation has expired."""
        return datetime.utcnow() > self.expires_at
    
    def to_dict(self):
        return {
            'id': self.id,
            'canvas_id': self.canvas_id,
            'inviter_id': self.inviter_id,
            'invitee_email': self.invitee_email,
            'permission_type': self.permission_type,
            'status': self.status,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_expired': self.is_expired()
        }
