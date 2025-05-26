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
from models import db, User

# Initialize Flask application with custom folders
app = Flask(__name__,
            static_folder='static',
            template_folder='templates')

# Load configuration from config.py
app.config.from_object(Config)

# Initialize Flask extensions
db.init_app(app)  # Database ORM
login_manager = LoginManager(app)  # User session management
login_manager.login_view = 'auth.login'  # Redirect to login if not authenticated


@login_manager.user_loader
def load_user(user_id):
    """
    Load user by ID for Flask-Login session management.
    This function is called on every request to load the current user.
    """
    return User.query.get(int(user_id))


# Create database tables if they don't exist
with app.app_context():
    db.create_all()
    print("✅ Database tables created successfully")

# Register application blueprints (modular route organization)
from routes.auth import auth_bp  # Authentication routes (login/register/logout)
from routes.desktop import desktop_bp  # Desktop and main application routes
from routes.api import api_bp  # API endpoints for terminal, files, games

app.register_blueprint(auth_bp)  # /login, /register, /logout
app.register_blueprint(desktop_bp)  # /, /browser, /word, /excel
app.register_blueprint(api_bp, url_prefix='/api')  # /api/command, /api/files, etc.

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
    db.session.rollback()
    return "Internal server error - Pixel Pusher OS", 500


if __name__ == '__main__':
    print("🚀 Starting Pixel Pusher OS...")
    print("📍 Access at: http://localhost:5000")
    print("👤 Demo accounts: admin/admin, user/user, demo/demo")

    # Run the Flask development server
    app.run(host='0.0.0.0', port=5000, debug=True)