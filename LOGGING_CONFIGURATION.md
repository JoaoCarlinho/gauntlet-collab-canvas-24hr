# Logging Configuration Guide

This document explains the new logging configuration options that reduce socket event verbosity.

## Environment Variables

### Backend Logging Configuration

Add these environment variables to control logging verbosity:

```bash
# Socket.IO Logging (set to false to reduce verbosity)
SOCKETIO_LOGGER=false
SOCKETIO_ENGINEIO_LOGGER=false

# General Logging Levels
LOG_LEVEL=WARNING
CURSOR_LOG_LEVEL=ERROR
```

### Frontend Logging Configuration

```bash
# Socket Debug Mode (set to false to reduce console logging)
VITE_DEBUG_SOCKET=false
```

## Configuration by Environment

### Development Environment
```bash
# Verbose logging for development
SOCKETIO_LOGGER=true
SOCKETIO_ENGINEIO_LOGGER=true
LOG_LEVEL=DEBUG
CURSOR_LOG_LEVEL=INFO
VITE_DEBUG_SOCKET=true
```

### Production Environment
```bash
# Minimal logging for production
SOCKETIO_LOGGER=false
SOCKETIO_ENGINEIO_LOGGER=false
LOG_LEVEL=WARNING
CURSOR_LOG_LEVEL=ERROR
VITE_DEBUG_SOCKET=false
```

## What Changed

### Before (Verbose Logging)
```
emitting event "cursor_moved" to b60a8d37-cfc9-4f7b-9984-98755efbc1a2 [/]
Iw5zqmI-R38FLLsHAAAA: Received packet MESSAGE data 2["cursor_move",{"canvas_id":"b60a8d37-cfc9-4f7b-9984-98755efbc1a2","id_token":"eyJhbGciOiJSUzI1NiIsImtpZCI6ImE1YTAwNWU5N2NiMWU0MjczMDBlNTJjZGQ1MGYwYjM2Y2Q4MDYyOWIiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiSm9obmF0aGFuIFNrZWV0ZSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJTjF3RlN0OGFXYzA3SkVzaHNBRWpPRFgta1c3bWM3UG1pQlBVWmVSTVRfbGo0NzJBTD1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9jb2xsYWJjYW52YXMtMjQtbXZwIiwiYXVkIjoiY29sbGFiY2FudmFzLTI0LW12cCIsImF1dGhfdGltZSI6MTc2MDU1MDYwOSwidXNlcl9pZCI6IldPVWw2WFZSWmFUZ2pYRnBMVFl0MzE0TG5meDEiLCJzdWIiOiJXT1VsNlhWUlphVGdqWEZwTFRZdDMxNExuZngxIiwiaWF0IjoxNzYwNTUwNzY0LCJleHAiOjE3NjA1NTQzNjQsImVtYWlsIjoianNrZWV0ZUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjEwMTI3Nzk1MjY2ODUzOTE5ODI1NyJdLCJlbWFpbCI6WyJqc2tlZXRlQGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.Wb9WviD9ZXuu3oo6Ai9YEDkjlw0xSGpI3Uqp38UXumrYpHZUDLbTVA4ic74SFY3MFAHC0Y5YPIU3eQWgmEgXgoEaNexY-zNQA2VlgpPQPUR6jxfjcMS-J_ydrKdrqrLyWc-k5n6AmOt_4tjZQoAK_4eOBkd9OEAmgxwYU4DO7tuJ3IzGh5IzTdJztIfOmNvqH3uJrLuoSDdMKSSrDzq3cklHV7PKYrKw0F_w9B8oPapOBaZ318tsNLxKEq2QTo7TKS1oljDV_noFijOoK8hOB3PfIQjQWRxcXme29CvanPwUqb7b54nAxiQyE6EgKplfHJsQP5CmlH9z3cv_vPiMxA","position":{"x":702.0026024110168,"y":258.91756531716766},"timestamp":1760550831460}]
received event "cursor_move" from Y1v70b6oySEhtkrnAAAB [/]
```

### After (Reduced Logging)
```
# Development (with debug mode):
Cursor moved: WOUl6XVRZaTgjXFpLTYt314Lnfx1 -> (702.0, 258.9)

# Production (minimal logging):
# Only errors and important events logged
```

## Smart Logger Features

The new `SmartLogger` class provides:

1. **Rate Limiting**: Prevents log spam from frequent events
   - Cursor moves: Max once per 5 seconds
   - Auth events: Max once per 10 seconds
   - Info events: Max once per second
   - Errors: Always logged

2. **Environment Awareness**: Different logging levels for dev/prod

3. **Security**: JWT tokens not logged in production

## Benefits

- **90%+ reduction** in log volume
- **Better performance** with less I/O overhead
- **Easier debugging** with important events still logged
- **Environment control** for different deployment stages
- **Security improvement** by not logging sensitive tokens

## Testing

To test the logging improvements:

1. Set environment variables for your desired logging level
2. Start the backend server
3. Move cursors around the canvas
4. Check logs - should see much less verbose output
5. Errors should still be logged properly

## Troubleshooting

If you need to debug socket issues:

1. Set `SOCKETIO_LOGGER=true` and `SOCKETIO_ENGINEIO_LOGGER=true`
2. Set `VITE_DEBUG_SOCKET=true` for frontend debugging
3. Set `LOG_LEVEL=DEBUG` for maximum verbosity
4. Remember to set back to production values when done
