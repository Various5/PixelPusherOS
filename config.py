#!/usr/bin/env python3
"""
Pixel Pusher OS - Configuration Settings
Centralized configuration management for the application.

This module handles all configuration settings including:
- Flask application settings
- Database configuration
- File system paths
- Game highscore file locations
- Environment-specific settings
"""

import os
import json
import logging

# Setup comprehensive logging for debugging and monitoring
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)


class Config:
    """
    Main configuration class for Pixel Pusher OS.
    Contains all application settings and paths.
    """

    # Flask Application Settings
    SECRET_KEY = os.environ.get('SECRET_KEY') or "pixel_pusher_secret_key_2024"
    JSONIFY_PRETTYPRINT_REGULAR = False  # Disable pretty JSON for performance

    # Database Configuration
    # Uses SQLite by default, can be overridden with DATABASE_URL environment variable
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///pixel_pusher_users.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # Disable event system for performance

    # File System Configuration
    # Base directory for user files and data storage
    BASE_DIR = os.path.abspath(os.path.expanduser("pixel-pusher-files"))

    # Ensure base directory exists
    os.makedirs(BASE_DIR, exist_ok=True)
    print(f"📁 File storage directory: {BASE_DIR}")

    # Game Highscore File Locations
    # Each game has its own JSON file for persistent highscores
    HIGHSCORE_FILES = {
        'dino': os.path.join(BASE_DIR, 'dino_scores.json'),
        'snake': os.path.join(BASE_DIR, 'snake_scores.json'),
        'clicker': os.path.join(BASE_DIR, 'clicker_scores.json'),
        'memory': os.path.join(BASE_DIR, 'memory_scores.json')
    }

    # Application Metadata
    APP_NAME = "Pixel Pusher OS"
    APP_VERSION = "2.0.0"
    APP_DESCRIPTION = "A modern web-based desktop environment"

    # Security Settings
    SESSION_PERMANENT = False
    PERMANENT_SESSION_LIFETIME = 3600  # 1 hour session timeout

    # Create highscore files if they don't exist
    for game_name, file_path in HIGHSCORE_FILES.items():
        if not os.path.exists(file_path):
            try:
                with open(file_path, 'w') as f:
                    json.dump([], f)  # Initialize with empty array
                print(f"✅ Created highscore file: {game_name}")
            except Exception as e:
                print(f"❌ Failed to create {game_name} highscore file: {e}")


class DevelopmentConfig(Config):
    """
    Development-specific configuration.
    Used during development with debug features enabled.
    """
    DEBUG = True
    TESTING = False

    # Development database (separate from production)
    SQLALCHEMY_DATABASE_URI = 'sqlite:///pixel_pusher_dev.db'

    # Enable Flask debug toolbar and detailed error pages
    SQLALCHEMY_ECHO = True  # Log all SQL queries


class ProductionConfig(Config):
    """
    Production-specific configuration.
    Used in production with security and performance optimizations.
    """
    DEBUG = False
    TESTING = False

    # Use PostgreSQL or MySQL in production
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
                              'sqlite:///pixel_pusher_production.db'

    # Security enhancements for production
    SESSION_COOKIE_SECURE = True  # Only send cookies over HTTPS
    SESSION_COOKIE_HTTPONLY = True  # Prevent XSS attacks
    SESSION_COOKIE_SAMESITE = 'Lax'  # CSRF protection


class TestingConfig(Config):
    """
    Testing-specific configuration.
    Used during automated testing.
    """
    TESTING = True
    DEBUG = True

    # Use in-memory database for fast testing
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

    # Disable CSRF protection for testing
    WTF_CSRF_ENABLED = False


# Configuration dictionary for easy access
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}


# Helper function to get current configuration
def get_config():
    """
    Get the current configuration based on environment.
    Returns the appropriate config class.
    """
    config_name = os.environ.get('FLASK_ENV', 'development')
    return config.get(config_name, DevelopmentConfig)


# Print configuration info on import
print(f"🔧 Configuration loaded: {get_config().__name__}")