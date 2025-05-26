/**
 * Pixel Pusher OS - Window Manager
 * Handles application windows, positioning, and window management system
 *
 * This module provides:
 * - Window creation and management
 * - Window positioning and resizing
 * - Window focus and layering (z-index)
 * - Window minimize/maximize/close functionality
 * - Multi-window task management
 */

class WindowManager {
    constructor() {
        this.windows = new Map(); // Active windows storage
        this.zIndexCounter = 1000; // Starting z-index for windows
        this.activeWindow = null;
        this.windowConfigs = this.getWindowConfigurations();
        this.taskbar = null;

        console.log('🪟 Window Manager initialized');
    }

    /**
     * Initialize window management system
     */
    async init() {
        try {
            // Set up taskbar
            this.setupTaskbar();

            // Set up global window event handlers
            this.setupGlobalEventHandlers();

            // Create window container if not exists
            this.setupWindowContainer();

            console.log('✅ Window management system ready');

        } catch (error) {
            console.error('❌ Window Manager initialization failed:', error);
        }
    }

    /**
     * Get window configurations for different applications
     */
    getWindowConfigurations() {
        return {
            terminal: {
                title: '💻 Terminal',
                width: 800,
                height: 500,
                minWidth: 400,
                minHeight: 300,
                resizable: true,
                content: 'terminal'
            },
            explorer: {
                title: '📁 File Explorer',
                width: 900,
                height: 600,
                minWidth: 500,
                minHeight: 400,
                resizable: true,
                content: 'explorer'
            },
            browser: {
                title: '🌐 Web Browser',
                width: 1000,
                height: 700,
                minWidth: 600,
                minHeight: 400,
                resizable: true,
                content: 'browser'
            },
            settings: {
                title: '⚙️ System Settings',
                width: 700,
                height: 500,
                minWidth: 500,
                minHeight: 400,
                resizable: true,
                content: 'settings'
            },
            taskmanager: {
                title: '📊 Task Manager',
                width: 600,
                height: 400,
                minWidth: 400,
                minHeight: 300,
                resizable: true,
                content: 'taskmanager'
            },
            musicplayer: {
                title: '🎵 Music Player',
                width: 400,
                height: 300,
                minWidth: 300,
                minHeight: 200,
                resizable: false,
                content: 'musicplayer'
            },
            // Games
            snake: {
                title: '🐍 Snake Game',
                width: 600,
                height: 500,
                minWidth: 400,
                minHeight: 400,
                resizable: false,
                content: 'game',
                gameType: 'snake'
            },
            dino: {
                title: '🦕 Dino Runner',
                width: 700,
                height: 400,
                minWidth: 500,
                minHeight: 300,
                resizable: false,
                content: 'game',
                gameType: 'dino'
            },
            memory: {
                title: '🧠 Memory Match',
                width: 500,
                height: 600,
                minWidth: 400,
                minHeight: 500,
                resizable: false,
                content: 'game',
                gameType: 'memory'
            },
            clicker: {
                title: '🏘️ Village Builder',
                width: 800,
                height: 600,
                minWidth: 600,
                minHeight: 500,
                resizable: true,
                content: 'game',
                gameType: 'clicker'
            }
        };
    }

    /**
     * Open a new application window
     */
    open(appId, options = {}) {
        // Check if window is already open
        if (this.windows.has(appId)) {
            this.focus(appId);
            return this.windows.get(appId);
        }

        const config = this.windowConfigs[appId];
        if (!config) {
            console.error(`Unknown application: ${appId}`);
            return null;
        }

        // Create window
        const window = this.createWindow(appId, config, options);

        // Store window
        this.windows.set(appId, window);

        // Add to state management
        if (window.pixelPusher?.modules?.state) {
            window.pixelPusher.modules.state.addWindow(appId);
        }

        // Update taskbar
        this.updateTaskbar();

        // Focus the new window
        this.focus(appId);

        console.log(`🪟 Opened window: ${appId}`);
        return window;
    }

    /**
     * Create a new window element
     */
    createWindow(appId, config, options = {}) {
        const windowContainer = document.getElementById('windowContainer') || document.body;

        // Calculate position (cascade windows)
        const position = this.calculateWindowPosition(config, options);

        // Create window element
        const windowElement = document.createElement('div');
        windowElement.className = 'window';
        windowElement.id = `window-${appId}`;
        windowElement.dataset.appId = appId;
        windowElement.style.cssText = `
            position: fixed;
            left: ${position.x}px;
            top: ${position.y}px;
            width: ${config.width}px;
            height: ${config.height}px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: ${++this.zIndexCounter};
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: all 0.2s ease;
        `;

        // Create window structure
        windowElement.innerHTML = `
            <div class="window-header" style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 12px;
                background: var(--surface-light);
                border-bottom: 1px solid var(--border);
                cursor: move;
                user-select: none;
                min-height: 32px;
            ">
                <div class="window-title" style="
                    font-weight: 600;
                    font-size: 14px;
                    color: var(--text-primary);
                    flex: 1;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                ">
                    ${config.title}
                </div>
                <div class="window-controls" style="
                    display: flex;
                    gap: 4px;
                ">
                    <button class="window-btn minimize-btn" onclick="window.pixelPusher.modules.windows.minimize('${appId}')" 
                            title="Minimize" style="
                        width: 24px; height: 24px; border: none; border-radius: 4px;
                        background: var(--warning); color: white; cursor: pointer;
                        display: flex; align-items: center; justify-content: center;
                        font-size: 12px; transition: opacity 0.2s;
                    ">−</button>
                    <button class="window-btn maximize-btn" onclick="window.pixelPusher.modules.windows.maximize('${appId}')" 
                            title="Maximize" style="
                        width: 24px; height: 24px; border: none; border-radius: 4px;
                        background: var(--success); color: white; cursor: pointer;
                        display: flex; align-items: center; justify-content: center;
                        font-size: 12px; transition: opacity 0.2s;
                    ">□</button>
                    <button class="window-btn close-btn" onclick="window.pixelPusher.modules.windows.close('${appId}')" 
                            title="Close" style="
                        width: 24px; height: 24px; border: none; border-radius: 4px;
                        background: var(--error); color: white; cursor: pointer;
                        display: flex; align-items: center; justify-content: center;
                        font-size: 12px; transition: opacity 0.2s;
                    ">✕</button>
                </div>
            </div>
            <div class="window-content" style="
                flex: 1;
                overflow: auto;
                position: relative;
                background: var(--background);
            ">
                ${this.generateWindowContent(appId, config)}
            </div>
        `;

        // Add window to container
        windowContainer.appendChild(windowElement);

        // Set up window event handlers
        this.setupWindowEventHandlers(windowElement, appId, config);

        // Initialize window content
        this.initializeWindowContent(appId, config);

        return windowElement;
    }

    /**
     * Generate content for different window types
     */
    generateWindowContent(appId, config) {
        switch (config.content) {
            case 'terminal':
                return `
                    <div id="terminal-${appId}" class="terminal-container">
                        <div class="terminal-output" id="terminal-output-${appId}"></div>
                        <div class="terminal-input-line">
                            <span class="terminal-prompt">pixel@pusher:~$ </span>
                            <input type="text" class="terminal-input" id="terminal-input-${appId}" 
                                   placeholder="Type 'help' for commands..." autocomplete="off">
                        </div>
                    </div>
                `;

            case 'explorer':
                return `
                    <div id="explorer-${appId}" class="explorer-container">
                        <div class="explorer-toolbar">
                            <button onclick="window.pixelPusher.modules.explorer.navigateBack()">← Back</button>
                            <button onclick="window.pixelPusher.modules.explorer.navigateUp()">↑ Up</button>
                            <input type="text" class="explorer-path" id="explorer-path-${appId}" 
                                   value="/" readonly>
                            <button onclick="window.pixelPusher.modules.explorer.refresh()">🔄 Refresh</button>
                        </div>
                        <div class="explorer-content" id="explorer-content-${appId}">
                            Loading...
                        </div>
                    </div>
                `;

            case 'browser':
                return `
                    <div id="browser-${appId}" class="browser-container">
                        <div class="browser-toolbar">
                            <input type="url" class="browser-address" id="browser-address-${appId}" 
                                   placeholder="Enter URL or search..." value="https://duckduckgo.com">
                            <button onclick="window.pixelPusher.modules.windows.loadBrowserPage('${appId}')">Go</button>
                        </div>
                        <iframe class="browser-frame" id="browser-frame-${appId}" 
                                src="https://duckduckgo.com" 
                                style="width: 100%; height: calc(100% - 40px); border: none;">
                        </iframe>
                    </div>
                `;

            case 'settings':
                return `
                    <div id="settings-${appId}" class="settings-container">
                        <div class="settings-sidebar">
                            <div class="settings-nav-item active" data-section="appearance">🎨 Appearance</div>
                            <div class="settings-nav-item" data-section="system">⚙️ System</div>
                            <div class="settings-nav-item" data-section="games">🎮 Games</div>
                            <div class="settings-nav-item" data-section="about">ℹ️ About</div>
                        </div>
                        <div class="settings-content" id="settings-content-${appId}">
                            Loading settings...
                        </div>
                    </div>
                `;

            case 'taskmanager':
                return `
                    <div id="taskmanager-${appId}" class="taskmanager-container">
                        <div class="taskmanager-tabs">
                            <div class="tab active" data-tab="processes">Processes</div>
                            <div class="tab" data-tab="performance">Performance</div>
                            <div class="tab" data-tab="network">Network</div>
                        </div>
                        <div class="taskmanager-content" id="taskmanager-content-${appId}">
                            Loading task manager...
                        </div>
                    </div>
                `;

            case 'musicplayer':
                return `
                    <div id="musicplayer-${appId}" class="musicplayer-container">
                        <div class="music-controls">
                            <button class="music-btn" onclick="window.pixelPusher.modules.settings.musicPrevious()">⏮️</button>
                            <button class="music-btn play-pause" onclick="window.pixelPusher.modules.settings.musicToggle()">▶️</button>
                            <button class="music-btn" onclick="window.pixelPusher.modules.settings.musicNext()">⏭️</button>
                        </div>
                        <div class="music-info">
                            <div class="music-title">No music playing</div>
                            <div class="music-progress">
                                <div class="progress-bar"></div>
                            </div>
                        </div>
                        <div class="music-volume">
                            <input type="range" class="volume-slider" min="0" max="100" value="50">
                        </div>
                    </div>
                `;

            case 'game':
                return `
                    <div id="game-${appId}" class="game-container">
                        <div class="game-content" id="game-content-${appId}">
                            Loading ${config.gameType} game...
                        </div>
                    </div>
                `;

            default:
                return `
                    <div class="default-window-content">
                        <h2>Application: ${appId}</h2>
                        <p>Window content goes here.</p>
                    </div>
                `;
        }
    }

    /**
     * Calculate optimal window position
     */
    calculateWindowPosition(config, options) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Default to center
        let x = Math.max(0, (viewportWidth - config.width) / 2);
        let y = Math.max(0, (viewportHeight - config.height) / 2);

        // Cascade windows if multiple are open
        const windowCount = this.windows.size;
        if (windowCount > 0) {
            const offset = windowCount * 30;
            x += offset;
            y += offset;

            // Wrap around if going off screen
            if (x + config.width > viewportWidth) {
                x = 50;
            }
            if (y + config.height > viewportHeight) {
                y = 50;
            }
        }

        // Override with provided options
        if (options.x !== undefined) x = options.x;
        if (options.y !== undefined) y = options.y;

        return { x, y };
    }

    /**
     * Set up event handlers for a window
     */
    setupWindowEventHandlers(windowElement, appId, config) {
        const header = windowElement.querySelector('.window-header');

        // Window dragging
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };

        header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('window-btn')) return;

            isDragging = true;
            this.focus(appId);

            const rect = windowElement.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;

            windowElement.style.transition = 'none';
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', handleDragEnd);
        });

        const handleDrag = (e) => {
            if (!isDragging) return;

            const x = e.clientX - dragOffset.x;
            const y = e.clientY - dragOffset.y;

            // Keep window within viewport bounds
            const maxX = window.innerWidth - windowElement.offsetWidth;
            const maxY = window.innerHeight - windowElement.offsetHeight;

            windowElement.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
            windowElement.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
        };

        const handleDragEnd = () => {
            isDragging = false;
            windowElement.style.transition = 'all 0.2s ease';
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', handleDragEnd);
        };

        // Window focus on click
        windowElement.addEventListener('mousedown', () => {
            this.focus(appId);
        });

        // Window resizing (if resizable)
        if (config.resizable) {
            this.makeWindowResizable(windowElement, config);
        }

        // Double-click header to maximize
        header.addEventListener('dblclick', () => {
            this.maximize(appId);
        });
    }

    /**
     * Make window resizable
     */
    makeWindowResizable(windowElement, config) {
        // Add resize handles
        const resizeHandles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

        resizeHandles.forEach(direction => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-${direction}`;
            handle.style.cssText = `
                position: absolute;
                background: transparent;
                ${this.getResizeHandleStyles(direction)}
            `;

            windowElement.appendChild(handle);

            // Add resize functionality
            this.addResizeHandling(handle, windowElement, direction, config);
        });
    }

    /**
     * Get CSS styles for resize handles
     */
    getResizeHandleStyles(direction) {
        const styles = {
            n: 'top: -2px; left: 2px; right: 2px; height: 4px; cursor: n-resize;',
            ne: 'top: -2px; right: -2px; width: 4px; height: 4px; cursor: ne-resize;',
            e: 'top: 2px; bottom: 2px; right: -2px; width: 4px; cursor: e-resize;',
            se: 'bottom: -2px; right: -2px; width: 4px; height: 4px; cursor: se-resize;',
            s: 'bottom: -2px; left: 2px; right: 2px; height: 4px; cursor: s-resize;',
            sw: 'bottom: -2px; left: -2px; width: 4px; height: 4px; cursor: sw-resize;',
            w: 'top: 2px; bottom: 2px; left: -2px; width: 4px; cursor: w-resize;',
            nw: 'top: -2px; left: -2px; width: 4px; height: 4px; cursor: nw-resize;'
        };

        return styles[direction] || '';
    }

    /**
     * Add resize handling to a resize handle
     */
    addResizeHandling(handle, windowElement, direction, config) {
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const startMouseX = e.clientX;
            const startMouseY = e.clientY;
            const startRect = windowElement.getBoundingClientRect();

            const handleResize = (e) => {
                const deltaX = e.clientX - startMouseX;
                const deltaY = e.clientY - startMouseY;

                const newRect = this.calculateNewWindowSize(
                    startRect, deltaX, deltaY, direction, config
                );

                // Apply new size and position
                windowElement.style.left = newRect.x + 'px';
                windowElement.style.top = newRect.y + 'px';
                windowElement.style.width = newRect.width + 'px';
                windowElement.style.height = newRect.height + 'px';
            };

            const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleResize);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', handleMouseUp);
        });
    }

    /**
     * Calculate new window size during resize
     */
    calculateNewWindowSize(startRect, deltaX, deltaY, direction, config) {
        let newWidth = startRect.width;
        let newHeight = startRect.height;
        let newX = startRect.left;
        let newY = startRect.top;

        // Apply deltas based on resize direction
        if (direction.includes('e')) newWidth += deltaX;
        if (direction.includes('w')) {
            newWidth -= deltaX;
            newX += deltaX;
        }
        if (direction.includes('s')) newHeight += deltaY;
        if (direction.includes('n')) {
            newHeight -= deltaY;
            newY += deltaY;
        }

        // Enforce minimum size
        if (newWidth < config.minWidth) {
            if (direction.includes('w')) {
                newX = startRect.right - config.minWidth;
            }
            newWidth = config.minWidth;
        }

        if (newHeight < config.minHeight) {
            if (direction.includes('n')) {
                newY = startRect.bottom - config.minHeight;
            }
            newHeight = config.minHeight;
        }

        // Keep within viewport
        newX = Math.max(0, Math.min(newX, window.innerWidth - newWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - newHeight));

        return { x: newX, y: newY, width: newWidth, height: newHeight };
    }

    /**
     * Initialize window content after creation
     */
    initializeWindowContent(appId, config) {
        // Delay initialization to allow DOM to settle
        setTimeout(() => {
            switch (config.content) {
                case 'terminal':
                    if (window.pixelPusher?.modules?.terminal) {
                        window.pixelPusher.modules.terminal.initializeWindow(appId);
                    }
                    break;
                case 'explorer':
                    if (window.pixelPusher?.modules?.explorer) {
                        window.pixelPusher.modules.explorer.initializeWindow(appId);
                    }
                    break;
                case 'settings':
                    if (window.pixelPusher?.modules?.settings) {
                        window.pixelPusher.modules.settings.initializeWindow(appId);
                    }
                    break;
                case 'game':
                    if (window.pixelPusher?.modules?.games) {
                        window.pixelPusher.modules.games.initializeGame(appId, config.gameType);
                    }
                    break;
            }
        }, 100);
    }

    /**
     * Focus a window (bring to front)
     */
    focus(appId) {
        const windowElement = this.windows.get(appId);
        if (!windowElement) return;

        // Update z-index
        windowElement.style.zIndex = ++this.zIndexCounter;

        // Update active window
        this.activeWindow = appId;

        // Update visual state
        document.querySelectorAll('.window').forEach(win => {
            win.classList.remove('active');
        });
        windowElement.classList.add('active');

        // Update state management
        if (window.pixelPusher?.modules?.state) {
            window.pixelPusher.modules.state.setActiveWindow(appId);
        }

        // Update taskbar
        this.updateTaskbar();
    }

    /**
     * Close a window
     */
    close(appId) {
        const windowElement = this.windows.get(appId);
        if (!windowElement) return;

        // Remove from DOM
        windowElement.remove();

        // Remove from storage
        this.windows.delete(appId);

        // Update active window
        if (this.activeWindow === appId) {
            this.activeWindow = null;

            // Focus next available window
            const remainingWindows = Array.from(this.windows.keys());
            if (remainingWindows.length > 0) {
                this.focus(remainingWindows[remainingWindows.length - 1]);
            }
        }

        // Update state management
        if (window.pixelPusher?.modules?.state) {
            window.pixelPusher.modules.state.removeWindow(appId);
        }

        // Update taskbar
        this.updateTaskbar();

        console.log(`🪟 Closed window: ${appId}`);
    }

    /**
     * Minimize a window
     */
    minimize(appId) {
        const windowElement = this.windows.get(appId);
        if (!windowElement) return;

        // Hide window with animation
        windowElement.style.transform = 'scale(0)';
        windowElement.style.opacity = '0';

        setTimeout(() => {
            windowElement.style.display = 'none';
        }, 200);

        // Update taskbar
        this.updateTaskbar();

        console.log(`🪟 Minimized window: ${appId}`);
    }

    /**
     * Restore a minimized window
     */
    restore(appId) {
        const windowElement = this.windows.get(appId);
        if (!windowElement) return;

        // Show and animate window
        windowElement.style.display = 'flex';

        setTimeout(() => {
            windowElement.style.transform = 'scale(1)';
            windowElement.style.opacity = '1';
        }, 10);

        // Focus the window
        this.focus(appId);

        console.log(`🪟 Restored window: ${appId}`);
    }

    /**
     * Maximize a window
     */
    maximize(appId) {
        const windowElement = this.windows.get(appId);
        if (!windowElement) return;

        if (windowElement.dataset.maximized === 'true') {
            // Restore from maximized
            this.restoreFromMaximized(windowElement);
        } else {
            // Maximize window
            this.maximizeWindow(windowElement);
        }
    }

    /**
     * Maximize a window to full screen
     */
    maximizeWindow(windowElement) {
        // Store original dimensions
        windowElement.dataset.originalLeft = windowElement.style.left;
        windowElement.dataset.originalTop = windowElement.style.top;
        windowElement.dataset.originalWidth = windowElement.style.width;
        windowElement.dataset.originalHeight = windowElement.style.height;
        windowElement.dataset.maximized = 'true';

        // Set to full screen
        windowElement.style.left = '0px';
        windowElement.style.top = '0px';
        windowElement.style.width = '100vw';
        windowElement.style.height = '100vh';
        windowElement.style.borderRadius = '0';

        // Update maximize button
        const maximizeBtn = windowElement.querySelector('.maximize-btn');
        if (maximizeBtn) {
            maximizeBtn.innerHTML = '⧉';
            maximizeBtn.title = 'Restore';
        }
    }

    /**
     * Restore window from maximized state
     */
    restoreFromMaximized(windowElement) {
        // Restore original dimensions
        windowElement.style.left = windowElement.dataset.originalLeft;
        windowElement.style.top = windowElement.dataset.originalTop;
        windowElement.style.width = windowElement.dataset.originalWidth;
        windowElement.style.height = windowElement.dataset.originalHeight;
        windowElement.style.borderRadius = '8px';
        windowElement.dataset.maximized = 'false';

        // Update maximize button
        const maximizeBtn = windowElement.querySelector('.maximize-btn');
        if (maximizeBtn) {
            maximizeBtn.innerHTML = '□';
            maximizeBtn.title = 'Maximize';
        }
    }

    /**
     * Set up taskbar for window management
     */
    setupTaskbar() {
        let taskbar = document.getElementById('taskbar');

        if (!taskbar) {
            taskbar = document.createElement('div');
            taskbar.id = 'taskbar';
            taskbar.style.cssText = `
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 40px;
                background: var(--surface-dark);
                border-top: 1px solid var(--border);
                display: flex;
                align-items: center;
                padding: 0 8px;
                z-index: 9999;
                gap: 4px;
            `;
            document.body.appendChild(taskbar);
        }

        this.taskbar = taskbar;
    }

    /**
     * Update taskbar with current windows
     */
    updateTaskbar() {
        if (!this.taskbar) return;

        // Clear taskbar
        this.taskbar.innerHTML = '';

        // Add window buttons
        this.windows.forEach((windowElement, appId) => {
            const config = this.windowConfigs[appId];
            const isMinimized = windowElement.style.display === 'none';
            const isActive = this.activeWindow === appId && !isMinimized;

            const taskButton = document.createElement('button');
            taskButton.className = `taskbar-button ${isActive ? 'active' : ''} ${isMinimized ? 'minimized' : ''}`;
            taskButton.onclick = () => {
                if (isMinimized) {
                    this.restore(appId);
                } else if (isActive) {
                    this.minimize(appId);
                } else {
                    this.focus(appId);
                }
            };

            taskButton.style.cssText = `
                padding: 4px 12px;
                border: none;
                border-radius: 4px;
                background: ${isActive ? 'var(--primary)' : 'var(--surface)'};
                color: ${isActive ? 'white' : 'var(--text-primary)'};
                cursor: pointer;
                font-size: 12px;
                max-width: 150px;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                transition: all 0.2s ease;
                opacity: ${isMinimized ? '0.6' : '1'};
            `;

            taskButton.textContent = config?.title || appId;
            taskButton.onmouseenter = () => {
                if (!isActive) {
                    taskButton.style.background = 'var(--surface-light)';
                }
            };
            taskButton.onmouseleave = () => {
                if (!isActive) {
                    taskButton.style.background = 'var(--surface)';
                }
            };

            this.taskbar.appendChild(taskButton);
        });

        // Add system tray
        const systemTray = document.createElement('div');
        systemTray.style.cssText = `
            margin-left: auto;
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-secondary);
            font-size: 12px;
        `;

        // Add clock
        const clock = document.createElement('div');
        clock.id = 'systemTime';
        clock.textContent = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        systemTray.appendChild(clock);
        this.taskbar.appendChild(systemTray);
    }

    /**
     * Set up window container
     */
    setupWindowContainer() {
        let container = document.getElementById('windowContainer');

        if (!container) {
            container = document.createElement('div');
            container.id = 'windowContainer';
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 100;
            `;

            // Allow pointer events on child windows
            container.addEventListener('mousedown', (e) => {
                e.target.style.pointerEvents = 'auto';
            });

            document.body.appendChild(container);
        }
    }

    /**
     * Set up global event handlers
     */
    setupGlobalEventHandlers() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleGlobalResize();
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    /**
     * Handle global window resize
     */
    handleGlobalResize() {
        // Ensure all windows stay within viewport
        this.windows.forEach((windowElement, appId) => {
            const rect = windowElement.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Adjust position if window is off-screen
            let newLeft = parseInt(windowElement.style.left);
            let newTop = parseInt(windowElement.style.top);

            if (rect.right > viewportWidth) {
                newLeft = viewportWidth - rect.width;
            }
            if (rect.bottom > viewportHeight) {
                newTop = viewportHeight - rect.height;
            }

            newLeft = Math.max(0, newLeft);
            newTop = Math.max(0, newTop);

            windowElement.style.left = newLeft + 'px';
            windowElement.style.top = newTop + 'px';
        });
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Alt+Tab - Cycle through windows
        if (e.altKey && e.key === 'Tab') {
            e.preventDefault();
            this.cycleWindows();
        }

        // Alt+F4 - Close active window
        if (e.altKey && e.key === 'F4') {
            e.preventDefault();
            if (this.activeWindow) {
                this.close(this.activeWindow);
            }
        }
    }

    /**
     * Cycle through open windows
     */
    cycleWindows() {
        const windowIds = Array.from(this.windows.keys());
        if (windowIds.length === 0) return;

        const currentIndex = windowIds.indexOf(this.activeWindow);
        const nextIndex = (currentIndex + 1) % windowIds.length;
        const nextWindowId = windowIds[nextIndex];

        // Restore if minimized, then focus
        const windowElement = this.windows.get(nextWindowId);
        if (windowElement.style.display === 'none') {
            this.restore(nextWindowId);
        } else {
            this.focus(nextWindowId);
        }
    }

    /**
     * Load browser page (for browser windows)
     */
    loadBrowserPage(appId) {
        const addressInput = document.getElementById(`browser-address-${appId}`);
        const browserFrame = document.getElementById(`browser-frame-${appId}`);

        if (addressInput && browserFrame) {
            let url = addressInput.value.trim();

            // Add protocol if missing
            if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }

            if (url) {
                browserFrame.src = url;
            }
        }
    }

    /**
     * Get window manager statistics
     */
    getStats() {
        return {
            openWindows: this.windows.size,
            activeWindow: this.activeWindow,
            zIndexCounter: this.zIndexCounter,
            windowList: Array.from(this.windows.keys())
        };
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.handleGlobalResize();
    }

    /**
     * Clean up window manager
     */
    destroy() {
        // Close all windows
        Array.from(this.windows.keys()).forEach(appId => {
            this.close(appId);
        });

        // Remove taskbar
        if (this.taskbar) {
            this.taskbar.remove();
        }

        console.log('🪟 Window Manager destroyed');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WindowManager;
}

console.log('🪟 Window manager loaded successfully');