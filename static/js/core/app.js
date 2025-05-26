/**
 * Pixel Pusher OS - Main Application Controller
 * Core application initialization and management system
 *
 * This is the heart of the frontend application that:
 * - Initializes all modules and components
 * - Manages global state and events
 * - Coordinates communication between modules
 * - Handles system-wide functionality
 */

class PixelPusherApp {
    constructor() {
        this.initialized = false;
        this.modules = {};  // Storage for all loaded modules
        this.state = {
            currentUser: null,
            zIndex: 100,        // Window layering management
            windows: new Set(), // Active window tracking
            desktop: null,
            version: '2.0.0'
        };

        console.log('%c🎨 Pixel Pusher OS v2.0', 'color: #00d9ff; font-size: 20px; font-weight: bold;');
        console.log('%c Professional Web Desktop Environment', 'color: #bfbfbf; font-size: 14px;');
    }

    /**
     * Initialize the complete application system
     * This is called when the DOM is ready
     */
    async init() {
        if (this.initialized) {
            console.warn('⚠️ Application already initialized');
            return;
        }

        try {
            console.log('🚀 Initializing Pixel Pusher OS...');

            // Load and initialize all core modules
            await this.loadCoreModules();

            // Set up global event handling
            this.initializeGlobalEventListeners();

            // Start system services
            this.startSystemServices();

            // Initialize desktop if user is authenticated
            if (this.isUserAuthenticated()) {
                await this.initializeDesktopEnvironment();
            }

            this.initialized = true;
            console.log('✅ Pixel Pusher OS initialized successfully');

            // Show welcome message for new users
            this.showWelcomeMessage();

        } catch (error) {
            console.error('❌ Failed to initialize Pixel Pusher OS:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Load and initialize all core system modules
     */
    async loadCoreModules() {
        console.log('📦 Loading core modules...');

        // Initialize state management first (everything depends on it)
        this.modules.state = new StateManager();
        console.log('  ✅ State Manager loaded');

        // Initialize authentication system
        if (document.getElementById('loginOverlay') || this.isUserAuthenticated()) {
            this.modules.auth = new AuthManager();
            await this.modules.auth.init();
            console.log('  ✅ Authentication Manager loaded');
        }

        // Initialize desktop environment (only if user is authenticated)
        if (this.isUserAuthenticated()) {
            this.modules.desktop = new DesktopManager();
            this.modules.windows = new WindowManager();
            this.modules.terminal = new TerminalManager();
            this.modules.explorer = new ExplorerManager();
            this.modules.games = new GameManager();
            this.modules.settings = new SettingsManager();

            console.log('  ✅ Desktop environment modules loaded');
        }
    }

    /**
     * Initialize desktop environment for authenticated users
     */
    async initializeDesktopEnvironment() {
        console.log('🖥️ Initializing desktop environment...');

        try {
            // Initialize desktop and window management
            await this.modules.desktop.init();
            await this.modules.windows.init();

            // Initialize applications
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

    /**
     * Set up global event listeners for system-wide functionality
     */
    initializeGlobalEventListeners() {
        console.log('🎧 Setting up global event listeners...');

        // Keyboard shortcuts (Ctrl+Alt combinations)
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeyboardShortcuts(e);
        });

        // Click handler for context menus and global interactions
        document.addEventListener('click', (e) => {
            this.handleGlobalClick(e);
        });

        // Window resize handler for responsive design
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });

        // Handle page visibility changes (tab switching)
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Handle before page unload (save state, cleanup)
        window.addEventListener('beforeunload', (e) => {
            this.handleBeforeUnload(e);
        });

        // Desktop right-click context menu
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

    /**
     * Handle global keyboard shortcuts
     */
    handleGlobalKeyboardShortcuts(e) {
        // Ctrl+Alt+T - Open Terminal
        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') {
            e.preventDefault();
            this.openApplication('terminal');
            return;
        }

        // Ctrl+Alt+E - Open File Explorer
        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'e') {
            e.preventDefault();
            this.openApplication('explorer');
            return;
        }

        // Ctrl+Alt+S - Open Settings
        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            this.openApplication('settings');
            return;
        }

        // Ctrl+Alt+G - Open Games Menu
        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'g') {
            e.preventDefault();
            this.showGamesMenu();
            return;
        }

        // Escape - Close context menus and dialogs
        if (e.key === 'Escape') {
            this.closeAllContextMenus();
            this.closeAllModals();
        }

        // F11 - Toggle fullscreen mode
        if (e.key === 'F11') {
            e.preventDefault();
            this.toggleFullscreen();
        }
    }

    /**
     * Handle global click events
     */
    handleGlobalClick(e) {
        // Close context menus when clicking elsewhere
        if (!e.target.closest('.context-menu')) {
            this.closeAllContextMenus();
        }

        // Handle modal backdrop clicks
        if (e.target.classList.contains('modal-backdrop')) {
            this.closeModal(e.target.closest('.modal'));
        }

        // Update user activity timestamp
        if (this.modules.auth) {
            this.modules.auth.updateActivity();
        }
    }

    /**
     * Handle window resize events
     */
    handleWindowResize() {
        // Notify all modules about window resize
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.handleResize === 'function') {
                module.handleResize();
            }
        });

        // Update viewport size in state
        if (this.modules.state) {
            this.modules.state.set('viewport', {
                width: window.innerWidth,
                height: window.innerHeight
            });
        }
    }

    /**
     * Handle page visibility changes (tab switching)
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden - pause non-essential activities
            this.pauseNonEssentialActivities();
        } else {
            // Page is visible - resume activities
            this.resumeActivities();
        }
    }

    /**
     * Handle before page unload
     */
    handleBeforeUnload(e) {
        // Save application state
        this.saveApplicationState();

        // If there are unsaved changes, warn user
        if (this.hasUnsavedChanges()) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
    }

    /**
     * Start essential system services
     */
    startSystemServices() {
        console.log('⚙️ Starting system services...');

        // Start system clock
        this.startSystemClock();

        // Start periodic state saving
        this.startPeriodicStateSaving();

        // Start performance monitoring
        this.startPerformanceMonitoring();

        console.log('  ✅ System services started');
    }

    /**
     * Start and maintain system clock display
     */
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

    /**
     * Start periodic application state saving
     */
    startPeriodicStateSaving() {
        // Save state every 30 seconds
        setInterval(() => {
            this.saveApplicationState();
        }, 30000);
    }

    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        // Monitor performance metrics every minute
        setInterval(() => {
            this.collectPerformanceMetrics();
        }, 60000);
    }

    /**
     * Check if user is authenticated
     */
    isUserAuthenticated() {
        const loginOverlay = document.getElementById('loginOverlay');
        return !loginOverlay || loginOverlay.style.display === 'none';
    }

    /**
     * Open an application window
     */
    openApplication(appId) {
        if (this.modules.windows) {
            this.modules.windows.open(appId);
        } else {
            console.warn(`Cannot open ${appId}: Window manager not available`);
        }
    }

    /**
     * Close an application window
     */
    closeApplication(appId) {
        if (this.modules.windows) {
            this.modules.windows.close(appId);
        }
    }

    /**
     * Show desktop context menu
     */
    showDesktopContextMenu(x, y) {
        const menu = document.getElementById('contextMenu');
        if (menu) {
            menu.style.display = 'block';
            menu.style.left = Math.min(x, window.innerWidth - 200) + 'px';
            menu.style.top = Math.min(y, window.innerHeight - 150) + 'px';
        }
    }

    /**
     * Show games selection menu
     */
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

    /**
     * Close all context menus
     */
    closeAllContextMenus() {
        document.querySelectorAll('.context-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }

    /**
     * Close all modal dialogs
     */
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            this.closeModal(modal);
        });
    }

    /**
     * Show a modal dialog
     */
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

        // Add CSS styles dynamically
        if (!document.getElementById('modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'modal-styles';
            styles.textContent = `
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
            document.head.appendChild(styles);
        }

        return modal;
    }

    /**
     * Close a specific modal
     */
    closeModal(modal) {
        if (modal) {
            modal.remove();
        }
    }

    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * Show welcome message for new users
     */
    showWelcomeMessage() {
        // Check if this is user's first visit
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

    /**
     * Handle initialization errors gracefully
     */
    handleInitializationError(error) {
        console.error('System initialization failed:', error);

        // Show user-friendly error message
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

        // Create error modal
        document.body.innerHTML += `
            <div class="modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 9999;">
                <div style="background: var(--surface); padding: 30px; border-radius: 15px; max-width: 400px;">
                    ${errorContent}
                </div>
            </div>
        `;
    }

    /**
     * Pause non-essential activities when page is hidden
     */
    pauseNonEssentialActivities() {
        // Pause games
        if (this.modules.games) {
            this.modules.games.pauseAll();
        }

        // Reduce animation frequency
        document.body.classList.add('reduced-motion');
    }

    /**
     * Resume activities when page becomes visible
     */
    resumeActivities() {
        // Remove reduced motion class
        document.body.classList.remove('reduced-motion');

        // Resume games if they were running
        if (this.modules.games) {
            this.modules.games.resumeAll();
        }
    }

    /**
     * Save complete application state
     */
    saveApplicationState() {
        if (this.modules.state) {
            this.modules.state.saveState();
        }
    }

    /**
     * Check if there are unsaved changes
     */
    hasUnsavedChanges() {
        // Check if terminal has unsaved command history
        // Check if explorer has unsaved file changes
        // Check if games have unsaved progress
        // This would be implemented based on specific requirements
        return false;
    }

    /**
     * Collect performance metrics
     */
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

        // Store metrics (could be sent to analytics)
        console.debug('📊 Performance metrics:', metrics);
    }

    /**
     * Utility method for making API calls
     */
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

    /**
     * Show system notification
     */
    showNotification(message, type = 'info', duration = 5000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
        `;

        // Style notification
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

        // Add notification styles if not present
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification-content { display: flex; align-items: center; justify-content: space-between; }
                .notification-message { flex: 1; margin-right: 10px; }
                .notification-close { 
                    background: none; border: none; color: white; 
                    cursor: pointer; font-size: 16px; padding: 0 5px;
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Auto-remove after duration
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

    /**
     * Get notification background color based on type
     */
    getNotificationColor(type) {
        const colors = {
            'info': '#00d9ff',
            'success': '#00b894',
            'warning': '#fdcb6e',
            'error': '#e84393'
        };
        return colors[type] || colors.info;
    }

    /**
     * Get application statistics
     */
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

    /**
     * Clean up application resources
     */
    destroy() {
        console.log('🧹 Cleaning up Pixel Pusher OS...');

        // Clean up all modules
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.destroy === 'function') {
                module.destroy();
            }
        });

        // Save final state
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
    // DOM is already ready
    window.pixelPusher.init();
}

// Global functions for backward compatibility with HTML onclick handlers
function openWindow(windowId) {
    window.pixelPusher.openApplication(windowId);
}

function closeWindow(windowId) {
    window.pixelPusher.closeApplication(windowId);
}

function minimizeWindow(windowId) {
    window.pixelPusher.closeApplication(windowId); // For now, minimize = close
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

// Export for potential module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PixelPusherApp;
}

console.log('🎨 Pixel Pusher OS core application loaded successfully');