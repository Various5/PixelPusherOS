#!/usr/bin/env python3
"""
Pixel Pusher OS - Diagnostic Script
Quick test to identify what's working and what's not
"""

import os
import sys
from flask import Flask, jsonify, render_template_string

# Create minimal Flask app for testing
app = Flask(__name__)
app.config['SECRET_KEY'] = 'diagnostic-test-key'


@app.route('/')
def index():
    """Main route - test if this works"""
    return '''
    <h1>🎨 Pixel Pusher OS - Diagnostic Mode</h1>
    <p>✅ Main route is working!</p>
    <ul>
        <li><a href="/test">Basic Test</a></li>
        <li><a href="/files">File Check</a></li>
        <li><a href="/routes">Route List</a></li>
        <li><a href="/imports">Import Test</a></li>
    </ul>
    '''


@app.route('/test')
def test():
    """Basic functionality test"""
    return jsonify({
        'status': 'ok',
        'message': 'Flask is working correctly',
        'python_version': sys.version,
        'current_directory': os.getcwd(),
        'flask_working': True
    })


@app.route('/files')
def check_files():
    """Check which files exist"""

    required_files = [
        'app.py',
        'config.py',
        'models.py',
        'routes/__init__.py',
        'routes/auth.py',
        'routes/desktop.py',
        'routes/api.py',
        'templates/base.html',
        'templates/desktop.html',
        'templates/login.html',
        'static/js/core/app.js',
        'static/js/utils/state.js'
    ]

    file_status = {}

    for file_path in required_files:
        exists = os.path.exists(file_path)
        size = os.path.getsize(file_path) if exists else 0
        file_status[file_path] = {
            'exists': exists,
            'size': size,
            'status': '✅ OK' if exists and size > 0 else '❌ Missing' if not exists else '⚠️ Empty'
        }

    return jsonify({
        'files': file_status,
        'summary': {
            'total': len(required_files),
            'existing': sum(1 for f in file_status.values() if f['exists']),
            'missing': sum(1 for f in file_status.values() if not f['exists'])
        }
    })


@app.route('/routes')
def list_routes():
    """List all registered routes"""
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': list(rule.methods),
            'rule': str(rule)
        })

    return jsonify({
        'routes': routes,
        'total_routes': len(routes)
    })


@app.route('/imports')
def test_imports():
    """Test importing your modules"""

    import_results = {}

    # Test basic imports
    modules_to_test = [
        'flask',
        'flask_sqlalchemy',
        'flask_login',
        'werkzeug',
        'psutil'
    ]

    for module in modules_to_test:
        try:
            __import__(module)
            import_results[module] = '✅ OK'
        except ImportError as e:
            import_results[module] = f'❌ {str(e)}'

    # Test project imports
    project_imports = {}

    try:
        sys.path.insert(0, os.getcwd())

        # Test config
        try:
            import config
            project_imports['config.py'] = '✅ OK'
        except Exception as e:
            project_imports['config.py'] = f'❌ {str(e)}'

        # Test models
        try:
            import models
            project_imports['models.py'] = '✅ OK'
        except Exception as e:
            project_imports['models.py'] = f'❌ {str(e)}'

        # Test routes
        try:
            from routes import auth
            project_imports['routes.auth'] = '✅ OK'
        except Exception as e:
            project_imports['routes.auth'] = f'❌ {str(e)}'

        try:
            from routes import desktop
            project_imports['routes.desktop'] = '✅ OK'
        except Exception as e:
            project_imports['routes.desktop'] = f'❌ {str(e)}'

        try:
            from routes import api
            project_imports['routes.api'] = '✅ OK'
        except Exception as e:
            project_imports['routes.api'] = f'❌ {str(e)}'

    except Exception as e:
        project_imports['general_error'] = f'❌ {str(e)}'

    return jsonify({
        'python_modules': import_results,
        'project_modules': project_imports,
        'python_path': sys.path[:3]  # First 3 entries
    })


@app.route('/create-minimal')
def create_minimal_structure():
    """Create minimal file structure"""

    created_files = []
    errors = []

    # Create directories
    dirs_to_create = ['routes', 'templates', 'static', 'static/js', 'static/js/core', 'utils']

    for dir_name in dirs_to_create:
        try:
            os.makedirs(dir_name, exist_ok=True)
            created_files.append(f"📁 {dir_name}/")
        except Exception as e:
            errors.append(f"Error creating {dir_name}: {str(e)}")

    # Create minimal files
    files_to_create = {
        'routes/__init__.py': '# Routes package\nprint("Routes package loaded")\n',
        'utils/__init__.py': '# Utils package\nprint("Utils package loaded")\n',
        'templates/test.html': '''<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body><h1>Test Template Working</h1></body>
</html>''',
        'static/js/core/test.js': 'console.log("Test JS file loaded");'
    }

    for file_path, content in files_to_create.items():
        try:
            if not os.path.exists(file_path):
                with open(file_path, 'w') as f:
                    f.write(content)
                created_files.append(f"📄 {file_path}")
            else:
                created_files.append(f"📄 {file_path} (already exists)")
        except Exception as e:
            errors.append(f"Error creating {file_path}: {str(e)}")

    return jsonify({
        'created_files': created_files,
        'errors': errors,
        'status': 'completed'
    })


if __name__ == '__main__':
    print("🔍 Starting Pixel Pusher OS Diagnostic Server...")
    print("📍 Visit: http://localhost:5000")
    print("🔧 This will help identify what's not working")

    app.run(host='0.0.0.0', port=5000, debug=True)