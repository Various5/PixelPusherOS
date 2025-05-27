#!/usr/bin/env python3
"""
Pixel Pusher OS - Desktop Routes
Handles main desktop interface and application routes
"""

from flask import Blueprint, render_template, request, redirect, url_for, send_file, jsonify
from flask_login import login_required, current_user
from datetime import datetime
import os
from pathlib import Path

from models import db, User, SystemLog
from config import Config

# Create desktop blueprint
desktop_bp = Blueprint('desktop', __name__)


@desktop_bp.route('/')
@login_required
def index():
    """
    Main desktop interface.
    This is the primary application page that loads the desktop environment.
    """

    # Update user activity
    current_user.update_activity()

    # Log desktop access
    ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    SystemLog.log_action('desktop_access',
                         f'User {current_user.username} accessed desktop',
                         user_id=current_user.id,
                         ip_address=ip_address)

    # Get user preferences for desktop customization
    user_preferences = current_user.get_preferences()

    # Get user statistics for display
    user_stats = current_user.get_stats()

    return render_template('desktop.html',
                           user=current_user,
                           preferences=user_preferences,
                           stats=user_stats)


@desktop_bp.route('/browser')
@login_required
def browser():
    """
    Web browser application.
    Loads a simple web browser interface within the desktop environment.
    """

    # Update user activity
    current_user.update_activity()

    # Log browser access
    SystemLog.log_action('browser_opened',
                         f'User {current_user.username} opened browser',
                         user_id=current_user.id)

    return render_template('browser.html', user=current_user)


@desktop_bp.route('/word')
@login_required
def word_processor():
    """
    Word processor application.
    Simple text editor/word processor for creating and editing documents.
    """

    # Update user activity
    current_user.update_activity()

    # Log word processor access
    SystemLog.log_action('word_processor_opened',
                         f'User {current_user.username} opened word processor',
                         user_id=current_user.id)

    return render_template('word.html', user=current_user)


@desktop_bp.route('/excel')
@login_required
def spreadsheet():
    """
    Spreadsheet application.
    Simple spreadsheet editor for data manipulation and calculations.
    """

    # Update user activity
    current_user.update_activity()

    # Log spreadsheet access
    SystemLog.log_action('spreadsheet_opened',
                         f'User {current_user.username} opened spreadsheet',
                         user_id=current_user.id)

    return render_template('excel.html', user=current_user)


@desktop_bp.route('/games')
@login_required
def games_center():
    """
    Games center page.
    Shows available games and high scores.
    """

    # Update user activity
    current_user.update_activity()

    # Get user's game statistics
    from models import GameScore

    game_stats = {}
    available_games = ['snake', 'dino', 'memory', 'clicker']

    for game in available_games:
        high_score = GameScore.get_high_score(current_user.id, game)
        recent_scores = GameScore.query.filter_by(
            user_id=current_user.id,
            game_name=game
        ).order_by(GameScore.created_at.desc()).limit(5).all()

        game_stats[game] = {
            'high_score': high_score,
            'recent_scores': [score.to_dict() for score in recent_scores],
            'total_games': len(recent_scores)
        }

    # Get global leaderboards
    leaderboards = {}
    for game in available_games:
        leaderboards[game] = [
            score.to_dict() for score in GameScore.get_leaderboard(game, 10)
        ]

    # Log games center access
    SystemLog.log_action('games_center_opened',
                         f'User {current_user.username} accessed games center',
                         user_id=current_user.id)

    return render_template('games.html',
                           user=current_user,
                           game_stats=game_stats,
                           leaderboards=leaderboards)


@desktop_bp.route('/settings')
@login_required
def settings():
    """
    System settings page.
    Allows users to configure their desktop environment and preferences.
    """

    # Update user activity
    current_user.update_activity()

    # Get current user preferences
    preferences = current_user.get_preferences()

    # Get system information
    system_info = {
        'version': Config.APP_VERSION,
        'user_count': User.query.count(),
        'total_logins': sum(user.login_count for user in User.query.all()),
        'uptime': 'System running normally'
    }

    # Log settings access
    SystemLog.log_action('settings_opened',
                         f'User {current_user.username} opened settings',
                         user_id=current_user.id)

    return render_template('settings.html',
                           user=current_user,
                           preferences=preferences,
                           system_info=system_info)


@desktop_bp.route('/files')
@login_required
def file_manager():
    """
    File manager application.
    Browse and manage user files within the secure user directory.
    """

    # Update user activity
    current_user.update_activity()

    # Get user's file directory
    user_dir = Config.USER_FILES_DIR

    # Ensure user directory exists
    user_dir.mkdir(exist_ok=True)

    # Get directory contents
    try:
        files = []
        directories = []

        for item in user_dir.iterdir():
            if item.is_file():
                files.append({
                    'name': item.name,
                    'size': item.stat().st_size,
                    'modified': datetime.fromtimestamp(item.stat().st_mtime),
                    'type': 'file'
                })
            elif item.is_dir():
                directories.append({
                    'name': item.name,
                    'modified': datetime.fromtimestamp(item.stat().st_mtime),
                    'type': 'directory'
                })

        # Sort files and directories
        files.sort(key=lambda x: x['name'].lower())
        directories.sort(key=lambda x: x['name'].lower())

        all_items = directories + files

    except Exception as e:
        all_items = []
        SystemLog.log_action('file_manager_error',
                             f'Error accessing files for {current_user.username}: {str(e)}',
                             user_id=current_user.id,
                             level='ERROR')

    # Log file manager access
    SystemLog.log_action('file_manager_opened',
                         f'User {current_user.username} opened file manager',
                         user_id=current_user.id)

    return render_template('files.html',
                           user=current_user,
                           items=all_items,
                           current_path='/')


@desktop_bp.route('/terminal')
@login_required
def terminal():
    """
    Terminal application.
    Web-based terminal interface for command execution.
    """

    # Update user activity
    current_user.update_activity()

    # Log terminal access
    SystemLog.log_action('terminal_opened',
                         f'User {current_user.username} opened terminal',
                         user_id=current_user.id)

    return render_template('terminal.html', user=current_user)


@desktop_bp.route('/task-manager')
@login_required
def task_manager():
    """
    Task manager application.
    Shows system processes and performance information.
    """

    # Update user activity
    current_user.update_activity()

    # Get system information
    import psutil
    import platform

    try:
        system_info = {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory': psutil.virtual_memory(),
            'disk': psutil.disk_usage('/'),
            'boot_time': psutil.boot_time(),
            'platform': platform.platform(),
            'python_version': platform.python_version()
        }
    except:
        system_info = {
            'cpu_percent': 0,
            'memory': None,
            'disk': None,
            'boot_time': 0,
            'platform': 'Unknown',
            'python_version': 'Unknown'
        }

    # Get user session information
    from models import UserSession
    active_sessions = UserSession.query.filter_by(is_active=True).all()

    # Log task manager access
    SystemLog.log_action('task_manager_opened',
                         f'User {current_user.username} opened task manager',
                         user_id=current_user.id)

    return render_template('task_manager.html',
                           user=current_user,
                           system_info=system_info,
                           active_sessions=active_sessions)


@desktop_bp.route('/about')
@login_required
def about():
    """
    About page with system information and credits.
    """

    # Update user activity
    current_user.update_activity()

    # Get application information
    app_info = {
        'name': Config.APP_NAME,
        'version': Config.APP_VERSION,
        'description': 'A modern web-based desktop environment',
        'features': [
            'Professional desktop interface',
            'Built-in terminal with 50+ commands',
            'File explorer with media support',
            'Gaming center with arcade games',
            'Customizable themes and wallpapers',
            'System settings and task manager',
            'Multi-window support',
            'User session management'
        ],
        'tech_stack': [
            'Flask (Python Web Framework)',
            'SQLAlchemy (Database ORM)',
            'JavaScript ES6+',
            'HTML5 Canvas',
            'CSS3 with Flexbox/Grid',
            'SQLite Database'
        ]
    }

    # Get system statistics
    total_users = User.query.count()
    total_sessions = db.session.query(db.func.sum(User.login_count)).scalar() or 0

    from models import GameScore
    total_games_played = GameScore.query.count()

    stats = {
        'total_users': total_users,
        'total_sessions': total_sessions,
        'total_games_played': total_games_played,
        'uptime': 'System operational'
    }

    # Log about page access
    SystemLog.log_action('about_opened',
                         f'User {current_user.username} viewed about page',
                         user_id=current_user.id)

    return render_template('about.html',
                           user=current_user,
                           app_info=app_info,
                           stats=stats)


@desktop_bp.route('/help')
@login_required
def help_center():
    """
    Help center with documentation and tutorials.
    """

    # Update user activity
    current_user.update_activity()

    # Help topics and documentation
    help_topics = {
        'getting_started': {
            'title': 'Getting Started',
            'description': 'Learn the basics of using Pixel Pusher OS',
            'sections': [
                'Desktop Navigation',
                'Opening Applications',
                'Using the Terminal',
                'File Management',
                'Customization Options'
            ]
        },
        'terminal_commands': {
            'title': 'Terminal Commands',
            'description': 'Complete reference of terminal commands',
            'sections': [
                'File Operations',
                'System Information',
                'Network Commands',
                'Visual Effects',
                'Application Launchers'
            ]
        },
        'games': {
            'title': 'Games Guide',
            'description': 'How to play the arcade games',
            'sections': [
                'Snake Game',
                'Dino Runner',
                'Memory Match',
                'Village Builder'
            ]
        },
        'troubleshooting': {
            'title': 'Troubleshooting',
            'description': 'Common issues and solutions',
            'sections': [
                'Performance Issues',
                'Browser Compatibility',
                'Login Problems',
                'File Access Issues'
            ]
        }
    }

    # Log help center access
    SystemLog.log_action('help_opened',
                         f'User {current_user.username} accessed help center',
                         user_id=current_user.id)

    return render_template('help.html',
                           user=current_user,
                           help_topics=help_topics)


@desktop_bp.route('/download/<path:filename>')
@login_required
def download_file(filename):
    """
    Download user files securely.
    Only allows downloading files from the user's directory.
    """

    try:
        # Sanitize filename and construct safe path
        safe_filename = os.path.basename(filename)
        file_path = Config.USER_FILES_DIR / safe_filename

        # Security check - ensure file is within user directory
        if not str(file_path).startswith(str(Config.USER_FILES_DIR)):
            return "Access denied", 403

        # Check if file exists
        if not file_path.exists():
            return "File not found", 404

        # Log file download
        SystemLog.log_action('file_downloaded',
                             f'User {current_user.username} downloaded {safe_filename}',
                             user_id=current_user.id)

        # Update user activity
        current_user.update_activity()

        return send_file(file_path, as_attachment=True)

    except Exception as e:
        SystemLog.log_action('download_error',
                             f'Download error for {current_user.username}: {str(e)}',
                             user_id=current_user.id,
                             level='ERROR')
        return "Download failed", 500


@desktop_bp.route('/api/desktop-info')
@login_required
def desktop_info():
    """
    API endpoint to get desktop information and user data.
    Used by frontend JavaScript for desktop initialization.
    """

    try:
        # Get user preferences
        preferences = current_user.get_preferences()

        # Get user statistics
        stats = current_user.get_stats()

        # Get system information
        system_info = {
            'version': Config.APP_VERSION,
            'name': Config.APP_NAME,
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'user_group': current_user.user_group,
                'is_admin': current_user.is_admin(),
                'created_at': current_user.created_at.isoformat(),
                'last_login': current_user.last_login.isoformat() if current_user.last_login else None
            },
            'session': {
                'login_time': current_user.last_login.isoformat() if current_user.last_login else None,
                'active': True
            }
        }

        return jsonify({
            'success': True,
            'preferences': preferences,
            'stats': stats,
            'system_info': system_info
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@desktop_bp.route('/api/system-stats')
@login_required
def system_stats():
    """
    API endpoint to get system statistics.
    Used by system monitoring components.
    """

    try:
        # Get basic system stats
        total_users = User.query.count()
        active_users = User.query.filter(User.last_activity > datetime.now()).count()

        from models import GameScore, UserSession
        total_games = GameScore.query.count()
        active_sessions = UserSession.query.filter_by(is_active=True).count()

        stats = {
            'users': {
                'total': total_users,
                'active': active_users
            },
            'games': {
                'total_played': total_games
            },
            'sessions': {
                'active': active_sessions
            },
            'system': {
                'version': Config.APP_VERSION,
                'uptime': 'Operational'
            }
        }

        return jsonify(stats)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Error handlers for desktop blueprint
@desktop_bp.errorhandler(404)
def page_not_found(error):
    """Handle 404 errors in desktop context"""
    return render_template('404.html', user=current_user), 404


@desktop_bp.errorhandler(500)
def internal_server_error(error):
    """Handle 500 errors in desktop context"""
    db.session.rollback()
    return render_template('500.html', user=current_user), 500


# Context processor for desktop templates
@desktop_bp.context_processor
def inject_desktop_context():
    """Inject desktop-related context into templates"""
    return {
        'app_name': Config.APP_NAME,
        'app_version': Config.APP_VERSION,
        'current_user': current_user
    }