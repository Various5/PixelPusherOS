/**
 * Pixel Pusher OS - Settings & System Manager
 * Comprehensive system settings, task manager, and multimedia controls
 *
 * This module provides:
 * - System settings and preferences management
 * - Advanced task manager with process monitoring
 * - Integrated music player with playlist support
 * - Theme and appearance customization
 * - Performance monitoring and system information
 * - User preference persistence
 * - System utilities and tools
 */

class SettingsManager {
    constructor() {
        this.settings = new Map(); // Active settings windows
        this.activeTab = 'appearance';
        this.musicPlayer = {
            isPlaying: false,
            currentTrack: null,
            playlist: [],
            volume: 0.5,
            currentTime: 0,
            duration: 0,
            audio: null
        };
        this.taskManager = {
            processes: [],
            updateInterval: null,
            sortBy: 'cpu',
            sortOrder: 'desc'
        };
        this.systemMonitor = {
            cpuUsage: [],
            memoryUsage: [],
            networkStats: { sent: 0, received: 0 }
        };

        console.log('⚙️ Settings & System Manager initialized');
    }

    /**
     * Initialize settings system
     */
    async init() {
        try {
            // Load user preferences
            this.loadPreferences();

            // Initialize music player
            this.initializeMusicPlayer();

            // Initialize task manager
            this.initializeTaskManager();

            // Start system monitoring
            this.startSystemMonitoring();

            // Set up global settings shortcuts
            this.setupGlobalShortcuts();

            console.log('✅ Settings system ready');

        } catch (error) {
            console.error('❌ Settings initialization failed:', error);
        }
    }

    /**
     * Initialize a settings window
     */
    initializeWindow(appId) {
        const settingsContainer = document.getElementById(`settings-${appId}`);
        if (!settingsContainer) {
            console.error(`Settings container not found: ${appId}`);
            return;
        }

        // Create settings instance
        const settings = {
            id: appId,
            container: settingsContainer,
            sidebar: settingsContainer.querySelector('.settings-sidebar'),
            content: settingsContainer.querySelector('.settings-content'),
            activeTab: 'appearance'
        };

        // Store settings instance
        this.settings.set(appId, settings);

        // Set up settings-specific event handlers
        this.setupSettingsEventHandlers(settings);

        // Apply settings styling
        this.applySettingsStyling(settings);

        // Load initial content
        this.loadSettingsTab(settings, 'appearance');

        console.log(`⚙️ Settings window initialized: ${appId}`);
    }

    /**
     * Set up event handlers for settings window
     */
    setupSettingsEventHandlers(settings) {
        // Sidebar navigation
        settings.sidebar.addEventListener('click', (e) => {
            const navItem = e.target.closest('.settings-nav-item');
            if (navItem) {
                const section = navItem.dataset.section;
                this.switchSettingsTab(settings, section);
            }
        });

        // Handle settings form changes
        settings.content.addEventListener('change', (e) => {
            this.handleSettingChange(settings, e);
        });

        // Handle button clicks
        settings.content.addEventListener('click', (e) => {
            this.handleSettingAction(settings, e);
        });
    }

    /**
     * Apply styling to settings window
     */
    applySettingsStyling(settings) {
        // Style settings container
        settings.container.style.cssText = `
            display: flex;
            height: 100%;
            background: var(--background);
            font-family: var(--font-family);
        `;

        // Style sidebar
        settings.sidebar.style.cssText = `
            width: 200px;
            background: var(--surface-dark);
            border-right: 1px solid var(--border);
            padding: 16px 0;
            flex-shrink: 0;
        `;

        // Style sidebar items
        settings.sidebar.querySelectorAll('.settings-nav-item').forEach(item => {
            item.style.cssText = `
                padding: 12px 20px;
                cursor: pointer;
                color: var(--text-secondary);
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
                border-left: 3px solid transparent;
                display: flex;
                align-items: center;
                gap: 12px;
            `;

            item.addEventListener('mouseenter', () => {
                if (!item.classList.contains('active')) {
                    item.style.backgroundColor = 'var(--surface-light)';
                    item.style.color = 'var(--text-primary)';
                }
            });

            item.addEventListener('mouseleave', () => {
                if (!item.classList.contains('active')) {
                    item.style.backgroundColor = 'transparent';
                    item.style.color = 'var(--text-secondary)';
                }
            });
        });

        // Update active item
        this.updateActiveNavItem(settings, 'appearance');

        // Style content area
        settings.content.style.cssText = `
            flex: 1;
            padding: 24px;
            overflow-y: auto;
            background: var(--background);
        `;
    }

    /**
     * Switch settings tab
     */
    switchSettingsTab(settings, tabName) {
        settings.activeTab = tabName;
        this.updateActiveNavItem(settings, tabName);
        this.loadSettingsTab(settings, tabName);
    }

    /**
     * Update active navigation item
     */
    updateActiveNavItem(settings, tabName) {
        settings.sidebar.querySelectorAll('.settings-nav-item').forEach(item => {
            const isActive = item.dataset.section === tabName;
            item.classList.toggle('active', isActive);

            if (isActive) {
                item.style.backgroundColor = 'var(--primary)';
                item.style.color = 'white';
                item.style.borderLeftColor = 'var(--primary-light)';
            } else {
                item.style.backgroundColor = 'transparent';
                item.style.color = 'var(--text-secondary)';
                item.style.borderLeftColor = 'transparent';
            }
        });
    }

    /**
     * Load settings tab content
     */
    loadSettingsTab(settings, tabName) {
        let content = '';

        switch (tabName) {
            case 'appearance':
                content = this.generateAppearanceSettings();
                break;
            case 'system':
                content = this.generateSystemSettings();
                break;
            case 'games':
                content = this.generateGameSettings();
                break;
            case 'about':
                content = this.generateAboutContent();
                break;
            default:
                content = '<div>Settings section not found</div>';
        }

        settings.content.innerHTML = content;

        // Initialize tab-specific functionality
        setTimeout(() => {
            this.initializeTabFeatures(settings, tabName);
        }, 100);
    }

    /**
     * Generate appearance settings content
     */
    generateAppearanceSettings() {
        const currentTheme = this.getPreference('theme', 'default');
        const currentWallpaper = this.getPreference('wallpaper', '');
        const animationsEnabled = this.getPreference('animations', true);
        const fontSize = this.getPreference('fontSize', 14);

        return `
            <div class="settings-section">
                <h2>🎨 Appearance & Themes</h2>
                <p class="settings-description">Customize the look and feel of Pixel Pusher OS</p>
                
                <div class="settings-group">
                    <h3>Color Themes</h3>
                    <div class="theme-grid">
                        ${this.generateThemeOptions(currentTheme)}
                    </div>
                </div>
                
                <div class="settings-group">
                    <h3>Desktop Wallpaper</h3>
                    <div class="wallpaper-section">
                        <input type="file" id="wallpaper-upload" accept="image/*" style="display: none;">
                        <button class="btn secondary" onclick="document.getElementById('wallpaper-upload').click()">
                            📁 Upload Wallpaper
                        </button>
                        <button class="btn secondary" onclick="window.pixelPusher.modules.settings.clearWallpaper()">
                            🗑️ Clear Wallpaper
                        </button>
                    </div>
                    <div class="wallpaper-preview" id="wallpaper-preview">
                        ${currentWallpaper ? `<img src="${currentWallpaper}" alt="Current wallpaper">` : 'No wallpaper set'}
                    </div>
                </div>
                
                <div class="settings-group">
                    <h3>Interface Options</h3>
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox" ${animationsEnabled ? 'checked' : ''} 
                                   data-setting="animations">
                            Enable animations and transitions
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <label class="setting-label">
                            Font Size: <span id="fontSize-value">${fontSize}px</span>
                            <input type="range" min="12" max="20" value="${fontSize}" 
                                   data-setting="fontSize" class="setting-slider">
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox" ${this.getPreference('soundEnabled', true) ? 'checked' : ''} 
                                   data-setting="soundEnabled">
                            Enable sound effects
                        </label>
                    </div>
                </div>
                
                <div class="settings-group">
                    <h3>Visual Effects</h3>
                    <div class="effects-grid">
                        <button class="effect-btn" onclick="window.pixelPusher.modules.settings.startEffect('matrix')">
                            🟢 Matrix Rain
                        </button>
                        <button class="effect-btn" onclick="window.pixelPusher.modules.settings.startEffect('particles')">
                            ✨ Particles
                        </button>
                        <button class="effect-btn" onclick="window.pixelPusher.modules.settings.startEffect('stars')">
                            ⭐ Starfield
                        </button>
                        <button class="effect-btn" onclick="window.pixelPusher.modules.settings.startEffect('stop')">
                            ⏹️ Stop Effects
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate theme options
     */
    generateThemeOptions(currentTheme) {
        const themes = [
            { id: 'default', name: 'Default', color: '#00d9ff' },
            { id: 'blue', name: 'Ocean Blue', color: '#3498db' },
            { id: 'green', name: 'Forest Green', color: '#27ae60' },
            { id: 'red', name: 'Crimson Red', color: '#e74c3c' },
            { id: 'purple', name: 'Deep Purple', color: '#9b59b6' },
            { id: 'orange', name: 'Sunset Orange', color: '#e67e22' },
            { id: 'pink', name: 'Hot Pink', color: '#e91e63' },
            { id: 'cyan', name: 'Cyber Cyan', color: '#1abc9c' },
            { id: 'yellow', name: 'Electric Yellow', color: '#f1c40f' },
            { id: 'dark', name: 'Dark Mode', color: '#2c3e50' },
            { id: 'neon', name: 'Neon Glow', color: '#00ff41' },
            { id: 'matrix', name: 'Matrix Green', color: '#00ff41' }
        ];

        return themes.map(theme => `
            <div class="theme-option ${currentTheme === theme.id ? 'active' : ''}" 
                 data-theme="${theme.id}" 
                 onclick="window.pixelPusher.modules.settings.setTheme('${theme.id}')">
                <div class="theme-color" style="background: ${theme.color}"></div>
                <div class="theme-name">${theme.name}</div>
            </div>
        `).join('');
    }

    /**
     * Generate system settings content
     */
    generateSystemSettings() {
        return `
            <div class="settings-section">
                <h2>💻 System & Performance</h2>
                <p class="settings-description">Monitor system performance and manage processes</p>
                
                <div class="settings-tabs">
                    <button class="tab-btn active" onclick="window.pixelPusher.modules.settings.switchSystemTab('taskmanager')">
                        📊 Task Manager
                    </button>
                    <button class="tab-btn" onclick="window.pixelPusher.modules.settings.switchSystemTab('performance')">
                        📈 Performance
                    </button>
                    <button class="tab-btn" onclick="window.pixelPusher.modules.settings.switchSystemTab('storage')">
                        💾 Storage
                    </button>
                    <button class="tab-btn" onclick="window.pixelPusher.modules.settings.switchSystemTab('music')">
                        🎵 Music Player
                    </button>
                </div>
                
                <div id="system-tab-content">
                    ${this.generateTaskManagerContent()}
                </div>
            </div>
        `;
    }

    /**
     * Generate task manager content
     */
    generateTaskManagerContent() {
        const processes = this.getSystemProcesses();

        return `
            <div class="task-manager">
                <div class="task-manager-header">
                    <h3>Running Processes</h3>
                    <button class="btn primary" onclick="window.pixelPusher.modules.settings.refreshProcesses()">
                        🔄 Refresh
                    </button>
                </div>
                
                <div class="process-table">
                    <div class="process-header">
                        <div class="process-col name">Process Name</div>
                        <div class="process-col cpu">CPU %</div>
                        <div class="process-col memory">Memory</div>
                        <div class="process-col status">Status</div>
                        <div class="process-col actions">Actions</div>
                    </div>
                    
                    <div class="process-list" id="process-list">
                        ${processes.map(process => `
                            <div class="process-row" data-pid="${process.pid}">
                                <div class="process-col name">
                                    <span class="process-icon">${process.icon}</span>
                                    ${process.name}
                                </div>
                                <div class="process-col cpu">${process.cpu}%</div>
                                <div class="process-col memory">${process.memory}</div>
                                <div class="process-col status">
                                    <span class="status-badge ${process.status.toLowerCase()}">${process.status}</span>
                                </div>
                                <div class="process-col actions">
                                    <button class="btn-small danger" 
                                            onclick="window.pixelPusher.modules.settings.terminateProcess('${process.pid}')"
                                            ${process.critical ? 'disabled' : ''}>
                                        ${process.critical ? '🔒' : '⏹️'}
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="system-stats">
                    <div class="stat-card">
                        <h4>CPU Usage</h4>
                        <div class="stat-value">${this.getSystemCPU()}%</div>
                        <div class="stat-bar">
                            <div class="stat-fill" style="width: ${this.getSystemCPU()}%"></div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <h4>Memory Usage</h4>
                        <div class="stat-value">${this.getSystemMemory()}%</div>
                        <div class="stat-bar">
                            <div class="stat-fill" style="width: ${this.getSystemMemory()}%"></div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <h4>Active Windows</h4>
                        <div class="stat-value">${this.getActiveWindowCount()}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate performance monitor content
     */
    generatePerformanceContent() {
        return `
            <div class="performance-monitor">
                <h3>System Performance</h3>
                
                <div class="performance-charts">
                    <div class="chart-container">
                        <h4>CPU Usage History</h4>
                        <canvas id="cpu-chart" width="400" height="200"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <h4>Memory Usage History</h4>
                        <canvas id="memory-chart" width="400" height="200"></canvas>
                    </div>
                </div>
                
                <div class="performance-details">
                    <div class="detail-group">
                        <h4>System Information</h4>
                        <div class="detail-item">
                            <span>Browser:</span>
                            <span>${navigator.userAgent.split(' ')[0]}</span>
                        </div>
                        <div class="detail-item">
                            <span>Platform:</span>
                            <span>${navigator.platform}</span>
                        </div>
                        <div class="detail-item">
                            <span>Screen Resolution:</span>
                            <span>${screen.width}x${screen.height}</span>
                        </div>
                        <div class="detail-item">
                            <span>Color Depth:</span>
                            <span>${screen.colorDepth} bits</span>
                        </div>
                    </div>
                    
                    <div class="detail-group">
                        <h4>Performance Metrics</h4>
                        <div class="detail-item">
                            <span>JavaScript Heap:</span>
                            <span>${this.formatBytes(performance.memory?.usedJSHeapSize || 0)}</span>
                        </div>
                        <div class="detail-item">
                            <span>Load Time:</span>
                            <span>${Math.round(performance.now())}ms</span>
                        </div>
                        <div class="detail-item">
                            <span>Connection:</span>
                            <span>${navigator.connection?.effectiveType || 'Unknown'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate music player content
     */
    generateMusicPlayerContent() {
        return `
            <div class="music-player">
                <h3>🎵 Music Player</h3>
                
                <div class="player-main">
                    <div class="album-art">
                        <div class="album-placeholder">
                            🎵
                        </div>
                    </div>
                    
                    <div class="player-info">
                        <div class="track-title" id="track-title">
                            ${this.musicPlayer.currentTrack?.title || 'No track selected'}
                        </div>
                        <div class="track-artist" id="track-artist">
                            ${this.musicPlayer.currentTrack?.artist || 'Unknown Artist'}
                        </div>
                    </div>
                </div>
                
                <div class="player-controls">
                    <button class="control-btn" onclick="window.pixelPusher.modules.settings.musicPrevious()">
                        ⏮️
                    </button>
                    <button class="control-btn play-pause" id="play-pause-btn" 
                            onclick="window.pixelPusher.modules.settings.musicToggle()">
                        ${this.musicPlayer.isPlaying ? '⏸️' : '▶️'}
                    </button>
                    <button class="control-btn" onclick="window.pixelPusher.modules.settings.musicNext()">
                        ⏭️
                    </button>
                </div>
                
                <div class="player-progress">
                    <span class="time-current" id="time-current">0:00</span>
                    <div class="progress-bar" onclick="window.pixelPusher.modules.settings.seekTo(event)">
                        <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
                    </div>
                    <span class="time-total" id="time-total">0:00</span>
                </div>
                
                <div class="player-volume">
                    <span>🔊</span>
                    <input type="range" min="0" max="100" value="${this.musicPlayer.volume * 100}" 
                           class="volume-slider" onchange="window.pixelPusher.modules.settings.setVolume(this.value)">
                </div>
                
                <div class="playlist-section">
                    <h4>Playlist</h4>
                    <div class="playlist-controls">
                        <input type="file" id="music-upload" accept="audio/*" multiple style="display: none;">
                        <button class="btn secondary" onclick="document.getElementById('music-upload').click()">
                            📁 Add Music
                        </button>
                        <button class="btn secondary" onclick="window.pixelPusher.modules.settings.clearPlaylist()">
                            🗑️ Clear Playlist
                        </button>
                    </div>
                    
                    <div class="playlist" id="playlist">
                        ${this.generatePlaylistItems()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate playlist items
     */
    generatePlaylistItems() {
        if (this.musicPlayer.playlist.length === 0) {
            return '<div class="playlist-empty">No music in playlist. Add some music files to get started!</div>';
        }

        return this.musicPlayer.playlist.map((track, index) => `
            <div class="playlist-item ${this.musicPlayer.currentTrack === track ? 'active' : ''}" 
                 onclick="window.pixelPusher.modules.settings.playTrack(${index})">
                <div class="track-info">
                    <div class="track-name">${track.title}</div>
                    <div class="track-artist">${track.artist}</div>
                </div>
                <div class="track-duration">${this.formatTime(track.duration || 0)}</div>
            </div>
        `).join('');
    }

    /**
     * Generate game settings content
     */
    generateGameSettings() {
        const gameStats = window.pixelPusher?.modules?.games?.getStats() || {};

        return `
            <div class="settings-section">
                <h2>🎮 Games & High Scores</h2>
                <p class="settings-description">View your gaming achievements and adjust game settings</p>
                
                <div class="game-stats">
                    <h3>High Scores</h3>
                    <div class="highscore-grid">
                        ${Object.entries(gameStats.highScores || {}).map(([game, score]) => `
                            <div class="highscore-card">
                                <div class="game-icon">${this.getGameIcon(game)}</div>
                                <div class="game-name">${this.getGameName(game)}</div>
                                <div class="game-score">${score.toLocaleString()}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="settings-group">
                    <h3>Game Preferences</h3>
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox" ${this.getPreference('gameSounds', true) ? 'checked' : ''} 
                                   data-setting="gameSounds">
                            Enable game sound effects
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox" ${this.getPreference('gameParticles', true) ? 'checked' : ''} 
                                   data-setting="gameParticles">
                            Enable particle effects in games
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <label class="setting-label">
                            Game Difficulty: 
                            <select data-setting="gameDifficulty">
                                <option value="easy" ${this.getPreference('gameDifficulty', 'normal') === 'easy' ? 'selected' : ''}>Easy</option>
                                <option value="normal" ${this.getPreference('gameDifficulty', 'normal') === 'normal' ? 'selected' : ''}>Normal</option>
                                <option value="hard" ${this.getPreference('gameDifficulty', 'normal') === 'hard' ? 'selected' : ''}>Hard</option>
                            </select>
                        </label>
                    </div>
                </div>
                
                <div class="settings-group">
                    <h3>Game Actions</h3>
                    <button class="btn danger" onclick="window.pixelPusher.modules.settings.resetHighScores()">
                        🗑️ Reset All High Scores
                    </button>
                    <button class="btn secondary" onclick="window.pixelPusher.modules.settings.exportGameData()">
                        📤 Export Game Data
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Generate about content
     */
    generateAboutContent() {
        const stats = window.pixelPusher?.getStats() || {};

        return `
            <div class="settings-section">
                <h2>ℹ️ About Pixel Pusher OS</h2>
                
                <div class="about-header">
                    <div class="logo">🎨</div>
                    <div class="about-info">
                        <h1>Pixel Pusher OS</h1>
                        <p class="version">Version 2.0.0</p>
                        <p class="tagline">A Modern Web-Based Desktop Environment</p>
                    </div>
                </div>
                
                <div class="about-stats">
                    <div class="stat-item">
                        <span class="stat-label">Uptime:</span>
                        <span class="stat-value">${this.formatUptime(performance.now())}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Active Windows:</span>
                        <span class="stat-value">${stats.activeWindows || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Modules Loaded:</span>
                        <span class="stat-value">${stats.activeModules || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Current Theme:</span>
                        <span class="stat-value">${this.getPreference('theme', 'default')}</span>
                    </div>
                </div>
                
                <div class="about-features">
                    <h3>Features</h3>
                    <div class="feature-grid">
                        <div class="feature-item">
                            <div class="feature-icon">💻</div>
                            <div class="feature-text">Built-in Terminal with 50+ commands</div>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">📁</div>
                            <div class="feature-text">Advanced File Explorer with media support</div>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">🎮</div>
                            <div class="feature-text">Arcade Gaming Center with 4 games</div>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">🎨</div>
                            <div class="feature-text">12+ Customizable Themes</div>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">🪟</div>
                            <div class="feature-text">Professional Window Management</div>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">📊</div>
                            <div class="feature-text">System Monitoring & Task Manager</div>
                        </div>
                    </div>
                </div>
                
                <div class="about-tech">
                    <h3>Technology Stack</h3>
                    <div class="tech-list">
                        <span class="tech-item">Flask</span>
                        <span class="tech-item">JavaScript ES6+</span>
                        <span class="tech-item">HTML5 Canvas</span>
                        <span class="tech-item">CSS3</span>
                        <span class="tech-item">Web APIs</span>
                        <span class="tech-item">SQLAlchemy</span>
                    </div>
                </div>
                
                <div class="about-credits">
                    <h3>Credits</h3>
                    <p>Built with ❤️ for modern web browsers</p>
                    <p>© 2024 Pixel Pusher OS Team</p>
                    <p>Licensed under MIT License</p>
                </div>
            </div>
        `;
    }

    /**
     * Handle setting changes
     */
    handleSettingChange(settings, e) {
        const element = e.target;
        const settingName = element.dataset.setting;

        if (!settingName) return;

        let value;
        if (element.type === 'checkbox') {
            value = element.checked;
        } else if (element.type === 'range') {
            value = parseInt(element.value);
            // Update display value
            const valueDisplay = document.getElementById(`${settingName}-value`);
            if (valueDisplay) {
                valueDisplay.textContent = `${value}px`;
            }
        } else {
            value = element.value;
        }

        this.setPreference(settingName, value);
        this.applySettingChange(settingName, value);
    }

    /**
     * Apply setting change immediately
     */
    applySettingChange(settingName, value) {
        switch (settingName) {
            case 'theme':
                this.setTheme(value);
                break;
            case 'fontSize':
                document.documentElement.style.fontSize = `${value}px`;
                break;
            case 'animations':
                document.body.classList.toggle('no-animations', !value);
                break;
            case 'soundEnabled':
                if (window.pixelPusher?.modules?.games) {
                    window.pixelPusher.modules.games.soundEnabled = value;
                }
                break;
        }
    }

    /**
     * Handle setting actions (button clicks)
     */
    handleSettingAction(settings, e) {
        const button = e.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        if (action) {
            this[action]?.();
        }
    }

    /**
     * Set theme
     */
    setTheme(themeName) {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeName}`);

        this.setPreference('theme', themeName);

        // Update desktop manager
        if (window.pixelPusher?.modules?.desktop) {
            window.pixelPusher.modules.desktop.setTheme(themeName);
        }

        // Show notification
        if (window.pixelPusher) {
            window.pixelPusher.showNotification(`Theme changed to ${themeName}`, 'success');
        }
    }

    /**
     * Music player functions
     */
    musicToggle() {
        if (this.musicPlayer.isPlaying) {
            this.musicPause();
        } else {
            this.musicPlay();
        }
    }

    musicPlay() {
        if (this.musicPlayer.audio) {
            this.musicPlayer.audio.play();
            this.musicPlayer.isPlaying = true;
            this.updatePlayButton();
        }
    }

    musicPause() {
        if (this.musicPlayer.audio) {
            this.musicPlayer.audio.pause();
            this.musicPlayer.isPlaying = false;
            this.updatePlayButton();
        }
    }

    musicNext() {
        // Implementation for next track
        console.log('Next track');
    }

    musicPrevious() {
        // Implementation for previous track
        console.log('Previous track');
    }

    updatePlayButton() {
        const playBtn = document.getElementById('play-pause-btn');
        if (playBtn) {
            playBtn.textContent = this.musicPlayer.isPlaying ? '⏸️' : '▶️';
        }
    }

    /**
     * Get system processes (mock data)
     */
    getSystemProcesses() {
        return [
            { pid: 'system', name: 'System', icon: '⚙️', cpu: 2.1, memory: '45MB', status: 'Running', critical: true },
            { pid: 'desktop', name: 'Desktop Manager', icon: '🖥️', cpu: 1.5, memory: '32MB', status: 'Running', critical: true },
            { pid: 'terminal', name: 'Terminal', icon: '💻', cpu: 0.8, memory: '12MB', status: 'Running', critical: false },
            { pid: 'explorer', name: 'File Explorer', icon: '📁', cpu: 0.5, memory: '18MB', status: 'Running', critical: false },
            { pid: 'games', name: 'Game Engine', icon: '🎮', cpu: 3.2, memory: '67MB', status: 'Running', critical: false },
            { pid: 'audio', name: 'Audio System', icon: '🔊', cpu: 0.3, memory: '8MB', status: 'Running', critical: true }
        ];
    }

    getSystemCPU() {
        return Math.floor(Math.random() * 30) + 10; // Mock CPU usage
    }

    getSystemMemory() {
        return Math.floor(Math.random() * 40) + 30; // Mock memory usage
    }

    getActiveWindowCount() {
        return window.pixelPusher?.modules?.windows?.getStats().openWindows || 0;
    }

    /**
     * Utility functions
     */
    getGameIcon(gameType) {
        const icons = {
            'neonbreaker': '🏓',
            'galacticdefense': '🚀',
            'cyberblocks': '🧩',
            'quantumrunner': '🏃'
        };
        return icons[gameType] || '🎮';
    }

    getGameName(gameType) {
        const names = {
            'neonbreaker': 'Neon Breaker',
            'galacticdefense': 'Galactic Defense',
            'cyberblocks': 'Cyber Blocks',
            'quantumrunner': 'Quantum Runner'
        };
        return names[gameType] || gameType;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    /**
     * Preference management
     */
    getPreference(key, defaultValue) {
        if (window.pixelPusher?.modules?.state) {
            return window.pixelPusher.modules.state.getPreference(key, defaultValue);
        }
        return defaultValue;
    }

    setPreference(key, value) {
        if (window.pixelPusher?.modules?.state) {
            window.pixelPusher.modules.state.setPreference(key, value);
        }
    }

    /**
     * Initialize music player
     */
    initializeMusicPlayer() {
        // Set up audio event listeners
        console.log('🎵 Music player initialized');
    }

    /**
     * Initialize task manager
     */
    initializeTaskManager() {
        // Start periodic process updates
        this.taskManager.updateInterval = setInterval(() => {
            this.updateProcessList();
        }, 5000);
    }

    updateProcessList() {
        const processList = document.getElementById('process-list');
        if (processList) {
            // Update process information
            processList.innerHTML = this.getSystemProcesses().map(process => `
                <div class="process-row" data-pid="${process.pid}">
                    <div class="process-col name">
                        <span class="process-icon">${process.icon}</span>
                        ${process.name}
                    </div>
                    <div class="process-col cpu">${process.cpu}%</div>
                    <div class="process-col memory">${process.memory}</div>
                    <div class="process-col status">
                        <span class="status-badge ${process.status.toLowerCase()}">${process.status}</span>
                    </div>
                    <div class="process-col actions">
                        <button class="btn-small danger" 
                                onclick="window.pixelPusher.modules.settings.terminateProcess('${process.pid}')"
                                ${process.critical ? 'disabled' : ''}>
                            ${process.critical ? '🔒' : '⏹️'}
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    /**
     * Start system monitoring
     */
    startSystemMonitoring() {
        setInterval(() => {
            // Collect system metrics
            this.systemMonitor.cpuUsage.push(this.getSystemCPU());
            this.systemMonitor.memoryUsage.push(this.getSystemMemory());

            // Keep only last 60 data points
            if (this.systemMonitor.cpuUsage.length > 60) {
                this.systemMonitor.cpuUsage.shift();
                this.systemMonitor.memoryUsage.shift();
            }
        }, 1000);
    }

    /**
     * Switch system tab
     */
    switchSystemTab(tabName) {
        const content = document.getElementById('system-tab-content');
        if (!content) return;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        // Load tab content
        switch (tabName) {
            case 'taskmanager':
                content.innerHTML = this.generateTaskManagerContent();
                break;
            case 'performance':
                content.innerHTML = this.generatePerformanceContent();
                break;
            case 'music':
                content.innerHTML = this.generateMusicPlayerContent();
                break;
            default:
                content.innerHTML = '<div>Content not available</div>';
        }
    }

    /**
     * Initialize tab-specific features
     */
    initializeTabFeatures(settings, tabName) {
        switch (tabName) {
            case 'appearance':
                this.initializeAppearanceTab();
                break;
            case 'system':
                this.initializeSystemTab();
                break;
        }
    }

    initializeAppearanceTab() {
        // Set up wallpaper upload
        const wallpaperUpload = document.getElementById('wallpaper-upload');
        if (wallpaperUpload) {
            wallpaperUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const wallpaperUrl = e.target.result;
                        this.setWallpaper(wallpaperUrl);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    initializeSystemTab() {
        // Start task manager updates
        this.updateProcessList();
    }

    setWallpaper(url) {
        if (window.pixelPusher?.modules?.desktop) {
            window.pixelPusher.modules.desktop.setWallpaper(url);
            this.setPreference('wallpaper', url);
        }
    }

    clearWallpaper() {
        if (window.pixelPusher?.modules?.desktop) {
            window.pixelPusher.modules.desktop.setWallpaper(null);
            this.setPreference('wallpaper', '');
        }
    }

    /**
     * Load preferences
     */
    loadPreferences() {
        // Preferences are loaded through state manager
        console.log('📋 Settings preferences loaded');
    }

    setupGlobalShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Alt+S - Open settings
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                if (window.pixelPusher?.modules?.windows) {
                    window.pixelPusher.modules.windows.open('settings');
                }
            }
        });
    }

    getStats() {
        return {
            activeSettings: this.settings.size,
            musicPlayerStatus: this.musicPlayer.isPlaying,
            playlistLength: this.musicPlayer.playlist.length,
            monitoredProcesses: this.getSystemProcesses().length
        };
    }

    handleResize() {
        // Handle window resize for settings windows
        console.log('⚙️ Settings window resized');
    }

    destroy() {
        // Clean up intervals
        if (this.taskManager.updateInterval) {
            clearInterval(this.taskManager.updateInterval);
        }

        // Clean up settings windows
        this.settings.clear();

        console.log('⚙️ Settings Manager destroyed');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsManager;
}

console.log('⚙️ Settings & System manager loaded successfully');