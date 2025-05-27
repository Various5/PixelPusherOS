#!/usr/bin/env python3
"""
Pixel Pusher OS - File Cleanup Helper
Run this script to see what files you have vs what you need
"""

import os
import sys
from pathlib import Path


def check_file_structure():
    """Check current file structure and identify unused files"""

    # Required files for Pixel Pusher OS
    required_files = {
        # Core Python files
        'app.py': 'Main Flask application',
        'config.py': 'Configuration settings',
        'models.py': 'Database models',

        # Routes
        'routes/auth.py': 'Authentication routes',
        'routes/desktop.py': 'Desktop routes',
        'routes/api.py': 'API endpoints',

        # Templates
        'templates/base.html': 'Base template',
        'templates/login.html': 'Login page',
        'templates/register.html': 'Registration page',
        'templates/desktop.html': 'Main desktop interface',

        # Core JavaScript
        'static/js/utils/state.js': 'State management',
        'static/js/utils/helpers.js': 'Utility functions',
        'static/js/core/auth.js': 'Authentication manager',
        'static/js/core/desktop.js': 'Desktop manager',
        'static/js/core/windows.js': 'Window manager',
        'static/js/core/app.js': 'Main application',
        'static/js/apps/terminal.js': 'Terminal app',
        'static/js/apps/explorer.js': 'File explorer app',
        'static/js/apps/games.js': 'Games manager',
        'static/js/apps/settings.js': 'Settings manager',

        # Utilities
        'utils/__init__.py': 'Python package init',
        'utils/file_browser.py': 'File system operations'
    }

    # Optional files (referenced in routes but not required)
    optional_files = {
        'templates/browser.html': 'Standalone browser',
        'templates/word.html': 'Word processor',
        'templates/excel.html': 'Spreadsheet app',
        'templates/settings.html': 'Settings page',
        'templates/games.html': 'Games center',
        'templates/taskmanager.html': 'Task manager',
        'templates/404.html': '404 error page',
        'templates/error.html': 'General error page'
    }

    print("🔍 Pixel Pusher OS File Structure Analysis")
    print("=" * 50)

    # Check required files
    print("\n✅ REQUIRED FILES:")
    missing_required = []
    for file_path, description in required_files.items():
        if os.path.exists(file_path):
            print(f"✓ {file_path:<40} ({description})")
        else:
            print(f"❌ {file_path:<40} ({description}) - MISSING!")
            missing_required.append(file_path)

    # Check optional files
    print("\n📋 OPTIONAL FILES:")
    for file_path, description in optional_files.items():
        if os.path.exists(file_path):
            print(f"✓ {file_path:<40} ({description})")
        else:
            print(f"○ {file_path:<40} ({description}) - Not found")

    # Find potentially unused files
    print("\n🔍 SCANNING FOR EXTRA FILES:")
    all_known_files = set(required_files.keys()) | set(optional_files.keys())

    # Scan common directories
    directories_to_scan = [
        'static/js/',
        'templates/',
        'routes/',
        'utils/',
        '.'
    ]

    extra_files = []
    for directory in directories_to_scan:
        if os.path.exists(directory):
            for root, dirs, files in os.walk(directory):
                # Skip __pycache__ directories
                dirs[:] = [d for d in dirs if d != '__pycache__']

                for file in files:
                    if file.endswith(('.py', '.html', '.js', '.css')):
                        file_path = os.path.join(root, file).replace('\\', '/')
                        if file_path.startswith('./'):
                            file_path = file_path[2:]

                        if file_path not in all_known_files:
                            extra_files.append(file_path)

    if extra_files:
        print("\n❓ EXTRA FILES FOUND (Review these):")
        for file_path in sorted(extra_files):
            if os.path.exists(file_path):
                size = os.path.getsize(file_path)
                print(f"  • {file_path:<40} ({size} bytes)")
    else:
        print("\n✅ No extra files found!")

    # Summary
    print("\n" + "=" * 50)
    print("📊 SUMMARY:")
    print(f"✅ Required files found: {len(required_files) - len(missing_required)}/{len(required_files)}")
    if missing_required:
        print(f"❌ Missing required files: {len(missing_required)}")
        for file in missing_required:
            print(f"   - {file}")
    print(f"📋 Optional files found: {sum(1 for f in optional_files if os.path.exists(f))}/{len(optional_files)}")
    print(f"❓ Extra files to review: {len(extra_files)}")

    # Cleanup suggestions
    if extra_files or missing_required:
        print("\n🧹 CLEANUP SUGGESTIONS:")
        if missing_required:
            print("1. Create missing required files or copy from your backup")
        if extra_files:
            print("2. Review extra files and delete unused ones")
            print("3. Keep backups before deleting anything!")

    print("\n🚨 ALWAYS BACKUP BEFORE DELETING FILES!")


def find_cache_files():
    """Find Python cache files that can be safely deleted"""
    print("\n🗑️ PYTHON CACHE FILES (Safe to delete):")
    cache_files = []

    for root, dirs, files in os.walk('.'):
        if '__pycache__' in root:
            for file in files:
                cache_files.append(os.path.join(root, file))

        for file in files:
            if file.endswith('.pyc'):
                cache_files.append(os.path.join(root, file))

    if cache_files:
        for file in cache_files:
            print(f"  • {file}")
        print(f"\nFound {len(cache_files)} cache files")
        print("To delete: find . -name '__pycache__' -type d -exec rm -rf {} +")
        print("          find . -name '*.pyc' -delete")
    else:
        print("No Python cache files found.")


if __name__ == "__main__":
    print("🎨 Pixel Pusher OS File Structure Checker")
    check_file_structure()
    find_cache_files()
    print("\n✨ Analysis complete!")