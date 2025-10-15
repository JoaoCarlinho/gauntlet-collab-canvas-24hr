import logging
import time
from typing import Dict, Any

class SmartLogger:
    def __init__(self, name: str, level: str = 'INFO'):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, level.upper()))
        
        # Rate limiting for frequent events
        self.last_log_times: Dict[str, float] = {}
        self.log_intervals = {
            'cursor_move': 5.0,  # Log cursor moves max once per 5 seconds
            'auth': 10.0,        # Log auth max once per 10 seconds
            'error': 0.0,        # Always log errors
            'info': 1.0          # Log info max once per second
        }
    
    def should_log(self, event_type: str) -> bool:
        """Check if we should log this event based on rate limiting."""
        now = time.time()
        last_log = self.last_log_times.get(event_type, 0)
        interval = self.log_intervals.get(event_type, 1.0)
        
        if now - last_log >= interval:
            self.last_log_times[event_type] = now
            return True
        return False
    
    def log_cursor_move(self, user_id: str, position: Dict[str, float]):
        """Log cursor movement with rate limiting."""
        if self.should_log('cursor_move'):
            self.logger.info(f"Cursor moved: {user_id} -> ({position['x']:.1f}, {position['y']:.1f})")
    
    def log_auth(self, user_id: str, action: str):
        """Log authentication events with rate limiting."""
        if self.should_log('auth'):
            self.logger.info(f"Auth: {action} for user {user_id}")
    
    def log_error(self, message: str, error: Exception = None):
        """Always log errors."""
        if error:
            self.logger.error(f"Error: {message} - {str(error)}")
        else:
            self.logger.error(f"Error: {message}")
    
    def log_info(self, message: str):
        """Log info with rate limiting."""
        if self.should_log('info'):
            self.logger.info(message)
