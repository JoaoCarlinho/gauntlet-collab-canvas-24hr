import json
import redis
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from app.models import User
from app.extensions import get_redis_connection
import logging

logger = logging.getLogger(__name__)

class PresenceService:
    """Service for managing user presence and activity tracking."""
    
    def __init__(self):
        self.redis_client = get_redis_connection()
        self.presence_ttl = 60  # 60 seconds
        self.activity_ttl = 300  # 5 minutes
    
    def update_user_presence(self, user_id: str, canvas_id: str, status: str = 'online', activity: str = 'viewing') -> bool:
        """Update user presence information."""
        try:
            if not self.redis_client:
                logger.warning("Redis not available, skipping presence update")
                return False
            
            # Get user information
            user = User.query.filter_by(id=user_id).first()
            if not user:
                return False
            
            # Create presence data
            presence_data = {
                'user_id': user_id,
                'user_name': user.display_name or user.email,
                'user_email': user.email,
                'avatar_url': user.avatar_url,
                'canvas_id': canvas_id,
                'status': status,
                'activity': activity,
                'last_seen': datetime.utcnow().isoformat(),
                'timestamp': datetime.utcnow().timestamp()
            }
            
            # Store presence data
            presence_key = f"presence:{canvas_id}:{user_id}"
            self.redis_client.setex(
                presence_key, 
                self.presence_ttl, 
                json.dumps(presence_data)
            )
            
            # Store activity data separately for longer tracking
            activity_key = f"activity:{canvas_id}:{user_id}"
            self.redis_client.setex(
                activity_key,
                self.activity_ttl,
                json.dumps({
                    'activity': activity,
                    'timestamp': datetime.utcnow().timestamp()
                })
            )
            
            logger.debug(f"Updated presence for user {user_id} on canvas {canvas_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update user presence: {str(e)}")
            return False
    
    def get_canvas_presence(self, canvas_id: str) -> List[Dict]:
        """Get all active users for a canvas."""
        try:
            if not self.redis_client:
                return []
            
            # Get all presence keys for this canvas
            presence_keys = self.redis_client.keys(f"presence:{canvas_id}:*")
            active_users = []
            
            for key in presence_keys:
                try:
                    presence_data = self.redis_client.get(key)
                    if presence_data:
                        user_data = json.loads(presence_data)
                        # Check if presence is still valid
                        last_seen = datetime.fromisoformat(user_data['last_seen'])
                        if datetime.utcnow() - last_seen < timedelta(seconds=self.presence_ttl):
                            active_users.append(user_data)
                except (json.JSONDecodeError, KeyError, ValueError) as e:
                    logger.warning(f"Invalid presence data for key {key}: {str(e)}")
                    continue
            
            # Sort by last seen (most recent first)
            active_users.sort(key=lambda x: x['timestamp'], reverse=True)
            return active_users
            
        except Exception as e:
            logger.error(f"Failed to get canvas presence: {str(e)}")
            return []
    
    def get_user_activity(self, user_id: str, canvas_id: str) -> Optional[Dict]:
        """Get user's current activity."""
        try:
            if not self.redis_client:
                return None
            
            activity_key = f"activity:{canvas_id}:{user_id}"
            activity_data = self.redis_client.get(activity_key)
            
            if activity_data:
                return json.loads(activity_data)
            return None
            
        except Exception as e:
            logger.error(f"Failed to get user activity: {str(e)}")
            return None
    
    def remove_user_presence(self, user_id: str, canvas_id: str) -> bool:
        """Remove user presence from canvas."""
        try:
            if not self.redis_client:
                return False
            
            # Remove presence and activity data
            presence_key = f"presence:{canvas_id}:{user_id}"
            activity_key = f"activity:{canvas_id}:{user_id}"
            
            self.redis_client.delete(presence_key)
            self.redis_client.delete(activity_key)
            
            logger.debug(f"Removed presence for user {user_id} from canvas {canvas_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to remove user presence: {str(e)}")
            return False
    
    def cleanup_expired_presence(self, canvas_id: str) -> int:
        """Clean up expired presence data for a canvas."""
        try:
            if not self.redis_client:
                return 0
            
            presence_keys = self.redis_client.keys(f"presence:{canvas_id}:*")
            cleaned_count = 0
            
            for key in presence_keys:
                try:
                    presence_data = self.redis_client.get(key)
                    if presence_data:
                        user_data = json.loads(presence_data)
                        last_seen = datetime.fromisoformat(user_data['last_seen'])
                        
                        # If presence is expired, remove it
                        if datetime.utcnow() - last_seen >= timedelta(seconds=self.presence_ttl):
                            self.redis_client.delete(key)
                            # Also remove corresponding activity
                            user_id = user_data['user_id']
                            activity_key = f"activity:{canvas_id}:{user_id}"
                            self.redis_client.delete(activity_key)
                            cleaned_count += 1
                except (json.JSONDecodeError, KeyError, ValueError):
                    # Remove invalid data
                    self.redis_client.delete(key)
                    cleaned_count += 1
            
            if cleaned_count > 0:
                logger.info(f"Cleaned up {cleaned_count} expired presence records for canvas {canvas_id}")
            
            return cleaned_count
            
        except Exception as e:
            logger.error(f"Failed to cleanup expired presence: {str(e)}")
            return 0
    
    def get_presence_stats(self, canvas_id: str) -> Dict:
        """Get presence statistics for a canvas."""
        try:
            active_users = self.get_canvas_presence(canvas_id)
            
            stats = {
                'total_active': len(active_users),
                'by_status': {},
                'by_activity': {},
                'last_updated': datetime.utcnow().isoformat()
            }
            
            # Count by status and activity
            for user in active_users:
                status = user.get('status', 'unknown')
                activity = user.get('activity', 'unknown')
                
                stats['by_status'][status] = stats['by_status'].get(status, 0) + 1
                stats['by_activity'][activity] = stats['by_activity'].get(activity, 0) + 1
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get presence stats: {str(e)}")
            return {
                'total_active': 0,
                'by_status': {},
                'by_activity': {},
                'last_updated': datetime.utcnow().isoformat()
            }
