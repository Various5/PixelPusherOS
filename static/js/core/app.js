/**
 * Pixel Pusher OS - Main Application Controller
 * Core application initialization and management system
 */

class PixelPusherApp {
    constructor() {
        this.initialized = false;
        this.modules = {};
        this.state = {
            currentUser: null,
            zIndex: 100,
            windows: new Set(),
            desktop: null,
            version: '2.0.0'
        };

        console.log('%c🎨 Pixel Pusher OS v2.0', 'color: #00d9ff; font-size: 20px; font-weight: bold;');
        console.log('%c Professional Web Desktop Environment', 'color: #bfbfbf; font-size: 14px;');
    }

    async init() {
        if (this.initialized) {
            console.warn('⚠️ Application already initialized');
            return;
        }

        try {
            console.log('🚀 Initializing Pixel Pusher OS...');

            await this.loadCoreModules();
            this.initializeGlobalEventListeners();
            this.startSystemServices();

            if (this.isUserAuthenticated()) {
                await this.initializeDesktopEnvironment();
            }

            this.initialized = true;
            console.log('✅ Pixel Pusher OS initialized successfully');

            this.showWelcomeMessage();

        } catch (error) {
            console.error('❌ Failed to initialize Pixel Pusher OS:', error);
            this.handleInitializationError(error);
        }
    }

    async loadCoreModules() {
        console.log('📦 Loading core modules...');

        this.modules.state = new StateManager();
        console.log('  ✅ State Manager loaded');

        if (document.getElementById('loginOverlay') || this.isUserAuthenticated()) {
            this.modules.auth = new AuthManager();
            await this.modules.auth.init();
            console.log('  ✅ Authentication Manager loaded');
        }

        if (this.isUserAuthenticated()) {
            if (typeof DesktopManager !== 'undefined') {
                this.modules.desktop = new DesktopManager();
            }
            if (typeof WindowManager !== 'undefined') {
                this.modules.windows = new WindowManager();
            }
            if (typeof TerminalManager !== 'undefined') {
                this.modules.terminal = new TerminalManager();
            }
            if (typeof ExplorerManager !== 'undefined') {
                this.modules.explorer = new ExplorerManager();
            }
            if (typeof GameManager !== 'undefined') {
                this.modules.games = new GameManager();
            }
            if (typeof SettingsManager !== 'undefined') {
                this.modules.settings = new SettingsManager();
            }

            console.log('  ✅ Desktop environment modules loaded');
        }
    }

    async initializeDesktopEnvironment() {
        console.log('🖥️ Initializing desktop environment...');

        try {
            if (this.modules.desktop) await this.modules.desktop.init();
            if (this.modules.windows) await this.modules.windows.init();
            if (this.modules.terminal) await this.modules.terminal.init();
            if (this.modules.explorer) await this.modules.explorer.init();
            if (this.modules.games) await this.modules.games.init();
            if (this.modules.settings) await this.modules.settings.init();

            console.log('  ✅ Desktop environment ready');

        } catch (error) {
            console.error('❌ Desktop initialization error:', error);
            throw error;
        }
    }

    initializeGlobalEventListeners() {
        console.log('🎧 Setting up global event listeners...');

        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeyboardShortcuts(e);
        });

        document.addEventListener('click', (e) => {
            this.handleGlobalClick(e);
        });

        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });

        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        window.addEventListener('beforeunload', (e) => {
            this.handleBeforeUnload(e);
        });

        const desktop = document.getElementById('desktop');
        if (desktop) {
            desktop.addEventListener('contextmenu', (e) => {
                if (e.target === desktop) {
                    e.preventDefault();
                    this.showDesktopContextMenu(e.clientX, e.clientY);
                }
            });
        }
    }

    handleGlobalKeyboardShortcuts(e) {
        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') {
            e.preventDefault();
            this.openApplication('terminal');
            return;
        }

        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'e') {
            e.preventDefault();
            this.openApplication('explorer');
            return;
        }

        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            this.openApplication('settings');
            return;
        }

        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'g') {
            e.preventDefault();
            this.showGamesMenu();
            return;
        }

        if (e.key === 'Escape') {
            this.closeAllContextMenus();
            this.closeAllModals();
        }

        if (e.key === 'F11') {
            e.preventDefault();
            this.toggleFullscreen();
        }
    }

    handleGlobalClick(e) {
        if (!e.target.closest('.context-menu')) {
            this.closeAllContextMenus();
        }

        if (e.target.classList.contains('modal-backdrop')) {
            this.closeModal(e.target.closest('.modal'));
        }

        if (this.modules.auth) {
            this.modules.auth.updateActivity();
        }
    }

    handleWindowResize() {
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.handleResize === 'function') {
                module.handleResize();
            }
        });

        if (this.modules.state) {
            this.modules.state.set('viewport', {
                width: window.innerWidth,
                height: window.innerHeight
            });
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.pauseNonEssentialActivities();
        } else {
            this.resumeActivities();
        }
    }

    handleBeforeUnload(e) {
        this.saveApplicationState();

        if (this.hasUnsavedChanges()) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
    }

    startSystemServices() {
        console.log('⚙️ Starting system services...');

        this.startSystemClock();
        this.startPeriodicStateSaving();
        this.startPerformanceMonitoring();

        console.log('  ✅ System services started');
    }

    startSystemClock() {
        const updateClock = () => {
            const clockElement = document.getElementById('systemTime');
            if (clockElement) {
                const now = new Date();
                clockElement.textContent = now.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            }
        };

        updateClock();
        setInterval(updateClock, 1000);
    }

    startPeriodicStateSaving() {
        setInterval(() => {
            this.saveApplicationState();
        }, 30000);
    }

    startPerformanceMonitoring() {
        setInterval(() => {
            this.collectPerformanceMetrics();
        }, 60000);
    }

    isUserAuthenticated() {
        const loginOverlay = document.getElementById('loginOverlay');
        return !loginOverlay || loginOverlay.style.display === 'none';
    }

    openApplication(appId) {
        if (this.modules.windows) {
            this.modules.windows.open(appId);
        } else {
            console.warn(`Cannot open ${appId}: Window manager not available`);
        }
    }

    closeApplication(appId) {
        if (this.modules.windows) {
            this.modules.windows.close(appId);
        }
    }

    showDesktopContextMenu(x, y) {
        const menu = document.getElementById('contextMenu');
        if (menu) {
            menu.style.display = 'block';
            menu.style.left = Math.min(x, window.innerWidth - 200) + 'px';
            menu.style.top = Math.min(y, window.innerHeight - 150) + 'px';
        }
    }

    showGamesMenu() {
        const games = [
            { id: 'snake', name: '🐍 Snake Game', description: 'Classic snake game' },
            { id: 'dino', name: '🦕 Dino Runner', description: 'Jump over obstacles' },
            { id: 'memory', name: '🧠 Memory Match', description: 'Match pairs of cards' },
            { id: 'clicker', name: '🏘️ Village Builder', description: 'Build and manage your village' }
        ];

        let menuHTML = '<div class="games-menu"><h3>🎮 Choose a Game</h3>';
        games.forEach(game => {
            menuHTML += `
                <div class="game-option" onclick="window.pixelPusher.openApplication('${game.id}')">
                    <div class="game-title">${game.name}</div>
                    <div class="game-description">${game.description}</div>
                </div>
            `;
        });
        menuHTML += '</div>';

        this.showModal('Games Center', menuHTML);
    }

    closeAllContextMenus() {
        document.querySelectorAll('.context-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            this.closeModal(modal);
        });
    }

    showModal(title, content, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        if (!document.getElementById('modal-styles')) {
            const modalStyles = document.createElement('style');
            modalStyles.id = 'modal-styles';
            modalStyles.textContent = `
                .modal {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    z-index: 9999; display: flex; align-items: center; justify-content: center;
                }
                .modal-backdrop {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.8); backdrop-filter: blur(5px);
                }
                .modal-content {
                    background: var(--surface); border: 1px solid var(--border);
                    border-radius: var(--radius-lg); max-width: 500px; max-height: 80vh;
                    overflow-y: auto; box-shadow: var(--shadow-xl); position: relative;
                }
                .modal-header {
                    padding: 20px; border-bottom: 1px solid var(--border);
                    display: flex; justify-content: space-between; align-items: center;
                }
                .modal-header h3 { margin: 0; color: var(--text-primary); }
                .modal-close {
                    background: var(--error); color: white; border: none;
                    border-radius: 4px; padding: 4px 8px; cursor: pointer;
                }
                .modal-body { padding: 20px; color: var(--text-primary); }
                .games-menu { text-align: center; }
                .game-option {
                    padding: 15px; margin: 10px 0; background: var(--surface-light);
                    border-radius: var(--radius-md); cursor: pointer; transition: var(--transition);
                }
                .game-option:hover { background: var(--primary); color: white; }
                .game-title { font-weight: bold; margin-bottom: 5px; }
                .game-description { font-size: 14px; opacity: 0.8; }
            `;
            document.head.appendChild(modalStyles);
        }

        return modal;
    }

    closeModal(modal) {
        if (modal) {
            modal.remove();
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    showWelcomeMessage() {
        const hasSeenWelcome = localStorage.getItem('pixelpusher_welcome_seen');
        if (!hasSeenWelcome && this.isUserAuthenticated()) {
            setTimeout(() => {
                const welcomeContent = `
                    <div style="text-align: center;">
                        <h2>🎨 Welcome to Pixel Pusher OS!</h2>
                        <p>Your modern web-based desktop environment is ready.</p>
                        <div style="margin: 20px 0;">
                            <strong>Quick Tips:</strong><br>
                            • Press <kbd>Ctrl+Alt+T</kbd> for Terminal<br>
                            • Press <kbd>Ctrl+Alt+E</kbd> for File Explorer<br>
                            • Right-click desktop for context menu<br>
                            • Double-click icons to open applications
                        </div>
                        <button onclick="this.closest('.modal').remove()" class="btn">
                            Get Started! 🚀
                        </button>
                    </div>
                `;

                this.showModal('Welcome to Pixel Pusher OS', welcomeContent);
                localStorage.setItem('pixelpusher_welcome_seen', 'true');
            }, 1000);
        }
    }

    handleInitializationError(error) {
        console.error('System initialization failed:', error);

        const errorContent = `
            <div style="text-align: center; color: var(--error);">
                <h3>⚠️ Initialization Error</h3>
                <p>Pixel Pusher OS encountered an error during startup.</p>
                <p style="font-size: 14px; opacity: 0.8;">
                    Error: ${error.message}
                </p>
                <button onclick="window.location.reload()" class="btn">
                    Reload Application
                </button>
            </div>
        `;

        document.body.innerHTML += `
            <div class="modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 9999;">
                <div style="background: var(--surface); padding: 30px; border-radius: 15px; max-width: 400px;">
                    ${errorContent}
                </div>
            </div>
        `;
    }

    pauseNonEssentialActivities() {
        if (this.modules.games) {
            this.modules.games.pauseAll();
        }

        document.body.classList.add('reduced-motion');
    }

    resumeActivities() {
        document.body.classList.remove('reduced-motion');

        if (this.modules.games) {
            this.modules.games.resumeAll();
        }
    }

    saveApplicationState() {
        if (this.modules.state) {
            this.modules.state.saveState();
        }
    }

    hasUnsavedChanges() {
        return false;
    }

    collectPerformanceMetrics() {
        const metrics = {
            timestamp: Date.now(),
            memory: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null,
            timing: performance.timing,
            activeWindows: this.state.windows.size
        };

        console.debug('📊 Performance metrics:', metrics);
    }

    async apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`/api${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API call error (${endpoint}):`, error);
            throw error;
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
        `;

        Object.assign(notification.style, {
            position: 'fixed',
            top: '70px',
            right: '20px',
            padding: '12px 20px',
            background: this.getNotificationColor(type),
            color: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            zIndex: '9998',
            opacity: '0',
            transform: 'translateX(100px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            maxWidth: '350px',
            minWidth: '250px'
        });

        if (!document.getElementById('notification-styles')) {
            const notificationStyles = document.createElement('style');
            notificationStyles.id = 'notification-styles';
            notificationStyles.textContent = `
                .notification-content { display: flex; align-items: center; justify-content: space-between; }
                .notification-message { flex: 1; margin-right: 10px; }
                .notification-close { 
                    background: none; border: none; color: white; 
                    cursor: pointer; font-size: 16px; padding: 0 5px;
                }
            `;
            document.head.appendChild(notificationStyles);
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100px)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, duration);

        return notification;
    }

    getNotificationColor(type) {
        const colors = {
            'info': '#00d9ff',
            'success': '#00b894',
            'warning': '#fdcb6e',
            'error': '#e84393'
        };
        return colors[type] || colors.info;
    }

    getStats() {
        return {
            version: this.state.version,
            initialized: this.initialized,
            activeModules: Object.keys(this.modules).length,
            activeWindows: this.state.windows.size,
            currentZIndex: this.state.zIndex,
            authenticated: this.isUserAuthenticated(),
            uptime: performance.now()
        };
    }

    destroy() {
        console.log('🧹 Cleaning up Pixel Pusher OS...');

        Object.values(this.modules).forEach(module => {
            if (module && typeof module.destroy === 'function') {
                module.destroy();
            }
        });

        this.saveApplicationState();

        this.initialized = false;
        console.log('✅ Pixel Pusher OS cleanup completed');
    }
}

// Create global application instance
window.pixelPusher = new PixelPusherApp();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pixelPusher.init();
    });
} else {
    window.pixelPusher.init();
}

// Global functions for backward compatibility
function openWindow(windowId) {
    window.pixelPusher.openApplication(windowId);
}

function closeWindow(windowId) {
    window.pixelPusher.closeApplication(windowId);
}

function minimizeWindow(windowId) {
    window.pixelPusher.closeApplication(windowId);
}

function maximizeWindow(windowId) {
    if (window.pixelPusher.modules.windows) {
        window.pixelPusher.modules.windows.maximize(windowId);
    }
}

function contextAction(action) {
    switch(action) {
        case 'terminal':
        case 'explorer':
            openWindow(action);
            break;
        case 'newfile':
            window.pixelPusher.showNotification('Creating new file...', 'info');
            break;
        case 'newfolder':
            window.pixelPusher.showNotification('Creating new folder...', 'info');
            break;
        case 'refresh':
            window.location.reload();
            break;
        default:
            console.log('Context action:', action);
    }
    window.pixelPusher.closeAllContextMenus();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PixelPusherApp;
}

console.log('🎨 Pixel Pusher OS core application loaded successfully');