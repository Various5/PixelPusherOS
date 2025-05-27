#!/usr/bin/env python3
"""
Pixel Pusher OS - API Routes
Flask blueprint for API endpoints including terminal commands, file operations, and game data.
"""

import os
import json
import time
import psutil  # Add this to requirements.txt if not present
from flask import Blueprint, request, jsonify, send_file, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename

# Import models
from models import db, SystemLog, GameScore, FileMetadata, AppData

# Import utilities
from utils.file_browser import FileBrowser

# Create blueprint
api_bp = Blueprint('api', __name__)

# Initialize file browser
file_browser = FileBrowser()


@api_bp.route('/command', methods=['POST'])
@login_required
def execute_command():
    """
    Execute terminal command and return result.
    Fixed: Changed to POST method to handle commands properly.
    """
    try:
        data = request.get_json()
        command = data.get('command', '') if data else ''

        if not command:
            return jsonify({'error': True, 'message': 'No command provided'}), 400

        # Log the command execution
        SystemLog.log_event(
            level='INFO',
            category='COMMAND',
            action='execute',
            message=f'Command executed: {command}',
            user=current_user,
            request=request
        )

        # Execute command using FileBrowser
        result = file_browser.execute(command)

        # Handle special command responses
        if result.startswith('__CLEAR__'):
            return jsonify({'clear': True})
        elif result.startswith('__COLOR__::'):
            theme = result.split('::')[1]
            return jsonify({'color_theme': theme})
        elif result.startswith('__EFFECT__::'):
            effect = result.split('::')[1]
            return jsonify({'start_effect': effect})
        elif result.startswith('__WALLPAPER__::'):
            wallpaper = result.split('::')[1]
            return jsonify({'wallpaper': wallpaper})
        elif result.startswith('__EXPLORER__'):
            return jsonify({'explorer': True})
        elif result.startswith('__GAME__::'):
            game = result.split('::')[1]
            return jsonify({'game_start': game})
        elif result.startswith('__IMAGE__::'):
            image = result.split('::')[1]
            return jsonify({'image': image})
        elif result.startswith('__VIDEO__::'):
            video = result.split('::')[1]
            return jsonify({'video': video})
        elif result.startswith('__AUDIO__::'):
            audio = result.split('::')[1]
            return jsonify({'audio': audio})
        else:
            # Regular text output
            return jsonify({'output': result})

    except Exception as e:
        # Log the error
        SystemLog.log_event(
            level='ERROR',
            category='COMMAND',
            action='error',
            message=f'Command execution failed: {str(e)}',
            user=current_user,
            request=request
        )

        return jsonify({'error': True, 'message': str(e)}), 500


@api_bp.route('/explorer/<path:path>')
@login_required
def explore_directory(path=''):
    """
    Get directory contents for file explorer.
    Fixed: Returns proper JSON response for file explorer.
    """
    try:
        # Normalize path
        if not path or path == '/' or path == 'undefined':
            path = ''

        # Get the base directory
        base_dir = current_app.config.get('USER_FILES_DIR', 'user_files')

        # Construct full path
        if path:
            full_path = os.path.join(base_dir, path)
        else:
            full_path = base_dir

        # Ensure the directory exists
        if not os.path.exists(full_path):
            os.makedirs(full_path, exist_ok=True)

        items = []

        # Get directory contents
        try:
            for item_name in os.listdir(full_path):
                item_path = os.path.join(full_path, item_name)

                try:
                    stat = os.stat(item_path)

                    items.append({
                        'name': item_name,
                        'type': 'dir' if os.path.isdir(item_path) else 'file',
                        'size': stat.st_size if os.path.isfile(item_path) else 0,
                        'modified': int(stat.st_mtime)
                    })
                except OSError:
                    # Skip items we can't stat
                    continue

        except PermissionError:
            return jsonify({'error': 'Permission denied'}), 403

        return jsonify({'items': items})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/system/info')
@login_required
def system_info():
    """
    Get real system information including processes.
    Fixed: Returns actual system process data.
    """
    try:
        # Get CPU info
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_count = psutil.cpu_count()

        # Get memory info
        memory = psutil.virtual_memory()

        # Get disk info
        disk = psutil.disk_usage('/')

        # Get process list (top 10 by CPU usage)
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
            try:
                proc_info = proc.info
                processes.append({
                    'pid': proc_info['pid'],
                    'name': proc_info['name'],
                    'cpu_percent': proc_info['cpu_percent'],
                    'memory_mb': proc_info['memory_info'].rss / 1024 / 1024 if proc_info['memory_info'] else 0
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        # Sort by CPU usage and take top 10
        processes.sort(key=lambda x: x['cpu_percent'], reverse=True)
        processes = processes[:10]

        return jsonify({
            'cpu': {
                'percent': cpu_percent,
                'cores': cpu_count
            },
            'memory': {
                'total': memory.total,
                'used': memory.used,
                'percent': memory.percent,
                'available': memory.available
            },
            'disk': {
                'total': disk.total,
                'used': disk.used,
                'free': disk.free,
                'percent': disk.percent
            },
            'processes': processes,
            'uptime': time.time() - current_app.config.get('START_TIME', time.time())
        })

    except Exception as e:
        # Fallback to basic info if psutil fails
        return jsonify({
            'cpu': {'percent': 0, 'cores': os.cpu_count() or 1},
            'memory': {'total': 0, 'used': 0, 'percent': 0, 'available': 0},
            'disk': {'total': 0, 'used': 0, 'free': 0, 'percent': 0},
            'processes': [],
            'uptime': time.time() - current_app.config.get('START_TIME', time.time()),
            'error': str(e)
        })


@api_bp.route('/music')
@login_required
def get_music_files():
    """
    Get list of music files from user's music directory.
    Fixed: Scans actual music directory for audio files.
    """
    try:
        # Get music directory path
        base_dir = current_app.config.get('USER_FILES_DIR', 'user_files')
        music_dir = os.path.join(base_dir, 'music')

        # Ensure music directory exists
        if not os.path.exists(music_dir):
            os.makedirs(music_dir, exist_ok=True)

            # Create sample music files info
            sample_info = os.path.join(music_dir, 'README.txt')
            with open(sample_info, 'w') as f:
                f.write("Place your music files (MP3, WAV, OGG, FLAC, M4A) in this directory.\n")

        music_files = []
        audio_extensions = {'.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.wma'}

        # Scan for music files
        for root, dirs, files in os.walk(music_dir):
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in audio_extensions:
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, music_dir)

                    try:
                        stat = os.stat(file_path)
                        music_files.append({
                            'name': file,
                            'path': rel_path,
                            'size': stat.st_size,
                            'modified': int(stat.st_mtime),
                            'type': ext[1:],  # Remove dot
                            'title': os.path.splitext(file)[0],
                            'artist': 'Unknown Artist'  # You could parse ID3 tags here
                        })
                    except OSError:
                        continue

        return jsonify({
            'files': music_files,
            'count': len(music_files)
        })

    except Exception as e:
        return jsonify({'error': str(e), 'files': []}), 500


@api_bp.route('/files/<path:filename>')
@login_required
def serve_file(filename):
    """
    Serve files from the user's directory.

    Args:
        filename (str): File path to serve

    Returns:
        File response
    """
    try:
        # Security check - ensure file is in allowed directory
        base_dir = current_app.config.get('USER_FILES_DIR', 'user_files')
        file_path = os.path.join(base_dir, filename)
        file_path = os.path.normpath(file_path)

        # Ensure the requested file is within the user files directory
        if not file_path.startswith(os.path.abspath(base_dir)):
            return jsonify({'error': 'Access denied'}), 403

        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404

        # Log file access
        SystemLog.log_event(
            level='INFO',
            category='FILE',
            action='access',
            message=f'File accessed: {filename}',
            user=current_user,
            request=request
        )

        return send_file(file_path)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/save', methods=['POST'])
@login_required
def save_file():
    """
    Save file content to the user's directory.

    Returns:
        JSON response with save status
    """
    try:
        data = request.get_json()
        filename = data.get('filename')
        content = data.get('content', '')

        if not filename:
            return jsonify({'error': 'Filename is required'}), 400

        # Security check
        filename = secure_filename(filename)
        base_dir = current_app.config.get('USER_FILES_DIR', 'user_files')
        file_path = os.path.join(base_dir, filename)
        file_path = os.path.normpath(file_path)

        if not file_path.startswith(os.path.abspath(base_dir)):
            return jsonify({'error': 'Access denied'}), 403

        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        # Save file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

        # Log file save
        SystemLog.log_event(
            level='INFO',
            category='FILE',
            action='save',
            message=f'File saved: {filename}',
            user=current_user,
            request=request
        )

        return jsonify({'success': True, 'message': 'File saved successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/upload', methods=['POST'])
@login_required
def upload_file():
    """
    Upload file to the user's directory.

    Returns:
        JSON response with upload status
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Check file extension
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400

        # Secure filename
        filename = secure_filename(file.filename)
        upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)

        # Save file
        file.save(upload_path)

        # Create file metadata
        file_metadata = FileMetadata(
            filename=filename,
            original_filename=file.filename,
            file_path=upload_path,
            file_size=os.path.getsize(upload_path),
            user_id=current_user.id,
            upload_ip=request.remote_addr,
            mime_type=file.content_type
        )

        db.session.add(file_metadata)
        db.session.commit()

        # Log file upload
        SystemLog.log_event(
            level='INFO',
            category='FILE',
            action='upload',
            message=f'File uploaded: {filename}',
            user=current_user,
            request=request
        )

        return jsonify({'success': True, 'filename': filename})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/game/score', methods=['POST'])
@login_required
def save_game_score():
    """
    Save game score to database.

    Returns:
        JSON response with save status
    """
    try:
        data = request.get_json()
        game_name = data.get('game_name')
        score = data.get('score', 0)
        level = data.get('level')
        duration = data.get('duration')
        moves = data.get('moves')
        game_data = data.get('game_data')

        if not game_name:
            return jsonify({'error': 'Game name is required'}), 400

        # Save score
        game_score = GameScore.save_score(
            user_id=current_user.id,
            username=current_user.username,
            game_name=game_name,
            score=score,
            level=level,
            duration=duration,
            moves=moves,
            game_data=json.dumps(game_data) if game_data else None
        )

        # Check if it's a high score
        high_score = GameScore.get_high_score(game_name, current_user.id)
        is_high_score = high_score and high_score.id == game_score.id

        return jsonify({
            'success': True,
            'score_id': game_score.id,
            'is_high_score': is_high_score,
            'high_score': high_score.score if high_score else 0
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/game/leaderboard/<game_name>')
@login_required
def get_leaderboard(game_name):
    """
    Get leaderboard for a specific game.

    Args:
        game_name (str): Name of the game

    Returns:
        JSON response with leaderboard data
    """
    try:
        limit = request.args.get('limit', 10, type=int)
        scores = GameScore.get_leaderboard(game_name, limit)

        leaderboard = [score.to_dict() for score in scores]

        return jsonify({'leaderboard': leaderboard})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/app/data', methods=['GET', 'POST'])
@login_required
def app_data():
    """
    Get or set application data for the current user.

    Returns:
        JSON response with app data
    """
    try:
        if request.method == 'GET':
            app_name = request.args.get('app_name')
            data_key = request.args.get('data_key')

            if not app_name:
                return jsonify({'error': 'App name is required'}), 400

            app_data = AppData.get_user_app_data(current_user.id, app_name, data_key)

            if data_key:
                # Single value
                return jsonify({
                    'data': app_data.data_value if app_data else None
                })
            else:
                # All data for app
                data_dict = {item.data_key: item.data_value for item in app_data}
                return jsonify({'data': data_dict})

        else:  # POST
            data = request.get_json()
            app_name = data.get('app_name')
            data_key = data.get('data_key')
            data_value = data.get('data_value')

            if not app_name or not data_key:
                return jsonify({'error': 'App name and data key are required'}), 400

            app_data = AppData.set_user_app_data(
                current_user.id, app_name, data_key, data_value
            )

            return jsonify({'success': True, 'data': app_data.to_dict()})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/system/stats')
@login_required
def system_stats():
    """
    Get system statistics.

    Returns:
        JSON response with system stats
    """
    try:
        # Get START_TIME from app config or use current time as fallback
        start_time = current_app.config.get('START_TIME')
        if start_time is None:
            # If START_TIME is not set, try to get it from the global variable
            try:
                from app import START_TIME
                uptime = time.time() - START_TIME
            except ImportError:
                # Fallback to 0 if START_TIME is not available
                uptime = 0
        else:
            uptime = time.time() - start_time

        stats = {
            'uptime': uptime,
            'user_count': len(db.session.query(db.func.count(db.distinct(SystemLog.user_id))).scalar() or 0),
            'command_count': SystemLog.query.filter_by(category='COMMAND').count(),
            'file_count': FileMetadata.query.filter_by(is_active=True).count(),
            'game_scores': GameScore.query.count(),
            'current_user': current_user.username,
            'user_group': current_user.group
        }

        return jsonify(stats)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Error handlers
@api_bp.errorhandler(404)
def api_not_found(error):
    """Handle 404 errors in API."""
    return jsonify({'error': 'API endpoint not found'}), 404


@api_bp.errorhandler(500)
def api_internal_error(error):
    """Handle 500 errors in API."""
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500


print("🔗 API routes loaded successfully")