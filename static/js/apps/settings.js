/**
 * Enhanced Settings Manager - Complete Implementation
 * Advanced customization with wallpapers, performance profiles, and visual effects
 */

class SettingsManager {
    constructor() {
        this.settings = new Map(); // Active settings windows
        this.activeTab = 'appearance';

        // Define the 4 main themes plus additional ones
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

        console.log('⚙️ Enhanced Settings Manager initialized');
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
        const windowOpacity = this.getPreference('windowOpacity', 95);
        const desktopBlur = this.getPreference('desktopBlur', 20);
        const iconSize = this.getPreference('iconSize', 80);
        const windowRadius = this.getPreference('windowRadius', 20);
        const shadowIntensity = this.getPreference('shadowIntensity', 50);
        const currentWallpaper = this.getPreference('wallpaper', 'default');

        return `
            <div class="settings-section">
                <h2 style="color: var(--text-primary); margin-bottom: 20px;">🎨 Appearance & Visual Settings</h2>
                <p style="color: var(--text-secondary); margin-bottom: 30px;">Customize every aspect of your desktop environment</p>
                
                <!-- Performance Profiles -->
                <div class="settings-group" style="margin-bottom: 30px;">
                    <h3 style="color: var(--text-primary); margin-bottom: 15px;">⚡ Performance Profiles</h3>
                    <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 15px;">Choose a preset that matches your device and preferences</p>
                    <div class="profile-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px;">
                        ${this.generatePerformanceProfiles()}
                    </div>
                </div>
                
                <!-- Color Themes -->
                <div class="settings-group" style="margin-bottom: 30px;">
                    <h3 style="color: var(--text-primary); margin-bottom: 15px;">🌈 Color Themes</h3>
                    <div class="theme-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                        ${this.generateThemeOptions(currentTheme)}
                    </div>
                </div>
                
                <!-- Wallpaper Settings -->
                <div class="settings-group" style="margin-bottom: 30px;">
                    <h3 style="color: var(--text-primary); margin-bottom: 15px;">🖼️ Desktop Wallpaper</h3>
                    <div class="wallpaper-section">
                        <div class="wallpaper-preview" style="
                            width: 100%; height: 120px; border-radius: 8px; margin-bottom: 15px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            background-size: cover; background-position: center;
                            border: 2px solid var(--border); position: relative;
                            overflow: hidden;
                        ">
                            <div style="position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.7); 
                                       color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">
                                Preview
                            </div>
                        </div>
                        
                        <div class="wallpaper-options" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px;">
                            ${this.generateWallpaperOptions(currentWallpaper)}
                        </div>
                        
                        <div style="display: flex; gap: 10px;">
                            <button onclick="window.pixelPusher.modules.settings.uploadWallpaper()" style="
                                flex: 1; padding: 10px; background: var(--primary); color: white;
                                border: none; border-radius: 6px; cursor: pointer; font-size: 13px;
                            ">📁 Upload Custom</button>
                            <button onclick="window.pixelPusher.modules.settings.resetWallpaper()" style="
                                padding: 10px 15px; background: var(--secondary); color: white;
                                border: none; border-radius: 6px; cursor: pointer; font-size: 13px;
                            ">🔄 Reset</button>
                        </div>
                    </div>
                </div>
                
                <!-- Visual Effects -->
                <div class="settings-group" style="margin-bottom: 30px;">
                    <h3 style="color: var(--text-primary); margin-bottom: 15px;">✨ Visual Effects</h3>
                    
                    <div class="setting-item" style="margin-bottom: 20px;">
                        <label class="setting-label" style="color: var(--text-primary); margin-bottom: 8px; display: block;">
                            Window Transparency: <span id="windowOpacity-value">${windowOpacity}%</span>
                        </label>
                        <input type="range" min="60" max="100" value="${windowOpacity}" 
                               data-setting="windowOpacity" class="setting-slider" style="width: 100%;">
                        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
                            Controls how transparent windows appear
                        </div>
                    </div>
                    
                    <div class="setting-item" style="margin-bottom: 20px;">
                        <label class="setting-label" style="color: var(--text-primary); margin-bottom: 8px; display: block;">
                            Desktop Blur Effect: <span id="desktopBlur-value">${desktopBlur}px</span>
                        </label>
                        <input type="range" min="0" max="50" value="${desktopBlur}" 
                               data-setting="desktopBlur" class="setting-slider" style="width: 100%;">
                        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
                            Background blur intensity behind windows
                        </div>
                    </div>
                    
                    <div class="setting-item" style="margin-bottom: 20px;">
                        <label class="setting-label" style="color: var(--text-primary); margin-bottom: 8px; display: block;">
                            Window Corner Radius: <span id="windowRadius-value">${windowRadius}px</span>
                        </label>
                        <input type="range" min="0" max="30" value="${windowRadius}" 
                               data-setting="windowRadius" class="setting-slider" style="width: 100%;">
                        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
                            Roundness of window corners
                        </div>
                    </div>
                    
                    <div class="setting-item" style="margin-bottom: 20px;">
                        <label class="setting-label" style="color: var(--text-primary); margin-bottom: 8px; display: block;">
                            Shadow Intensity: <span id="shadowIntensity-value">${shadowIntensity}%</span>
                        </label>
                        <input type="range" min="0" max="100" value="${shadowIntensity}" 
                               data-setting="shadowIntensity" class="setting-slider" style="width: 100%;">
                        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
                            Depth and intensity of window shadows
                        </div>
                    </div>
                </div>
                
                <!-- Interface Settings -->
                <div class="settings-group" style="margin-bottom: 30px;">
                    <h3 style="color: var(--text-primary); margin-bottom: 15px;">🖱️ Interface Settings</h3>
                    
                    <div class="setting-item" style="margin-bottom: 20px;">
                        <label class="setting-label" style="color: var(--text-primary); margin-bottom: 8px; display: block;">
                            Desktop Icon Size: <span id="iconSize-value">${iconSize}px</span>
                        </label>
                        <input type="range" min="60" max="120" value="${iconSize}" 
                               data-setting="iconSize" class="setting-slider" style="width: 100%;">
                        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
                            Size of desktop icons
                        </div>
                    </div>
                    
                    <div class="setting-item" style="margin-bottom: 20px;">
                        <label class="setting-label" style="color: var(--text-primary); margin-bottom: 8px; display: block;">
                            Font Size: <span id="fontSize-value">${fontSize}px</span>
                        </label>
                        <input type="range" min="12" max="20" value="${fontSize}" 
                               data-setting="fontSize" class="setting-slider" style="width: 100%;">
                        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
                            System font size for UI elements
                        </div>
                    </div>
                    
                    <div class="setting-item" style="margin-bottom: 15px;">
                        <label class="setting-label" style="display: flex; align-items: center; gap: 10px; color: var(--text-primary); cursor: pointer;">
                            <input type="checkbox" ${animationsEnabled ? 'checked' : ''} 
                                   data-setting="animations" style="margin: 0;">
                            Enable smooth animations and transitions
                        </label>
                    </div>
                    
                    <div class="setting-item" style="margin-bottom: 15px;">
                        <label class="setting-label" style="display: flex; align-items: center; gap: 10px; color: var(--text-primary); cursor: pointer;">
                            <input type="checkbox" ${this.getPreference('soundEnabled', true) ? 'checked' : ''} 
                                   data-setting="soundEnabled" style="margin: 0;">
                            Enable system sound effects
                        </label>
                    </div>
                    
                    <div class="setting-item" style="margin-bottom: 15px;">
                        <label class="setting-label" style="display: flex; align-items: center; gap: 10px; color: var(--text-primary); cursor: pointer;">
                            <input type="checkbox" ${this.getPreference('particleEffects', true) ? 'checked' : ''} 
                                   data-setting="particleEffects" style="margin: 0;">
                            Enable particle effects and visual flair
                        </label>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="settings-group">
                    <h3 style="color: var(--text-primary); margin-bottom: 15px;">🔧 Configuration Tools</h3>
                    <div class="action-buttons" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                        <button class="action-btn" onclick="window.pixelPusher.modules.settings.resetToDefaults()" style="
                            padding: 12px 15px; background: var(--warning); color: white;
                            border: none; border-radius: 6px; cursor: pointer; font-size: 13px;
                            transition: all 0.2s; font-weight: 500;
                        ">🔄 Reset All Settings</button>
                        
                        <button class="action-btn" onclick="window.pixelPusher.modules.settings.exportSettings()" style="
                            padding: 12px 15px; background: var(--secondary); color: white;
                            border: none; border-radius: 6px; cursor: pointer; font-size: 13px;
                            transition: all 0.2s; font-weight: 500;
                        ">📤 Export Settings</button>
                        
                        <button class="action-btn" onclick="window.pixelPusher.modules.settings.importSettings()" style="
                            padding: 12px 15px; background: var(--success); color: white;
                            border: none; border-radius: 6px; cursor: pointer; font-size: 13px;
                            transition: all 0.2s; font-weight: 500;
                        ">📥 Import Settings</button>
                        
                        <button class="action-btn" onclick="window.pixelPusher.modules.settings.applyOptimalSettings()" style="
                            padding: 12px 15px; background: var(--primary); color: white;
                            border: none; border-radius: 6px; cursor: pointer; font-size: 13px;
                            transition: all 0.2s; font-weight: 500;
                        ">⚡ Auto-Optimize</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate performance profiles
     */
    generatePerformanceProfiles() {
        const profiles = {
            'power-saver': {
                name: 'Power Saver',
                icon: '🔋',
                description: 'Minimal effects for longer battery life',
                settings: {
                    animations: false,
                    windowOpacity: 100,
                    desktopBlur: 0,
                    shadowIntensity: 20,
                    particleEffects: false
                }
            },
            'balanced': {
                name: 'Balanced',
                icon: '⚖️',
                description: 'Good balance of performance and visuals',
                settings: {
                    animations: true,
                    windowOpacity: 95,
                    desktopBlur: 20,
                    shadowIntensity: 50,
                    particleEffects: true
                }
            },
            'high-performance': {
                name: 'High Performance',
                icon: '🚀',
                description: 'Prioritize speed over visual effects',
                settings: {
                    animations: false,
                    windowOpacity: 100,
                    desktopBlur: 5,
                    shadowIntensity: 30,
                    particleEffects: false
                }
            },
            'ultimate-visual': {
                name: 'Ultimate Visual',
                icon: '✨',
                description: 'Maximum eye candy and effects',
                settings: {
                    animations: true,
                    windowOpacity: 85,
                    desktopBlur: 40,
                    shadowIntensity: 80,
                    particleEffects: true
                }
            },
            'gaming-mode': {
                name: 'Gaming Mode',
                icon: '🎮',
                description: 'Optimized for gaming performance',
                settings: {
                    animations: false,
                    windowOpacity: 100,
                    desktopBlur: 0,
                    shadowIntensity: 0,
                    particleEffects: false
                }
            }
        };

        const currentProfile = this.getPreference('performanceProfile', 'balanced');

        return Object.entries(profiles).map(([profileId, profile]) => `
            <div class="profile-option ${currentProfile === profileId ? 'active' : ''}" 
                 onclick="window.pixelPusher.modules.settings.applyPerformanceProfile('${profileId}')"
                 style="
                    padding: 12px;
                    background: var(--surface);
                    border: 2px solid ${currentProfile === profileId ? 'var(--primary)' : 'var(--border)'};
                    border-radius: 8px;
                    cursor: pointer;
                    text-align: center;
                    transition: all 0.2s;
                    position: relative;
                 "
                 onmouseover="this.style.transform='scale(1.02)'"
                 onmouseout="this.style.transform='scale(1)'">
                <div style="font-size: 24px; margin-bottom: 8px;">${profile.icon}</div>
                <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${profile.name}</div>
                <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.3;">${profile.description}</div>
                ${currentProfile === profileId ? '<div style="position: absolute; top: 8px; right: 8px; color: var(--primary); font-size: 14px;">✓</div>' : ''}
            </div>
        `).join('');
    }

    /**
     * Generate wallpaper options
     */
    generateWallpaperOptions(currentWallpaper) {
        const wallpapers = {
            'default': {
                name: 'Default Gradient',
                preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            },
            'aurora': {
                name: 'Aurora',
                preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
            },
            'sunset': {
                name: 'Sunset',
                preview: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)'
            },
            'ocean': {
                name: 'Ocean',
                preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            },
            'forest': {
                name: 'Forest',
                preview: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)'
            },
            'space': {
                name: 'Space',
                preview: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)'
            },
            'cyberpunk': {
                name: 'Cyberpunk',
                preview: 'linear-gradient(135deg, #0f0f23 0%, #1a0f23 50%, #230f23 100%)'
            },
            'minimal': {
                name: 'Minimal',
                preview: '#2c3e50'
            },
            'rainbow': {
                name: 'Rainbow',
                preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)'
            }
        };

        return Object.entries(wallpapers).map(([wallpaperId, wallpaper]) => `
            <div class="wallpaper-option ${currentWallpaper === wallpaperId ? 'active' : ''}" 
                 onclick="window.pixelPusher.modules.settings.setWallpaper('${wallpaperId}')"
                 style="
                    height: 60px;
                    background: ${wallpaper.preview};
                    border: 2px solid ${currentWallpaper === wallpaperId ? 'var(--primary)' : 'var(--border)'};
                    border-radius: 6px;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.2s;
                 "
                 title="${wallpaper.name}"
                 onmouseover="this.style.transform='scale(1.05)'"
                 onmouseout="this.style.transform='scale(1)'">
                <div style="
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: rgba(0,0,0,0.7);
                    color: white;
                    padding: 4px 6px;
                    font-size: 10px;
                    text-align: center;
                ">
                    ${wallpaper.name}
                </div>
                ${currentWallpaper === wallpaperId ? '<div style="position: absolute; top: 4px; right: 4px; color: var(--primary); background: rgba(0,0,0,0.7); border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px;">✓</div>' : ''}
            </div>
        `).join('');
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
                                padding: 5px 10px; background: var(--primary); color: white;
                                border: none; border-radius: 4px; cursor: pointer; font-size: 12px;
                            ">Play Now</button>
                        </div>
                        
                        <div class="game-card" style="background: var(--surface); padding: 15px; border-radius: 8px; border: 1px solid var(--border); text-align: center;">
                            <div style="font-size: 32px; margin-bottom: 10px;">🧠</div>
                            <div style="font-weight: 600; color: var(--text-primary);">Memory Match</div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin: 5px 0;">Card matching game</div>
                            <button onclick="window.pixelPusher.modules.windows.open('memory')" style="
                                padding: 5px 10px; background: var(--primary); color: white;
                                border: none; border-radius: 4px; cursor: pointer; font-size: 12px;
                            ">Play Now</button>
                        </div>
                        
                        <div class="game-card" style="background: var(--surface); padding: 15px; border-radius: 8px; border: 1px solid var(--border); text-align: center;">
                            <div style="font-size: 32px; margin-bottom: 10px;">🦕</div>
                            <div style="font-weight: 600; color: var(--text-primary);">Dino Runner</div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin: 5px 0;">Endless runner</div>
                            <button onclick="window.pixelPusher.modules.windows.open('dino')" style="
                                padding: 5px 10px; background: var(--primary); color: white;
                                border: none; border-radius: 4px; cursor: pointer; font-size: 12px;
                            ">Play Now</button>
                        </div>
                        
                        <div class="game-card" style="background: var(--surface); padding: 15px; border-radius: 8px; border: 1px solid var(--border); text-align: center;">
                            <div style="font-size: 32px; margin-bottom: 10px;">🏘️</div>
                            <div style="font-weight: 600; color: var(--text-primary);">Village Builder</div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin: 5px 0;">City building game</div>
                            <button onclick="window.pixelPusher.modules.windows.open('village')" style="
                                padding: 5px 10px; background: var(--primary); color: white;
                                border: none; border-radius: 4px; cursor: pointer; font-size: 12px;
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
                if (settingName === 'fontSize' || settingName === 'desktopBlur' || settingName === 'iconSize' || settingName === 'windowRadius') {
                    valueDisplay.textContent = `${value}px`;
                } else if (settingName === 'windowOpacity' || settingName === 'shadowIntensity') {
                    valueDisplay.textContent = `${value}%`;
                } else {
                    valueDisplay.textContent = value;
                }
            }
        } else {
            value = element.value;
        }

        this.setPreference(settingName, value);
        this.applySettingChange(settingName, value);

        // Show visual feedback
        if (element.type === 'range') {
            element.style.transition = 'all 0.2s ease';
            element.style.transform = 'scale(1.05)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
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
     * Apply performance profile
     */
    applyPerformanceProfile(profileId) {
        const profiles = {
            'power-saver': {
                animations: false,
                windowOpacity: 100,
                desktopBlur: 0,
                shadowIntensity: 20,
                particleEffects: false
            },
            'balanced': {
                animations: true,
                windowOpacity: 95,
                desktopBlur: 20,
                shadowIntensity: 50,
                particleEffects: true
            },
            'high-performance': {
                animations: false,
                windowOpacity: 100,
                desktopBlur: 5,
                shadowIntensity: 30,
                particleEffects: false
            },
            'ultimate-visual': {
                animations: true,
                windowOpacity: 85,
                desktopBlur: 40,
                shadowIntensity: 80,
                particleEffects: true
            },
            'gaming-mode': {
                animations: false,
                windowOpacity: 100,
                desktopBlur: 0,
                shadowIntensity: 0,
                particleEffects: false
            }
        };

        const profile = profiles[profileId];
        if (!profile) return;

        // Apply all profile settings
        Object.entries(profile).forEach(([setting, value]) => {
            this.setPreference(setting, value);
            this.applySettingChange(setting, value);
        });

        // Store the selected profile
        this.setPreference('performanceProfile', profileId);

        // Update the UI
        this.loadSettingsTab(this.getActiveSettings(), 'appearance');

        // Show notification
        const profileNames = {
            'power-saver': 'Power Saver',
            'balanced': 'Balanced',
            'high-performance': 'High Performance',
            'ultimate-visual': 'Ultimate Visual',
            'gaming-mode': 'Gaming Mode'
        };

        if (window.pixelPusher) {
            window.pixelPusher.showNotification(`Applied ${profileNames[profileId]} profile`, 'success');
        }

        console.log(`⚡ Applied performance profile: ${profileId}`);
    }

    /**
     * Set wallpaper
     */
    setWallpaper(wallpaperId) {
        const wallpapers = {
            'default': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'aurora': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            'sunset': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
            'ocean': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'forest': 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
            'space': 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
            'cyberpunk': 'linear-gradient(135deg, #0f0f23 0%, #1a0f23 50%, #230f23 100%)',
            'minimal': '#2c3e50',
            'rainbow': 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)'
        };

        const wallpaper = wallpapers[wallpaperId];
        if (!wallpaper) return;

        // Apply wallpaper to desktop
        const desktop = document.getElementById('desktop');
        if (desktop) {
            desktop.style.background = wallpaper;
            desktop.style.backgroundSize = 'cover';
            desktop.style.backgroundPosition = 'center';
            desktop.style.backgroundAttachment = 'fixed';
        }

        // Save preference
        this.setPreference('wallpaper', wallpaperId);

        // Update preview
        const preview = document.querySelector('.wallpaper-preview');
        if (preview) {
            preview.style.background = wallpaper;
        }

        // Update UI
        this.loadSettingsTab(this.getActiveSettings(), 'appearance');

        if (window.pixelPusher) {
            window.pixelPusher.showNotification('Wallpaper updated', 'success');
        }

        console.log(`🖼️ Wallpaper changed to: ${wallpaperId}`);
    }

    /**
     * Upload custom wallpaper
     */
    uploadWallpaper() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target.result;

                // Apply custom wallpaper
                const desktop = document.getElementById('desktop');
                if (desktop) {
                    desktop.style.background = `url(${imageUrl})`;
                    desktop.style.backgroundSize = 'cover';
                    desktop.style.backgroundPosition = 'center';
                    desktop.style.backgroundAttachment = 'fixed';
                }

                // Save as custom wallpaper
                this.setPreference('wallpaper', 'custom');
                this.setPreference('customWallpaperUrl', imageUrl);

                // Update preview
                const preview = document.querySelector('.wallpaper-preview');
                if (preview) {
                    preview.style.background = `url(${imageUrl})`;
                    preview.style.backgroundSize = 'cover';
                    preview.style.backgroundPosition = 'center';
                }

                if (window.pixelPusher) {
                    window.pixelPusher.showNotification('Custom wallpaper uploaded', 'success');
                }
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }

    /**
     * Reset wallpaper to default
     */
    resetWallpaper() {
        this.setWallpaper('default');
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
            case 'windowOpacity':
                document.documentElement.style.setProperty('--window-opacity', value / 100);
                document.querySelectorAll('.window').forEach(window => {
                    window.style.opacity = value / 100;
                });
                break;
            case 'desktopBlur':
                document.documentElement.style.setProperty('--desktop-blur', `${value}px`);
                document.querySelectorAll('.window').forEach(window => {
                    window.style.backdropFilter = `blur(${value}px)`;
                });
                break;
            case 'iconSize':
                document.documentElement.style.setProperty('--icon-size', `${value}px`);
                document.querySelectorAll('.desktop-icon').forEach(icon => {
                    icon.style.width = `${value}px`;
                    icon.style.height = `${value}px`;
                });
                break;
            case 'windowRadius':
                document.documentElement.style.setProperty('--window-radius', `${value}px`);
                document.querySelectorAll('.window').forEach(window => {
                    window.style.borderRadius = `${value}px`;
                });
                break;
            case 'shadowIntensity':
                const shadowOpacity = value / 100 * 0.3; // Max 0.3 opacity
                document.documentElement.style.setProperty('--shadow-intensity', shadowOpacity);
                document.querySelectorAll('.window').forEach(window => {
                    window.style.boxShadow = `0 12px 40px rgba(0, 0, 0, ${shadowOpacity})`;
                });
                break;
            case 'particleEffects':
                document.body.classList.toggle('no-particles', !value);
                break;
            case 'soundEnabled':
                // Apply to audio elements
                document.querySelectorAll('audio').forEach(audio => {
                    audio.muted = !value;
                });
                break;
        }
    }

    /**
     * Get active settings instance
     */
    getActiveSettings() {
        return Array.from(this.settings.values())[0];
    }

    /**
     * Import settings from file
     */
    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const settings = JSON.parse(event.target.result);

                    // Apply imported settings
                    Object.entries(settings).forEach(([key, value]) => {
                        this.setPreference(key, value);
                        this.applySettingChange(key, value);
                    });

                    // Reload UI
                    this.loadSettingsTab(this.getActiveSettings(), 'appearance');

                    if (window.pixelPusher) {
                        window.pixelPusher.showNotification('Settings imported successfully', 'success');
                    }
                } catch (error) {
                    console.error('Error importing settings:', error);
                    if (window.pixelPusher) {
                        window.pixelPusher.showNotification('Error importing settings', 'error');
                    }
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    /**
     * Auto-optimize settings based on device
     */
    applyOptimalSettings() {
        // Detect device capabilities
        const memory = navigator.deviceMemory || 4; // GB
        const cores = navigator.hardwareConcurrency || 4;
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);

        let optimalProfile;

        if (isMobile || memory < 4) {
            optimalProfile = 'power-saver';
        } else if (memory >= 8 && cores >= 8) {
            optimalProfile = 'ultimate-visual';
        } else if (memory >= 6) {
            optimalProfile = 'balanced';
        } else {
            optimalProfile = 'high-performance';
        }

        this.applyPerformanceProfile(optimalProfile);

        if (window.pixelPusher) {
            window.pixelPusher.showNotification(`Auto-optimized for your device (${optimalProfile})`, 'success');
        }
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
            soundEnabled: this.getPreference('soundEnabled'),
            windowOpacity: this.getPreference('windowOpacity'),
            desktopBlur: this.getPreference('desktopBlur'),
            iconSize: this.getPreference('iconSize'),
            windowRadius: this.getPreference('windowRadius'),
            shadowIntensity: this.getPreference('shadowIntensity'),
            particleEffects: this.getPreference('particleEffects'),
            wallpaper: this.getPreference('wallpaper'),
            performanceProfile: this.getPreference('performanceProfile')
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

        // Apply saved wallpaper
        const savedWallpaper = this.getPreference('wallpaper', 'default');
        if (savedWallpaper === 'custom') {
            const customUrl = this.getPreference('customWallpaperUrl');
            if (customUrl) {
                const desktop = document.getElementById('desktop');
                if (desktop) {
                    desktop.style.background = `url(${customUrl})`;
                    desktop.style.backgroundSize = 'cover';
                    desktop.style.backgroundPosition = 'center';
                    desktop.style.backgroundAttachment = 'fixed';
                }
            }
        } else {
            this.setWallpaper(savedWallpaper);
        }

        // Apply other preferences
        const fontSize = this.getPreference('fontSize', 14);
        document.documentElement.style.fontSize = `${fontSize}px`;

        const animations = this.getPreference('animations', true);
        document.body.classList.toggle('no-animations', !animations);

        // Apply visual effects
        const windowOpacity = this.getPreference('windowOpacity', 95);
        this.applySettingChange('windowOpacity', windowOpacity);

        const desktopBlur = this.getPreference('desktopBlur', 20);
        this.applySettingChange('desktopBlur', desktopBlur);

        const iconSize = this.getPreference('iconSize', 80);
        this.applySettingChange('iconSize', iconSize);

        const windowRadius = this.getPreference('windowRadius', 20);
        this.applySettingChange('windowRadius', windowRadius);

        const shadowIntensity = this.getPreference('shadowIntensity', 50);
        this.applySettingChange('shadowIntensity', shadowIntensity);

        const particleEffects = this.getPreference('particleEffects', true);
        this.applySettingChange('particleEffects', particleEffects);

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
            availableThemes: Object.keys(this.themes),
            performanceProfile: this.getPreference('performanceProfile', 'balanced'),
            wallpaper: this.getPreference('wallpaper', 'default')
        };
    }

    handleResize() {
        console.log('⚙️ Settings window resized');
    }

    destroy() {
        this.settings.clear();
        console.log('⚙️ Enhanced Settings Manager destroyed');
    }
}

// Make available globally
window.SettingsManager = SettingsManager;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsManager;
}

console.log('⚙️ Enhanced Settings manager with wallpapers and performance profiles loaded successfully');