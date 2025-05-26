#!/usr/bin/env python3
"""
Pixel Pusher OS - Desktop Routes
Main application routes for the desktop environment and built-in applications.

This module provides:
- Main desktop interface
- Built-in applications (browser, word processor, spreadsheet)
- Application routing and rendering
- User dashboard and navigation
"""

from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required, current_user

# Create desktop blueprint for main application routes
desktop_bp = Blueprint('desktop', __name__)


@desktop_bp.route('/')
@login_required
def index():
    """
    Main desktop interface - the heart of Pixel Pusher OS.

    This is the primary workspace where users interact with:
    - Desktop icons and shortcuts
    - Window management system
    - Taskbar and system tray
    - File explorer and applications

    Returns:
        Rendered desktop template with user context
    """
    try:
        # Gather user information for desktop customization
        user_data = {
            'username': current_user.username,
            'group': current_user.group,
            'is_admin': current_user.is_admin(),
            'last_login': current_user.last_login.strftime(
                '%Y-%m-%d %H:%M') if current_user.last_login else 'First login'
        }

        # Desktop statistics and system info
        desktop_stats = {
            'total_users': get_total_users(),
            'app_version': '2.0.0',
            'system_status': 'Online'
        }

        print(f"🖥️ Desktop loaded for user: {current_user.username}")

        return render_template('index.html',
                               user=user_data['username'],
                               group=user_data['group'],
                               is_admin=user_data['is_admin'],
                               user_data=user_data,
                               desktop_stats=desktop_stats)

    except Exception as e:
        print(f"❌ Desktop loading error: {e}")
        flash('Error loading desktop. Please try refreshing the page.', 'error')
        return render_template('index.html',
                               user=current_user.username,
                               group=current_user.group,
                               is_admin=current_user.is_admin())


@desktop_bp.route('/browser')
@login_required
def browser():
    """
    Built-in web browser application.

    Provides a sandboxed browsing experience within Pixel Pusher OS.
    Supports URL navigation and basic web browsing functionality.

    Query Parameters:
        url (str): Target URL to load (default: DuckDuckGo search)

    Returns:
        Rendered browser template with target URL
    """
    # Get target URL from query parameters with safe default
    target_url = request.args.get('url', 'https://duckduckgo.com')

    # Validate and sanitize URL
    if not is_valid_url(target_url):
        target_url = 'https://duckduckgo.com'
        flash('Invalid URL provided. Loading default search page.', 'warning')

    print(f"🌐 Browser opened by {current_user.username} - Target: {target_url}")

    return render_template('browser.html',
                           target=target_url,
                           user=current_user.username)


@desktop_bp.route('/word')
@login_required
def word_processor():
    """
    Built-in word processor application.

    A rich text editor similar to Microsoft Word or Google Docs.
    Provides document creation, editing, and formatting capabilities.

    Returns:
        Rendered word processor template
    """
    print(f"📝 Word processor opened by {current_user.username}")

    return render_template('word.html',
                           user=current_user.username,
                           app_name='Pixel Writer')


@desktop_bp.route('/excel')
@login_required
def spreadsheet():
    """
    Built-in spreadsheet application.

    A spreadsheet editor similar to Microsoft Excel or Google Sheets.
    Provides cell editing, formulas, and data analysis capabilities.

    Returns:
        Rendered spreadsheet template
    """
    print(f"📊 Spreadsheet opened by {current_user.username}")

    return render_template('excel.html',
                           user=current_user.username,
                           app_name='Pixel Sheets')


@desktop_bp.route('/settings')
@login_required
def system_settings():
    """
    System settings and preferences.

    Allows users to customize their Pixel Pusher OS experience:
    - Theme and appearance settings
    - User preferences and profile
    - System configuration (admin only)
    - Application settings

    Returns:
        Rendered settings template
    """
    # Check if user has access to advanced settings
    show_advanced = current_user.is_admin()

    print(f"⚙️ Settings opened by {current_user.username} (Advanced: {show_advanced})")

    return render_template('settings.html',
                           user=current_user.username,
                           show_advanced=show_advanced,
                           user_group=current_user.group)


@desktop_bp.route('/help')
@login_required
def help_center():
    """
    Help and documentation center.

    Provides user guides, tutorials, and support information.

    Returns:
        Rendered help template
    """
    help_topics = [
        {'title': 'Getting Started', 'url': '#getting-started'},
        {'title': 'Using Applications', 'url': '#applications'},
        {'title': 'File Management', 'url': '#files'},
        {'title': 'Gaming Center', 'url': '#games'},
        {'title': 'Customization', 'url': '#themes'},
        {'title': 'Troubleshooting', 'url': '#troubleshooting'}
    ]

    return render_template('help.html',
                           user=current_user.username,
                           help_topics=help_topics)


@desktop_bp.route('/about')
@login_required
def about():
    """
    About page with application information.

    Displays version info, credits, and system details.

    Returns:
        Rendered about template
    """
    app_info = {
        'name': 'Pixel Pusher OS',
        'version': '2.0.0',
        'description': 'A modern web-based desktop environment',
        'author': 'Pixel Pusher Team',
        'license': 'MIT License',
        'github': 'https://github.com/pixel-pusher/os'
    }

    return render_template('about.html',
                           user=current_user.username,
                           app_info=app_info)


# Helper functions for desktop routes
def get_total_users():
    """
    Get total number of registered users.
    Used for desktop statistics.

    Returns:
        int: Total user count
    """
    try:
        from models import User
        return User.query.count()
    except Exception as e:
        print(f"Error getting user count: {e}")
        return 0


def is_valid_url(url):
    """
    Validate if a URL is safe and properly formatted.

    Args:
        url (str): URL to validate

    Returns:
        bool: True if URL is valid and safe
    """
    if not url or not isinstance(url, str):
        return False

    # Basic URL validation
    if not (url.startswith('http://') or url.startswith('https://')):
        return False

    # Block dangerous protocols
    dangerous_protocols = ['javascript:', 'data:', 'file:', 'ftp:']
    for protocol in dangerous_protocols:
        if url.lower().startswith(protocol):
            return False

    # Block localhost and private IPs (optional security measure)
    blocked_hosts = ['localhost', '127.0.0.1', '0.0.0.0']
    for host in blocked_hosts:
        if host in url.lower():
            return False

    return True


# Error handlers for desktop blueprint
@desktop_bp.errorhandler(404)
def not_found(error):
    """Handle 404 errors in desktop routes"""
    flash('Page not found in Pixel Pusher OS', 'error')
    return redirect(url_for('desktop.index'))


@desktop_bp.errorhandler(500)
def server_error(error):
    """Handle 500 errors in desktop routes"""
    flash('An error occurred. Please try again.', 'error')
    return redirect(url_for('desktop.index'))


print("🖥️ Desktop routes loaded successfully")