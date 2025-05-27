#!/usr/bin/env python3
"""
Pixel Pusher OS - Configuration Settings
Application configuration and settings management
"""

import os
from pathlib import Path


class Config:
    """
    Configuration class for Pixel Pusher OS Flask application.
    Contains all application settings and configuration variables.
    """

    # Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'pixel-pusher-os-secret-key-2024'

    # Database Configuration
    BASE_DIR = Path(__file__).parent.absolute()
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or f'sqlite:///{BASE_DIR}/pixelpusher.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Application Settings
    APP_NAME = 'Pixel Pusher OS'
    APP_VERSION = '2.0.0'

    # File System Settings
    USER_FILES_DIR = BASE_DIR / 'user_files'
    UPLOAD_FOLDER = BASE_DIR / 'static' / 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file upload

    # Security Settings
    SESSION_TIMEOUT = 3600  # 1 hour in seconds
    REMEMBER_COOKIE_DURATION = 86400 * 7  # 7 days
    WTF_CSRF_ENABLED = True

    # Terminal Settings
    TERMINAL_HISTORY_SIZE = 1000
    COMMAND_TIMEOUT = 30  # seconds

    # Game Settings
    HIGH_SCORES_FILE = BASE_DIR / 'high_scores.json'

    # Logging Configuration
    LOG_FILE = BASE_DIR / 'logs' / 'pixelpusher.log'
    LOG_LEVEL = 'INFO'

    # Development Settings
    DEBUG = os.environ.get('FLASK_ENV') == 'development'
    TESTING = False

    @classmethod
    def init_app(cls, app):
        """Initialize application with configuration"""
        # Create necessary directories
        cls.USER_FILES_DIR.mkdir(exist_ok=True)
        cls.UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
        (cls.BASE_DIR / 'logs').mkdir(exist_ok=True)

        # Create sample user files
        cls.create_sample_files()

        print(f"✅ Configuration loaded - {cls.APP_NAME} v{cls.APP_VERSION}")

    @classmethod
    def create_sample_files(cls):
        """Create sample files for demonstration"""
        sample_files = {
            'readme.txt': """Welcome to Pixel Pusher OS!

This is a modern web-based desktop environment built with Flask and JavaScript.

Features:
- Professional desktop interface
- Built-in terminal with 50+ commands
- File explorer with media support
- Gaming center with arcade games
- Customizable themes and wallpapers
- System settings and task manager

Try these commands in the terminal:
- help (show all commands)
- ls (list files)
- cat readme.txt (display this file)
- sysinfo (system information)
- game snake (play snake game)

Enjoy exploring your new desktop environment!
""",
            'welcome.md': """# Welcome to Pixel Pusher OS

## What is Pixel Pusher OS?

Pixel Pusher OS is a **modern web-based desktop environment** that brings the familiar desktop experience to your web browser.

### Key Features

- 🖥️ **Professional Desktop**: Full desktop environment with icons, windows, and taskbar
- 💻 **Advanced Terminal**: 50+ built-in commands for file management and system control
- 📁 **File Explorer**: Browse, upload, and manage files with media preview support
- 🎮 **Gaming Center**: Collection of arcade-style games with high score tracking
- 🎨 **Themes & Customization**: 12+ color themes and custom wallpaper support
- ⚙️ **System Tools**: Task manager, performance monitoring, and system settings

### Getting Started

1. **Explore the Desktop**: Double-click icons to open applications
2. **Try the Terminal**: Press `Ctrl+Alt+T` or click the Terminal icon
3. **Browse Files**: Use the File Explorer to navigate your files
4. **Play Games**: Check out the gaming center for entertainment
5. **Customize**: Open Settings to change themes and preferences

### Keyboard Shortcuts

- `Ctrl+Alt+T` - Open Terminal
- `Ctrl+Alt+E` - Open File Explorer  
- `Ctrl+Alt+S` - Open Settings
- `Ctrl+Alt+G` - Open Games Menu
- `Alt+Tab` - Cycle through windows
- `F11` - Toggle fullscreen

---

**Built with ❤️ using Flask, JavaScript, and modern web technologies.**
""",
            'system_info.json': """{
  "system": "Pixel Pusher OS",
  "version": "2.0.0",
  "build_date": "2024",
  "description": "Modern Web-Based Desktop Environment",
  "features": [
    "Desktop Environment",
    "Terminal with 50+ Commands", 
    "File Explorer",
    "Gaming Center",
    "System Settings",
    "Multi-Window Support",
    "Theme Customization"
  ],
  "tech_stack": [
    "Flask",
    "SQLAlchemy", 
    "JavaScript ES6+",
    "HTML5 Canvas",
    "CSS3",
    "SQLite"
  ],
  "supported_browsers": [
    "Chrome 90+",
    "Firefox 88+",
    "Safari 14+",
    "Edge 90+"
  ]
}""",
            'commands.txt': """Terminal Commands Reference - Pixel Pusher OS

GENERAL COMMANDS:
help        - Show available commands
about       - About Pixel Pusher OS
contact     - Contact information
clear/cls   - Clear terminal screen
echo <text> - Display text
time        - Show current time
date        - Show current date
uptime      - System uptime
whoami      - Current user

FILE OPERATIONS:
ls/dir [path]      - List directory contents
cd <directory>     - Change directory  
pwd               - Show current directory
mkdir <name>      - Create directory
touch <file>      - Create empty file
del/rm <file>     - Delete file
cat <file>        - Display file content
edit <file>       - Edit text file
rename <old> <new> - Rename file/folder
properties <item>  - Show item properties
find <pattern>    - Search for files

SYSTEM INFORMATION:
sysinfo     - Detailed system information
ps          - Running processes
kill <pid>  - Terminate process
df          - Disk usage information
free        - Memory information

VISUAL & THEMES:
color <theme>     - Change color theme
effect <name>     - Start visual effect
wallpaper <file>  - Set desktop wallpaper

NETWORK:
curl <url>   - Fetch web content
ping <host>  - Test network connectivity

APPLICATIONS:
explorer     - Open file explorer
game <name>  - Launch game (snake, dino, memory, clicker)

Examples:
> ls
> cd documents
> cat readme.txt
> mkdir projects
> game snake
> color blue
> sysinfo
"""
        }

        # Create sample files
        for filename, content in sample_files.items():
            file_path = cls.USER_FILES_DIR / filename
            if not file_path.exists():
                file_path.write_text(content, encoding='utf-8')

        # Create sample directories
        sample_dirs = ['documents', 'downloads', 'pictures', 'music', 'videos', 'projects']
        for dirname in sample_dirs:
            (cls.USER_FILES_DIR / dirname).mkdir(exist_ok=True)

        print(f"📁 Sample files created in {cls.USER_FILES_DIR}")