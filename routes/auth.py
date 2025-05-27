#!/usr/bin/env python3
"""
Pixel Pusher OS - Authentication Routes
Flask blueprint for user authentication (login, register, logout).
"""

from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash

from models import db, User, SystemLog

# Create blueprint
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """User login page and handler."""
    # Redirect if already logged in
    if current_user.is_authenticated:
        return redirect(url_for('desktop.index'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        remember = bool(request.form.get('remember'))

        # Validate input
        if not username or not password:
            flash('Please enter both username and password.', 'error')
            return render_template('login.html')

        # Find user
        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password) and user.is_active:
            # Login successful
            login_user(user, remember=remember)
            user.update_login_info()

            # Log successful login
            SystemLog.log_event(
                level='INFO',
                category='AUTH',
                action='login',
                message=f'User logged in: {username}',
                user=user,
                request=request
            )

            # Redirect to next page or dashboard
            next_page = request.args.get('next')
            if next_page:
                return redirect(next_page)
            return redirect(url_for('desktop.index'))
        else:
            # Login failed
            SystemLog.log_event(
                level='WARNING',
                category='AUTH',
                action='login_failed',
                message=f'Failed login attempt: {username}',
                request=request
            )

            flash('Invalid username or password.', 'error')

    return render_template('login.html')


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """User registration page and handler."""
    # Redirect if already logged in
    if current_user.is_authenticated:
        return redirect(url_for('desktop.index'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        group = request.form.get('group', 'User')

        # Validate input
        errors = []

        if not username:
            errors.append('Username is required.')
        elif len(username) < 3:
            errors.append('Username must be at least 3 characters long.')
        elif len(username) > 80:
            errors.append('Username must be less than 80 characters.')
        elif User.query.filter_by(username=username).first():
            errors.append('Username already exists.')

        if not password:
            errors.append('Password is required.')
        elif len(password) < 4:
            errors.append('Password must be at least 4 characters long.')
        elif len(password) > 128:
            errors.append('Password must be less than 128 characters.')

        if password != confirm_password:
            errors.append('Passwords do not match.')

        if group not in ['User', 'Admin']:
            group = 'User'

        if errors:
            for error in errors:
                flash(error, 'error')
            return render_template('register.html')

        try:
            # Create new user
            user = User(
                username=username,
                password=password,
                group=group
            )

            db.session.add(user)
            db.session.commit()

            # Log successful registration
            SystemLog.log_event(
                level='INFO',
                category='AUTH',
                action='register',
                message=f'New user registered: {username}',
                user=user,
                request=request
            )

            flash('Account created successfully! You can now log in.', 'success')
            return redirect(url_for('auth.login'))

        except Exception as e:
            db.session.rollback()
            flash('Registration failed. Please try again.', 'error')
            print(f"Registration error: {e}")

    return render_template('register.html')


@auth_bp.route('/logout')
@login_required
def logout():
    """User logout handler."""
    # Log logout
    SystemLog.log_event(
        level='INFO',
        category='AUTH',
        action='logout',
        message=f'User logged out: {current_user.username}',
        user=current_user,
        request=request
    )

    logout_user()
    flash('You have been logged out successfully.', 'info')
    return redirect(url_for('auth.login'))


print("🔐 Authentication routes loaded successfully")