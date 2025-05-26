#!/usr/bin/env python3
"""
Pixel Pusher OS - Database Models
SQLAlchemy database models for user management and application data.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# Initialize SQLAlchemy instance
db = SQLAlchemy()


class User(UserMixin, db.Model):
    """
    User model for authentication and user management.

    Attributes:
        id: Primary key
        username: Unique username for login
        password_hash: Hashed password for security
        group: User group (User or Admin)
        created_at: Account creation timestamp
        last_login: Last login timestamp
        is_active: Account status
    """

    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    group = db.Column(db.String(20), nullable=False, default='User')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)

    def __init__(self, username, password, group='User'):
        """Initialize new user with hashed password"""
        self.username = username
        self.set_password(password)
        self.group = group

    def set_password(self, password):
        """Hash and set user password"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)

    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login = datetime.utcnow()
        db.session.commit()

    def is_admin(self):
        """Check if user has admin privileges"""
        return self.group.lower() == 'admin'

    def to_dict(self):
        """Convert user to dictionary for JSON responses"""
        return {
            'id': self.id,
            'username': self.username,
            'group': self.group,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'is_active': self.is_active
        }

    @staticmethod
    def create_default_users():
        """Create default demo users if they don't exist"""
        default_users = [
            {'username': 'admin', 'password': 'admin', 'group': 'Admin'},
            {'username': 'user', 'password': 'user', 'group': 'User'},
            {'username': 'demo', 'password': 'demo', 'group': 'User'},
        ]

        for user_data in default_users:
            existing_user = User.query.filter_by(username=user_data['username']).first()
            if not existing_user:
                user = User(
                    username=user_data['username'],
                    password=user_data['password'],
                    group=user_data['group']
                )
                db.session.add(user)
                print(f"✅ Created default user: {user_data['username']}")

        try:
            db.session.commit()
            print("✅ Default users created successfully")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error creating default users: {e}")

    def __repr__(self):
        return f'<User {self.username}>'


class UserSession(db.Model):
    """
    User session tracking for analytics and security.
    """

    __tablename__ = 'user_sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_id = db.Column(db.String(255), nullable=False, index=True)
    login_time = db.Column(db.DateTime, default=datetime.utcnow)
    logout_time = db.Column(db.DateTime)
    ip_address = db.Column(db.String(45))  # Support IPv6
    user_agent = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)

    # Relationship to User
    user = db.relationship('User', backref=db.backref('sessions', lazy=True))

    def __repr__(self):
        return f'<UserSession {self.user.username} - {self.login_time}>'


class ApplicationLog(db.Model):
    """
    Application event logging for debugging and analytics.
    """

    __tablename__ = 'application_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    level = db.Column(db.String(20), nullable=False)  # INFO, WARNING, ERROR
    category = db.Column(db.String(50), nullable=False)  # AUTH, TERMINAL, GAME, etc.
    message = db.Column(db.Text, nullable=False)
    details = db.Column(db.JSON)  # Additional structured data
    ip_address = db.Column(db.String(45))

    # Relationship to User
    user = db.relationship('User', backref=db.backref('logs', lazy=True))

    @staticmethod
    def log_event(level, category, message, user_id=None, details=None, ip_address=None):
        """Log an application event"""
        log_entry = ApplicationLog(
            user_id=user_id,
            level=level.upper(),
            category=category.upper(),
            message=message,
            details=details,
            ip_address=ip_address
        )

        db.session.add(log_entry)
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Failed to log event: {e}")

    def __repr__(self):
        return f'<ApplicationLog {self.level} - {self.category} - {self.timestamp}>'


class GameScore(db.Model):
    """
    Game high scores and statistics tracking.
    """

    __tablename__ = 'game_scores'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    game_name = db.Column(db.String(50), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    level = db.Column(db.Integer, default=1)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_high_score = db.Column(db.Boolean, default=False)
    game_data = db.Column(db.JSON)  # Additional game-specific data

    # Relationship to User
    user = db.relationship('User', backref=db.backref('game_scores', lazy=True))

    @staticmethod
    def record_score(user_id, game_name, score, level=1, game_data=None):
        """Record a new game score and check if it's a high score"""
        # Check if this is a new high score for this user and game
        current_high = GameScore.query.filter_by(
            user_id=user_id,
            game_name=game_name,
            is_high_score=True
        ).first()

        is_new_high = False
        if not current_high or score > current_high.score:
            is_new_high = True
            # Mark previous high score as not high score
            if current_high:
                current_high.is_high_score = False

        # Create new score record
        new_score = GameScore(
            user_id=user_id,
            game_name=game_name,
            score=score,
            level=level,
            is_high_score=is_new_high,
            game_data=game_data
        )

        db.session.add(new_score)

        try:
            db.session.commit()
            return is_new_high
        except Exception as e:
            db.session.rollback()
            print(f"Failed to record game score: {e}")
            return False

    @staticmethod
    def get_high_scores(game_name=None, limit=10):
        """Get high scores, optionally filtered by game"""
        query = GameScore.query.filter_by(is_high_score=True)

        if game_name:
            query = query.filter_by(game_name=game_name)

        return query.order_by(GameScore.score.desc()).limit(limit).all()

    def __repr__(self):
        return f'<GameScore {self.user.username} - {self.game_name} - {self.score}>'


print("📊 Database models loaded successfully")