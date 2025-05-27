#!/usr/bin/env python3
"""
Pixel Pusher OS - Desktop Routes
Handles desktop environment and main application routes
"""

import os
import json
from flask import Blueprint, render_template, jsonify, request, send_from_directory, redirect, url_for
from flask_login import login_required, current_user

# Create desktop blueprint
desktop_bp = Blueprint('desktop', __name__)


@desktop_bp.route('/')
@login_required
def index():
    """
    Main desktop route - renders the desktop environment with all necessary context
    """
    # Default user preferences that match the StateManager structure
    default_preferences = {
        'theme': 'default',
        'fontSize': 14,
        'windowOpacity': 1.0,
        'wallpaper': None,
        'animations': True,
        'soundEnabled': True,
        'autoSave': True,
        'gameSounds': True,
        'gameParticles': True,
        'gameDifficulty': 'normal',
        'explorerViewMode': 'list',
        'explorerSortBy': 'name',
        'explorerSortOrder': 'asc'
    }

    # Default desktop icons configuration (Browser removed)
    desktop_icons = [
        # System applications
        {'id': 'terminal', 'name': 'Terminal', 'icon': '💻', 'x': 60, 'y': 80, 'category': 'system'},
        {'id': 'explorer', 'name': 'File Explorer', 'icon': '📁', 'x': 60, 'y': 200, 'category': 'system'},

        # Games
        {'id': 'snake', 'name': 'Snake Game', 'icon': '🐍', 'x': 180, 'y': 80, 'category': 'games'},
        {'id': 'dino', 'name': 'Dino Runner', 'icon': '🦕', 'x': 180, 'y': 200, 'category': 'games'},
        {'id': 'clicker', 'name': 'Village Builder', 'icon': '🏘️', 'x': 180, 'y': 320, 'category': 'games'},
        {'id': 'memory', 'name': 'Memory Match', 'icon': '🧠', 'x': 300, 'y': 80, 'category': 'games'},

        # Media and tools
        {'id': 'musicplayer', 'name': 'Music Player', 'icon': '🎵', 'x': 300, 'y': 200, 'category': 'media'},
        {'id': 'settings', 'name': 'System Settings', 'icon': '⚙️', 'x': 300, 'y': 320, 'category': 'system'},
        {'id': 'taskmanager', 'name': 'Task Manager', 'icon': '📊', 'x': 420, 'y': 80, 'category': 'system'},

        # System actions
        {'id': 'logout', 'name': 'Sign Out', 'icon': '🚪', 'x': 60, 'y': 320, 'category': 'system'}
    ]

    # Game high scores (you could load these from database)
    game_scores = {
        'snake': 0,
        'dino': 0,
        'memory': 0,
        'clicker': 0
    }

    # System information
    system_info = {
        'version': '2.0.0',
        'startTime': 'server_start_time',
        'user': current_user.username if current_user else 'guest',
        'group': current_user.group if current_user else 'user'
    }

    return render_template('desktop.html',
                           user=current_user,
                           preferences=default_preferences,
                           desktop_icons=desktop_icons,
                           game_scores=game_scores,
                           system_info=system_info)


@desktop_bp.route('/word')
@login_required
def word_processor():
    """
    Word processor application
    """
    return render_template('word.html', user=current_user)


@desktop_bp.route('/excel')
@login_required
def spreadsheet():
    """
    Spreadsheet application
    """
    return render_template('excel.html', user=current_user)


@desktop_bp.route('/settings')
@login_required
def settings():
    """
    System settings page
    """
    preferences = {
        'theme': 'default',
        'fontSize': 14,
        'windowOpacity': 1.0,
        'wallpaper': None,
        'animations': True,
        'soundEnabled': True,
        'autoSave': True
    }

    return render_template('settings.html',
                           user=current_user,
                           preferences=preferences)


@desktop_bp.route('/games')
@login_required
def games():
    """
    Games center page
    """
    available_games = [
        {'id': 'snake', 'name': 'Snake Game', 'icon': '🐍', 'description': 'Classic snake game'},
        {'id': 'dino', 'name': 'Dino Runner', 'icon': '🦕', 'description': 'Jump over obstacles'},
        {'id': 'memory', 'name': 'Memory Match', 'icon': '🧠', 'description': 'Match pairs of cards'},
        {'id': 'clicker', 'name': 'Village Builder', 'icon': '🏘️', 'description': 'Build and manage your village'}
    ]

    return render_template('games.html',
                           user=current_user,
                           games=available_games)


@desktop_bp.route('/taskmanager')
@login_required
def task_manager():
    """
    Task manager page
    """
    return render_template('taskmanager.html', user=current_user)


# API-like routes for AJAX requests
@desktop_bp.route('/api/preferences', methods=['GET', 'POST'])
@login_required
def preferences_api():
    """
    Handle user preferences via AJAX
    """
    if request.method == 'POST':
        # Save user preferences (you would save to database here)
        preferences = request.get_json()
        # For now, just return success
        return jsonify({'status': 'success', 'message': 'Preferences saved'})
    else:
        # Return current preferences
        preferences = {
            'theme': 'default',
            'fontSize': 14,
            'windowOpacity': 1.0,
            'wallpaper': None,
            'animations': True,
            'soundEnabled': True,
            'autoSave': True
        }
        return jsonify(preferences)


@desktop_bp.route('/api/desktop-icons', methods=['GET', 'POST'])
@login_required
def desktop_icons_api():
    """
    Handle desktop icon positions and configuration
    """
    if request.method == 'POST':
        # Save icon positions
        icons = request.get_json()
        # You would save to database here
        return jsonify({'status': 'success', 'message': 'Icon positions saved'})
    else:
        # Return current icon configuration (without browser)
        icons = [
            {'id': 'terminal', 'name': 'Terminal', 'icon': '💻', 'x': 60, 'y': 80, 'category': 'system'},
            {'id': 'explorer', 'name': 'File Explorer', 'icon': '📁', 'x': 60, 'y': 200, 'category': 'system'},
            {'id': 'snake', 'name': 'Snake Game', 'icon': '🐍', 'x': 180, 'y': 80, 'category': 'games'},
            {'id': 'dino', 'name': 'Dino Runner', 'icon': '🦕', 'x': 180, 'y': 200, 'category': 'games'},
            {'id': 'clicker', 'name': 'Village Builder', 'icon': '🏘️', 'x': 180, 'y': 320, 'category': 'games'},
            {'id': 'memory', 'name': 'Memory Match', 'icon': '🧠', 'x': 300, 'y': 80, 'category': 'games'},
            {'id': 'musicplayer', 'name': 'Music Player', 'icon': '🎵', 'x': 300, 'y': 200, 'category': 'media'},
            {'id': 'settings', 'name': 'System Settings', 'icon': '⚙️', 'x': 300, 'y': 320, 'category': 'system'},
            {'id': 'taskmanager', 'name': 'Task Manager', 'icon': '📊', 'x': 420, 'y': 80, 'category': 'system'},
            {'id': 'logout', 'name': 'Sign Out', 'icon': '🚪', 'x': 60, 'y': 320, 'category': 'system'}
        ]
        return jsonify(icons)


@desktop_bp.route('/api/wallpaper', methods=['POST'])
@login_required
def set_wallpaper():
    """
    Handle wallpaper uploads and settings
    """
    if 'wallpaper' in request.files:
        file = request.files['wallpaper']
        if file and file.filename:
            # Save wallpaper file (implement file upload logic)
            filename = f"wallpaper_{current_user.id}_{file.filename}"
            # file.save(os.path.join('static/wallpapers', filename))
            return jsonify({'status': 'success', 'wallpaper': f'/static/wallpapers/{filename}'})

    return jsonify({'status': 'error', 'message': 'No file uploaded'})


@desktop_bp.route('/health')
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        'status': 'healthy',
        'service': 'Pixel Pusher OS',
        'version': '2.0.0'
    })


# Error handlers for this blueprint
@desktop_bp.errorhandler(404)
def page_not_found(error):
    """Handle 404 errors in desktop blueprint"""
    if current_user.is_authenticated:
        return render_template('404.html', user=current_user), 404
    else:
        return redirect(url_for('auth.login'))


@desktop_bp.errorhandler(500)
def internal_server_error(error):
    """Handle 500 errors in desktop blueprint"""
    return render_template('error.html',
                           error_message="Internal server error occurred",
                           user=current_user if current_user.is_authenticated else None), 500


print("🖥️ Desktop routes loaded successfully")