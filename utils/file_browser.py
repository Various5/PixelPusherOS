#!/usr/bin/env python3
"""
Basic File Browser Utility
A simplified version of the file browser for basic command execution.
"""

import os
import time
import platform
import subprocess
from pathlib import Path


class FileBrowser:
    """
    Basic file browser and command processor.
    """

    def __init__(self):
        """Initialize file browser."""
        self.current_dir = os.path.expanduser('~')
        self.command_history = []

    def execute(self, command):
        """
        Execute a command and return the result.

        Args:
            command (str): Command to execute

        Returns:
            str: Command output
        """
        if not command:
            return ""

        # Add to history
        self.command_history.append(command)

        # Parse command
        parts = command.split()
        if not parts:
            return ""

        cmd = parts[0].lower()
        args = parts[1:] if len(parts) > 1 else []

        # Handle basic commands
        if cmd == 'help':
            return self._help_command()
        elif cmd == 'clear':
            return "__CLEAR__"
        elif cmd == 'pwd':
            return self.current_dir
        elif cmd == 'whoami':
            return os.environ.get('USER', 'user')
        elif cmd == 'date':
            return time.strftime("%Y-%m-%d %H:%M:%S")
        elif cmd == 'time':
            return time.strftime("%H:%M:%S")
        elif cmd == 'echo':
            return ' '.join(args)
        elif cmd == 'ls' or cmd == 'dir':
            return self._list_directory(args[0] if args else '.')
        elif cmd == 'cd':
            return self._change_directory(args[0] if args else '~')
        elif cmd == 'mkdir':
            return self._make_directory(args[0] if args else '')
        elif cmd == 'rmdir':
            return self._remove_directory(args[0] if args else '')
        elif cmd == 'rm':
            return self._remove_file(args[0] if args else '')
        elif cmd == 'cat':
            return self._read_file(args[0] if args else '')
        elif cmd == 'sysinfo':
            return self._system_info()
        elif cmd == 'color':
            if args:
                return f"__COLOR__::{args[0]}"
            return "Available themes: default, blue, green, red, purple"
        elif cmd == 'effect':
            if args:
                return f"__EFFECT__::{args[0]}"
            return "Available effects: matrix, particles, stars"
        elif cmd == 'wallpaper':
            if args:
                return f"__WALLPAPER__::{args[0]}"
            return "Usage: wallpaper <filename>"
        elif cmd == 'explorer':
            return "__EXPLORER__"
        elif cmd == 'game':
            if args:
                return f"__GAME__::{args[0]}"
            return "Available games: snake, dino, memory, village"
        else:
            return f"Command '{cmd}' not found. Type 'help' for available commands."

    def _help_command(self):
        """Generate help text."""
        return """
Available Commands:
==================
help        - Show this help message
clear       - Clear the terminal
pwd         - Show current directory
whoami      - Show current user
date        - Show current date and time
time        - Show current time
echo <text> - Echo text
ls [dir]    - List directory contents
cd <dir>    - Change directory
mkdir <dir> - Create directory
rmdir <dir> - Remove directory
rm <file>   - Remove file
cat <file>  - Display file contents
sysinfo     - Show system information
color <theme> - Change color theme
effect <name> - Start visual effect
wallpaper <file> - Set wallpaper
explorer    - Open file explorer
game <name> - Start game

Type any command to execute it.
        """.strip()

    def _list_directory(self, path):
        """List directory contents."""
        if path == '.':
            path = self.current_dir
        elif not os.path.isabs(path):
            path = os.path.join(self.current_dir, path)

        try:
            if not os.path.exists(path):
                return f"Directory not found: {path}"

            if not os.path.isdir(path):
                return f"Not a directory: {path}"

            items = []
            for item in sorted(os.listdir(path)):
                item_path = os.path.join(path, item)
                if os.path.isdir(item_path):
                    items.append(f"📁 {item}/")
                else:
                    size = os.path.getsize(item_path)
                    items.append(f"📄 {item} ({self._format_size(size)})")

            if not items:
                return "Directory is empty"

            return "\n".join(items)

        except PermissionError:
            return f"Permission denied: {path}"
        except Exception as e:
            return f"Error listing directory: {str(e)}"

    def _change_directory(self, path):
        """Change current directory."""
        if path == '~':
            path = os.path.expanduser('~')
        elif not os.path.isabs(path):
            path = os.path.join(self.current_dir, path)

        try:
            if not os.path.exists(path):
                return f"Directory not found: {path}"

            if not os.path.isdir(path):
                return f"Not a directory: {path}"

            self.current_dir = os.path.abspath(path)
            return f"Changed directory to: {self.current_dir}"

        except PermissionError:
            return f"Permission denied: {path}"
        except Exception as e:
            return f"Error changing directory: {str(e)}"

    def _make_directory(self, dirname):
        """Create a directory."""
        if not dirname:
            return "Usage: mkdir <directory_name>"

        try:
            dir_path = os.path.join(self.current_dir, dirname)
            os.makedirs(dir_path, exist_ok=True)
            return f"Directory created: {dirname}"

        except Exception as e:
            return f"Error creating directory: {str(e)}"

    def _remove_directory(self, dirname):
        """Remove a directory."""
        if not dirname:
            return "Usage: rmdir <directory_name>"

        try:
            dir_path = os.path.join(self.current_dir, dirname)
            if not os.path.exists(dir_path):
                return f"Directory not found: {dirname}"

            if not os.path.isdir(dir_path):
                return f"Not a directory: {dirname}"

            os.rmdir(dir_path)
            return f"Directory removed: {dirname}"

        except OSError as e:
            return f"Error removing directory: {str(e)}"

    def _remove_file(self, filename):
        """Remove a file."""
        if not filename:
            return "Usage: rm <filename>"

        try:
            file_path = os.path.join(self.current_dir, filename)
            if not os.path.exists(file_path):
                return f"File not found: {filename}"

            if os.path.isdir(file_path):
                return f"Cannot remove directory with rm: {filename} (use rmdir)"

            os.remove(file_path)
            return f"File removed: {filename}"

        except Exception as e:
            return f"Error removing file: {str(e)}"

    def _read_file(self, filename):
        """Read and display file contents."""
        if not filename:
            return "Usage: cat <filename>"

        try:
            file_path = os.path.join(self.current_dir, filename)
            if not os.path.exists(file_path):
                return f"File not found: {filename}"

            if os.path.isdir(file_path):
                return f"Cannot read directory: {filename}"

            # Check file extension for media files
            ext = os.path.splitext(filename)[1].lower()
            if ext in ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp']:
                return f"__IMAGE__::{filename}"
            elif ext in ['.mp4', '.avi', '.mov', '.mkv', '.webm']:
                return f"__VIDEO__::{filename}"
            elif ext in ['.mp3', '.wav', '.ogg', '.flac', '.m4a']:
                return f"__AUDIO__::{filename}"

            # Read text file
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if len(content) > 2000:
                    content = content[:2000] + "\n... (content truncated)"
                return content

        except UnicodeDecodeError:
            return f"Cannot display binary file: {filename}"
        except Exception as e:
            return f"Error reading file: {str(e)}"

    def _system_info(self):
        """Get system information."""
        try:
            info = []
            info.append(f"System: {platform.system()}")
            info.append(f"Platform: {platform.platform()}")
            info.append(f"Architecture: {platform.architecture()[0]}")
            info.append(f"Processor: {platform.processor() or 'Unknown'}")
            info.append(f"Python: {platform.python_version()}")
            info.append(f"Current Directory: {self.current_dir}")
            info.append(f"Home Directory: {os.path.expanduser('~')}")

            return "\n".join(info)

        except Exception as e:
            return f"Error getting system info: {str(e)}"

    def _format_size(self, size):
        """Format file size in human readable format."""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"


print("📁 File Browser utility loaded successfully")