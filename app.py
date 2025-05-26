#!/usr/bin/env python3
"""
Pixel Pusher OS - Main Flask Application
Fixed version to prevent recursion errors and improve stability.
"""

import os
import time
from flask import Flask, redirect, url_for, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager

from config import Config

# Initialize Flask application with custom folders
app = Flask(__name__,
            static_folder='static',
            template_folder='templates')

# Load configuration from config.py
app.config.from_object(Config)

# Additional configuration to prevent session issues
app.config.update(
    SESSION_COOKIE_SECURE=False,  # Set to True in production with HTTPS
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    PERMANENT_SESSION_LIFETIME=86400,  # 24 hours
)

# Initialize Flask extensions
from models import db, User

db.init_app(app)  # Database ORM
login_manager = LoginManager(app)  # User session management

# Configure login manager to prevent recursion
login_manager.login_view = 'auth.login'
login_manager.login_message = 'Please log in to access this page.'
login_manager.login_message_category = 'info'

# Configure session protection
login_manager.session_protection = 'strong'


@login_manager.user_loader
def load_user(user_id):
    """
    Load user by ID for Flask-Login session management.
    This function is called on every request to load the current user.
    """
    try:
        return User.query.get(int(user_id))
    except (ValueError, TypeError):
        return None


@login_manager.unauthorized_handler
def unauthorized():
    """
    Handle unauthorized access attempts.
    This prevents redirect loops by providing a custom handler.
    """
    return redirect(url_for('auth.login'))


# Create database tables and default users if they don't exist
with app.app_context():
    try:
        db.create_all()
        print("✅ Database tables created successfully")

        # Create default users
        User.create_default_users()
        print("✅ Default users created/verified")

    except Exception as e:
        print(f"❌ Database initialization error: {e}")

# Register application blueprints (modular route organization)
try:
    from routes.auth import auth_bp  # Authentication routes
    from routes.desktop import desktop_bp  # Desktop and main application routes
    from routes.api import api_bp  # API endpoints

    app.register_blueprint(auth_bp)  # /login, /register, /logout
    app.register_blueprint(desktop_bp)  # /, /browser, /word, /excel
    app.register_blueprint(api_bp, url_prefix='/api')  # /api/command, /api/files, etc.

    print("✅ Blueprints registered successfully")

except ImportError as e:
    print(f"❌ Blueprint import error: {e}")
    print("Make sure all route files exist in the routes/ directory")

# Global variable for uptime tracking
START_TIME = time.time()


@app.context_processor
def inject_globals():
    """
    Inject global variables into all templates.
    These variables will be available in every Jinja2 template.
    """
    return {
        'start_time': START_TIME,
        'app_name': 'Pixel Pusher OS',
        'version': '2.0.0'
    }


@app.before_first_request
def before_first_request():
    """Initialize application before first request"""
    print("🚀 Pixel Pusher OS first request initialization")


@app.before_request
def before_request():
    """Run before each request to prevent recursion issues"""
    # Add any global request preprocessing here
    pass


@app.after_request
def after_request(response):
    """Run after each request for cleanup"""
    # Add security headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'

    return response


@app.errorhandler(404)
def not_found_error(error):
    """Handle 404 errors gracefully"""
    try:
        return render_template('error.html',
                               error="Page not found",
                               error_code=404), 404
    except:
        return "Page not found - Pixel Pusher OS", 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors gracefully"""
    try:
        db.session.rollback()
        return render_template('error.html',
                               error="Internal server error",
                               error_code=500), 500
    except:
        return "Internal server error - Pixel Pusher OS", 500


@app.errorhandler(RecursionError)
def recursion_error(error):
    """Handle recursion errors specifically"""
    print(f"❌ RecursionError caught: {error}")
    try:
        # Clear any problematic session data
        from flask import session
        session.clear()

        return render_template('error.html',
                               error="System error detected. Please try logging in again.",
                               error_code="RECURSION"), 500
    except:
        return "System error - Please refresh the page", 500


@app.errorhandler(Exception)
def handle_exception(error):
    """Handle all other exceptions"""
    print(f"❌ Unhandled exception: {error}")
    try:
        return render_template('error.html',
                               error="An unexpected error occurred",
                               error_code="EXCEPTION"), 500
    except:
        return "An error occurred - Pixel Pusher OS", 500


# Health check endpoint
@app.route('/health')
def health_check():
    """Simple health check endpoint"""
    return {
        'status': 'healthy',
        'version': '2.0.0',
        'uptime': time.time() - START_TIME
    }


# Root redirect to prevent confusion
@app.route('/favicon.ico')
def favicon():
    """Handle favicon requests"""
    return redirect(url_for('static', filename='favicon.ico'))


if __name__ == '__main__':
    print("🚀 Starting Pixel Pusher OS...")
    print("📍 Access at: http://localhost:5000")
    print("👤 Demo accounts: admin/admin, user/user, demo/demo")
    print("🔧 Debug mode: ON")

    # Run the Flask development server with error handling
    try:
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True,
            use_reloader=True,
            threaded=True
        )
    except Exception as e:
        print(f"❌ Failed to start server: {e}")