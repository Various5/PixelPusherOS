#!/usr/bin/env python3
"""
Pixel Pusher OS - Configuration
Application configuration settings
"""

import os
import secrets


class Config:
    """Application configuration class"""

    # Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(32)

    # Database configuration
    basedir = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
                              'sqlite:///' + os.path.join(basedir, 'pixelpusher.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }

    # Session configuration
    PERMANENT_SESSION_LIFETIME = 3600  # 1 hour
    SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

    # File system configuration
    BASE_DIR = os.path.join(basedir, 'user_files')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file upload

    # Security settings
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = None

    # Application settings
    APP_NAME = 'Pixel Pusher OS'
    APP_VERSION = '2.0.0'
    DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

    # Logging configuration
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')

    # Default user settings
    DEFAULT_THEME = 'default'
    DEFAULT_WALLPAPER = None

    @staticmethod
    def init_app(app):
        """Initialize application with configuration"""

        # Create necessary directories
        os.makedirs(Config.BASE_DIR, exist_ok=True)

        # Create subdirectories for user files
        user_dirs = [
            'documents',
            'pictures',
            'music',
            'videos',
            'downloads',
            'desktop'
        ]

        for dirname in user_dirs:
            dir_path = os.path.join(Config.BASE_DIR, dirname)
            os.makedirs(dir_path, exist_ok=True)

        # Create sample files for demo
        Config.create_sample_files()

        print(f"✅ Configuration initialized")
        print(f"📁 User files directory: {Config.BASE_DIR}")

    @staticmethod
    def create_sample_files():
        """Create sample files for demo purposes"""

        # Sample text file
        readme_path = os.path.join(Config.BASE_DIR, 'README.txt')
        if not os.path.exists(readme_path):
            with open(readme_path, 'w', encoding='utf-8') as f:
                f.write("""Welcome to Pixel Pusher OS!

This is your personal file space. You can:

• Create, edit, and manage files
• Upload and download documents
• Use the terminal to navigate
• Play games and use applications
• Customize your desktop environment

Sample files are located in the subdirectories:
- documents/
- pictures/
- music/
- videos/
- downloads/

Enjoy exploring your web-based desktop environment!
""")

        # Sample files in documents
        docs_dir = os.path.join(Config.BASE_DIR, 'documents')

        sample_doc = os.path.join(docs_dir, 'sample_document.txt')
        if not os.path.exists(sample_doc):
            with open(sample_doc, 'w', encoding='utf-8') as f:
                f.write("""Sample Document

This is a sample text document to demonstrate the file system.

You can:
- Edit this file using the built-in text editor
- Create new documents
- Organize files in folders
- Access files through the terminal

The file explorer allows you to browse, preview, and manage all your files.
""")

        # Sample script file
        script_file = os.path.join(docs_dir, 'hello_world.py')
        if not os.path.exists(script_file):
            with open(script_file, 'w', encoding='utf-8') as f:
                f.write("""#!/usr/bin/env python3
\"\"\"
Sample Python Script
A simple hello world program to demonstrate code files.
\"\"\"

def main():
    print("Hello, World!")
    print("Welcome to Pixel Pusher OS!")

    # Show some system info
    import platform
    print(f"Platform: {platform.system()}")
    print(f"Python Version: {platform.python_version()}")

if __name__ == "__main__":
    main()
""")

        # Sample JSON configuration
        config_file = os.path.join(docs_dir, 'config.json')
        if not os.path.exists(config_file):
            import json
            sample_config = {
                "application": "Pixel Pusher OS",
                "version": "2.0.0",
                "settings": {
                    "theme": "default",
                    "language": "en",
                    "auto_save": True,
                    "notifications": True
                },
                "features": [
                    "Desktop Environment",
                    "File Management",
                    "Terminal Access",
                    "Games Center",
                    "Text Editor",
                    "Web Browser"
                ]
            }

            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(sample_config, f, indent=2)


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    SESSION_COOKIE_SECURE = True  # Require HTTPS

    # Use more secure settings in production
    @staticmethod
    def init_app(app):
        Config.init_app(app)

        # Additional production setup
        import logging
        from logging.handlers import RotatingFileHandler

        if not app.debug:
            # Set up file logging
            if not os.path.exists('logs'):
                os.mkdir('logs')

            file_handler = RotatingFileHandler(
                'logs/pixelpusher.log',
                maxBytes=10240000,
                backupCount=10
            )

            file_handler.setFormatter(logging.Formatter(
                '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
            ))

            file_handler.setLevel(logging.INFO)
            app.logger.addHandler(file_handler)
            app.logger.setLevel(logging.INFO)
            app.logger.info('Pixel Pusher OS startup')


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False


# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

print("✅ Configuration loaded successfully")