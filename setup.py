#!/usr/bin/env python3
"""
Quick Fix Script for Pixel Pusher OS
This script fixes the current import issues and sets up missing files.
"""

import os
import sys


def create_missing_files():
    """Create any missing critical files."""

    print("🔧 Creating missing files...")

    # Create basic config.py if it doesn't exist
    if not os.path.exists('config.py'):
        print("  📝 Creating config.py...")
        config_content = '''#!/usr/bin/env python3
"""
Pixel Pusher OS - Configuration
"""

import os
import secrets

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(32)
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or f'sqlite:///{os.path.join(BASE_DIR, "instance", "pixelpusher.db")}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'mp3', 'wav', 'mp4', 'avi', 'mov', 'zip'}
'''
        with open('config.py', 'w') as f:
            f.write(config_content)

    # Create basic templates if they don't exist
    template_files = {
        'templates/base.html': '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}Pixel Pusher OS{% endblock %}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
    </style>
    {% block extra_css %}{% endblock %}
</head>
<body class="{% block body_class %}{% endblock %}">
    {% block content %}{% endblock %}
    {% block extra_js %}{% endblock %}
</body>
</html>''',

        'templates/desktop.html': '''{% extends "base.html" %}
{% block title %}Desktop - Pixel Pusher OS{% endblock %}
{% block content %}
<div id="desktop" class="desktop">
    <h1>🎨 Pixel Pusher OS Desktop</h1>
    <p>Welcome, {{ user.username }}!</p>
    <div class="desktop-icons">
        <div class="icon" onclick="alert('Terminal clicked')">💻 Terminal</div>
        <div class="icon" onclick="alert('Explorer clicked')">📁 File Explorer</div>
        <div class="icon" onclick="alert('Games clicked')">🎮 Games</div>
        <div class="icon" onclick="alert('Settings clicked')">⚙️ Settings</div>
    </div>
</div>
<style>
    .desktop { min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .desktop-icons { display: flex; gap: 20px; margin-top: 50px; }
    .icon { padding: 20px; background: rgba(255,255,255,0.2); border-radius: 10px; cursor: pointer; color: white; }
    .icon:hover { background: rgba(255,255,255,0.3); }
</style>
{% endblock %}''',

        'templates/browser.html': '''{% extends "base.html" %}
{% block content %}
<h1>🌐 Web Browser</h1>
<p>Browser functionality would go here.</p>
{% endblock %}''',

        'templates/word.html': '''{% extends "base.html" %}
{% block content %}
<h1>📝 Word Processor</h1>
<p>Word processor functionality would go here.</p>
{% endblock %}''',

        'templates/excel.html': '''{% extends "base.html" %}
{% block content %}
<h1>📊 Spreadsheet</h1>
<p>Spreadsheet functionality would go here.</p>
{% endblock %}''',

        'templates/settings.html': '''{% extends "base.html" %}
{% block content %}
<h1>⚙️ Settings</h1>
<p>Settings functionality would go here.</p>
{% endblock %}''',

        'templates/games.html': '''{% extends "base.html" %}
{% block content %}
<h1>🎮 Games</h1>
<p>Games functionality would go here.</p>
{% endblock %}''',

        'templates/about.html': '''{% extends "base.html" %}
{% block content %}
<h1>ℹ️ About Pixel Pusher OS</h1>
<p>A modern web-based desktop environment.</p>
{% endblock %}'''
    }

    for filepath, content in template_files.items():
        if not os.path.exists(filepath):
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"  ✅ Created: {filepath}")


def test_imports():
    """Test if all imports work."""
    print("\n🧪 Testing imports...")

    try:
        # Test models import
        from models import db, User, SystemLog, GameScore
        print("  ✅ Models import successful")

        # Test config import
        from config import Config
        print("  ✅ Config import successful")

        # Test Flask import
        from flask import Flask
        print("  ✅ Flask import successful")

        # Test routes import (if they exist)
        try:
            from routes.auth import auth_bp
            print("  ✅ Auth routes import successful")
        except ImportError as e:
            print(f"  ⚠️  Auth routes import failed: {e}")

        try:
            from routes.desktop import desktop_bp
            print("  ✅ Desktop routes import successful")
        except ImportError as e:
            print(f"  ⚠️  Desktop routes import failed: {e}")

        try:
            from routes.api import api_bp
            print("  ✅ API routes import successful")
        except ImportError as e:
            print(f"  ⚠️  API routes import failed: {e}")

        return True

    except Exception as e:
        print(f"  ❌ Import test failed: {e}")
        return False


def check_flask_app():
    """Test Flask app creation."""
    print("\n🚀 Testing Flask app creation...")

    try:
        # Try to create the app
        from app import create_app
        app = create_app()
        print("  ✅ Flask app creation successful")

        # Test app context
        with app.app_context():
            from models import db
            print("  ✅ Database context successful")

        return True

    except Exception as e:
        print(f"  ❌ Flask app test failed: {e}")
        return False


def main():
    """Main fix function."""
    print("🔧 Pixel Pusher OS - Quick Fix Script")
    print("=" * 50)

    # Create missing files
    create_missing_files()

    # Test imports
    import_success = test_imports()

    # Test Flask app if imports work
    if import_success:
        app_success = check_flask_app()

        if app_success:
            print("\n🎉 All tests passed! Try running: python app.py")
        else:
            print("\n⚠️  App creation failed, but basic imports work")
    else:
        print("\n❌ Import issues remain - check error messages above")

    print("\n📋 Quick Start:")
    print("1. Make sure all provided files are in place")
    print("2. Run: pip install flask flask-sqlalchemy flask-login werkzeug")
    print("3. Run: python app.py")
    print("4. Open: http://localhost:5000")


if __name__ == '__main__':
    main()