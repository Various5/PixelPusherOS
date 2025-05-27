# 🎨 Pixel Pusher OS v2.0

A modern, web-based desktop environment built with Flask and JavaScript. Experience a full desktop interface in your browser with apps, games, file management, and more.

## ✨ Features

- **🖥️ Desktop Environment**: Full desktop interface with icons, wallpapers, and themes
- **💻 Built-in Terminal**: 50+ commands for system interaction
- **📁 File Explorer**: Advanced file management with media support
- **🎮 Gaming Center**: 4 arcade-style games (Snake, Dino Runner, Memory Match, Village Builder)
- **⚙️ System Settings**: Comprehensive settings and task manager
- **🔐 User Authentication**: Secure login system with user management
- **🎨 Customizable Themes**: 12+ themes and visual effects
- **📱 Responsive Design**: Works on desktop, tablet, and mobile

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Clone or download the project files**
   ```bash
   # Make sure you have all the required files in your project directory
   ```

2. **Run the setup script**
   ```bash
   python setup.py
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create the required files**
   
   Make sure you have these files in your project directory:
   - `models.py` (provided in the artifacts)
   - `app.py` (updated version provided)
   - Error templates in `templates/errors/`
   - All other static files and templates

5. **Run the application**
   ```bash
   python app.py
   ```

6. **Access the application**
   
   Open your browser and navigate to: `http://localhost:5000`

## 👤 Demo Accounts

Try these demo accounts to explore the system:

- **Administrator**: `admin` / `admin`
- **Regular User**: `user` / `user`  
- **Demo User**: `demo` / `demo`

## 📁 Project Structure

```
PixelPusherOS/
├── app.py                 # Main Flask application
├── models.py             # Database models
├── config.py             # Configuration settings
├── setup.py              # Setup script
├── requirements.txt      # Python dependencies
├── templates/            # HTML templates
│   ├── base.html
│   ├── desktop.html
│   ├── login.html
│   ├── register.html
│   └── errors/          # Error pages
├── static/              # Static assets
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   │   ├── core/       # Core system modules
│   │   ├── apps/       # Application modules
│   │   └── utils/      # Utility functions
│   ├── images/         # Images and icons
│   └── uploads/        # User uploads
├── routes/             # Flask blueprints
│   ├── auth.py         # Authentication routes
│   ├── desktop.py      # Desktop routes
│   └── api.py          # API endpoints
├── utils/              # Utility modules
├── instance/           # Database and instance files
└── logs/              # Log files
```

## 🔧 Troubleshooting

### Common Issues

1. **SQLAlchemy Error**: Make sure `models.py` exists and is properly configured
2. **Import Errors**: Ensure all files are in the correct directories
3. **Database Issues**: Delete `instance/pixelpusher.db` to reset the database
4. **Port Already in Use**: Change the port in `app.py` or kill the process using port 5000

### Database Reset

If you encounter database issues:

```bash
# Remove the database file
rm instance/pixelpusher.db

# Restart the application
python app.py
```

### Creating Admin User

To create additional admin users:

```bash
flask create-admin
```

### Cleaning Up Logs

To clean up old system logs:

```bash
flask cleanup-logs
```

## 🎮 Applications

### Terminal
- 50+ built-in commands
- File system navigation
- System information
- Network tools
- Application launchers

### File Explorer
- File and folder management
- Media preview (images, videos, audio)
- File upload and download
- Context menus
- Search functionality

### Games
- **Snake Game**: Classic arcade snake
- **Dino Runner**: Jump over obstacles
- **Memory Match**: Card matching puzzle
- **Village Builder**: Resource management clicker

### Settings
- Theme customization
- System monitoring
- Task manager
- User preferences
- About information

## 🔐 Security Features

- Password hashing with Werkzeug
- Session management with Flask-Login
- CSRF protection
- File upload validation
- SQL injection prevention
- XSS protection headers

## 🎨 Customization

### Adding Themes

Themes are defined in CSS and can be easily customized. See the theme files in `static/css/`.

### Adding Applications

1. Create a new application module in `static/js/apps/`
2. Add window configuration in `WindowManager`
3. Add desktop icon in `DesktopManager`
4. Create route handler if needed

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐛 Known Issues

- File upload size limited to 16MB
- Some games may not work on older browsers
- Mobile interface is functional but optimized for desktop

## 🤝 Contributing

This is a demonstration project. Feel free to fork and modify for your own use.

## 📄 License

MIT License - feel free to use and modify as needed.

## 🆘 Support

If you encounter issues:

1. Check the console for error messages (F12 in browser)
2. Review the Flask application logs
3. Ensure all dependencies are installed
4. Verify file permissions

## 🚀 Development

### Running in Development Mode

The application runs in debug mode by default. For production:

1. Set `DEBUG = False` in `config.py`
2. Use a production WSGI server like Gunicorn
3. Set up proper database (PostgreSQL/MySQL)
4. Configure environment variables

### Environment Variables

Create a `.env` file for production settings:

```bash
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost/pixelpusher
DEBUG=False
```

---

🎨 **Pixel Pusher OS** - A modern web desktop experience