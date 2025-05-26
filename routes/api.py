#!/usr/bin/env python3
"""
Pixel Pusher OS - API Routes
Handles all API endpoints for terminal commands, file operations, and system functions.
"""

import os
import json
import mimetypes
from flask import Blueprint, request, jsonify, send_file, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename

from config import Config
from utils.file_browser import FileBrowser

# Create API blueprint
api_bp = Blueprint('api', __name__)

# Initialize FileBrowser for command processing
file_browser = FileBrowser()


@api_bp.route('/command/<path:command>')
@login_required
def execute_command(command):
    """
    Execute terminal command and return result.

    Args:
        command (str): The command to execute

    Returns:
        JSON response with command output or special command codes
    """
    try:
        print(f"🔧 Executing command: {command}")

        # Execute command through FileBrowser
        result = file_browser.execute(command)

        # Handle special command responses
        if result == "__CLEAR__":
            return jsonify({"clear": True})

        elif result.startswith("__COLOR__::"):
            theme = result.split("::")[-1]
            return jsonify({"color_theme": theme})

        elif result.startswith("__EFFECT__::"):
            effect = result.split("::")[-1]
            return jsonify({"start_effect": effect})

        elif result.startswith("__WALLPAPER__::"):
            wallpaper = result.split("::")[-1]
            return jsonify({"wallpaper": wallpaper})

        elif result == "__EXPLORER__":
            return jsonify({"explorer": True})

        elif result.startswith("__GAME__::"):
            game = result.split("::")[-1]
            return jsonify({"game_start": game})

        elif result.startswith("__IMAGE__::"):
            image_path = result.split("::")[-1]
            return jsonify({"image": image_path})

        elif result.startswith("__VIDEO__::"):
            video_path = result.split("::")[-1]
            return jsonify({"video": video_path})

        elif result.startswith("__AUDIO__::"):
            audio_path = result.split("::")[-1]
            return jsonify({"audio": audio_path})

        else:
            # Regular command output
            return jsonify({"output": result})

    except Exception as e:
        print(f"❌ Command execution error: {e}")
        return jsonify({"error": True, "message": str(e)}), 500


@api_bp.route('/explorer/')
@api_bp.route('/explorer/<path:directory>')
@login_required
def list_directory(directory=''):
    """
    List contents of a directory for file explorer.

    Args:
        directory (str): Directory path to list (relative to user's base directory)

    Returns:
        JSON response with directory contents
    """
    try:
        # Construct full path
        if directory:
            full_path = os.path.join(Config.BASE_DIR, directory)
        else:
            full_path = Config.BASE_DIR

        # Normalize path
        full_path = os.path.normpath(full_path)

        # Security check - ensure path is within allowed directory
        if not full_path.startswith(Config.BASE_DIR):
            return jsonify({"error": "Access denied"}), 403

        # Check if directory exists
        if not os.path.exists(full_path):
            return jsonify({"error": "Directory not found"}), 404

        if not os.path.isdir(full_path):
            return jsonify({"error": "Not a directory"}), 400

        # Get directory contents
        items = []
        try:
            for item_name in sorted(os.listdir(full_path)):
                # Skip hidden files
                if item_name.startswith('.'):
                    continue

                item_path = os.path.join(full_path, item_name)
                stat_info = os.stat(item_path)

                item_data = {
                    "name": item_name,
                    "type": "dir" if os.path.isdir(item_path) else "file",
                    "size": stat_info.st_size if os.path.isfile(item_path) else 0,
                    "modified": stat_info.st_mtime,
                    "permissions": oct(stat_info.st_mode)[-3:]
                }

                items.append(item_data)

        except PermissionError:
            return jsonify({"error": "Permission denied"}), 403

        return jsonify({
            "path": "/" + directory if directory else "/",
            "items": items,
            "total": len(items)
        })

    except Exception as e:
        print(f"❌ Directory listing error: {e}")
        return jsonify({"error": "Failed to list directory", "message": str(e)}), 500


@api_bp.route('/files/<path:filepath>')
@login_required
def serve_file(filepath):
    """
    Serve a file from the user's directory.

    Args:
        filepath (str): Path to file (relative to user's base directory)

    Returns:
        File content or error response
    """
    try:
        # Construct full path
        full_path = os.path.join(Config.BASE_DIR, filepath)
        full_path = os.path.normpath(full_path)

        # Security check
        if not full_path.startswith(Config.BASE_DIR):
            return jsonify({"error": "Access denied"}), 403

        # Check if file exists
        if not os.path.exists(full_path):
            return jsonify({"error": "File not found"}), 404

        if not os.path.isfile(full_path):
            return jsonify({"error": "Not a file"}), 400

        # Get mime type
        mime_type, _ = mimetypes.guess_type(full_path)
        if mime_type is None:
            mime_type = 'application/octet-stream'

        # Serve the file
        return send_file(full_path, mimetype=mime_type)

    except Exception as e:
        print(f"❌ File serving error: {e}")
        return jsonify({"error": "Failed to serve file", "message": str(e)}), 500


@api_bp.route('/save', methods=['POST'])
@login_required
def save_file():
    """
    Save content to a file.

    Expected JSON payload:
        {
            "filename": "path/to/file.txt",
            "content": "file content"
        }

    Returns:
        JSON response indicating success or failure
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        filename = data.get('filename')
        content = data.get('content', '')

        if not filename:
            return jsonify({"error": "Filename is required"}), 400

        # Construct full path
        full_path = os.path.join(Config.BASE_DIR, filename.lstrip('/'))
        full_path = os.path.normpath(full_path)

        # Security check
        if not full_path.startswith(Config.BASE_DIR):
            return jsonify({"error": "Access denied"}), 403

        # Create directory if it doesn't exist
        directory = os.path.dirname(full_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)

        # Write file
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)

        return jsonify({"success": True, "message": "File saved successfully"})

    except Exception as e:
        print(f"❌ File save error: {e}")
        return jsonify({"error": "Failed to save file", "message": str(e)}), 500


@api_bp.route('/upload', methods=['POST'])
@login_required
def upload_file():
    """
    Handle file uploads.

    Returns:
        JSON response with upload status
    """
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        # Secure the filename
        filename = secure_filename(file.filename)
        if not filename:
            return jsonify({"error": "Invalid filename"}), 400

        # Get target directory
        target_dir = request.form.get('directory', '')
        full_path = os.path.join(Config.BASE_DIR, target_dir, filename)
        full_path = os.path.normpath(full_path)

        # Security check
        if not full_path.startswith(Config.BASE_DIR):
            return jsonify({"error": "Access denied"}), 403

        # Create directory if needed
        directory = os.path.dirname(full_path)
        if not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)

        # Save file
        file.save(full_path)

        return jsonify({
            "success": True,
            "message": "File uploaded successfully",
            "filename": filename,
            "path": os.path.relpath(full_path, Config.BASE_DIR)
        })

    except Exception as e:
        print(f"❌ File upload error: {e}")
        return jsonify({"error": "Failed to upload file", "message": str(e)}), 500


@api_bp.route('/system/info')
@login_required
def system_info():
    """
    Get system information.

    Returns:
        JSON response with system details
    """
    try:
        import platform
        import psutil

        info = {
            "system": {
                "os": platform.system(),
                "os_version": platform.release(),
                "platform": platform.platform(),
                "processor": platform.processor() or "Unknown",
                "architecture": platform.architecture()[0],
                "python_version": platform.python_version()
            },
            "memory": {
                "total": psutil.virtual_memory().total,
                "available": psutil.virtual_memory().available,
                "percent": psutil.virtual_memory().percent
            },
            "disk": {
                "total": psutil.disk_usage('/').total,
                "free": psutil.disk_usage('/').free,
                "percent": (psutil.disk_usage('/').used / psutil.disk_usage('/').total * 100)
            },
            "cpu": {
                "percent": psutil.cpu_percent(interval=1),
                "cores_physical": psutil.cpu_count(logical=False),
                "cores_logical": psutil.cpu_count(logical=True)
            },
            "user": {
                "username": current_user.username if current_user.is_authenticated else "Unknown",
                "group": current_user.group if current_user.is_authenticated else "Unknown"
            }
        }

        return jsonify(info)

    except Exception as e:
        print(f"❌ System info error: {e}")
        return jsonify({"error": "Failed to get system info", "message": str(e)}), 500


@api_bp.route('/processes')
@login_required
def list_processes():
    """
    Get list of running processes (simulated for web environment).

    Returns:
        JSON response with process list
    """
    try:
        # Simulated processes for web environment
        processes = [
            {
                "pid": "system",
                "name": "System Manager",
                "cpu": 2.1,
                "memory": "45 MB",
                "status": "Running"
            },
            {
                "pid": "desktop",
                "name": "Desktop Environment",
                "cpu": 1.5,
                "memory": "32 MB",
                "status": "Running"
            },
            {
                "pid": "terminal",
                "name": "Terminal Service",
                "cpu": 0.8,
                "memory": "12 MB",
                "status": "Running"
            },
            {
                "pid": "explorer",
                "name": "File Explorer",
                "cpu": 0.5,
                "memory": "18 MB",
                "status": "Running"
            }
        ]

        return jsonify({"processes": processes})

    except Exception as e:
        print(f"❌ Process list error: {e}")
        return jsonify({"error": "Failed to get process list", "message": str(e)}), 500


@api_bp.route('/settings', methods=['GET', 'POST'])
@login_required
def handle_settings():
    """
    Handle system settings operations.

    GET: Retrieve current settings
    POST: Update settings

    Returns:
        JSON response with settings data or update status
    """
    try:
        if request.method == 'GET':
            # Return current settings (could be stored in database or config)
            settings = {
                "theme": "default",
                "wallpaper": None,
                "animations": True,
                "sound_enabled": True,
                "font_size": 14,
                "auto_save": True
            }
            return jsonify(settings)

        elif request.method == 'POST':
            # Update settings
            data = request.get_json()
            if not data:
                return jsonify({"error": "No settings data provided"}), 400

            # Here you would typically save to database
            # For now, just acknowledge the update
            return jsonify({
                "success": True,
                "message": "Settings updated successfully",
                "updated": data
            })

    except Exception as e:
        print(f"❌ Settings error: {e}")
        return jsonify({"error": "Failed to handle settings", "message": str(e)}), 500


@api_bp.route('/health')
def health_check():
    """
    Health check endpoint for monitoring.

    Returns:
        JSON response with system health status
    """
    return jsonify({
        "status": "healthy",
        "timestamp": int(time.time()),
        "version": "2.0.0",
        "service": "Pixel Pusher OS API"
    })


# Error handlers for API blueprint
@api_bp.errorhandler(404)
def api_not_found(error):
    """Handle API 404 errors"""
    return jsonify({"error": "API endpoint not found"}), 404


@api_bp.errorhandler(500)
def api_internal_error(error):
    """Handle API 500 errors"""
    return jsonify({"error": "Internal server error"}), 500


@api_bp.errorhandler(403)
def api_forbidden(error):
    """Handle API 403 errors"""
    return jsonify({"error": "Access forbidden"}), 403


print("🔗 API routes loaded successfully")