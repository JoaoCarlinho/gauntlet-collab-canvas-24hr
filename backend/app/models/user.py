from datetime import datetime
from app.extensions import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(128), primary_key=True)  # Firebase UID
    email = db.Column(db.String(255), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    avatar_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owned_canvases = db.relationship('Canvas', backref='owner', lazy='dynamic', foreign_keys='Canvas.owner_id')
    canvas_permissions = db.relationship('CanvasPermission', backref='user', lazy='dynamic', foreign_keys='CanvasPermission.user_id')
    sent_invitations = db.relationship('Invitation', backref='inviter', lazy='dynamic', foreign_keys='Invitation.inviter_id')
    received_invitations = db.relationship('Invitation', backref='invitee', lazy='dynamic', primaryjoin='User.email == foreign(Invitation.invitee_email)')
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
