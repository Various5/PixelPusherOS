#!/usr/bin/env python3
"""
Pixel Pusher OS - Setup Script
Creates necessary directories and files for the application.
"""

import os
import sys
from pathlib import Path


def create_directory_structure():
    """Create the necessary directory structure for Pixel Pusher OS."""

    directories = [
        'templates/errors',
        'static/css',
        'static/js/core',
        'static/js/apps',
        'static/js/utils',
        'static/images',
        'static/uploads',
        'routes',
        'utils',
        'instance',
        'data',
        'logs'
    ]

    print("📁 Creating directory structure...")

    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"  ✅ Created: {directory}")

    print("✅ Directory structure created successfully")


def create_empty_init_files():
    """Create empty __init__.py files for Python packages."""

    init_files = [
        'routes/__init__.py',
        'utils/__init__.py'
    ]

    print("📝 Creating __init__.py files...")

    for init_file in init_files:
        if not os.path.exists(init_file):
            with open(init_file, 'w') as f:
                f.write('# Pixel Pusher OS Package\n')
            print(f"  ✅ Created: {init_file}")

    print("✅ __init__.py files created successfully")


def create_config_file():
    """Create config.py if it doesn't exist."""

    if os.path.exists('config.py'):
        print("⚠️  config.py already exists, skipping...")
        return

    print("⚙️  Creating config.py...")

    config_content = '''#!/usr/bin/env python3
"""
Pixel Pusher OS - Configuration
Application configuration settings and environment variables.
"""

import os
import secrets

class Config:
    """Base configuration class with common settings."""

    # Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(32)

    # Database Configuration
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \\
        f'sqlite:///{os.path.join(BASE_DIR, "instance", "pixelpusher.db")}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # File Upload Configuration
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

    # Session Configuration
    PERMANENT_SESSION_LIFETIME = 3600  # 1 hour
    SESSION_COOKIE_SECURE = False  # Set to True for HTTPS in production
    SESSION_COOKIE_HTTPONLY = True

    # Application Settings
    DEBUG = True
    TESTING = False

    # File System Security
    ALLOWED_EXTENSIONS = {
        'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'svg',
        'mp3', 'wav', 'mp4', 'avi', 'mov', 'zip', 'tar', 'gz'
    }

    # Terminal Settings
    MAX_COMMAND_HISTORY = 100
    TERMINAL_TIMEOUT = 300  # 5 minutes

    @staticmethod
    def init_app(app):
        """Initialize app with configuration."""
        # Create upload directory if it doesn't exist
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    SESSION_COOKIE_SECURE = True


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
'''

    with open('config.py', 'w') as f:
        f.write(config_content)

    print("  ✅ Created: config.py")


def create_requirements_file():
    """Create requirements.txt with necessary dependencies."""

    print("📋 Creating requirements.txt...")

    requirements = [
        "Flask==2.3.3",
        "Flask-SQLAlchemy==3.0.5",
        "Flask-Login==0.6.3",
        "Werkzeug==2.3.7",
        "Jinja2==3.1.2",
        "psutil==5.9.5",
        "python-dotenv==1.0.0"
    ]

    with open('requirements.txt', 'w') as f:
        f.write('\n'.join(requirements))
        f.write('\n')

    print("  ✅ Created: requirements.txt")


def create_gitignore():
    """Create .gitignore file."""

    print("📝 Creating .gitignore...")

    gitignore_content = '''# Pixel Pusher OS - Git Ignore File

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environment
venv/
env/
ENV/

# Flask
instance/
.flaskenv
*.db
*.sqlite

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Uploads
static/uploads/*
!static/uploads/.gitkeep

# Environment
.env
.env.local
.env.production

# Testing
.coverage
htmlcov/
.pytest_cache/
'''

    with open('.gitignore', 'w') as f:
        f.write(gitignore_content)

    print("  ✅ Created: .gitignore")


def create_gitkeep_files():
    """Create .gitkeep files for empty directories."""

    print("📂 Creating .gitkeep files...")

    gitkeep_dirs = [
        'static/uploads',
        'logs',
        'instance'
    ]

    for directory in gitkeep_dirs:
        gitkeep_path = os.path.join(directory, '.gitkeep')
        if not os.path.exists(gitkeep_path):
            with open(gitkeep_path, 'w') as f:
                f.write('# Keep this directory in git\n')
            print(f"  ✅ Created: {gitkeep_path}")


def check_python_version():
    """Check if Python version is compatible."""

    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        print(f"   Current version: {sys.version}")
        return False

    print(f"✅ Python version: {sys.version.split()[0]} (Compatible)")
    return True


def main():
    """Main setup function."""

    print("🎨 Pixel Pusher OS Setup Script")
    print("=" * 50)

    # Check Python version
    if not check_python_version():
        sys.exit(1)

    # Create directory structure
    create_directory_structure()

    # Create Python package files
    create_empty_init_files()

    # Create configuration
    create_config_file()

    # Create requirements file
    create_requirements_file()

    # Create git files
    create_gitignore()
    create_gitkeep_files()

    print("\n🎉 Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Install dependencies: pip install -r requirements.txt")
    print("2. Make sure you have all the required files:")
    print("   - models.py (database models)")
    print("   - app.py (main Flask application)")
    print("   - templates/ (HTML templates)")
    print("   - static/ (CSS, JS, images)")
    print("   - routes/ (Flask blueprints)")
    print("3. Run the application: python app.py")
    print("\n🌐 The application will be available at: http://localhost:5000")
    print("👤 Demo accounts: admin/admin, user/user, demo/demo")


if __name__ == '__main__':
    main()