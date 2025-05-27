#!/usr/bin/env python3
"""
System Information API Endpoint
Add this to your routes/api.py file or create it if it doesn't exist
"""

import os
import time
import platform
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

# Create the API blueprint
api_bp = Blueprint('api', __name__)


@api_bp.route('/system/info')
@login_required
def system_info():
    """
    Get system information for the task manager
    """
    try:
        # Basic system information
        system_data = {
            'cpu': {
                'percent': 0.0,  # We'll try to get real CPU usage
                'cores': os.cpu_count() or 4
            },
            'memory': {
                'total': 0,
                'used': 0,
                'percent': 0.0
            },
            'disk': {
                'total': 0,
                'used': 0,
                'percent': 0.0
            },
            'uptime': time.time() - getattr(system_info, '_start_time', time.time()),
            'processes': []
        }

        # Try to get more detailed system info if psutil is available
        try:
            import psutil

            # CPU information
            system_data['cpu']['percent'] = psutil.cpu_percent(interval=0.1)

            # Memory information
            memory = psutil.virtual_memory()
            system_data['memory'] = {
                'total': memory.total,
                'used': memory.used,
                'percent': memory.percent
            }

            # Disk information
            disk = psutil.disk_usage('/')
            system_data['disk'] = {
                'total': disk.total,
                'used': disk.used,
                'percent': (disk.used / disk.total) * 100
            }

            # Process information (top 10 by CPU usage)
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
                try:
                    proc_info = proc.info
                    if proc_info['cpu_percent'] is not None:
                        processes.append({
                            'pid': proc_info['pid'],
                            'name': proc_info['name'][:30],  # Limit name length
                            'cpu_percent': proc_info['cpu_percent'],
                            'memory_mb': proc_info['memory_info'].rss / 1024 / 1024 if proc_info['memory_info'] else 0
                        })
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    pass

            # Sort by CPU usage and take top 10
            processes.sort(key=lambda x: x['cpu_percent'], reverse=True)
            system_data['processes'] = processes[:10]

        except ImportError:
            # psutil not available, provide mock data
            print("⚠️ psutil not installed - using mock system data")

            # Mock CPU usage (random-ish)
            import random
            system_data['cpu']['percent'] = random.uniform(5.0, 25.0)

            # Mock memory usage (8GB total)
            total_memory = 8 * 1024 * 1024 * 1024  # 8GB
            used_memory = int(total_memory * 0.45)  # 45% used
            system_data['memory'] = {
                'total': total_memory,
                'used': used_memory,
                'percent': 45.0
            }

            # Mock disk usage (100GB total)
            total_disk = 100 * 1024 * 1024 * 1024  # 100GB
            used_disk = int(total_disk * 0.6)  # 60% used
            system_data['disk'] = {
                'total': total_disk,
                'used': used_disk,
                'percent': 60.0
            }

            # Mock processes
            system_data['processes'] = [
                {'pid': 1234, 'name': 'flask', 'cpu_percent': 12.5, 'memory_mb': 125.3},
                {'pid': 5678, 'name': 'python', 'cpu_percent': 8.2, 'memory_mb': 89.7},
                {'pid': 9012, 'name': 'chrome', 'cpu_percent': 15.1, 'memory_mb': 234.8},
                {'pid': 3456, 'name': 'firefox', 'cpu_percent': 6.7, 'memory_mb': 156.2},
                {'pid': 7890, 'name': 'code', 'cpu_percent': 4.3, 'memory_mb': 178.9}
            ]

        # Store start time for uptime calculation
        if not hasattr(system_info, '_start_time'):
            system_info._start_time = time.time()

        return jsonify(system_data)

    except Exception as e:
        print(f"❌ System info API error: {e}")
        return jsonify({
            'error': True,
            'message': f'Failed to get system information: {str(e)}'
        }), 500


@api_bp.route('/music')
@login_required
def music_files():
    """
    Get music files for the music player
    """
    try:
        music_dir = os.path.join('user_files', 'music')
        music_files = []

        if os.path.exists(music_dir):
            for root, dirs, files in os.walk(music_dir):
                for file in files:
                    if file.lower().endswith(('.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac')):
                        rel_path = os.path.relpath(os.path.join(root, file), music_dir)
                        music_files.append({
                            'title': os.path.splitext(file)[0],
                            'path': rel_path,
                            'artist': 'Unknown Artist',
                            'album': 'Unknown Album'
                        })

        return jsonify({
            'files': music_files,
            'count': len(music_files)
        })

    except Exception as e:
        print(f"❌ Music API error: {e}")
        return jsonify({
            'error': True,
            'message': f'Failed to get music files: {str(e)}'
        }), 500


@api_bp.route('/files/<path:filename>')
@login_required
def serve_user_file(filename):
    """
    Serve user files (music, images, etc.)
    """
    try:
        from flask import send_from_directory
        return send_from_directory('user_files', filename)
    except Exception as e:
        print(f"❌ File serving error: {e}")
        return jsonify({
            'error': True,
            'message': f'File not found: {str(e)}'
        }), 404


@api_bp.route('/explorer/<path:directory>')
@login_required
def explorer_api(directory='/'):
    """
    File explorer API endpoint
    """
    try:
        base_path = os.path.join(os.getcwd(), 'user_files')
        if directory.startswith('/'):
            directory = directory[1:]  # Remove leading slash

        target_path = os.path.join(base_path, directory) if directory else base_path

        if not os.path.exists(target_path):
            return jsonify({'error': True, 'message': 'Directory not found'}), 404

        items = []
        try:
            for item_name in os.listdir(target_path):
                item_path = os.path.join(target_path, item_name)

                if os.path.isdir(item_path):
                    items.append({
                        'name': item_name,
                        'type': 'dir',
                        'size': 0,
                        'modified': os.path.getmtime(item_path)
                    })
                else:
                    items.append({
                        'name': item_name,
                        'type': 'file',
                        'size': os.path.getsize(item_path),
                        'modified': os.path.getmtime(item_path)
                    })

        except PermissionError:
            return jsonify({'error': True, 'message': 'Permission denied'}), 403

        return jsonify({
            'path': f'/{directory}' if directory else '/',
            'items': items
        })

    except Exception as e:
        print(f"❌ Explorer API error: {e}")
        return jsonify({
            'error': True,
            'message': f'Failed to read directory: {str(e)}'
        }), 500


@api_bp.route('/command', methods=['POST'])
@login_required
def execute_command():
    """
    Execute terminal commands
    """
    try:
        data = request.get_json()
        command = data.get('command', '').strip()

        if not command:
            return jsonify({'error': True, 'message': 'No command provided'})

        # Simple command processing (extend as needed)
        if command == 'help':
            output = """Available commands:
help        - Show this help message
ls          - List files
pwd         - Show current directory  
date        - Show current date/time
whoami      - Show current user
clear       - Clear terminal
echo <text> - Display text
sysinfo     - Show system information
uptime      - Show system uptime
"""
        elif command == 'ls':
            output = "documents/  downloads/  pictures/  music/  videos/  README.txt"
        elif command == 'pwd':
            output = "/home/user"
        elif command == 'date':
            output = time.strftime("%Y-%m-%d %H:%M:%S")
        elif command == 'whoami':
            output = current_user.username if current_user.is_authenticated else 'guest'
        elif command == 'clear':
            return jsonify({'clear': True})
        elif command.startswith('echo '):
            output = command[5:]  # Remove 'echo ' prefix
        elif command == 'sysinfo':
            output = f"""System Information:
OS: {platform.system()} {platform.release()}
Python: {platform.python_version()}
User: {current_user.username if current_user.is_authenticated else 'guest'}
CPU Cores: {os.cpu_count()}
"""
        elif command == 'uptime':
            uptime_seconds = time.time() - getattr(execute_command, '_start_time', time.time())
            hours = int(uptime_seconds // 3600)
            minutes = int((uptime_seconds % 3600) // 60)
            output = f"System uptime: {hours}h {minutes}m"
        else:
            output = f"Command not found: {command}\nType 'help' for available commands."

        return jsonify({'output': output})

    except Exception as e:
        print(f"❌ Command execution error: {e}")
        return jsonify({
            'error': True,
            'message': f'Command execution failed: {str(e)}'
        })


# Store start time for uptime calculations
execute_command._start_time = time.time()
system_info._start_time = time.time()

# Export the blueprint
__all__ = ['api_bp']