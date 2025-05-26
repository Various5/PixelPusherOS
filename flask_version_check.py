#!/usr/bin/env python3
"""
Flask Version Compatibility Check
Run this to verify Flask compatibility before starting the app
"""

import sys
import pkg_resources


def check_flask_compatibility():
    """Check Flask version and compatibility"""
    print("🔍 Checking Flask Compatibility...")
    print("=" * 40)

    try:
        import flask

        # Get Flask version
        try:
            version = flask.__version__
        except AttributeError:
            try:
                version = flask.Flask.__version__
            except AttributeError:
                version = pkg_resources.get_distribution("flask").version

        print(f"✅ Flask version: {version}")

        # Parse version
        major, minor = map(int, version.split('.')[:2])

        # Check compatibility
        if major >= 2:
            print("✅ Flask 2.0+ detected - Modern version")

            # Check for deprecated features
            deprecated_features = []

            # Check for before_first_request
            if not hasattr(flask.Flask, 'before_first_request'):
                deprecated_features.append("@app.before_first_request (removed in Flask 2.2+)")

            if deprecated_features:
                print("⚠️  Deprecated features detected:")
                for feature in deprecated_features:
                    print(f"   - {feature}")
            else:
                print("✅ No deprecated features detected")

        elif major == 1 and minor >= 0:
            print("⚠️  Flask 1.x detected - Consider upgrading to 2.x")
        else:
            print("❌ Very old Flask version - Please upgrade")
            return False

        # Check for required Flask extensions
        extensions = [
            ('flask_sqlalchemy', 'Flask-SQLAlchemy'),
            ('flask_login', 'Flask-Login'),
            ('werkzeug', 'Werkzeug')
        ]

        print("\n📦 Checking Flask Extensions...")
        all_extensions_ok = True

        for import_name, display_name in extensions:
            try:
                module = __import__(import_name)
                version = getattr(module, '__version__', 'unknown')
                print(f"✅ {display_name}: {version}")
            except ImportError:
                print(f"❌ {display_name}: Not installed")
                all_extensions_ok = False

        if not all_extensions_ok:
            print("\n❌ Missing required extensions. Install with:")
            print("pip install flask flask-sqlalchemy flask-login werkzeug")
            return False

        print("\n🎉 Flask compatibility check passed!")
        return True

    except ImportError:
        print("❌ Flask is not installed")
        print("Install with: pip install flask")
        return False
    except Exception as e:
        print(f"❌ Error checking Flask: {e}")
        return False


def check_python_compatibility():
    """Check Python version compatibility"""
    print("\n🐍 Checking Python Compatibility...")
    print("=" * 40)

    version = sys.version_info
    print(f"Python version: {version.major}.{version.minor}.{version.micro}")

    if version.major >= 3 and version.minor >= 7:
        print("✅ Python version is compatible")
        return True
    else:
        print("❌ Python 3.7+ is required")
        return False


def main():
    """Main compatibility check function"""
    print("🔧 Pixel Pusher OS Compatibility Check")
    print("=" * 50)

    # Check Python
    python_ok = check_python_compatibility()

    # Check Flask
    flask_ok = check_flask_compatibility()

    print("\n" + "=" * 50)

    if python_ok and flask_ok:
        print("✅ All compatibility checks passed!")
        print("🚀 You can now run: python app.py")
        return True
    else:
        print("❌ Compatibility issues detected")
        print("Please fix the issues above before running the app")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)