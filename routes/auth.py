#!/usr/bin/env python3
"""
Pixel Pusher OS - Authentication Routes
Fixed version to prevent recursion errors
"""

from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash
from models import User, db

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """Handle user login with proper session management"""

    # If user is already logged in, redirect to desktop
    if current_user.is_authenticated:
        return redirect(url_for('desktop.index'))

    if request.method == 'POST':
        try:
            username = request.form.get('username', '').strip()
            password = request.form.get('password', '')
            remember = bool(request.form.get('remember'))

            # Validation
            if not username or not password:
                flash('Please enter both username and password.', 'error')
                return render_template('login.html')

            # Find user in database
            user = User.query.filter_by(username=username).first()

            if user and check_password_hash(user.password_hash, password):
                # Login successful - establish session
                login_success = login_user(user, remember=remember)

                if not login_success:
                    flash('Login failed. Please try again.', 'error')
                    return render_template('login.html')

                # Update user's last login time
                user.update_last_login()
                db.session.commit()

                # Get next page from URL parameters
                next_page = request.args.get('next')

                # Validate next page to prevent open redirects
                if next_page and not next_page.startswith('/'):
                    next_page = None

                # Redirect to requested page or desktop
                if next_page:
                    return redirect(next_page)
                else:
                    # Use absolute URL to prevent recursion
                    return redirect('/')

            else:
                flash('Invalid username or password.', 'error')
                return render_template('login.html')

        except Exception as e:
            print(f"Login error: {e}")
            db.session.rollback()
            flash('Login failed. Please try again.', 'error')
            return render_template('login.html')

    # GET request - show login form
    return render_template('login.html')


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """Handle user registration"""

    # If user is already logged in, redirect to desktop
    if current_user.is_authenticated:
        return redirect(url_for('desktop.index'))

    if request.method == 'POST':
        try:
            username = request.form.get('username', '').strip()
            password = request.form.get('password', '')
            confirm_password = request.form.get('confirm_password', '')
            group = request.form.get('group', 'User')

            # Validation
            errors = []

            if not username:
                errors.append('Username is required.')
            elif len(username) < 3:
                errors.append('Username must be at least 3 characters long.')
            elif len(username) > 80:
                errors.append('Username must be less than 80 characters.')
            elif not username.replace('_', '').isalnum():
                errors.append('Username can only contain letters, numbers, and underscores.')

            if not password:
                errors.append('Password is required.')
            elif len(password) < 4:
                errors.append('Password must be at least 4 characters long.')
            elif len(password) > 128:
                errors.append('Password must be less than 128 characters.')

            if password != confirm_password:
                errors.append('Passwords do not match.')

            # Check if username already exists
            if User.query.filter_by(username=username).first():
                errors.append('Username already exists. Please choose a different one.')

            if errors:
                for error in errors:
                    flash(error, 'error')
                return render_template('register.html')

            # Create new user
            user = User(username=username, group=group)
            user.set_password(password)

            db.session.add(user)
            db.session.commit()

            flash('Account created successfully! Please log in.', 'success')
            return redirect(url_for('auth.login'))

        except Exception as e:
            print(f"Registration error: {e}")
            db.session.rollback()
            flash('Registration failed. Please try again.', 'error')
            return render_template('register.html')

    # GET request - show registration form
    return render_template('register.html')


@auth_bp.route('/logout')
@login_required
def logout():
    """Handle user logout"""
    try:
        # Clear the user session
        logout_user()

        # Clear any additional session data
        session.clear()

        flash('You have been logged out successfully.', 'info')
        return redirect(url_for('auth.login'))

    except Exception as e:
        print(f"Logout error: {e}")
        # Force redirect to login even if there's an error
        session.clear()
        return redirect(url_for('auth.login'))


@auth_bp.route('/profile')
@login_required
def profile():
    """User profile page"""
    return render_template('profile.html', user=current_user)


# Add error handlers for authentication blueprint
@auth_bp.errorhandler(401)
def unauthorized(error):
    """Handle unauthorized access"""
    flash('Please log in to access this page.', 'warning')
    return redirect(url_for('auth.login'))


@auth_bp.errorhandler(403)
def forbidden(error):
    """Handle forbidden access"""
    flash('You do not have permission to access this page.', 'error')
    return redirect(url_for('desktop.index'))