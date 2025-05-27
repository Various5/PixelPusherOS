"""
Pixel Pusher OS - Routes Package
This package contains all Flask blueprint modules for routing.
"""

# Import blueprints for easy access
# Note: Import only when needed to avoid circular imports

def get_auth_blueprint():
    """Get authentication blueprint."""
    from .auth import auth_bp
    return auth_bp

def get_desktop_blueprint():
    """Get desktop blueprint."""
    from .desktop import desktop_bp
    return desktop_bp

def get_api_blueprint():
    """Get API blueprint."""
    from .api import api_bp
    return api_bp

# Package info
__version__ = '2.0.0'
__author__ = 'Pixel Pusher OS Team'