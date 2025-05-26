#!/usr/bin/env python3
"""
Pixel Pusher OS - API Routes
Flask blueprint for handling API endpoints used by the desktop applications.
"""

import os
import json
import time
import mimetypes
from flask import Blueprint, request, jsonify, send_file, send_from_directory, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from werkzeug.exceptions import BadRequest
from models import db, ApplicationLog, GameScore
from utils.file_browser import FileBrowser
from config import Config
from datetime import datetime

# Create API blueprint
api_bp = Blueprint('api', __name__)

# Initialize file browser for terminal commands
file_browser = FileBrowser()


@api_bp.route('/command/<path:command>')
@login_required
def execute_command(command):
    """
    Execute terminal commands through the FileBrowser utility
    """
    try:
        # Log command execution
        ApplicationLog.log_event(
            level='INFO',
            category='TERMINAL',
            message=f'User {current_user.username} executed command: {command}',
            user_id=current_user.id,
            ip_address=request.remote_addr,
            details={'command': command}
        )

        # Execute command through FileBrowser
        result = file_browser.execute(command)

        # Handle special command responses
        if result == "__CLEAR__":
            return jsonify({'clear': True})

        elif result.startswith("__COLOR__::"):
            theme = result.split("::", 1)[1]
            return jsonify({'color_theme': theme})

        elif result.startswith("__EFFECT__::"):
            effect = result.split("::", 1)[1]
            return jsonify({'start_effect': effect})

        elif result.startswith("__WALLPAPER__::"):
            wallpaper = result.split("::", 1)[1]
            return jsonify({'wallpaper': wallpaper})

        elif result == "__EXPLORER__":
            return jsonify({'explorer': True})

        elif result.startswith("__GAME__::"):
            game = result.split("::", 1)[1]
            return jsonify({'game_start': game})

        elif result.startswith("__IMAGE__::"):
            image_path = result.split("::", 1)[1]
            return jsonify({'image': image_path})

        elif result.startswith("__VIDEO__::"):
            video_path = result.split("::", 1)[1]
            return jsonify({'video': video_path})

        elif result.startswith("__AUDIO__::"):
            audio_path = result.split("::", 1)[1]
            return jsonify({'audio': audio_path})

        else:
            # Regular command output
            return jsonify({'output': result})

    except Exception as e:
        # Log command error
        ApplicationLog.log_event(
            level='ERROR',
            category='TERMINAL',
            message=f'Command execution error for user {current_user.username}: {str(e)}',
            user_id=current_user.id,
            ip_address=request.remote_addr,
            details={'command': command, 'error': str(e)}
        )

        return jsonify({
            'error': True,
            'message': f'Command failed: {str(e)}'
        }), 500


@api_bp.route('/explorer')
@api_bp.route('/explorer/<path:path>')
@login_required
def explore_directory(path=''):
    """
    File explorer API - list directory contents
    """
    try:
        # Normalize path
        if not path:
            path = '/'
        elif not path.startswith('/'):
            path = '/' + path

        # Security check - ensure path is within user's allowed directory
        full_path = os.path.join(Config.BASE_DIR, path.lstrip('/'))
        full_path = os.path.normpath(full_path)

        if not full_path.startswith(Config.BASE_DIR):
            return jsonify({'error': 'Access denied'}), 403

        if not os.path.exists(full_path):
            return jsonify({'error': 'Directory not found'}), 404

        if not os.path.isdir(full_path):
            return jsonify({'error': 'Not a directory'}), 400

        # List directory contents
        items = []
        try:
            for item_name in sorted(os.listdir(full_path)):
                item_path = os.path.join(full_path, item_name)

                # Skip hidden files unless requested
                if item_name.startswith('.') and not request.args.get('show_hidden'):
                    continue

                try:
                    stat_info = os.stat(item_path)

                    item_data = {
                        'name': item_name,
                        'type': 'dir' if os.path.isdir(item_path) else 'file',
                        'size': stat_info.st_size if os.path.isfile(item_path) else 0,
                        'modified': int(stat_info.st_mtime),
                        'permissions': oct(stat_info.st_mode)[-3:],
                        'path': os.path.join(path, item_name).replace('\\', '/')
                    }

                    # Add MIME type for files
                    if os.path.isfile(item_path):
                        mime_type, _ = mimetypes.guess_type(item_path)
                        item_data['mime_type'] = mime_type or 'application/octet-stream'

                    items.append(item_data)

                except (OSError, PermissionError):
                    # Skip files we can't access
                    continue

        except PermissionError:
            return jsonify({'error': 'Permission denied'}), 403

        # Log file explorer access
        ApplicationLog.log_event(
            level='INFO',
            category='EXPLORER',
            message=f'User {current_user.username} accessed directory: {path}',
            user_id=current_user.id,
            ip_address=request.remote_addr,
            details={'path': path, 'item_count': len(items)}
        )

        return jsonify({
            'path': path,
            'items': items,
            'parent': os.path.dirname(path) if path != '/' else None
        })

    except Exception as e:
        ApplicationLog.log_event(
            level='ERROR',
            category='EXPLORER',
            message=f'File explorer error for user {current_user.username}: {str(e)}',
            user_id=current_user.id,
            ip_address=request.remote_addr,
            details={'path': path, 'error': str(e)}
        )

        return jsonify({'error': 'Failed to access directory'}), 500


@api_bp.route('/files/<path:filepath>')
@login_required
def serve_file(filepath):
    """
    Serve files from the user's directory
    """
    try:
        # Security check
        full_path = os.path.join(Config.BASE_DIR, filepath)
        full_path = os.path.normpath(full_path)

        if not full_path.startswith(Config.BASE_DIR):
            return jsonify({'error': 'Access denied'}), 403

        if not os.path.exists(full_path):
            return jsonify({'error': 'File not found'}), 404

        if not os.path.isfile(full_path):
            return jsonify({'error': 'Not a file'}), 400

        # Log file access
        ApplicationLog.log_event(
            level='INFO',
            category='FILES',
            message=f'User {current_user.username} accessed file: {filepath}',
            user_id=current_user.id,
            ip_address=request.remote_addr,
            details={'filepath': filepath}
        )

        # Serve the file
        directory = os.path.dirname(full_path)
        filename = os.path.basename(full_path)

        return send_from_directory(directory, filename)

    except Exception as e:
        ApplicationLog.log_event(
            level='ERROR',
            category='FILES',
            message=f'File serve error for user {current_user.username}: {str(e)}',
            user_id=current_user.id,
            ip_address=request.remote_addr,
            details={'filepath': filepath, 'error': str(e)}
        )

        return jsonify({'error': 'Failed to serve file'}), 500


@api_bp.route('/save', methods=['POST'])
@login_required
def save_file():
    """
    Save file content to the user's directory
    """
    try:
        data = request.get_json()

        if not data or 'filename' not in data:
            return jsonify({'error': 'Filename is required'}), 400

        filename = data['filename']
        content = data.get('content', '')

        # Security check
        full_path = os.path.join(Config.BASE_DIR, filename.lstrip('/'))
        full_path = os.path.normpath(full_path)

        if not full_path.startswith(Config.BASE_DIR):
            return jsonify({'error': 'Access denied'}), 403

        # Ensure directory exists
        directory = os.path.dirname(full_path)
        os.makedirs(directory, exist_ok=True)

        # Save file
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)

        # Log file save
        ApplicationLog.log_event(
            level='INFO',
            category='FILES',
            message=f'User {current_user.username} saved file: {filename}',
            user_id=current_user.id,
            ip_address=request.remote_addr,
            details={'filename': filename, 'size': len(content)}
        )

        return jsonify({
            'success': True,
            'message': f'File saved: {filename}'
        })

    except Exception as e:
        ApplicationLog.log_event(
            level='ERROR',
            category='FILES',
            message=f'File save error for user {current_user.username}: {str(e)}',
            user_id=current_user.id,
            ip_address=request.remote_addr,
            details={'error': str(e)}
        )

        return jsonify({'error': 'Failed to save file'}), 500


@api_bp.route('/upload', methods=['POST'])
@login_required
def upload_file():
    """
    Handle file uploads
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Security check on filename
        filename = secure_filename(file.filename)
        if not filename:
            return jsonify({'error': 'Invalid filename'}), 400

        # Get upload path (default to uploads directory)
        upload_path = request.form.get('path', 'uploads')
        full_path = os.path.join(Config.BASE_DIR, upload_path.lstrip('/'), filename)
        full_path = os.path.normpath(full_path)

        if not full_path.startswith(Config.BASE_DIR):
            return jsonify({'error': 'Access denied'}), 403

        # Ensure directory exists
        directory = os.path.dirname(full_path)
        os.makedirs(directory, exist_ok=True)

        # Save uploaded file
        file.save(full_path)

        # Log file upload
        ApplicationLog.log_event(
            level='INFO',
            category='FILES',
            message=f'User {current_user.username} uploaded file: {filename}',
            user_id=current_user.id,
            ip_address=request.remote_addr,
            details={'filename': filename, 'path': upload_path}
        )

        return jsonify({
            'success': True,
            'message': f'File uploaded: {filename}',
            'filename': filename,
            'path': os.path.join(upload_path, filename).replace('\\', '/')
        })

    except Exception as e:
        ApplicationLog.log_event(
            level='ERROR',
            category='FILES',
            message=f'File upload error for user {current_user.username}: {str(e)}',
            user_id=current_user.id,
            ip_address=request.remote_addr,
            details={'error': str(e)}
        )

        return jsonify({'error': 'Failed to upload file'}), 500


@api_bp.route('/game/score', methods=['POST'])
@login_required
def save_game_score():
    """
    Save game score and check for high scores
    """
    try:
        data = request.get_json()

        if not data or 'game_name' not in data or 'score' not in data:
            return jsonify({'error': 'Game name and score are required'}), 400

        game_name = data['game_name']
        score = int(data['score'])
        level = int(data.get('level', 1))
        game_data = data.get('game_data', {})

        # Record the score
        is_high_score = GameScore.record_score(
            user_id=current_user.id,
            game_name=game_name,
            score=score,
            level=level,
            game_data=game_data
        )

        # Log game score
        ApplicationLog.log_event(
            level='INFO',
            category='GAMES',
            message=f'User {current_user.username} scored {score} in {game_name}',
            user_id=current_user.id,
            ip_address=request.remote_addr,
            details={
                'game_name': game_name,
                'score': score,
                'level': level,
                'is_high_score': is_high_score
            }
        )

        return jsonify({
            'success': True,
            'is_high_score': is_high_score,
            'message': 'New high score!' if is_high_score else 'Score recorded'
        })

    except Exception as e:
        ApplicationLog.log_event(
            level='ERROR',
            category='GAMES',
            message=f'Game score error for user {current_user.username}: {str(e)}',
            user_id=current_user.id,
            ip_address=request.remote_addr,
            details={'error': str(e)}
        )

        return jsonify({'error': 'Failed to save score'}), 500


@api_bp.route('/game/scores/<game_name>')
@login_required
def get_game_scores(game_name):
    """
    Get high scores for a specific game
    """
    try:
        # Get high scores for this game
        high_scores = GameScore.get_high_scores(game_name=game_name, limit=10)

        scores_data = []
        for score in high_scores:
            scores_data.append({
                'username': score.user.username,
                'score': score.score,
                'level': score.level,
                'timestamp': score.timestamp.isoformat(),
                'is_current_user': score.user_id == current_user.id
            })

        return jsonify({
            'game_name': game_name,
            'scores': scores_data
        })

    except Exception as e:
        return jsonify({'error': 'Failed to get high scores'}), 500


@api_bp.route('/system/info')
@login_required
def system_info():
    """
    Get system information
    """
    try:
        import psutil
        import platform

        # Basic system info
        system_data = {
            'platform': platform.system(),
            'platform_release': platform.release(),
            'platform_version': platform.version(),
            'architecture': platform.machine(),
            'hostname': platform.node(),
            'processor': platform.processor(),
            'python_version': platform.python_version(),
            'cpu_count': psutil.cpu_count(),
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory': {
                'total': psutil.virtual_memory().total,
                'available': psutil.virtual_memory().available,
                'percent': psutil.virtual_memory().percent
            },
            'disk': {
                'total': psutil.disk_usage('/').total,
                'used': psutil.disk_usage('/').used,
                'free': psutil.disk_usage('/').free,
                'percent': (psutil.disk_usage('/').used / psutil.disk_usage('/').total) * 100
            }
        }

        return jsonify(system_data)

    except ImportError:
        # psutil not available, return basic info
        import platform
        return jsonify({
            'platform': platform.system(),
            'python_version': platform.python_version(),
            'error': 'Detailed system info not available (psutil not installed)'
        })

    except Exception as e:
        return jsonify({'error': 'Failed to get system info'}), 500


@api_bp.route('/logs')
@login_required
def get_logs():
    """
    Get application logs (admin only for all logs, users only see their own)
    """
    try:
        # Check if user can see all logs
        if current_user.is_admin() and request.args.get('all') == 'true':
            logs_query = ApplicationLog.query
        else:
            logs_query = ApplicationLog.query.filter_by(user_id=current_user.id)

        # Apply filters
        level = request.args.get('level')
        if level:
            logs_query = logs_query.filter_by(level=level.upper())

        category = request.args.get('category')
        if category:
            logs_query = logs_query.filter_by(category=category.upper())

        # Pagination
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 50)), 100)

        logs = logs_query.order_by(ApplicationLog.timestamp.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        logs_data = []
        for log in logs.items:
            log_data = {
                'id': log.id,
                'timestamp': log.timestamp.isoformat(),
                'level': log.level,
                'category': log.category,
                'message': log.message,
                'ip_address': log.ip_address
            }

            # Include user info if admin
            if current_user.is_admin() and log.user:
                log_data['username'] = log.user.username

            # Include details if available
            if log.details:
                log_data['details'] = log.details

            logs_data.append(log_data)

        return jsonify({
            'logs': logs_data,
            'pagination': {
                'page': logs.page,
                'pages': logs.pages,
                'per_page': logs.per_page,
                'total': logs.total,
                'has_next': logs.has_next,
                'has_prev': logs.has_prev
            }
        })

    except Exception as e:
        return jsonify({'error': 'Failed to get logs'}), 500


@api_bp.route('/health')
def health_check():
    """
    Health check endpoint for monitoring
    """
    try:
        # Check database connection
        db.session.execute('SELECT 1')

        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '2.0.0',
            'database': 'connected'
        })

    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'timestamp': datetime.utcnow().isoformat(),
            'error': str(e)
        }), 500


# Error handlers for API blueprint
@api_bp.errorhandler(400)
def bad_request(error):
    """Handle bad request errors"""
    return jsonify({'error': 'Bad request'}), 400


@api_bp.errorhandler(404)
def api_not_found(error):
    """Handle API 404 errors"""
    return jsonify({'error': 'API endpoint not found'}), 404


@api_bp.errorhandler(500)
def api_internal_error(error):
    """Handle API internal errors"""
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500


print("🔌 API routes loaded successfully")