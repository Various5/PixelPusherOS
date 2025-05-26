#!/usr/bin/env python3
"""
Pixel Pusher OS - Authentication Routes
Handles user authentication, registration, and session management.

This module provides:
- User registration with validation
- User login with session management
- User logout with session cleanup
- Password security and validation
- Flash message feedback
"""

from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_user, login_required, logout_user, current_user
from datetime import datetime

from models import db, User

# Create authentication blueprint for modular route organization
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """
    User registration endpoint.

    GET: Display registration form
    POST: Process registration form and create new user account

    Includes comprehensive validation and security checks.
    """
    # Redirect if user is already logged in
    if current_user.is_authenticated:
        flash('You are already logged in!', 'info')
        return redirect(url_for('desktop.index'))

    if request.method == 'POST':
        # Extract form data
        username = request.form['username'].strip()
        password = request.form['password']
        confirm_password = request.form.get('confirm_password', '')
        group = request.form.get('group', 'User')

        # Input validation
        errors = []

        if not username or not password:
            errors.append('Username and password are required')

        if len(username) < 3:
            errors.append('Username must be at least 3 characters long')
        elif len(username) > 80:
            errors.append('Username must be less than 80 characters')

        if len(password) < 4:
            errors.append('Password must be at least 4 characters long')
        elif len(password) > 128:
            errors.append('Password must be less than 128 characters')

        # Check for password confirmation if provided
        if confirm_password and password != confirm_password:
            errors.append('Passwords do not match')

        # Validate username format (alphanumeric and underscore only)
        if not username.replace('_', '').isalnum():
            errors.append('Username can only contain letters, numbers, and underscores')

        # Check if username already exists
        if User.query.filter_by(username=username).first():
            errors.append('Username already taken. Please choose another.')

        # Validate group selection
        valid_groups = ['User', 'Admin']
        if group not in valid_groups:
            group = 'User'  # Default to User if invalid

        # Display errors if any
        if errors:
            for error in errors:
                flash(error, 'error')
            return render_template('register.html')

        try:
            # Create new user account
            new_user = User(
                username=username,
                group=group
            )
            new_user.set_password(password)

            # Save to database
            db.session.add(new_user)
            db.session.commit()

            flash(f'Registration successful! Welcome to Pixel Pusher OS, {username}!', 'success')
            print(f"👤 New user registered: {username} ({group})")

            # Redirect to login page
            return redirect(url_for('auth.login'))

        except Exception as e:
            # Handle database errors
            db.session.rollback()
            flash('Registration failed. Please try again.', 'error')
            print(f"❌ Registration error: {e}")
            return render_template('register.html')

    # GET request - display registration form
    return render_template('register.html')


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """
    User login endpoint.

    GET: Display login form
    POST: Process login credentials and create user session

    Supports "Remember Me" functionality and handles failed login attempts.
    """
    # Redirect if user is already logged in
    if current_user.is_authenticated:
        flash(f'Welcome back, {current_user.username}!', 'info')
        return redirect(url_for('desktop.index'))

    if request.method == 'POST':
        # Extract form data
        username = request.form['username'].strip()
        password = request.form['password']
        remember = bool(request.form.get('remember'))  # "Remember Me" checkbox

        # Input validation
        if not username or not password:
            flash('Please enter both username and password', 'error')
            return render_template('login.html')

        # Find user in database
        user = User.query.filter_by(username=username).first()

        # Verify credentials
        if not user or not user.check_password(password):
            flash('Invalid username or password', 'error')
            print(f"🔐 Failed login attempt for: {username}")
            return render_template('login.html')

        # Check if account is active
        if not user.is_active_user():
            flash('Your account has been disabled. Please contact support.', 'error')
            print(f"🚫 Disabled account login attempt: {username}")
            return render_template('login.html')

        try:
            # Update last login timestamp
            user.update_last_login()

            # Create user session
            login_user(user, remember=remember)

            flash(f'Welcome to Pixel Pusher OS, {user.username}!', 'success')
            print(f"✅ Successful login: {username} ({user.group})")

            # Redirect to requested page or dashboard
            next_page = request.args.get('next')
            if next_page:
                return redirect(next_page)
            else:
                return redirect(url_for('desktop.index'))

        except Exception as e:
            # Handle session creation errors
            flash('Login failed. Please try again.', 'error')
            print(f"❌ Login error for {username}: {e}")
            return render_template('login.html')

    # GET request - display login form
    return render_template('login.html')


@auth_bp.route('/logout')
@login_required
def logout():
    """
    User logout endpoint.

    Terminates the user session and redirects to login page.
    Includes session cleanup and user feedback.
    """
    try:
        username = current_user.username if current_user.is_authenticated else 'Unknown'

        # Terminate user session
        logout_user()

        flash(f'You have been logged out successfully. Goodbye!', 'info')
        print(f"👋 User logged out: {username}")

        return redirect(url_for('auth.login'))

    except Exception as e:
        # Handle logout errors gracefully
        print(f"❌ Logout error: {e}")
        flash('Logout completed', 'info')
        return redirect(url_for('auth.login'))


@auth_bp.route('/profile')
@login_required
def profile():
    """
    User profile page (optional feature).
    Displays user information and account settings.
    """
    return render_template('profile.html', user=current_user)


# Error handlers for authentication blueprint
@auth_bp.errorhandler(401)
def unauthorized(error):
    """Handle unauthorized access attempts"""
    flash('Please log in to access this page', 'warning')
    return redirect(url_for('auth.login'))


@auth_bp.errorhandler(403)
def forbidden(error):
    """Handle forbidden access attempts"""
    flash('You do not have permission to access this page', 'error')
    return redirect(url_for('desktop.index'))


# Helper functions for authentication
def is_safe_url(target):
    """
    Check if a redirect URL is safe to prevent open redirect attacks.

    Args:
        target (str): URL to validate

    Returns:
        bool: True if URL is safe for redirect
    """
    # Simple validation - in production, use more robust validation
    if not target:
        return False

    # Prevent external redirects
    if target.startswith('http://') or target.startswith('https://'):
        return False

    # Prevent malicious redirects
    dangerous_patterns = ['javascript:', 'data:', 'vbscript:']
    for pattern in dangerous_patterns:
        if target.lower().startswith(pattern):
            return False

    return True


print("🔐 Authentication routes loaded successfully")