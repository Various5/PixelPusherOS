#!/usr/bin/env python3
"""
Pixel Pusher OS - FileBrowser Utility Class
Handles terminal command processing and file system operations.

This module provides:
- Terminal command execution and parsing
- File system navigation and operations
- System information gathering
- Command help and documentation
- Secure file access and validation
"""

import os
import time
import json
import platform
import psutil
import logging
import urllib.request
import collections

from config import Config


class FileBrowser:
    """
    File browser and terminal command processor for Pixel Pusher OS.

    This class handles all terminal commands and file operations:
    - Command parsing and execution
    - File system navigation
    - System information gathering
    - Security validation and access control
    """

    def __init__(self):
        """
        Initialize FileBrowser with secure defaults.

        Sets up the working directory and security constraints.
        """
        self.current_dir = Config.BASE_DIR  # User's secure file space
        self.command_history = []  # Track executed commands
        self.max_history = 100  # Limit history size

        print(f"📁 FileBrowser initialized - Base directory: {self.current_dir}")

    def execute(self, raw_command):
        """
        Execute a terminal command and return the result.

        This is the main command processor that routes commands to appropriate handlers.

        Args:
            raw_command (str): Raw command string from terminal

        Returns:
            str: Command output or special command code
        """
        # Clean and parse command
        command = raw_command.strip()
        if not command:
            return ""

        # Add to command history
        self._add_to_history(command)

        # Split command into parts
        parts = command.split(maxsplit=1)
        action = parts[0].lower()
        argument = parts[1] if len(parts) > 1 else ""

        print(f"🔧 Executing command: {action} {argument}")

        # Route command to appropriate handler
        command_handlers = {
            # Help and information commands
            'help': self._help_command,
            'menu': self._help_command,
            'about': self._about_command,
            'contact': self._contact_command,

            # System information commands
            'sysinfo': self._system_info,
            'time': lambda _: time.strftime("%H:%M:%S"),
            'date': lambda _: time.strftime("%Y-%m-%d %A"),
            'uptime': self._uptime_command,
            'whoami': lambda _: os.environ.get('USER', 'pixel-pusher'),

            # Terminal control
            'clear': lambda _: "__CLEAR__",
            'echo': lambda arg: arg or "",
            'pwd': self._pwd_command,

            # Visual effects and themes
            'color': self._color_command,
            'effect': self._effect_command,
            'wallpaper': self._wallpaper_command,

            # Network commands
            'curl': self._curl_command,
            'ping': self._ping_command,

            # Application launchers
            'explorer': lambda _: "__EXPLORER__",
            'game': self._game_command,

            # File system commands
            'ls': self._list_command,
            'dir': self._list_command,
            'cd': self._change_directory,
            'mkdir': self._make_directory,
            'touch': self._create_file,
            'del': self._delete_file,
            'rm': self._delete_file,
            'cat': self._read_file,
            'edit': self._edit_file,
            'rename': self._rename_file,
            'mv': self._rename_file,
            'properties': self._file_properties,
            'find': self._find_files,

            # System commands
            'ps': self._process_list,
            'kill': self._kill_process,
            'df': self._disk_usage,
            'free': self._memory_info,
        }

        # Execute command if handler exists
        if action in command_handlers:
            try:
                return command_handlers[action](argument)
            except Exception as e:
                logging.error(f"Command execution error: {action}", exc_info=e)
                return f"Error executing '{action}': {str(e)}"
        else:
            return f"Command '{action}' not found. Type 'help' for available commands."

    def _add_to_history(self, command):
        """Add command to history with size limit"""
        self.command_history.append({
            'command': command,
            'timestamp': time.time(),
            'working_dir': self.current_dir
        })

        # Limit history size
        if len(self.command_history) > self.max_history:
            self.command_history = self.command_history[-self.max_history:]

    def _help_command(self, _):
        """Generate comprehensive help documentation"""
        command_groups = collections.OrderedDict([
            ("📋 General Commands", [
                ("help", "Show this help menu"),
                ("about", "About Pixel Pusher OS"),
                ("contact", "Contact information"),
                ("clear", "Clear terminal screen"),
            ]),
            ("🕐 Date & Time", [
                ("time", "Show current time"),
                ("date", "Show current date"),
                ("uptime", "System uptime"),
            ]),
            ("📁 File Operations", [
                ("ls/dir", "List directory contents"),
                ("cd <dir>", "Change directory"),
                ("pwd", "Show current directory"),
                ("mkdir <name>", "Create directory"),
                ("touch <file>", "Create empty file"),
                ("del/rm <file>", "Delete file"),
                ("cat <file>", "Display file content"),
                ("edit <file>", "Edit text file"),
                ("rename <old> <new>", "Rename file/folder"),
                ("properties <item>", "Show item properties"),
                ("find <pattern>", "Search for files"),
            ]),
            ("💻 System Information", [
                ("sysinfo", "Detailed system information"),
                ("whoami", "Current user"),
                ("ps", "Running processes"),
                ("df", "Disk usage"),
                ("free", "Memory information"),
            ]),
            ("🎨 Visual & Themes", [
                ("color <theme>", "Change color theme"),
                ("effect <name>", "Start visual effect"),
                ("wallpaper <file>", "Set desktop wallpaper"),
            ]),
            ("🌐 Network", [
                ("curl <url>", "Fetch web content"),
                ("ping <host>", "Network connectivity test"),
            ]),
            ("🎮 Applications", [
                ("explorer", "Open file explorer"),
                ("game <name>", "Launch game (dino, snake, clicker, memory)"),
            ]),
        ])

        # Calculate column widths for nice formatting
        max_cmd_width = max(len(cmd) for cmds in command_groups.values() for cmd, _ in cmds)
        max_desc_width = max(len(desc) for cmds in command_groups.values() for _, desc in cmds)
        total_width = max_cmd_width + max_desc_width + 10

        # Build formatted help text
        help_lines = []
        help_lines.append("=" * total_width)
        help_lines.append(f"{'PIXEL PUSHER OS TERMINAL':^{total_width}}")
        help_lines.append("=" * total_width)

        for group_name, commands in command_groups.items():
            help_lines.append("")
            help_lines.append(f"{group_name}")
            help_lines.append("-" * len(group_name))

            for cmd, desc in commands:
                help_lines.append(f"  {cmd:<{max_cmd_width}} │ {desc}")

        help_lines.append("")
        help_lines.append("=" * total_width)
        help_lines.append("💡 Tip: Use TAB for command completion, ↑↓ for history")
        help_lines.append("🎯 Type command names for detailed usage information")

        return "\n".join(help_lines)

    def _about_command(self, _):
        """About Pixel Pusher OS information"""
        return """
╔══════════════════════════════════════════════╗
║            PIXEL PUSHER OS v2.0              ║
╠══════════════════════════════════════════════╣
║  A Modern Web-Based Desktop Environment      ║
║                                              ║
║  🎨 Features:                                ║
║  • Professional desktop interface           ║
║  • Built-in terminal with 50+ commands      ║
║  • File explorer with media support         ║
║  • Gaming center with 4 games               ║
║  • 12+ customizable themes                  ║
║  • Task manager and system tools            ║
║  • Responsive design for all devices        ║
║                                              ║
║  🔧 Built with: Flask + JavaScript + CSS    ║
║  📅 Version: 2.0.0 (2024)                   ║
║  📜 License: MIT License                     ║
╚══════════════════════════════════════════════╝
        """.strip()

    def _contact_command(self, _):
        """Contact information"""
        return """
📧 Contact Information:

  Support: support@pixelpusher.dev
  Website: https://pixelpusher.dev
  GitHub:  https://github.com/pixelpusher/os

  For technical support, please include:
  • Your browser version
  • Error messages (if any)
  • Steps to reproduce the issue
        """.strip()

    def _system_info(self, _):
        """Comprehensive system information"""
        try:
            # Gather system information
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')

            info_sections = [
                "🖥️  SYSTEM INFORMATION",
                "=" * 40,
                f"Operating System: {platform.system()} {platform.release()}",
                f"Platform: {platform.platform()}",
                f"Processor: {platform.processor() or 'Unknown'}",
                f"Architecture: {platform.architecture()[0]}",
                "",
                "💾 MEMORY & STORAGE",
                "=" * 40,
                f"Total RAM: {self._format_bytes(memory.total)}",
                f"Available RAM: {self._format_bytes(memory.available)}",
                f"RAM Usage: {memory.percent}%",
                f"Total Disk: {self._format_bytes(disk.total)}",
                f"Free Disk: {self._format_bytes(disk.free)}",
                f"Disk Usage: {(disk.used / disk.total * 100):.1f}%",
                "",
                "⚡ PERFORMANCE",
                "=" * 40,
                f"CPU Usage: {cpu_percent}%",
                f"CPU Cores: {psutil.cpu_count(logical=False)} physical, {psutil.cpu_count()} logical",
                f"Load Average: {os.getloadavg() if hasattr(os, 'getloadavg') else 'N/A'}",
                "",
                "🌐 NETWORK",
                "=" * 40,
                f"Hostname: {platform.node()}",
                f"User: {os.environ.get('USER', 'unknown')}",
                f"Python Version: {platform.python_version()}",
            ]

            return "\n".join(info_sections)

        except Exception as e:
            return f"Error gathering system information: {e}"

    def _format_bytes(self, bytes_value):
        """Format bytes into human-readable format"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes_value < 1024:
                return f"{bytes_value:.1f} {unit}"
            bytes_value /= 1024
        return f"{bytes_value:.1f} PB"

    def _uptime_command(self, _):
        """System uptime information"""
        try:
            if hasattr(psutil, 'boot_time'):
                boot_time = psutil.boot_time()
                uptime_seconds = time.time() - boot_time

                days, remainder = divmod(int(uptime_seconds), 86400)
                hours, remainder = divmod(remainder, 3600)
                minutes, seconds = divmod(remainder, 60)

                uptime_parts = []
                if days > 0:
                    uptime_parts.append(f"{days} day{'s' if days != 1 else ''}")
                if hours > 0:
                    uptime_parts.append(f"{hours} hour{'s' if hours != 1 else ''}")
                if minutes > 0:
                    uptime_parts.append(f"{minutes} minute{'s' if minutes != 1 else ''}")

                return f"System uptime: {', '.join(uptime_parts)}"
            else:
                return "Uptime information not available"
        except:
            return "Unable to determine system uptime"

    def _pwd_command(self, _):
        """Print working directory"""
        relative_path = os.path.relpath(self.current_dir, Config.BASE_DIR)
        return f"/{relative_path}" if relative_path != '.' else "/"

    def _color_command(self, theme_name):
        """Change terminal/desktop color theme"""
        valid_themes = [
            'default', 'blue', 'green', 'red', 'yellow',
            'magenta', 'cyan', 'white', 'matrix', 'neon',
            'ocean', 'sunset', 'forest'
        ]

        if not theme_name:
            return f"Available themes: {', '.join(valid_themes)}\nUsage: color <theme_name>"

        theme = theme_name.lower()
        if theme in valid_themes:
            return f"__COLOR__::{theme}"
        else:
            return f"Unknown theme '{theme_name}'. Available: {', '.join(valid_themes)}"

    def _effect_command(self, effect_name):
        """Start visual effects"""
        valid_effects = ['matrix', 'rain', 'stars', 'snow', 'particles']

        if not effect_name:
            return f"Available effects: {', '.join(valid_effects)}\nUsage: effect <effect_name>"

        effect = effect_name.lower()
        if effect in valid_effects:
            return f"__EFFECT__::{effect}"
        else:
            return f"Unknown effect '{effect_name}'. Available: {', '.join(valid_effects)}"

    def _wallpaper_command(self, filename):
        """Set desktop wallpaper"""
        if not filename:
            return "Usage: wallpaper <filename>\nExample: wallpaper sunset.jpg"

        return f"__WALLPAPER__::{filename}"

    def _curl_command(self, url):
        """Fetch content from URL"""
        if not url:
            return "Usage: curl <url>\nExample: curl https://api.github.com"

        # Add protocol if missing
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url

        try:
            with urllib.request.urlopen(url, timeout=10) as response:
                content = response.read().decode('utf-8', errors='ignore')

                # Limit output size for terminal display
                if len(content) > 2000:
                    content = content[:2000] + "\n... (content truncated)"

                return f"📡 Response from {url}:\n{'-' * 40}\n{content}"

        except Exception as e:
            return f"❌ Failed to fetch {url}: {str(e)}"

    def _ping_command(self, host):
        """Network connectivity test"""
        if not host:
            return "Usage: ping <hostname>\nExample: ping google.com"

        # Simple connectivity test using urllib
        try:
            test_url = f"https://{host}" if not host.startswith('http') else host
            start_time = time.time()

            with urllib.request.urlopen(test_url, timeout=5) as response:
                elapsed = (time.time() - start_time) * 1000
                return f"✅ {host} is reachable (response time: {elapsed:.0f}ms)"

        except Exception as e:
            return f"❌ {host} is unreachable: {str(e)}"

    def _game_command(self, game_name):
        """Launch game application"""
        valid_games = ['dino', 'snake', 'clicker', 'memory']

        if not game_name:
            return f"Available games: {', '.join(valid_games)}\nUsage: game <game_name>"

        game = game_name.lower()
        if game in valid_games:
            return f"__GAME__::{game}"
        else:
            return f"Unknown game '{game_name}'. Available: {', '.join(valid_games)}"

    # File system command implementations continue...
    def _list_command(self, path):
        """List directory contents with detailed information"""
        target_dir = os.path.join(self.current_dir, path) if path else self.current_dir
        target_dir = os.path.normpath(target_dir)

        # Security check
        if not target_dir.startswith(Config.BASE_DIR):
            return "❌ Access denied: Path outside allowed directory"

        if not os.path.exists(target_dir):
            return f"❌ Directory not found: {path or '.'}"

        if not os.path.isdir(target_dir):
            return f"❌ Not a directory: {path}"

        try:
            items = []
            total_size = 0

            for item_name in sorted(os.listdir(target_dir)):
                item_path = os.path.join(target_dir, item_name)
                stat_info = os.stat(item_path)

                # Format item information
                if os.path.isdir(item_path):
                    item_type = "📁 DIR "
                    size_str = "     --"
                else:
                    item_type = "📄 FILE"
                    size = stat_info.st_size
                    size_str = self._format_file_size(size)
                    total_size += size

                # Format modification time
                mod_time = time.strftime("%Y-%m-%d %H:%M", time.localtime(stat_info.st_mtime))

                # Format permissions
                permissions = oct(stat_info.st_mode)[-3:]

                items.append(f"{item_type} {size_str:>8} {permissions} {mod_time} {item_name}")

            # Build output
            header = f"📁 Contents of {self._pwd_command('')}"
            separator = "─" * 60
            footer = f"\n📊 Total: {len(items)} items"
            if total_size > 0:
                footer += f" • {self._format_file_size(total_size)} total size"

            if items:
                return f"{header}\n{separator}\n" + "\n".join(items) + footer
            else:
                return f"{header}\n{separator}\n(empty directory)"

        except PermissionError:
            return f"❌ Permission denied: Cannot access {path or 'current directory'}"
        except Exception as e:
            return f"❌ Error listing directory: {str(e)}"

    def _format_file_size(self, size):
        """Format file size for display"""
        if size == 0:
            return "0 B"

        units = ['B', 'KB', 'MB', 'GB']
        unit_index = 0

        while size >= 1024 and unit_index < len(units) - 1:
            size /= 1024
            unit_index += 1

        if unit_index == 0:
            return f"{size} {units[unit_index]}"
        else:
            return f"{size:.1f} {units[unit_index]}"

    # Additional file system methods would continue here...
    # For brevity, I'll include a few key ones

    def _change_directory(self, path):
        """Change current working directory"""
        if not path:
            return "Usage: cd <directory>\nExample: cd documents"

        if path == "..":
            # Go up one directory
            parent_dir = os.path.dirname(self.current_dir)
            if parent_dir and parent_dir.startswith(Config.BASE_DIR):
                self.current_dir = parent_dir
                return f"📁 Changed to: {self._pwd_command('')}"
            else:
                return "❌ Already at root directory"

        new_path = os.path.join(self.current_dir, path)
        new_path = os.path.normpath(new_path)

        # Security check
        if not new_path.startswith(Config.BASE_DIR):
            return "❌ Access denied: Path outside allowed directory"

        if not os.path.exists(new_path):
            return f"❌ Directory not found: {path}"

        if not os.path.isdir(new_path):
            return f"❌ Not a directory: {path}"

        self.current_dir = new_path
        return f"📁 Changed to: {self._pwd_command('')}"

    def _read_file(self, filename):
        """Display file content"""
        if not filename:
            return "Usage: cat <filename>\nExample: cat readme.txt"

        file_path = os.path.join(self.current_dir, filename)
        file_path = os.path.normpath(file_path)

        # Security check
        if not file_path.startswith(Config.BASE_DIR):
            return "❌ Access denied: File outside allowed directory"

        if not os.path.exists(file_path):
            return f"❌ File not found: {filename}"

        if not os.path.isfile(file_path):
            return f"❌ Not a file: {filename}"

        # Determine file type by extension
        _, ext = os.path.splitext(filename.lower())

        # Handle different file types
        if ext in ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']:
            return f"__IMAGE__::{os.path.relpath(file_path, Config.BASE_DIR)}"
        elif ext in ['.mp4', '.avi', '.mov', '.mkv', '.webm']:
            return f"__VIDEO__::{os.path.relpath(file_path, Config.BASE_DIR)}"
        elif ext in ['.mp3', '.wav', '.ogg', '.m4a', '.flac']:
            return f"__AUDIO__::{os.path.relpath(file_path, Config.BASE_DIR)}"
        else:
            # Text file - display content
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Limit output for very large files
                if len(content) > 5000:
                    content = content[:5000] + "\n... (file truncated, use editor to view full content)"

                return f"📄 Content of {filename}:\n{'─' * 40}\n{content}"

            except UnicodeDecodeError:
                return f"❌ Cannot display binary file: {filename}"
            except Exception as e:
                return f"❌ Error reading file: {str(e)}"


print("🔧 FileBrowser utility loaded successfully")