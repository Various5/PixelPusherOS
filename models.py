#!/usr/bin/env python3
"""
Pixel Pusher OS - Database Models
"""

from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# Import db from app to avoid circular imports
db = SQLAlchemy()


class User(db.Model, UserMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=True)
    password_hash = db.Column(db.String(128), nullable=False)
    group = db.Column(db.String(20), nullable=False, default='User')
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    preferences = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f'<User {self.username} ({self.group})>'

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')
        print(f"🔐 Password set for user: {self.username}")

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def is_admin(self):
        return self.group.lower() == 'admin'

    def is_active_user(self):
        return self.is_active

    def get_id(self):
        return str(self.id)

    def update_last_login(self):
        self.last_login = datetime.utcnow()
        db.session.commit()
        print(f"📅 Updated last login for: {self.username}")

    def to_dict(self):
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
        default_users = [
            {'username': 'admin', 'password': 'admin', 'group': 'Admin'},
            {'username': 'user', 'password': 'user', 'group': 'User'},
            {'username': 'demo', 'password': 'demo', 'group': 'User'}
        ]

        for user_data in default_users:
            existing_user = User.query.filter_by(username=user_data['username']).first()
            if not existing_user:
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


# Simplified UserSession model (remove if causing issues)
class UserSession(db.Model):
    __tablename__ = 'user_sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_token = db.Column(db.String(255), unique=True, nullable=False)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    def __repr__(self):
        return f'<UserSession {self.user_id}:{self.session_token[:8]}...>'

    def is_expired(self):
        return datetime.utcnow() > self.expires_at

    def revoke(self):
        self.is_active = False
        db.session.commit()


print("📊 Database models loaded successfully")