#!/usr/bin/env python3
"""
Pixel Pusher OS - Desktop Routes
Fixed version to prevent recursion with authentication
"""

from flask import Blueprint, render_template, redirect, url_for, request
from flask_login import login_required, current_user

desktop_bp = Blueprint('desktop', __name__)


@desktop_bp.route('/')
def index():
    """
    Main desktop route - handle both authenticated and non-authenticated users
    """
    # Check if user is authenticated
    if not current_user.is_authenticated:
        # Not logged in - redirect to login page
        return redirect(url_for('auth.login'))

    # User is authenticated - show desktop
    try:
        return render_template('desktop.html',
                               user=current_user,
                               user_data={
                                   'username': current_user.username,
                                   'group': current_user.group,
                                   'last_login': current_user.last_login
                               })
    except Exception as e:
        print(f"Desktop render error: {e}")
        # If there's an error rendering desktop, show error page
        return render_template('error.html',
                               error="Failed to load desktop environment"), 500


@desktop_bp.route('/desktop')
@login_required
def desktop():
    """Alternative desktop route"""
    return redirect(url_for('desktop.index'))


@desktop_bp.route('/browser')
@login_required
def browser():
    """Web browser application"""
    try:
        return render_template('browser.html', user=current_user)
    except Exception as e:
        print(f"Browser render error: {e}")
        return redirect(url_for('desktop.index'))


@desktop_bp.route('/word')
@login_required
def word_processor():
    """Word processor application"""
    try:
        return render_template('word.html', user=current_user)
    except Exception as e:
        print(f"Word processor render error: {e}")
        return redirect(url_for('desktop.index'))


@desktop_bp.route('/excel')
@login_required
def spreadsheet():
    """Spreadsheet application"""
    try:
        return render_template('excel.html', user=current_user)
    except Exception as e:
        print(f"Spreadsheet render error: {e}")
        return redirect(url_for('desktop.index'))


@desktop_bp.route('/settings')
@login_required
def settings():
    """System settings application"""
    try:
        return render_template('settings.html', user=current_user)
    except Exception as e:
        print(f"Settings render error: {e}")
        return redirect(url_for('desktop.index'))


@desktop_bp.route('/help')
def help_page():
    """Help and documentation"""
    return render_template('help.html')


@desktop_bp.route('/about')
def about():
    """About Pixel Pusher OS"""
    return render_template('about.html')


# Error handlers for desktop blueprint
@desktop_bp.errorhandler(404)
def not_found(error):
    """Handle 404 errors in desktop context"""
    if current_user.is_authenticated:
        return render_template('error.html',
                               error="Page not found",
                               error_code=404), 404
    else:
        return redirect(url_for('auth.login'))


@desktop_bp.errorhandler(500)
def internal_error(error):
    """Handle 500 errors in desktop context"""
    print(f"Desktop error: {error}")
    if current_user.is_authenticated:
        return render_template('error.html',
                               error="Internal server error",
                               error_code=500), 500
    else:
        return redirect(url_for('auth.login'))