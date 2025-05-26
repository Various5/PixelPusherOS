#!/usr/bin/env python3
"""
Pixel Pusher OS - FileBrowser Utility Class (COMPLETE)
Handles terminal command processing and file system operations.
"""

import os
import time
import json
import platform
import psutil
import logging
import urllib.request
import collections
import shutil
import stat

from config import Config


class FileBrowser:
    """Complete file browser and terminal command processor for Pixel Pusher OS."""

    def __init__(self):
        """Initialize FileBrowser with secure defaults."""
        self.current_dir = Config.BASE_DIR
        self.command_history = []
        self.max_history = 100

        print(f"📁 FileBrowser initialized - Base directory: {self.current_dir}")

    def execute(self, raw_command):
        """Execute a terminal command and return the result."""
        command = raw_command.strip()
        if not command:
            return ""

        self._add_to_history(command)
        parts = command.split(maxsplit=1)
        action = parts[0].lower()
        argument = parts[1] if len(parts) > 1 else ""

        print(f"🔧 Executing command: {action} {argument}")

        # Command routing
        command_handlers = {
            # Help and information
            'help': self._help_command,
            'menu': self._help_command,
            'about': self._about_command,
            'contact': self._contact_command,

            # System information
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
            'cp': self._copy_file,
            'properties': self._file_properties,
            'find': self._find_files,
            'tree': self._tree_command,

            # System commands
            'ps': self._process_list,
            'kill': self._kill_process,
            'df': self._disk_usage,
            'free': self._memory_info,
            'history': self._show_history,
        }

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
                ("history", "Show command history"),
                ("echo <text>", "Display text"),
            ]),
            ("🕐 Date & Time", [
                ("time", "Show current time"),
                ("date", "Show current date"),
                ("uptime", "System uptime"),
            ]),
            ("📁 File Operations", [
                ("ls/dir [path]", "List directory contents"),
                ("cd <dir>", "Change directory"),
                ("pwd", "Show current directory"),
                ("mkdir <name>", "Create directory"),
                ("touch <file>", "Create empty file"),
                ("del/rm <file>", "Delete file or directory"),
                ("cat <file>", "Display file content"),
                ("edit <file>", "Edit text file"),
                ("rename <old> <new>", "Rename file/folder"),
                ("cp <src> <dest>", "Copy file or directory"),
                ("properties <item>", "Show item properties"),
                ("find <pattern>", "Search for files"),
                ("tree [path]", "Show directory tree"),
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
                ("game <name>", "Launch game (snake, dino, memory, clicker)"),
            ]),
        ])

        max_cmd_width = max(len(cmd) for cmds in command_groups.values() for cmd, _ in cmds)
        max_desc_width = max(len(desc) for cmds in command_groups.values() for _, desc in cmds)
        total_width = max_cmd_width + max_desc_width + 10

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
║  • Gaming center with 4 complete games      ║
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

    def _show_history(self, _):
        """Show command history"""
        if not self.command_history:
            return "No command history available."
        
        lines = ["Command History:"]
        lines.append("-" * 40)
        
        for i, entry in enumerate(self.command_history[-20:], 1):  # Show last 20
            timestamp = time.strftime("%H:%M:%S", time.localtime(entry['timestamp']))
            lines.append(f"{i:2}: [{timestamp}] {entry['command']}")
        
        return "\n".join(lines)

    # File system operations
    def _list_command(self, path):
        """List directory contents with detailed information"""
        target_dir = os.path.join(self.current_dir, path) if path else self.current_dir
        target_dir = os.path.normpath(target_dir)

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

                if os.path.isdir(item_path):
                    item_type = "📁 DIR "
                    size_str = "     --"
                else:
                    item_type = "📄 FILE"
                    size = stat_info.st_size
                    size_str = self._format_file_size(size)
                    total_size += size

                mod_time = time.strftime("%Y-%m-%d %H:%M", time.localtime(stat_info.st_mtime))
                permissions = oct(stat_info.st_mode)[-3:]

                items.append(f"{item_type} {size_str:>8} {permissions} {mod_time} {item_name}")

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

    def _change_directory(self, path):
        """Change current working directory"""
        if not path:
            return "Usage: cd <directory>\nExample: cd documents"

        if path == "..":
            parent_dir = os.path.dirname(self.current_dir)
            if parent_dir and parent_dir.startswith(Config.BASE_DIR):
                self.current_dir = parent_dir
                return f"📁 Changed to: {self._pwd_command('')}"
            else:
                return "❌ Already at root directory"

        new_path = os.path.join(self.current_dir, path)
        new_path = os.path.normpath(new_path)

        if not new_path.startswith(Config.BASE_DIR):
            return "❌ Access denied: Path outside allowed directory"

        if not os.path.exists(new_path):
            return f"❌ Directory not found: {path}"

        if not os.path.isdir(new_path):
            return f"❌ Not a directory: {path}"

        self.current_dir = new_path
        return f"📁 Changed to: {self._pwd_command('')}"

    def _make_directory(self, dirname):
        """Create a new directory"""
        if not dirname:
            return "Usage: mkdir <directory_name>\nExample: mkdir new_folder"

        new_dir_path = os.path.join(self.current_dir, dirname)
        new_dir_path = os.path.normpath(new_dir_path)

        if not new_dir_path.startswith(Config.BASE_DIR):
            return "❌ Access denied: Path outside allowed directory"

        if os.path.exists(new_dir_path):
            return f"❌ Directory already exists: {dirname}"

        try:
            os.makedirs(new_dir_path)
            return f"✅ Directory created: {dirname}"
        except PermissionError:
            return f"❌ Permission denied: Cannot create directory {dirname}"
        except Exception as e:
            return f"❌ Error creating directory: {str(e)}"

    def _create_file(self, filename):
        """Create a new empty file"""
        if not filename:
            return "Usage: touch <filename>\nExample: touch document.txt"

        file_path = os.path.join(self.current_dir, filename)
        file_path = os.path.normpath(file_path)

        if not file_path.startswith(Config.BASE_DIR):
            return "❌ Access denied: Path outside allowed directory"

        if os.path.exists(file_path):
            # Update modification time
            os.utime(file_path, None)
            return f"✅ Updated timestamp: {filename}"

        try:
            with open(file_path, 'w') as f:
                f.write("")
            return f"✅ File created: {filename}"
        except PermissionError:
            return f"❌ Permission denied: Cannot create file {filename}"
        except Exception as e:
            return f"❌ Error creating file: {str(e)}"

    def _delete_file(self, filename):
        """Delete a file or directory"""
        if not filename:
            return "Usage: rm <filename>\nExample: rm document.txt"

        file_path = os.path.join(self.current_dir, filename)
        file_path = os.path.normpath(file_path)

        if not file_path.startswith(Config.BASE_DIR):
            return "❌ Access denied: Path outside allowed directory"

        if not os.path.exists(file_path):
            return f"❌ File or directory not found: {filename}"

        try:
            if os.path.isdir(file_path):
                shutil.rmtree(file_path)
                return f"✅ Directory deleted: {filename}"
            else:
                os.remove(file_path)
                return f"✅ File deleted: {filename}"
        except PermissionError:
            return f"❌ Permission denied: Cannot delete {filename}"
        except Exception as e:
            return f"❌ Error deleting: {str(e)}"

    def _copy_file(self, args):
        """Copy file or directory"""
        if not args:
            return "Usage: cp <source> <destination>\nExample: cp file.txt backup.txt"

        parts = args.split()
        if len(parts) != 2:
            return "Usage: cp <source> <destination>"

        src, dest = parts
        src_path = os.path.join(self.current_dir, src)
        dest_path = os.path.join(self.current_dir, dest)
        
        src_path = os.path.normpath(src_path)
        dest_path = os.path.normpath(dest_path)

        if not src_path.startswith(Config.BASE_DIR) or not dest_path.startswith(Config.BASE_DIR):
            return "❌ Access denied: Path outside allowed directory"

        if not os.path.exists(src_path):
            return f"❌ Source not found: {src}"

        try:
            if os.path.isdir(src_path):
                shutil.copytree(src_path, dest_path)
                return f"✅ Directory copied: {src} → {dest}"
            else:
                shutil.copy2(src_path, dest_path)
                return f"✅ File copied: {src} → {dest}"
        except Exception as e:
            return f"❌ Error copying: {str(e)}"

    def _rename_file(self, args):
        """Rename file or directory"""
        if not args:
            return "Usage: rename <old_name> <new_name>\nExample: rename old.txt new.txt"

        parts = args.split()
        if len(parts) != 2:
            return "Usage: rename <old_name> <new_name>"

        old_name, new_name = parts
        old_path = os.path.join(self.current_dir, old_name)
        new_path = os.path.join(self.current_dir, new_name)
        
        old_path = os.path.normpath(old_path)
        new_path = os.path.normpath(new_path)

        if not old_path.startswith(Config.BASE_DIR) or not new_path.startswith(Config.BASE_DIR):
            return "❌ Access denied: Path outside allowed directory"

        if not os.path.exists(old_path):
            return f"❌ File not found: {old_name}"

        if os.path.exists(new_path):
            return f"❌ Destination already exists: {new_name}"

        try:
            os.rename(old_path, new_path)
            return f"✅ Renamed: {old_name} → {new_name}"
        except Exception as e:
            return f"❌ Error renaming: {str(e)}"

    def _read_file(self, filename):
        """Display file content"""
        if not filename:
            return "Usage: cat <filename>\nExample: cat readme.txt"

        file_path = os.path.join(self.current_dir, filename)
        file_path = os.path.normpath(file_path)

        if not file_path.startswith(Config.BASE_DIR):
            return "❌ Access denied: File outside allowed directory"

        if not os.path.exists(file_path):
            return f"❌ File not found: {filename}"

        if not os.path.isfile(file_path):
            return f"❌ Not a file: {filename}"

        _, ext = os.path.splitext(filename.lower())

        if ext in ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']:
            return f"__IMAGE__::{os.path.relpath(file_path, Config.BASE_DIR)}"
        elif ext in ['.mp4', '.avi', '.mov', '.mkv', '.webm']:
            return f"__VIDEO__::{os.path.relpath(file_path, Config.BASE_DIR)}"
        elif ext in ['.mp3', '.wav', '.ogg', '.m4a', '.flac']:
            return f"__AUDIO__::{os.path.relpath(file_path, Config.BASE_DIR)}"
        else:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                if len(content) > 5000:
                    content = content[:5000] + "\n... (file truncated, use editor to view full content)"

                return f"📄 Content of {filename}:\n{'─' * 40}\n{content}"

            except UnicodeDecodeError:
                return f"❌ Cannot display binary file: {filename}"
            except Exception as e:
                return f"❌ Error reading file: {str(e)}"

    def _edit_file(self, filename):
        """Open file for editing"""
        if not filename:
            return "Usage: edit <filename>\nExample: edit document.txt"

        return f"__EDITOR__::{filename}"

    def _file_properties(self, filename):
        """Show file properties"""
        if not filename:
            return "Usage: properties <filename>\nExample: properties document.txt"

        file_path = os.path.join(self.current_dir, filename)
        file_path = os.path.normpath(file_path)

        if not file_path.startswith(Config.BASE_DIR):
            return "❌ Access denied: Path outside allowed directory"

        if not os.path.exists(file_path):
            return f"❌ File not found: {filename}"

        try:
            stat_info = os.stat(file_path)
            file_type = "Directory" if os.path.isdir(file_path) else "File"
            
            properties = [
                f"📄 Properties of {filename}",
                "=" * 40,
                f"Type: {file_type}",
                f"Size: {self._format_file_size(stat_info.st_size) if not os.path.isdir(file_path) else 'N/A'}",
                f"Created: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(stat_info.st_ctime))}",
                f"Modified: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(stat_info.st_mtime))}",
                f"Accessed: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(stat_info.st_atime))}",
                f"Permissions: {oct(stat_info.st_mode)[-3:]}",
                f"Full Path: {file_path}",
            ]

            return "\n".join(properties)

        except Exception as e:
            return f"❌ Error getting properties: {str(e)}"

    def _find_files(self, pattern):
        """Search for files matching pattern"""
        if not pattern:
            return "Usage: find <pattern>\nExample: find *.txt"

        matches = []
        try:
            for root, dirs, files in os.walk(self.current_dir):
                # Skip directories outside our base
                if not root.startswith(Config.BASE_DIR):
                    continue
                    
                for file in files:
                    if pattern.lower() in file.lower():
                        rel_path = os.path.relpath(os.path.join(root, file), self.current_dir)
                        matches.append(rel_path)

            if matches:
                return f"🔍 Found {len(matches)} matches:\n" + "\n".join(matches)
            else:
                return f"🔍 No files found matching '{pattern}'"

        except Exception as e:
            return f"❌ Error searching: {str(e)}"

    def _tree_command(self, path):
        """Show directory tree structure"""
        target_dir = os.path.join(self.current_dir, path) if path else self.current_dir
        target_dir = os.path.normpath(target_dir)

        if not target_dir.startswith(Config.BASE_DIR):
            return "❌ Access denied: Path outside allowed directory"

        if not os.path.exists(target_dir):
            return f"❌ Directory not found: {path or '.'}"

        try:
            lines = [f"📁 {os.path.basename(target_dir) or 'root'}"]
            self._build_tree(target_dir, "", lines, max_depth=3)
            return "\n".join(lines)
        except Exception as e:
            return f"❌ Error building tree: {str(e)}"

    def _build_tree(self, directory, prefix, lines, max_depth=3, current_depth=0):
        """Recursively build directory tree"""
        if current_depth >= max_depth:
            return

        try:
            items = sorted(os.listdir(directory))
            for i, item in enumerate(items):
                item_path = os.path.join(directory, item)
                is_last = i == len(items) - 1
                
                if os.path.isdir(item_path):
                    lines.append(f"{prefix}{'└── ' if is_last else '├── '}📁 {item}")
                    extension = "    " if is_last else "│   "
                    self._build_tree(item_path, prefix + extension, lines, max_depth, current_depth + 1)
                else:
                    lines.append(f"{prefix}{'└── ' if is_last else '├── '}📄 {item}")
        except PermissionError:
            lines.append(f"{prefix}└── ❌ Permission denied")

    # System commands
    def _process_list(self, _):
        """List running processes"""
        try:
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
                try:
                    pinfo = proc.info
                    processes.append({
                        'pid': pinfo['pid'],
                        'name': pinfo['name'][:20],
                        'cpu': f"{pinfo['cpu_percent']:.1f}%",
                        'memory': f"{pinfo['memory_percent']:.1f}%"
                    })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

            lines = ["📊 Running Processes", "=" * 60]
            lines.append(f"{'PID':<8} {'NAME':<20} {'CPU':<8} {'MEMORY':<8}")
            lines.append("-" * 60)

            for proc in processes[:20]:  # Show top 20
                lines.append(f"{proc['pid']:<8} {proc['name']:<20} {proc['cpu']:<8} {proc['memory']:<8}")

            return "\n".join(lines)

        except Exception as e:
            return f"❌ Error listing processes: {str(e)}"

    def _kill_process(self, pid_str):
        """Kill a process by PID"""
        if not pid_str:
            return "Usage: kill <pid>\nExample: kill 1234"

        try:
            pid = int(pid_str)
            proc = psutil.Process(pid)
            proc.kill()
            return f"✅ Process {pid} terminated"
        except ValueError:
            return "❌ Invalid PID (must be a number)"
        except psutil.NoSuchProcess:
            return f"❌ Process {pid_str} not found"
        except psutil.AccessDenied:
            return f"❌ Permission denied: Cannot kill process {pid_str}"
        except Exception as e:
            return f"❌ Error killing process: {str(e)}"

    def _disk_usage(self, _):
        """Show disk usage information"""
        try:
            disk = psutil.disk_usage('/')
            used_percent = (disk.used / disk.total) * 100

            lines = [
                "💾 Disk Usage Information",
                "=" * 30,
                f"Total Space: {self._format_bytes(disk.total)}",
                f"Used Space:  {self._format_bytes(disk.used)} ({used_percent:.1f}%)",
                f"Free Space:  {self._format_bytes(disk.free)}",
            ]

            # Visual bar
            bar_width = 30
            used_blocks = int((used_percent / 100) * bar_width)
            free_blocks = bar_width - used_blocks
            
            lines.append("")
            lines.append(f"Usage: [{'█' * used_blocks}{'░' * free_blocks}] {used_percent:.1f}%")

            return "\n".join(lines)

        except Exception as e:
            return f"❌ Error getting disk usage: {str(e)}"

    def _memory_info(self, _):
        """Show memory usage information"""
        try:
            memory = psutil.virtual_memory()

            lines = [
                "🧠 Memory Information",
                "=" * 25,
                f"Total RAM:     {self._format_bytes(memory.total)}",
                f"Available RAM: {self._format_bytes(memory.available)}",
                f"Used RAM:      {self._format_bytes(memory.used)} ({memory.percent:.1f}%)",
                f"Free RAM:      {self._format_bytes(memory.free)}",
            ]

            # Visual bar
            bar_width = 30
            used_blocks = int((memory.percent / 100) * bar_width)
            free_blocks = bar_width - used_blocks
            
            lines.append("")
            lines.append(f"Usage: [{'█' * used_blocks}{'░' * free_blocks}] {memory.percent:.1f}%")

            return "\n".join(lines)

        except Exception as e:
            return f"❌ Error getting memory info: {str(e)}"

    # Visual and network commands
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

        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url

        try:
            with urllib.request.urlopen(url, timeout=10) as response:
                content = response.read().decode('utf-8', errors='ignore')

                if len(content) > 2000:
                    content = content[:2000] + "\n... (content truncated)"

                return f"📡 Response from {url}:\n{'-' * 40}\n{content}"

        except Exception as e:
            return f"❌ Failed to fetch {url}: {str(e)}"

    def _ping_command(self, host):
        """Network connectivity test"""
        if not host:
            return "Usage: ping <hostname>\nExample: ping google.com"

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
        valid_games = ['snake', 'dino', 'memory', 'clicker']

        if not game_name:
            return f"Available games: {', '.join(valid_games)}\nUsage: game <game_name>"

        game = game_name.lower()
        if game in valid_games:
            return f"__GAME__::{game}"
        else:
            return f"Unknown game '{game_name}'. Available: {', '.join(valid_games)}"

    # Utility methods
    def _format_bytes(self, bytes_value):
        """Format bytes into human-readable format"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes_value < 1024:
                return f"{bytes_value:.1f} {unit}"
            bytes_value /= 1024
        return f"{bytes_value:.1f} PB"

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


print("🔧 Complete FileBrowser utility loaded successfully")