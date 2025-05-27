#!/usr/bin/env python3
"""
Pixel Pusher OS - Database Models
Complete database models including all required classes.
"""

import os
import hashlib
import json
from datetime import datetime, timedelta
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

# Initialize SQLAlchemy instance
db = SQLAlchemy()


class User(UserMixin, db.Model):
    """User model for authentication and user management."""

    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(120), nullable=False)
    group = db.Column(db.String(20), nullable=False, default='User')
    email = db.Column(db.String(120), unique=True, nullable=True)
    full_name = db.Column(db.String(100), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)
    login_count = db.Column(db.Integer, default=0, nullable=False)
    preferences = db.Column(db.Text, nullable=True)

    def __init__(self, username, password, group='User', email=None, full_name=None):
        self.username = username
        self.set_password(password)
        self.group = group
        self.email = email
        self.full_name = full_name

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def update_login_info(self):
        self.last_login = datetime.utcnow()
        self.login_count += 1
        db.session.commit()

    def is_admin(self):
        return self.group.lower() == 'admin'

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'group': self.group,
            'email': self.email,
            'full_name': self.full_name,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'login_count': self.login_count
        }

    def __repr__(self):
        return f'<User {self.username} ({self.group})>'

    @staticmethod
    def create_default_users():
        """Create default users if they don't exist."""
        try:
            if User.query.count() > 0:
                print("👥 Users already exist, skipping default user creation")
                return

            # Create default users
            users_data = [
                {'username': 'admin', 'password': 'admin', 'group': 'Admin', 'email': 'admin@pixelpusher.dev'},
                {'username': 'user', 'password': 'user', 'group': 'User', 'email': 'user@pixelpusher.dev'},
                {'username': 'demo', 'password': 'demo', 'group': 'User', 'email': 'demo@pixelpusher.dev'}
            ]

            for user_data in users_data:
                user = User(
                    username=user_data['username'],
                    password=user_data['password'],
                    group=user_data['group'],
                    email=user_data['email']
                )
                db.session.add(user)

            db.session.commit()
            print("✅ Default users created successfully:")
            print("   👨‍💼 admin/admin (Administrator)")
            print("   👤 user/user (Regular User)")
            print("   🎭 demo/demo (Demo User)")

        except Exception as e:
            print(f"❌ Error creating default users: {e}")
            db.session.rollback()


class SystemLog(db.Model):
    """System log model for tracking user activities and system events."""

    __tablename__ = 'system_logs'

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    level = db.Column(db.String(10), nullable=False, default='INFO')
    category = db.Column(db.String(20), nullable=False, index=True)
    action = db.Column(db.String(50), nullable=False)
    message = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    username = db.Column(db.String(80), nullable=True)
    session_id = db.Column(db.String(100), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(200), nullable=True)
    details = db.Column(db.Text, nullable=True)

    user = db.relationship('User', backref='system_logs')

    def __init__(self, level, category, action, message, user_id=None, username=None,
                 session_id=None, ip_address=None, user_agent=None, details=None):
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
        """Convenience method to create and save a log entry."""
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

        except Exception as e:
            print(f"❌ Error creating log entry: {e}")
            db.session.rollback()


class GameScore(db.Model):
    """Game score model for tracking high scores and achievements."""

    __tablename__ = 'game_scores'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    username = db.Column(db.String(80), nullable=False)
    game_name = db.Column(db.String(50), nullable=False, index=True)
    score = db.Column(db.Integer, nullable=False, default=0)
    level = db.Column(db.Integer, nullable=True, default=1)
    duration = db.Column(db.Integer, nullable=True)
    moves = db.Column(db.Integer, nullable=True)
    achieved_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    game_data = db.Column(db.Text, nullable=True)

    user = db.relationship('User', backref='game_scores')

    def __init__(self, user_id, username, game_name, score, level=None, duration=None, moves=None, game_data=None):
        self.user_id = user_id
        self.username = username
        self.game_name = game_name
        self.score = score
        self.level = level
        self.duration = duration
        self.moves = moves
        self.game_data = game_data

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.username,
            'game_name': self.game_name,
            'score': self.score,
            'level': self.level,
            'duration': self.duration,
            'moves': self.moves,
            'achieved_at': self.achieved_at.isoformat(),
            'game_data': self.game_data
        }

    def __repr__(self):
        return f'<GameScore {self.username} {self.game_name}: {self.score}>'

    @staticmethod
    def get_high_score(game_name, user_id=None):
        """Get the high score for a specific game."""
        query = GameScore.query.filter(GameScore.game_name == game_name)
        if user_id:
            query = query.filter(GameScore.user_id == user_id)
        return query.order_by(GameScore.score.desc()).first()

    @staticmethod
    def get_user_scores(user_id, game_name=None, limit=10):
        """Get scores for a specific user."""
        query = GameScore.query.filter(GameScore.user_id == user_id)
        if game_name:
            query = query.filter(GameScore.game_name == game_name)
        return query.order_by(GameScore.score.desc()).limit(limit).all()

    @staticmethod
    def get_leaderboard(game_name, limit=10):
        """Get leaderboard for a specific game."""
        return GameScore.query.filter(GameScore.game_name == game_name) \
            .order_by(GameScore.score.desc()) \
            .limit(limit).all()

    @staticmethod
    def save_score(user_id, username, game_name, score, level=None, duration=None, moves=None, game_data=None):
        """Save a new game score."""
        try:
            game_score = GameScore(
                user_id=user_id,
                username=username,
                game_name=game_name,
                score=score,
                level=level,
                duration=duration,
                moves=moves,
                game_data=game_data
            )

            db.session.add(game_score)
            db.session.commit()

            SystemLog.log_event(
                level='INFO',
                category='GAME',
                action='score_saved',
                message=f'{username} scored {score} in {game_name}',
                user_id=user_id,
                details=f'Level: {level}, Duration: {duration}'
            )

            return game_score

        except Exception as e:
            db.session.rollback()
            raise e


class FileMetadata(db.Model):
    """File metadata model for tracking uploaded files."""

    __tablename__ = 'file_metadata'

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=False, default=0)
    file_type = db.Column(db.String(50), nullable=True)
    mime_type = db.Column(db.String(100), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    upload_ip = db.Column(db.String(45), nullable=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_public = db.Column(db.Boolean, default=False, nullable=False)
    description = db.Column(db.Text, nullable=True)
    tags = db.Column(db.String(500), nullable=True)

    user = db.relationship('User', backref='uploaded_files')

    def __init__(self, filename, original_filename, file_path, file_size, user_id,
                 file_type=None, mime_type=None, upload_ip=None, description=None, tags=None):
        self.filename = filename
        self.original_filename = original_filename
        self.file_path = file_path
        self.file_size = file_size
        self.user_id = user_id
        self.file_type = file_type
        self.mime_type = mime_type
        self.upload_ip = upload_ip
        self.description = description
        self.tags = tags

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'file_path': self.file_path,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'mime_type': self.mime_type,
            'user_id': self.user_id,
            'uploaded_at': self.uploaded_at.isoformat(),
            'is_active': self.is_active,
            'is_public': self.is_public,
            'description': self.description,
            'tags': self.tags.split(',') if self.tags else []
        }

    def __repr__(self):
        return f'<FileMetadata {self.filename} by User {self.user_id}>'


class UserSession(db.Model):
    """User session model for tracking active user sessions."""

    __tablename__ = 'user_sessions'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(200), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    user = db.relationship('User', backref='sessions')

    def __init__(self, session_id, user_id, ip_address=None, user_agent=None):
        self.session_id = session_id
        self.user_id = user_id
        self.ip_address = ip_address
        self.user_agent = user_agent[:200] if user_agent else None

    def update_activity(self):
        self.last_activity = datetime.utcnow()
        db.session.commit()

    def deactivate(self):
        self.is_active = False
        db.session.commit()

    def to_dict(self):
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


class AppData(db.Model):
    """Application data model for storing app-specific user data."""

    __tablename__ = 'app_data'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    app_name = db.Column(db.String(50), nullable=False, index=True)
    data_key = db.Column(db.String(100), nullable=False)
    data_value = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = db.relationship('User', backref='app_data')

    __table_args__ = (
        db.UniqueConstraint('user_id', 'app_name', 'data_key', name='unique_user_app_key'),
    )

    def __init__(self, user_id, app_name, data_key, data_value=None):
        self.user_id = user_id
        self.app_name = app_name
        self.data_key = data_key
        self.data_value = data_value

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'app_name': self.app_name,
            'data_key': self.data_key,
            'data_value': self.data_value,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def __repr__(self):
        return f'<AppData {self.app_name}:{self.data_key} for User {self.user_id}>'

    @staticmethod
    def get_user_app_data(user_id, app_name, data_key=None):
        """Get app data for a specific user and app."""
        query = AppData.query.filter(
            AppData.user_id == user_id,
            AppData.app_name == app_name
        )

        if data_key:
            query = query.filter(AppData.data_key == data_key)
            return query.first()

        return query.all()

    @staticmethod
    def set_user_app_data(user_id, app_name, data_key, data_value):
        """Set app data for a user."""
        try:
            app_data = AppData.query.filter(
                AppData.user_id == user_id,
                AppData.app_name == app_name,
                AppData.data_key == data_key
            ).first()

            if app_data:
                app_data.data_value = data_value
                app_data.updated_at = datetime.utcnow()
            else:
                app_data = AppData(
                    user_id=user_id,
                    app_name=app_name,
                    data_key=data_key,
                    data_value=data_value
                )
                db.session.add(app_data)

            db.session.commit()
            return app_data

        except Exception as e:
            db.session.rollback()
            raise e


def init_database(app):
    """Initialize database with the Flask app."""
    try:
        with app.app_context():
            db.create_all()
            print("✅ Database tables created successfully")

            User.create_default_users()

            SystemLog.log_event(
                level='INFO',
                category='SYSTEM',
                action='startup',
                message='Pixel Pusher OS database initialized'
            )

    except Exception as e:
        print(f"❌ Database initialization error: {e}")
        raise


# Utility functions
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
print("✅ GameScore model is available for import")