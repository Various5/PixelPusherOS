#!/usr/bin/env python3
"""
Pixel Pusher OS - Routes Package
Blueprint registration and route organization
"""

# This file makes the routes directory a Python package
# and allows importing from the route modules

from .auth import auth_bp
from .desktop import desktop_bp
from .api import api_bp

__all__ = ['auth_bp', 'desktop_bp', 'api_bp']