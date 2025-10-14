from datetime import datetime
from app.extensions import db

class Canvas(db.Model):
    __tablename__ = 'canvases'
    
    id = db.Column(db.String(36), primary_key=True)  # UUID
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    owner_id = db.Column(db.String(128), db.ForeignKey('users.id'), nullable=False)
    is_public = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    objects = db.relationship('CanvasObject', backref='canvas', lazy='dynamic', cascade='all, delete-orphan')
    permissions = db.relationship('CanvasPermission', backref='canvas', lazy='dynamic', cascade='all, delete-orphan')
    invitations = db.relationship('Invitation', backref='canvas', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Canvas {self.title}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'owner_id': self.owner_id,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'object_count': self.objects.count(),
            'collaborator_count': self.permissions.count()
        }
