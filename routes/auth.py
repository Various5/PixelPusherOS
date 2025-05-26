#!/usr/bin/env python3
"""
Pixel Pusher OS - Authentication Routes
Flask blueprint for handling user authentication, registration, and session management.
"""

from flask import Blueprint, request, render_template, redirect, url_for, flash, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash
from models import db, User, UserSession, ApplicationLog
from datetime import datetime
import secrets

# Create authentication blueprint
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """
    Handle user login - both GET (show form) and POST (process login)
    """
    # If user is already logged in, redirect to desktop
    if current_user.is_authenticated:
        return redirect(url_for('desktop.index'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        remember = bool(request.form.get('remember'))

        # Validation
        errors = []
        if not username:
            errors.append('Username is required')
        elif len(username) < 3:
            errors.append('Username must be at least 3 characters')

        if not password:
            errors.append('Password is required')
        elif len(password) < 4:
            errors.append('Password must be at least 4 characters')

        if errors:
            for error in errors:
                flash(error, 'error')
            return render_template('login.html'), 400

        # Find user and check password
        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password) and user.is_active:
            # Successful login
            login_user(user, remember=remember)
            user.update_last_login()

            # Create session record
            session_id = secrets.token_urlsafe(32)
            user_session = UserSession(
                user_id=user.id,
                session_id=session_id,
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent', '')
            )
            db.session.add(user_session)

            # Log successful login
            ApplicationLog.log_event(
                level='INFO',
                category='AUTH',
                message=f'User {username} logged in successfully',
                user_id=user.id,
                ip_address=request.remote_addr,
                details={
                    'remember': remember,
                    'user_agent': request.headers.get('User-Agent', '')
                }
            )

            try:
                db.session.commit()
                flash(f'Welcome back, {user.username}!', 'success')

                # Redirect to requested page or dashboard
                next_page = request.args.get('next')
                if next_page:
                    return redirect(next_page)
                return redirect(url_for('desktop.index'))

            except Exception as e:
                db.session.rollback()
                print(f"Login session error: {e}")
                flash('Login successful, but session recording failed', 'warning')
                return redirect(url_for('desktop.index'))

        else:
            # Failed login
            ApplicationLog.log_event(
                level='WARNING',
                category='AUTH',
                message=f'Failed login attempt for username: {username}',
                ip_address=request.remote_addr,
                details={
                    'username': username,
                    'user_exists': user is not None,
                    'user_active': user.is_active if user else None
                }
            )

            flash('Invalid username or password', 'error')
            return render_template('login.html'), 401

    # GET request - show login form
    return render_template('login.html')


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """
    Handle user registration - both GET (show form) and POST (process registration)
    """
    # If user is already logged in, redirect to desktop
    if current_user.is_authenticated:
        return redirect(url_for('desktop.index'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        group = request.form.get('group', 'User')

        # Validation
        errors = []

        # Username validation
        if not username:
            errors.append('Username is required')
        elif len(username) < 3:
            errors.append('Username must be at least 3 characters')
        elif len(username) > 80:
            errors.append('Username must be less than 80 characters')
        elif not username.replace('_', '').isalnum():
            errors.append('Username can only contain letters, numbers, and underscores')
        elif User.query.filter_by(username=username).first():
            errors.append('Username already exists')

        # Password validation
        if not password:
            errors.append('Password is required')
        elif len(password) < 4:
            errors.append('Password must be at least 4 characters')
        elif len(password) > 128:
            errors.append('Password must be less than 128 characters')

        # Password confirmation
        if password != confirm_password:
            errors.append('Passwords do not match')

        # Group validation
        if group not in ['User', 'Admin']:
            group = 'User'  # Default to User if invalid

        if errors:
            for error in errors:
                flash(error, 'error')
            return render_template('register.html'), 400

        # Create new user
        try:
            new_user = User(username=username, password=password, group=group)
            db.session.add(new_user)
            db.session.commit()

            # Log successful registration
            ApplicationLog.log_event(
                level='INFO',
                category='AUTH',
                message=f'New user registered: {username}',
                user_id=new_user.id,
                ip_address=request.remote_addr,
                details={
                    'group': group,
                    'user_agent': request.headers.get('User-Agent', '')
                }
            )

            flash('Account created successfully! Please log in.', 'success')
            return redirect(url_for('auth.login'))

        except Exception as e:
            db.session.rollback()
            print(f"Registration error: {e}")
            flash('Registration failed. Please try again.', 'error')
            return render_template('register.html'), 500

    # GET request - show registration form
    return render_template('register.html')


@auth_bp.route('/logout')
@login_required
def logout():
    """
    Handle user logout
    """
    user_id = current_user.id
    username = current_user.username

    # Update active session records
    try:
        active_sessions = UserSession.query.filter_by(
            user_id=user_id,
            is_active=True
        ).all()

        for session_record in active_sessions:
            session_record.logout_time = datetime.utcnow()
            session_record.is_active = False

        # Log logout
        ApplicationLog.log_event(
            level='INFO',
            category='AUTH',
            message=f'User {username} logged out',
            user_id=user_id,
            ip_address=request.remote_addr
        )

        db.session.commit()

    except Exception as e:
        db.session.rollback()
        print(f"Logout session update error: {e}")

    # Perform logout
    logout_user()
    session.clear()  # Clear any additional session data

    flash('You have been logged out successfully', 'info')
    return redirect(url_for('auth.login'))


@auth_bp.route('/profile')
@login_required
def profile():
    """
    Show user profile information
    """
    user_data = current_user.to_dict()

    # Get recent login sessions
    recent_sessions = UserSession.query.filter_by(
        user_id=current_user.id
    ).order_by(UserSession.login_time.desc()).limit(10).all()

    # Get game statistics if available
    from models import GameScore
    game_stats = {}
    try:
        high_scores = GameScore.query.filter_by(
            user_id=current_user.id,
            is_high_score=True
        ).all()

        for score in high_scores:
            game_stats[score.game_name] = {
                'high_score': score.score,
                'level': score.level,
                'date': score.timestamp.isoformat()
            }
    except Exception as e:
        print(f"Error loading game stats: {e}")

    return jsonify({
        'user': user_data,
        'recent_sessions': [
            {
                'login_time': session.login_time.isoformat(),
                'logout_time': session.logout_time.isoformat() if session.logout_time else None,
                'ip_address': session.ip_address,
                'is_active': session.is_active
            }
            for session in recent_sessions
        ],
        'game_stats': game_stats
    })


@auth_bp.route('/change_password', methods=['POST'])
@login_required
def change_password():
    """
    Handle password change requests
    """
    data = request.get_json() or request.form

    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    confirm_password = data.get('confirm_password', '')

    # Validation
    errors = []

    if not current_password:
        errors.append('Current password is required')
    elif not current_user.check_password(current_password):
        errors.append('Current password is incorrect')

    if not new_password:
        errors.append('New password is required')
    elif len(new_password) < 4:
        errors.append('New password must be at least 4 characters')
    elif len(new_password) > 128:
        errors.append('New password must be less than 128 characters')

    if new_password != confirm_password:
        errors.append('New passwords do not match')

    if current_password == new_password:
        errors.append('New password must be different from current password')

    if errors:
        return jsonify({'success': False, 'errors': errors}), 400

    # Update password
    try:
        current_user.set_password(new_password)
        db.session.commit()

        # Log password change
        ApplicationLog.log_event(
            level='INFO',
            category='AUTH',
            message=f'User {current_user.username} changed password',
            user_id=current_user.id,
            ip_address=request.remote_addr
        )

        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        })

    except Exception as e:
        db.session.rollback()
        print(f"Password change error: {e}")
        return jsonify({
            'success': False,
            'errors': ['Failed to change password. Please try again.']
        }), 500


@auth_bp.route('/delete_account', methods=['POST'])
@login_required
def delete_account():
    """
    Handle account deletion requests (with confirmation)
    """
    data = request.get_json() or request.form
    password = data.get('password', '')
    confirm_text = data.get('confirm_text', '')

    # Validation
    if not password:
        return jsonify({
            'success': False,
            'error': 'Password is required to delete account'
        }), 400

    if not current_user.check_password(password):
        return jsonify({
            'success': False,
            'error': 'Incorrect password'
        }), 401

    if confirm_text.lower() != 'delete my account':
        return jsonify({
            'success': False,
            'error': 'Please type "delete my account" to confirm'
        }), 400

    # Prevent admin from deleting their own account if they're the only admin
    if current_user.is_admin():
        admin_count = User.query.filter_by(group='Admin', is_active=True).count()
        if admin_count <= 1:
            return jsonify({
                'success': False,
                'error': 'Cannot delete the last admin account'
            }), 400

    try:
        user_id = current_user.id
        username = current_user.username

        # Log account deletion before deleting
        ApplicationLog.log_event(
            level='WARNING',
            category='AUTH',
            message=f'User {username} deleted their account',
            user_id=user_id,
            ip_address=request.remote_addr
        )

        # Deactivate instead of hard delete to preserve data integrity
        current_user.is_active = False
        current_user.username = f"deleted_{user_id}_{username}"

        # Deactivate all sessions
        UserSession.query.filter_by(user_id=user_id).update({
            'is_active': False,
            'logout_time': datetime.utcnow()
        })

        db.session.commit()

        # Logout user
        logout_user()
        session.clear()

        return jsonify({
            'success': True,
            'message': 'Account deleted successfully'
        })

    except Exception as e:
        db.session.rollback()
        print(f"Account deletion error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to delete account. Please try again.'
        }), 500


# Error handlers for authentication blueprint
@auth_bp.errorhandler(401)
def unauthorized(error):
    """Handle unauthorized access"""
    if request.is_json:
        return jsonify({'error': 'Unauthorized access'}), 401
    return redirect(url_for('auth.login'))


@auth_bp.errorhandler(403)
def forbidden(error):
    """Handle forbidden access"""
    if request.is_json:
        return jsonify({'error': 'Access forbidden'}), 403
    flash('Access denied', 'error')
    return redirect(url_for('desktop.index'))


print("🔐 Authentication routes loaded successfully")