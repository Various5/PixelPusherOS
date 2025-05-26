#!/usr/bin/env python3
"""
Pixel Pusher OS - Setup Script
Creates the necessary directory structure and files for the application
"""

import os
import sys


def create_directory_structure():
    """Create the required directory structure"""

    directories = [
        'static',
        'static/js',
        'static/js/core',
        'static/js/apps',
        'static/js/utils',
        'static/css',
        'static/images',
        'templates',
        'routes',
        'utils',
        'user_files',
        'user_files/documents',
        'user_files/pictures',
        'user_files/music',
        'user_files/videos',
        'user_files/downloads',
        'user_files/desktop',
        'logs'
    ]

    print("📁 Creating directory structure...")

    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"  ✅ Created: {directory}")
        else:
            print(f"  📂 Exists: {directory}")


def create_init_files():
    """Create __init__.py files for Python packages"""

    init_files = [
        'routes/__init__.py',
        'utils/__init__.py'
    ]

    print("\n📄 Creating __init__.py files...")

    for init_file in init_files:
        if not os.path.exists(init_file):
            with open(init_file, 'w') as f:
                f.write('# Package initialization file\n')
            print(f"  ✅ Created: {init_file}")
        else:
            print(f"  📄 Exists: {init_file}")


def check_requirements():
    """Check if required Python packages are installed"""

    required_packages = [
        'flask',
        'flask-sqlalchemy',
        'flask-login',
        'werkzeug',
        'psutil'  # Optional but recommended
    ]

    print("\n📦 Checking required packages...")

    missing_packages = []

    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"  ✅ {package}")
        except ImportError:
            print(f"  ❌ {package} - Missing")
            missing_packages.append(package)

    if missing_packages:
        print(f"\n⚠️  Missing packages: {', '.join(missing_packages)}")
        print("Install with: pip install " + " ".join(missing_packages))
        return False

    return True


def create_basic_css():
    """Create basic CSS file if it doesn't exist"""

    css_file = 'static/css/style.css'

    if not os.path.exists(css_file):
        css_content = """/* Pixel Pusher OS - Basic Styles */
:root {
    --primary: #00d9ff;
    --background: #f8f9fa;
    --surface: #ffffff;
    --text-primary: #202124;
    --border: #dadce0;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--background);
    color: var(--text-primary);
}

/* Basic button styles */
.btn {
    padding: 8px 16px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--surface);
    color: var(--text-primary);
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
}

.btn:hover {
    background: var(--primary);
    color: white;
}

/* Loading indicator */
.loading {
    text-align: center;
    padding: 20px;
    color: #666;
}
"""

        with open(css_file, 'w') as f:
            f.write(css_content)

        print(f"  ✅ Created: {css_file}")


def main():
    """Main setup function"""

    print("🎨 Pixel Pusher OS Setup Script")
    print("=" * 40)

    # Create directory structure
    create_directory_structure()

    # Create __init__.py files
    create_init_files()

    # Create basic CSS
    create_basic_css()

    # Check requirements
    packages_ok = check_requirements()

    print("\n" + "=" * 40)

    if packages_ok:
        print("✅ Setup completed successfully!")
        print("\nNext steps:")
        print("1. Make sure all your JavaScript files are in place")
        print("2. Run: python app.py")
        print("3. Visit: http://localhost:5000")
        print("4. Use demo accounts: admin/admin, user/user, demo/demo")

        # Check for critical files
        critical_files = [
            'app.py',
            'models.py',
            'config.py',
            'routes/auth.py',
            'routes/desktop.py',
            'routes/api.py',
            'templates/base.html',
            'templates/desktop.html',
            'templates/login.html'
        ]

        missing_files = []
        for file in critical_files:
            if not os.path.exists(file):
                missing_files.append(file)

        if missing_files:
            print(f"\n⚠️  Missing critical files:")
            for file in missing_files:
                print(f"   - {file}")
            print("\nPlease create these files using the provided code examples.")
    else:
        print("❌ Setup incomplete - install missing packages first")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())