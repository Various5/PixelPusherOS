#!/usr/bin/env python3
"""
Pixel Pusher OS - Authentication Routes
Handles user login, registration, logout, and session management
"""

from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash
from datetime import datetime
import re

from models import db, User, UserSession, SystemLog

# Create authentication blueprint
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """
    User login page and authentication handling.
    GET: Display login form
    POST: Process login credentials
    """

    # Redirect if already logged in
    if current_user.is_authenticated:
        return redirect(url_for('desktop.index'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        remember = bool(request.form.get('remember'))

        # Get client information for logging
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        user_agent = request.headers.get('User-Agent', '')

        # Validate input
        if not username or not password:
            flash('Please enter both username and password.', 'error')
            SystemLog.log_action('login_attempt_failed',
                                 f'Missing credentials for username: {username}',
                                 ip_address=ip_address, user_agent=user_agent)
            return render_template('login.html')

        # Find user
        user = User.query.filter_by(username=username).first()

        if user and user.is_active and user.check_password(password):
            # Successful login
            login_user(user, remember=remember)

            # Update user login statistics
            user.update_last_login()

            # Create session record
            session_record = UserSession(
                user_id=user.id,
                session_id=session.get('_id', ''),
                ip_address=ip_address,
                user_agent=user_agent
            )
            db.session.add(session_record)
            db.session.commit()

            # Log successful login
            SystemLog.log_action('login_success',
                                 f'User {username} logged in successfully',
                                 user_id=user.id,
                                 ip_address=ip_address,
                                 user_agent=user_agent)

            flash(f'Welcome back, {user.username}!', 'success')

            # Redirect to next page or desktop
            next_page = request.args.get('next')
            if next_page:
                return redirect(next_page)
            return redirect(url_for('desktop.index'))

        else:
            # Failed login
            flash('Invalid username or password.', 'error')
            SystemLog.log_action('login_attempt_failed',
                                 f'Invalid credentials for username: {username}',
                                 ip_address=ip_address,
                                 user_agent=user_agent,
                                 level='WARNING')

    return render_template('login.html')


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """
    User registration page and account creation.
    GET: Display registration form
    POST: Process new user registration
    """

    # Redirect if already logged in
    if current_user.is_authenticated:
        return redirect(url_for('desktop.index'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        user_group = request.form.get('group', 'User')
        email = request.form.get('email', '').strip()

        # Get client information for logging
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        user_agent = request.headers.get('User-Agent', '')

        # Validation
        errors = []

        # Username validation
        if not username:
            errors.append('Username is required.')
        elif len(username) < 3:
            errors.append('Username must be at least 3 characters long.')
        elif len(username) > 80:
            errors.append('Username must be less than 80 characters.')
        elif not re.match(r'^[a-zA-Z0-9_]+$', username):
            errors.append('Username can only contain letters, numbers, and underscores.')
        elif User.query.filter_by(username=username).first():
            errors.append('Username already exists. Please choose a different one.')

        # Password validation
        if not password:
            errors.append('Password is required.')
        elif len(password) < 4:
            errors.append('Password must be at least 4 characters long.')
        elif len(password) > 128:
            errors.append('Password must be less than 128 characters.')

        # Password confirmation
        if password != confirm_password:
            errors.append('Passwords do not match.')

        # Email validation (optional)
        if email:
            email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
            if not re.match(email_regex, email):
                errors.append('Please enter a valid email address.')
            elif User.query.filter_by(email=email).first():
                errors.append('Email already registered. Please use a different email.')

        # User group validation
        if user_group not in ['User', 'Admin']:
            user_group = 'User'

        # If validation passed, create user
        if not errors:
            try:
                # Create new user
                new_user = User(
                    username=username,
                    password=password,
                    user_group=user_group,
                    email=email if email else None
                )

                # Set default preferences
                default_preferences = {
                    'theme': 'default',
                    'wallpaper': '',
                    'fontSize': 14,
                    'animations': True,
                    'soundEnabled': True,
                    'autoSave': True,
                    'explorerViewMode': 'list',
                    'terminalTheme': 'green'
                }
                new_user.set_preferences(default_preferences)

                db.session.add(new_user)
                db.session.commit()

                # Log successful registration
                SystemLog.log_action('user_registered',
                                     f'New user registered: {username} ({user_group})',
                                     user_id=new_user.id,
                                     ip_address=ip_address,
                                     user_agent=user_agent)

                flash(f'Account created successfully! Welcome to Pixel Pusher OS, {username}!', 'success')

                # Auto-login the new user
                login_user(new_user)
                new_user.update_last_login()

                # Create session record
                session_record = UserSession(
                    user_id=new_user.id,
                    session_id=session.get('_id', ''),
                    ip_address=ip_address,
                    user_agent=user_agent
                )
                db.session.add(session_record)
                db.session.commit()

                return redirect(url_for('desktop.index'))

            except Exception as e:
                db.session.rollback()
                errors.append('An error occurred while creating your account. Please try again.')
                SystemLog.log_action('registration_error',
                                     f'Registration failed for {username}: {str(e)}',
                                     ip_address=ip_address,
                                     user_agent=user_agent,
                                     level='ERROR')

        # Show validation errors
        for error in errors:
            flash(error, 'error')

    return render_template('register.html')


@auth_bp.route('/logout')
@login_required
def logout():
    """
    User logout and session cleanup.
    Logs out the current user and cleans up session data.
    """

    # Get user info before logout
    username = current_user.username
    user_id = current_user.id

    # Get client information for logging
    ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    user_agent = request.headers.get('User-Agent', '')

    # Update user activity
    current_user.update_activity()

    # Deactivate current session
    session_id = session.get('_id', '')
    if session_id:
        user_session = UserSession.query.filter_by(
            user_id=user_id,
            session_id=session_id,
            is_active=True
        ).first()

        if user_session:
            user_session.deactivate()
            db.session.commit()

    # Log logout
    SystemLog.log_action('logout',
                         f'User {username} logged out',
                         user_id=user_id,
                         ip_address=ip_address,
                         user_agent=user_agent)

    # Perform logout
    logout_user()

    # Clear session data
    session.clear()

    flash('You have been logged out successfully.', 'info')
    return redirect(url_for('auth.login'))


@auth_bp.route('/profile')
@login_required
def profile():
    """
    User profile page showing account information and statistics.
    """

    # Get user statistics
    user_stats = current_user.get_stats()

    # Get recent activity
    recent_logs = SystemLog.query.filter_by(user_id=current_user.id) \
        .order_by(SystemLog.timestamp.desc()) \
        .limit(10) \
        .all()

    # Get game scores
    from models import GameScore
    recent_scores = GameScore.query.filter_by(user_id=current_user.id) \
        .order_by(GameScore.created_at.desc()) \
        .limit(5) \
        .all()

    return render_template('profile.html',
                           user=current_user,
                           stats=user_stats,
                           recent_logs=recent_logs,
                           recent_scores=recent_scores)


@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    """
    Change user password.
    Requires current password for security.
    """

    current_password = request.form.get('current_password', '')
    new_password = request.form.get('new_password', '')
    confirm_password = request.form.get('confirm_password', '')

    # Get client information for logging
    ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    user_agent = request.headers.get('User-Agent', '')

    # Validation
    errors = []

    if not current_password:
        errors.append('Current password is required.')
    elif not current_user.check_password(current_password):
        errors.append('Current password is incorrect.')

    if not new_password:
        errors.append('New password is required.')
    elif len(new_password) < 4:
        errors.append('New password must be at least 4 characters long.')
    elif len(new_password) > 128:
        errors.append('New password must be less than 128 characters.')

    if new_password != confirm_password:
        errors.append('New passwords do not match.')

    if current_password == new_password:
        errors.append('New password must be different from current password.')

    if not errors:
        try:
            # Update password
            current_user.set_password(new_password)
            current_user.update_activity()
            db.session.commit()

            # Log password change
            SystemLog.log_action('password_changed',
                                 f'User {current_user.username} changed password',
                                 user_id=current_user.id,
                                 ip_address=ip_address,
                                 user_agent=user_agent)

            flash('Password changed successfully!', 'success')

        except Exception as e:
            db.session.rollback()
            flash('An error occurred while changing your password. Please try again.', 'error')
            SystemLog.log_action('password_change_error',
                                 f'Password change failed for {current_user.username}: {str(e)}',
                                 user_id=current_user.id,
                                 ip_address=ip_address,
                                 user_agent=user_agent,
                                 level='ERROR')
    else:
        for error in errors:
            flash(error, 'error')

    return redirect(url_for('auth.profile'))


@auth_bp.route('/api/session-status')
@login_required
def session_status():
    """
    API endpoint to check current session status.
    Used by frontend for session management.
    """

    return jsonify({
        'authenticated': True,
        'user': {
            'id': current_user.id,
            'username': current_user.username,
            'user_group': current_user.user_group,
            'is_admin': current_user.is_admin(),
            'last_activity': current_user.last_activity.isoformat() if current_user.last_activity else None
        },
        'session': {
            'login_time': current_user.last_login.isoformat() if current_user.last_login else None,
            'active': True
        }
    })


@auth_bp.route('/api/update-preferences', methods=['POST'])
@login_required
def update_preferences():
    """
    API endpoint to update user preferences.
    Used by frontend settings system.
    """

    try:
        # Get JSON data
        preferences = request.get_json()

        if not preferences:
            return jsonify({'error': 'No preferences data provided'}), 400

        # Get current preferences and merge with new ones
        current_prefs = current_user.get_preferences()
        current_prefs.update(preferences)

        # Save updated preferences
        current_user.set_preferences(current_prefs)
        current_user.update_activity()

        # Log preference update
        SystemLog.log_action('preferences_updated',
                             f'User {current_user.username} updated preferences',
                             user_id=current_user.id)

        return jsonify({
            'success': True,
            'message': 'Preferences updated successfully',
            'preferences': current_prefs
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/api/user-stats')
@login_required
def user_stats():
    """
    API endpoint to get user statistics.
    Used by frontend for displaying user info.
    """

    try:
        stats = current_user.get_stats()

        # Add additional stats
        from models import GameScore
        game_stats = {}

        for game in ['snake', 'dino', 'memory', 'clicker']:
            high_score = GameScore.get_high_score(current_user.id, game)
            game_stats[game] = {
                'high_score': high_score,
                'games_played': GameScore.query.filter_by(
                    user_id=current_user.id,
                    game_name=game
                ).count()
            }

        return jsonify({
            'user_stats': stats,
            'game_stats': game_stats,
            'account_info': {
                'username': current_user.username,
                'user_group': current_user.user_group,
                'email': current_user.email,
                'created_at': current_user.created_at.isoformat(),
                'is_admin': current_user.is_admin()
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Error handlers for authentication blueprint
@auth_bp.errorhandler(401)
def unauthorized(error):
    """Handle unauthorized access attempts"""
    if request.is_json:
        return jsonify({'error': 'Authentication required'}), 401
    flash('Please log in to access this page.', 'error')
    return redirect(url_for('auth.login'))


@auth_bp.errorhandler(403)
def forbidden(error):
    """Handle forbidden access attempts"""
    if request.is_json:
        return jsonify({'error': 'Access forbidden'}), 403
    flash('You do not have permission to access this page.', 'error')
    return redirect(url_for('desktop.index'))


# Context processor for authentication templates
@auth_bp.context_processor
def inject_auth_context():
    """Inject authentication-related context into templates"""
    return {
        'current_user': current_user,
        'is_authenticated': current_user.is_authenticated if current_user else False
    }