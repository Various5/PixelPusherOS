#!/usr/bin/env python3
"""
API Routes for Pixel Pusher OS
Handles API endpoints for file management, commands, and system operations
"""

import os
import json
import subprocess
import psutil
from pathlib import Path
from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from config import Config

api_bp = Blueprint('api', __name__)


@api_bp.route('/files')
@login_required
def get_files():
    """Get directory contents for file explorer"""
    try:
        path = request.args.get('path', '/')

        # Normalize path and ensure it's safe
        if path.startswith('/'):
            path = path[1:]  # Remove leading slash

        # Construct full path to user_files directory
        user_files_dir = Config.USER_FILES_DIR
        full_path = user_files_dir / path if path else user_files_dir

        print(f"📁 Checking path: {full_path}")
        print(f"📁 User files dir exists: {user_files_dir.exists()}")
        print(f"📁 Full path exists: {full_path.exists()}")

        # Create user_files directory if it doesn't exist
        if not user_files_dir.exists():
            print("📁 Creating user_files directory...")
            Config.create_sample_files()

        # Security check - ensure path is within user_files
        try:
            full_path.resolve().relative_to(user_files_dir.resolve())
        except ValueError:
            return jsonify({'error': 'Invalid path - outside user directory'}), 400

        if not full_path.exists():
            print(f"📁 Path not found: {full_path}")
            return jsonify({'error': f'Path not found: {path}'}), 404

        if not full_path.is_dir():
            return jsonify({'error': 'Not a directory'}), 400

        # Get directory contents
        items = []
        try:
            for item in sorted(full_path.iterdir()):
                try:
                    stat = item.stat()
                    items.append({
                        'name': item.name,
                        'type': 'directory' if item.is_dir() else 'file',
                        'size': stat.st_size if item.is_file() else 0,
                        'modified': int(stat.st_mtime * 1000),  # Convert to milliseconds
                        'icon': get_file_icon(item.name, item.is_dir())
                    })
                except (OSError, PermissionError) as e:
                    print(f"📁 Skipping {item.name}: {e}")
                    continue  # Skip files we can't access
        except PermissionError:
            return jsonify({'error': 'Permission denied'}), 403

        print(f"📁 Returning {len(items)} items for path: {path}")
        return jsonify({'items': items})

    except Exception as e:
        print(f"📁 Error in get_files: {e}")
        return jsonify({'error': str(e)}), 500


def get_file_icon(filename, is_dir):
    """Get appropriate icon for file type"""
    if is_dir:
        return '📁'

    ext = filename.lower().split('.')[-1] if '.' in filename else ''

    icon_map = {
        'txt': '📄', 'md': '📝', 'pdf': '📕', 'doc': '📄', 'docx': '📄',
        'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'svg': '🖼️', 'webp': '🖼️',
        'mp3': '🎵', 'wav': '🎵', 'ogg': '🎵', 'flac': '🎵', 'm4a': '🎵', 'aac': '🎵',
        'mp4': '🎥', 'avi': '🎥', 'mov': '🎥', 'mkv': '🎥', 'webm': '🎥',
        'zip': '📦', 'rar': '📦', '7z': '📦', 'tar': '📦', 'gz': '📦',
        'json': '📋', 'xml': '📋', 'csv': '📊', 'xlsx': '📊', 'xls': '📊',
        'py': '🐍', 'js': '📜', 'html': '🌐', 'css': '🎨', 'php': '🐘',
        'java': '☕', 'cpp': '⚙️', 'c': '⚙️', 'h': '⚙️',
        'ppt': '📽️', 'pptx': '📽️', 'odp': '📽️'
    }

    return icon_map.get(ext, '📄')


@api_bp.route('/command', methods=['POST'])
@login_required
def execute_command():
    """Execute terminal commands"""
    try:
        data = request.get_json()
        if not data or 'command' not in data:
            return jsonify({'error': 'No command provided'}), 400

        command = data['command'].strip()
        if not command:
            return jsonify({'error': 'Empty command'}), 400

        # Handle built-in commands
        result = handle_builtin_command(command)
        if result:
            return jsonify(result)

        # For other commands, return a helpful message
        return jsonify({
            'output': f'Command "{command}" not recognized.\nType "help" for available commands.'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


def handle_builtin_command(command):
    """Handle built-in terminal commands"""
    parts = command.split()
    cmd = parts[0].lower()

    if cmd == 'help':
        return {
            'output': '''Available Commands:

help        - Show this help message
ls, dir     - List directory contents (simulated)
pwd         - Show current directory
date        - Show current date and time
whoami      - Show current user
echo        - Echo text
clear       - Clear terminal (handled by client)
sysinfo     - Show system information
about       - About Pixel Pusher OS
game        - Start a game (game snake, game dino, etc.)
explorer    - Open file explorer
settings    - Open settings

Examples:
  echo "Hello World"
  game snake
  sysinfo
            '''
        }

    elif cmd in ['ls', 'dir']:
        return {
            'output': '''📁 documents/     📁 downloads/     📁 pictures/
📁 music/        📁 videos/        📁 desktop/
📄 README.txt    📝 welcome.md     📋 system_info.json

Use the File Explorer for full file management capabilities.'''
        }

    elif cmd == 'pwd':
        return {'output': '/home/user'}

    elif cmd == 'date':
        from datetime import datetime
        return {'output': datetime.now().strftime('%A, %B %d, %Y %I:%M:%S %p')}

    elif cmd == 'whoami':
        return {'output': current_user.username if current_user.is_authenticated else 'guest'}

    elif cmd == 'echo':
        text = ' '.join(parts[1:]) if len(parts) > 1 else ''
        return {'output': text}

    elif cmd == 'about':
        return {
            'output': '''🎨 Pixel Pusher OS v2.0.0

A modern web-based desktop environment built with Flask and JavaScript.

Features:
• Professional desktop interface
• Built-in terminal with commands
• File explorer with media support  
• Gaming center with arcade games
• Music player for audio files
• Customizable themes and settings
• System monitoring tools

Built with ❤️ using modern web technologies.'''
        }

    elif cmd == 'sysinfo':
        try:
            import platform
            cpu_count = os.cpu_count()
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')

            return {
                'output': f'''System Information:

OS: {platform.system()} {platform.release()}
Platform: {platform.platform()}
CPU Cores: {cpu_count}
Memory: {memory.total // (1024 ** 3)} GB total, {memory.available // (1024 ** 3)} GB available
Disk: {disk.total // (1024 ** 3)} GB total, {disk.free // (1024 ** 3)} GB free
Python: {platform.python_version()}

Pixel Pusher OS Version: 2.0.0
User: {current_user.username if current_user.is_authenticated else 'guest'}
Group: {current_user.group if current_user.is_authenticated else 'user'}'''
            }
        except Exception as e:
            return {
                'output': f'''System Information:

Pixel Pusher OS Version: 2.0.0
User: {current_user.username if current_user.is_authenticated else 'guest'}
Platform: Web-based Desktop Environment

Note: Some system info unavailable: {str(e)}'''
            }

    elif cmd == 'game':
        if len(parts) > 1:
            game_name = parts[1].lower()
            valid_games = ['snake', 'dino', 'memory', 'village']
            if game_name in valid_games:
                return {'game_start': game_name}
            else:
                return {'output': f'Unknown game: {game_name}\nAvailable games: {", ".join(valid_games)}'}
        else:
            return {'output': 'Usage: game <name>\nAvailable games: snake, dino, memory, village'}

    elif cmd == 'explorer':
        return {'explorer': True}

    elif cmd == 'settings':
        return {'settings': True}

    return None  # Command not handled


@api_bp.route('/system/info')
@login_required
def system_info():
    """Get system information for task manager"""
    try:
        # Get system stats using psutil
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_cores = psutil.cpu_count()

        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        # Get top processes
        processes = []
        try:
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
                try:
                    pinfo = proc.info
                    processes.append({
                        'pid': pinfo['pid'],
                        'name': pinfo['name'],
                        'cpu_percent': pinfo['cpu_percent'] or 0,
                        'memory_mb': (pinfo['memory_info'].rss / 1024 / 1024) if pinfo['memory_info'] else 0
                    })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue

            # Sort by CPU usage and take top 10
            processes = sorted(processes, key=lambda x: x['cpu_percent'], reverse=True)[:10]
        except Exception as e:
            print(f"Error getting processes: {e}")
            processes = []

        return jsonify({
            'cpu': {
                'percent': cpu_percent,
                'cores': cpu_cores
            },
            'memory': {
                'total': memory.total,
                'used': memory.used,
                'percent': memory.percent
            },
            'disk': {
                'total': disk.total,
                'used': disk.used,
                'free': disk.free,
                'percent': (disk.used / disk.total) * 100
            },
            'uptime': psutil.boot_time(),
            'processes': processes
        })

    except ImportError:
        # Fallback if psutil is not available
        return jsonify({
            'cpu': {'percent': 0, 'cores': os.cpu_count() or 1},
            'memory': {'total': 0, 'used': 0, 'percent': 0},
            'disk': {'total': 0, 'used': 0, 'free': 0, 'percent': 0},
            'uptime': 0,
            'processes': []
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/music')
@login_required
def get_music_files():
    """Get music files for the music player"""
    try:
        music_dir = Config.USER_FILES_DIR / 'music'
        if not music_dir.exists():
            return jsonify({'files': []})

        music_files = []
        audio_extensions = {'.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.wma'}

        def scan_directory(directory, relative_path=''):
            for item in directory.iterdir():
                if item.is_file() and item.suffix.lower() in audio_extensions:
                    rel_path = str(Path(relative_path) / item.name) if relative_path else item.name
                    music_files.append({
                        'title': item.stem,
                        'artist': 'Unknown Artist',
                        'path': rel_path,
                        'size': item.stat().st_size
                    })
                elif item.is_dir():
                    new_rel_path = str(Path(relative_path) / item.name) if relative_path else item.name
                    scan_directory(item, new_rel_path)

        scan_directory(music_dir)

        return jsonify({'files': music_files})

    except Exception as e:
        return jsonify({'error': str(e)}), 500