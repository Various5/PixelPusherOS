#!/usr/bin/env python3
"""
Install Requirements for Pixel Pusher OS
Automatically installs all required dependencies
"""

import subprocess
import sys
import os

# Required packages for Pixel Pusher OS
REQUIRED_PACKAGES = [
    'flask>=2.0.0',
    'flask-sqlalchemy>=2.5.0',
    'flask-login>=0.5.0',
    'werkzeug>=2.0.0',
    'psutil>=5.8.0',  # For system information
    'requests>=2.25.0',  # For network operations
]

# Optional packages for enhanced functionality
OPTIONAL_PACKAGES = [
    'python-dotenv>=0.19.0',  # For environment variables
    'gunicorn>=20.1.0',  # For production deployment
    'whitenoise>=5.3.0',  # For static file serving
]


def run_command(command):
    """Run a command and return success status"""
    try:
        result = subprocess.run(command, shell=True, check=True,
                                capture_output=True, text=True)
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr


def check_pip():
    """Check if pip is available"""
    success, output = run_command("pip --version")
    if success:
        print(f"✅ pip is available: {output.strip()}")
        return True
    else:
        print("❌ pip is not available")
        print("Please install pip first: https://pip.pypa.io/en/stable/installation/")
        return False


def install_package(package):
    """Install a single package"""
    print(f"📦 Installing {package}...")
    success, output = run_command(f"pip install {package}")

    if success:
        print(f"✅ {package} installed successfully")
        return True
    else:
        print(f"❌ Failed to install {package}")
        print(f"Error: {output}")
        return False


def install_requirements():
    """Install all required packages"""
    print("🚀 Installing Pixel Pusher OS Requirements...")
    print("=" * 50)

    # Check pip
    if not check_pip():
        return False

    # Install required packages
    print("\n📋 Installing Required Packages...")
    failed_packages = []

    for package in REQUIRED_PACKAGES:
        if not install_package(package):
            failed_packages.append(package)

    # Install optional packages
    print("\n📋 Installing Optional Packages...")
    for package in OPTIONAL_PACKAGES:
        if not install_package(package):
            print(f"⚠️  Optional package {package} failed to install (not critical)")

    # Summary
    print("\n" + "=" * 50)
    if failed_packages:
        print("❌ Some required packages failed to install:")
        for package in failed_packages:
            print(f"   - {package}")
        print("\nTry installing manually with:")
        print(f"pip install {' '.join(failed_packages)}")
        return False
    else:
        print("✅ All required packages installed successfully!")
        return True


def create_requirements_txt():
    """Create a requirements.txt file"""
    requirements_content = """# Pixel Pusher OS Requirements
# Core Flask dependencies
flask>=2.0.0
flask-sqlalchemy>=2.5.0
flask-login>=0.5.0
werkzeug>=2.0.0

# System and utility packages
psutil>=5.8.0
requests>=2.25.0

# Optional packages for enhanced functionality
python-dotenv>=0.19.0
gunicorn>=20.1.0
whitenoise>=5.3.0
"""

    try:
        with open('requirements.txt', 'w') as f:
            f.write(requirements_content)
        print("✅ Created requirements.txt file")
        print("You can now use: pip install -r requirements.txt")
        return True
    except Exception as e:
        print(f"❌ Failed to create requirements.txt: {e}")
        return False


def check_installation():
    """Check if all packages are properly installed"""
    print("\n🔍 Verifying Installation...")
    print("=" * 30)

    test_imports = [
        ('flask', 'Flask'),
        ('flask_sqlalchemy', 'Flask-SQLAlchemy'),
        ('flask_login', 'Flask-Login'),
        ('werkzeug', 'Werkzeug'),
        ('psutil', 'psutil'),
        ('requests', 'requests'),
    ]

    all_good = True

    for module_name, display_name in test_imports:
        try:
            module = __import__(module_name)
            version = getattr(module, '__version__', 'installed')
            print(f"✅ {display_name}: {version}")
        except ImportError:
            print(f"❌ {display_name}: Not found")
            all_good = False

    return all_good


def main():
    """Main installation function"""
    print("🎨 Pixel Pusher OS Dependency Installer")
    print("=" * 50)
    print(f"Python version: {sys.version}")
    print("=" * 50)

    # Check if we're in a virtual environment
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("✅ Virtual environment detected")
    else:
        print("⚠️  Not in a virtual environment")
        response = input("Continue anyway? (y/N): ")
        if response.lower() not in ['y', 'yes']:
            print("Exiting. Consider using a virtual environment:")
            print("python -m venv venv")
            print("source venv/bin/activate  # On Windows: venv\\Scripts\\activate")
            return False

    # Install packages
    success = install_requirements()

    if success:
        # Verify installation
        if check_installation():
            print("\n🎉 Installation completed successfully!")
            print("\nNext steps:")
            print("1. Run compatibility check: python flask_version_check.py")
            print("2. Start Pixel Pusher OS: python app.py")
        else:
            print("\n⚠️  Installation completed but some packages may not be working correctly")
            success = False

    # Create requirements.txt
    create_requirements_txt()

    return success


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)