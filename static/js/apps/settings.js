/**
 * Updated Settings Manager with 4 Themes
 * Light, Dark, Hacker, Rainbow themes with full customization
 */

class SettingsManager {
    constructor() {
        this.settings = new Map(); // Active settings windows
        this.activeTab = 'appearance';

        // Define the 4 main themes
        this.themes = {
            light: {
                name: 'Light',
                description: 'Clean light theme for daytime use',
                colors: {
                    '--background': '#ffffff',
                    '--surface': '#f8f9fa',
                    '--surface-light': '#e9ecef',
                    '--surface-dark': '#dee2e6',
                    '--text-primary': '#212529',
                    '--text-secondary': '#6c757d',
                    '--text-disabled': '#adb5bd',
                    '--primary': '#007bff',
                    '--primary-light': '#66b3ff',
                    '--secondary': '#6c757d',
                    '--success': '#28a745',
                    '--warning': '#ffc107',
                    '--error': '#dc3545',
                    '--border': '#dee2e6',
                    '--shadow': 'rgba(0, 0, 0, 0.1)'
                }
            },
            dark: {
                name: 'Dark',
                description: 'Sleek dark theme for nighttime productivity',
                colors: {
                    '--background': '#121212',
                    '--surface': '#1e1e1e',
                    '--surface-light': '#2d2d2d',
                    '--surface-dark': '#0a0a0a',
                    '--text-primary': '#ffffff',
                    '--text-secondary': '#b3b3b3',
                    '--text-disabled': '#666666',
                    '--primary': '#bb86fc',
                    '--primary-light': '#d4b3ff',
                    '--secondary': '#03dac6',
                    '--success': '#4caf50',
                    '--warning': '#ff9800',
                    '--error': '#f44336',
                    '--border': '#333333',
                    '--shadow': 'rgba(0, 0, 0, 0.3)'
                }
            },
            hacker: {
                name: 'Hacker',
                description: 'Matrix-inspired green on black theme',
                colors: {
                    '--background': '#000000',
                    '--surface': '#0a0a0a',
                    '--surface-light': '#1a1a1a',
                    '--surface-dark': '#000000',
                    '--text-primary': '#00ff41',
                    '--text-secondary': '#00cc33',
                    '--text-disabled': '#004d1a',
                    '--primary': '#00ff41',
                    '--primary-light': '#66ff80',
                    '--secondary': '#00d9ff',
                    '--success': '#00ff41',
                    '--warning': '#ffff00',
                    '--error': '#ff0040',
                    '--border': '#00ff41',
                    '--shadow': 'rgba(0, 255, 65, 0.2)'
                }
            },
            rainbow: {
                name: 'Rainbow',
                description: 'Vibrant rainbow theme with dynamic colors',
                colors: {
                    '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
                    '--surface': 'rgba(255, 255, 255, 0.1)',
                    '--surface-light': 'rgba(255, 255, 255, 0.2)',
                    '--surface-dark': 'rgba(0, 0, 0, 0.2)',
                    '--text-primary': '#ffffff',
                    '--text-secondary': '#f0f0f0',
                    '--text-disabled': '#cccccc',
                    '--primary': '#ff6b6b',
                    '--primary-light': '#ff8e8e',
                    '--secondary': '#4ecdc4',
                    '--success': '#55efc4',
                    '--warning': '#fdcb6e',
                    '--error': '#e84393',
                    '--border': 'rgba(255, 255, 255, 0.3)',
                    '--shadow': 'rgba(255, 255, 255, 0.1)'
                }
            }
        };

        console.log('⚙️ Settings Manager initialized');
    }

    /**
     * Initialize settings system
     */
    async init() {
        try {
            // Load user preferences
            this.loadPreferences();

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
            sidebar: null,
            content: null,
            activeTab: 'appearance'
        };

        // Create settings structure if it doesn't exist
        this.createSettingsStructure(settings);

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
     * Create settings structure if needed
     */
    createSettingsStructure(settings) {
        if (settings.container.children.length === 0) {
            settings.container.innerHTML = `
                <div class="settings-sidebar">
                    <div class="settings-nav-item active" data-section="appearance">
                        🎨 Appearance
                    </div>
                    <div class="settings-nav-item" data-section="system">
                        ⚙️ System
                    </div>
                    <div class="settings-nav-item" data-section="games">
                        🎮 Games
                    </div>
                    <div class="settings-nav-item" data-section="about">
                        ℹ️ About
                    </div>
                </div>
                <div class="settings-content" id="settings-content-${settings.id}">
                    Loading settings...
                </div>
            `;
        }

        settings.sidebar = settings.container.querySelector('.settings-sidebar');
        settings.content = settings.container.querySelector('.settings-content');
    }

    /**
     * Set up event handlers for settings window
     */
    setupSettingsEventHandlers(settings) {
        // Sidebar navigation
        if (settings.sidebar) {
            settings.sidebar.addEventListener('click', (e) => {
                const navItem = e.target.closest('.settings-nav-item');
                if (navItem) {
                    const section = navItem.dataset.section;
                    this.switchSettingsTab(settings, section);
                }
            });
        }

        // Handle settings form changes
        if (settings.content) {
            settings.content.addEventListener('change', (e) => {
                this.handleSettingChange(settings, e);
            });

            // Handle button clicks
            settings.content.addEventListener('click', (e) => {
                this.handleSettingAction(settings, e);
            });
        }
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            border-radius: 8px;
            overflow: hidden;
        `;

        // Style sidebar
        if (settings.sidebar) {
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
                    user-select: none;
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
        }

        // Update active item
        this.updateActiveNavItem(settings, 'appearance');

        // Style content area
        if (settings.content) {
            settings.content.style.cssText = `
                flex: 1;
                padding: 24px;
                overflow-y: auto;
                background: var(--background);
            `;
        }
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
        if (!settings.sidebar) return;

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

        if (settings.content) {
            settings.content.innerHTML = content;
        }

        // Initialize tab-specific functionality
        setTimeout(() => {
            this.initializeTabFeatures(settings, tabName);
        }, 100);
    }

    /**
     * Generate appearance settings content
     */
    generateAppearanceSettings() {
        const currentTheme = this.getPreference('theme', 'dark');
        const animationsEnabled = this.getPreference('animations', true);
        const fontSize = this.getPreference('fontSize', 14);

        return `
            <div class="settings-section">
                <h2 style="color: var(--text-primary); margin-bottom: 20px;">🎨 Appearance & Themes</h2>
                <p style="color: var(--text-secondary); margin-bottom: 30px;">Customize the look and feel of Pixel Pusher OS</p>
                
                <div class="settings-group" style="margin-bottom: 30px;">
                    <h3 style="color: var(--text-primary); margin-bottom: 15px;">Color Themes</h3>
                    <div class="theme-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                        ${this.generateThemeOptions(currentTheme)}
                    </div>
                </div>
                
                <div class="settings-group" style="margin-bottom: 30px;">
                    <h3 style="color: var(--text-primary); margin-bottom: 15px;">Interface Options</h3>
                    
                    <div class="setting-item" style="margin-bottom: 15px;">
                        <label class="setting-label" style="display: flex; align-items: center; gap: 10px; color: var(--text-primary); cursor: pointer;">
                            <input type="checkbox" ${animationsEnabled ? 'checked' : ''} 
                                   data-setting="animations" style="margin: 0;">
                            Enable animations and transitions
                        </label>
                    </div>
                    
                    <div class="setting-item" style="margin-bottom: 15px;">
                        <label class="setting-label" style="color: var(--text-primary);">
                            Font Size: <span id="fontSize-value">${fontSize}px</span>
                            <input type="range" min="12" max="20" value="${fontSize}" 
                                   data-setting="fontSize" class="setting-slider" style="width: 100%; margin-top: 5px;">
                        </label>
                    </div>
                    
                    <div class="setting-item" style="margin-bottom: 15px;">
                        <label class="setting-label" style="display: flex; align-items: center; gap: 10px; color: var(--text-primary); cursor: pointer;">
                            <input type="checkbox" ${this.getPreference('soundEnabled', true) ? 'checked' : ''} 
                                   data-setting="soundEnabled" style="margin: 0;">
                            Enable sound effects
                        </label>
                    </div>
                </div>
                
                <div class="settings-group">
                    <h3 style="color: var(--text-primary); margin-bottom: 15px;">Visual Effects</h3>
                    <div class="effects-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                        <button class="effect-btn" onclick="window.pixelPusher.modules.settings.resetToDefaults()" style="
                            padding: 10px 15px;
                            background: var(--primary);
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">
                            🔄 Reset to Defaults
                        </button>
                        <button class="effect-btn" onclick="window.pixelPusher.modules.settings.exportSettings()" style="
                            padding: 10px 15px;
                            background: var(--secondary);
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">
                            📤 Export Settings
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
        return Object.entries(this.themes).map(([themeId, theme]) => `
            <div class="theme-option ${currentTheme === themeId ? 'active' : ''}" 
                 data-theme="${themeId}" 
                 onclick="window.pixelPusher.modules.settings.setTheme('${themeId}')"
                 style="
                    padding: 15px;
                    background: var(--surface);
                    border: 2px solid ${currentTheme === themeId ? 'var(--primary)' : 'var(--border)'};
                    border-radius: 8px;
                    cursor: pointer;
                    text-align: center;
                    transition: all 0.2s;
                    position: relative;
                    overflow: hidden;
                 "
                 onmouseover="this.style.transform='scale(1.05)'"
                 onmouseout="this.style.transform='scale(1)'">
                <div class="theme-preview" style="
                    width: 100%;
                    height: 40px;
                    border-radius: 4px;
                    margin-bottom: 10px;
                    ${this.getThemePreviewStyle(themeId)}
                "></div>
                <div class="theme-name" style="font-weight: 600; color: var(--text-primary);">${theme.name}</div>
                <div class="theme-description" style="font-size: 12px; color: var(--text-secondary); margin-top: 5px;">${theme.description}</div>
                ${currentTheme === themeId ? '<div style="position: absolute; top: 5px; right: 5px; color: var(--primary);">✓</div>' : ''}
            </div>
        `).join('');
    }

    /**
     * Get theme preview style
     */
    getThemePreviewStyle(themeId) {
        const theme = this.themes[themeId];
        if (themeId === 'rainbow') {
            return `background: ${theme.colors['--background']};`;
        } else {
            return `background: linear-gradient(45deg, ${theme.colors['--background']}, ${theme.colors['--surface']}, ${theme.colors['--primary']});`;
        }
    }

    /**
     * Generate system settings content
     */
    generateSystemSettings() {
        return `
            <div class="settings-section">
                <h2 style="color: var(--text-primary); margin-bottom: 20px;">💻 System & Performance</h2>
                <p style="color: var(--text-secondary); margin-bottom: 30px;">Monitor system performance and manage settings</p>
                
                <div class="settings-group" style="margin-bottom: 30px;">
                    <h3 style="color: var(--text-primary); margin-bottom: 15px;">System Information</h3>
                    <div class="system-info" style="background: var(--surface); padding: 20px; border-radius: 8px; border: 1px solid var(--border);">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                            <div>
                                <strong style="color: var(--text-primary);">Browser:</strong>
                                <div style="color: var(--text-secondary);">${navigator.userAgent.split(' ')[0]}</div>
                            </div>
                            <div>
                                <strong style="color: var(--text-primary);">Platform:</strong>
                                <div style="color: var(--text-secondary);">${navigator.platform}</div>
                            </div>
                            <div>
                                <strong style="color: var(--text-primary);">Screen:</strong>
                                <div style="color: var(--text-secondary);">${screen.width}x${screen.height}</div>
                            </div>
                            <div>
                                <strong style="color: var(--text-primary);">Memory:</strong>
                                <div style="color: var(--text-secondary);">${Math.round(performance.memory?.usedJSHeapSize / 1024 / 1024) || 'N/A'} MB</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="settings-group" style="margin-bottom: 30px;">
                    <h3 style="color: var(--text-primary); margin-bottom: 15px;">Performance</h3>
                    <div class="performance-info" style="background: var(--surface); padding: 20px; border-radius: 8px; border: 1px solid var(--border);">
                        <div>
                            <strong style="color: var(--text-primary);">Uptime:</strong>
                            <span style="color: var(--text-secondary);">${this.formatUptime(performance.now())}</span>
                        </div>
                        <div style="margin-top: 10px;">
                            <strong style="color: var(--text-primary);">Active Windows:</strong>
                            <span style="color: var(--text-secondary);">${window.pixelPusher?.modules?.windows?.getStats().openWindows || 0}</span>
                        </div>
                    </div>
                </div>
                
                <div class="settings-group">
                    <h3 style="color: var(--text-primary); margin-bottom: 15px;">System Actions</h3>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="window.pixelPusher.modules.settings.clearCache()" style="
                            padding: 10px 15px;
                            background: var(--warning);
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                        ">🗑️ Clear Cache</button>
                        <button onclick="window.pixelPusher.modules.settings.reloadApp()" style="
                            padding: 10px 15px;
                            background: var(--primary);
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                        ">🔄 Reload App</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate game settings content
     */
    generateGameSettings() {
        return `
            <div class="settings-section">
                <h2 style="color: var(--text-primary); margin-bottom: 20px;">🎮 Games & Entertainment</h2>
                <p style="color: var(--text-secondary); margin-bottom: 30px;">Configure games and view achievements</p>
                
                <div class="settings-group" style="margin-bottom: 30px;">
                    <h3 style="color: var(--text-primary); margin-bottom: 15px;">Available Games</h3>
                    <div class="games-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                        <div class="game-card" style="background: var(--surface); padding: 15px; border-radius: 8px; border: 1px solid var(--border); text-align: center;">
                            <div style="font-size: 32px; margin-bottom: 10px;">🐍</div>
                            <div style="font-weight: 600; color: var(--text-primary);">Snake Game</div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin: 5px 0;">Classic arcade game</div>
                            <button onclick="window.pixelPusher.modules.windows.open('snake')" style="
                                padding: 5px 10px;
                                background: var(--primary);
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                            ">Play Now</button>
                        </div>
                        
                        <div class="game-card" style="background: var(--surface); padding: 15px; border-radius: 8px; border: 1px solid var(--border); text-align: center;">
                            <div style="font-size: 32px; margin-bottom: 10px;">🧩</div>
                            <div style="font-weight: 600; color: var(--text-primary);">CyberBlocks</div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin: 5px 0;">Futuristic Tetris</div>
                            <button onclick="window.pixelPusher.modules.windows.open('tetris')" style="
                                padding: 5px 10px;
                                background: var(--primary);
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                            ">Play Now</button>
                        </div>
                        
                        <div class="game-card" style="background: var(--surface); padding: 15px; border-radius: 8px; border: 1px solid var(--border); text-align: center;">
                            <div style="font-size: 32px; margin-bottom: 10px;">🧠</div>
                            <div style="font-weight: 600; color: var(--text-primary);">Memory Match</div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin: 5px 0;">Card matching game</div>
                            <button onclick="window.pixelPusher.modules.windows.open('memory')" style="
                                padding: 5px 10px;
                                background: var(--primary);
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                            ">Play Now</button>
                        </div>
                        
                        <div class="game-card" style="background: var(--surface); padding: 15px; border-radius: 8px; border: 1px solid var(--border); text-align: center;">
                            <div style="font-size: 32px; margin-bottom: 10px;">🦕</div>
                            <div style="font-weight: 600; color: var(--text-primary);">Dino Runner</div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin: 5px 0;">Endless runner</div>
                            <button onclick="window.pixelPusher.modules.windows.open('dino')" style="
                                padding: 5px 10px;
                                background: var(--primary);
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                            ">Play Now</button>
                        </div>
                    </div>
                </div>
                
                <div class="settings-group">
                    <h3 style="color: var(--text-primary); margin-bottom: 15px;">Game Preferences</h3>
                    <div class="setting-item" style="margin-bottom: 15px;">
                        <label class="setting-label" style="display: flex; align-items: center; gap: 10px; color: var(--text-primary); cursor: pointer;">
                            <input type="checkbox" ${this.getPreference('gameSounds', true) ? 'checked' : ''} 
                                   data-setting="gameSounds" style="margin: 0;">
                            Enable game sound effects
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate about content
     */
    generateAboutContent() {
        return `
            <div class="settings-section">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="font-size: 64px; margin-bottom: 15px;">🎨</div>
                    <h1 style="color: var(--text-primary); margin-bottom: 10px;">Pixel Pusher OS</h1>
                    <p style="color: var(--text-secondary); font-size: 18px;">Version 2.0.0</p>
                    <p style="color: var(--text-secondary);">A Modern Web-Based Desktop Environment</p>
                </div>
                
                <div class="about-stats" style="background: var(--surface); padding: 20px; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 30px;">
                    <h3 style="color: var(--text-primary); margin-bottom: 15px;">System Stats</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                        <div>
                            <strong style="color: var(--text-primary);">Uptime:</strong>
                            <div style="color: var(--text-secondary);">${this.formatUptime(performance.now())}</div>
                        </div>
                        <div>
                            <strong style="color: var(--text-primary);">Active Windows:</strong>
                            <div style="color: var(--text-secondary);">${window.pixelPusher?.modules?.windows?.getStats().openWindows || 0}</div>
                        </div>
                        <div>
                            <strong style="color: var(--text-primary);">Current Theme:</strong>
                            <div style="color: var(--text-secondary);">${this.getPreference('theme', 'dark')}</div>
                        </div>
                        <div>
                            <strong style="color: var(--text-primary);">Build:</strong>
                            <div style="color: var(--text-secondary);">Production</div>
                        </div>
                    </div>
                </div>
                
                <div class="about-credits" style="text-align: center; color: var(--text-secondary);">
                    <p>Built with modern web technologies</p>
                    <p>Flask • JavaScript • HTML5 • CSS3</p>
                    <p style="margin-top: 20px;">© 2024 Pixel Pusher OS</p>
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
            case 'fontSize':
                document.documentElement.style.fontSize = `${value}px`;
                break;
            case 'animations':
                document.body.classList.toggle('no-animations', !value);
                break;
            case 'soundEnabled':
                // Apply to games if available
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
        if (!this.themes[themeName]) {
            console.error(`Unknown theme: ${themeName}`);
            return;
        }

        const theme = this.themes[themeName];

        // Apply CSS custom properties
        Object.entries(theme.colors).forEach(([property, value]) => {
            document.documentElement.style.setProperty(property, value);
        });

        // Update body class
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeName}`);

        this.setPreference('theme', themeName);

        // Show notification
        if (window.pixelPusher) {
            window.pixelPusher.showNotification(`Theme changed to ${theme.name}`, 'success');
        }

        console.log(`🎨 Theme changed to: ${themeName}`);
    }

    /**
     * Utility functions
     */
    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    resetToDefaults() {
        if (confirm('Reset all settings to defaults?')) {
            localStorage.removeItem('pixelpusher_preferences');
            this.setTheme('dark');
            window.location.reload();
        }
    }

    exportSettings() {
        const settings = JSON.stringify({
            theme: this.getPreference('theme'),
            fontSize: this.getPreference('fontSize'),
            animations: this.getPreference('animations'),
            soundEnabled: this.getPreference('soundEnabled')
        }, null, 2);

        const blob = new Blob([settings], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pixelpusher-settings.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    clearCache() {
        if (confirm('Clear application cache? This will reload the page.')) {
            localStorage.clear();
            window.location.reload();
        }
    }

    reloadApp() {
        window.location.reload();
    }

    /**
     * Preference management
     */
    getPreference(key, defaultValue) {
        try {
            const prefs = JSON.parse(localStorage.getItem('pixelpusher_preferences') || '{}');
            return prefs[key] !== undefined ? prefs[key] : defaultValue;
        } catch {
            return defaultValue;
        }
    }

    setPreference(key, value) {
        try {
            const prefs = JSON.parse(localStorage.getItem('pixelpusher_preferences') || '{}');
            prefs[key] = value;
            localStorage.setItem('pixelpusher_preferences', JSON.stringify(prefs));
        } catch (error) {
            console.error('Failed to save preference:', error);
        }
    }

    loadPreferences() {
        // Apply saved theme
        const savedTheme = this.getPreference('theme', 'dark');
        this.setTheme(savedTheme);

        // Apply other preferences
        const fontSize = this.getPreference('fontSize', 14);
        document.documentElement.style.fontSize = `${fontSize}px`;

        const animations = this.getPreference('animations', true);
        document.body.classList.toggle('no-animations', !animations);

        console.log('📋 Settings preferences loaded');
    }

    initializeTabFeatures(settings, tabName) {
        // Tab-specific initialization can go here
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
            currentTheme: this.getPreference('theme', 'dark'),
            availableThemes: Object.keys(this.themes)
        };
    }

    handleResize() {
        console.log('⚙️ Settings window resized');
    }

    destroy() {
        this.settings.clear();
        console.log('⚙️ Settings Manager destroyed');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsManager;
}

console.log('⚙️ Updated Settings manager loaded successfully');