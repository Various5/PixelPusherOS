#!/usr/bin/env python3
"""
Pixel Pusher OS - Desktop Routes
Flask blueprint for handling main desktop environment and application pages.
"""

from flask import Blueprint, render_template, request, redirect, url_for, jsonify, session
from flask_login import login_required, current_user
from models import db, User, ApplicationLog
from datetime import datetime

# Create desktop blueprint
desktop_bp = Blueprint('desktop', __name__)


@desktop_bp.route('/')
def index():
    """
    Main desktop entry point
    Shows login overlay if not authenticated, otherwise shows desktop environment
    """
    if not current_user.is_authenticated:
        # Show login overlay on desktop
        return render_template('desktop.html', show_login=True)

    # Log desktop access
    ApplicationLog.log_event(
        level='INFO',
        category='DESKTOP',
        message=f'User {current_user.username} accessed desktop',
        user_id=current_user.id,
        ip_address=request.remote_addr
    )

    # Show full desktop environment
    return render_template('desktop.html',
                           show_login=False,
                           user=current_user,
                           user_data={
                               'username': current_user.username,
                               'group': current_user.group,
                               'id': current_user.id
                           })


@desktop_bp.route('/desktop')
@login_required
def desktop():
    """
    Direct desktop access (requires authentication)
    """
    return redirect(url_for('desktop.index'))


@desktop_bp.route('/browser')
@login_required
def browser():
    """
    Web browser application page
    """
    ApplicationLog.log_event(
        level='INFO',
        category='APP',
        message=f'User {current_user.username} opened browser app',
        user_id=current_user.id,
        ip_address=request.remote_addr
    )

    return render_template('apps/browser.html',
                           user=current_user,
                           app_name='Web Browser')


@desktop_bp.route('/word')
@login_required
def word_processor():
    """
    Word processor application page
    """
    ApplicationLog.log_event(
        level='INFO',
        category='APP',
        message=f'User {current_user.username} opened word processor',
        user_id=current_user.id,
        ip_address=request.remote_addr
    )

    return render_template('apps/word.html',
                           user=current_user,
                           app_name='Word Processor')


@desktop_bp.route('/excel')
@login_required
def spreadsheet():
    """
    Spreadsheet application page
    """
    ApplicationLog.log_event(
        level='INFO',
        category='APP',
        message=f'User {current_user.username} opened spreadsheet app',
        user_id=current_user.id,
        ip_address=request.remote_addr
    )

    return render_template('apps/excel.html',
                           user=current_user,
                           app_name='Spreadsheet')


@desktop_bp.route('/games')
@login_required
def games_center():
    """
    Games center page
    """
    ApplicationLog.log_event(
        level='INFO',
        category='GAMES',
        message=f'User {current_user.username} accessed games center',
        user_id=current_user.id,
        ip_address=request.remote_addr
    )

    # Get user's high scores
    from models import GameScore
    high_scores = {}
    try:
        scores = GameScore.query.filter_by(
            user_id=current_user.id,
            is_high_score=True
        ).all()

        for score in scores:
            high_scores[score.game_name] = {
                'score': score.score,
                'level': score.level,
                'date': score.timestamp.strftime('%Y-%m-%d')
            }
    except Exception as e:
        print(f"Error loading high scores: {e}")

    return render_template('apps/games.html',
                           user=current_user,
                           app_name='Games Center',
                           high_scores=high_scores)


@desktop_bp.route('/settings')
@login_required
def system_settings():
    """
    System settings page
    """
    ApplicationLog.log_event(
        level='INFO',
        category='SYSTEM',
        message=f'User {current_user.username} accessed system settings',
        user_id=current_user.id,
        ip_address=request.remote_addr
    )

    return render_template('apps/settings.html',
                           user=current_user,
                           app_name='System Settings')


@desktop_bp.route('/file-manager')
@login_required
def file_manager():
    """
    File manager application page
    """
    ApplicationLog.log_event(
        level='INFO',
        category='APP',
        message=f'User {current_user.username} opened file manager',
        user_id=current_user.id,
        ip_address=request.remote_addr
    )

    return render_template('apps/file-manager.html',
                           user=current_user,
                           app_name='File Manager')


@desktop_bp.route('/terminal')
@login_required
def terminal():
    """
    Terminal application page
    """
    ApplicationLog.log_event(
        level='INFO',
        category='TERMINAL',
        message=f'User {current_user.username} opened terminal',
        user_id=current_user.id,
        ip_address=request.remote_addr
    )

    return render_template('apps/terminal.html',
                           user=current_user,
                           app_name='Terminal')


@desktop_bp.route('/about')
def about():
    """
    About page for Pixel Pusher OS
    """
    return render_template('about.html',
                           app_name='Pixel Pusher OS',
                           version='2.0.0')


@desktop_bp.route('/help')
def help_page():
    """
    Help and documentation page
    """
    return render_template('help.html',
                           app_name='Pixel Pusher OS Help')


@desktop_bp.route('/user/dashboard')
@login_required
def user_dashboard():
    """
    User dashboard with statistics and recent activity
    """
    try:
        # Get user statistics
        from models import UserSession, GameScore

        # Recent sessions
        recent_sessions = UserSession.query.filter_by(
            user_id=current_user.id
        ).order_by(UserSession.login_time.desc()).limit(5).all()

        # Game statistics
        game_stats = db.session.query(
            GameScore.game_name,
            db.func.max(GameScore.score).label('high_score'),
            db.func.count(GameScore.id).label('games_played')
        ).filter_by(user_id=current_user.id).group_by(GameScore.game_name).all()

        # Recent activity logs
        recent_logs = ApplicationLog.query.filter_by(
            user_id=current_user.id
        ).order_by(ApplicationLog.timestamp.desc()).limit(10).all()

        dashboard_data = {
            'user': current_user.to_dict(),
            'recent_sessions': [
                {
                    'login_time': session.login_time.strftime('%Y-%m-%d %H:%M:%S'),
                    'logout_time': session.logout_time.strftime(
                        '%Y-%m-%d %H:%M:%S') if session.logout_time else 'Active',
                    'ip_address': session.ip_address,
                    'is_active': session.is_active
                }
                for session in recent_sessions
            ],
            'game_stats': [
                {
                    'game_name': stat.game_name,
                    'high_score': stat.high_score,
                    'games_played': stat.games_played
                }
                for stat in game_stats
            ],
            'recent_activity': [
                {
                    'timestamp': log.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                    'category': log.category,
                    'message': log.message,
                    'level': log.level
                }
                for log in recent_logs
            ]
        }

        return jsonify(dashboard_data)

    except Exception as e:
        print(f"Dashboard error: {e}")
        return jsonify({'error': 'Failed to load dashboard data'}), 500


@desktop_bp.route('/system/status')
@login_required
def system_status():
    """
    System status and health information
    """
    try:
        # Basic system statistics
        total_users = User.query.filter_by(is_active=True).count()
        admin_users = User.query.filter_by(group='Admin', is_active=True).count()

        # Recent activity
        from models import UserSession
        active_sessions = UserSession.query.filter_by(is_active=True).count()

        # Application logs summary
        recent_errors = ApplicationLog.query.filter_by(level='ERROR').count()
        recent_warnings = ApplicationLog.query.filter_by(level='WARNING').count()

        status_data = {
            'system': {
                'version': '2.0.0',
                'status': 'online',
                'uptime': str(datetime.utcnow() - datetime.min).split('.')[0]
            },
            'users': {
                'total': total_users,
                'admins': admin_users,
                'active_sessions': active_sessions
            },
            'application': {
                'recent_errors': recent_errors,
                'recent_warnings': recent_warnings,
                'database_status': 'connected'
            },
            'current_user': {
                'username': current_user.username,
                'group': current_user.group,
                'is_admin': current_user.is_admin(),
                'last_login': current_user.last_login.isoformat() if current_user.last_login else None
            }
        }

        return jsonify(status_data)

    except Exception as e:
        print(f"System status error: {e}")
        return jsonify({'error': 'Failed to load system status'}), 500


@desktop_bp.route('/user/preferences', methods=['GET', 'POST'])
@login_required
def user_preferences():
    """
    Handle user preferences and settings
    """
    if request.method == 'POST':
        try:
            data = request.get_json() or request.form

            # For now, we'll store preferences in session
            # In a full implementation, you might want a UserPreferences table

            preferences = {
                'theme': data.get('theme', 'default'),
                'wallpaper': data.get('wallpaper', ''),
                'sound_enabled': data.get('sound_enabled', True),
                'animations_enabled': data.get('animations_enabled', True),
                'font_size': data.get('font_size', 14),
                'desktop_layout': data.get('desktop_layout', 'grid')
            }

            # Store in session for now
            session['user_preferences'] = preferences

            # Log preference change
            ApplicationLog.log_event(
                level='INFO',
                category='USER',
                message=f'User {current_user.username} updated preferences',
                user_id=current_user.id,
                ip_address=request.remote_addr,
                details=preferences
            )

            return jsonify({
                'success': True,
                'message': 'Preferences updated successfully'
            })

        except Exception as e:
            print(f"Preferences update error: {e}")
            return jsonify({
                'success': False,
                'error': 'Failed to update preferences'
            }), 500

    else:
        # GET request - return current preferences
        preferences = session.get('user_preferences', {
            'theme': 'default',
            'wallpaper': '',
            'sound_enabled': True,
            'animations_enabled': True,
            'font_size': 14,
            'desktop_layout': 'grid'
        })

        return jsonify(preferences)


# Error handlers for desktop blueprint
@desktop_bp.errorhandler(404)
def not_found(error):
    """Handle 404 errors in desktop context"""
    return render_template('errors/404.html'), 404


@desktop_bp.errorhandler(500)
def internal_error(error):
    """Handle 500 errors in desktop context"""
    db.session.rollback()
    return render_template('errors/500.html'), 500


# Context processor to inject common variables
@desktop_bp.context_processor
def inject_common_vars():
    """Inject common variables into all desktop templates"""
    return {
        'current_time': datetime.utcnow().isoformat(),
        'app_version': '2.0.0',
        'is_authenticated': current_user.is_authenticated,
        'user_preferences': session.get('user_preferences', {})
    }


print("🖥️ Desktop routes loaded successfully")