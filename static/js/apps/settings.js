/**
 * Enhanced Settings Manager with Advanced Theming & Wallpapers
 * Comprehensive customization system with extensive theme support and wallpaper management
 */

class SettingsManager {
    constructor() {
        this.settings = new Map(); // Active settings windows
        this.activeTab = 'appearance';
        this.wallpaperCache = new Map();
        this.customWallpapers = [];

        // Comprehensive theme definitions matching themes.css
        this.themes = {
            default: {
                name: '🎨 Pixel Pusher',
                description: 'Modern cyan-purple gradient theme',
                category: 'Modern',
                colors: {
                    '--primary': '#00d9ff',
                    '--primary-light': '#66e5ff',
                    '--primary-dark': '#0099cc',
                    '--secondary': '#ff00d9',
                    '--success': '#00ff88',
                    '--warning': '#ffaa00',
                    '--error': '#ff4444',
                    '--background': '#1a1a2e',
                    '--surface': '#252538',
                    '--surface-light': '#2d2d44',
                    '--surface-dark': '#1a1a2e',
                    '--text-primary': '#ffffff',
                    '--text-secondary': '#b0b0c0',
                    '--text-disabled': '#606070',
                    '--border': 'rgba(255, 255, 255, 0.1)',
                    '--shadow': '0 4px 20px rgba(0, 0, 0, 0.5)',
                    '--desktop-bg': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
                }
            },
            light: {
                name: '☀️ Light Mode',
                description: 'Clean bright theme for daytime productivity',
                category: 'Classic',
                colors: {
                    '--primary': '#2196f3',
                    '--primary-light': '#64b5f6',
                    '--primary-dark': '#1976d2',
                    '--secondary': '#ff4081',
                    '--success': '#4caf50',
                    '--warning': '#ff9800',
                    '--error': '#f44336',
                    '--background': '#f5f5f5',
                    '--surface': '#ffffff',
                    '--surface-light': '#ffffff',
                    '--surface-dark': '#e0e0e0',
                    '--text-primary': '#212121',
                    '--text-secondary': '#757575',
                    '--text-disabled': '#bdbdbd',
                    '--border': 'rgba(0, 0, 0, 0.12)',
                    '--shadow': '0 2px 10px rgba(0, 0, 0, 0.1)',
                    '--desktop-bg': 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
                }
            },
            dark: {
                name: '🌙 Dark Mode',
                description: 'Sleek dark theme with purple accents',
                category: 'Classic',
                colors: {
                    '--primary': '#bb86fc',
                    '--primary-light': '#e7b9ff',
                    '--primary-dark': '#7f39fb',
                    '--secondary': '#03dac6',
                    '--success': '#00c853',
                    '--warning': '#ffab00',
                    '--error': '#cf6679',
                    '--background': '#121212',
                    '--surface': '#1e1e1e',
                    '--surface-light': '#2c2c2c',
                    '--surface-dark': '#121212',
                    '--text-primary': '#ffffff',
                    '--text-secondary': '#aaaaaa',
                    '--text-disabled': '#666666',
                    '--border': 'rgba(255, 255, 255, 0.1)',
                    '--shadow': '0 4px 20px rgba(0, 0, 0, 0.8)',
                    '--desktop-bg': 'radial-gradient(circle at 20% 50%, #1e1e1e 0%, #121212 100%)'
                }
            },
            gray: {
                name: '🌫️ Gray Steel',
                description: 'Professional gray theme with orange accents',
                category: 'Professional',
                colors: {
                    '--primary': '#607d8b',
                    '--primary-light': '#8eacbb',
                    '--primary-dark': '#34515e',
                    '--secondary': '#ff5722',
                    '--success': '#8bc34a',
                    '--warning': '#ffc107',
                    '--error': '#e91e63',
                    '--background': '#263238',
                    '--surface': '#37474f',
                    '--surface-light': '#455a64',
                    '--surface-dark': '#263238',
                    '--text-primary': '#eceff1',
                    '--text-secondary': '#b0bec5',
                    '--text-disabled': '#607d8b',
                    '--border': 'rgba(255, 255, 255, 0.12)',
                    '--shadow': '0 4px 20px rgba(0, 0, 0, 0.4)',
                    '--desktop-bg': 'linear-gradient(135deg, #263238 0%, #37474f 100%)'
                }
            },
            neon: {
                name: '💫 Neon Glow',
                description: 'Electric neon theme with glowing effects',
                category: 'Futuristic',
                colors: {
                    '--primary': '#00ffff',
                    '--primary-light': '#66ffff',
                    '--primary-dark': '#00cccc',
                    '--secondary': '#ff00ff',
                    '--success': '#00ff00',
                    '--warning': '#ffff00',
                    '--error': '#ff0066',
                    '--background': '#0a0a0a',
                    '--surface': '#1a1a1a',
                    '--surface-light': '#2a2a2a',
                    '--surface-dark': '#0a0a0a',
                    '--text-primary': '#ffffff',
                    '--text-secondary': '#cccccc',
                    '--text-disabled': '#666666',
                    '--border': 'rgba(0, 255, 255, 0.3)',
                    '--shadow': '0 4px 20px rgba(0, 255, 255, 0.4)',
                    '--desktop-bg': 'linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #0a1a1a 100%)'
                }
            },
            cyberpunk: {
                name: '🤖 Cyberpunk',
                description: 'Futuristic yellow-on-dark cyberpunk theme',
                category: 'Futuristic',
                colors: {
                    '--primary': '#f0e68c',
                    '--primary-light': '#fff9c4',
                    '--primary-dark': '#c9b037',
                    '--secondary': '#e91e63',
                    '--success': '#76ff03',
                    '--warning': '#ff6f00',
                    '--error': '#d50000',
                    '--background': '#0f0f23',
                    '--surface': '#1a1a2e',
                    '--surface-light': '#252542',
                    '--surface-dark': '#0f0f23',
                    '--text-primary': '#f0e68c',
                    '--text-secondary': '#b8a85a',
                    '--text-disabled': '#5a5a3e',
                    '--border': 'rgba(240, 230, 140, 0.3)',
                    '--shadow': '0 4px 20px rgba(240, 230, 140, 0.3)',
                    '--desktop-bg': 'linear-gradient(180deg, transparent 0%, rgba(240, 230, 140, 0.1) 100%), linear-gradient(90deg, #0f0f23 0%, #1a0f23 50%, #230f23 100%)'
                }
            },
            matrix: {
                name: '💚 Matrix Code',
                description: 'Classic green Matrix theme with digital rain',
                category: 'Retro',
                colors: {
                    '--primary': '#00ff41',
                    '--primary-light': '#66ff7f',
                    '--primary-dark': '#00cc33',
                    '--secondary': '#00ff41',
                    '--success': '#00ff41',
                    '--warning': '#ffff00',
                    '--error': '#ff0000',
                    '--background': '#000000',
                    '--surface': '#0a0a0a',
                    '--surface-light': '#1a1a1a',
                    '--surface-dark': '#000000',
                    '--text-primary': '#00ff41',
                    '--text-secondary': '#00cc33',
                    '--text-disabled': '#006619',
                    '--border': 'rgba(0, 255, 65, 0.3)',
                    '--shadow': '0 4px 20px rgba(0, 255, 65, 0.4)',
                    '--desktop-bg': '#000000'
                }
            },
            hackerman: {
                name: '👨‍💻 Hackerman',
                description: 'Elite hacker theme with scanline effects',
                category: 'Retro',
                colors: {
                    '--primary': '#20c20e',
                    '--primary-light': '#60ff60',
                    '--primary-dark': '#108810',
                    '--secondary': '#ffa500',
                    '--success': '#00ff00',
                    '--warning': '#ffaa00',
                    '--error': '#ff0000',
                    '--background': '#000000',
                    '--surface': '#0d0d0d',
                    '--surface-light': '#1a1a1a',
                    '--surface-dark': '#000000',
                    '--text-primary': '#20c20e',
                    '--text-secondary': '#189818',
                    '--text-disabled': '#0a5a0a',
                    '--border': 'rgba(32, 194, 14, 0.3)',
                    '--shadow': '0 4px 20px rgba(32, 194, 14, 0.4)',
                    '--desktop-bg': 'repeating-linear-gradient(0deg, #000000, #000000 2px, #0a0a0a 2px, #0a0a0a 4px)'
                }
            },
            metallicblue: {
                name: '🔵 Metallic Blue',
                description: 'Glossy metallic blue with shine effects',
                category: 'Metallic',
                colors: {
                    '--primary': '#4fc3f7',
                    '--primary-light': '#8bf6ff',
                    '--primary-dark': '#0093c4',
                    '--secondary': '#81c784',
                    '--success': '#66bb6a',
                    '--warning': '#ffa726',
                    '--error': '#ef5350',
                    '--background': '#0d47a1',
                    '--surface': '#1565c0',
                    '--surface-light': '#1976d2',
                    '--surface-dark': '#0d47a1',
                    '--text-primary': '#e3f2fd',
                    '--text-secondary': '#bbdefb',
                    '--text-disabled': '#64b5f6',
                    '--border': 'rgba(255, 255, 255, 0.2)',
                    '--shadow': '0 4px 20px rgba(0, 0, 0, 0.4)',
                    '--desktop-bg': 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%), radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)'
                }
            },
            metallicgreen: {
                name: '🟢 Metallic Green',
                description: 'Lush metallic green with natural vibes',
                category: 'Metallic',
                colors: {
                    '--primary': '#81c784',
                    '--primary-light': '#b2fab4',
                    '--primary-dark': '#519657',
                    '--secondary': '#4fc3f7',
                    '--success': '#66bb6a',
                    '--warning': '#ffb74d',
                    '--error': '#e57373',
                    '--background': '#1b5e20',
                    '--surface': '#2e7d32',
                    '--surface-light': '#388e3c',
                    '--surface-dark': '#1b5e20',
                    '--text-primary': '#e8f5e9',
                    '--text-secondary': '#c8e6c9',
                    '--text-disabled': '#81c784',
                    '--border': 'rgba(255, 255, 255, 0.2)',
                    '--shadow': '0 4px 20px rgba(0, 0, 0, 0.4)',
                    '--desktop-bg': 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%), radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)'
                }
            },
            metallicviolet: {
                name: '🟣 Metallic Violet',
                description: 'Luxurious metallic violet with royal feel',
                category: 'Metallic',
                colors: {
                    '--primary': '#ba68c8',
                    '--primary-light': '#ee98fb',
                    '--primary-dark': '#883997',
                    '--secondary': '#64b5f6',
                    '--success': '#81c784',
                    '--warning': '#ffb74d',
                    '--error': '#e57373',
                    '--background': '#4a148c',
                    '--surface': '#6a1b9a',
                    '--surface-light': '#7b1fa2',
                    '--surface-dark': '#4a148c',
                    '--text-primary': '#f3e5f5',
                    '--text-secondary': '#e1bee7',
                    '--text-disabled': '#ba68c8',
                    '--border': 'rgba(255, 255, 255, 0.2)',
                    '--shadow': '0 4px 20px rgba(0, 0, 0, 0.4)',
                    '--desktop-bg': 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 50%, #7b1fa2 100%), radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)'
                }
            }
        };

        // Built-in wallpaper collection
        this.wallpapers = {
            gradients: [
                {
                    name: 'Pixel Gradient',
                    style: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    category: 'Gradients'
                },
                {
                    name: 'Neon Dreams',
                    style: 'linear-gradient(135deg, #f093fb 0%, #f5576c 25%, #4facfe 100%)',
                    category: 'Gradients'
                },
                {
                    name: 'Ocean Breeze',
                    style: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
                    category: 'Gradients'
                },
                {
                    name: 'Sunset Glow',
                    style: 'linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%)',
                    category: 'Gradients'
                },
                {
                    name: 'Forest Mist',
                    style: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    category: 'Gradients'
                },
                {
                    name: 'Purple Rain',
                    style: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                    category: 'Gradients'
                }
            ],
            patterns: [
                {
                    name: 'Circuit Board',
                    style: `
                        radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%),
                        linear-gradient(135deg, #667eea 0%, #764ba2 100%)
                    `,
                    category: 'Patterns'
                },
                {
                    name: 'Hex Grid',
                    style: `
                        repeating-linear-gradient(
                            30deg,
                            transparent,
                            transparent 2px,
                            rgba(255, 255, 255, 0.1) 2px,
                            rgba(255, 255, 255, 0.1) 4px
                        ),
                        linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)
                    `,
                    category: 'Patterns'
                },
                {
                    name: 'Matrix Rain',
                    style: `
                        repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 2px,
                            rgba(0, 255, 65, 0.03) 2px,
                            rgba(0, 255, 65, 0.03) 4px
                        ),
                        #000000
                    `,
                    category: 'Patterns'
                },
                {
                    name: 'Cyber Grid',
                    style: `
                        repeating-linear-gradient(
                            90deg,
                            transparent,
                            transparent 50px,
                            rgba(0, 255, 255, 0.1) 50px,
                            rgba(0, 255, 255, 0.1) 52px
                        ),
                        repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 50px,
                            rgba(0, 255, 255, 0.1) 50px,
                            rgba(0, 255, 255, 0.1) 52px
                        ),
                        linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #0a1a1a 100%)
                    `,
                    category: 'Patterns'
                }
            ],
            abstract: [
                {
                    name: 'Fluid Dynamics',
                    style: `
                        radial-gradient(ellipse at top, #667eea 0%, transparent 50%),
                        radial-gradient(ellipse at bottom, #764ba2 0%, transparent 50%),
                        radial-gradient(ellipse at center, #f093fb 0%, transparent 50%),
                        linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)
                    `,
                    category: 'Abstract'
                },
                {
                    name: 'Cosmic Waves',
                    style: `
                        radial-gradient(circle at 50% 50%, rgba(120, 119, 198, 0.4) 0%, transparent 50%),
                        radial-gradient(circle at 20% 80%, rgba(120, 219, 255, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 40% 40%, rgba(120, 255, 119, 0.2) 0%, transparent 50%),
                        linear-gradient(135deg, #0f0f23 0%, #1a0f23 50%, #230f23 100%)
                    `,
                    category: 'Abstract'
                }
            ]
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

            // Load custom wallpapers
            await this.loadCustomWallpapers();

            console.log('✅ Enhanced Settings system ready');

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

        // Create enhanced settings structure
        this.createEnhancedSettingsStructure(settings);

        // Store settings instance
        this.settings.set(appId, settings);

        // Set up settings-specific event handlers
        this.setupSettingsEventHandlers(settings);

        // Apply enhanced settings styling
        this.applyEnhancedSettingsStyling(settings);

        // Load initial content
        this.loadSettingsTab(settings, 'appearance');

        console.log(`⚙️ Enhanced Settings window initialized: ${appId}`);
    }

    /**
     * Create enhanced settings structure
     */
    createEnhancedSettingsStructure(settings) {
        if (settings.container.children.length === 0) {
            settings.container.innerHTML = `
                <div class="settings-sidebar">
                    <div class="settings-nav-item active" data-section="appearance">
                        🎨 Appearance
                    </div>
                    <div class="settings-nav-item" data-section="themes">
                        🌈 Themes
                    </div>
                    <div class="settings-nav-item" data-section="wallpapers">
                        🖼️ Wallpapers
                    </div>
                    <div class="settings-nav-item" data-section="effects">
                        ✨ Visual Effects
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
                    Loading enhanced settings...
                </div>
            `;
        }

        settings.sidebar = settings.container.querySelector('.settings-sidebar');
        settings.content = settings.container.querySelector('.settings-content');
    }

    /**
     * Generate enhanced appearance settings
     */
    generateAppearanceSettings() {
        const currentTheme = this.getPreference('theme', 'default');
        const animationsEnabled = this.getPreference('animations', true);
        const fontSize = this.getPreference('fontSize', 14);
        const windowOpacity = this.getPreference('windowOpacity', 0.95);
        const glassEffect = this.getPreference('glassEffect', true);

        return `
            <div class="settings-section">
                <h2 style="color: var(--text-primary); margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
                    🎨 Appearance & Interface
                    <span style="font-size: 14px; color: var(--text-secondary); font-weight: normal;">Customize your visual experience</span>
                </h2>
                
                <div class="settings-group glass-panel" style="margin-bottom: 30px;">
                    <h3 style="color: var(--text-primary); margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 20px;">🖼️</span> Current Theme Preview
                    </h3>
                    <div class="theme-preview-large" style="
                        padding: 20px;
                        background: var(--surface);
                        border: 2px solid var(--primary);
                        border-radius: 16px;
                        margin-bottom: 20px;
                        position: relative;
                        overflow: hidden;
                    ">
                        <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: var(--primary);"></div>
                        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
                            <div style="width: 48px; height: 48px; background: var(--primary); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                                ${this.themes[currentTheme]?.name?.split(' ')[0] || '🎨'}
                            </div>
                            <div>
                                <div style="font-weight: 600; color: var(--text-primary); font-size: 16px;">
                                    ${this.themes[currentTheme]?.name || 'Current Theme'}
                                </div>
                                <div style="color: var(--text-secondary); font-size: 13px;">
                                    ${this.themes[currentTheme]?.description || 'Active theme'}
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                            <div style="flex: 1; height: 8px; background: var(--primary); border-radius: 4px;"></div>
                            <div style="flex: 1; height: 8px; background: var(--secondary); border-radius: 4px;"></div>
                            <div style="flex: 1; height: 8px; background: var(--success); border-radius: 4px;"></div>
                            <div style="flex: 1; height: 8px; background: var(--warning); border-radius: 4px;"></div>
                            <div style="flex: 1; height: 8px; background: var(--error); border-radius: 4px;"></div>
                        </div>
                        <div style="font-size: 12px; color: var(--text-secondary);">
                            Theme colors and styling preview
                        </div>
                    </div>
                </div>
                
                <div class="settings-group glass-panel" style="margin-bottom: 30px;">
                    <h3 style="color: var(--text-primary); margin-bottom: 20px;">⚙️ Interface Options</h3>
                    
                    <div class="setting-item enhanced-setting" style="margin-bottom: 20px;">
                        <label class="setting-label" style="display: flex; align-items: center; gap: 12px; color: var(--text-primary); cursor: pointer;">
                            <div class="checkbox-wrapper">
                                <input type="checkbox" ${animationsEnabled ? 'checked' : ''} 
                                       data-setting="animations" class="enhanced-checkbox">
                                <span class="checkmark"></span>
                            </div>
                            <div>
                                <div style="font-weight: 500;">Enable Animations & Transitions</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Smooth animations throughout the interface</div>
                            </div>
                        </label>
                    </div>
                    
                    <div class="setting-item enhanced-setting" style="margin-bottom: 20px;">
                        <label class="setting-label" style="display: flex; align-items: center; gap: 12px; color: var(--text-primary); cursor: pointer;">
                            <div class="checkbox-wrapper">
                                <input type="checkbox" ${glassEffect ? 'checked' : ''} 
                                       data-setting="glassEffect" class="enhanced-checkbox">
                                <span class="checkmark"></span>
                            </div>
                            <div>
                                <div style="font-weight: 500;">Glass Morphism Effect</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Translucent glass effect on windows</div>
                            </div>
                        </label>
                    </div>
                    
                    <div class="setting-item enhanced-setting" style="margin-bottom: 20px;">
                        <label class="setting-label" style="color: var(--text-primary);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-weight: 500;">Font Size</span>
                                <span id="fontSize-value" style="color: var(--primary); font-weight: 600;">${fontSize}px</span>
                            </div>
                            <input type="range" min="12" max="20" value="${fontSize}" 
                                   data-setting="fontSize" class="enhanced-slider">
                            <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-secondary); margin-top: 4px;">
                                <span>Small</span>
                                <span>Large</span>
                            </div>
                        </label>
                    </div>
                    
                    <div class="setting-item enhanced-setting" style="margin-bottom: 20px;">
                        <label class="setting-label" style="color: var(--text-primary);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-weight: 500;">Window Opacity</span>
                                <span id="windowOpacity-value" style="color: var(--primary); font-weight: 600;">${Math.round(windowOpacity * 100)}%</span>
                            </div>
                            <input type="range" min="0.6" max="1" step="0.05" value="${windowOpacity}" 
                                   data-setting="windowOpacity" class="enhanced-slider">
                            <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-secondary); margin-top: 4px;">
                                <span>Transparent</span>
                                <span>Opaque</span>
                            </div>
                        </label>
                    </div>
                </div>
                
                <div class="settings-group glass-panel">
                    <h3 style="color: var(--text-primary); margin-bottom: 20px;">🔧 Quick Actions</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                        <button class="action-btn primary" onclick="window.pixelPusher.modules.settings.resetToDefaults()">
                            🔄 Reset to Defaults
                        </button>
                        <button class="action-btn secondary" onclick="window.pixelPusher.modules.settings.exportSettings()">
                            📤 Export Settings
                        </button>
                        <button class="action-btn secondary" onclick="window.pixelPusher.modules.settings.importSettings()">
                            📥 Import Settings
                        </button>
                        <button class="action-btn secondary" onclick="window.pixelPusher.modules.settings.randomizeTheme()">
                            🎲 Random Theme
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate comprehensive themes section
     */
    generateThemesSettings() {
        const currentTheme = this.getPreference('theme', 'default');
        const categories = [...new Set(Object.values(this.themes).map(t => t.category))];

        let themesHTML = `
            <div class="settings-section">
                <h2 style="color: var(--text-primary); margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
                    🌈 Theme Gallery
                    <span style="font-size: 14px; color: var(--text-secondary); font-weight: normal;">Choose your perfect look</span>
                </h2>
        `;

        categories.forEach(category => {
            const categoryThemes = Object.entries(this.themes).filter(([_, theme]) => theme.category === category);

            themesHTML += `
                <div class="theme-category" style="margin-bottom: 40px;">
                    <h3 style="color: var(--text-primary); margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 18px;">${this.getCategoryIcon(category)}</span>
                        ${category} Themes
                        <span style="font-size: 12px; color: var(--text-secondary); font-weight: normal;">(${categoryThemes.length} themes)</span>
                    </h3>
                    <div class="theme-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
            `;

            categoryThemes.forEach(([themeId, theme]) => {
                const isActive = currentTheme === themeId;
                themesHTML += `
                    <div class="theme-card ${isActive ? 'active' : ''}" 
                         data-theme="${themeId}" 
                         onclick="window.pixelPusher.modules.settings.setTheme('${themeId}')"
                         style="
                            padding: 20px;
                            background: var(--surface);
                            border: 2px solid ${isActive ? 'var(--primary)' : 'var(--border)'};
                            border-radius: 16px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            position: relative;
                            overflow: hidden;
                         ">
                        ${isActive ? '<div class="active-indicator" style="position: absolute; top: 12px; right: 12px; color: var(--primary); font-size: 20px;">✓</div>' : ''}
                        
                        <div class="theme-preview" style="
                            width: 100%;
                            height: 60px;
                            border-radius: 8px;
                            margin-bottom: 16px;
                            background: ${theme.colors['--desktop-bg'] || theme.colors['--background']};
                            position: relative;
                            overflow: hidden;
                        ">
                            <div style="position: absolute; top: 8px; left: 8px; right: 8px; height: 24px; background: ${theme.colors['--surface']}; border-radius: 4px; display: flex; align-items: center; gap: 4px; padding: 0 8px;">
                                <div style="width: 8px; height: 8px; background: ${theme.colors['--error']}; border-radius: 50%;"></div>
                                <div style="width: 8px; height: 8px; background: ${theme.colors['--warning']}; border-radius: 50%;"></div>
                                <div style="width: 8px; height: 8px; background: ${theme.colors['--success']}; border-radius: 50%;"></div>
                                <div style="flex: 1; height: 4px; background: ${theme.colors['--primary']}; border-radius: 2px; margin-left: 8px;"></div>
                            </div>
                        </div>
                        
                        <div class="theme-info">
                            <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px; font-size: 16px;">
                                ${theme.name}
                            </div>
                            <div style="color: var(--text-secondary); font-size: 13px; line-height: 1.3;">
                                ${theme.description}
                            </div>
                        </div>
                        
                        <div class="theme-colors" style="display: flex; gap: 6px; margin-top: 12px;">
                            <div style="width: 16px; height: 16px; background: ${theme.colors['--primary']}; border-radius: 50%; border: 2px solid var(--surface-light);"></div>
                            <div style="width: 16px; height: 16px; background: ${theme.colors['--secondary']}; border-radius: 50%; border: 2px solid var(--surface-light);"></div>
                            <div style="width: 16px; height: 16px; background: ${theme.colors['--success']}; border-radius: 50%; border: 2px solid var(--surface-light);"></div>
                            <div style="width: 16px; height: 16px; background: ${theme.colors['--warning']}; border-radius: 50%; border: 2px solid var(--surface-light);"></div>
                            <div style="width: 16px; height: 16px; background: ${theme.colors['--error']}; border-radius: 50%; border: 2px solid var(--surface-light);"></div>
                        </div>
                    </div>
                `;
            });

            themesHTML += `
                    </div>
                </div>
            `;
        });

        themesHTML += `
                <div class="theme-actions glass-panel" style="padding: 20px; text-align: center;">
                    <h4 style="color: var(--text-primary); margin-bottom: 16px;">🎨 Theme Actions</h4>
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button class="action-btn secondary" onclick="window.pixelPusher.modules.settings.createCustomTheme()">
                            🎪 Create Custom Theme
                        </button>
                        <button class="action-btn secondary" onclick="window.pixelPusher.modules.settings.downloadTheme()">
                            💾 Download Current Theme
                        </button>
                    </div>
                </div>
            </div>
        `;

        return themesHTML;
    }

    /**
     * Generate comprehensive wallpapers section
     */
    generateWallpapersSettings() {
        const currentWallpaper = this.getPreference('wallpaper', null);

        let wallpapersHTML = `
            <div class="settings-section">
                <h2 style="color: var(--text-primary); margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
                    🖼️ Wallpaper Gallery
                    <span style="font-size: 14px; color: var(--text-secondary); font-weight: normal;">Personalize your desktop</span>
                </h2>
                
                <div class="wallpaper-preview glass-panel" style="margin-bottom: 30px; padding: 20px;">
                    <h3 style="color: var(--text-primary); margin-bottom: 16px;">Current Wallpaper</h3>
                    <div class="current-wallpaper-preview" style="
                        width: 100%;
                        height: 120px;
                        border-radius: 12px;
                        background: ${currentWallpaper || 'var(--desktop-bg, var(--background))'};
                        border: 2px solid var(--border);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: var(--text-secondary);
                        font-size: 14px;
                        position: relative;
                        overflow: hidden;
                    ">
                        ${currentWallpaper ? '' : '🖼️ Using theme default background'}
                        ${currentWallpaper ? '<div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.5); color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px;">Custom Wallpaper</div>' : ''}
                    </div>
                    <div style="display: flex; gap: 8px; margin-top: 12px;">
                        <button class="action-btn secondary" onclick="window.pixelPusher.modules.settings.uploadWallpaper()">
                            📁 Upload Custom
                        </button>
                        <button class="action-btn secondary" onclick="window.pixelPusher.modules.settings.clearWallpaper()">
                            🗑️ Clear Wallpaper
                        </button>
                        <button class="action-btn secondary" onclick="window.pixelPusher.modules.settings.randomWallpaper()">
                            🎲 Random Wallpaper
                        </button>
                    </div>
                </div>
        `;

        // Generate wallpaper categories
        Object.entries(this.wallpapers).forEach(([categoryId, wallpapers]) => {
            const categoryName = categoryId.charAt(0).toUpperCase() + categoryId.slice(1);

            wallpapersHTML += `
                <div class="wallpaper-category" style="margin-bottom: 40px;">
                    <h3 style="color: var(--text-primary); margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 18px;">${this.getWallpaperCategoryIcon(categoryId)}</span>
                        ${categoryName}
                        <span style="font-size: 12px; color: var(--text-secondary); font-weight: normal;">(${wallpapers.length} wallpapers)</span>
                    </h3>
                    <div class="wallpaper-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
            `;

            wallpapers.forEach((wallpaper, index) => {
                const wallpaperId = `${categoryId}-${index}`;
                const isActive = currentWallpaper === wallpaper.style;

                wallpapersHTML += `
                    <div class="wallpaper-card ${isActive ? 'active' : ''}" 
                         onclick="window.pixelPusher.modules.settings.setWallpaper('${wallpaper.style.replace(/'/g, '\\\'')}')"
                         style="
                            cursor: pointer;
                            border-radius: 12px;
                            overflow: hidden;
                            border: 2px solid ${isActive ? 'var(--primary)' : 'var(--border)'};
                            transition: all 0.3s ease;
                            position: relative;
                         ">
                        <div class="wallpaper-preview" style="
                            width: 100%;
                            height: 120px;
                            background: ${wallpaper.style};
                            position: relative;
                        ">
                            ${isActive ? '<div style="position: absolute; top: 8px; right: 8px; background: var(--primary); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">✓</div>' : ''}
                        </div>
                        <div class="wallpaper-info" style="padding: 12px; background: var(--surface);">
                            <div style="font-weight: 500; color: var(--text-primary); font-size: 14px; margin-bottom: 4px;">
                                ${wallpaper.name}
                            </div>
                            <div style="font-size: 11px; color: var(--text-secondary);">
                                ${wallpaper.category}
                            </div>
                        </div>
                    </div>
                `;
            });

            wallpapersHTML += `
                    </div>
                </div>
            `;
        });

        wallpapersHTML += `
                <div class="wallpaper-upload glass-panel" style="padding: 20px; text-align: center;">
                    <h4 style="color: var(--text-primary); margin-bottom: 16px;">🎨 Custom Wallpapers</h4>
                    <div style="color: var(--text-secondary); margin-bottom: 16px; font-size: 14px;">
                        Upload your own images or create custom CSS backgrounds
                    </div>
                    <input type="file" id="wallpaper-upload" accept="image/*" style="display: none;" onchange="window.pixelPusher.modules.settings.handleWallpaperUpload(this)">
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button class="action-btn primary" onclick="document.getElementById('wallpaper-upload').click()">
                            📸 Upload Image
                        </button>
                        <button class="action-btn secondary" onclick="window.pixelPusher.modules.settings.createCSSWallpaper()">
                            🎨 Create CSS Background
                        </button>
                    </div>
                </div>
            </div>
        `;

        return wallpapersHTML;
    }

    /**
     * Generate visual effects settings
     */
    generateEffectsSettings() {
        const particleEffects = this.getPreference('particleEffects', true);
        const glowEffects = this.getPreference('glowEffects', true);
        const parallaxEffect = this.getPreference('parallaxEffect', false);

        return `
            <div class="settings-section">
                <h2 style="color: var(--text-primary); margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
                    ✨ Visual Effects
                    <span style="font-size: 14px; color: var(--text-secondary); font-weight: normal;">Enhance your experience</span>
                </h2>
                
                <div class="effects-grid">
                    <div class="effect-card glass-panel" style="padding: 20px; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div style="font-size: 32px;">🎆</div>
                            <div style="flex: 1;">
                                <h3 style="color: var(--text-primary); margin: 0 0 8px 0;">Particle Effects</h3>
                                <p style="color: var(--text-secondary); margin: 0; font-size: 13px;">Dynamic particles and animations throughout the interface</p>
                            </div>
                            <div class="toggle-switch">
                                <input type="checkbox" ${particleEffects ? 'checked' : ''} data-setting="particleEffects" class="toggle-input">
                                <span class="toggle-slider"></span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="effect-card glass-panel" style="padding: 20px; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div style="font-size: 32px;">💫</div>
                            <div style="flex: 1;">
                                <h3 style="color: var(--text-primary); margin: 0 0 8px 0;">Glow Effects</h3>
                                <p style="color: var(--text-secondary); margin: 0; font-size: 13px;">Luminous glow effects on interactive elements</p>
                            </div>
                            <div class="toggle-switch">
                                <input type="checkbox" ${glowEffects ? 'checked' : ''} data-setting="glowEffects" class="toggle-input">
                                <span class="toggle-slider"></span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="effect-card glass-panel" style="padding: 20px; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div style="font-size: 32px;">🌌</div>
                            <div style="flex: 1;">
                                <h3 style="color: var(--text-primary); margin: 0 0 8px 0;">Parallax Scrolling</h3>
                                <p style="color: var(--text-secondary); margin: 0; font-size: 13px;">3D depth effect with layered backgrounds</p>
                            </div>
                            <div class="toggle-switch">
                                <input type="checkbox" ${parallaxEffect ? 'checked' : ''} data-setting="parallaxEffect" class="toggle-input">
                                <span class="toggle-slider"></span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="effects-preview glass-panel" style="padding: 20px; text-align: center;">
                    <h4 style="color: var(--text-primary); margin-bottom: 16px;">🎬 Effect Previews</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
                        <button class="action-btn secondary" onclick="window.pixelPusher.modules.settings.previewEffect('particles')">
                            🎆 Preview Particles
                        </button>
                        <button class="action-btn secondary" onclick="window.pixelPusher.modules.settings.previewEffect('glow')">
                            💫 Preview Glow
                        </button>
                        <button class="action-btn secondary" onclick="window.pixelPusher.modules.settings.previewEffect('matrix')">
                            💚 Matrix Effect
                        </button>
                        <button class="action-btn secondary" onclick="window.pixelPusher.modules.settings.previewEffect('cyberpunk')">
                            🤖 Cyber Effect
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Enhanced theme setting with comprehensive application
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

        // Update body class for theme-specific styling
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeName}`);

        // Apply desktop background
        const desktop = document.getElementById('desktop');
        if (desktop && theme.colors['--desktop-bg']) {
            desktop.style.background = theme.colors['--desktop-bg'];
        }

        // Apply window styling
        this.applyWindowTheming(theme);

        // Save preference
        this.setPreference('theme', themeName);

        // Show themed notification
        if (window.pixelPusher) {
            window.pixelPusher.showNotification(
                `${theme.name} theme activated! ✨`,
                'success',
                4000
            );
        }

        // Update theme preview in settings
        this.updateThemePreview(themeName);

        console.log(`🎨 Theme applied: ${themeName}`);
    }

    /**
     * Set wallpaper with proper application
     */
    setWallpaper(wallpaperStyle) {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        // Apply wallpaper
        desktop.style.background = wallpaperStyle;
        desktop.style.backgroundSize = 'cover';
        desktop.style.backgroundPosition = 'center';
        desktop.style.backgroundAttachment = 'fixed';

        // Save preference
        this.setPreference('wallpaper', wallpaperStyle);

        // Show notification
        if (window.pixelPusher) {
            window.pixelPusher.showNotification('Wallpaper updated! 🖼️', 'success');
        }

        console.log('🖼️ Wallpaper applied');
    }

    /**
     * Apply window theming
     */
    applyWindowTheming(theme) {
        const windows = document.querySelectorAll('.window');
        windows.forEach(window => {
            // Update window background with theme colors
            const bg = theme.colors['--surface'] || 'rgba(255, 255, 255, 0.1)';
            window.style.setProperty('background', bg);

            // Update borders
            const border = theme.colors['--border'] || 'rgba(255, 255, 255, 0.2)';
            window.style.setProperty('border-color', border);
        });
    }

    /**
     * Additional utility methods
     */
    getCategoryIcon(category) {
        const icons = {
            'Modern': '🚀',
            'Classic': '📚',
            'Professional': '💼',
            'Futuristic': '🔮',
            'Retro': '📺',
            'Metallic': '✨'
        };
        return icons[category] || '🎨';
    }

    getWallpaperCategoryIcon(category) {
        const icons = {
            'gradients': '🌈',
            'patterns': '🔲',
            'abstract': '🎨'
        };
        return icons[category] || '🖼️';
    }

    randomizeTheme() {
        const themeIds = Object.keys(this.themes);
        const randomTheme = themeIds[Math.floor(Math.random() * themeIds.length)];
        this.setTheme(randomTheme);
    }

    randomWallpaper() {
        const allWallpapers = Object.values(this.wallpapers).flat();
        const randomWallpaper = allWallpapers[Math.floor(Math.random() * allWallpapers.length)];
        this.setWallpaper(randomWallpaper.style);
    }

    clearWallpaper() {
        const desktop = document.getElementById('desktop');
        if (desktop) {
            desktop.style.background = '';
        }
        this.setPreference('wallpaper', null);

        if (window.pixelPusher) {
            window.pixelPusher.showNotification('Wallpaper cleared! Using theme default 🎨', 'info');
        }
    }

    previewEffect(effectType) {
        // Create temporary effect preview
        if (window.pixelPusher) {
            window.pixelPusher.showNotification(`Previewing ${effectType} effect! ✨`, 'info');
        }
    }

    async loadCustomWallpapers() {
        // Load custom wallpapers from storage
        try {
            const stored = localStorage.getItem('pixelpusher_custom_wallpapers');
            if (stored) {
                this.customWallpapers = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load custom wallpapers:', error);
        }
    }

    /**
     * Enhanced settings structure and styling methods
     */
    loadSettingsTab(settings, tabName) {
        let content = '';

        switch (tabName) {
            case 'appearance':
                content = this.generateAppearanceSettings();
                break;
            case 'themes':
                content = this.generateThemesSettings();
                break;
            case 'wallpapers':
                content = this.generateWallpapersSettings();
                break;
            case 'effects':
                content = this.generateEffectsSettings();
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

        // Initialize enhanced tab features
        setTimeout(() => {
            this.initializeEnhancedTabFeatures(settings, tabName);
        }, 100);
    }

    initializeEnhancedTabFeatures(settings, tabName) {
        // Add enhanced interactions based on tab
        const container = settings.content;

        // Enhanced hover effects for theme cards
        container.querySelectorAll('.theme-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px)';
                card.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '';
            });
        });

        // Enhanced hover effects for wallpaper cards
        container.querySelectorAll('.wallpaper-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'scale(1.05)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'scale(1)';
            });
        });
    }

    applyEnhancedSettingsStyling(settings) {
        // Apply base styling
        this.applySettingsStyling(settings);

        // Add enhanced CSS if not present
        if (!document.getElementById('enhanced-settings-styles')) {
            const style = document.createElement('style');
            style.id = 'enhanced-settings-styles';
            style.textContent = `
                .glass-panel {
                    background: rgba(255, 255, 255, 0.05) !important;
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 20px;
                }

                .enhanced-checkbox {
                    width: 20px;
                    height: 20px;
                    accent-color: var(--primary);
                }

                .enhanced-slider {
                    width: 100%;
                    height: 6px;
                    border-radius: 3px;
                    background: rgba(255, 255, 255, 0.2);
                    outline: none;
                    -webkit-appearance: none;
                }

                .enhanced-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: var(--primary);
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                }

                .action-btn {
                    padding: 12px 20px;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 14px;
                }

                .action-btn.primary {
                    background: var(--primary);
                    color: white;
                }

                .action-btn.secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--text-primary);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .action-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
                }

                .toggle-switch {
                    position: relative;
                    width: 50px;
                    height: 24px;
                }

                .toggle-input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(255, 255, 255, 0.2);
                    transition: .4s;
                    border-radius: 24px;
                }

                .toggle-slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }

                .toggle-input:checked + .toggle-slider {
                    background-color: var(--primary);
                }

                .toggle-input:checked + .toggle-slider:before {
                    transform: translateX(26px);
                }

                .theme-card.active {
                    box-shadow: 0 0 20px var(--primary);
                }

                .wallpaper-card.active {
                    box-shadow: 0 0 20px var(--primary);
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Include all the base methods from the original settings manager
    generateSystemSettings() {
        return `
            <div class="settings-section">
                <h2 style="color: var(--text-primary); margin-bottom: 20px;">💻 System & Performance</h2>
                <p style="color: var(--text-secondary); margin-bottom: 30px;">Monitor system performance and manage settings</p>
                
                <div class="glass-panel" style="margin-bottom: 30px;">
                    <h3 style="color: var(--text-primary); margin-bottom: 15px;">System Information</h3>
                    <div class="system-info" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
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
                
                <div class="glass-panel">
                    <h3 style="color: var(--text-primary); margin-bottom: 15px;">System Actions</h3>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="action-btn secondary" onclick="window.pixelPusher.modules.settings.clearCache()">
                            🗑️ Clear Cache
                        </button>
                        <button class="action-btn secondary" onclick="window.pixelPusher.modules.settings.reloadApp()">
                            🔄 Reload App
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    generateGameSettings() {
        return `
            <div class="settings-section">
                <h2 style="color: var(--text-primary); margin-bottom: 20px;">🎮 Games & Entertainment</h2>
                <p style="color: var(--text-secondary); margin-bottom: 30px;">Configure games and view achievements</p>
                
                <div class="glass-panel">
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

    generateAboutContent() {
        return `
            <div class="settings-section">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="font-size: 64px; margin-bottom: 15px;">🎨</div>
                    <h1 style="color: var(--text-primary); margin-bottom: 10px;">Pixel Pusher OS</h1>
                    <p style="color: var(--text-secondary); font-size: 18px;">Version 2.0.0</p>
                    <p style="color: var(--text-secondary);">A Modern Web-Based Desktop Environment</p>
                </div>
                
                <div class="glass-panel" style="text-align: center;">
                    <h3 style="color: var(--text-primary); margin-bottom: 15px;">System Stats</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                        <div>
                            <strong style="color: var(--text-primary);">Uptime:</strong>
                            <div style="color: var(--text-secondary);">${this.formatUptime(performance.now())}</div>
                        </div>
                        <div>
                            <strong style="color: var(--text-primary);">Current Theme:</strong>
                            <div style="color: var(--text-secondary);">${this.getPreference('theme', 'default')}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Continue with rest of methods from original implementation...

    handleSettingChange(settings, e) {
        const element = e.target;
        const settingName = element.dataset.setting;

        if (!settingName) return;

        let value;
        if (element.type === 'checkbox') {
            value = element.checked;
        } else if (element.type === 'range') {
            value = parseFloat(element.value);
            // Update display value
            const valueDisplay = document.getElementById(`${settingName}-value`);
            if (valueDisplay) {
                if (settingName === 'windowOpacity') {
                    valueDisplay.textContent = `${Math.round(value * 100)}%`;
                } else {
                    valueDisplay.textContent = `${value}px`;
                }
            }
        } else {
            value = element.value;
        }

        this.setPreference(settingName, value);
        this.applySettingChange(settingName, value);
    }

    applySettingChange(settingName, value) {
        switch (settingName) {
            case 'fontSize':
                document.documentElement.style.fontSize = `${value}px`;
                break;
            case 'animations':
                document.body.classList.toggle('no-animations', !value);
                break;
            case 'windowOpacity':
                document.querySelectorAll('.window').forEach(win => {
                    win.style.opacity = value;
                });
                break;
            case 'glassEffect':
                document.body.classList.toggle('no-glass-effect', !value);
                break;
        }
    }

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

    switchSettingsTab(settings, tabName) {
        settings.activeTab = tabName;
        this.updateActiveNavItem(settings, tabName);
        this.loadSettingsTab(settings, tabName);
    }

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

    // Preference management
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
        const savedTheme = this.getPreference('theme', 'default');
        this.setTheme(savedTheme);

        // Apply saved wallpaper
        const savedWallpaper = this.getPreference('wallpaper');
        if (savedWallpaper) {
            this.setWallpaper(savedWallpaper);
        }

        // Apply other preferences
        const fontSize = this.getPreference('fontSize', 14);
        document.documentElement.style.fontSize = `${fontSize}px`;

        const animations = this.getPreference('animations', true);
        document.body.classList.toggle('no-animations', !animations);

        const windowOpacity = this.getPreference('windowOpacity', 0.95);
        document.querySelectorAll('.window').forEach(win => {
            win.style.opacity = windowOpacity;
        });

        console.log('📋 Enhanced settings preferences loaded');
    }

    // Utility methods
    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    resetToDefaults() {
        if (confirm('Reset all settings to defaults? This will reload the page.')) {
            localStorage.removeItem('pixelpusher_preferences');
            window.location.reload();
        }
    }

    exportSettings() {
        const settings = {
            theme: this.getPreference('theme'),
            wallpaper: this.getPreference('wallpaper'),
            fontSize: this.getPreference('fontSize'),
            animations: this.getPreference('animations'),
            windowOpacity: this.getPreference('windowOpacity'),
            glassEffect: this.getPreference('glassEffect'),
            soundEnabled: this.getPreference('soundEnabled'),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
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

    updateThemePreview(themeName) {
        // Update any open settings windows with new theme preview
        this.settings.forEach(settings => {
            if (settings.activeTab === 'appearance' || settings.activeTab === 'themes') {
                this.loadSettingsTab(settings, settings.activeTab);
            }
        });
    }

    getStats() {
        return {
            activeSettings: this.settings.size,
            currentTheme: this.getPreference('theme', 'default'),
            availableThemes: Object.keys(this.themes).length,
            availableWallpapers: Object.values(this.wallpapers).flat().length,
            customWallpapers: this.customWallpapers.length
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

// Global availability
window.SettingsManager = SettingsManager;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsManager;
}

console.log('⚙️ Enhanced Settings manager with advanced theming loaded successfully');