#!/usr/bin/env python3
"""
Pixel Pusher OS - Authentication Routes
"""

from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_user, login_required, logout_user, current_user
from datetime import datetime

# Create blueprint
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    # Import here to avoid circular imports
    from models import db, User

    if current_user.is_authenticated:
        flash('You are already logged in!', 'info')
        return redirect(url_for('desktop.index'))

    if request.method == 'POST':
        username = request.form['username'].strip()
        password = request.form['password']
        confirm_password = request.form.get('confirm_password', '')
        group = request.form.get('group', 'User')

        # Validation
        errors = []
        if not username or not password:
            errors.append('Username and password are required')
        if len(username) < 3:
            errors.append('Username must be at least 3 characters long')
        if len(password) < 4:
            errors.append('Password must be at least 4 characters long')
        if confirm_password and password != confirm_password:
            errors.append('Passwords do not match')
        if User.query.filter_by(username=username).first():
            errors.append('Username already taken')

        if errors:
            for error in errors:
                flash(error, 'error')
            return render_template('register.html')

        try:
            new_user = User(username=username, group=group)
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.commit()
            flash(f'Registration successful! Welcome {username}!', 'success')
            return redirect(url_for('auth.login'))
        except Exception as e:
            db.session.rollback()
            flash('Registration failed. Please try again.', 'error')
            return render_template('register.html')

    return render_template('register.html')


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    # Import here to avoid circular imports
    from models import User

    if current_user.is_authenticated:
        flash(f'Welcome back, {current_user.username}!', 'info')
        return redirect(url_for('desktop.index'))

    if request.method == 'POST':
        username = request.form['username'].strip()
        password = request.form['password']
        remember = bool(request.form.get('remember'))

        if not username or not password:
            flash('Please enter both username and password', 'error')
            return render_template('login.html')

        user = User.query.filter_by(username=username).first()

        if not user or not user.check_password(password):
            flash('Invalid username or password', 'error')
            return render_template('login.html')

        if not user.is_active_user():
            flash('Your account has been disabled', 'error')
            return render_template('login.html')

        try:
            user.update_last_login()
            login_user(user, remember=remember)
            flash(f'Welcome to Pixel Pusher OS, {user.username}!', 'success')

            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('desktop.index'))
        except Exception as e:
            flash('Login failed. Please try again.', 'error')
            return render_template('login.html')

    return render_template('login.html')


@auth_bp.route('/logout')
@login_required
def logout():
    try:
        username = current_user.username if current_user.is_authenticated else 'Unknown'
        logout_user()
        flash('You have been logged out successfully', 'info')
        return redirect(url_for('auth.login'))
    except Exception as e:
        flash('Logout completed', 'info')
        return redirect(url_for('auth.login'))


print("🔐 Authentication routes loaded successfully")