#!/usr/bin/env python3
"""
Pixel Pusher OS - Main Flask Application
A modern web-based desktop environment built with Flask and JavaScript.
"""

import os
import time
from flask import Flask, send_from_directory, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager

from config import Config

# Initialize Flask application with custom folders
app = Flask(__name__,
            static_folder='static',
            template_folder='templates')

# Load configuration from config.py
app.config.from_object(Config)

# Initialize Flask extensions
from models import db, User

db.init_app(app)
login_manager = LoginManager(app)
login_manager.login_view = 'auth.login'


@login_manager.user_loader
def load_user(user_id):
    """Load user by ID for Flask-Login session management."""
    return User.query.get(int(user_id))


# Add explicit static file routes to handle potential routing conflicts
@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files with proper MIME types."""
    try:
        return send_from_directory(app.static_folder, filename)
    except Exception as e:
        print(f"Error serving static file {filename}: {str(e)}")
        return f"File not found: {filename}", 404


# Add a health check endpoint
@app.route('/api/health')
def health_check():
    """Simple health check endpoint."""
    return jsonify({
        'status': 'ok',
        'message': 'Pixel Pusher OS is running',
        'timestamp': time.time()
    })


# Create database tables and default users
with app.app_context():
    try:
        db.create_all()
        print("✅ Database tables created successfully")
        User.create_default_users()
    except Exception as e:
        print(f"❌ Database initialization error: {str(e)}")

# Register application blueprints
blueprints_loaded = []

# Try to load auth blueprint
try:
    from routes.auth import auth_bp

    app.register_blueprint(auth_bp)
    blueprints_loaded.append('auth')
    print("✅ Auth blueprint registered")
except ImportError as e:
    print(f"⚠️ Auth blueprint not found: {str(e)}")

# Try to load desktop blueprint
try:
    from routes.desktop import desktop_bp

    app.register_blueprint(desktop_bp)
    blueprints_loaded.append('desktop')
    print("✅ Desktop blueprint registered")
except ImportError as e:
    print(f"⚠️ Desktop blueprint not found: {str(e)}")

# Try to load API blueprint
try:
    from routes.api import api_bp

    app.register_blueprint(api_bp, url_prefix='/api')
    blueprints_loaded.append('api')
    print("✅ API blueprint registered")
except ImportError as e:
    print(f"⚠️ API blueprint not found: {str(e)}")

print(f"📦 Loaded blueprints: {', '.join(blueprints_loaded)}")

# If no blueprints loaded, create basic routes
if not blueprints_loaded:
    print("⚠️ No blueprints found, creating basic routes...")


    @app.route('/')
    def index():
        return '''
        <h1>🎨 Pixel Pusher OS</h1>
        <p>Basic route active - blueprints not found</p>
        <p><a href="/test">Test Page</a></p>
        '''


    @app.route('/test')
    def test():
        return '''
        <h1>Test Page</h1>
        <p>Flask is working!</p>
        <p>Check console for blueprint loading errors.</p>
        '''

# Global variable for uptime tracking
START_TIME = time.time()


@app.context_processor
def inject_globals():
    """Inject global variables into all templates."""
    return {
        'start_time': START_TIME,
        'app_name': 'Pixel Pusher OS'
    }


@app.errorhandler(404)
def not_found_error(error):
    """Handle 404 errors gracefully"""
    return jsonify({
        'error': 'Not Found',
        'message': 'The requested resource was not found',
        'status_code': 404
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors gracefully"""
    db.session.rollback()
    return jsonify({
        'error': 'Internal Server Error',
        'message': 'An internal server error occurred',
        'status_code': 500
    }), 500


if __name__ == '__main__':
    print("🚀 Starting Pixel Pusher OS...")
    print("📍 Access at: http://localhost:5000")
    print("👤 Demo accounts: admin/admin, user/user, demo/demo")

    # Check if required directories exist
    required_dirs = ['static', 'templates', 'static/js', 'static/css']
    for dir_name in required_dirs:
        if not os.path.exists(dir_name):
            print(f"⚠️  Missing directory: {dir_name}")

    app.run(host='0.0.0.0', port=5000, debug=True)