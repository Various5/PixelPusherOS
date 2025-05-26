#!/usr/bin/env python3
"""
Pixel Pusher OS - Desktop Routes
Handles desktop environment and main application routes.
"""

import os
import time
from flask import Blueprint, render_template, request, redirect, url_for, jsonify
from flask_login import login_required, current_user

from config import Config

# Create desktop blueprint
desktop_bp = Blueprint('desktop', __name__)


@desktop_bp.route('/')
@login_required
def index():
    """
    Main desktop environment route.
    Shows the full desktop interface with taskbar, desktop icons, and window manager.
    """
    # Get user information
    user_data = {
        'username': current_user.username,
        'group': current_user.group,
        'login_time': time.time()
    }

    # Get system information
    system_data = {
        'version': '2.0.0',
        'start_time': time.time(),
        'base_dir': Config.BASE_DIR
    }

    return render_template('desktop.html',
                           user=user_data,
                           system=system_data)


@desktop_bp.route('/browser')
@login_required
def browser():
    """
    Web browser application route.
    Serves a basic web browser interface.
    """
    return render_template('apps/browser.html')


@desktop_bp.route('/word')
@login_required
def word_processor():
    """
    Word processor application route.
    Basic document editor interface.
    """
    return render_template('apps/word.html')


@desktop_bp.route('/excel')
@login_required
def spreadsheet():
    """
    Spreadsheet application route.
    Basic spreadsheet editor interface.
    """
    return render_template('apps/excel.html')


@desktop_bp.route('/settings')
@login_required
def settings():
    """
    System settings application route.
    """
    return render_template('apps/settings.html')


@desktop_bp.route('/games')
@login_required
def games():
    """
    Games center route.
    Shows available games and high scores.
    """
    return render_template('apps/games.html')


@desktop_bp.route('/help')
@login_required
def help_system():
    """
    Help and documentation system.
    """
    return render_template('help.html')


@desktop_bp.route('/about')
@login_required
def about():
    """
    About Pixel Pusher OS page.
    """
    return render_template('about.html')


@desktop_bp.route('/status')
@login_required
def system_status():
    """
    System status and monitoring page.
    """
    try:
        import psutil

        status_data = {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory': psutil.virtual_memory()._asdict(),
            'disk': psutil.disk_usage('/')._asdict(),
            'uptime': time.time() - psutil.boot_time(),
            'user_count': len(psutil.users()),
            'process_count': len(psutil.pids())
        }
    except ImportError:
        status_data = {
            'cpu_percent': 0,
            'memory': {'total': 0, 'available': 0, 'percent': 0},
            'disk': {'total': 0, 'free': 0, 'used': 0},
            'uptime': 0,
            'user_count': 1,
            'process_count': 0
        }

    return render_template('status.html', status=status_data)


@desktop_bp.route('/file-manager')
@login_required
def file_manager():
    """
    Standalone file manager interface.
    """
    return render_template('apps/file_manager.html')


@desktop_bp.route('/terminal')
@login_required
def terminal():
    """
    Standalone terminal interface.
    """
    return render_template('apps/terminal.html')


@desktop_bp.route('/text-editor')
@login_required
def text_editor():
    """
    Text editor application.
    """
    filename = request.args.get('file', '')
    return render_template('apps/text_editor.html', filename=filename)


@desktop_bp.route('/music-player')
@login_required
def music_player():
    """
    Music player application.
    """
    return render_template('apps/music_player.html')


@desktop_bp.route('/image-viewer')
@login_required
def image_viewer():
    """
    Image viewer application.
    """
    image_path = request.args.get('image', '')
    return render_template('apps/image_viewer.html', image_path=image_path)


@desktop_bp.route('/calculator')
@login_required
def calculator():
    """
    Calculator application.
    """
    return render_template('apps/calculator.html')


@desktop_bp.route('/notepad')
@login_required
def notepad():
    """
    Simple notepad application.
    """
    return render_template('apps/notepad.html')


@desktop_bp.route('/task-manager')
@login_required
def task_manager():
    """
    Task manager application.
    """
    return render_template('apps/task_manager.html')


@desktop_bp.route('/control-panel')
@login_required
def control_panel():
    """
    System control panel.
    """
    return render_template('apps/control_panel.html')


@desktop_bp.route('/welcome')
@login_required
def welcome():
    """
    Welcome screen for new users.
    """
    return render_template('welcome.html', user=current_user)


@desktop_bp.route('/demo')
def demo():
    """
    Demo route for showcasing the system (accessible without login).
    """
    return render_template('demo.html')


@desktop_bp.route('/api/user-info')
@login_required
def user_info():
    """
    API endpoint to get current user information.
    """
    return jsonify({
        'username': current_user.username,
        'group': current_user.group,
        'is_admin': current_user.group.lower() == 'admin',
        'login_time': current_user.created_at.isoformat() if hasattr(current_user, 'created_at') else None
    })


@desktop_bp.route('/api/system-info')
@login_required
def api_system_info():
    """
    API endpoint to get basic system information.
    """
    try:
        import platform
        import psutil

        info = {
            'os': platform.system(),
            'version': platform.release(),
            'architecture': platform.architecture()[0],
            'cpu_count': psutil.cpu_count(),
            'memory_total': psutil.virtual_memory().total,
            'disk_total': psutil.disk_usage('/').total,
            'uptime': time.time() - psutil.boot_time() if hasattr(psutil, 'boot_time') else 0
        }
    except ImportError:
        info = {
            'os': 'Unknown',
            'version': 'Unknown',
            'architecture': 'Unknown',
            'cpu_count': 1,
            'memory_total': 0,
            'disk_total': 0,
            'uptime': 0
        }

    return jsonify(info)


# Error handlers for desktop routes
@desktop_bp.errorhandler(404)
def desktop_not_found(error):
    """Handle 404 errors in desktop routes"""
    return render_template('errors/404.html'), 404


@desktop_bp.errorhandler(500)
def desktop_server_error(error):
    """Handle 500 errors in desktop routes"""
    return render_template('errors/500.html'), 500


# Context processor for desktop templates
@desktop_bp.context_processor
def inject_desktop_context():
    """
    Inject common context variables into desktop templates.
    """
    return {
        'current_time': time.time(),
        'app_version': '2.0.0',
        'user_base_dir': Config.BASE_DIR if current_user.is_authenticated else None
    }


print("🖥️ Desktop routes loaded successfully")