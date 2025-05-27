#!/usr/bin/env python3
"""
Pixel Pusher OS - Database Models
Defines SQLAlchemy models for user management and system logging.

This module provides:
- User model for authentication and user management
- SystemLog model for system activity logging
- Database initialization and default data creation
"""

import os
import hashlib
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

# Initialize SQLAlchemy instance
db = SQLAlchemy()


class User(UserMixin, db.Model):
    """
    User model for authentication and user management.

    This model stores user credentials, profile information, and preferences.
    Compatible with Flask-Login for session management.
    """

    __tablename__ = 'users'

    # Primary key
    id = db.Column(db.Integer, primary_key=True)

    # Authentication fields
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(120), nullable=False)

    # User profile information
    group = db.Column(db.String(20), nullable=False, default='User')  # 'User' or 'Admin'
    email = db.Column(db.String(120), unique=True, nullable=True)
    full_name = db.Column(db.String(100), nullable=True)

    # Account status and timestamps
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)
    login_count = db.Column(db.Integer, default=0, nullable=False)

    # User preferences (stored as JSON-like string)
    preferences = db.Column(db.Text, nullable=True)

    # Relationships
    system_logs = db.relationship('SystemLog', backref='user', lazy=True, cascade='all, delete-orphan')

    def __init__(self, username, password, group='User', email=None, full_name=None):
        """Initialize a new user with hashed password."""
        self.username = username
        self.set_password(password)
        self.group = group
        self.email = email
        self.full_name = full_name

    def set_password(self, password):
        """Hash and set the user's password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check if the provided password matches the user's password."""
        return check_password_hash(self.password_hash, password)

    def update_login_info(self):
        """Update login timestamp and count."""
        self.last_login = datetime.utcnow()
        self.login_count += 1
        db.session.commit()

    def is_admin(self):
        """Check if the user has admin privileges."""
        return self.group.lower() == 'admin'

    def get_avatar_url(self, size=80):
        """Generate Gravatar URL for user avatar."""
        if self.email:
            digest = hashlib.md5(self.email.lower().encode('utf-8')).hexdigest()
            return f'https://www.gravatar.com/avatar/{digest}?d=identicon&s={size}'
        else:
            # Default avatar based on username
            digest = hashlib.md5(self.username.lower().encode('utf-8')).hexdigest()
            return f'https://www.gravatar.com/avatar/{digest}?d=identicon&s={size}'

    def to_dict(self):
        """Convert user object to dictionary for API responses."""
        return {
            'id': self.id,
            'username': self.username,
            'group': self.group,
            'email': self.email,
            'full_name': self.full_name,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'login_count': self.login_count,
            'avatar_url': self.get_avatar_url()
        }

    def __repr__(self):
        return f'<User {self.username} ({self.group})>'

    @staticmethod
    def create_default_users():
        """Create default users if they don't exist."""
        try:
            # Check if users already exist
            if User.query.count() > 0:
                print("👥 Users already exist, skipping default user creation")
                return

            # Create default admin user
            admin_user = User(
                username='admin',
                password='admin',
                group='Admin',
                email='admin@pixelpusher.dev',
                full_name='System Administrator'
            )

            # Create default regular user
            regular_user = User(
                username='user',
                password='user',
                group='User',
                email='user@pixelpusher.dev',
                full_name='Regular User'
            )

            # Create demo user
            demo_user = User(
                username='demo',
                password='demo',
                group='User',
                email='demo@pixelpusher.dev',
                full_name='Demo User'
            )

            # Add users to database
            db.session.add(admin_user)
            db.session.add(regular_user)
            db.session.add(demo_user)
            db.session.commit()

            print("✅ Default users created successfully:")
            print("   👨‍💼 admin/admin (Administrator)")
            print("   👤 user/user (Regular User)")
            print("   🎭 demo/demo (Demo User)")

        except Exception as e:
            print(f"❌ Error creating default users: {e}")
            db.session.rollback()


class SystemLog(db.Model):
    """
    System log model for tracking user activities and system events.

    This model logs various system activities including:
    - User logins and logouts
    - Command executions
    - File operations
    - System errors and warnings
    """

    __tablename__ = 'system_logs'

    # Primary key
    id = db.Column(db.Integer, primary_key=True)

    # Log details
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    level = db.Column(db.String(10), nullable=False, default='INFO')  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    category = db.Column(db.String(20), nullable=False, index=True)  # AUTH, COMMAND, FILE, SYSTEM, GAME, etc.
    action = db.Column(db.String(50), nullable=False)  # login, logout, execute, create, delete, etc.
    message = db.Column(db.Text, nullable=False)

    # User and session information
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    username = db.Column(db.String(80), nullable=True)  # Cached username for performance
    session_id = db.Column(db.String(100), nullable=True)

    # Request information
    ip_address = db.Column(db.String(45), nullable=True)  # IPv6 support
    user_agent = db.Column(db.String(200), nullable=True)

    # Additional context (stored as JSON-like string)
    details = db.Column(db.Text, nullable=True)

    def __init__(self, level, category, action, message, user_id=None, username=None,
                 session_id=None, ip_address=None, user_agent=None, details=None):
        """Initialize a new system log entry."""
        self.level = level.upper()
        self.category = category.upper()
        self.action = action
        self.message = message
        self.user_id = user_id
        self.username = username
        self.session_id = session_id
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.details = details

    def to_dict(self):
        """Convert log entry to dictionary for API responses."""
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat(),
            'level': self.level,
            'category': self.category,
            'action': self.action,
            'message': self.message,
            'user_id': self.user_id,
            'username': self.username,
            'session_id': self.session_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'details': self.details
        }

    def __repr__(self):
        return f'<SystemLog {self.timestamp} {self.level} {self.category}:{self.action}>'

    @staticmethod
    def log_event(level, category, action, message, user=None, request=None, details=None):
        """
        Convenience method to create and save a log entry.

        Args:
            level (str): Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
            category (str): Log category (AUTH, COMMAND, FILE, SYSTEM, etc.)
            action (str): Action performed (login, execute, create, etc.)
            message (str): Log message
            user (User, optional): User object
            request (Request, optional): Flask request object
            details (str, optional): Additional details
        """
        try:
            log_entry = SystemLog(
                level=level,
                category=category,
                action=action,
                message=message,
                user_id=user.id if user else None,
                username=user.username if user else None,
                ip_address=request.remote_addr if request else None,
                user_agent=request.headers.get('User-Agent', '')[:200] if request else None,
                details=details
            )

            db.session.add(log_entry)
            db.session.commit()

            # Optional: Print to console for development
            print(f"📝 LOG [{level}] {category}:{action} - {message}")

        except Exception as e:
            print(f"❌ Error creating log entry: {e}")
            db.session.rollback()

    @staticmethod
    def get_recent_logs(limit=100, user_id=None, category=None, level=None):
        """
        Get recent log entries with optional filtering.

        Args:
            limit (int): Maximum number of logs to return
            user_id (int, optional): Filter by user ID
            category (str, optional): Filter by category
            level (str, optional): Filter by log level

        Returns:
            List of SystemLog objects
        """
        query = SystemLog.query

        if user_id:
            query = query.filter(SystemLog.user_id == user_id)

        if category:
            query = query.filter(SystemLog.category == category.upper())

        if level:
            query = query.filter(SystemLog.level == level.upper())

        return query.order_by(SystemLog.timestamp.desc()).limit(limit).all()

    @staticmethod
    def cleanup_old_logs(days=30):
        """
        Clean up log entries older than specified days.

        Args:
            days (int): Number of days to keep logs
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            old_logs = SystemLog.query.filter(SystemLog.timestamp < cutoff_date)
            count = old_logs.count()
            old_logs.delete()
            db.session.commit()

            print(f"🧹 Cleaned up {count} old log entries (older than {days} days)")
            return count

        except Exception as e:
            print(f"❌ Error cleaning up logs: {e}")
            db.session.rollback()
            return 0


class UserSession(db.Model):
    """
    User session model for tracking active user sessions.

    This model helps with session management and security monitoring.
    """

    __tablename__ = 'user_sessions'

    # Primary key
    id = db.Column(db.Integer, primary_key=True)

    # Session details
    session_id = db.Column(db.String(100), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)

    # Session metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(200), nullable=True)

    # Session status
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    # Relationships
    user = db.relationship('User', backref='sessions')

    def __init__(self, session_id, user_id, ip_address=None, user_agent=None):
        """Initialize a new user session."""
        self.session_id = session_id
        self.user_id = user_id
        self.ip_address = ip_address
        self.user_agent = user_agent[:200] if user_agent else None

    def update_activity(self):
        """Update last activity timestamp."""
        self.last_activity = datetime.utcnow()
        db.session.commit()

    def deactivate(self):
        """Deactivate the session."""
        self.is_active = False
        db.session.commit()

    def to_dict(self):
        """Convert session to dictionary."""
        return {
            'id': self.id,
            'session_id': self.session_id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'last_activity': self.last_activity.isoformat(),
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'is_active': self.is_active
        }

    def __repr__(self):
        return f'<UserSession {self.session_id} for User {self.user_id}>'

    @staticmethod
    def cleanup_inactive_sessions(hours=24):
        """Clean up inactive sessions older than specified hours."""
        try:
            from datetime import timedelta
            cutoff_time = datetime.utcnow() - timedelta(hours=hours)

            inactive_sessions = UserSession.query.filter(
                UserSession.last_activity < cutoff_time
            )
            count = inactive_sessions.count()
            inactive_sessions.delete()
            db.session.commit()

            print(f"🧹 Cleaned up {count} inactive sessions (older than {hours} hours)")
            return count

        except Exception as e:
            print(f"❌ Error cleaning up sessions: {e}")
            db.session.rollback()
            return 0


def init_database(app):
    """
    Initialize database with the Flask app.

    This function should be called to set up the database
    and create default data.
    """
    try:
        with app.app_context():
            # Create all tables
            db.create_all()
            print("✅ Database tables created successfully")

            # Create default users
            User.create_default_users()

            # Log system startup
            SystemLog.log_event(
                level='INFO',
                category='SYSTEM',
                action='startup',
                message='Pixel Pusher OS database initialized'
            )

    except Exception as e:
        print(f"❌ Database initialization error: {e}")
        raise


# Utility functions for common database operations
def get_user_by_username(username):
    """Get user by username."""
    return User.query.filter_by(username=username).first()


def get_active_users():
    """Get all active users."""
    return User.query.filter_by(is_active=True).all()


def create_user(username, password, group='User', email=None, full_name=None):
    """Create a new user."""
    try:
        user = User(
            username=username,
            password=password,
            group=group,
            email=email,
            full_name=full_name
        )
        db.session.add(user)
        db.session.commit()

        SystemLog.log_event(
            level='INFO',
            category='AUTH',
            action='user_created',
            message=f'New user created: {username}',
            details=f'Group: {group}'
        )

        return user

    except Exception as e:
        db.session.rollback()
        raise e


print("📊 Database models loaded successfully")