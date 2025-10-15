"""
Marshmallow validation schemas for CollabCanvas API
Provides structured validation for all API endpoints
"""

from marshmallow import Schema, fields, validate, validates_schema, ValidationError
from app.utils.validators import InputValidator, SanitizationService


class BaseSchema(Schema):
    """Base schema with common validation methods."""
    
    def handle_error(self, error, data, **kwargs):
        """Custom error handling for validation errors."""
        raise ValidationError(error.messages)


class CollaborationInviteSchema(BaseSchema):
    """Schema for collaboration invitation requests."""
    
    canvas_id = fields.Str(
        required=True,
        validate=[
            validate.Length(min=1, max=255),
            validate.Regexp(r'^[a-zA-Z0-9\-_]+$', error='Canvas ID must contain only alphanumeric characters, hyphens, and underscores')
        ],
        error_messages={'required': 'Canvas ID is required'}
    )
    
    invitee_email = fields.Email(
        required=True,
        validate=validate.Length(max=255),
        error_messages={'required': 'Invitee email is required', 'invalid': 'Invalid email format'}
    )
    
    permission_type = fields.Str(
        required=True,
        validate=validate.OneOf(['view', 'edit'], error='Permission type must be either "view" or "edit"'),
        error_messages={'required': 'Permission type is required'}
    )
    
    invitation_message = fields.Str(
        validate=validate.Length(max=1000),
        allow_none=True
    )
    
    @validates_schema
    def validate_invitation_message(self, data, **kwargs):
        """Validate and sanitize invitation message."""
        if 'invitation_message' in data and data['invitation_message']:
            data['invitation_message'] = SanitizationService.sanitize_text(
                data['invitation_message'], 
                max_length=1000
            )


class PresenceUpdateSchema(BaseSchema):
    """Schema for presence update requests."""
    
    canvas_id = fields.Str(
        required=True,
        validate=[
            validate.Length(min=1, max=255),
            validate.Regexp(r'^[a-zA-Z0-9\-_]+$', error='Canvas ID must contain only alphanumeric characters, hyphens, and underscores')
        ],
        error_messages={'required': 'Canvas ID is required'}
    )
    
    status = fields.Str(
        required=True,
        validate=validate.OneOf(['online', 'away', 'busy', 'offline'], error='Status must be one of: online, away, busy, offline'),
        error_messages={'required': 'Status is required'}
    )
    
    activity = fields.Str(
        validate=validate.OneOf(['viewing', 'editing', 'drawing', 'idle'], error='Activity must be one of: viewing, editing, drawing, idle'),
        allow_none=True
    )
    
    timestamp = fields.Float(
        validate=validate.Range(min=0),
        allow_none=True
    )


class CanvasObjectPropertiesSchema(BaseSchema):
    """Schema for canvas object properties validation."""
    
    # Common properties
    x = fields.Float(
        validate=validate.Range(min=-10000, max=10000),
        allow_none=True
    )
    
    y = fields.Float(
        validate=validate.Range(min=-10000, max=10000),
        allow_none=True
    )
    
    fill = fields.Str(
        validate=validate.Regexp(r'^(#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{3}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|red|green|blue|black|white|yellow|orange|purple|pink|brown|gray|grey|transparent)$'),
        allow_none=True
    )
    
    stroke = fields.Str(
        validate=validate.Regexp(r'^(#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{3}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|red|green|blue|black|white|yellow|orange|purple|pink|brown|gray|grey|transparent)$'),
        allow_none=True
    )
    
    strokeWidth = fields.Float(
        validate=validate.Range(min=1, max=20),
        allow_none=True
    )
    
    # Rectangle/Shape properties
    width = fields.Float(
        validate=validate.Range(min=1, max=10000),
        allow_none=True
    )
    
    height = fields.Float(
        validate=validate.Range(min=1, max=10000),
        allow_none=True
    )
    
    # Circle properties
    radius = fields.Float(
        validate=validate.Range(min=1, max=10000),
        allow_none=True
    )
    
    # Text properties
    text = fields.Str(
        validate=validate.Length(max=5000),
        allow_none=True
    )
    
    fontSize = fields.Float(
        validate=validate.Range(min=8, max=72),
        allow_none=True
    )
    
    fontFamily = fields.Str(
        validate=validate.OneOf(['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia']),
        allow_none=True
    )
    
    # Line/Arrow properties
    points = fields.List(
        fields.Float(validate=validate.Range(min=-10000, max=10000)),
        validate=validate.Length(equal=4),
        allow_none=True
    )
    
    @validates_schema
    def validate_text_content(self, data, **kwargs):
        """Validate and sanitize text content."""
        if 'text' in data and data['text']:
            data['text'] = SanitizationService.sanitize_text(
                data['text'], 
                max_length=5000
            )


class CanvasObjectSchema(BaseSchema):
    """Schema for canvas object creation and updates."""
    
    canvas_id = fields.Str(
        required=True,
        validate=[
            validate.Length(min=1, max=255),
            validate.Regexp(r'^[a-zA-Z0-9\-_]+$', error='Canvas ID must contain only alphanumeric characters, hyphens, and underscores')
        ],
        error_messages={'required': 'Canvas ID is required'}
    )
    
    object_type = fields.Str(
        required=True,
        validate=validate.OneOf(
            ['rectangle', 'circle', 'text', 'heart', 'star', 'diamond', 'line', 'arrow'],
            error='Object type must be one of: rectangle, circle, text, heart, star, diamond, line, arrow'
        ),
        error_messages={'required': 'Object type is required'}
    )
    
    properties = fields.Nested(
        CanvasObjectPropertiesSchema,
        required=True,
        error_messages={'required': 'Properties are required'}
    )
    
    @validates_schema
    def validate_object_properties(self, data, **kwargs):
        """Validate object properties based on object type."""
        if 'object_type' in data and 'properties' in data:
            object_type = data['object_type']
            properties = data['properties']
            
            # Validate required properties for each object type
            if object_type in ['rectangle', 'heart', 'star', 'diamond']:
                if not properties.get('width') or not properties.get('height'):
                    raise ValidationError(f'{object_type} objects require width and height properties')
            
            elif object_type == 'circle':
                if not properties.get('radius'):
                    raise ValidationError('Circle objects require radius property')
            
            elif object_type == 'text':
                if not properties.get('text'):
                    raise ValidationError('Text objects require text property')
            
            elif object_type in ['line', 'arrow']:
                if not properties.get('points') or len(properties.get('points', [])) != 4:
                    raise ValidationError('Line and arrow objects require points property with 4 values')


class CanvasCreateSchema(BaseSchema):
    """Schema for canvas creation requests."""
    
    title = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=255),
        error_messages={'required': 'Title is required'}
    )
    
    description = fields.Str(
        validate=validate.Length(max=2000),
        allow_none=True
    )
    
    is_public = fields.Bool(
        allow_none=True
    )
    
    @validates_schema
    def validate_content(self, data, **kwargs):
        """Validate and sanitize canvas content."""
        if 'title' in data and data['title']:
            data['title'] = SanitizationService.sanitize_text(
                data['title'], 
                max_length=255
            )
        
        if 'description' in data and data['description']:
            data['description'] = SanitizationService.sanitize_text(
                data['description'], 
                max_length=2000
            )


class CanvasUpdateSchema(BaseSchema):
    """Schema for canvas update requests."""
    
    title = fields.Str(
        validate=validate.Length(min=1, max=255),
        allow_none=True
    )
    
    description = fields.Str(
        validate=validate.Length(max=2000),
        allow_none=True
    )
    
    is_public = fields.Bool(
        allow_none=True
    )
    
    @validates_schema
    def validate_content(self, data, **kwargs):
        """Validate and sanitize canvas content."""
        if 'title' in data and data['title']:
            data['title'] = SanitizationService.sanitize_text(
                data['title'], 
                max_length=255
            )
        
        if 'description' in data and data['description']:
            data['description'] = SanitizationService.sanitize_text(
                data['description'], 
                max_length=2000
            )


class UserRegistrationSchema(BaseSchema):
    """Schema for user registration requests."""
    
    email = fields.Email(
        required=True,
        validate=validate.Length(max=255),
        error_messages={'required': 'Email is required', 'invalid': 'Invalid email format'}
    )
    
    name = fields.Str(
        validate=validate.Length(max=255),
        allow_none=True
    )
    
    display_name = fields.Str(
        validate=validate.Length(max=255),
        allow_none=True
    )
    
    avatar_url = fields.Str(
        validate=validate.Length(max=500),
        allow_none=True
    )
    
    @validates_schema
    def validate_user_data(self, data, **kwargs):
        """Validate and sanitize user data."""
        if 'name' in data and data['name']:
            data['name'] = SanitizationService.sanitize_text(
                data['name'], 
                max_length=255
            )
        
        if 'display_name' in data and data['display_name']:
            data['display_name'] = SanitizationService.sanitize_text(
                data['display_name'], 
                max_length=255
            )
        
        if 'avatar_url' in data and data['avatar_url']:
            data['avatar_url'] = SanitizationService.sanitize_url(data['avatar_url'])


class SocketEventSchema(BaseSchema):
    """Base schema for Socket.IO event validation."""
    
    canvas_id = fields.Str(
        required=True,
        validate=[
            validate.Length(min=1, max=255),
            validate.Regexp(r'^[a-zA-Z0-9\-_]+$', error='Canvas ID must contain only alphanumeric characters, hyphens, and underscores')
        ],
        error_messages={'required': 'Canvas ID is required'}
    )
    
    id_token = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=2000),
        error_messages={'required': 'ID token is required'}
    )


class ObjectUpdateEventSchema(SocketEventSchema):
    """Schema for object update socket events."""
    
    object_id = fields.Str(
        required=True,
        validate=[
            validate.Length(min=1, max=255),
            validate.Regexp(r'^[a-zA-Z0-9\-_]+$', error='Object ID must contain only alphanumeric characters, hyphens, and underscores')
        ],
        error_messages={'required': 'Object ID is required'}
    )
    
    properties = fields.Nested(
        CanvasObjectPropertiesSchema,
        required=True,
        error_messages={'required': 'Properties are required'}
    )


class CursorMoveEventSchema(SocketEventSchema):
    """Schema for cursor move socket events."""
    
    position = fields.Dict(
        required=True,
        validate=validate.Length(min=2, max=2),
        error_messages={'required': 'Position is required'}
    )
    
    timestamp = fields.Float(
        validate=validate.Range(min=0),
        allow_none=True
    )
    
    @validates_schema
    def validate_position(self, data, **kwargs):
        """Validate cursor position coordinates."""
        if 'position' in data:
            position = data['position']
            if 'x' not in position or 'y' not in position:
                raise ValidationError('Position must contain x and y coordinates')
            
            try:
                x = float(position['x'])
                y = float(position['y'])
                
                if x < -10000 or x > 10000:
                    raise ValidationError('X coordinate must be between -10000 and 10000')
                
                if y < -10000 or y > 10000:
                    raise ValidationError('Y coordinate must be between -10000 and 10000')
                
                data['position'] = {'x': x, 'y': y}
            except (ValueError, TypeError):
                raise ValidationError('Position coordinates must be valid numbers')


class PresenceEventSchema(SocketEventSchema):
    """Schema for presence socket events."""
    
    status = fields.Str(
        validate=validate.OneOf(['online', 'away', 'busy', 'offline']),
        allow_none=True
    )
    
    activity = fields.Str(
        validate=validate.OneOf(['viewing', 'editing', 'drawing', 'idle']),
        allow_none=True
    )
    
    timestamp = fields.Float(
        validate=validate.Range(min=0),
        allow_none=True
    )
