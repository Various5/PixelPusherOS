/**
 * Pixel Pusher OS - Window Manager (FIXED)
 * Handles application windows, positioning, and window management system
 */

class WindowManager {
    constructor() {
        this.windows = new Map();
        this.zIndexCounter = 1000;
        this.activeWindow = null;
        this.windowConfigs = this.getWindowConfigurations();
        this.taskbar = null;
        this.isDragging = false;
        this.dragData = null;

        console.log('🪟 Window Manager initialized');
    }

    async init() {
        try {
            this.setupTaskbar();
            this.setupGlobalEventHandlers();
            this.setupWindowContainer();
            console.log('✅ Window management system ready');
        } catch (error) {
            console.error('❌ Window Manager initialization failed:', error);
        }
    }

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

    open(appId, options = {}) {
        if (this.windows.has(appId)) {
            this.focus(appId);
            return this.windows.get(appId);
        }

        const config = this.windowConfigs[appId];
        if (!config) {
            console.error(`Unknown application: ${appId}`);
            return null;
        }

        const window = this.createWindow(appId, config, options);
        this.windows.set(appId, window);

        if (window.pixelPusher?.modules?.state) {
            window.pixelPusher.modules.state.addWindow(appId);
        }

        this.updateTaskbar();
        this.focus(appId);

        console.log(`🪟 Opened window: ${appId}`);
        return window;
    }

    createWindow(appId, config, options = {}) {
        const windowContainer = document.getElementById('windowContainer') || document.body;
        const position = this.calculateWindowPosition(config, options);

        const windowElement = document.createElement('div');
        windowElement.className = 'window';
        windowElement.id = `window-${appId}`;
        windowElement.dataset.appId = appId;

        // Ensure proper styling for dragging
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
            transition: none;
            pointer-events: auto;
        `;

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
                pointer-events: auto;
            ">
                <div class="window-title" style="
                    font-weight: 600;
                    font-size: 14px;
                    color: var(--text-primary);
                    flex: 1;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    pointer-events: none;
                ">
                    ${config.title}
                </div>
                <div class="window-controls" style="
                    display: flex;
                    gap: 4px;
                    pointer-events: auto;
                ">
                    <button class="window-btn minimize-btn" data-action="minimize" 
                            title="Minimize" style="
                        width: 24px; height: 24px; border: none; border-radius: 4px;
                        background: var(--warning); color: white; cursor: pointer;
                        display: flex; align-items: center; justify-content: center;
                        font-size: 12px; transition: opacity 0.2s;
                        pointer-events: auto;
                    ">−</button>
                    <button class="window-btn maximize-btn" data-action="maximize" 
                            title="Maximize" style="
                        width: 24px; height: 24px; border: none; border-radius: 4px;
                        background: var(--success); color: white; cursor: pointer;
                        display: flex; align-items: center; justify-content: center;
                        font-size: 12px; transition: opacity 0.2s;
                        pointer-events: auto;
                    ">□</button>
                    <button class="window-btn close-btn" data-action="close" 
                            title="Close" style="
                        width: 24px; height: 24px; border: none; border-radius: 4px;
                        background: var(--error); color: white; cursor: pointer;
                        display: flex; align-items: center; justify-content: center;
                        font-size: 12px; transition: opacity 0.2s;
                        pointer-events: auto;
                    ">✕</button>
                </div>
            </div>
            <div class="window-content" style="
                flex: 1;
                overflow: auto;
                position: relative;
                background: var(--background);
                pointer-events: auto;
            ">
                ${this.generateWindowContent(appId, config)}
            </div>
        `;

        windowContainer.appendChild(windowElement);
        this.setupWindowEventHandlers(windowElement, appId, config);
        this.initializeWindowContent(appId, config);

        return windowElement;
    }

    setupWindowEventHandlers(windowElement, appId, config) {
        const header = windowElement.querySelector('.window-header');

        // Window controls
        windowElement.addEventListener('click', (e) => {
            if (e.target.classList.contains('window-btn')) {
                const action = e.target.dataset.action;
                switch (action) {
                    case 'minimize':
                        this.minimize(appId);
                        break;
                    case 'maximize':
                        this.maximize(appId);
                        break;
                    case 'close':
                        this.close(appId);
                        break;
                }
                e.stopPropagation();
                return;
            }
        });

        // Focus on click
        windowElement.addEventListener('mousedown', (e) => {
            this.focus(appId);
        });

        // Double-click header to maximize
        header.addEventListener('dblclick', (e) => {
            if (!e.target.classList.contains('window-btn')) {
                this.maximize(appId);
            }
        });

        // Dragging functionality
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };

        header.addEventListener('mousedown', (e) => {
            // Don't drag if clicking on window controls
            if (e.target.classList.contains('window-btn') ||
                e.target.closest('.window-controls')) {
                return;
            }

            isDragging = true;
            this.isDragging = true;

            const rect = windowElement.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;

            this.dragData = {
                element: windowElement,
                appId: appId,
                offset: dragOffset
            };

            windowElement.style.transition = 'none';
            windowElement.style.cursor = 'grabbing';
            header.style.cursor = 'grabbing';

            // Prevent text selection during drag
            document.body.style.userSelect = 'none';

            e.preventDefault();
            e.stopPropagation();
        });

        // Global mouse events for dragging
        const handleMouseMove = (e) => {
            if (!isDragging || !this.dragData) return;

            const x = e.clientX - this.dragData.offset.x;
            const y = e.clientY - this.dragData.offset.y;

            // Keep window within viewport bounds
            const maxX = window.innerWidth - windowElement.offsetWidth;
            const maxY = window.innerHeight - windowElement.offsetHeight;

            const constrainedX = Math.max(0, Math.min(x, maxX));
            const constrainedY = Math.max(0, Math.min(y, maxY));

            windowElement.style.left = constrainedX + 'px';
            windowElement.style.top = constrainedY + 'px';
        };

        const handleMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                this.isDragging = false;
                this.dragData = null;

                windowElement.style.transition = 'all 0.2s ease';
                windowElement.style.cursor = '';
                header.style.cursor = 'move';
                document.body.style.userSelect = '';
            }
        };

        // Store references for cleanup
        windowElement._mouseMoveHandler = handleMouseMove;
        windowElement._mouseUpHandler = handleMouseUp;

        // Window resizing (if resizable)
        if (config.resizable) {
            this.makeWindowResizable(windowElement, config);
        }
    }

    setupGlobalEventHandlers() {
        // Global mouse events for window dragging
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging && this.dragData) {
                const x = e.clientX - this.dragData.offset.x;
                const y = e.clientY - this.dragData.offset.y;

                const maxX = window.innerWidth - this.dragData.element.offsetWidth;
                const maxY = window.innerHeight - this.dragData.element.offsetHeight;

                const constrainedX = Math.max(0, Math.min(x, maxX));
                const constrainedY = Math.max(0, Math.min(y, maxY));

                this.dragData.element.style.left = constrainedX + 'px';
                this.dragData.element.style.top = constrainedY + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                if (this.dragData) {
                    this.dragData.element.style.transition = 'all 0.2s ease';
                    this.dragData.element.style.cursor = '';
                    const header = this.dragData.element.querySelector('.window-header');
                    if (header) header.style.cursor = 'move';
                    document.body.style.userSelect = '';
                    this.dragData = null;
                }
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleGlobalResize();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    generateWindowContent(appId, config) {
        switch (config.content) {
            case 'terminal':
                return `
                    <div id="terminal-${appId}" class="terminal-container" style="display: flex; flex-direction: column; height: 100%; font-family: 'Courier New', monospace; background: #1a1a1a; color: #00ff00; padding: 16px;">
                        <div class="terminal-output" id="terminal-output-${appId}" style="flex: 1; overflow-y: auto; margin-bottom: 8px; white-space: pre-wrap; line-height: 1.4; font-size: 14px;"></div>
                        <div class="terminal-input-line" style="display: flex; align-items: center; gap: 8px; padding: 4px 0; border-top: 1px solid #333;">
                            <span class="terminal-prompt" style="color: #00d9ff; font-weight: bold;">pixel@pusher:~$ </span>
                            <input type="text" class="terminal-input" id="terminal-input-${appId}" 
                                   placeholder="Type 'help' for commands..." autocomplete="off"
                                   style="flex: 1; background: transparent; border: none; outline: none; color: #00ff00; font-family: inherit; font-size: 14px;">
                        </div>
                    </div>
                `;

            case 'explorer':
                return `
                    <div id="explorer-${appId}" class="explorer-container" style="display: flex; flex-direction: column; height: 100%;">
                        <div class="explorer-toolbar" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--surface-light); border-bottom: 1px solid var(--border);">
                            <button onclick="window.pixelPusher.modules.explorer.navigateBack()" style="padding: 6px 12px; border: 1px solid var(--border); border-radius: 4px; background: var(--surface); color: var(--text-primary); cursor: pointer;">← Back</button>
                            <button onclick="window.pixelPusher.modules.explorer.navigateUp()" style="padding: 6px 12px; border: 1px solid var(--border); border-radius: 4px; background: var(--surface); color: var(--text-primary); cursor: pointer;">↑ Up</button>
                            <input type="text" class="explorer-path" id="explorer-path-${appId}" 
                                   value="/" readonly style="flex: 1; padding: 6px 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--surface); color: var(--text-primary); font-family: monospace;">
                            <button onclick="window.pixelPusher.modules.explorer.refresh()" style="padding: 6px 12px; border: 1px solid var(--border); border-radius: 4px; background: var(--surface); color: var(--text-primary); cursor: pointer;">🔄 Refresh</button>
                        </div>
                        <div class="explorer-content" id="explorer-content-${appId}" style="flex: 1; overflow: auto; padding: 12px;">
                            Loading...
                        </div>
                    </div>
                `;

            case 'settings':
                return `
                    <div id="settings-${appId}" class="settings-container" style="display: flex; height: 100%;">
                        <div class="settings-sidebar" style="width: 200px; background: var(--surface-dark); border-right: 1px solid var(--border); padding: 16px 0;">
                            <div class="settings-nav-item active" data-section="appearance" style="padding: 12px 20px; cursor: pointer; color: var(--text-secondary); font-size: 14px; font-weight: 500;">🎨 Appearance</div>
                            <div class="settings-nav-item" data-section="system" style="padding: 12px 20px; cursor: pointer; color: var(--text-secondary); font-size: 14px; font-weight: 500;">⚙️ System</div>
                            <div class="settings-nav-item" data-section="games" style="padding: 12px 20px; cursor: pointer; color: var(--text-secondary); font-size: 14px; font-weight: 500;">🎮 Games</div>
                            <div class="settings-nav-item" data-section="about" style="padding: 12px 20px; cursor: pointer; color: var(--text-secondary); font-size: 14px; font-weight: 500;">ℹ️ About</div>
                        </div>
                        <div class="settings-content" id="settings-content-${appId}" style="flex: 1; padding: 24px; overflow-y: auto;">
                            Loading settings...
                        </div>
                    </div>
                `;

            case 'game':
                return `
                    <div id="game-${appId}" class="game-container" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #000;">
                        <div class="game-content" id="game-content-${appId}" style="width: 100%; height: 100%;">
                            Loading ${config.gameType} game...
                        </div>
                    </div>
                `;

            case 'browser':
                return `
                    <div id="browser-${appId}" class="browser-container" style="display: flex; flex-direction: column; height: 100%;">
                        <div class="browser-toolbar" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--surface-light); border-bottom: 1px solid var(--border);">
                            <input type="url" class="browser-address" id="browser-address-${appId}" 
                                   placeholder="Enter URL or search..." value="https://duckduckgo.com" 
                                   style="flex: 1; padding: 6px 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--surface); color: var(--text-primary);">
                            <button onclick="window.pixelPusher.modules.windows.loadBrowserPage('${appId}')" style="padding: 6px 12px; border: 1px solid var(--border); border-radius: 4px; background: var(--primary); color: white; cursor: pointer;">Go</button>
                        </div>
                        <iframe class="browser-frame" id="browser-frame-${appId}" 
                                src="https://duckduckgo.com" 
                                style="width: 100%; height: calc(100% - 40px); border: none;">
                        </iframe>
                    </div>
                `;

            case 'musicplayer':
                return `
                    <div id="musicplayer-${appId}" class="musicplayer-container" style="padding: 20px; text-align: center;">
                        <div class="music-controls" style="margin-bottom: 20px;">
                            <button class="music-btn" onclick="window.pixelPusher.modules.settings.musicPrevious()" style="padding: 10px; margin: 0 5px; border: none; border-radius: 50%; background: var(--primary); color: white; cursor: pointer;">⏮️</button>
                            <button class="music-btn play-pause" onclick="window.pixelPusher.modules.settings.musicToggle()" style="padding: 10px; margin: 0 5px; border: none; border-radius: 50%; background: var(--primary); color: white; cursor: pointer;">▶️</button>
                            <button class="music-btn" onclick="window.pixelPusher.modules.settings.musicNext()" style="padding: 10px; margin: 0 5px; border: none; border-radius: 50%; background: var(--primary); color: white; cursor: pointer;">⏭️</button>
                        </div>
                        <div class="music-info">
                            <div class="music-title" style="font-weight: bold; margin-bottom: 10px;">No music playing</div>
                            <div class="music-progress" style="margin-bottom: 15px;">
                                <div class="progress-bar" style="width: 100%; height: 4px; background: var(--border); border-radius: 2px;"></div>
                            </div>
                        </div>
                        <div class="music-volume">
                            <input type="range" class="volume-slider" min="0" max="100" value="50" style="width: 100%;">
                        </div>
                    </div>
                `;

            default:
                return `
                    <div class="default-window-content" style="padding: 20px; text-align: center;">
                        <h2>Application: ${appId}</h2>
                        <p>Window content goes here.</p>
                    </div>
                `;
        }
    }

    calculateWindowPosition(config, options) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let x = Math.max(0, (viewportWidth - config.width) / 2);
        let y = Math.max(0, (viewportHeight - config.height) / 2);

        const windowCount = this.windows.size;
        if (windowCount > 0) {
            const offset = windowCount * 30;
            x += offset;
            y += offset;

            if (x + config.width > viewportWidth) {
                x = 50;
            }
            if (y + config.height > viewportHeight) {
                y = 50;
            }
        }

        if (options.x !== undefined) x = options.x;
        if (options.y !== undefined) y = options.y;

        return { x, y };
    }

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
            this.addResizeHandling(handle, windowElement, direction, config);
        });
    }

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

    calculateNewWindowSize(startRect, deltaX, deltaY, direction, config) {
        let newWidth = startRect.width;
        let newHeight = startRect.height;
        let newX = startRect.left;
        let newY = startRect.top;

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

        newX = Math.max(0, Math.min(newX, window.innerWidth - newWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - newHeight));

        return { x: newX, y: newY, width: newWidth, height: newHeight };
    }

    initializeWindowContent(appId, config) {
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

    focus(appId) {
        const windowElement = this.windows.get(appId);
        if (!windowElement) return;

        windowElement.style.zIndex = ++this.zIndexCounter;
        this.activeWindow = appId;

        document.querySelectorAll('.window').forEach(win => {
            win.classList.remove('active');
        });
        windowElement.classList.add('active');

        if (window.pixelPusher?.modules?.state) {
            window.pixelPusher.modules.state.setActiveWindow(appId);
        }

        this.updateTaskbar();
    }

    close(appId) {
        const windowElement = this.windows.get(appId);
        if (!windowElement) return;

        // Clean up event listeners
        if (windowElement._mouseMoveHandler) {
            document.removeEventListener('mousemove', windowElement._mouseMoveHandler);
        }
        if (windowElement._mouseUpHandler) {
            document.removeEventListener('mouseup', windowElement._mouseUpHandler);
        }

        windowElement.remove();
        this.windows.delete(appId);

        if (this.activeWindow === appId) {
            this.activeWindow = null;
            const remainingWindows = Array.from(this.windows.keys());
            if (remainingWindows.length > 0) {
                this.focus(remainingWindows[remainingWindows.length - 1]);
            }
        }

        if (window.pixelPusher?.modules?.state) {
            window.pixelPusher.modules.state.removeWindow(appId);
        }

        this.updateTaskbar();
        console.log(`🪟 Closed window: ${appId}`);
    }

    minimize(appId) {
        const windowElement = this.windows.get(appId);
        if (!windowElement) return;

        windowElement.style.transform = 'scale(0)';
        windowElement.style.opacity = '0';

        setTimeout(() => {
            windowElement.style.display = 'none';
        }, 200);

        this.updateTaskbar();
        console.log(`🪟 Minimized window: ${appId}`);
    }

    restore(appId) {
        const windowElement = this.windows.get(appId);
        if (!windowElement) return;

        windowElement.style.display = 'flex';

        setTimeout(() => {
            windowElement.style.transform = 'scale(1)';
            windowElement.style.opacity = '1';
        }, 10);

        this.focus(appId);
        console.log(`🪟 Restored window: ${appId}`);
    }

    maximize(appId) {
        const windowElement = this.windows.get(appId);
        if (!windowElement) return;

        if (windowElement.dataset.maximized === 'true') {
            this.restoreFromMaximized(windowElement);
        } else {
            this.maximizeWindow(windowElement);
        }
    }

    maximizeWindow(windowElement) {
        windowElement.dataset.originalLeft = windowElement.style.left;
        windowElement.dataset.originalTop = windowElement.style.top;
        windowElement.dataset.originalWidth = windowElement.style.width;
        windowElement.dataset.originalHeight = windowElement.style.height;
        windowElement.dataset.maximized = 'true';

        windowElement.style.left = '0px';
        windowElement.style.top = '0px';
        windowElement.style.width = '100vw';
        windowElement.style.height = '100vh';
        windowElement.style.borderRadius = '0';

        const maximizeBtn = windowElement.querySelector('.maximize-btn');
        if (maximizeBtn) {
            maximizeBtn.innerHTML = '⧉';
            maximizeBtn.title = 'Restore';
        }
    }

    restoreFromMaximized(windowElement) {
        windowElement.style.left = windowElement.dataset.originalLeft;
        windowElement.style.top = windowElement.dataset.originalTop;
        windowElement.style.width = windowElement.dataset.originalWidth;
        windowElement.style.height = windowElement.dataset.originalHeight;
        windowElement.style.borderRadius = '8px';
        windowElement.dataset.maximized = 'false';

        const maximizeBtn = windowElement.querySelector('.maximize-btn');
        if (maximizeBtn) {
            maximizeBtn.innerHTML = '□';
            maximizeBtn.title = 'Maximize';
        }
    }

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

    updateTaskbar() {
        if (!this.taskbar) return;

        this.taskbar.innerHTML = '';

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

        const clock = document.createElement('div');
        clock.id = 'systemTime';
        clock.textContent = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        systemTray.appendChild(clock);
        this.taskbar.appendChild(systemTray);
    }

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

            document.body.appendChild(container);
        }
    }

    handleGlobalResize() {
        this.windows.forEach((windowElement, appId) => {
            const rect = windowElement.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

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

    handleKeyboardShortcuts(e) {
        if (e.altKey && e.key === 'Tab') {
            e.preventDefault();
            this.cycleWindows();
        }

        if (e.altKey && e.key === 'F4') {
            e.preventDefault();
            if (this.activeWindow) {
                this.close(this.activeWindow);
            }
        }
    }

    cycleWindows() {
        const windowIds = Array.from(this.windows.keys());
        if (windowIds.length === 0) return;

        const currentIndex = windowIds.indexOf(this.activeWindow);
        const nextIndex = (currentIndex + 1) % windowIds.length;
        const nextWindowId = windowIds[nextIndex];

        const windowElement = this.windows.get(nextWindowId);
        if (windowElement.style.display === 'none') {
            this.restore(nextWindowId);
        } else {
            this.focus(nextWindowId);
        }
    }

    loadBrowserPage(appId) {
        const addressInput = document.getElementById(`browser-address-${appId}`);
        const browserFrame = document.getElementById(`browser-frame-${appId}`);

        if (addressInput && browserFrame) {
            let url = addressInput.value.trim();

            if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }

            if (url) {
                browserFrame.src = url;
            }
        }
    }

    getStats() {
        return {
            openWindows: this.windows.size,
            activeWindow: this.activeWindow,
            zIndexCounter: this.zIndexCounter,
            windowList: Array.from(this.windows.keys()),
            isDragging: this.isDragging
        };
    }

    handleResize() {
        this.handleGlobalResize();
    }

    destroy() {
        Array.from(this.windows.keys()).forEach(appId => {
            this.close(appId);
        });

        if (this.taskbar) {
            this.taskbar.remove();
        }

        console.log('🪟 Window Manager destroyed');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WindowManager;
}

console.log('🪟 Fixed Window manager loaded successfully');