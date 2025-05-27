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
from flask_login import LoginManager

from config import Config

# Track application start time for uptime calculations
START_TIME = time.time()


def create_app(config_class=Config):
    """
    Application factory function to create and configure Flask app.
    This pattern avoids circular imports and allows for better testing.
    """
    # Initialize Flask application with custom folders
    app = Flask(__name__,
                static_folder='static',
                template_folder='templates')

    # Load configuration from config.py
    app.config.from_object(config_class)

    # Initialize Flask extensions
    from models import db, init_database
    db.init_app(app)

    # Initialize Flask-Login
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access Pixel Pusher OS.'
    login_manager.login_message_category = 'info'

    @login_manager.user_loader
    def load_user(user_id):
        """
        Load user by ID for Flask-Login session management.
        This function is called on every request to load the current user.
        """
        from models import User
        return User.query.get(int(user_id))

    # Initialize database and create default data
    with app.app_context():
        try:
            init_database(app)
        except Exception as e:
            print(f"❌ Database initialization failed: {e}")

    # Register application blueprints (modular route organization)
    from routes.auth import auth_bp
    from routes.desktop import desktop_bp
    from routes.api import api_bp

    app.register_blueprint(auth_bp)  # /login, /register, /logout
    app.register_blueprint(desktop_bp)  # /, /browser, /word, /excel
    app.register_blueprint(api_bp, url_prefix='/api')  # /api/command, /api/files, etc.

    # Register context processors
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

    # Register error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        """Handle 404 errors gracefully"""
        from flask import render_template, request

        # Log the 404 error
        from models import SystemLog
        SystemLog.log_event(
            level='WARNING',
            category='SYSTEM',
            action='404',
            message=f'Page not found: {request.url}',
            request=request
        )

        return render_template('errors/404.html'), 404

    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors gracefully"""
        from flask import render_template, request
        from models import db, SystemLog

        # Rollback any pending database transactions
        db.session.rollback()

        # Log the 500 error
        SystemLog.log_event(
            level='ERROR',
            category='SYSTEM',
            action='500',
            message=f'Internal server error: {str(error)}',
            request=request
        )

        return render_template('errors/500.html'), 500

    @app.errorhandler(403)
    def forbidden_error(error):
        """Handle 403 errors gracefully"""
        from flask import render_template, request
        from models import SystemLog

        # Log the 403 error
        SystemLog.log_event(
            level='WARNING',
            category='SYSTEM',
            action='403',
            message=f'Access forbidden: {request.url}',
            request=request
        )

        return render_template('errors/403.html'), 403

    # Register CLI commands
    @app.cli.command()
    def init_db():
        """Initialize the database with default data."""
        init_database(app)
        print("Database initialized successfully!")

    @app.cli.command()
    def create_admin():
        """Create an admin user interactively."""
        from models import User, db
        import getpass

        username = input("Enter admin username: ")
        password = getpass.getpass("Enter admin password: ")
        email = input("Enter admin email (optional): ") or None
        full_name = input("Enter admin full name (optional): ") or None

        try:
            admin = User(
                username=username,
                password=password,
                group='Admin',
                email=email,
                full_name=full_name
            )
            db.session.add(admin)
            db.session.commit()
            print(f"Admin user '{username}' created successfully!")

        except Exception as e:
            print(f"Error creating admin user: {e}")
            db.session.rollback()

    @app.cli.command()
    def cleanup_logs():
        """Clean up old system logs."""
        from models import SystemLog
        count = SystemLog.cleanup_old_logs(days=30)
        print(f"Cleaned up {count} old log entries.")

    @app.cli.command()
    def cleanup_sessions():
        """Clean up inactive user sessions."""
        from models import UserSession
        count = UserSession.cleanup_inactive_sessions(hours=24)
        print(f"Cleaned up {count} inactive sessions.")

    # Add before_request handlers for logging and session management
    @app.before_request
    def before_request():
        """Handle tasks before each request."""
        from flask import request, session
        from flask_login import current_user
        from models import SystemLog, UserSession

        # Update session activity if user is logged in
        if current_user.is_authenticated:
            session_id = session.get('_id')
            if session_id:
                user_session = UserSession.query.filter_by(
                    session_id=session_id,
                    user_id=current_user.id
                ).first()
                if user_session:
                    user_session.update_activity()

        # Log API requests (optional, for debugging)
        if request.path.startswith('/api/') and app.debug:
            SystemLog.log_event(
                level='DEBUG',
                category='API',
                action='request',
                message=f'{request.method} {request.path}',
                user=current_user if current_user.is_authenticated else None,
                request=request
            )

    @app.after_request
    def after_request(response):
        """Handle tasks after each request."""
        # Add security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'

        # Add custom headers
        response.headers['X-Powered-By'] = 'Pixel Pusher OS v2.0'

        return response

    print("🎨 Pixel Pusher OS Flask application created successfully")
    return app


# Create the Flask application instance
app = create_app()

if __name__ == '__main__':
    print("🚀 Starting Pixel Pusher OS...")
    print("📍 Access at: http://localhost:5000")
    print("👤 Demo accounts: admin/admin, user/user, demo/demo")
    print("🔧 Debug mode: Enabled")
    print("📊 Database: SQLite")
    print("-" * 50)

    # Run the Flask development server
    try:
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True,
            use_reloader=True,
            use_debugger=True
        )
    except KeyboardInterrupt:
        print("\n👋 Pixel Pusher OS server stopped")
    except Exception as e:
        print(f"❌ Server error: {e}")