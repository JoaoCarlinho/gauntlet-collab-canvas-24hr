"""
Firestore service for CollabCanvas data operations
"""
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

class FirestoreService:
    def __init__(self):
        # Initialize Firestore client
        if os.environ.get('FUNCTIONS_EMULATOR'):
            # Running in local emulator
            self.db = firestore.Client(project='collabcanvas-24-mvp')
        else:
            # Running in production
            self.db = firestore.Client()
    
    # User operations
    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user in Firestore"""
        user_ref = self.db.collection('users').document(user_data['id'])
        user_data['created_at'] = datetime.utcnow()
        user_data['updated_at'] = datetime.utcnow()
        user_ref.set(user_data)
        return user_data
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        user_ref = self.db.collection('users').document(user_id)
        user_doc = user_ref.get()
        if user_doc.exists:
            return user_doc.to_dict()
        return None
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        users_ref = self.db.collection('users')
        query = users_ref.where(filter=FieldFilter('email', '==', email))
        docs = query.stream()
        for doc in docs:
            return doc.to_dict()
        return None
    
    def update_user(self, user_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update user data"""
        user_ref = self.db.collection('users').document(user_id)
        update_data['updated_at'] = datetime.utcnow()
        user_ref.update(update_data)
        return self.get_user_by_id(user_id)
    
    # Canvas operations
    def create_canvas(self, canvas_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new canvas"""
        canvas_ref = self.db.collection('canvases').document()
        canvas_data['id'] = canvas_ref.id
        canvas_data['created_at'] = datetime.utcnow()
        canvas_data['updated_at'] = datetime.utcnow()
        canvas_ref.set(canvas_data)
        return canvas_data
    
    def get_canvas_by_id(self, canvas_id: str) -> Optional[Dict[str, Any]]:
        """Get canvas by ID"""
        canvas_ref = self.db.collection('canvases').document(canvas_id)
        canvas_doc = canvas_ref.get()
        if canvas_doc.exists:
            return canvas_doc.to_dict()
        return None
    
    def get_user_canvases(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all canvases accessible to a user"""
        canvases = []
        
        # Get owned canvases
        owned_query = self.db.collection('canvases').where(filter=FieldFilter('owner_id', '==', user_id))
        for doc in owned_query.stream():
            canvas_data = doc.to_dict()
            canvas_data['id'] = doc.id
            canvases.append(canvas_data)
        
        # Get shared canvases
        shared_query = self.db.collection('canvas_permissions').where(filter=FieldFilter('user_id', '==', user_id))
        for doc in shared_query.stream():
            permission = doc.to_dict()
            canvas = self.get_canvas_by_id(permission['canvas_id'])
            if canvas:
                canvas['id'] = permission['canvas_id']
                canvases.append(canvas)
        
        # Get public canvases
        public_query = self.db.collection('canvases').where(filter=FieldFilter('is_public', '==', True))
        for doc in public_query.stream():
            canvas_data = doc.to_dict()
            canvas_data['id'] = doc.id
            # Avoid duplicates
            if not any(c['id'] == canvas_data['id'] for c in canvases):
                canvases.append(canvas_data)
        
        return canvases
    
    def update_canvas(self, canvas_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update canvas data"""
        canvas_ref = self.db.collection('canvases').document(canvas_id)
        update_data['updated_at'] = datetime.utcnow()
        canvas_ref.update(update_data)
        return self.get_canvas_by_id(canvas_id)
    
    def delete_canvas(self, canvas_id: str) -> bool:
        """Delete a canvas"""
        canvas_ref = self.db.collection('canvases').document(canvas_id)
        canvas_ref.delete()
        return True
    
    # Canvas object operations
    def create_canvas_object(self, object_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new canvas object"""
        object_ref = self.db.collection('canvas_objects').document()
        object_data['id'] = object_ref.id
        object_data['created_at'] = datetime.utcnow()
        object_data['updated_at'] = datetime.utcnow()
        object_ref.set(object_data)
        return object_data
    
    def get_canvas_objects(self, canvas_id: str) -> List[Dict[str, Any]]:
        """Get all objects for a canvas"""
        objects = []
        objects_query = self.db.collection('canvas_objects').where(filter=FieldFilter('canvas_id', '==', canvas_id))
        for doc in objects_query.stream():
            object_data = doc.to_dict()
            object_data['id'] = doc.id
            objects.append(object_data)
        return objects
    
    def update_canvas_object(self, object_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update canvas object"""
        object_ref = self.db.collection('canvas_objects').document(object_id)
        update_data['updated_at'] = datetime.utcnow()
        object_ref.update(update_data)
        return self.get_canvas_object_by_id(object_id)
    
    def get_canvas_object_by_id(self, object_id: str) -> Optional[Dict[str, Any]]:
        """Get canvas object by ID"""
        object_ref = self.db.collection('canvas_objects').document(object_id)
        object_doc = object_ref.get()
        if object_doc.exists:
            return object_doc.to_dict()
        return None
    
    def delete_canvas_object(self, object_id: str) -> bool:
        """Delete a canvas object"""
        object_ref = self.db.collection('canvas_objects').document(object_id)
        object_ref.delete()
        return True
    
    # Canvas permission operations
    def create_canvas_permission(self, permission_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create canvas permission"""
        permission_ref = self.db.collection('canvas_permissions').document()
        permission_data['id'] = permission_ref.id
        permission_data['created_at'] = datetime.utcnow()
        permission_data['updated_at'] = datetime.utcnow()
        permission_ref.set(permission_data)
        return permission_data
    
    def get_canvas_permissions(self, canvas_id: str) -> List[Dict[str, Any]]:
        """Get all permissions for a canvas"""
        permissions = []
        permissions_query = self.db.collection('canvas_permissions').where(filter=FieldFilter('canvas_id', '==', canvas_id))
        for doc in permissions_query.stream():
            permission_data = doc.to_dict()
            permission_data['id'] = doc.id
            permissions.append(permission_data)
        return permissions
    
    def get_user_canvas_permission(self, user_id: str, canvas_id: str) -> Optional[Dict[str, Any]]:
        """Get user's permission for a specific canvas"""
        permissions_query = self.db.collection('canvas_permissions').where(
            filter=FieldFilter('user_id', '==', user_id)
        ).where(filter=FieldFilter('canvas_id', '==', canvas_id))
        
        for doc in permissions_query.stream():
            permission_data = doc.to_dict()
            permission_data['id'] = doc.id
            return permission_data
        return None
    
    # Invitation operations
    def create_invitation(self, invitation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create an invitation"""
        invitation_ref = self.db.collection('invitations').document()
        invitation_data['id'] = invitation_ref.id
        invitation_data['created_at'] = datetime.utcnow()
        invitation_data['updated_at'] = datetime.utcnow()
        invitation_ref.set(invitation_data)
        return invitation_data
    
    def get_user_invitations(self, user_email: str) -> List[Dict[str, Any]]:
        """Get all invitations for a user"""
        invitations = []
        invitations_query = self.db.collection('invitations').where(filter=FieldFilter('invitee_email', '==', user_email))
        for doc in invitations_query.stream():
            invitation_data = doc.to_dict()
            invitation_data['id'] = doc.id
            invitations.append(invitation_data)
        return invitations
    
    def update_invitation(self, invitation_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update invitation status"""
        invitation_ref = self.db.collection('invitations').document(invitation_id)
        update_data['updated_at'] = datetime.utcnow()
        invitation_ref.update(update_data)
        return self.get_invitation_by_id(invitation_id)
    
    def get_invitation_by_id(self, invitation_id: str) -> Optional[Dict[str, Any]]:
        """Get invitation by ID"""
        invitation_ref = self.db.collection('invitations').document(invitation_id)
        invitation_doc = invitation_ref.get()
        if invitation_doc.exists:
            return invitation_doc.to_dict()
        return None
