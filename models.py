#!/usr/bin/env python3
"""
Pixel Pusher OS - Database Models
SQLAlchemy database models for user management and data persistence.

This module defines the database schema and provides methods for:
- User authentication and authorization
- Password hashing and verification
- User profile management
- Database relationships
"""

from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# Initialize SQLAlchemy instance
# This will be initialized with the Flask app in app.py
db = SQLAlchemy()


class User(db.Model, UserMixin):
    """
    User model for authentication and profile management.

    Inherits from UserMixin to provide Flask-Login integration.
    Handles user registration, authentication, and profile data.
    """

    __tablename__ = 'users'

    # Primary key and basic info
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=True)

    # Authentication fields
    password_hash = db.Column(db.String(128), nullable=False)

    # User role and permissions
    group = db.Column(db.String(20), nullable=False, default='User')
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    # Timestamps for auditing
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # User preferences (stored as JSON)
    preferences = db.Column(db.Text, nullable=True)  # JSON string for user settings

    def __repr__(self):
        """String representation of User object for debugging"""
        return f'<User {self.username} ({self.group})>'

    def set_password(self, password):
        """
        Hash and store the user's password securely.
        Uses Werkzeug's secure password hashing.

        Args:
            password (str): Plain text password to hash
        """
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')
        print(f"🔐 Password set for user: {self.username}")

    def check_password(self, password):
        """
        Verify the provided password against the stored hash.

        Args:
            password (str): Plain text password to verify

        Returns:
            bool: True if password matches, False otherwise
        """
        return check_password_hash(self.password_hash, password)

    def is_admin(self):
        """
        Check if the user has administrator privileges.

        Returns:
            bool: True if user is admin, False otherwise
        """
        return self.group.lower() == 'admin'

    def is_active_user(self):
        """
        Check if the user account is active (not disabled).
        Required by Flask-Login.

        Returns:
            bool: True if account is active
        """
        return self.is_active

    def get_id(self):
        """
        Get user ID as string for Flask-Login session management.

        Returns:
            str: User ID as string
        """
        return str(self.id)

    def update_last_login(self):
        """
        Update the last login timestamp.
        Should be called when user successfully logs in.
        """
        self.last_login = datetime.utcnow()
        db.session.commit()
        print(f"📅 Updated last login for: {self.username}")

    def to_dict(self):
        """
        Convert user object to dictionary for JSON serialization.
        Excludes sensitive information like password hash.

        Returns:
            dict: User data as dictionary
        """
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'group': self.group,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'is_admin': self.is_admin()
        }

    @staticmethod
    def create_default_users():
        """
        Create default demo users if they don't exist.
        This is useful for initial setup and demonstrations.
        """
        default_users = [
            {'username': 'admin', 'password': 'admin', 'group': 'Admin'},
            {'username': 'user', 'password': 'user', 'group': 'User'},
            {'username': 'demo', 'password': 'demo', 'group': 'User'}
        ]

        for user_data in default_users:
            # Check if user already exists
            existing_user = User.query.filter_by(username=user_data['username']).first()
            if not existing_user:
                # Create new user
                new_user = User(
                    username=user_data['username'],
                    group=user_data['group']
                )
                new_user.set_password(user_data['password'])

                db.session.add(new_user)
                print(f"👤 Created default user: {user_data['username']}")

        try:
            db.session.commit()
            print("✅ Default users created successfully")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Failed to create default users: {e}")


# Additional models can be added here as the application grows
# For example: UserSession, FileMetadata, GameScore, etc.

class UserSession(db.Model):
    """
    Optional: Track user sessions for security and analytics.
    This model can store session information beyond Flask-Login's basic session.
    """

    __tablename__ = 'user_sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_token = db.Column(db.String(255), unique=True, nullable=False)
    ip_address = db.Column(db.String(45), nullable=True)  # IPv6 compatible
    user_agent = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    # Relationship to User model
    user = db.relationship('User', backref=db.backref('sessions', lazy=True))

    def __repr__(self):
        return f'<UserSession {self.user_id}:{self.session_token[:8]}...>'

    def is_expired(self):
        """Check if the session has expired"""
        return datetime.utcnow() > self.expires_at

    def revoke(self):
        """Revoke/deactivate the session"""
        self.is_active = False
        db.session.commit()


# Print model information when module is imported
print("📊 Database models loaded:")
print("  - User: Authentication and profile management")
print("  - UserSession: Session tracking (optional)")