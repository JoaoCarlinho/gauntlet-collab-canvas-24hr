"""
Sanitization service for CollabCanvas API
Provides comprehensive content sanitization to prevent XSS and other security vulnerabilities
"""

import re
import bleach
from typing import Optional, Dict, Any
from urllib.parse import urlparse


class SanitizationService:
    """Service for sanitizing user input to prevent security vulnerabilities."""
    
    # HTML tags allowed in sanitized content (very restrictive)
    ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'br']
    ALLOWED_ATTRIBUTES = {}
    
    # Maximum content lengths
    MAX_TITLE_LENGTH = 255
    MAX_DESCRIPTION_LENGTH = 2000
    MAX_MESSAGE_LENGTH = 1000
    MAX_TEXT_CONTENT_LENGTH = 5000
    MAX_URL_LENGTH = 500
    
    # URL validation patterns
    ALLOWED_SCHEMES = ['http', 'https']
    BLOCKED_DOMAINS = [
        'localhost', '127.0.0.1', '0.0.0.0',  # Local addresses
        'file://', 'ftp://', 'javascript:', 'data:',  # Dangerous schemes
    ]
    
    @staticmethod
    def sanitize_html(content: str, max_length: Optional[int] = None) -> str:
        """
        Sanitize HTML content by removing dangerous tags and attributes.
        
        Args:
            content: HTML content to sanitize
            max_length: Optional maximum length limit
            
        Returns:
            Sanitized HTML content
        """
        if not content or not isinstance(content, str):
            return ""
        
        # Remove all HTML tags and attributes (very restrictive)
        sanitized = bleach.clean(
            content, 
            tags=SanitizationService.ALLOWED_TAGS,
            attributes=SanitizationService.ALLOWED_ATTRIBUTES,
            strip=True,
            strip_comments=True
        )
        
        # Apply length limit if specified
        if max_length and len(sanitized) > max_length:
            sanitized = sanitized[:max_length]
        
        return sanitized.strip()
    
    @staticmethod
    def sanitize_text(content: str, max_length: int = 1000, preserve_line_breaks: bool = False) -> str:
        """
        Sanitize text content by removing HTML and limiting length.
        
        Args:
            content: Text content to sanitize
            max_length: Maximum allowed length
            preserve_line_breaks: Whether to preserve line breaks
            
        Returns:
            Sanitized text content
        """
        if not content or not isinstance(content, str):
            return ""
        
        # Remove all HTML tags and attributes
        clean_text = bleach.clean(content, tags=[], attributes=[], strip=True)
        
        # Handle line breaks if requested
        if preserve_line_breaks:
            # Convert HTML line breaks to newlines
            clean_text = re.sub(r'<br\s*/?>', '\n', clean_text, flags=re.IGNORECASE)
        
        # Remove any remaining HTML entities
        clean_text = bleach.clean(clean_text, tags=[], attributes=[], strip=True)
        
        # Remove control characters except newlines and tabs
        clean_text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', clean_text)
        
        # Limit length
        if len(clean_text) > max_length:
            clean_text = clean_text[:max_length]
        
        return clean_text.strip()
    
    @staticmethod
    def sanitize_url(url: str) -> str:
        """
        Sanitize URL to prevent malicious redirects and XSS.
        
        Args:
            url: URL to sanitize
            
        Returns:
            Sanitized URL or empty string if invalid
        """
        if not url or not isinstance(url, str):
            return ""
        
        # Remove whitespace
        url = url.strip()
        
        # Check length
        if len(url) > SanitizationService.MAX_URL_LENGTH:
            return ""
        
        try:
            # Parse URL
            parsed = urlparse(url)
            
            # Check scheme
            if parsed.scheme not in SanitizationService.ALLOWED_SCHEMES:
                return ""
            
            # Check for blocked domains/patterns
            for blocked in SanitizationService.BLOCKED_DOMAINS:
                if blocked in url.lower():
                    return ""
            
            # Validate hostname
            if not parsed.hostname:
                return ""
            
            # Check for suspicious patterns
            suspicious_patterns = [
                r'javascript:', r'data:', r'vbscript:', r'file:',
                r'<script', r'</script>', r'onload=', r'onerror=',
                r'onclick=', r'onmouseover='
            ]
            
            for pattern in suspicious_patterns:
                if re.search(pattern, url, re.IGNORECASE):
                    return ""
            
            # Reconstruct URL to ensure it's clean
            clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
            if parsed.query:
                clean_url += f"?{parsed.query}"
            if parsed.fragment:
                clean_url += f"#{parsed.fragment}"
            
            return clean_url
            
        except Exception:
            return ""
    
    @staticmethod
    def sanitize_canvas_title(title: str) -> str:
        """
        Sanitize canvas title with appropriate length limits.
        
        Args:
            title: Canvas title to sanitize
            
        Returns:
            Sanitized canvas title
        """
        return SanitizationService.sanitize_text(
            title, 
            max_length=SanitizationService.MAX_TITLE_LENGTH
        )
    
    @staticmethod
    def sanitize_canvas_description(description: str) -> str:
        """
        Sanitize canvas description with appropriate length limits.
        
        Args:
            description: Canvas description to sanitize
            
        Returns:
            Sanitized canvas description
        """
        return SanitizationService.sanitize_text(
            description, 
            max_length=SanitizationService.MAX_DESCRIPTION_LENGTH,
            preserve_line_breaks=True
        )
    
    @staticmethod
    def sanitize_invitation_message(message: str) -> str:
        """
        Sanitize invitation message with appropriate length limits.
        
        Args:
            message: Invitation message to sanitize
            
        Returns:
            Sanitized invitation message
        """
        return SanitizationService.sanitize_text(
            message, 
            max_length=SanitizationService.MAX_MESSAGE_LENGTH,
            preserve_line_breaks=True
        )
    
    @staticmethod
    def sanitize_text_content(text: str) -> str:
        """
        Sanitize text content for canvas objects.
        
        Args:
            text: Text content to sanitize
            
        Returns:
            Sanitized text content
        """
        return SanitizationService.sanitize_text(
            text, 
            max_length=SanitizationService.MAX_TEXT_CONTENT_LENGTH,
            preserve_line_breaks=True
        )
    
    @staticmethod
    def sanitize_user_name(name: str) -> str:
        """
        Sanitize user name/display name.
        
        Args:
            name: User name to sanitize
            
        Returns:
            Sanitized user name
        """
        return SanitizationService.sanitize_text(
            name, 
            max_length=255
        )
    
    @staticmethod
    def sanitize_avatar_url(url: str) -> str:
        """
        Sanitize avatar URL.
        
        Args:
            url: Avatar URL to sanitize
            
        Returns:
            Sanitized avatar URL
        """
        return SanitizationService.sanitize_url(url)
    
    @staticmethod
    def sanitize_object_properties(properties: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize object properties dictionary.
        
        Args:
            properties: Object properties to sanitize
            
        Returns:
            Sanitized object properties
        """
        if not isinstance(properties, dict):
            return {}
        
        sanitized_props = {}
        
        for key, value in properties.items():
            if isinstance(value, str):
                # Sanitize string values based on key
                if key == 'text':
                    sanitized_props[key] = SanitizationService.sanitize_text_content(value)
                elif key in ['fill', 'stroke']:
                    # Color values - basic validation
                    sanitized_props[key] = SanitizationService.sanitize_text(value, max_length=50)
                elif key == 'fontFamily':
                    # Font family - restrict to safe values
                    sanitized_props[key] = SanitizationService.sanitize_text(value, max_length=50)
                else:
                    # Generic string sanitization
                    sanitized_props[key] = SanitizationService.sanitize_text(value, max_length=100)
            else:
                # Non-string values pass through (numbers, booleans, etc.)
                sanitized_props[key] = value
        
        return sanitized_props
    
    @staticmethod
    def sanitize_socket_event_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize Socket.IO event data.
        
        Args:
            data: Socket event data to sanitize
            
        Returns:
            Sanitized socket event data
        """
        if not isinstance(data, dict):
            return {}
        
        sanitized_data = {}
        
        for key, value in data.items():
            if isinstance(value, str):
                # Sanitize string values
                if key in ['canvas_id', 'object_id', 'user_id']:
                    # IDs - basic sanitization
                    sanitized_data[key] = SanitizationService.sanitize_text(value, max_length=255)
                elif key == 'id_token':
                    # Token - no sanitization needed, just length check
                    sanitized_data[key] = value[:2000] if len(value) > 2000 else value
                elif key == 'activity':
                    # Activity description
                    sanitized_data[key] = SanitizationService.sanitize_text(value, max_length=100)
                else:
                    # Generic string sanitization
                    sanitized_data[key] = SanitizationService.sanitize_text(value, max_length=500)
            elif isinstance(value, dict):
                # Recursively sanitize nested dictionaries
                sanitized_data[key] = SanitizationService.sanitize_socket_event_data(value)
            else:
                # Non-string values pass through
                sanitized_data[key] = value
        
        return sanitized_data
    
    @staticmethod
    def validate_and_sanitize_email(email: str) -> Optional[str]:
        """
        Validate and sanitize email address.
        
        Args:
            email: Email address to validate and sanitize
            
        Returns:
            Sanitized email address or None if invalid
        """
        if not email or not isinstance(email, str):
            return None
        
        # Basic sanitization
        clean_email = email.strip().lower()
        
        # Basic email format validation
        email_pattern = re.compile(
            r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        )
        
        if not email_pattern.match(clean_email):
            return None
        
        # Length check
        if len(clean_email) > 255:
            return None
        
        return clean_email
    
    @staticmethod
    def is_safe_content(content: str) -> bool:
        """
        Check if content is safe (no malicious patterns).
        
        Args:
            content: Content to check
            
        Returns:
            True if content is safe, False otherwise
        """
        if not content or not isinstance(content, str):
            return True
        
        # Check for suspicious patterns
        suspicious_patterns = [
            r'<script[^>]*>.*?</script>',  # Script tags
            r'javascript:',  # JavaScript URLs
            r'vbscript:',  # VBScript URLs
            r'data:text/html',  # Data URLs with HTML
            r'onload\s*=',  # Event handlers
            r'onerror\s*=',
            r'onclick\s*=',
            r'onmouseover\s*=',
            r'<iframe[^>]*>',  # Iframe tags
            r'<object[^>]*>',  # Object tags
            r'<embed[^>]*>',  # Embed tags
            r'<link[^>]*>',  # Link tags
            r'<meta[^>]*>',  # Meta tags
        ]
        
        for pattern in suspicious_patterns:
            if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                return False
        
        return True
