"""
Firebase Cloud Functions entry point for CollabCanvas API
"""
import os
import sys
from flask import Flask
from flask_cors import CORS
from functions_framework import http

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.config import ProductionConfig

# Create Flask app
app = create_app(ProductionConfig)

# Configure CORS for Firebase Hosting
CORS(app, origins=[
    "https://collabcanvas-24-mvp.web.app",
    "https://collabcanvas-24-mvp.firebaseapp.com",
    "https://gauntlet-collab-canvas-24hr.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173"
])

@http
def app(request):
    """Cloud Function entry point"""
    return app(request.environ, lambda *args: None)
