/**
 * Enhanced Window Manager with Fixed Applications
 * Handles all application windows with proper initialization and modern styling
 * Browser removed, Music Player enhanced
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
        // Browser removed from configurations
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
                width: 400,
                height: 550,
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

        // Apply modern glassmorphism styling
        windowElement.style.cssText = `
            position: fixed;
            left: ${position.x}px;
            top: ${position.y}px;
            width: ${config.width}px;
            height: ${config.height}px;
            min-width: ${config.minWidth}px;
            min-height: ${config.minHeight}px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
            z-index: ${++this.zIndexCounter};
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
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
                padding: 12px 16px;
                background: rgba(255, 255, 255, 0.08);
                backdrop-filter: blur(16px);
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                cursor: move;
                user-select: none;
                min-height: 48px;
            ">
                <div class="window-title" style="
                    font-weight: 600;
                    font-size: 14px;
                    color: #ffffff;
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
                    gap: 6px;
                    align-items: center;
                ">
                    <button class="window-btn minimize-btn" onclick="window.pixelPusher.modules.windows.minimize('${appId}')" 
                            title="Minimize" style="
                        width: 28px; height: 28px; border: none; border-radius: 50%;
                        background: linear-gradient(135deg, #fbbf24, #f59e0b);
                        color: #92400e; cursor: pointer; font-size: 12px; font-weight: 600;
                        display: flex; align-items: center; justify-content: center;
                        transition: all 0.15s ease; position: relative; overflow: hidden;
                    ">−</button>
                    <button class="window-btn maximize-btn" onclick="window.pixelPusher.modules.windows.maximize('${appId}')" 
                            title="Maximize" style="
                        width: 28px; height: 28px; border: none; border-radius: 50%;
                        background: linear-gradient(135deg, #34d399, #10b981);
                        color: #065f46; cursor: pointer; font-size: 12px; font-weight: 600;
                        display: flex; align-items: center; justify-content: center;
                        transition: all 0.15s ease; position: relative; overflow: hidden;
                    ">□</button>
                    <button class="window-btn close-btn" onclick="window.pixelPusher.modules.windows.close('${appId}')" 
                            title="Close" style="
                        width: 28px; height: 28px; border: none; border-radius: 50%;
                        background: linear-gradient(135deg, #f87171, #ef4444);
                        color: #991b1b; cursor: pointer; font-size: 12px; font-weight: 600;
                        display: flex; align-items: center; justify-content: center;
                        transition: all 0.15s ease; position: relative; overflow: hidden;
                    ">✕</button>
                </div>
            </div>
            <div class="window-content" style="
                flex: 1;
                overflow: hidden;
                position: relative;
                background: rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(12px);
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
                        background: rgba(0, 0, 0, 0.8); color: #00ff41;
                        font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
                    ">
                        <div class="terminal-output" id="terminal-output-${appId}" style="
                            flex: 1; overflow-y: auto; padding: 16px;
                            white-space: pre-wrap; word-wrap: break-word;
                            line-height: 1.4; font-size: 13px;
                        "></div>
                        <div class="terminal-input-line" style="
                            display: flex; align-items: center; gap: 8px;
                            padding: 12px 16px; border-top: 1px solid rgba(255, 255, 255, 0.1);
                            background: rgba(0, 0, 0, 0.4);
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
                        background: rgba(0, 0, 0, 0.2);
                    ">
                        <div class="explorer-toolbar" style="
                            display: flex; align-items: center; gap: 8px;
                            padding: 12px 16px; background: rgba(255, 255, 255, 0.08);
                            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                            backdrop-filter: blur(12px);
                        ">
                            <button onclick="window.pixelPusher.modules.explorer?.navigateBack('${appId}')" style="
                                padding: 6px 12px; border: 1px solid rgba(255, 255, 255, 0.2);
                                border-radius: 8px; background: rgba(255, 255, 255, 0.1);
                                color: #ffffff; cursor: pointer; font-size: 12px;
                                transition: all 0.15s ease;
                            ">← Back</button>
                            <button onclick="window.pixelPusher.modules.explorer?.navigateUp('${appId}')" style="
                                padding: 6px 12px; border: 1px solid rgba(255, 255, 255, 0.2);
                                border-radius: 8px; background: rgba(255, 255, 255, 0.1);
                                color: #ffffff; cursor: pointer; font-size: 12px;
                                transition: all 0.15s ease;
                            ">↑ Up</button>
                            <input type="text" class="explorer-path" id="explorer-path-${appId}" 
                                   value="/" readonly style="
                                flex: 1; padding: 8px 12px; border: 1px solid rgba(255, 255, 255, 0.2);
                                border-radius: 8px; background: rgba(255, 255, 255, 0.1);
                                color: #ffffff; font-size: 12px; font-family: monospace;
                            ">
                            <button onclick="window.pixelPusher.modules.explorer?.refresh('${appId}')" style="
                                padding: 6px 12px; border: 1px solid rgba(255, 255, 255, 0.2);
                                border-radius: 8px; background: rgba(255, 255, 255, 0.1);
                                color: #ffffff; cursor: pointer; font-size: 12px;
                                transition: all 0.15s ease;
                            ">🔄 Refresh</button>
                        </div>
                        <div class="explorer-content" id="explorer-content-${appId}" style="
                            flex: 1; overflow: auto; padding: 16px;
                            color: #ffffff; font-size: 14px;
                        ">
                            Loading file explorer...
                        </div>
                    </div>
                `;

            case 'settings':
                return `
                    <div id="settings-${appId}" class="settings-container" style="
                        display: flex; height: 100%; background: rgba(0, 0, 0, 0.2);
                    ">
                        <div class="settings-sidebar" style="
                            width: 200px; background: rgba(255, 255, 255, 0.08);
                            border-right: 1px solid rgba(255, 255, 255, 0.2);
                            padding: 16px 0; backdrop-filter: blur(12px);
                        ">
                            <div class="settings-nav-item active" data-section="appearance" style="
                                padding: 12px 20px; cursor: pointer; color: #ffffff;
                                font-size: 13px; font-weight: 500; transition: all 0.2s ease;
                                border-left: 3px solid #6366f1; background: #6366f1;
                                display: flex; align-items: center; gap: 12px;
                            ">🎨 Appearance</div>
                            <div class="settings-nav-item" data-section="system" style="
                                padding: 12px 20px; cursor: pointer; color: rgba(255, 255, 255, 0.8);
                                font-size: 13px; font-weight: 500; transition: all 0.2s ease;
                                border-left: 3px solid transparent;
                                display: flex; align-items: center; gap: 12px;
                            ">⚙️ System</div>
                            <div class="settings-nav-item" data-section="games" style="
                                padding: 12px 20px; cursor: pointer; color: rgba(255, 255, 255, 0.8);
                                font-size: 13px; font-weight: 500; transition: all 0.2s ease;
                                border-left: 3px solid transparent;
                                display: flex; align-items: center; gap: 12px;
                            ">🎮 Games</div>
                            <div class="settings-nav-item" data-section="about" style="
                                padding: 12px 20px; cursor: pointer; color: rgba(255, 255, 255, 0.8);
                                font-size: 13px; font-weight: 500; transition: all 0.2s ease;
                                border-left: 3px solid transparent;
                                display: flex; align-items: center; gap: 12px;
                            ">ℹ️ About</div>
                        </div>
                        <div class="settings-content" id="settings-content-${appId}" style="
                            flex: 1; padding: 24px; overflow-y: auto; color: #ffffff;
                        ">
                            Loading settings...
                        </div>
                    </div>
                `;

            case 'taskmanager':
                return `
                    <div id="taskmanager-${appId}" class="taskmanager-container" style="
                        display: flex; flex-direction: column; height: 100%;
                        background: rgba(0, 0, 0, 0.2); color: #ffffff;
                    ">
                        <div class="taskmanager-tabs" style="
                            display: flex; background: rgba(255, 255, 255, 0.08);
                            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                        ">
                            <div class="tab active" data-tab="processes" style="
                                padding: 12px 24px; cursor: pointer; font-weight: 500;
                                background: #6366f1; color: white; border-bottom: 2px solid #6366f1;
                            ">Processes</div>
                            <div class="tab" data-tab="performance" style="
                                padding: 12px 24px; cursor: pointer; font-weight: 500;
                                color: rgba(255, 255, 255, 0.8); transition: all 0.2s ease;
                            ">Performance</div>
                            <div class="tab" data-tab="network" style="
                                padding: 12px 24px; cursor: pointer; font-weight: 500;
                                color: rgba(255, 255, 255, 0.8); transition: all 0.2s ease;
                            ">Network</div>
                        </div>
                        <div class="taskmanager-content" id="taskmanager-content-${appId}" style="
                            flex: 1; padding: 16px; overflow-y: auto;
                        ">
                            Loading task manager...
                        </div>
                    </div>
                `;

            case 'musicplayer':
                return `
                    <div id="musicplayer-${appId}" class="musicplayer-container" style="
                        display: flex; flex-direction: column; height: 100%;
                        background: rgba(0, 0, 0, 0.2); color: #ffffff; padding: 20px;
                    ">
                        <div class="music-header" style="text-align: center; margin-bottom: 20px;">
                            <h2 style="margin: 0; color: #ffffff; font-size: 18px;">🎵 Music Player</h2>
                        </div>
                        
                        <div class="album-art" style="
                            width: 200px; height: 200px; margin: 0 auto 20px;
                            background: rgba(255, 255, 255, 0.1); border-radius: 12px;
                            display: flex; align-items: center; justify-content: center;
                            font-size: 48px; backdrop-filter: blur(12px);
                        ">🎵</div>
                        
                        <div class="music-info" style="text-align: center; margin-bottom: 20px;">
                            <div class="music-title" id="music-title-${appId}" style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">
                                No music playing
                            </div>
                            <div class="music-artist" id="music-artist-${appId}" style="font-size: 14px; color: rgba(255, 255, 255, 0.8);">
                                Click below to load music
                            </div>
                        </div>
                        
                        <div class="music-progress" style="margin-bottom: 20px;">
                            <div class="progress-bar" style="
                                height: 4px; background: rgba(255, 255, 255, 0.2);
                                border-radius: 2px; margin-bottom: 8px;
                            ">
                                <div class="progress-fill" id="progress-fill-${appId}" style="
                                    width: 0%; height: 100%; background: #6366f1;
                                    border-radius: 2px; transition: width 0.3s ease;
                                "></div>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 12px; color: rgba(255, 255, 255, 0.6);">
                                <span id="time-current-${appId}">0:00</span>
                                <span id="time-total-${appId}">0:00</span>
                            </div>
                        </div>
                        
                        <div class="music-controls" style="
                            display: flex; justify-content: center; gap: 12px; margin-bottom: 20px;
                        ">
                            <button class="music-btn" onclick="window.pixelPusher.modules.windows.prevTrack('${appId}')" style="
                                width: 40px; height: 40px; border: none; border-radius: 50%;
                                background: rgba(255, 255, 255, 0.1); color: #ffffff;
                                cursor: pointer; font-size: 16px; transition: all 0.2s ease;
                            ">⏮️</button>
                            <button class="music-btn play-pause" id="play-pause-${appId}" onclick="window.pixelPusher.modules.windows.togglePlay('${appId}')" style="
                                width: 50px; height: 50px; border: none; border-radius: 50%;
                                background: #6366f1; color: white; cursor: pointer;
                                font-size: 20px; transition: all 0.2s ease;
                            ">▶️</button>
                            <button class="music-btn" onclick="window.pixelPusher.modules.windows.nextTrack('${appId}')" style="
                                width: 40px; height: 40px; border: none; border-radius: 50%;
                                background: rgba(255, 255, 255, 0.1); color: #ffffff;
                                cursor: pointer; font-size: 16px; transition: all 0.2s ease;
                            ">⏭️</button>
                        </div>
                        
                        <div class="music-volume" style="
                            display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
                        ">
                            <span style="font-size: 16px;">🔊</span>
                            <input type="range" class="volume-slider" id="volume-${appId}" min="0" max="100" value="50" style="
                                flex: 1; height: 4px; background: rgba(255, 255, 255, 0.2);
                                border-radius: 2px; outline: none; cursor: pointer;
                            ">
                        </div>
                        
                        <button onclick="window.pixelPusher.modules.windows.loadMusicLibrary('${appId}')" style="
                            padding: 10px 20px; background: rgba(255, 255, 255, 0.1);
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            border-radius: 8px; color: #ffffff;
                            cursor: pointer; font-size: 14px;
                            transition: all 0.2s ease;
                        ">📁 Load Music Library</button>
                        
                        <div class="music-playlist" id="music-playlist-${appId}" style="
                            margin-top: 20px; max-height: 150px; overflow-y: auto;
                            background: rgba(255, 255, 255, 0.05);
                            border-radius: 8px; padding: 10px;
                            display: none;
                        ">
                            <!-- Playlist items will be added here -->
                        </div>
                        
                        <!-- Hidden audio element -->
                        <audio id="audio-player-${appId}" style="display: none;"></audio>
                    </div>
                `;

            case 'village':
                return `
                    <div id="village-${appId}" class="village-container" style="
                        width: 100%; height: 100%; position: relative;
                        background: rgba(0, 0, 0, 0.2);
                    ">
                        <canvas id="village-canvas-${appId}" style="
                            width: 100%; height: 100%; display: block;
                            border-radius: 0 0 20px 20px;
                        "></canvas>
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
                            border-radius: 0 0 20px 20px;
                        "></canvas>
                    </div>
                `;

            default:
                return `
                    <div class="default-window-content" style="
                        padding: 24px; text-align: center; color: #ffffff;
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
            const offset = windowCount * 30;
            x += offset;
            y += offset;

            if (x + config.width > viewportWidth) x = 50;
            if (y + config.height > viewportHeight) y = 50;
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
                windowElement.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
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

        // Window resizing
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
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
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

            windowElement.appendChild(handle);
            this.addResizeHandling(handle, windowElement, direction, config);
        });
    }

    getResizeHandleStyles(direction) {
        const styles = {
            n: 'top: -4px; left: 8px; right: 8px; height: 8px; cursor: n-resize;',
            ne: 'top: -4px; right: -4px; width: 8px; height: 8px; cursor: ne-resize;',
            e: 'top: 8px; bottom: 8px; right: -4px; width: 8px; cursor: e-resize;',
            se: 'bottom: -4px; right: -4px; width: 8px; height: 8px; cursor: se-resize;',
            s: 'bottom: -4px; left: 8px; right: 8px; height: 8px; cursor: s-resize;',
            sw: 'bottom: -4px; left: -4px; width: 8px; height: 8px; cursor: sw-resize;',
            w: 'top: 8px; bottom: 8px; left: -4px; width: 8px; cursor: w-resize;',
            nw: 'top: -4px; left: -4px; width: 8px; height: 8px; cursor: nw-resize;'
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
            case 'village':
                this.initializeVillageGame(appId);
                break;
            case 'game':
                if (window.pixelPusher?.modules?.games) {
                    window.pixelPusher.modules.games.initializeGame(appId, config.gameType);
                }
                break;
            case 'taskmanager':
                this.initializeTaskManager(appId);
                break;
            case 'musicplayer':
                this.initializeMusicPlayer(appId);
                break;
        }
    }

    initializeVillageGame(appId) {
        const canvas = document.getElementById(`village-canvas-${appId}`);
        if (canvas) {
            const ctx = canvas.getContext('2d');

            // Import and use the VillageBuilderGame from the previous artifact
            if (typeof VillageBuilderGame !== 'undefined') {
                const game = new VillageBuilderGame(canvas, ctx, window.pixelPusher?.modules?.games);
                // Store game instance for cleanup
                this.games = this.games || new Map();
                this.games.set(appId, game);
            } else {
                // Fallback simple village display
                ctx.fillStyle = '#4a7c59';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#ffffff';
                ctx.font = '20px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('🏘️ Village Builder', canvas.width / 2, canvas.height / 2);
            }
        }
    }

 async initializeTaskManager(appId) {
        const content = document.getElementById(`taskmanager-content-${appId}`);
        if (!content) return;

        // Set up tab switching functionality
        this.setupTaskManagerTabs(appId);

        // Show loading state
        content.innerHTML = `
            <div style="color: #ffffff; text-align: center; padding: 20px;">
                <div class="spinner" style="
                    width: 40px;
                    height: 40px;
                    border: 4px solid rgba(255, 255, 255, 0.3);
                    border-top: 4px solid #ffffff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 16px;
                "></div>
                <p>Loading system information...</p>
            </div>
        `;

        // Add spinner animation if not already present
        if (!document.getElementById('spinner-animation')) {
            const style = document.createElement('style');
            style.id = 'spinner-animation';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        // Load initial tab (processes)
        this.loadTaskManagerTab(appId, 'processes');

        // Set up auto-refresh
        const refreshInterval = setInterval(() => {
            const activeTab = this.getActiveTaskManagerTab(appId);
            this.loadTaskManagerTab(appId, activeTab);
        }, 2000);

        // Store interval ID for cleanup
        if (!this.taskManagerIntervals) {
            this.taskManagerIntervals = new Map();
        }
        this.taskManagerIntervals.set(appId, refreshInterval);
    }

    setupTaskManagerTabs(appId) {
        const tabsContainer = document.querySelector(`#window-${appId} .taskmanager-tabs`);
        if (!tabsContainer) return;

        tabsContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.tab');
            if (!tab) return;

            const tabName = tab.dataset.tab;

            // Update tab appearance
            tabsContainer.querySelectorAll('.tab').forEach(t => {
                t.classList.remove('active');
                t.style.background = 'transparent';
                t.style.color = 'rgba(255, 255, 255, 0.8)';
                t.style.borderBottom = 'none';
            });

            tab.classList.add('active');
            tab.style.background = '#6366f1';
            tab.style.color = 'white';
            tab.style.borderBottom = '2px solid #6366f1';

            // Load tab content
            this.loadTaskManagerTab(appId, tabName);
        });
    }

    getActiveTaskManagerTab(appId) {
        const activeTab = document.querySelector(`#window-${appId} .tab.active`);
        return activeTab ? activeTab.dataset.tab : 'processes';
    }

    async loadTaskManagerTab(appId, tabName) {
        const content = document.getElementById(`taskmanager-content-${appId}`);
        if (!content) return;

        try {
            switch (tabName) {
                case 'processes':
                    await this.loadProcessesTab(appId, content);
                    break;
                case 'performance':
                    await this.loadPerformanceTab(appId, content);
                    break;
                case 'network':
                    await this.loadNetworkTab(appId, content);
                    break;
            }
        } catch (error) {
            console.error('Task Manager tab error:', error);
            content.innerHTML = `
                <div style="color: #ffffff; text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                    <p>Error loading ${tabName} information</p>
                    <p style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-top: 8px;">${error.message}</p>
                </div>
            `;
        }
    }

    async loadProcessesTab(appId, content) {
        let html = `<div style="color: #ffffff;">`;

        // Pixel Pusher OS Tasks Section
        html += `
            <div style="margin-bottom: 30px;">
                <h3 style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
                    🎨 Pixel Pusher OS Tasks
                    <span style="font-size: 14px; color: rgba(255, 255, 255, 0.6);">(${this.windows.size} active)</span>
                </h3>
                <div style="background: rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 16px;">
        `;

        if (this.windows.size > 0) {
            html += `
                <div style="display: grid; grid-template-columns: 80px 1fr 120px 100px 80px; gap: 12px; padding: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 6px; margin-bottom: 8px; font-weight: bold; font-size: 12px;">
                    <div>Icon</div>
                    <div>Application</div>
                    <div>Status</div>
                    <div>Memory</div>
                    <div>Action</div>
                </div>
            `;

            this.windows.forEach((windowElement, windowId) => {
                const config = this.windowConfigs[windowId];
                const isMinimized = windowElement.style.display === 'none';
                const isActive = this.activeWindow === windowId && !isMinimized;
                const memoryUsage = Math.floor(Math.random() * 50 + 10); // Simulated memory usage

                html += `
                    <div style="display: grid; grid-template-columns: 80px 1fr 120px 100px 80px; gap: 12px; padding: 8px; margin-bottom: 4px; background: rgba(255, 255, 255, 0.05); border-radius: 4px; align-items: center;">
                        <div style="text-align: center; font-size: 20px;">
                            ${config?.title?.split(' ')[0] || '🪟'}
                        </div>
                        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${config?.title || windowId}">
                            ${config?.title || windowId}
                        </div>
                        <div>
                            <span style="
                                background: ${isActive ? '#4CAF50' : isMinimized ? '#FF9800' : '#2196F3'};
                                color: white;
                                padding: 2px 8px;
                                border-radius: 12px;
                                font-size: 11px;
                                font-weight: 500;
                            ">
                                ${isActive ? 'Active' : isMinimized ? 'Minimized' : 'Running'}
                            </span>
                        </div>
                        <div style="text-align: right; font-family: monospace;">
                            ${memoryUsage} MB
                        </div>
                        <div style="text-align: center;">
                            <button onclick="window.pixelPusher.modules.windows.killTask('${windowId}')" style="
                                background: #f44336;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                padding: 4px 8px;
                                cursor: pointer;
                                font-size: 11px;
                                transition: all 0.2s ease;
                            " onmouseover="this.style.background='#d32f2f'" onmouseout="this.style.background='#f44336'">
                                Kill
                            </button>
                        </div>
                    </div>
                `;
            });
        } else {
            html += `
                <div style="text-align: center; color: rgba(255, 255, 255, 0.6); padding: 20px;">
                    <div style="font-size: 32px; margin-bottom: 12px;">💤</div>
                    <p>No applications currently running</p>
                    <p style="font-size: 12px;">Open some applications to see them here</p>
                </div>
            `;
        }

        html += `</div></div>`;

        // System Processes Section
        try {
            const response = await fetch('/api/system/info');
            if (response.ok) {
                const data = await response.json();

                html += `
                    <div>
                        <h3 style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
                            🖥️ System Processes
                            <span style="font-size: 14px; color: rgba(255, 255, 255, 0.6);">(Top ${data.processes?.length || 0})</span>
                        </h3>
                        <div style="background: rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 16px;">
                `;

                if (data.processes && data.processes.length > 0) {
                    html += `
                        <div style="display: grid; grid-template-columns: 60px 1fr 80px 80px; gap: 16px; padding: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 6px; margin-bottom: 8px; font-weight: bold; font-size: 12px;">
                            <div>PID</div>
                            <div>Process</div>
                            <div style="text-align: right;">CPU%</div>
                            <div style="text-align: right;">Memory</div>
                        </div>
                    `;

                    data.processes.forEach(proc => {
                        html += `
                            <div style="display: grid; grid-template-columns: 60px 1fr 80px 80px; gap: 16px; padding: 8px; margin-bottom: 4px; background: rgba(255, 255, 255, 0.05); border-radius: 4px;">
                                <div style="font-family: monospace;">${proc.pid || 'N/A'}</div>
                                <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${proc.name || 'Unknown'}">${proc.name || 'Unknown'}</div>
                                <div style="text-align: right; font-family: monospace;">${(proc.cpu_percent || 0).toFixed(1)}%</div>
                                <div style="text-align: right; font-family: monospace;">${(proc.memory_mb || 0).toFixed(0)}MB</div>
                            </div>
                        `;
                    });
                } else {
                    html += `
                        <div style="text-align: center; color: rgba(255, 255, 255, 0.6); padding: 20px;">
                            <p>System process information not available</p>
                            <p style="font-size: 12px; margin-top: 8px;">This might be due to missing system permissions</p>
                        </div>
                    `;
                }

                html += `</div></div>`;
            }
        } catch (error) {
            html += `
                <div>
                    <h3>🖥️ System Processes</h3>
                    <div style="background: rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 16px;">
                        <div style="text-align: center; color: rgba(255, 255, 255, 0.6);">
                            <p>Unable to fetch system processes</p>
                            <p style="font-size: 12px;">${error.message}</p>
                        </div>
                    </div>
                </div>
            `;
        }

        html += `</div>`;
        content.innerHTML = html;
    }

    async loadPerformanceTab(appId, content) {
        try {
            const response = await fetch('/api/system/info');
            const data = response.ok ? await response.json() : {};

            // Get browser performance info
            const browserMemory = performance.memory || {};
            const timing = performance.timing || {};

            let html = `
                <div style="color: #ffffff;">
                    <h3 style="margin-bottom: 20px;">📊 System Performance</h3>
                    
                    <!-- CPU Section -->
                    <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                        <h4 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                            🔵 CPU Performance
                        </h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <div style="margin-bottom: 12px;">
                                    <strong>Usage:</strong> ${(data.cpu?.percent || 0).toFixed(1)}%
                                    <div style="width: 100%; height: 12px; background: rgba(255, 255, 255, 0.2); border-radius: 6px; margin-top: 4px; overflow: hidden;">
                                        <div style="width: ${data.cpu?.percent || 0}%; height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); border-radius: 6px; transition: width 0.3s ease;"></div>
                                    </div>
                                </div>
                                <div><strong>Cores:</strong> ${data.cpu?.cores || 'N/A'}</div>
                                <div><strong>Threads:</strong> ${data.cpu?.threads || data.cpu?.cores || 'N/A'}</div>
                            </div>
                            <div>
                                <div><strong>Architecture:</strong> ${navigator.platform || 'Unknown'}</div>
                                <div><strong>Frequency:</strong> ${data.cpu?.frequency || 'N/A'}</div>
                                <div><strong>Load Average:</strong> ${data.cpu?.load_avg || 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Memory Section -->
                    <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                        <h4 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                            🟡 Memory Usage
                        </h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <div style="margin-bottom: 12px;">
                                    <strong>System RAM:</strong> ${((data.memory?.used || 0) / 1024 / 1024 / 1024).toFixed(1)} GB / ${((data.memory?.total || 0) / 1024 / 1024 / 1024).toFixed(1)} GB (${(data.memory?.percent || 0).toFixed(1)}%)
                                    <div style="width: 100%; height: 12px; background: rgba(255, 255, 255, 0.2); border-radius: 6px; margin-top: 4px; overflow: hidden;">
                                        <div style="width: ${data.memory?.percent || 0}%; height: 100%; background: linear-gradient(90deg, #2196F3, #03A9F4); border-radius: 6px; transition: width 0.3s ease;"></div>
                                    </div>
                                </div>
                                <div><strong>Available:</strong> ${((data.memory?.available || 0) / 1024 / 1024 / 1024).toFixed(1)} GB</div>
                                <div><strong>Cached:</strong> ${((data.memory?.cached || 0) / 1024 / 1024 / 1024).toFixed(1)} GB</div>
                            </div>
                            <div>
                                <div style="margin-bottom: 12px;">
                                    <strong>Browser Heap:</strong> ${Math.round((browserMemory.usedJSHeapSize || 0) / 1024 / 1024)} MB / ${Math.round((browserMemory.totalJSHeapSize || 0) / 1024 / 1024)} MB
                                    <div style="width: 100%; height: 12px; background: rgba(255, 255, 255, 0.2); border-radius: 6px; margin-top: 4px; overflow: hidden;">
                                        <div style="width: ${browserMemory.usedJSHeapSize && browserMemory.totalJSHeapSize ? (browserMemory.usedJSHeapSize / browserMemory.totalJSHeapSize * 100) : 0}%; height: 100%; background: linear-gradient(90deg, #FF9800, #FFC107); border-radius: 6px; transition: width 0.3s ease;"></div>
                                    </div>
                                </div>
                                <div><strong>Heap Limit:</strong> ${Math.round((browserMemory.jsHeapSizeLimit || 0) / 1024 / 1024)} MB</div>
                                <div><strong>Swap Used:</strong> ${((data.memory?.swap_used || 0) / 1024 / 1024 / 1024).toFixed(1)} GB</div>
                            </div>
                        </div>
                    </div>

                    <!-- Storage Section -->
                    <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                        <h4 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                            🟠 Storage Performance
                        </h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <div style="margin-bottom: 12px;">
                                    <strong>Disk Usage:</strong> ${((data.disk?.used || 0) / 1024 / 1024 / 1024).toFixed(1)} GB / ${((data.disk?.total || 0) / 1024 / 1024 / 1024).toFixed(1)} GB (${(data.disk?.percent || 0).toFixed(1)}%)
                                    <div style="width: 100%; height: 12px; background: rgba(255, 255, 255, 0.2); border-radius: 6px; margin-top: 4px; overflow: hidden;">
                                        <div style="width: ${data.disk?.percent || 0}%; height: 100%; background: linear-gradient(90deg, #FF9800, #F57C00); border-radius: 6px; transition: width 0.3s ease;"></div>
                                    </div>
                                </div>
                                <div><strong>Free Space:</strong> ${((data.disk?.free || 0) / 1024 / 1024 / 1024).toFixed(1)} GB</div>
                            </div>
                            <div>
                                <div><strong>Read Speed:</strong> ${data.disk?.read_speed || 'N/A'}</div>
                                <div><strong>Write Speed:</strong> ${data.disk?.write_speed || 'N/A'}</div>
                                <div><strong>I/O Operations:</strong> ${data.disk?.io_ops || 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Browser Performance -->
                    <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px;">
                        <h4 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                            🌐 Browser Performance
                        </h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <div><strong>Page Load:</strong> ${timing.loadEventEnd ? Math.round(timing.loadEventEnd - timing.navigationStart) : 'N/A'}ms</div>
                                <div><strong>DOM Ready:</strong> ${timing.domContentLoaded ? Math.round(timing.domContentLoaded - timing.navigationStart) : 'N/A'}ms</div>
                                <div><strong>Active Windows:</strong> ${this.windows.size}</div>
                            </div>
                            <div>
                                <div><strong>User Agent:</strong> ${navigator.userAgent.split(' ')[0] || 'Unknown'}</div>
                                <div><strong>Viewport:</strong> ${window.innerWidth}x${window.innerHeight}</div>
                                <div><strong>Uptime:</strong> ${this.formatUptime(performance.now() / 1000)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            content.innerHTML = html;

        } catch (error) {
            content.innerHTML = `
                <div style="color: #ffffff; text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                    <h3>Performance Monitor</h3>
                    <p style="color: rgba(255, 255, 255, 0.6);">Unable to load performance data</p>
                    <p style="font-size: 12px; margin-top: 8px;">${error.message}</p>
                </div>
            `;
        }
    }

    async loadNetworkTab(appId, content) {
        let html = `
            <div style="color: #ffffff;">
                <h3 style="margin-bottom: 20px;">🌐 Network Information</h3>
                
                <!-- Connection Status -->
                <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                    <h4 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                        ${navigator.onLine ? '🟢' : '🔴'} Connection Status
                    </h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <div><strong>Status:</strong> ${navigator.onLine ? 'Connected' : 'Disconnected'}</div>
                            <div><strong>Connection Type:</strong> ${navigator.connection?.effectiveType || 'Unknown'}</div>
                            <div><strong>Downlink:</strong> ${navigator.connection?.downlink || 'N/A'} Mbps</div>
                        </div>
                        <div>
                            <div><strong>RTT:</strong> ${navigator.connection?.rtt || 'N/A'}ms</div>
                            <div><strong>Save Data:</strong> ${navigator.connection?.saveData ? 'Enabled' : 'Disabled'}</div>
                            <div><strong>Protocol:</strong> ${location.protocol.toUpperCase()}</div>
                        </div>
                    </div>
                </div>

                <!-- Network Details -->
                <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                    <h4 style="margin-bottom: 16px;">🌍 Network Details</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <div><strong>Host:</strong> ${window.location.hostname}</div>
                            <div><strong>Port:</strong> ${window.location.port || (window.location.protocol === 'https:' ? '443' : '80')}</div>
                            <div><strong>Origin:</strong> ${window.location.origin}</div>
                        </div>
                        <div>
                            <div><strong>User Agent:</strong> ${navigator.userAgent.split(' ')[0]}</div>
                            <div><strong>Language:</strong> ${navigator.language}</div>
                            <div><strong>Timezone:</strong> ${Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
                        </div>
                    </div>
                </div>

                <!-- API Endpoints Status -->
                <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                    <h4 style="margin-bottom: 16px;">🔗 API Endpoints</h4>
                    <div id="api-status-${appId}">
                        <div style="text-align: center; color: rgba(255, 255, 255, 0.6);">
                            <div class="spinner" style="width: 20px; height: 20px; border: 2px solid rgba(255, 255, 255, 0.3); border-top: 2px solid #ffffff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 8px;"></div>
                            Checking API endpoints...
                        </div>
                    </div>
                </div>

                <!-- Network Activity -->
                <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px;">
                    <h4 style="margin-bottom: 16px;">📈 Network Activity</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <div><strong>Active Connections:</strong> ${this.windows.size}</div>
                            <div><strong>WebSocket:</strong> Not Connected</div>
                            <div><strong>Service Worker:</strong> ${navigator.serviceWorker ? 'Supported' : 'Not Supported'}</div>
                        </div>
                        <div>
                            <div><strong>DNS:</strong> Browser Default</div>
                            <div><strong>Proxy:</strong> None Detected</div>
                            <div><strong>Cache:</strong> ${navigator.storage ? 'Available' : 'Not Available'}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        content.innerHTML = html;

        // Check API endpoints
        this.checkAPIEndpointsStatus(appId);
    }

    async checkAPIEndpointsStatus(appId) {
        const statusContainer = document.getElementById(`api-status-${appId}`);
        if (!statusContainer) return;

        const endpoints = [
            { name: 'System Info', url: '/api/system/info' },
            { name: 'File System', url: '/api/files' },
            { name: 'Command Interface', url: '/api/command' },
            { name: 'Music Library', url: '/api/music' }
        ];

        let statusHTML = '';

        for (const endpoint of endpoints) {
            try {
                const startTime = performance.now();
                const response = await fetch(endpoint.url, { method: 'HEAD' });
                const endTime = performance.now();
                const responseTime = Math.round(endTime - startTime);

                const status = response.ok ? 'online' : 'error';
                const statusIcon = response.ok ? '🟢' : '🔴';
                const statusText = response.ok ? 'Online' : `Error ${response.status}`;

                statusHTML += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span>${statusIcon}</span>
                            <span>${endpoint.name}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px; font-size: 12px;">
                            <span style="color: ${response.ok ? '#4CAF50' : '#f44336'};">${statusText}</span>
                            <span style="color: rgba(255, 255, 255, 0.6);">${responseTime}ms</span>
                        </div>
                    </div>
                `;
            } catch (error) {
                statusHTML += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span>🔴</span>
                            <span>${endpoint.name}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px; font-size: 12px;">
                            <span style="color: #f44336;">Offline</span>
                            <span style="color: rgba(255, 255, 255, 0.6);">Timeout</span>
                        </div>
                    </div>
                `;
            }
        }

        statusContainer.innerHTML = statusHTML;
    }

    killTask(windowId) {
        if (confirm(`Are you sure you want to close ${windowId}?`)) {
            this.close(windowId);

            if (window.pixelPusher?.showNotification) {
                window.pixelPusher.showNotification(`Closed ${windowId}`, 'success');
            }
        }
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

        return parts.join(' ');
    }

    async initializeMusicPlayer(appId) {
        // Set up music player controls
        const audio = document.getElementById(`audio-player-${appId}`);
        const playBtn = document.getElementById(`play-pause-${appId}`);
        const volumeSlider = document.getElementById(`volume-${appId}`);
        const progressFill = document.getElementById(`progress-fill-${appId}`);
        const currentTime = document.getElementById(`time-current-${appId}`);
        const totalTime = document.getElementById(`time-total-${appId}`);

        if (!audio) return;

        // Music player state
        const musicState = {
            playlist: [],
            currentTrack: 0,
            isPlaying: false
        };

        // Store state on window
        if (!this.musicPlayers) {
            this.musicPlayers = new Map();
        }
        this.musicPlayers.set(appId, musicState);

        // Volume control
        if (volumeSlider) {
            volumeSlider.addEventListener('input', () => {
                audio.volume = volumeSlider.value / 100;
            });
        }

        // Audio event handlers
        audio.addEventListener('timeupdate', () => {
            if (audio.duration) {
                const progress = (audio.currentTime / audio.duration) * 100;
                if (progressFill) progressFill.style.width = progress + '%';
                if (currentTime) currentTime.textContent = this.formatTime(audio.currentTime);
                if (totalTime) totalTime.textContent = this.formatTime(audio.duration);
            }
        });

        audio.addEventListener('ended', () => {
            this.nextTrack(appId);
        });
    }

    async loadMusicLibrary(appId) {
        const playlist = document.getElementById(`music-playlist-${appId}`);
        const musicState = this.musicPlayers?.get(appId);

        if (!playlist || !musicState) return;

        try {
            // Fetch music files from server
            const response = await fetch('/api/music');
            const data = await response.json();

            if (data.files && data.files.length > 0) {
                musicState.playlist = data.files;

                // Display playlist
                playlist.innerHTML = '<h4 style="margin-bottom: 10px;">Music Library</h4>';
                data.files.forEach((file, index) => {
                    const item = document.createElement('div');
                    item.style.cssText = `
                        padding: 8px;
                        cursor: pointer;
                        border-radius: 4px;
                        transition: background 0.2s;
                        margin-bottom: 4px;
                        font-size: 13px;
                    `;
                    item.textContent = `${index + 1}. ${file.title}`;
                    item.onclick = () => this.playTrack(appId, index);

                    item.addEventListener('mouseenter', () => {
                        item.style.background = 'rgba(255, 255, 255, 0.1)';
                    });
                    item.addEventListener('mouseleave', () => {
                        item.style.background = 'transparent';
                    });

                    playlist.appendChild(item);
                });

                playlist.style.display = 'block';

                // Show notification
                if (window.pixelPusher) {
                    window.pixelPusher.showNotification(`Loaded ${data.files.length} music files`, 'success');
                }
            } else {
                playlist.innerHTML = `
                    <div style="text-align: center; color: rgba(255, 255, 255, 0.6); padding: 20px;">
                        <p>No music files found</p>
                        <p style="font-size: 12px; margin-top: 10px;">Add MP3, WAV, OGG, or FLAC files to the music directory</p>
                    </div>
                `;
                playlist.style.display = 'block';
            }

        } catch (error) {
            console.error('Error loading music library:', error);
            playlist.innerHTML = `
                <div style="text-align: center; color: rgba(255, 255, 255, 0.6); padding: 20px;">
                    <p>Error loading music library</p>
                </div>
            `;
            playlist.style.display = 'block';
        }
    }

    playTrack(appId, index) {
        const audio = document.getElementById(`audio-player-${appId}`);
        const musicState = this.musicPlayers?.get(appId);
        const titleEl = document.getElementById(`music-title-${appId}`);
        const artistEl = document.getElementById(`music-artist-${appId}`);

        if (!audio || !musicState || !musicState.playlist[index]) return;

        musicState.currentTrack = index;
        const track = musicState.playlist[index];

        // Update UI
        if (titleEl) titleEl.textContent = track.title;
        if (artistEl) artistEl.textContent = track.artist || 'Unknown Artist';

        // Load and play track
        audio.src = `/api/files/music/${track.path}`;
        audio.play();
        musicState.isPlaying = true;

        // Update play button
        const playBtn = document.getElementById(`play-pause-${appId}`);
        if (playBtn) playBtn.textContent = '⏸️';
    }

    togglePlay(appId) {
        const audio = document.getElementById(`audio-player-${appId}`);
        const musicState = this.musicPlayers?.get(appId);
        const playBtn = document.getElementById(`play-pause-${appId}`);

        if (!audio || !musicState) return;

        if (musicState.isPlaying) {
            audio.pause();
            musicState.isPlaying = false;
            if (playBtn) playBtn.textContent = '▶️';
        } else {
            audio.play();
            musicState.isPlaying = true;
            if (playBtn) playBtn.textContent = '⏸️';
        }
    }

    prevTrack(appId) {
        const musicState = this.musicPlayers?.get(appId);
        if (!musicState || musicState.playlist.length === 0) return;

        musicState.currentTrack = (musicState.currentTrack - 1 + musicState.playlist.length) % musicState.playlist.length;
        this.playTrack(appId, musicState.currentTrack);
    }

    nextTrack(appId) {
        const musicState = this.musicPlayers?.get(appId);
        if (!musicState || musicState.playlist.length === 0) return;

        musicState.currentTrack = (musicState.currentTrack + 1) % musicState.playlist.length;
        this.playTrack(appId, musicState.currentTrack);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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

        // Clean up task manager interval if exists
        if (this.taskManagerIntervals?.has(appId)) {
            clearInterval(this.taskManagerIntervals.get(appId));
            this.taskManagerIntervals.delete(appId);
        }

        // Clean up music player
        if (this.musicPlayers?.has(appId)) {
            const audio = document.getElementById(`audio-player-${appId}`);
            if (audio) {
                audio.pause();
                audio.src = '';
            }
            this.musicPlayers.delete(appId);
        }

        // Clean up game if exists
        if (this.games && this.games.has(appId)) {
            const game = this.games.get(appId);
            if (game && typeof game.destroy === 'function') {
                game.destroy();
            }
            this.games.delete(appId);
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

        windowElement.style.transform = 'scale(0.1)';
        windowElement.style.opacity = '0';

        setTimeout(() => {
            windowElement.style.display = 'none';
        }, 200);

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
        windowElement.style.borderRadius = '20px';
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
                height: 56px;
                background: rgba(255, 255, 255, 0.08);
                backdrop-filter: blur(24px);
                border-top: 1px solid rgba(255, 255, 255, 0.2);
                display: flex;
                align-items: center;
                padding: 0 16px;
                z-index: 9999;
                gap: 8px;
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
                padding: 8px 16px;
                border: none;
                border-radius: 12px;
                background: ${isActive ? '#6366f1' : 'rgba(255, 255, 255, 0.1)'};
                color: ${isActive ? 'white' : '#ffffff'};
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                max-width: 160px;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                transition: all 0.2s ease;
                backdrop-filter: blur(12px);
                border: 1px solid ${isActive ? '#6366f1' : 'transparent'};
                opacity: ${isMinimized ? '0.6' : '1'};
            `;

            taskButton.textContent = config?.title || appId;

            taskButton.addEventListener('mouseenter', () => {
                if (!isActive) {
                    taskButton.style.background = 'rgba(255, 255, 255, 0.15)';
                }
            });

            taskButton.addEventListener('mouseleave', () => {
                if (!isActive) {
                    taskButton.style.background = 'rgba(255, 255, 255, 0.1)';
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
            gap: 8px;
            color: #ffffff;
            font-size: 12px;
        `;

        const clock = document.createElement('div');
        clock.id = 'systemTime';
        clock.style.cssText = `
            color: #ffffff;
            font-size: 12px;
            font-weight: 500;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            backdrop-filter: blur(12px);
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
                .window-btn::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    background: currentColor;
                    opacity: 0.1;
                    transition: opacity 0.15s ease;
                }
                
                .window-btn:hover::before {
                    opacity: 0.2;
                }
                
                .window-btn:active {
                    transform: scale(0.95);
                }
                
                .window {
                    pointer-events: auto;
                }
                
                .window:hover {
                    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
                }
                
                .window.active {
                    border-color: #6366f1;
                    box-shadow: 0 16px 48px rgba(99, 102, 241, 0.3);
                }
                
                /* Music player specific styles */
                .music-btn:hover {
                    transform: scale(1.1);
                    background: rgba(255, 255, 255, 0.2) !important;
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
        // Clean up all intervals
        if (this.taskManagerIntervals) {
            this.taskManagerIntervals.forEach(interval => clearInterval(interval));
            this.taskManagerIntervals.clear();
        }

        // Clean up music players
        if (this.musicPlayers) {
            this.musicPlayers.forEach((state, appId) => {
                const audio = document.getElementById(`audio-player-${appId}`);
                if (audio) {
                    audio.pause();
                    audio.src = '';
                }
            });
            this.musicPlayers.clear();
        }

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
window.WindowManager = WindowManager;
// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WindowManager;
}

console.log('🪟 Enhanced Window manager loaded successfully');