/**
 * Enhanced Window Manager with Improved Resizing and Slim Design
 * Now supports corner resizing and features a modern, minimal design
 */

class WindowManager {
    constructor() {
        this.windows = new Map();
        this.zIndexCounter = 1000;
        this.activeWindow = null;
        this.windowConfigs = this.getWindowConfigurations();
        this.taskbar = null;
        this.draggedWindow = null;
        this.resizedWindow = null;

        console.log('🪟 Enhanced Window Manager initialized');
    }

    async init() {
        try {
            this.setupTaskbar();
            this.setupGlobalEventHandlers();
            this.setupWindowContainer();
            this.applyModernStyling();

            console.log('✅ Enhanced window management system ready');
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
            settings: {
                title: '⚙️ System Settings',
                width: 800,
                height: 600,
                minWidth: 600,
                minHeight: 500,
                resizable: true,
                content: 'settings'
            },
            taskmanager: {
                title: '📊 Task Manager',
                width: 700,
                height: 500,
                minWidth: 500,
                minHeight: 400,
                resizable: true,
                content: 'taskmanager'
            },
            musicplayer: {
                title: '🎵 Music Player',
                width: 380,
                height: 520,
                minWidth: 350,
                minHeight: 450,
                resizable: true,
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
            village: {
                title: '🏘️ Village Builder',
                width: 900,
                height: 650,
                minWidth: 700,
                minHeight: 500,
                resizable: true,
                content: 'game',
                gameType: 'village'
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

        // Slim, modern window styling
        windowElement.style.cssText = `
            position: fixed;
            left: ${position.x}px;
            top: ${position.y}px;
            width: ${config.width}px;
            height: ${config.height}px;
            min-width: ${config.minWidth}px;
            min-height: ${config.minHeight}px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: ${++this.zIndexCounter};
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            transform-origin: center;
        `;

        windowElement.innerHTML = this.generateWindowHTML(appId, config);
        windowContainer.appendChild(windowElement);

        this.setupWindowEventHandlers(windowElement, appId, config);

        // Initialize window content after DOM insertion
        setTimeout(() => {
            this.initializeWindowContent(appId, config);
        }, 100);

        return windowElement;
    }

    generateWindowHTML(appId, config) {
        return `
            <div class="window-header" style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(12px);
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                cursor: move;
                user-select: none;
                min-height: 36px;
            ">
                <div class="window-title" style="
                    font-weight: 600;
                    font-size: 13px;
                    color: #2d3748;
                    flex: 1;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    margin-right: 12px;
                ">
                    ${config.title}
                </div>
                <div class="window-controls" style="
                    display: flex;
                    gap: 4px;
                    align-items: center;
                ">
                    <button class="window-btn minimize-btn" onclick="window.pixelPusher.modules.windows.minimize('${appId}')" 
                            title="Minimize" style="
                        width: 20px; height: 20px; border: none; border-radius: 4px;
                        background: #fbbf24; color: #92400e; cursor: pointer; font-size: 10px; font-weight: 700;
                        display: flex; align-items: center; justify-content: center;
                        transition: all 0.1s ease; position: relative;
                    ">−</button>
                    <button class="window-btn maximize-btn" onclick="window.pixelPusher.modules.windows.maximize('${appId}')" 
                            title="Maximize" style="
                        width: 20px; height: 20px; border: none; border-radius: 4px;
                        background: #34d399; color: #065f46; cursor: pointer; font-size: 10px; font-weight: 700;
                        display: flex; align-items: center; justify-content: center;
                        transition: all 0.1s ease; position: relative;
                    ">□</button>
                    <button class="window-btn close-btn" onclick="window.pixelPusher.modules.windows.close('${appId}')" 
                            title="Close" style="
                        width: 20px; height: 20px; border: none; border-radius: 4px;
                        background: #f87171; color: #991b1b; cursor: pointer; font-size: 10px; font-weight: 700;
                        display: flex; align-items: center; justify-content: center;
                        transition: all 0.1s ease; position: relative;
                    ">✕</button>
                </div>
            </div>
            <div class="window-content" style="
                flex: 1;
                overflow: hidden;
                position: relative;
                background: rgba(0, 0, 0, 0.05);
                backdrop-filter: blur(8px);
            ">
                ${this.generateWindowContent(appId, config)}
            </div>
        `;
    }

    generateWindowContent(appId, config) {
        switch (config.content) {
            case 'terminal':
                return `
                    <div id="terminal-${appId}" class="terminal-container" style="
                        display: flex; flex-direction: column; height: 100%;
                        background: rgba(0, 0, 0, 0.9); color: #00ff41;
                        font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
                    ">
                        <div class="terminal-output" id="terminal-output-${appId}" style="
                            flex: 1; overflow-y: auto; padding: 12px;
                            white-space: pre-wrap; word-wrap: break-word;
                            line-height: 1.4; font-size: 13px;
                        "></div>
                        <div class="terminal-input-line" style="
                            display: flex; align-items: center; gap: 8px;
                            padding: 8px 12px; border-top: 1px solid rgba(255, 255, 255, 0.1);
                            background: rgba(0, 0, 0, 0.5);
                        ">
                            <span class="terminal-prompt" style="
                                color: #00d9ff; font-weight: bold; white-space: nowrap;
                            ">pixel@pusher:~$ </span>
                            <input type="text" class="terminal-input" id="terminal-input-${appId}" 
                                   placeholder="Type 'help' for commands..." autocomplete="off" style="
                                flex: 1; background: transparent; border: none; outline: none;
                                color: #00ff41; font-family: inherit; font-size: 13px;
                                caret-color: #00ff41;
                            ">
                        </div>
                    </div>
                `;

            case 'explorer':
                return `
                    <div id="explorer-${appId}" class="explorer-container" style="
                        display: flex; flex-direction: column; height: 100%;
                        background: rgba(0, 0, 0, 0.02);
                    ">
                        <div class="explorer-toolbar" style="
                            display: flex; align-items: center; gap: 6px;
                            padding: 8px 12px; background: rgba(255, 255, 255, 0.1);
                            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                            backdrop-filter: blur(8px);
                        ">
                            <button onclick="window.pixelPusher.modules.explorer?.navigateBack('${appId}')" style="
                                padding: 4px 8px; border: 1px solid rgba(0, 0, 0, 0.1);
                                border-radius: 4px; background: rgba(255, 255, 255, 0.2);
                                color: #2d3748; cursor: pointer; font-size: 11px;
                                transition: all 0.1s ease;
                            ">← Back</button>
                            <button onclick="window.pixelPusher.modules.explorer?.navigateUp('${appId}')" style="
                                padding: 4px 8px; border: 1px solid rgba(0, 0, 0, 0.1);
                                border-radius: 4px; background: rgba(255, 255, 255, 0.2);
                                color: #2d3748; cursor: pointer; font-size: 11px;
                                transition: all 0.1s ease;
                            ">↑ Up</button>
                            <input type="text" class="explorer-path" id="explorer-path-${appId}" 
                                   value="/" readonly style="
                                flex: 1; padding: 4px 8px; border: 1px solid rgba(0, 0, 0, 0.1);
                                border-radius: 4px; background: rgba(255, 255, 255, 0.3);
                                color: #2d3748; font-size: 11px; font-family: monospace;
                            ">
                            <button onclick="window.pixelPusher.modules.explorer?.refresh('${appId}')" style="
                                padding: 4px 8px; border: 1px solid rgba(0, 0, 0, 0.1);
                                border-radius: 4px; background: rgba(255, 255, 255, 0.2);
                                color: #2d3748; cursor: pointer; font-size: 11px;
                                transition: all 0.1s ease;
                            ">🔄</button>
                        </div>
                        <div class="explorer-content" id="explorer-content-${appId}" style="
                            flex: 1; overflow: auto; padding: 12px;
                            color: #2d3748; font-size: 13px;
                        ">
                            Loading file explorer...
                        </div>
                    </div>
                `;

            case 'settings':
                return `
                    <div id="settings-${appId}" class="settings-container" style="
                        display: flex; height: 100%; background: rgba(0, 0, 0, 0.02);
                    ">
                        <div class="settings-sidebar" style="
                            width: 180px; background: rgba(255, 255, 255, 0.1);
                            border-right: 1px solid rgba(0, 0, 0, 0.1);
                            padding: 12px 0; backdrop-filter: blur(8px);
                        ">
                            <div class="settings-nav-item active" data-section="appearance" style="
                                padding: 8px 16px; cursor: pointer; color: #2d3748;
                                font-size: 12px; font-weight: 500; transition: all 0.1s ease;
                                border-left: 3px solid #6366f1; background: rgba(99, 102, 241, 0.1);
                                display: flex; align-items: center; gap: 8px;
                            ">🎨 Appearance</div>
                            <div class="settings-nav-item" data-section="system" style="
                                padding: 8px 16px; cursor: pointer; color: #4a5568;
                                font-size: 12px; font-weight: 500; transition: all 0.1s ease;
                                border-left: 3px solid transparent;
                                display: flex; align-items: center; gap: 8px;
                            ">⚙️ System</div>
                            <div class="settings-nav-item" data-section="games" style="
                                padding: 8px 16px; cursor: pointer; color: #4a5568;
                                font-size: 12px; font-weight: 500; transition: all 0.1s ease;
                                border-left: 3px solid transparent;
                                display: flex; align-items: center; gap: 8px;
                            ">🎮 Games</div>
                            <div class="settings-nav-item" data-section="about" style="
                                padding: 8px 16px; cursor: pointer; color: #4a5568;
                                font-size: 12px; font-weight: 500; transition: all 0.1s ease;
                                border-left: 3px solid transparent;
                                display: flex; align-items: center; gap: 8px;
                            ">ℹ️ About</div>
                        </div>
                        <div class="settings-content" id="settings-content-${appId}" style="
                            flex: 1; padding: 16px; overflow-y: auto; color: #2d3748;
                        ">
                            Loading settings...
                        </div>
                    </div>
                `;

            case 'musicplayer':
                return `
                    <div id="musicplayer-${appId}" class="musicplayer-container" style="
                        display: flex; flex-direction: column; height: 100%;
                        background: rgba(0, 0, 0, 0.02); color: #2d3748; padding: 16px;
                    ">
                        <div class="music-header" style="text-align: center; margin-bottom: 16px;">
                            <h2 style="margin: 0; color: #2d3748; font-size: 16px; font-weight: 600;">🎵 Music Player</h2>
                        </div>
                        
                        <div class="album-art" style="
                            width: 160px; height: 160px; margin: 0 auto 16px;
                            background: rgba(0, 0, 0, 0.1); border-radius: 8px;
                            display: flex; align-items: center; justify-content: center;
                            font-size: 32px; backdrop-filter: blur(8px);
                        ">🎵</div>
                        
                        <div class="music-info" style="text-align: center; margin-bottom: 16px;">
                            <div class="music-title" id="music-title-${appId}" style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">
                                No music playing
                            </div>
                            <div class="music-artist" id="music-artist-${appId}" style="font-size: 12px; color: #718096;">
                                Click below to load music
                            </div>
                        </div>
                        
                        <div class="music-progress" style="margin-bottom: 16px;">
                            <div class="progress-bar" style="
                                height: 3px; background: rgba(0, 0, 0, 0.1);
                                border-radius: 2px; margin-bottom: 6px;
                            ">
                                <div class="progress-fill" id="progress-fill-${appId}" style="
                                    width: 0%; height: 100%; background: #6366f1;
                                    border-radius: 2px; transition: width 0.3s ease;
                                "></div>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 10px; color: #718096;">
                                <span id="time-current-${appId}">0:00</span>
                                <span id="time-total-${appId}">0:00</span>
                            </div>
                        </div>
                        
                        <div class="music-controls" style="
                            display: flex; justify-content: center; gap: 8px; margin-bottom: 16px;
                        ">
                            <button class="music-btn" onclick="window.pixelPusher.modules.windows.prevTrack('${appId}')" style="
                                width: 32px; height: 32px; border: none; border-radius: 6px;
                                background: rgba(0, 0, 0, 0.1); color: #2d3748;
                                cursor: pointer; font-size: 14px; transition: all 0.1s ease;
                            ">⏮️</button>
                            <button class="music-btn play-pause" id="play-pause-${appId}" onclick="window.pixelPusher.modules.windows.togglePlay('${appId}')" style="
                                width: 40px; height: 40px; border: none; border-radius: 6px;
                                background: #6366f1; color: white; cursor: pointer;
                                font-size: 16px; transition: all 0.1s ease;
                            ">▶️</button>
                            <button class="music-btn" onclick="window.pixelPusher.modules.windows.nextTrack('${appId}')" style="
                                width: 32px; height: 32px; border: none; border-radius: 6px;
                                background: rgba(0, 0, 0, 0.1); color: #2d3748;
                                cursor: pointer; font-size: 14px; transition: all 0.1s ease;
                            ">⏭️</button>
                        </div>
                        
                        <div class="music-volume" style="
                            display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
                        ">
                            <span style="font-size: 14px;">🔊</span>
                            <input type="range" class="volume-slider" id="volume-${appId}" min="0" max="100" value="50" style="
                                flex: 1; height: 3px; background: rgba(0, 0, 0, 0.1);
                                border-radius: 2px; outline: none; cursor: pointer;
                            ">
                        </div>
                        
                        <button onclick="window.pixelPusher.modules.windows.loadMusicLibrary('${appId}')" style="
                            padding: 8px 16px; background: rgba(0, 0, 0, 0.1);
                            border: 1px solid rgba(0, 0, 0, 0.1);
                            border-radius: 6px; color: #2d3748;
                            cursor: pointer; font-size: 12px;
                            transition: all 0.1s ease;
                        ">📁 Load Music Library</button>
                        
                        <div class="music-playlist" id="music-playlist-${appId}" style="
                            margin-top: 16px; max-height: 120px; overflow-y: auto;
                            background: rgba(0, 0, 0, 0.05);
                            border-radius: 6px; padding: 8px;
                            display: none;
                        ">
                            <!-- Playlist items will be added here -->
                        </div>
                        
                        <!-- Hidden audio element -->
                        <audio id="audio-player-${appId}" style="display: none;"></audio>
                    </div>
                `;

            case 'game':
                return `
                    <div id="game-content-${appId}" class="game-container" style="
                        width: 100%; height: 100%; position: relative;
                        background: rgba(0, 0, 0, 0.9);
                    ">
                        <canvas id="game-canvas-${appId}" style="
                            width: 100%; height: 100%; display: block;
                            border-radius: 0 0 12px 12px;
                        "></canvas>
                    </div>
                `;

            default:
                return `
                    <div class="default-window-content" style="
                        padding: 20px; text-align: center; color: #2d3748;
                    ">
                        <h2>Application: ${appId}</h2>
                        <p>Window content will be loaded here.</p>
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
            const offset = windowCount * 25;
            x += offset;
            y += offset;

            if (x + config.width > viewportWidth) x = 30;
            if (y + config.height > viewportHeight) y = 30;
        }

        if (options.x !== undefined) x = options.x;
        if (options.y !== undefined) y = options.y;

        return { x, y };
    }

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

            const handleMouseMove = (moveEvent) => {
                if (!isDragging) return;

                const x = moveEvent.clientX - dragOffset.x;
                const y = moveEvent.clientY - dragOffset.y;

                const maxX = window.innerWidth - windowElement.offsetWidth;
                const maxY = window.innerHeight - windowElement.offsetHeight;

                windowElement.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
                windowElement.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
            };

            const handleMouseUp = () => {
                isDragging = false;
                windowElement.style.transition = 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });

        // Window focus on click
        windowElement.addEventListener('mousedown', () => {
            this.focus(appId);
        });

        // Window resizing with improved corner support
        if (config.resizable) {
            this.makeWindowResizable(windowElement, config);
        }

        // Double-click header to maximize
        header.addEventListener('dblclick', () => {
            this.maximize(appId);
        });

        // Add button hover effects
        windowElement.querySelectorAll('.window-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.1)';
                btn.style.opacity = '0.9';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
                btn.style.opacity = '1';
            });
        });
    }

    makeWindowResizable(windowElement, config) {
        const resizeHandles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

        resizeHandles.forEach(direction => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-${direction}`;
            handle.style.cssText = `
                position: absolute;
                background: transparent;
                z-index: 10;
                ${this.getResizeHandleStyles(direction)}
            `;

            // Add visible indicator for debugging (remove in production)
            if (direction.includes('e') || direction.includes('w') || direction.includes('n') || direction.includes('s')) {
                handle.style.background = 'rgba(99, 102, 241, 0.1)';
            }

            windowElement.appendChild(handle);
            this.addResizeHandling(handle, windowElement, direction, config);
        });
    }

    getResizeHandleStyles(direction) {
        const handleSize = '8px';
        const cornerSize = '12px';

        const styles = {
            n: `top: -4px; left: ${cornerSize}; right: ${cornerSize}; height: ${handleSize}; cursor: n-resize;`,
            ne: `top: -6px; right: -6px; width: ${cornerSize}; height: ${cornerSize}; cursor: ne-resize;`,
            e: `top: ${cornerSize}; bottom: ${cornerSize}; right: -4px; width: ${handleSize}; cursor: e-resize;`,
            se: `bottom: -6px; right: -6px; width: ${cornerSize}; height: ${cornerSize}; cursor: se-resize;`,
            s: `bottom: -4px; left: ${cornerSize}; right: ${cornerSize}; height: ${handleSize}; cursor: s-resize;`,
            sw: `bottom: -6px; left: -6px; width: ${cornerSize}; height: ${cornerSize}; cursor: sw-resize;`,
            w: `top: ${cornerSize}; bottom: ${cornerSize}; left: -4px; width: ${handleSize}; cursor: w-resize;`,
            nw: `top: -6px; left: -6px; width: ${cornerSize}; height: ${cornerSize}; cursor: nw-resize;`
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

            // Disable transitions during resize
            windowElement.style.transition = 'none';

            const handleResize = (moveEvent) => {
                const deltaX = moveEvent.clientX - startMouseX;
                const deltaY = moveEvent.clientY - startMouseY;

                const newRect = this.calculateNewWindowSize(
                    startRect, deltaX, deltaY, direction, config
                );

                windowElement.style.left = newRect.x + 'px';
                windowElement.style.top = newRect.y + 'px';
                windowElement.style.width = newRect.width + 'px';
                windowElement.style.height = newRect.height + 'px';
            };

            const handleMouseUp = () => {
                // Re-enable transitions
                windowElement.style.transition = 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)';

                document.removeEventListener('mousemove', handleResize);
                document.removeEventListener('mouseup', handleMouseUp);

                // Remove user selection prevention
                document.body.style.userSelect = '';
                document.body.style.pointerEvents = '';
            };

            // Prevent text selection during resize
            document.body.style.userSelect = 'none';
            document.body.style.pointerEvents = 'none';
            handle.style.pointerEvents = 'auto';

            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', handleMouseUp);
        });

        // Visual feedback on hover
        handle.addEventListener('mouseenter', () => {
            handle.style.background = 'rgba(99, 102, 241, 0.3)';
        });

        handle.addEventListener('mouseleave', () => {
            handle.style.background = 'rgba(99, 102, 241, 0.1)';
        });
    }

    calculateNewWindowSize(startRect, deltaX, deltaY, direction, config) {
        let newWidth = startRect.width;
        let newHeight = startRect.height;
        let newX = startRect.left;
        let newY = startRect.top;

        // Handle horizontal resizing
        if (direction.includes('e')) {
            newWidth += deltaX;
        }
        if (direction.includes('w')) {
            newWidth -= deltaX;
            newX += deltaX;
        }

        // Handle vertical resizing
        if (direction.includes('s')) {
            newHeight += deltaY;
        }
        if (direction.includes('n')) {
            newHeight -= deltaY;
            newY += deltaY;
        }

        // Enforce minimum dimensions
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

        // Constrain to viewport
        const maxWidth = window.innerWidth;
        const maxHeight = window.innerHeight;

        // Ensure window doesn't go outside viewport
        newX = Math.max(0, Math.min(newX, maxWidth - newWidth));
        newY = Math.max(0, Math.min(newY, maxHeight - newHeight));

        // Ensure window doesn't exceed viewport size
        if (newX + newWidth > maxWidth) {
            newWidth = maxWidth - newX;
        }
        if (newY + newHeight > maxHeight) {
            newHeight = maxHeight - newY;
        }

        return { x: newX, y: newY, width: newWidth, height: newHeight };
    }

    // Initialize content for different application types
    initializeWindowContent(appId, config) {
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
            case 'musicplayer':
                this.initializeMusicPlayer(appId);
                break;
        }
    }

    // Music player initialization (simplified for space)
    async initializeMusicPlayer(appId) {
        const audio = document.getElementById(`audio-player-${appId}`);
        if (!audio) return;

        const musicState = {
            playlist: [],
            currentTrack: 0,
            isPlaying: false
        };

        if (!this.musicPlayers) {
            this.musicPlayers = new Map();
        }
        this.musicPlayers.set(appId, musicState);
    }

    // Window management methods
    focus(appId) {
        const windowElement = this.windows.get(appId);
        if (!windowElement) return;

        windowElement.style.zIndex = ++this.zIndexCounter;
        this.activeWindow = appId;

        // Update visual focus state
        document.querySelectorAll('.window').forEach(win => {
            win.classList.remove('active');
            win.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
        });

        windowElement.classList.add('active');
        windowElement.style.boxShadow = '0 12px 48px rgba(99, 102, 241, 0.4)';

        if (window.pixelPusher?.modules?.state) {
            window.pixelPusher.modules.state.setActiveWindow(appId);
        }

        this.updateTaskbar();
    }

    close(appId) {
        const windowElement = this.windows.get(appId);
        if (!windowElement) return;

        // Animate close
        windowElement.style.transform = 'scale(0.9)';
        windowElement.style.opacity = '0';

        setTimeout(() => {
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
        }, 150);

        console.log(`🪟 Closed window: ${appId}`);
    }

    minimize(appId) {
        const windowElement = this.windows.get(appId);
        if (!windowElement) return;

        windowElement.style.transform = 'scale(0.1)';
        windowElement.style.opacity = '0';

        setTimeout(() => {
            windowElement.style.display = 'none';
        }, 150);

        this.updateTaskbar();
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
        // Store original dimensions
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
        windowElement.style.borderRadius = '12px';
        windowElement.dataset.maximized = 'false';

        const maximizeBtn = windowElement.querySelector('.maximize-btn');
        if (maximizeBtn) {
            maximizeBtn.innerHTML = '□';
            maximizeBtn.title = 'Maximize';
        }
    }

    // Taskbar and container setup
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
                height: 48px;
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(20px);
                border-top: 1px solid rgba(0, 0, 0, 0.1);
                display: flex;
                align-items: center;
                padding: 0 12px;
                z-index: 9999;
                gap: 6px;
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
                padding: 6px 12px;
                border: none;
                border-radius: 8px;
                background: ${isActive ? '#6366f1' : 'rgba(0, 0, 0, 0.1)'};
                color: ${isActive ? 'white' : '#2d3748'};
                cursor: pointer;
                font-size: 11px;
                font-weight: 500;
                max-width: 140px;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                transition: all 0.1s ease;
                opacity: ${isMinimized ? '0.6' : '1'};
            `;

            taskButton.textContent = config?.title || appId;

            taskButton.addEventListener('mouseenter', () => {
                if (!isActive) {
                    taskButton.style.background = 'rgba(0, 0, 0, 0.15)';
                }
            });

            taskButton.addEventListener('mouseleave', () => {
                if (!isActive) {
                    taskButton.style.background = 'rgba(0, 0, 0, 0.1)';
                }
            });

            this.taskbar.appendChild(taskButton);
        });

        // Add system tray
        const systemTray = document.createElement('div');
        systemTray.style.cssText = `
            margin-left: auto;
            display: flex;
            align-items: center;
            gap: 6px;
            color: #2d3748;
            font-size: 11px;
        `;

        const clock = document.createElement('div');
        clock.id = 'systemTime';
        clock.style.cssText = `
            color: #2d3748;
            font-size: 11px;
            font-weight: 500;
            padding: 6px 10px;
            background: rgba(0, 0, 0, 0.08);
            border-radius: 8px;
            backdrop-filter: blur(8px);
        `;
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

            container.addEventListener('mousedown', (e) => {
                if (e.target.closest('.window')) {
                    e.target.style.pointerEvents = 'auto';
                }
            });

            document.body.appendChild(container);
        }
    }

    setupGlobalEventHandlers() {
        window.addEventListener('resize', () => {
            this.handleGlobalResize();
        });

        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
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

    applyModernStyling() {
        if (!document.getElementById('window-manager-styles')) {
            const style = document.createElement('style');
            style.id = 'window-manager-styles';
            style.textContent = `
                .window {
                    pointer-events: auto;
                }
                
                .window-btn:hover {
                    transform: scale(1.1);
                }
                
                .window-btn:active {
                    transform: scale(0.95);
                }
                
                .resize-handle {
                    transition: background-color 0.1s ease;
                }
                
                .music-btn:hover {
                    transform: scale(1.05);
                    background: rgba(0, 0, 0, 0.15) !important;
                }
                
                .music-btn:active {
                    transform: scale(0.95);
                }
                
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    background: #6366f1;
                    border-radius: 50%;
                    cursor: pointer;
                }
                
                input[type="range"]::-moz-range-thumb {
                    width: 12px;
                    height: 12px;
                    background: #6366f1;
                    border-radius: 50%;
                    cursor: pointer;
                    border: none;
                }

                /* Smooth window animations */
                .window {
                    transform-origin: center center;
                }

                /* Better taskbar styling */
                .taskbar-button {
                    border: 1px solid transparent;
                }

                .taskbar-button:hover {
                    border-color: rgba(0, 0, 0, 0.1);
                }
            `;
            document.head.appendChild(style);
        }
    }

    getStats() {
        return {
            openWindows: this.windows.size,
            activeWindow: this.activeWindow,
            zIndexCounter: this.zIndexCounter,
            windowList: Array.from(this.windows.keys())
        };
    }

    handleResize() {
        this.handleGlobalResize();
    }

    destroy() {
        // Close all windows
        Array.from(this.windows.keys()).forEach(appId => {
            this.close(appId);
        });

        if (this.taskbar) {
            this.taskbar.remove();
        }

        console.log('🪟 Enhanced Window Manager destroyed');
    }
}

// Make available globally
window.WindowManager = WindowManager;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WindowManager;
}

console.log('🪟 Enhanced Window Manager with improved resizing and slim design loaded successfully');