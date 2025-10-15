"""
Input validation utilities for CollabCanvas API
Provides comprehensive validation for all user inputs to prevent security vulnerabilities
"""

import re
import bleach
from typing import Any, Dict, List, Optional, Union
from marshmallow import ValidationError
from email_validator import validate_email, EmailNotValidError


class ValidationError(Exception):
    """Custom validation error for input validation failures."""
    pass


class InputValidator:
    """Comprehensive input validation utility class."""
    
    # Validation patterns
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    UUID_PATTERN = re.compile(r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$')
    ALPHANUMERIC_PATTERN = re.compile(r'^[a-zA-Z0-9\-_]+$')
    HEX_COLOR_PATTERN = re.compile(r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
    
    # Length limits
    MAX_EMAIL_LENGTH = 255
    MAX_TITLE_LENGTH = 255
    MAX_DESCRIPTION_LENGTH = 2000
    MAX_MESSAGE_LENGTH = 1000
    MAX_TEXT_CONTENT_LENGTH = 5000
    MAX_CANVAS_ID_LENGTH = 255
    MAX_USER_ID_LENGTH = 255
    
    # Numeric bounds
    MIN_COORDINATE = -10000
    MAX_COORDINATE = 10000
    MIN_SIZE = 1
    MAX_SIZE = 10000
    MIN_FONT_SIZE = 8
    MAX_FONT_SIZE = 72
    MIN_STROKE_WIDTH = 1
    MAX_STROKE_WIDTH = 20
    
    # Allowed values
    ALLOWED_OBJECT_TYPES = ['rectangle', 'circle', 'text', 'heart', 'star', 'diamond', 'line', 'arrow']
    ALLOWED_PERMISSION_TYPES = ['view', 'edit']
    ALLOWED_PRESENCE_STATUS = ['online', 'away', 'busy', 'offline']
    ALLOWED_ACTIVITIES = ['viewing', 'editing', 'drawing', 'idle']
    ALLOWED_FONT_FAMILIES = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia']
    
    @staticmethod
    def validate_email_address(email: str) -> str:
        """
        Validate email address format and length.
        
        Args:
            email: Email address to validate
            
        Returns:
            Validated email address
            
        Raises:
            ValidationError: If email is invalid
        """
        if not email or not isinstance(email, str):
            raise ValidationError("Email is required and must be a string")
        
        if len(email) > InputValidator.MAX_EMAIL_LENGTH:
            raise ValidationError(f"Email must be no more than {InputValidator.MAX_EMAIL_LENGTH} characters")
        
        try:
            # Use email-validator for comprehensive validation
            validated_email = validate_email(email)
            return validated_email.email
        except EmailNotValidError as e:
            raise ValidationError(f"Invalid email format: {str(e)}")
    
    @staticmethod
    def validate_string_length(value: str, field_name: str, max_length: int, min_length: int = 1) -> str:
        """
        Validate string length constraints.
        
        Args:
            value: String to validate
            field_name: Name of the field for error messages
            max_length: Maximum allowed length
            min_length: Minimum allowed length
            
        Returns:
            Validated string
            
        Raises:
            ValidationError: If string length is invalid
        """
        if not isinstance(value, str):
            raise ValidationError(f"{field_name} must be a string")
        
        if len(value) < min_length:
            raise ValidationError(f"{field_name} must be at least {min_length} characters")
        
        if len(value) > max_length:
            raise ValidationError(f"{field_name} must be no more than {max_length} characters")
        
        return value
    
    @staticmethod
    def validate_canvas_id(canvas_id: str) -> str:
        """
        Validate canvas ID format and length.
        
        Args:
            canvas_id: Canvas ID to validate
            
        Returns:
            Validated canvas ID
            
        Raises:
            ValidationError: If canvas ID is invalid
        """
        if not canvas_id or not isinstance(canvas_id, str):
            raise ValidationError("Canvas ID is required and must be a string")
        
        if len(canvas_id) > InputValidator.MAX_CANVAS_ID_LENGTH:
            raise ValidationError(f"Canvas ID must be no more than {InputValidator.MAX_CANVAS_ID_LENGTH} characters")
        
        if not InputValidator.ALPHANUMERIC_PATTERN.match(canvas_id):
            raise ValidationError("Canvas ID must contain only alphanumeric characters, hyphens, and underscores")
        
        return canvas_id
    
    @staticmethod
    def validate_user_id(user_id: str) -> str:
        """
        Validate user ID format and length.
        
        Args:
            user_id: User ID to validate
            
        Returns:
            Validated user ID
            
        Raises:
            ValidationError: If user ID is invalid
        """
        if not user_id or not isinstance(user_id, str):
            raise ValidationError("User ID is required and must be a string")
        
        if len(user_id) > InputValidator.MAX_USER_ID_LENGTH:
            raise ValidationError(f"User ID must be no more than {InputValidator.MAX_USER_ID_LENGTH} characters")
        
        return user_id
    
    @staticmethod
    def validate_enum_value(value: str, field_name: str, allowed_values: List[str]) -> str:
        """
        Validate enum-like string values.
        
        Args:
            value: Value to validate
            field_name: Name of the field for error messages
            allowed_values: List of allowed values
            
        Returns:
            Validated value
            
        Raises:
            ValidationError: If value is not in allowed list
        """
        if not isinstance(value, str):
            raise ValidationError(f"{field_name} must be a string")
        
        if value not in allowed_values:
            raise ValidationError(f"{field_name} must be one of: {', '.join(allowed_values)}")
        
        return value
    
    @staticmethod
    def validate_numeric_range(value: Union[int, float], field_name: str, min_val: float, max_val: float) -> Union[int, float]:
        """
        Validate numeric values within a range.
        
        Args:
            value: Numeric value to validate
            field_name: Name of the field for error messages
            min_val: Minimum allowed value
            max_val: Maximum allowed value
            
        Returns:
            Validated numeric value
            
        Raises:
            ValidationError: If value is outside range
        """
        if not isinstance(value, (int, float)):
            raise ValidationError(f"{field_name} must be a number")
        
        if value < min_val or value > max_val:
            raise ValidationError(f"{field_name} must be between {min_val} and {max_val}")
        
        return value
    
    @staticmethod
    def validate_coordinate(value: Union[int, float], field_name: str) -> Union[int, float]:
        """
        Validate coordinate values.
        
        Args:
            value: Coordinate value to validate
            field_name: Name of the field for error messages
            
        Returns:
            Validated coordinate value
            
        Raises:
            ValidationError: If coordinate is invalid
        """
        return InputValidator.validate_numeric_range(
            value, field_name, 
            InputValidator.MIN_COORDINATE, 
            InputValidator.MAX_COORDINATE
        )
    
    @staticmethod
    def validate_size(value: Union[int, float], field_name: str) -> Union[int, float]:
        """
        Validate size values.
        
        Args:
            value: Size value to validate
            field_name: Name of the field for error messages
            
        Returns:
            Validated size value
            
        Raises:
            ValidationError: If size is invalid
        """
        return InputValidator.validate_numeric_range(
            value, field_name, 
            InputValidator.MIN_SIZE, 
            InputValidator.MAX_SIZE
        )
    
    @staticmethod
    def validate_color(color: str) -> str:
        """
        Validate color values (hex, rgb, rgba).
        
        Args:
            color: Color value to validate
            
        Returns:
            Validated color value
            
        Raises:
            ValidationError: If color is invalid
        """
        if not color or not isinstance(color, str):
            raise ValidationError("Color must be a string")
        
        # Check for hex color
        if color.startswith('#') and InputValidator.HEX_COLOR_PATTERN.match(color):
            return color
        
        # Check for rgb/rgba
        rgb_pattern = re.compile(r'^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$')
        if rgb_pattern.match(color):
            return color
        
        # Check for named colors
        named_colors = [
            'red', 'green', 'blue', 'black', 'white', 'yellow', 'orange', 'purple',
            'pink', 'brown', 'gray', 'grey', 'transparent'
        ]
        if color.lower() in named_colors:
            return color
        
        raise ValidationError("Color must be a valid hex color (#RRGGBB), rgb/rgba value, or named color")
    
    @staticmethod
    def validate_object_properties(properties: Dict[str, Any], object_type: str) -> Dict[str, Any]:
        """
        Validate object properties based on object type.
        
        Args:
            properties: Object properties to validate
            object_type: Type of object being validated
            
        Returns:
            Validated properties dictionary
            
        Raises:
            ValidationError: If properties are invalid
        """
        if not isinstance(properties, dict):
            raise ValidationError("Properties must be a dictionary")
        
        validated_props = {}
        
        # Common properties for all objects
        if 'x' in properties:
            validated_props['x'] = InputValidator.validate_coordinate(properties['x'], 'x coordinate')
        
        if 'y' in properties:
            validated_props['y'] = InputValidator.validate_coordinate(properties['y'], 'y coordinate')
        
        if 'fill' in properties:
            validated_props['fill'] = InputValidator.validate_color(properties['fill'])
        
        if 'stroke' in properties:
            validated_props['stroke'] = InputValidator.validate_color(properties['stroke'])
        
        if 'strokeWidth' in properties:
            validated_props['strokeWidth'] = InputValidator.validate_numeric_range(
                properties['strokeWidth'], 'stroke width',
                InputValidator.MIN_STROKE_WIDTH, InputValidator.MAX_STROKE_WIDTH
            )
        
        # Object-specific properties
        if object_type in ['rectangle', 'heart', 'star', 'diamond']:
            if 'width' in properties:
                validated_props['width'] = InputValidator.validate_size(properties['width'], 'width')
            if 'height' in properties:
                validated_props['height'] = InputValidator.validate_size(properties['height'], 'height')
        
        elif object_type == 'circle':
            if 'radius' in properties:
                validated_props['radius'] = InputValidator.validate_size(properties['radius'], 'radius')
        
        elif object_type == 'text':
            if 'text' in properties:
                validated_props['text'] = InputValidator.validate_string_length(
                    properties['text'], 'text content', InputValidator.MAX_TEXT_CONTENT_LENGTH, 0
                )
            if 'fontSize' in properties:
                validated_props['fontSize'] = InputValidator.validate_numeric_range(
                    properties['fontSize'], 'font size',
                    InputValidator.MIN_FONT_SIZE, InputValidator.MAX_FONT_SIZE
                )
            if 'fontFamily' in properties:
                validated_props['fontFamily'] = InputValidator.validate_enum_value(
                    properties['fontFamily'], 'font family', InputValidator.ALLOWED_FONT_FAMILIES
                )
        
        elif object_type in ['line', 'arrow']:
            if 'points' in properties:
                points = properties['points']
                if not isinstance(points, list) or len(points) != 4:
                    raise ValidationError("Points must be an array of 4 numbers [x1, y1, x2, y2]")
                validated_props['points'] = [
                    InputValidator.validate_coordinate(points[0], 'point x1'),
                    InputValidator.validate_coordinate(points[1], 'point y1'),
                    InputValidator.validate_coordinate(points[2], 'point x2'),
                    InputValidator.validate_coordinate(points[3], 'point y2')
                ]
        
        return validated_props


class SanitizationService:
    """Service for sanitizing user input to prevent XSS and other attacks."""
    
    # HTML tags allowed in sanitized content
    ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'br', 'p']
    ALLOWED_ATTRIBUTES = {}
    
    @staticmethod
    def sanitize_html(content: str) -> str:
        """
        Sanitize HTML content by removing dangerous tags and attributes.
        
        Args:
            content: HTML content to sanitize
            
        Returns:
            Sanitized HTML content
        """
        if not content or not isinstance(content, str):
            return ""
        
        return bleach.clean(
            content, 
            tags=SanitizationService.ALLOWED_TAGS,
            attributes=SanitizationService.ALLOWED_ATTRIBUTES,
            strip=True
        )
    
    @staticmethod
    def sanitize_text(content: str, max_length: int = 1000) -> str:
        """
        Sanitize text content by removing HTML and limiting length.
        
        Args:
            content: Text content to sanitize
            max_length: Maximum allowed length
            
        Returns:
            Sanitized text content
        """
        if not content or not isinstance(content, str):
            return ""
        
        # Remove all HTML tags
        clean_text = bleach.clean(content, tags=[], attributes=[], strip=True)
        
        # Limit length
        if len(clean_text) > max_length:
            clean_text = clean_text[:max_length]
        
        return clean_text.strip()
    
    @staticmethod
    def sanitize_url(url: str) -> str:
        """
        Sanitize URL to prevent malicious redirects.
        
        Args:
            url: URL to sanitize
            
        Returns:
            Sanitized URL or empty string if invalid
        """
        if not url or not isinstance(url, str):
            return ""
        
        # Basic URL validation
        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        
        if url_pattern.match(url):
            return url
        
        return ""


def validate_request_data(data: Dict[str, Any], required_fields: List[str], validator_func: callable = None) -> Dict[str, Any]:
    """
    Validate request data with required fields and optional custom validation.
    
    Args:
        data: Request data to validate
        required_fields: List of required field names
        validator_func: Optional custom validation function
        
    Returns:
        Validated data dictionary
        
    Raises:
        ValidationError: If validation fails
    """
    if not isinstance(data, dict):
        raise ValidationError("Request data must be a dictionary")
    
    # Check required fields
    missing_fields = [field for field in required_fields if field not in data or data[field] is None]
    if missing_fields:
        raise ValidationError(f"Missing required fields: {', '.join(missing_fields)}")
    
    # Apply custom validation if provided
    if validator_func:
        return validator_func(data)
    
    return data
