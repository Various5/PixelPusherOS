#!/usr/bin/env python3
"""
Pixel Pusher OS - Database Models
User authentication and session models for the application.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import secrets

# Create db instance - will be initialized in app.py
db = SQLAlchemy()


class User(UserMixin, db.Model):
    """User model for authentication and user management"""

    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    group = db.Column(db.String(20), nullable=False, default='User')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)

    # Relationship to user sessions
    sessions = db.relationship('UserSession', backref='user', lazy='dynamic', cascade='all, delete-orphan')

    def __init__(self, username, password, group='User'):
        """Initialize user with hashed password"""
        self.username = username
        self.set_password(password)
        self.group = group

    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)

    def get_id(self):
        """Return user ID as string for Flask-Login"""
        return str(self.id)

    @property
    def is_authenticated(self):
        """Return True if user is authenticated"""
        return True

    @property
    def is_anonymous(self):
        """Return False as this is not an anonymous user"""
        return False

    def create_session(self):
        """Create a new user session"""
        session = UserSession(user_id=self.id)
        db.session.add(session)
        db.session.commit()
        return session

    def get_active_sessions(self):
        """Get all active sessions for this user"""
        return self.sessions.filter(
            UserSession.expires_at > datetime.utcnow(),
            UserSession.is_active == True
        ).all()

    def invalidate_all_sessions(self):
        """Invalidate all sessions for this user"""
        self.sessions.update({'is_active': False})
        db.session.commit()

    def __repr__(self):
        return f'<User {self.username}>'

    @staticmethod
    def create_default_users():
        """Create default users if they don't exist"""
        try:
            # Check if users already exist
            if User.query.first():
                print("👤 Users already exist, skipping creation")
                return

            # Create default users
            default_users = [
                {'username': 'admin', 'password': 'admin', 'group': 'Admin'},
                {'username': 'user', 'password': 'user', 'group': 'User'},
                {'username': 'demo', 'password': 'demo', 'group': 'User'},
            ]

            for user_data in default_users:
                existing_user = User.query.filter_by(username=user_data['username']).first()
                if not existing_user:
                    new_user = User(
                        username=user_data['username'],
                        password=user_data['password'],
                        group=user_data['group']
                    )
                    db.session.add(new_user)

            db.session.commit()
            print("✅ Default users created successfully")

        except Exception as e:
            print(f"❌ Error creating default users: {e}")
            db.session.rollback()
            raise


class UserSession(db.Model):
    """User session model for tracking user sessions"""

    __tablename__ = 'user_sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_token = db.Column(db.String(255), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    ip_address = db.Column(db.String(45))  # Support IPv4 and IPv6
    user_agent = db.Column(db.Text)

    def __init__(self, user_id, expires_in_hours=24):
        """Initialize user session"""
        self.user_id = user_id
        self.session_token = secrets.token_urlsafe(32)
        self.expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours)

    def is_expired(self):
        """Check if session has expired"""
        return datetime.utcnow() > self.expires_at

    def is_valid(self):
        """Check if session is valid (active and not expired)"""
        return self.is_active and not self.is_expired()

    def update_activity(self):
        """Update last activity timestamp"""
        self.last_activity = datetime.utcnow()
        db.session.commit()

    def invalidate(self):
        """Invalidate this session"""
        self.is_active = False
        db.session.commit()

    def extend_session(self, hours=24):
        """Extend session expiration time"""
        self.expires_at = datetime.utcnow() + timedelta(hours=hours)
        db.session.commit()

    @classmethod
    def cleanup_expired_sessions(cls):
        """Remove expired sessions from database"""
        try:
            expired_count = cls.query.filter(
                cls.expires_at < datetime.utcnow()
            ).delete()

            db.session.commit()

            if expired_count > 0:
                print(f"🧹 Cleaned up {expired_count} expired sessions")

        except Exception as e:
            print(f"❌ Error cleaning up sessions: {e}")
            db.session.rollback()

    def __repr__(self):
        return f'<UserSession {self.session_token[:8]}... for User {self.user_id}>'


class UserPreference(db.Model):
    """User preferences and settings"""

    __tablename__ = 'user_preferences'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    preference_key = db.Column(db.String(100), nullable=False)
    preference_value = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Composite unique constraint
    __table_args__ = (db.UniqueConstraint('user_id', 'preference_key', name='unique_user_preference'),)

    def __init__(self, user_id, preference_key, preference_value):
        self.user_id = user_id
        self.preference_key = preference_key
        self.preference_value = str(preference_value) if preference_value is not None else None

    @classmethod
    def get_user_preference(cls, user_id, key, default=None):
        """Get a user preference value"""
        try:
            preference = cls.query.filter_by(user_id=user_id, preference_key=key).first()
            return preference.preference_value if preference else default
        except Exception as e:
            print(f"Error getting user preference: {e}")
            return default

    @classmethod
    def set_user_preference(cls, user_id, key, value):
        """Set a user preference value"""
        try:
            preference = cls.query.filter_by(user_id=user_id, preference_key=key).first()

            if preference:
                preference.preference_value = str(value) if value is not None else None
                preference.updated_at = datetime.utcnow()
            else:
                preference = cls(user_id=user_id, preference_key=key, preference_value=value)
                db.session.add(preference)

            db.session.commit()
            return True

        except Exception as e:
            print(f"Error setting user preference: {e}")
            db.session.rollback()
            return False

    def __repr__(self):
        return f'<UserPreference {self.preference_key}={self.preference_value} for User {self.user_id}>'


class GameScore(db.Model):
    """Game high scores and statistics"""

    __tablename__ = 'game_scores'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    game_name = db.Column(db.String(50), nullable=False)
    score = db.Column(db.Integer, nullable=False, default=0)
    level_reached = db.Column(db.Integer, default=1)
    play_time_seconds = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to user
    user = db.relationship('User', backref=db.backref('game_scores', lazy='dynamic'))

    def __init__(self, user_id, game_name, score, level_reached=1, play_time_seconds=0):
        self.user_id = user_id
        self.game_name = game_name
        self.score = score
        self.level_reached = level_reached
        self.play_time_seconds = play_time_seconds

    @classmethod
    def get_high_score(cls, user_id, game_name):
        """Get the high score for a user and game"""
        try:
            score_record = cls.query.filter_by(
                user_id=user_id,
                game_name=game_name
            ).order_by(cls.score.desc()).first()

            return score_record.score if score_record else 0
        except Exception as e:
            print(f"Error getting high score: {e}")
            return 0

    @classmethod
    def update_high_score(cls, user_id, game_name, score, level_reached=1, play_time_seconds=0):
        """Update high score if the new score is higher"""
        try:
            current_high = cls.get_high_score(user_id, game_name)

            if score > current_high:
                new_score = cls(
                    user_id=user_id,
                    game_name=game_name,
                    score=score,
                    level_reached=level_reached,
                    play_time_seconds=play_time_seconds
                )
                db.session.add(new_score)
                db.session.commit()
                return True

            return False

        except Exception as e:
            print(f"Error updating high score: {e}")
            db.session.rollback()
            return False

    def __repr__(self):
        return f'<GameScore {self.game_name}: {self.score} for User {self.user_id}>'


# Initialize database function
def init_db(app):
    """Initialize database with app context"""
    db.init_app(app)

    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print("✅ Database tables created successfully")

            # Create default users
            User.create_default_users()

            # Clean up expired sessions
            UserSession.cleanup_expired_sessions()

            return True

        except Exception as e:
            print(f"❌ Database initialization error: {e}")
            return False


# Export all models for easy importing
__all__ = ['db', 'User', 'UserSession', 'UserPreference', 'GameScore', 'init_db']