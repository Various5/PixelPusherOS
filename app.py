#!/usr/bin/env python3
"""
Pixel Pusher OS - Main Flask Application
A modern web-based desktop environment built with Flask and JavaScript.

This is the main entry point for the Pixel Pusher OS application.
It initializes Flask, loads configuration, sets up database, and registers blueprints.
"""

import os
import time
from flask import Flask
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
db = SQLAlchemy(app)  # Database ORM
login_manager = LoginManager(app)  # User session management

# Configure login manager BEFORE importing models
login_manager.login_view = 'auth.login'
login_manager.login_message = 'Please log in to access this page.'
login_manager.login_message_category = 'info'

# Import models AFTER initializing db
from models import User


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


# Create database tables and default users if they don't exist
def create_database():
    """Create database tables and default users"""
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database tables created successfully")

            # Create default users
            User.create_default_users()

        except Exception as e:
            print(f"❌ Database creation error: {e}")


# Call database creation
create_database()


# Import and register blueprints AFTER everything is set up
def register_blueprints():
    """Register application blueprints"""
    try:
        from routes.auth import auth_bp
        from routes.desktop import desktop_bp
        from routes.api import api_bp

        app.register_blueprint(auth_bp)
        app.register_blueprint(desktop_bp)
        app.register_blueprint(api_bp, url_prefix='/api')

        print("✅ Blueprints registered successfully")

    except Exception as e:
        print(f"❌ Blueprint registration error: {e}")


# Register blueprints
register_blueprints()

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
        'app_name': 'Pixel Pusher OS'
    }


@app.errorhandler(404)
def not_found_error(error):
    """Handle 404 errors gracefully"""
    return "Page not found - Pixel Pusher OS", 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors gracefully"""
    try:
        db.session.rollback()
    except:
        pass
    return "Internal server error - Pixel Pusher OS", 500


@app.errorhandler(RecursionError)
def recursion_error(error):
    """Handle recursion errors specifically"""
    print(f"❌ RecursionError caught: {error}")
    return "Recursion error - Please restart the application", 500


if __name__ == '__main__':
    print("🚀 Starting Pixel Pusher OS...")
    print("📍 Access at: http://localhost:5000")
    print("👤 Demo accounts: admin/admin, user/user, demo/demo")

    # Run the Flask development server
    try:
        app.run(host='0.0.0.0', port=5000, debug=True)
    except Exception as e:
        print(f"❌ Failed to start server: {e}")