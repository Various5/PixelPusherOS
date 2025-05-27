#!/usr/bin/env python3
"""
Pixel Pusher OS - API Routes
Flask blueprint for API endpoints including terminal commands, file operations, and game data.
"""

import os
import json
import time
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


@api_bp.route('/command/<path:command>')
@login_required
def execute_command(command):
    """
    Execute terminal command and return result.

    Args:
        command (str): Command to execute

    Returns:
        JSON response with command output
    """
    try:
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
def explore_directory(path):
    """
    Get directory contents for file explorer.

    Args:
        path (str): Directory path to explore

    Returns:
        JSON response with directory contents
    """
    try:
        # Normalize path
        if not path or path == '/':
            path = ''

        # Use FileBrowser to get directory listing
        command = f'ls {path}' if path else 'ls'
        result = file_browser.execute(command)

        # For now, return a mock response
        # In a real implementation, you'd parse the ls result
        items = [
            {'name': 'Documents', 'type': 'dir', 'size': 0, 'modified': int(time.time())},
            {'name': 'Downloads', 'type': 'dir', 'size': 0, 'modified': int(time.time())},
            {'name': 'Pictures', 'type': 'dir', 'size': 0, 'modified': int(time.time())},
            {'name': 'example.txt', 'type': 'file', 'size': 1024, 'modified': int(time.time())},
        ]

        return jsonify({'items': items})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


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
        file_path = os.path.join(current_app.config['BASE_DIR'], 'data', filename)
        file_path = os.path.normpath(file_path)

        if not file_path.startswith(current_app.config['BASE_DIR']):
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
        file_path = os.path.join(current_app.config['BASE_DIR'], 'data', filename)
        file_path = os.path.normpath(file_path)

        if not file_path.startswith(current_app.config['BASE_DIR']):
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
        stats = {
            'uptime': time.time() - current_app.config.get('START_TIME', time.time()),
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


def allowed_file(filename):
    """
    Check if file extension is allowed.

    Args:
        filename (str): Filename to check

    Returns:
        bool: True if allowed, False otherwise
    """
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']


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