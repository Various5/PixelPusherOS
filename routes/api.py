#!/usr/bin/env python3
"""
Pixel Pusher OS - API Routes
Handles API endpoints for terminal, files, games, and system operations
"""

from flask import Blueprint, request, jsonify, send_file, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
import os
import json
import mimetypes
from datetime import datetime
from pathlib import Path

from models import db, SystemLog, GameScore
from config import Config
from utils.file_browser import FileBrowser

# Create API blueprint
api_bp = Blueprint('api', __name__)

# Initialize file browser
file_browser = FileBrowser()


@api_bp.route('/command/<path:command>')
@login_required
def execute_command(command):
    """
    Execute terminal command and return result.
    This is the main API endpoint for terminal functionality.
    """

    try:
        # Update user activity
        current_user.update_activity()

        # Log command execution
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        SystemLog.log_action('command_executed',
                             f'User {current_user.username} executed: {command}',
                             user_id=current_user.id,
                             ip_address=ip_address)

        # Execute command using file browser
        result = file_browser.execute(command)

        # Update user command statistics
        current_user.increment_stat('commands_executed')

        # Handle special command responses
        response_data = {'output': result}

        # Check for special command codes
        if result == "__CLEAR__":
            response_data = {'clear': True}
        elif result.startswith("__COLOR__::"):
            theme = result.split("::", 1)[1]
            response_data = {'color_theme': theme}
        elif result.startswith("__EFFECT__::"):
            effect = result.split("::", 1)[1]
            response_data = {'start_effect': effect}
        elif result.startswith("__WALLPAPER__::"):
            wallpaper = result.split("::", 1)[1]
            response_data = {'wallpaper': wallpaper}
        elif result.startswith("__EXPLORER__"):
            response_data = {'explorer': True}
        elif result.startswith("__GAME__::"):
            game = result.split("::", 1)[1]
            response_data = {'game_start': game}
        elif result.startswith("__IMAGE__::"):
            image_path = result.split("::", 1)[1]
            response_data = {'image': image_path}
        elif result.startswith("__VIDEO__::"):
            video_path = result.split("::", 1)[1]
            response_data = {'video': video_path}
        elif result.startswith("__AUDIO__::"):
            audio_path = result.split("::", 1)[1]
            response_data = {'audio': audio_path}

        return jsonify(response_data)

    except Exception as e:
        SystemLog.log_action('command_error',
                             f'Command execution error for {current_user.username}: {str(e)}',
                             user_id=current_user.id,
                             level='ERROR')
        return jsonify({'error': True, 'message': str(e)}), 500


@api_bp.route('/explorer/<path:directory>')
@login_required
def explore_directory(directory=''):
    """
    Get directory listing for file explorer.
    Returns file and folder information for the specified directory.
    """

    try:
        # Update user activity
        current_user.update_activity()

        # Construct safe directory path
        base_dir = Config.USER_FILES_DIR
        if directory:
            target_dir = base_dir / directory
        else:
            target_dir = base_dir

        # Security check - ensure directory is within user space
        try:
            target_dir = target_dir.resolve()
            base_dir = base_dir.resolve()
            if not str(target_dir).startswith(str(base_dir)):
                return jsonify({'error': 'Access denied'}), 403
        except:
            return jsonify({'error': 'Invalid path'}), 400

        # Check if directory exists
        if not target_dir.exists():
            return jsonify({'error': 'Directory not found'}), 404

        if not target_dir.is_dir():
            return jsonify({'error': 'Not a directory'}), 400

        # Get directory contents
        items = []

        try:
            for item in target_dir.iterdir():
                item_info = {
                    'name': item.name,
                    'type': 'dir' if item.is_dir() else 'file',
                    'size': item.stat().st_size if item.is_file() else 0,
                    'modified': item.stat().st_mtime,
                    'path': str(item.relative_to(base_dir))
                }

                # Add MIME type for files
                if item.is_file():
                    mime_type, _ = mimetypes.guess_type(str(item))
                    item_info['mime_type'] = mime_type

                items.append(item_info)

        except PermissionError:
            return jsonify({'error': 'Permission denied'}), 403

        # Sort items (directories first, then files)
        items.sort(key=lambda x: (x['type'] != 'dir', x['name'].lower()))

        # Log directory access
        SystemLog.log_action('directory_accessed',
                             f'User {current_user.username} accessed directory: {directory}',
                             user_id=current_user.id)

        return jsonify({
            'items': items,
            'path': directory,
            'total': len(items)
        })

    except Exception as e:
        SystemLog.log_action('explorer_error',
                             f'Explorer error for {current_user.username}: {str(e)}',
                             user_id=current_user.id,
                             level='ERROR')
        return jsonify({'error': str(e)}), 500


@api_bp.route('/files/<path:filepath>')
@login_required
def serve_file(filepath):
    """
    Serve user files securely.
    Only allows access to files within the user's directory.
    """

    try:
        # Update user activity
        current_user.update_activity()

        # Construct safe file path
        base_dir = Config.USER_FILES_DIR
        file_path = base_dir / filepath

        # Security check - ensure file is within user space
        try:
            file_path = file_path.resolve()
            base_dir = base_dir.resolve()
            if not str(file_path).startswith(str(base_dir)):
                return jsonify({'error': 'Access denied'}), 403
        except:
            return jsonify({'error': 'Invalid path'}), 400

        # Check if file exists
        if not file_path.exists():
            return jsonify({'error': 'File not found'}), 404

        if not file_path.is_file():
            return jsonify({'error': 'Not a file'}), 400

        # Log file access
        SystemLog.log_action('file_accessed',
                             f'User {current_user.username} accessed file: {filepath}',
                             user_id=current_user.id)

        # Serve the file
        return send_file(file_path)

    except Exception as e:
        SystemLog.log_action('file_serve_error',
                             f'File serve error for {current_user.username}: {str(e)}',
                             user_id=current_user.id,
                             level='ERROR')
        return jsonify({'error': str(e)}), 500


@api_bp.route('/upload', methods=['POST'])
@login_required
def upload_file():
    """
    Upload files to user directory.
    Handles file uploads with security validation.
    """

    try:
        # Update user activity
        current_user.update_activity()

        # Check if file was provided
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Validate file
        if file and file.filename:
            # Secure the filename
            filename = secure_filename(file.filename)

            # Additional filename validation
            if not filename or '.' not in filename:
                return jsonify({'error': 'Invalid filename'}), 400

            # Check file size (limit defined in config)
            if request.content_length > current_app.config['MAX_CONTENT_LENGTH']:
                return jsonify({'error': 'File too large'}), 413

            # Construct save path
            save_path = Config.USER_FILES_DIR / filename

            # Check if file already exists
            if save_path.exists():
                # Generate unique filename
                name, ext = os.path.splitext(filename)
                counter = 1
                while save_path.exists():
                    new_filename = f"{name}_{counter}{ext}"
                    save_path = Config.USER_FILES_DIR / new_filename
                    counter += 1
                filename = save_path.name

            # Save the file
            file.save(save_path)

            # Update user file statistics
            current_user.increment_stat('files_created')

            # Log file upload
            SystemLog.log_action('file_uploaded',
                                 f'User {current_user.username} uploaded: {filename}',
                                 user_id=current_user.id)

            return jsonify({
                'success': True,
                'filename': filename,
                'size': save_path.stat().st_size,
                'message': f'File uploaded successfully: {filename}'
            })

    except Exception as e:
        SystemLog.log_action('upload_error',
                             f'Upload error for {current_user.username}: {str(e)}',
                             user_id=current_user.id,
                             level='ERROR')
        return jsonify({'error': str(e)}), 500


@api_bp.route('/save', methods=['POST'])
@login_required
def save_file():
    """
    Save text content to a file.
    Used by text editors and other applications.
    """

    try:
        # Update user activity
        current_user.update_activity()

        # Get JSON data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        filename = data.get('filename', '').strip()
        content = data.get('content', '')

        if not filename:
            return jsonify({'error': 'Filename is required'}), 400

        # Secure the filename
        filename = secure_filename(filename)
        if not filename:
            return jsonify({'error': 'Invalid filename'}), 400

        # Construct save path
        file_path = Config.USER_FILES_DIR / filename

        # Security check - ensure file is within user space
        try:
            file_path = file_path.resolve()
            base_dir = Config.USER_FILES_DIR.resolve()
            if not str(file_path).startswith(str(base_dir)):
                return jsonify({'error': 'Access denied'}), 403
        except:
            return jsonify({'error': 'Invalid path'}), 400

        # Save the file
        file_path.write_text(content, encoding='utf-8')

        # Update user file statistics
        current_user.increment_stat('files_created')

        # Log file save
        SystemLog.log_action('file_saved',
                             f'User {current_user.username} saved: {filename}',
                             user_id=current_user.id)

        return jsonify({
            'success': True,
            'filename': filename,
            'size': file_path.stat().st_size,
            'message': f'File saved successfully: {filename}'
        })

    except Exception as e:
        SystemLog.log_action('save_error',
                             f'Save error for {current_user.username}: {str(e)}',
                             user_id=current_user.id,
                             level='ERROR')
        return jsonify({'error': str(e)}), 500


@api_bp.route('/games/score', methods=['POST'])
@login_required
def record_game_score():
    """
    Record a game score for the current user.
    Used by games to save high scores and statistics.
    """

    try:
        # Update user activity
        current_user.update_activity()

        # Get JSON data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        game_name = data.get('game_name', '').strip().lower()
        score = data.get('score', 0)
        level = data.get('level', 1)
        duration = data.get('duration', 0)

        # Validate input
        if not game_name:
            return jsonify({'error': 'Game name is required'}), 400

        if game_name not in ['snake', 'dino', 'memory', 'clicker']:
            return jsonify({'error': 'Invalid game name'}), 400

        try:
            score = int(score)
            level = int(level)
            duration = int(duration)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid score data'}), 400

        if score < 0:
            return jsonify({'error': 'Score cannot be negative'}), 400

        # Record the score
        game_score = GameScore.record_score(
            user_id=current_user.id,
            game_name=game_name,
            score=score,
            level=level,
            duration=duration
        )

        # Check if it's a new high score
        high_score = GameScore.get_high_score(current_user.id, game_name)
        is_new_high = score >= high_score

        # Log game score
        SystemLog.log_action('game_score_recorded',
                             f'User {current_user.username} scored {score} in {game_name}',
                             user_id=current_user.id)

        return jsonify({
            'success': True,
            'score': score,
            'high_score': high_score,
            'is_new_high': is_new_high,
            'message': 'Score recorded successfully'
        })

    except Exception as e:
        SystemLog.log_action('game_score_error',
                             f'Score recording error for {current_user.username}: {str(e)}',
                             user_id=current_user.id,
                             level='ERROR')
        return jsonify({'error': str(e)}), 500


@api_bp.route('/games/leaderboard/<game_name>')
@login_required
def get_leaderboard(game_name):
    """
    Get leaderboard for a specific game.
    Returns top scores for the specified game.
    """

    try:
        # Update user activity
        current_user.update_activity()

        # Validate game name
        if game_name.lower() not in ['snake', 'dino', 'memory', 'clicker']:
            return jsonify({'error': 'Invalid game name'}), 400

        # Get leaderboard
        top_scores = GameScore.get_leaderboard(game_name.lower(), 10)

        # Convert to dictionary format
        leaderboard = []
        for i, score in enumerate(top_scores, 1):
            leaderboard.append({
                'rank': i,
                'username': score.user.username,
                'score': score.score,
                'level': score.level,
                'duration': score.duration,
                'date': score.created_at.isoformat()
            })

        # Get user's best score for this game
        user_best = GameScore.get_high_score(current_user.id, game_name.lower())

        return jsonify({
            'game': game_name,
            'leaderboard': leaderboard,
            'user_best_score': user_best
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/system/info')
@login_required
def system_info():
    """
    Get system information.
    Returns system statistics and information.
    """

    try:
        # Update user activity
        current_user.update_activity()

        # Get system statistics
        from models import User, UserSession

        stats = {
            'system': {
                'name': Config.APP_NAME,
                'version': Config.APP_VERSION,
                'uptime': 'System operational'
            },
            'users': {
                'total': User.query.count(),
                'active_sessions': UserSession.query.filter_by(is_active=True).count()
            },
            'games': {
                'total_scores': GameScore.query.count(),
                'games_available': ['snake', 'dino', 'memory', 'clicker']
            },
            'current_user': {
                'username': current_user.username,
                'user_group': current_user.user_group,
                'login_count': current_user.login_count,
                'commands_executed': current_user.commands_executed,
                'files_created': current_user.files_created,
                'games_played': current_user.games_played
            }
        }

        return jsonify(stats)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/system/logs')
@login_required
def get_system_logs():
    """
    Get system logs for the current user.
    Returns recent activity logs.
    """

    try:
        # Only allow access to own logs unless admin
        if current_user.is_admin():
            # Admin can see all logs
            logs = SystemLog.query.order_by(SystemLog.timestamp.desc()).limit(50).all()
        else:
            # Regular users see only their own logs
            logs = SystemLog.query.filter_by(user_id=current_user.id) \
                .order_by(SystemLog.timestamp.desc()).limit(50).all()

        # Convert to dictionary format
        log_data = []
        for log in logs:
            log_data.append({
                'id': log.id,
                'action': log.action,
                'details': log.details,
                'timestamp': log.timestamp.isoformat(),
                'level': log.level,
                'username': log.user.username if log.user else 'System'
            })

        return jsonify({
            'logs': log_data,
            'total': len(log_data)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/preferences', methods=['GET', 'POST'])
@login_required
def user_preferences():
    """
    Get or update user preferences.
    GET: Return current preferences
    POST: Update preferences
    """

    try:
        # Update user activity
        current_user.update_activity()

        if request.method == 'GET':
            # Return current preferences
            preferences = current_user.get_preferences()
            return jsonify({
                'preferences': preferences,
                'success': True
            })

        elif request.method == 'POST':
            # Update preferences
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            # Get current preferences and merge with new ones
            current_prefs = current_user.get_preferences()
            current_prefs.update(data)

            # Save updated preferences
            current_user.set_preferences(current_prefs)

            # Log preference update
            SystemLog.log_action('preferences_updated',
                                 f'User {current_user.username} updated preferences',
                                 user_id=current_user.id)

            return jsonify({
                'success': True,
                'preferences': current_prefs,
                'message': 'Preferences updated successfully'
            })

    except Exception as e:
        SystemLog.log_action('preferences_error',
                             f'Preferences error for {current_user.username}: {str(e)}',
                             user_id=current_user.id,
                             level='ERROR')
        return jsonify({'error': str(e)}), 500


@api_bp.route('/health')
def health_check():
    """
    Health check endpoint.
    Returns system health status.
    """

    try:
        # Basic health checks
        db_status = 'healthy'
        try:
            User.query.first()
        except:
            db_status = 'unhealthy'

        health_data = {
            'status': 'healthy' if db_status == 'healthy' else 'unhealthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': Config.APP_VERSION,
            'database': db_status
        }

        status_code = 200 if health_data['status'] == 'healthy' else 503
        return jsonify(health_data), status_code

    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 503


# Error handlers for API blueprint
@api_bp.errorhandler(404)
def api_not_found(error):
    """Handle 404 errors in API context"""
    return jsonify({'error': 'API endpoint not found'}), 404


@api_bp.errorhandler(405)
def method_not_allowed(error):
    """Handle 405 errors in API context"""
    return jsonify({'error': 'Method not allowed'}), 405


@api_bp.errorhandler(413)
def request_entity_too_large(error):
    """Handle file upload size errors"""
    return jsonify({'error': 'File too large'}), 413


@api_bp.errorhandler(500)
def api_internal_error(error):
    """Handle 500 errors in API context"""
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500