/**
 * Pixel Pusher OS - Main Application Controller
 * Core application initialization and management system
 * Complete implementation with all features and error handling
 */

class PixelPusherApp {
    constructor() {
        this.initialized = false;
        this.modules = {};
        this.config = {};
        this.state = {
            currentUser: null,
            zIndex: 100,
            windows: new Set(),
            desktop: null,
            version: '2.0.0',
            startTime: Date.now()
        };

        console.log('%c🎨 Pixel Pusher OS v2.0.0', 'color: #00d9ff; font-size: 20px; font-weight: bold;');
        console.log('%c Professional Web Desktop Environment', 'color: #bfbfbf; font-size: 14px;');
    }

    async init() {
        if (this.initialized) {
            console.warn('⚠️ Application already initialized');
            return;
        }

        try {
            console.log('🚀 Initializing Pixel Pusher OS...');

            // Load configuration if provided
            this.loadConfiguration();

            // Initialize core modules
            await this.loadCoreModules();

            // Set up global event listeners
            this.initializeGlobalEventListeners();

            // Start system services
            this.startSystemServices();

            // Initialize desktop if user is authenticated
            if (this.isUserAuthenticated()) {
                await this.initializeDesktopEnvironment();
            }

            this.initialized = true;
            console.log('✅ Pixel Pusher OS initialized successfully');

            // Show welcome message for first-time users
            this.showWelcomeMessage();

        } catch (error) {
            console.error('❌ Failed to initialize Pixel Pusher OS:', error);
            this.handleInitializationError(error);
        }
    }

    loadConfiguration() {
        // Load configuration from global window object if available
        if (window.pixelPusher && window.pixelPusher.config) {
            this.config = window.pixelPusher.config;
            console.log('📋 Configuration loaded:', Object.keys(this.config));
        }

        // Extract user information
        const userElement = document.querySelector('[data-user]');
        const groupElement = document.querySelector('[data-group]');

        if (userElement) {
            this.state.currentUser = {
                username: userElement.dataset.user,
                group: groupElement?.dataset.group || 'user'
            };
        }
    }

    async loadCoreModules() {
        console.log('📦 Loading core modules...');

        // Always load state manager first
        this.modules.state = new StateManager();
        await this.modules.state.init();
        console.log('  ✅ State Manager loaded');

        // Load authentication manager if login system exists
        if (document.getElementById('loginOverlay') || this.isUserAuthenticated()) {
            try {
                if (typeof AuthManager !== 'undefined') {
                    this.modules.auth = new AuthManager();
                    await this.modules.auth.init();
                    console.log('  ✅ Authentication Manager loaded');
                }
            } catch (e) {
                console.warn('  ⚠️ Authentication Manager not available:', e.message);
            }
        }

        // Load desktop environment modules only if user is authenticated
        if (this.isUserAuthenticated()) {
            await this.loadDesktopModules();
        }

        console.log('📦 Core modules loading completed');
    }

    async loadDesktopModules() {
        // Small delay to ensure all classes are fully loaded
        await new Promise(resolve => setTimeout(resolve, 50));

        const moduleLoaders = [
            {
                name: 'Desktop Manager',
                className: 'DesktopManager',
                key: 'desktop'
            },
            {
                name: 'Window Manager',
                className: 'WindowManager',
                key: 'windows'
            },
            {
                name: 'Terminal Manager',
                className: 'TerminalManager',
                key: 'terminal'
            },
            {
                name: 'Explorer Manager',
                className: 'ExplorerManager',
                key: 'explorer'
            },
            {
                name: 'Game Manager',
                className: 'GameManager',
                key: 'games'
            },
            {
                name: 'Settings Manager',
                className: 'SettingsManager',
                key: 'settings'
            }
        ];

        for (const loader of moduleLoaders) {
            try {
                // Check multiple possible locations for the class
                let ModuleClass = window[loader.className];

                // Special handling for ExplorerManager which might be in window.ExplorerManager
                if (!ModuleClass && loader.className === 'ExplorerManager') {
                    ModuleClass = window.ExplorerManager;
                }

                if (ModuleClass && typeof ModuleClass === 'function') {
                    this.modules[loader.key] = new ModuleClass();
                    console.log(`  ✅ ${loader.name} loaded`);
                } else {
                    console.warn(`  ⚠️ ${loader.name} not available (${loader.className} not found)`);
                }
            } catch (error) {
                console.warn(`  ⚠️ ${loader.name} failed to load:`, error.message);
            }
        }
    }

    async initializeDesktopEnvironment() {
        console.log('🖥️ Initializing desktop environment...');

        const initOrder = ['desktop', 'windows', 'terminal', 'explorer', 'games', 'settings'];

        for (const moduleKey of initOrder) {
            const module = this.modules[moduleKey];

            if (module && typeof module.init === 'function') {
                try {
                    await module.init();
                    console.log(`  ✅ ${moduleKey} module initialized`);
                } catch (error) {
                    console.warn(`  ⚠️ ${moduleKey} module initialization failed:`, error.message);
                }
            }
        }

        console.log('✅ Desktop environment ready');
    }

    initializeGlobalEventListeners() {
        console.log('🎧 Setting up global event listeners...');

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeyboardShortcuts(e);
        });

        // Global click handling
        document.addEventListener('click', (e) => {
            this.handleGlobalClick(e);
        });

        // Window resize handling
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });

        // Visibility change handling (tab switching, minimizing)
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Before page unload
        window.addEventListener('beforeunload', (e) => {
            this.handleBeforeUnload(e);
        });

        // Desktop context menu
        const desktop = document.getElementById('desktop');
        if (desktop) {
            desktop.addEventListener('contextmenu', (e) => {
                if (e.target === desktop || e.target.classList.contains('desktop-icon')) {
                    e.preventDefault();
                    this.showDesktopContextMenu(e.clientX, e.clientY);
                }
            });

            // Desktop click to clear selections
            desktop.addEventListener('click', (e) => {
                if (e.target === desktop) {
                    this.clearAllSelections();
                }
            });
        }

        // Error handling
        window.addEventListener('error', (e) => {
            this.handleGlobalError(e);
        });

        window.addEventListener('unhandledrejection', (e) => {
            this.handleUnhandledRejection(e);
        });
    }

    handleGlobalKeyboardShortcuts(e) {
        // Terminal shortcut: Ctrl+Alt+T
        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') {
            e.preventDefault();
            this.openApplication('terminal');
            return;
        }

        // File Explorer shortcut: Ctrl+Alt+E
        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'e') {
            e.preventDefault();
            this.openApplication('explorer');
            return;
        }

        // Settings shortcut: Ctrl+Alt+S
        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            this.openApplication('settings');
            return;
        }

        // Games menu shortcut: Ctrl+Alt+G
        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'g') {
            e.preventDefault();
            this.showGamesMenu();
            return;
        }

        // Task Manager shortcut: Ctrl+Shift+Esc
        if (e.ctrlKey && e.shiftKey && e.key === 'Escape') {
            e.preventDefault();
            this.openApplication('taskmanager');
            return;
        }

        // Escape key - close context menus and modals
        if (e.key === 'Escape') {
            this.closeAllContextMenus();
            this.closeAllModals();
        }

        // F11 - Toggle fullscreen
        if (e.key === 'F11') {
            e.preventDefault();
            this.toggleFullscreen();
        }

        // Alt+Tab - Window switching (if window manager available)
        if (e.altKey && e.key === 'Tab') {
            e.preventDefault();
            if (this.modules.windows && typeof this.modules.windows.cycleWindows === 'function') {
                this.modules.windows.cycleWindows();
            }
        }

        // Ctrl+R - Refresh (with confirmation)
        if (e.ctrlKey && e.key === 'r') {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                if (confirm('You have unsaved changes. Are you sure you want to refresh?')) {
                    window.location.reload();
                }
            }
        }
    }

    handleGlobalClick(e) {
        // Close context menus when clicking outside
        if (!e.target.closest('.context-menu')) {
            this.closeAllContextMenus();
        }

        // Close modals when clicking backdrop
        if (e.target.classList.contains('modal-backdrop')) {
            this.closeModal(e.target.closest('.modal'));
        }

        // Update user activity (for session management)
        if (this.modules.auth && typeof this.modules.auth.updateActivity === 'function') {
            this.modules.auth.updateActivity();
        }

        // Handle desktop icon clicks
        if (e.target.closest('.desktop-icon')) {
            const icon = e.target.closest('.desktop-icon');
            const iconId = icon.dataset.iconId;

            if (e.detail === 2) { // Double click
                this.openApplication(iconId);
            } else { // Single click
                this.selectDesktopIcon(icon);
            }
        }
    }

    handleWindowResize() {
        // Notify all modules about resize
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.handleResize === 'function') {
                try {
                    module.handleResize();
                } catch (error) {
                    console.warn('Module resize handler error:', error);
                }
            }
        });

        // Update viewport state
        if (this.modules.state) {
            this.modules.state.set('viewport', {
                width: window.innerWidth,
                height: window.innerHeight,
                timestamp: Date.now()
            });
        }

        // Adjust modals if any are open
        this.adjustModalsForResize();
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.pauseNonEssentialActivities();
        } else {
            this.resumeActivities();
        }
    }

    handleBeforeUnload(e) {
        // Save application state
        this.saveApplicationState();

        // Check for unsaved changes
        if (this.hasUnsavedChanges()) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
    }

    handleGlobalError(e) {
        console.error('Global error caught:', e.error);

        // Show non-intrusive error notification
        this.showNotification(
            'An error occurred. Check console for details.',
            'error',
            5000
        );

        // Log to state if available
        if (this.modules.state) {
            this.modules.state.set('lastError', {
                message: e.error?.message || 'Unknown error',
                timestamp: Date.now(),
                filename: e.filename,
                lineno: e.lineno
            });
        }
    }

    handleUnhandledRejection(e) {
        console.error('Unhandled promise rejection:', e.reason);
        e.preventDefault(); // Prevent default browser behavior

        this.showNotification(
            'A background operation failed. Check console for details.',
            'warning',
            3000
        );
    }

    startSystemServices() {
        console.log('⚙️ Starting system services...');

        // System clock
        this.startSystemClock();

        // Periodic state saving
        this.startPeriodicStateSaving();

        // Performance monitoring
        this.startPerformanceMonitoring();

        // Cleanup service
        this.startCleanupService();

        console.log('  ✅ System services started');
    }

    startSystemClock() {
        const updateClock = () => {
            const clockElements = document.querySelectorAll('#systemTime, .system-time');
            clockElements.forEach(clockElement => {
                if (clockElement) {
                    const now = new Date();
                    clockElement.textContent = now.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                }
            });
        };

        updateClock();
        this.systemClockInterval = setInterval(updateClock, 1000);
    }

    startPeriodicStateSaving() {
        this.stateSaveInterval = setInterval(() => {
            this.saveApplicationState();
        }, 30000); // Save every 30 seconds
    }

    startPerformanceMonitoring() {
        this.performanceInterval = setInterval(() => {
            this.collectPerformanceMetrics();
        }, 60000); // Collect every minute
    }

    startCleanupService() {
        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, 300000); // Cleanup every 5 minutes
    }

    performCleanup() {
        // Clean up old notifications
        document.querySelectorAll('.notification').forEach(notification => {
            if (Date.now() - parseInt(notification.dataset.timestamp || '0') > 60000) {
                notification.remove();
            }
        });

        // Clean up orphaned modals
        document.querySelectorAll('.modal').forEach(modal => {
            if (!modal.parentNode) {
                modal.remove();
            }
        });

        // Trigger garbage collection if available
        if (window.gc && typeof window.gc === 'function') {
            try {
                window.gc();
            } catch (e) {
                // Ignore errors
            }
        }
    }

    isUserAuthenticated() {
        const loginOverlay = document.getElementById('loginOverlay');
        return !loginOverlay || loginOverlay.style.display === 'none' || loginOverlay.classList.contains('hidden');
    }

    openApplication(appId) {
        console.log(`🚀 Opening application: ${appId}`);

        // Handle special applications
        if (appId === 'logout') {
            this.handleLogout();
            return;
        }

        // Use window manager if available
        if (this.modules.windows && typeof this.modules.windows.open === 'function') {
            try {
                this.modules.windows.open(appId);
            } catch (error) {
                console.error(`Failed to open ${appId}:`, error);
                this.showNotification(`Failed to open ${appId}`, 'error');
            }
        } else {
            console.warn(`Cannot open ${appId}: Window manager not available`);
            this.showNotification('Window manager not available', 'warning');
        }
    }

    closeApplication(appId) {
        if (this.modules.windows && typeof this.modules.windows.close === 'function') {
            this.modules.windows.close(appId);
        }
    }

    handleLogout() {
        if (confirm('Are you sure you want to sign out?')) {
            this.saveApplicationState();
            window.location.href = '/logout';
        }
    }

    selectDesktopIcon(iconElement) {
        // Clear other selections
        document.querySelectorAll('.desktop-icon.selected').forEach(icon => {
            icon.classList.remove('selected');
        });

        // Select this icon
        iconElement.classList.add('selected');
    }

    clearAllSelections() {
        document.querySelectorAll('.desktop-icon.selected').forEach(icon => {
            icon.classList.remove('selected');
        });
    }

    showDesktopContextMenu(x, y) {
        const menu = document.getElementById('contextMenu') || this.createDesktopContextMenu();

        if (menu) {
            // Position menu within viewport
            const menuWidth = 200;
            const menuHeight = 150;

            menu.style.display = 'block';
            menu.style.left = Math.min(x, window.innerWidth - menuWidth) + 'px';
            menu.style.top = Math.min(y, window.innerHeight - menuHeight) + 'px';
        }
    }

    createDesktopContextMenu() {
        const menu = document.createElement('div');
        menu.id = 'contextMenu';
        menu.className = 'context-menu';
        menu.innerHTML = `
            <div class="context-item" onclick="window.pixelPusher.openApplication('terminal')">
                💻 Open Terminal
            </div>
            <div class="context-item" onclick="window.pixelPusher.openApplication('explorer')">
                📁 Open File Explorer
            </div>
            <div class="context-separator"></div>
            <div class="context-item" onclick="window.pixelPusher.showGamesMenu()">
                🎮 Games Menu
            </div>
            <div class="context-item" onclick="window.pixelPusher.openApplication('settings')">
                ⚙️ Settings
            </div>
            <div class="context-separator"></div>
            <div class="context-item" onclick="window.pixelPusher.refreshDesktop()">
                🔄 Refresh Desktop
            </div>
        `;

        document.body.appendChild(menu);
        return menu;
    }

    showGamesMenu() {
        const games = [
            { id: 'snake', name: '🐍 Snake Game', description: 'Classic arcade snake game' },
            { id: 'dino', name: '🦕 Dino Runner', description: 'Jump over obstacles in endless runner' },
            { id: 'memory', name: '🧠 Memory Match', description: 'Match pairs of cards to test memory' },
            { id: 'village', name: '🏘️ Village Builder', description: 'Build and manage your village' }
        ];

        let menuHTML = `
            <div class="games-menu" style="text-align: center; padding: 20px;">
                <h3 style="margin-bottom: 20px; color: var(--text-primary);">🎮 Choose a Game</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; max-width: 500px; margin: 0 auto;">
        `;

        games.forEach(game => {
            menuHTML += `
                <div class="game-option" 
                     onclick="window.pixelPusher.openApplication('${game.id}'); window.pixelPusher.closeAllModals();"
                     style="
                        padding: 20px;
                        background: var(--surface-light);
                        border: 2px solid var(--border);
                        border-radius: 12px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-align: center;
                     "
                     onmouseover="this.style.transform='scale(1.05)'; this.style.borderColor='var(--primary)';"
                     onmouseout="this.style.transform='scale(1)'; this.style.borderColor='var(--border)';">
                    <div style="font-size: 32px; margin-bottom: 10px;">${game.name.split(' ')[0]}</div>
                    <div style="font-weight: bold; color: var(--text-primary); margin-bottom: 5px;">
                        ${game.name.substring(2)}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary);">
                        ${game.description}
                    </div>
                </div>
            `;
        });

        menuHTML += `
                </div>
                <div style="margin-top: 20px; color: var(--text-secondary); font-size: 14px;">
                    Press Ctrl+Alt+G to open this menu anytime
                </div>
            </div>
        `;

        this.showModal('Games Center', menuHTML);
    }

    refreshDesktop() {
        window.location.reload();
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
        modal.dataset.timestamp = Date.now().toString();

        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content" style="
                background: var(--surface);
                border: 1px solid var(--border); 
                border-radius: 16px;
                max-width: ${options.maxWidth || '600px'};
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
                position: relative;
                margin: 20px;
            ">
                <div class="modal-header" style="
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--surface-light);
                    border-radius: 16px 16px 0 0;
                ">
                    <h3 style="margin: 0; color: var(--text-primary); font-size: 18px;">${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()" style="
                        background: var(--error);
                        color: white;
                        border: none;
                        border-radius: 6px;
                        width: 28px;
                        height: 28px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                        transition: all 0.2s ease;
                    " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">✕</button>
                </div>
                <div class="modal-body" style="padding: 24px; color: var(--text-primary);">
                    ${content}
                </div>
            </div>
        `;

        // Add modal styles if not present
        this.ensureModalStyles();

        document.body.appendChild(modal);

        // Animate in
        setTimeout(() => {
            modal.style.opacity = '1';
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.transform = 'scale(1)';
            }
        }, 10);

        return modal;
    }

    ensureModalStyles() {
        if (!document.getElementById('modal-styles')) {
            const modalStyles = document.createElement('style');
            modalStyles.id = 'modal-styles';
            modalStyles.textContent = `
                .modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                .modal-backdrop {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(8px);
                }
                .modal-content {
                    position: relative;
                    transform: scale(0.9);
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .game-option:hover {
                    transform: scale(1.05);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
                }
            `;
            document.head.appendChild(modalStyles);
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.style.opacity = '0';
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.transform = 'scale(0.9)';
            }

            setTimeout(() => {
                if (modal.parentNode) {
                    modal.remove();
                }
            }, 300);
        }
    }

    adjustModalsForResize() {
        document.querySelectorAll('.modal-content').forEach(modalContent => {
            const maxWidth = Math.min(window.innerWidth - 40, 600);
            const maxHeight = window.innerHeight - 40;

            modalContent.style.maxWidth = maxWidth + 'px';
            modalContent.style.maxHeight = maxHeight + 'px';
        });
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
                this.showNotification('Fullscreen not supported', 'warning');
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
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 64px; margin-bottom: 20px;">🎨</div>
                        <h2 style="color: var(--text-primary); margin-bottom: 16px;">Welcome to Pixel Pusher OS!</h2>
                        <p style="color: var(--text-secondary); margin-bottom: 30px; font-size: 16px;">
                            Your modern web-based desktop environment is ready to use.
                        </p>
                        
                        <div style="background: var(--surface-light); padding: 20px; border-radius: 12px; margin-bottom: 30px; text-align: left;">
                            <h4 style="color: var(--text-primary); margin-bottom: 15px;">🚀 Quick Tips:</h4>
                            <div style="color: var(--text-secondary); line-height: 1.6;">
                                • Press <kbd style="background: var(--surface-dark); padding: 2px 6px; border-radius: 4px; font-size: 12px;">Ctrl+Alt+T</kbd> for Terminal<br>
                                • Press <kbd style="background: var(--surface-dark); padding: 2px 6px; border-radius: 4px; font-size: 12px;">Ctrl+Alt+E</kbd> for File Explorer<br>
                                • Press <kbd style="background: var(--surface-dark); padding: 2px 6px; border-radius: 4px; font-size: 12px;">Ctrl+Alt+G</kbd> for Games Menu<br>
                                • Right-click desktop for context menu<br>
                                • Double-click icons to open applications
                            </div>
                        </div>
                        
                        <button onclick="localStorage.setItem('pixelpusher_welcome_seen', 'true'); this.closest('.modal').remove();" style="
                            background: var(--primary);
                            color: white;
                            border: none;
                            padding: 12px 30px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: 600;
                            transition: all 0.2s ease;
                        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                            Get Started! 🚀
                        </button>
                    </div>
                `;

                this.showModal('Welcome to Pixel Pusher OS', welcomeContent, { maxWidth: '500px' });
            }, 2000);
        }
    }

    handleInitializationError(error) {
        console.error('System initialization failed:', error);

        const errorContent = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
                <h3 style="color: var(--error); margin-bottom: 16px;">Initialization Error</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">
                    Pixel Pusher OS encountered an error during startup.
                </p>
                <div style="background: var(--surface-light); padding: 15px; border-radius: 8px; margin-bottom: 25px;">
                    <p style="font-size: 14px; color: var(--text-secondary); font-family: monospace;">
                        Error: ${error.message}
                    </p>
                </div>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button onclick="window.location.reload()" style="
                        background: var(--primary);
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                    ">
                        Reload Application
                    </button>
                    <button onclick="console.log(window.pixelPusher.getStats())" style="
                        background: var(--secondary);
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                    ">
                        Debug Info
                    </button>
                </div>
            </div>
        `;

        // Create error modal with backdrop
        const errorModal = document.createElement('div');
        errorModal.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
            ">
                <div style="
                    background: var(--surface);
                    padding: 0;
                    border-radius: 16px;
                    max-width: 500px;
                    margin: 20px;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                ">
                    ${errorContent}
                </div>
            </div>
        `;

        document.body.appendChild(errorModal);
    }

    pauseNonEssentialActivities() {
        console.log('⏸️ Pausing non-essential activities');

        // Pause games
        if (this.modules.games && typeof this.modules.games.pauseAll === 'function') {
            this.modules.games.pauseAll();
        }

        // Add reduced motion class
        document.body.classList.add('reduced-motion');

        // Reduce update frequencies
        if (this.performanceInterval) {
            clearInterval(this.performanceInterval);
            this.performanceInterval = setInterval(() => {
                this.collectPerformanceMetrics();
            }, 300000); // Reduce to every 5 minutes
        }
    }

    resumeActivities() {
        console.log('▶️ Resuming activities');

        // Remove reduced motion
        document.body.classList.remove('reduced-motion');

        // Resume games
        if (this.modules.games && typeof this.modules.games.resumeAll === 'function') {
            this.modules.games.resumeAll();
        }

        // Restore normal update frequencies
        if (this.performanceInterval) {
            clearInterval(this.performanceInterval);
            this.performanceInterval = setInterval(() => {
                this.collectPerformanceMetrics();
            }, 60000); // Back to every minute
        }
    }

    saveApplicationState() {
        if (this.modules.state && typeof this.modules.state.saveState === 'function') {
            try {
                this.modules.state.saveState();
            } catch (error) {
                console.warn('Failed to save application state:', error);
            }
        }
    }

    hasUnsavedChanges() {
        // Check with various modules for unsaved changes
        const modules = ['terminal', 'explorer', 'settings'];

        for (const moduleKey of modules) {
            const module = this.modules[moduleKey];
            if (module && typeof module.hasUnsavedChanges === 'function') {
                if (module.hasUnsavedChanges()) {
                    return true;
                }
            }
        }

        return false;
    }

    collectPerformanceMetrics() {
        const metrics = {
            timestamp: Date.now(),
            memory: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            } : null,
            timing: {
                domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
                loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart
            },
            activeWindows: this.state.windows.size,
            uptime: Date.now() - this.state.startTime
        };

        // Store in state
        if (this.modules.state) {
            this.modules.state.set('performance.lastMetrics', metrics);
        }

        console.debug('📊 Performance metrics collected:', metrics);
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
        notification.dataset.timestamp = Date.now().toString();

        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
        `;

        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
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
        this.ensureNotificationStyles();

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

    ensureNotificationStyles() {
        if (!document.getElementById('notification-styles')) {
            const notificationStyles = document.createElement('style');
            notificationStyles.id = 'notification-styles';
            notificationStyles.textContent = `
                .notification-content {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .notification-message {
                    flex: 1;
                    margin-right: 10px;
                }
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-size: 16px;
                    padding: 0 5px;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                }
                .notification-close:hover {
                    opacity: 1;
                }
                .notification {
                    font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
                    font-size: 14px;
                    line-height: 1.4;
                }
            `;
            document.head.appendChild(notificationStyles);
        }
    }

    getNotificationColor(type) {
        const colors = {
            'info': '#3498db',
            'success': '#27ae60',
            'warning': '#f39c12',
            'error': '#e74c3c'
        };
        return colors[type] || colors.info;
    }

    getStats() {
        return {
            version: this.state.version,
            initialized: this.initialized,
            uptime: Date.now() - this.state.startTime,
            modules: {
                loaded: Object.keys(this.modules).length,
                list: Object.keys(this.modules)
            },
            state: {
                activeWindows: this.state.windows.size,
                currentZIndex: this.state.zIndex,
                authenticated: this.isUserAuthenticated(),
                currentUser: this.state.currentUser
            },
            performance: this.modules.state ?
                this.modules.state.get('performance.lastMetrics') : null,
            memory: performance.memory ? {
                used: `${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)}MB`,
                total: `${Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)}MB`
            } : 'Not available'
        };
    }

    destroy() {
        console.log('🧹 Cleaning up Pixel Pusher OS...');

        // Clear intervals
        if (this.systemClockInterval) clearInterval(this.systemClockInterval);
        if (this.stateSaveInterval) clearInterval(this.stateSaveInterval);
        if (this.performanceInterval) clearInterval(this.performanceInterval);
        if (this.cleanupInterval) clearInterval(this.cleanupInterval);

        // Destroy all modules
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.destroy === 'function') {
                try {
                    module.destroy();
                } catch (error) {
                    console.warn('Module destroy error:', error);
                }
            }
        });

        // Save final state
        this.saveApplicationState();

        // Clean up DOM
        document.querySelectorAll('.modal, .notification, .context-menu').forEach(el => {
            el.remove();
        });

        // Reset state
        this.initialized = false;
        this.modules = {};

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
    // DOM is already loaded
    setTimeout(() => {
        window.pixelPusher.init();
    }, 100);
}

// Global utility functions for backward compatibility
function openWindow(windowId) {
    window.pixelPusher.openApplication(windowId);
}

function closeWindow(windowId) {
    window.pixelPusher.closeApplication(windowId);
}

function minimizeWindow(windowId) {
    if (window.pixelPusher.modules.windows) {
        window.pixelPusher.modules.windows.minimize(windowId);
    }
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
        case 'settings':
            window.pixelPusher.openApplication(action);
            break;
        case 'newfile':
            window.pixelPusher.showNotification('Creating new file...', 'info');
            break;
        case 'newfolder':
            window.pixelPusher.showNotification('Creating new folder...', 'info');
            break;
        case 'refresh':
            window.pixelPusher.refreshDesktop();
            break;
        default:
            console.log('Context action:', action);
    }
    window.pixelPusher.closeAllContextMenus();
}

// Debug utilities (available in console)
window.pixelPusherDebug = {
    getStats: () => window.pixelPusher.getStats(),
    getModules: () => Object.keys(window.pixelPusher.modules),
    getState: () => window.pixelPusher.modules.state?.exportState(),
    restart: () => {
        window.pixelPusher.destroy();
        setTimeout(() => window.pixelPusher.init(), 100);
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PixelPusherApp;
}

console.log('🎨 Pixel Pusher OS core application loaded successfully');