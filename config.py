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
    ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'svg',
                         'mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma',
                         'mp4', 'avi', 'mov', 'mkv', 'webm',
                         'zip', 'rar', '7z', 'tar', 'gz',
                         'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
                         'html', 'css', 'js', 'json', 'xml', 'py'}

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

    # Application start time
    START_TIME = None

    @classmethod
    def init_app(cls, app):
        """Initialize application with configuration"""
        # Store start time
        import time
        cls.START_TIME = time.time()
        app.config['START_TIME'] = cls.START_TIME

        # Create necessary directories
        cls.USER_FILES_DIR.mkdir(exist_ok=True)
        cls.UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
        (cls.BASE_DIR / 'logs').mkdir(exist_ok=True)

        # Create sample user files and directories
        cls.create_sample_files()

        print(f"✅ Configuration loaded - {cls.APP_NAME} v{cls.APP_VERSION}")

    @classmethod
    def create_sample_files(cls):
        """Create sample files for demonstration"""
        # First, create all necessary directories
        directories = [
            'documents',
            'downloads',
            'pictures',
            'music',  # Ensure music directory exists
            'videos',
            'projects',
            'desktop',
            'home'
        ]

        for dirname in directories:
            dir_path = cls.USER_FILES_DIR / dirname
            dir_path.mkdir(exist_ok=True)

        # Create subdirectories for organization
        subdirs = {
            'documents': ['archive', 'personal', 'work'],
            'pictures': ['vacation', 'family', 'screenshots'],
            'music': ['Rock', 'Pop', 'Classical', 'Jazz'],  # Music subdirectories
            'videos': ['Movies', 'Series', 'Personal']
        }

        for parent, children in subdirs.items():
            for child in children:
                (cls.USER_FILES_DIR / parent / child).mkdir(exist_ok=True)

        # Sample files
        sample_files = {
            'readme.txt': """Welcome to Pixel Pusher OS!

This is a modern web-based desktop environment built with Flask and JavaScript.

Features:
- Professional desktop interface
- Built-in terminal with 50+ commands
- File explorer with media support
- Gaming center with arcade games
- Music player for your audio files
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
- 🎵 **Music Player**: Play your favorite audio files
- 🎨 **Themes & Customization**: Multiple color themes and custom wallpaper support
- ⚙️ **System Tools**: Task manager, performance monitoring, and system settings

### Getting Started

1. **Explore the Desktop**: Double-click icons to open applications
2. **Try the Terminal**: Press `Ctrl+Alt+T` or click the Terminal icon
3. **Browse Files**: Use the File Explorer to navigate your files
4. **Play Games**: Check out the gaming center for entertainment
5. **Listen to Music**: Add MP3 files to the music folder and use the Music Player
6. **Customize**: Open Settings to change themes and preferences

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
    "Music Player",
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
game <name>  - Launch game (snake, dino, memory, village)

Examples:
> ls
> cd documents
> cat readme.txt
> mkdir projects
> game snake
> color blue
> sysinfo
""",
            'music/README.txt': """Music Player Instructions

Place your music files in this directory to play them in the Music Player.

Supported formats:
- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)
- FLAC (.flac)
- M4A (.m4a)
- AAC (.aac)
- WMA (.wma)

The Music Player will automatically scan this directory and display all playable files.

Organize your music in subdirectories like:
- Rock/
- Pop/
- Classical/
- Jazz/

Enjoy your music in Pixel Pusher OS!
""",
            'documents/sample.txt': """Sample Document

This is a sample text document created for demonstration purposes.

You can:
- Edit this file using the terminal (edit command)
- View it using the File Explorer
- Copy, move, or delete it
- Create your own documents

Pixel Pusher OS supports various file operations through both the terminal and the graphical interface.
""",
            'documents/project_ideas.txt': """Project Ideas

1. Web Application Projects
   - Todo List Manager
   - Weather Dashboard
   - Personal Blog
   - Portfolio Website

2. Game Development
   - Puzzle Games
   - Adventure Games
   - Educational Games

3. Utility Tools
   - Calculator
   - Timer/Stopwatch
   - Note Taking App
   - Password Manager

Feel free to use Pixel Pusher OS as a development environment for your projects!
"""
        }

        # Create sample files
        for filename, content in sample_files.items():
            file_path = cls.USER_FILES_DIR / filename
            # Create parent directory if needed
            file_path.parent.mkdir(parents=True, exist_ok=True)
            if not file_path.exists():
                file_path.write_text(content, encoding='utf-8')

        # Create some sample music metadata files (since we can't create actual MP3s)
        music_metadata = {
            'music/sample_playlist.m3u': """#EXTM3U
#EXTINF:180,Sample Song 1 - Artist 1
sample1.mp3
#EXTINF:240,Sample Song 2 - Artist 2
sample2.mp3
#EXTINF:200,Sample Song 3 - Artist 3
sample3.mp3
""",
            'music/Rock/rock_info.txt': """Rock Music Collection

Add your rock music files here.
Supported formats: MP3, WAV, OGG, FLAC, M4A
""",
            'music/Classical/classical_info.txt': """Classical Music Collection

Add your classical music files here.
Supported formats: MP3, WAV, OGG, FLAC, M4A
"""
        }

        for filename, content in music_metadata.items():
            file_path = cls.USER_FILES_DIR / filename
            file_path.parent.mkdir(parents=True, exist_ok=True)
            if not file_path.exists():
                file_path.write_text(content, encoding='utf-8')

        print(f"📁 Sample files and directories created in {cls.USER_FILES_DIR}")
        print(f"🎵 Music directory created at {cls.USER_FILES_DIR / 'music'}")