from .canvas_events import register_canvas_handlers
from .cursor_events import register_cursor_handlers
from .presence_events import register_presence_handlers

def register_socket_handlers(socketio):
    """Register all Socket.IO event handlers."""
    register_canvas_handlers(socketio)
    register_cursor_handlers(socketio)
    register_presence_handlers(socketio)
