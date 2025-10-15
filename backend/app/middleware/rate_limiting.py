"""
Rate limiting middleware for CollabCanvas API
Provides comprehensive rate limiting to prevent abuse and DoS attacks
"""

from flask import request, jsonify, g
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from functools import wraps
import redis
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class RateLimitingService:
    """Service for managing rate limiting across the application."""
    
    def __init__(self, app=None, redis_url: Optional[str] = None):
        self.app = app
        self.redis_url = redis_url
        self.limiter = None
        self.redis_client = None
        
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize rate limiting with Flask app."""
        self.app = app
        
        # Get Redis URL from config
        redis_url = self.redis_url or app.config.get('REDIS_URL', 'redis://localhost:6379/0')
        
        try:
            # Initialize Redis client
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            
            # Test Redis connection
            self.redis_client.ping()
            logger.info("Rate limiting initialized with Redis backend")
            
        except Exception as e:
            logger.warning(f"Redis not available for rate limiting: {str(e)}")
            self.redis_client = None
        
        # Initialize Flask-Limiter
        self.limiter = Limiter(
            app,
            key_func=self._get_rate_limit_key,
            storage_uri=redis_url if self.redis_client else "memory://",
            default_limits=["100 per minute"],
            headers_enabled=True,
            retry_after="delta-seconds"
        )
        
        # Register rate limit error handler
        self.limiter.error_handler = self._rate_limit_error_handler
    
    def _get_rate_limit_key(self) -> str:
        """Get rate limiting key based on user authentication."""
        # Try to get user ID from request context
        if hasattr(g, 'current_user') and g.current_user:
            return f"user:{g.current_user.id}"
        
        # Fall back to IP address
        return get_remote_address()
    
    def _rate_limit_error_handler(self, request_limit):
        """Handle rate limit exceeded errors."""
        return jsonify({
            'error': 'Rate limit exceeded',
            'message': f'Too many requests. Limit: {request_limit.limit}',
            'retry_after': request_limit.reset_at
        }), 429
    
    def get_limiter(self) -> Limiter:
        """Get the Flask-Limiter instance."""
        return self.limiter


# Global rate limiting service instance
rate_limiting_service = RateLimitingService()


def init_rate_limiting(app):
    """Initialize rate limiting for the Flask app."""
    rate_limiting_service.init_app(app)
    return rate_limiting_service


def get_rate_limiter() -> Limiter:
    """Get the rate limiter instance."""
    return rate_limiting_service.get_limiter()


# Rate limiting decorators for different endpoint types
def api_rate_limit(limit: str):
    """Decorator for API endpoint rate limiting."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            limiter = get_rate_limiter()
            return limiter.limit(limit)(f)(*args, **kwargs)
        return decorated_function
    return decorator


def socket_rate_limit(limit: str):
    """Decorator for Socket.IO event rate limiting."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # For socket events, we'll implement custom rate limiting
            # since Flask-Limiter doesn't work directly with Socket.IO
            return f(*args, **kwargs)
        return decorated_function
    return decorator


# Specific rate limiting configurations
class RateLimitConfig:
    """Configuration for different types of rate limits."""
    
    # API endpoint limits
    AUTH_LIMITS = {
        'login': '5 per minute',
        'register': '3 per minute',
        'refresh_token': '10 per minute'
    }
    
    COLLABORATION_LIMITS = {
        'invite': '5 per minute',
        'accept_invitation': '10 per minute',
        'decline_invitation': '10 per minute',
        'presence_update': '10 per minute'
    }
    
    CANVAS_LIMITS = {
        'create': '10 per minute',
        'update': '20 per minute',
        'delete': '5 per minute',
        'list': '30 per minute'
    }
    
    OBJECT_LIMITS = {
        'create': '50 per minute',
        'update': '100 per minute',
        'delete': '20 per minute',
        'list': '100 per minute'
    }
    
    # Socket.IO event limits
    SOCKET_LIMITS = {
        'cursor_move': '100 per minute',
        'object_created': '30 per minute',
        'object_updated': '50 per minute',
        'object_deleted': '20 per minute',
        'user_online': '5 per minute',
        'user_offline': '5 per minute',
        'presence_update': '10 per minute'
    }
    
    # Global limits
    GLOBAL_LIMITS = {
        'api_requests': '100 per minute',
        'socket_events': '1000 per minute',
        'file_uploads': '10 per hour'
    }


class SocketRateLimiter:
    """Custom rate limiter for Socket.IO events."""
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.redis_client = redis_client
        self.rate_limits = RateLimitConfig.SOCKET_LIMITS
    
    def is_allowed(self, user_id: str, event_type: str) -> bool:
        """
        Check if a socket event is allowed based on rate limits.
        
        Args:
            user_id: User ID making the request
            event_type: Type of socket event
            
        Returns:
            True if event is allowed, False if rate limited
        """
        if not self.redis_client:
            # If Redis is not available, allow all events
            return True
        
        if event_type not in self.rate_limits:
            # If no specific limit, use global socket limit
            limit_str = self.rate_limits.get('socket_events', '1000 per minute')
        else:
            limit_str = self.rate_limits[event_type]
        
        # Parse limit string (e.g., "100 per minute")
        try:
            limit_parts = limit_str.split(' per ')
            limit_count = int(limit_parts[0])
            limit_period = limit_parts[1]
            
            # Convert period to seconds
            period_seconds = self._period_to_seconds(limit_period)
            
            # Create rate limit key
            key = f"socket_rate_limit:{user_id}:{event_type}"
            
            # Check current count
            current_count = self.redis_client.get(key)
            if current_count is None:
                # First request in this period
                self.redis_client.setex(key, period_seconds, 1)
                return True
            
            current_count = int(current_count)
            if current_count >= limit_count:
                # Rate limit exceeded
                return False
            
            # Increment counter
            self.redis_client.incr(key)
            return True
            
        except Exception as e:
            logger.error(f"Error checking socket rate limit: {str(e)}")
            # On error, allow the request
            return True
    
    def _period_to_seconds(self, period: str) -> int:
        """Convert period string to seconds."""
        period_map = {
            'second': 1,
            'minute': 60,
            'hour': 3600,
            'day': 86400
        }
        
        # Handle plural forms
        if period.endswith('s'):
            period = period[:-1]
        
        return period_map.get(period, 60)  # Default to 1 minute


# Global socket rate limiter instance
socket_rate_limiter = SocketRateLimiter()


def init_socket_rate_limiting(redis_client: Optional[redis.Redis] = None):
    """Initialize socket rate limiting."""
    global socket_rate_limiter
    socket_rate_limiter = SocketRateLimiter(redis_client)


def check_socket_rate_limit(user_id: str, event_type: str) -> bool:
    """Check if a socket event is allowed based on rate limits."""
    return socket_rate_limiter.is_allowed(user_id, event_type)


# Rate limiting decorators for specific endpoints
def collaboration_rate_limit(endpoint: str):
    """Rate limiting decorator for collaboration endpoints."""
    limit = RateLimitConfig.COLLABORATION_LIMITS.get(endpoint, '10 per minute')
    return api_rate_limit(limit)


def canvas_rate_limit(endpoint: str):
    """Rate limiting decorator for canvas endpoints."""
    limit = RateLimitConfig.CANVAS_LIMITS.get(endpoint, '20 per minute')
    return api_rate_limit(limit)


def object_rate_limit(endpoint: str):
    """Rate limiting decorator for object endpoints."""
    limit = RateLimitConfig.OBJECT_LIMITS.get(endpoint, '50 per minute')
    return api_rate_limit(limit)


def auth_rate_limit(endpoint: str):
    """Rate limiting decorator for authentication endpoints."""
    limit = RateLimitConfig.AUTH_LIMITS.get(endpoint, '5 per minute')
    return api_rate_limit(limit)


# Utility functions for rate limiting
def get_user_rate_limit_key(user_id: str) -> str:
    """Get rate limiting key for a specific user."""
    return f"user:{user_id}"


def get_ip_rate_limit_key() -> str:
    """Get rate limiting key for the current IP address."""
    return f"ip:{get_remote_address()}"


def is_rate_limited(user_id: Optional[str] = None) -> bool:
    """
    Check if the current request is rate limited.
    
    Args:
        user_id: Optional user ID to check
        
    Returns:
        True if rate limited, False otherwise
    """
    limiter = get_rate_limiter()
    
    if user_id:
        key = get_user_rate_limit_key(user_id)
    else:
        key = get_ip_rate_limit_key()
    
    # This is a simplified check - in practice, you'd use the limiter's
    # internal methods to check if a request would be rate limited
    return False  # Placeholder implementation


def get_rate_limit_info(user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Get rate limiting information for a user or IP.
    
    Args:
        user_id: Optional user ID
        
    Returns:
        Dictionary with rate limit information
    """
    return {
        'user_id': user_id,
        'ip_address': get_remote_address(),
        'limits': RateLimitConfig.GLOBAL_LIMITS,
        'collaboration_limits': RateLimitConfig.COLLABORATION_LIMITS,
        'canvas_limits': RateLimitConfig.CANVAS_LIMITS,
        'object_limits': RateLimitConfig.OBJECT_LIMITS,
        'socket_limits': RateLimitConfig.SOCKET_LIMITS
    }
