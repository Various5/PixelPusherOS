#!/usr/bin/env python3
"""
Pixel Pusher OS - API Routes
RESTful API endpoints for frontend-backend communication.

This module provides:
- Terminal command execution API
- File system operations API
- Game highscore management API
- System information API
- File upload/download API
"""

import os
import time
import json
from flask import Blueprint, jsonify, request, send_from_directory, current_app
from flask_login import login_required, current_user

from utils.file_browser import FileBrowser
from config import Config

# Create API blueprint for all API endpoints
api_bp = Blueprint('api', __name__)


# Helper functions for game score management
def load_game_scores(game_name):
    """
    Load game scores from JSON file.

    Args:
        game_name (str): Name of the game (dino, snake, clicker, memory)

    Returns:
        list: List of score records
    """
    try:
        score_file = Config.HIGHSCORE_FILES.get(game_name)
        if score_file and os.path.exists(score_file):
            with open(score_file, 'r') as f:
                scores = json.load(f)
                print(f"📊 Loaded {len(scores)} scores for {game_name}")
                return scores
    except Exception as e:
        print(f"❌ Error loading {game_name} scores: {e}")

    return []


def save_game_scores(game_name, scores):
    """
    Save game scores to JSON file.

    Args:
        game_name (str): Name of the game
        scores (list): List of score records to save
    """
    try:
        score_file = Config.HIGHSCORE_FILES.get(game_name)
        if score_file:
            with open(score_file, 'w') as f:
                json.dump(scores, f, indent=2)
            print(f"💾 Saved {len(scores)} scores for {game_name}")
    except Exception as e:
        print(f"❌ Error saving {game_name} scores: {e}")


# Terminal Command API
@api_bp.route('/command/<path:command>')
@login_required
def execute_command(command):
    """
    Execute terminal command and return structured response.

    This endpoint processes terminal commands and returns appropriate responses:
    - Text output for regular commands
    - Special responses for visual effects, themes, etc.
    - Error handling for invalid commands

    Args:
        command (str): Command to execute

    Returns:
        JSON response with command output or special instructions
    """
    try:
        # Initialize file browser for command execution
        browser = FileBrowser()
        output = browser.execute(command)

        print(f"💻 Command executed by {current_user.username}: {command}")

        # Handle special command responses that trigger frontend actions
        if output == "__CLEAR__":
            return jsonify(clear=True)

        if output.startswith("__COLOR__::"):
            theme_name = output.split("::", 1)[1]
            return jsonify(color_theme=theme_name)

        if output.startswith("__EFFECT__::"):
            effect_name = output.split("::", 1)[1]
            return jsonify(start_effect=effect_name)

        if output.startswith("__WALLPAPER__::"):
            wallpaper_name = output.split("::", 1)[1]
            return jsonify(wallpaper=wallpaper_name)

        if output == "__EXPLORER__":
            return jsonify(explorer=True)

        if output.startswith("__GAME__::"):
            game_name = output.split("::", 1)[1]
            return jsonify(game_start=game_name)

        if output.startswith("__IMAGE__::"):
            image_path = output.split("::", 1)[1]
            return jsonify(image=image_path)

        if output.startswith("__VIDEO__::"):
            video_path = output.split("::", 1)[1]
            return jsonify(video=video_path)

        if output.startswith("__AUDIO__::"):
            audio_path = output.split("::", 1)[1]
            return jsonify(audio=audio_path)

        # Try to parse as JSON for editor responses
        try:
            editor_data = json.loads(output)
            if 'editor' in editor_data and 'content' in editor_data:
                return jsonify(
                    editor=editor_data['editor'],
                    content=editor_data['content']
                )
        except (json.JSONDecodeError, KeyError):
            pass

        # Return regular text output
        return jsonify(output=output)

    except Exception as e:
        print(f"❌ Command execution error: {e}")
        return jsonify(
            error=True,
            message=f"Command execution failed: {str(e)}"
        ), 500


# File Explorer API
@api_bp.route('/explorer/')
@api_bp.route('/explorer/<path:subpath>')
@login_required
def file_explorer(subpath=''):
    """
    File explorer API for directory navigation and file listing.

    Provides secure file system access with proper validation:
    - Lists directory contents
    - File and folder metadata
    - Security checks to prevent directory traversal

    Args:
        subpath (str): Relative path within user's file space

    Returns:
        JSON response with directory contents or error
    """
    try:
        browser = FileBrowser()
        safe_path = os.path.normpath(os.path.join(browser.current_dir, subpath))

        # Security check: ensure path is within allowed directory
        if not safe_path.startswith(Config.BASE_DIR):
            return jsonify(error="Access denied - path outside allowed directory"), 403

        if not os.path.isdir(safe_path):
            return jsonify(error="Directory not found"), 404

        # Get directory contents
        items = []
        try:
            for item_name in os.listdir(safe_path):
                item_path = os.path.join(safe_path, item_name)

                # Get item metadata
                stat_info = os.stat(item_path)
                item_data = {
                    'name': item_name,
                    'type': 'dir' if os.path.isdir(item_path) else 'file',
                    'size': stat_info.st_size if os.path.isfile(item_path) else 0,
                    'modified': stat_info.st_mtime,
                    'permissions': oct(stat_info.st_mode)[-3:]
                }
                items.append(item_data)

        except PermissionError:
            return jsonify(error="Permission denied"), 403

        # Sort items: directories first, then files
        items.sort(key=lambda x: (x['type'] != 'dir', x['name'].lower()))

        print(f"📁 Explorer accessed by {current_user.username}: {subpath or '/'}")

        return jsonify(
            path=subpath,
            items=items,
            total_items=len(items)
        )

    except Exception as e:
        print(f"❌ Explorer error: {e}")
        return jsonify(error=f"Failed to access directory: {str(e)}"), 500


# File Operations API
@api_bp.route('/save', methods=['POST'])
@login_required
def save_file():
    """
    Save file content to the file system.

    Handles text file creation and editing with security validation:
    - Content validation and sanitization
    - Path security checks
    - File type restrictions

    Request JSON:
        filename (str): Name of file to save
        content (str): File content to write

    Returns:
        JSON response indicating success or failure
    """
    try:
        data = request.get_json() or {}
        filename = data.get('filename', '').strip()
        content = data.get('content', '')

        # Input validation
        if not filename:
            return jsonify(error="Filename is required"), 400

        # Security: only allow text files
        allowed_extensions = ['.txt', '.md', '.json', '.css', '.html', '.js', '.py']
        if not any(filename.lower().endswith(ext) for ext in allowed_extensions):
            return jsonify(error="File type not allowed"), 400

        # Create safe file path
        safe_path = os.path.normpath(os.path.join(Config.BASE_DIR, filename))

        # Security check: ensure path is within allowed directory
        if not safe_path.startswith(Config.BASE_DIR):
            return jsonify(error="Access denied - invalid file path"), 403

        # Create directory if it doesn't exist
        file_dir = os.path.dirname(safe_path)
        os.makedirs(file_dir, exist_ok=True)

        # Write file content
        with open(safe_path, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"💾 File saved by {current_user.username}: {filename}")

        return jsonify(
            status="success",
            message=f"File '{filename}' saved successfully",
            size=len(content)
        )

    except Exception as e:
        print(f"❌ File save error: {e}")
        return jsonify(error=f"Failed to save file: {str(e)}"), 500


# File Listing API
@api_bp.route('/list')
@login_required
def list_files():
    """
    List files in the user's base directory.

    Provides a quick overview of available files and folders.

    Returns:
        JSON response with file listing
    """
    try:
        items = []

        for item_name in os.listdir(Config.BASE_DIR):
            item_path = os.path.join(Config.BASE_DIR, item_name)

            # Get item metadata
            stat_info = os.stat(item_path)
            item_data = {
                'name': item_name,
                'type': 'dir' if os.path.isdir(item_path) else 'file',
                'size': stat_info.st_size if os.path.isfile(item_path) else 0,
                'modified': time.strftime('%Y-%m-%d %H:%M:%S',
                                          time.localtime(stat_info.st_mtime))
            }
            items.append(item_data)

        # Sort items
        items.sort(key=lambda x: (x['type'] != 'dir', x['name'].lower()))

        return jsonify(items=items)

    except Exception as e:
        print(f"❌ File listing error: {e}")
        return jsonify(error=f"Failed to list files: {str(e)}"), 500


# Wallpaper API
@api_bp.route('/wallpapers')
def get_wallpapers():
    """
    Get list of available wallpaper images.

    Scans the wallpaper directory for image files.

    Returns:
        JSON response with wallpaper filenames
    """
    try:
        wallpaper_path = os.path.join(current_app.static_folder, 'wallpaper')
        wallpapers = []

        if os.path.exists(wallpaper_path):
            image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
            for filename in os.listdir(wallpaper_path):
                if any(filename.lower().endswith(ext) for ext in image_extensions):
                    wallpapers.append(filename)

        wallpapers.sort()

        return jsonify(wallpapers=wallpapers)

    except Exception as e:
        print(f"❌ Wallpaper listing error: {e}")
        return jsonify(wallpapers=[])


# Game Highscores API
@api_bp.route('/highscores/<game_name>', methods=['GET', 'POST'])
@login_required
def manage_highscores(game_name):
    """
    Manage game highscores (get/save).

    GET: Retrieve highscores for a game
    POST: Save new highscore

    Args:
        game_name (str): Name of the game

    Returns:
        JSON response with scores or save confirmation
    """
    # Validate game name
    valid_games = ['dino', 'snake', 'clicker', 'memory']
    if game_name not in valid_games:
        return jsonify(error="Unknown game"), 404

    if request.method == 'GET':
        # Return existing highscores
        scores = load_game_scores(game_name)
        return jsonify(scores=scores)

    elif request.method == 'POST':
        # Save new highscore
        try:
            data = request.get_json() or {}
            player_name = data.get('name', current_user.username).strip()
            score = int(data.get('score', 0))

            # Validate score
            if score < 0:
                return jsonify(error="Invalid score"), 400

            # Load existing scores
            scores = load_game_scores(game_name)

            # Add new score
            new_score = {
                'name': player_name,
                'score': score,
                'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
                'user': current_user.username
            }
            scores.append(new_score)

            # Sort by score (descending) and keep top 10
            scores = sorted(scores, key=lambda x: x['score'], reverse=True)[:10]

            # Save updated scores
            save_game_scores(game_name, scores)

            print(f"🏆 New {game_name} highscore: {score} by {player_name}")

            return jsonify(
                status="success",
                message="Highscore saved successfully",
                scores=scores,
                rank=next((i + 1 for i, s in enumerate(scores) if s['score'] == score), None)
            )

        except Exception as e:
            print(f"❌ Highscore save error: {e}")
            return jsonify(error=f"Failed to save highscore: {str(e)}"), 500


# System Information API
@api_bp.route('/uptime')
@login_required
def get_uptime():
    """
    Get server uptime information.

    Returns:
        JSON response with formatted uptime
    """
    try:
        from app import START_TIME
        uptime_seconds = int(time.time() - START_TIME)

        # Format uptime
        hours, remainder = divmod(uptime_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        days, hours = divmod(hours, 24)

        uptime_formatted = ""
        if days > 0:
            uptime_formatted += f"{days}d "
        if hours > 0:
            uptime_formatted += f"{hours}h "
        if minutes > 0:
            uptime_formatted += f"{minutes}m "
        uptime_formatted += f"{seconds}s"

        return jsonify(
            uptime=uptime_formatted,
            uptime_seconds=uptime_seconds,
            start_time=time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(START_TIME))
        )

    except Exception as e:
        print(f"❌ Uptime error: {e}")
        return jsonify(uptime="Unknown")


# File Download API
@api_bp.route('/files/<path:filename>')
@login_required
def serve_file(filename):
    """
    Serve files from the user directory.

    Provides secure file access with proper validation.

    Args:
        filename (str): Relative path to file

    Returns:
        File content or error response
    """
    try:
        # Create safe file path
        safe_path = os.path.normpath(os.path.join(Config.BASE_DIR, filename))

        # Security check: ensure path is within allowed directory
        if not safe_path.startswith(Config.BASE_DIR):
            return jsonify(error="Access denied"), 403

        if not os.path.exists(safe_path):
            return jsonify(error="File not found"), 404

        if not os.path.isfile(safe_path):
            return jsonify(error="Not a file"), 400

        print(f"📥 File served to {current_user.username}: {filename}")

        return send_from_directory(Config.BASE_DIR, filename)

    except Exception as e:
        print(f"❌ File serve error: {e}")
        return jsonify(error=f"Failed to serve file: {str(e)}"), 500


# API Status and Health Check
@api_bp.route('/status')
def api_status():
    """
    API health check endpoint.

    Returns basic API status and version information.
    Can be used by monitoring systems.

    Returns:
        JSON response with API status
    """
    return jsonify(
        status="online",
        api_version="2.0.0",
        app_name="Pixel Pusher OS",
        timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
        authenticated=current_user.is_authenticated if hasattr(current_user, 'is_authenticated') else False
    )


# Error handlers for API blueprint
@api_bp.errorhandler(400)
def bad_request(error):
    """Handle 400 Bad Request errors"""
    return jsonify(error="Bad request", message="The request was invalid"), 400


@api_bp.errorhandler(401)
def unauthorized(error):
    """Handle 401 Unauthorized errors"""
    return jsonify(error="Unauthorized", message="Authentication required"), 401


@api_bp.errorhandler(403)
def forbidden(error):
    """Handle 403 Forbidden errors"""
    return jsonify(error="Forbidden", message="Access denied"), 403


@api_bp.errorhandler(404)
def not_found(error):
    """Handle 404 Not Found errors"""
    return jsonify(error="Not found", message="Resource not found"), 404


@api_bp.errorhandler(500)
def internal_server_error(error):
    """Handle 500 Internal Server Error"""
    return jsonify(error="Internal server error", message="Something went wrong"), 500


print("🔌 API routes loaded successfully")