/**
 * Pixel Pusher OS - Desktop Manager
 * Handles desktop icons, wallpaper, and desktop environment management
 * Updated to remove web browser icon
 */

class DesktopManager {
    constructor() {
        this.icons = [];
        this.wallpaper = null;
        this.theme = 'default';
        this.gridSize = 120; // Icon grid size in pixels
        this.draggedIcon = null;
        this.contextMenu = null;

        console.log('🖥️ Desktop Manager initialized');
    }

    /**
     * Initialize desktop environment
     */
    async init() {
        try {
            // Set up desktop container
            this.setupDesktopContainer();

            // Load desktop icons
            await this.loadDesktopIcons();

            // Set up event handlers
            this.setupEventHandlers();

            // Apply saved theme and wallpaper
            this.loadSavedSettings();

            // Set up context menu
            this.setupContextMenu();

            console.log('✅ Desktop environment ready');

        } catch (error) {
            console.error('❌ Desktop initialization failed:', error);
        }
    }

    /**
     * Set up desktop container and basic structure
     */
    setupDesktopContainer() {
        const desktop = document.getElementById('desktop');
        if (!desktop) {
            console.error('Desktop container not found');
            return;
        }

        // Ensure desktop has proper styling
        desktop.style.position = 'relative';
        desktop.style.width = '100%';
        desktop.style.height = '100vh';
        desktop.style.overflow = 'hidden';

        // Add CSS classes if not present
        if (!desktop.classList.contains('desktop')) {
            desktop.classList.add('desktop');
        }
    }

    /**
     * Load desktop icons from state manager
     */
    async loadDesktopIcons() {
        const stateManager = window.pixelPusher?.modules?.state;

        if (stateManager) {
            this.icons = stateManager.getDesktopIcons() || [];
        } else {
            // Fallback to default icons
            this.icons = this.getDefaultIcons();
        }

        // Render all icons
        this.renderAllIcons();

        console.log(`📁 Loaded ${this.icons.length} desktop icons`);
    }

    /**
     * Get default desktop icons configuration
     * REMOVED WEB BROWSER ICON
     */
    getDefaultIcons() {
        return [
            // System applications
            { id: 'terminal', name: 'Terminal', icon: '💻', x: 60, y: 80, category: 'system' },
            { id: 'explorer', name: 'File Explorer', icon: '📁', x: 60, y: 200, category: 'system' },
            // REMOVED: { id: 'browser', name: 'Web Browser', icon: '🌐', x: 60, y: 320, category: 'internet' },

            // Games
            { id: 'snake', name: 'Snake Game', icon: '🐍', x: 180, y: 80, category: 'games' },
            { id: 'dino', name: 'Dino Runner', icon: '🦕', x: 180, y: 200, category: 'games' },
            { id: 'village', name: 'Village Builder', icon: '🏘️', x: 180, y: 320, category: 'games' },
            { id: 'memory', name: 'Memory Match', icon: '🧠', x: 300, y: 80, category: 'games' },

            // Media and tools
            { id: 'musicplayer', name: 'Music Player', icon: '🎵', x: 300, y: 200, category: 'media' },
            { id: 'settings', name: 'System Settings', icon: '⚙️', x: 300, y: 320, category: 'system' },
            { id: 'taskmanager', name: 'Task Manager', icon: '📊', x: 420, y: 80, category: 'system' },

            // System actions
            { id: 'logout', name: 'Sign Out', icon: '🚪', x: 420, y: 200, category: 'system' }
        ];
    }

    /**
     * Render all desktop icons
     */
    renderAllIcons() {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        // Clear existing icons
        desktop.querySelectorAll('.desktop-icon').forEach(icon => icon.remove());

        // Filter out any browser icons that might exist
        this.icons = this.icons.filter(icon => icon.id !== 'browser');

        // Render each icon
        this.icons.forEach(iconData => {
            this.renderIcon(iconData);
        });
    }

    /**
     * Render a single desktop icon
     */
    renderIcon(iconData) {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        // Skip browser icon if somehow it's still in the data
        if (iconData.id === 'browser') return;

        // Create icon element
        const iconElement = document.createElement('div');
        iconElement.className = 'desktop-icon';
        iconElement.id = `icon-${iconData.id}`;
        iconElement.dataset.iconId = iconData.id;
        iconElement.dataset.category = iconData.category;

        // Position the icon
        iconElement.style.position = 'absolute';
        iconElement.style.left = iconData.x + 'px';
        iconElement.style.top = iconData.y + 'px';
        iconElement.style.width = '80px';
        iconElement.style.height = '80px';
        iconElement.style.cursor = 'pointer';
        iconElement.style.userSelect = 'none';
        iconElement.style.textAlign = 'center';
        iconElement.style.display = 'flex';
        iconElement.style.flexDirection = 'column';
        iconElement.style.alignItems = 'center';
        iconElement.style.justifyContent = 'center';
        iconElement.style.padding = '8px';
        iconElement.style.borderRadius = '8px';
        iconElement.style.transition = 'all 0.2s ease';

        // Create icon content
        iconElement.innerHTML = `
            <div class="icon-image" style="font-size: 32px; margin-bottom: 4px;">
                ${iconData.icon}
            </div>
            <div class="icon-label" style="font-size: 11px; color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.8); word-wrap: break-word; line-height: 1.2;">
                ${iconData.name}
            </div>
        `;

        // Add event handlers
        this.setupIconEventHandlers(iconElement, iconData);

        // Add to desktop
        desktop.appendChild(iconElement);
    }

    /**
     * Set up event handlers for a desktop icon
     */
    setupIconEventHandlers(iconElement, iconData) {
        // Double-click to open application
        iconElement.addEventListener('dblclick', (e) => {
            e.preventDefault();
            this.openApplication(iconData.id);
        });

        // Single click to select
        iconElement.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.selectIcon(iconElement);
        });

        // Right-click for context menu
        iconElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showIconContextMenu(e, iconData);
        });

        // Drag and drop functionality
        iconElement.draggable = true;

        iconElement.addEventListener('dragstart', (e) => {
            this.handleDragStart(e, iconData);
        });

        iconElement.addEventListener('dragend', (e) => {
            this.handleDragEnd(e);
        });

        // Hover effects
        iconElement.addEventListener('mouseenter', () => {
            iconElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            iconElement.style.transform = 'scale(1.05)';
        });

        iconElement.addEventListener('mouseleave', () => {
            if (!iconElement.classList.contains('selected')) {
                iconElement.style.backgroundColor = 'transparent';
                iconElement.style.transform = 'scale(1)';
            }
        });
    }

    /**
     * Select a desktop icon
     */
    selectIcon(iconElement) {
        // Deselect all other icons
        document.querySelectorAll('.desktop-icon.selected').forEach(icon => {
            icon.classList.remove('selected');
            icon.style.backgroundColor = 'transparent';
            icon.style.transform = 'scale(1)';
        });

        // Select this icon
        iconElement.classList.add('selected');
        iconElement.style.backgroundColor = 'rgba(0, 217, 255, 0.3)';
        iconElement.style.transform = 'scale(1.05)';
    }

    /**
     * Open an application
     */
    openApplication(appId) {
        console.log(`🚀 Opening application: ${appId}`);

        // Handle special cases
        if (appId === 'logout') {
            this.handleLogout();
            return;
        }

        // Use window manager to open application
        if (window.pixelPusher?.modules?.windows) {
            window.pixelPusher.modules.windows.open(appId);
        } else {
            console.warn(`Cannot open ${appId}: Window manager not available`);
        }
    }

    /**
     * Handle logout action
     */
    handleLogout() {
        if (confirm('Are you sure you want to sign out?')) {
            window.location.href = '/logout';
        }
    }

    /**
     * Handle drag start for icon
     */
    handleDragStart(e, iconData) {
        this.draggedIcon = iconData;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);

        // Add visual feedback
        e.target.style.opacity = '0.5';
    }

    /**
     * Handle drag end for icon
     */
    handleDragEnd(e) {
        e.target.style.opacity = '';
        this.draggedIcon = null;
    }

    /**
     * Set up global event handlers
     */
    setupEventHandlers() {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        // Handle desktop clicks (deselect icons)
        desktop.addEventListener('click', (e) => {
            if (e.target === desktop) {
                this.deselectAllIcons();
            }
        });

        // Handle desktop drag and drop
        desktop.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        desktop.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleDesktopDrop(e);
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    /**
     * Handle dropping icon on desktop
     */
    handleDesktopDrop(e) {
        if (!this.draggedIcon) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Snap to grid
        const snappedX = Math.round(x / this.gridSize) * this.gridSize;
        const snappedY = Math.round(y / this.gridSize) * this.gridSize;

        // Update icon position
        this.updateIconPosition(this.draggedIcon.id, snappedX, snappedY);
    }

    /**
     * Update icon position
     */
    updateIconPosition(iconId, x, y) {
        // Find icon in array
        const icon = this.icons.find(i => i.id === iconId);
        if (!icon) return;

        // Update position
        icon.x = x;
        icon.y = y;

        // Update DOM element
        const iconElement = document.getElementById(`icon-${iconId}`);
        if (iconElement) {
            iconElement.style.left = x + 'px';
            iconElement.style.top = y + 'px';
        }

        // Save to state
        if (window.pixelPusher?.modules?.state) {
            window.pixelPusher.modules.state.updateIconPosition(iconId, x, y);
        }

        console.log(`📍 Icon ${iconId} moved to (${x}, ${y})`);
    }

    /**
     * Deselect all icons
     */
    deselectAllIcons() {
        document.querySelectorAll('.desktop-icon.selected').forEach(icon => {
            icon.classList.remove('selected');
            icon.style.backgroundColor = 'transparent';
            icon.style.transform = 'scale(1)';
        });
    }

    /**
     * Set up desktop context menu
     */
    setupContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu) {
            this.contextMenu = contextMenu;
        } else {
            this.createContextMenu();
        }
    }

    /**
     * Create desktop context menu
     */
    createContextMenu() {
        const contextMenu = document.createElement('div');
        contextMenu.id = 'contextMenu';
        contextMenu.className = 'context-menu';
        contextMenu.style.display = 'none';
        contextMenu.style.position = 'fixed';
        contextMenu.style.zIndex = '9999';
        contextMenu.style.backgroundColor = 'var(--surface)';
        contextMenu.style.border = '1px solid var(--border)';
        contextMenu.style.borderRadius = '8px';
        contextMenu.style.padding = '8px 0';
        contextMenu.style.minWidth = '150px';
        contextMenu.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';

        contextMenu.innerHTML = `
            <div class="context-item" onclick="contextAction('terminal')">
                💻 Open Terminal
            </div>
            <div class="context-item" onclick="contextAction('explorer')">
                📁 Open File Explorer
            </div>
            <div class="context-separator"></div>
            <div class="context-item" onclick="contextAction('newfile')">
                📄 New File
            </div>
            <div class="context-item" onclick="contextAction('newfolder')">
                📂 New Folder
            </div>
            <div class="context-separator"></div>
            <div class="context-item" onclick="contextAction('refresh')">
                🔄 Refresh Desktop
            </div>
        `;

        // Add CSS styles
        const style = document.createElement('style');
        style.textContent = `
            .context-item {
                padding: 8px 16px;
                cursor: pointer;
                color: var(--text-primary);
                font-size: 14px;
                transition: background-color 0.2s;
            }
            .context-item:hover {
                background-color: var(--primary);
                color: white;
            }
            .context-separator {
                height: 1px;
                background-color: var(--border);
                margin: 4px 0;
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(contextMenu);
        this.contextMenu = contextMenu;
    }

    /**
     * Show icon-specific context menu
     */
    showIconContextMenu(e, iconData) {
        // Create temporary context menu for icon
        const iconMenu = document.createElement('div');
        iconMenu.className = 'context-menu icon-context-menu';
        iconMenu.style.position = 'fixed';
        iconMenu.style.left = e.clientX + 'px';
        iconMenu.style.top = e.clientY + 'px';
        iconMenu.style.zIndex = '9999';
        iconMenu.style.backgroundColor = 'var(--surface)';
        iconMenu.style.border = '1px solid var(--border)';
        iconMenu.style.borderRadius = '8px';
        iconMenu.style.padding = '8px 0';
        iconMenu.style.minWidth = '120px';
        iconMenu.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';

        iconMenu.innerHTML = `
            <div class="context-item" onclick="window.pixelPusher.modules.desktop.openApplication('${iconData.id}')">
                🚀 Open
            </div>
            <div class="context-separator"></div>
            <div class="context-item" onclick="window.pixelPusher.modules.desktop.showIconProperties('${iconData.id}')">
                ℹ️ Properties
            </div>
        `;

        document.body.appendChild(iconMenu);

        // Remove menu when clicking elsewhere
        setTimeout(() => {
            document.addEventListener('click', function removeMenu() {
                iconMenu.remove();
                document.removeEventListener('click', removeMenu);
            });
        }, 100);
    }

    /**
     * Show icon properties
     */
    showIconProperties(iconId) {
        const icon = this.icons.find(i => i.id === iconId);
        if (!icon) return;

        const propertiesHTML = `
            <div style="text-align: left;">
                <h3>${icon.icon} ${icon.name}</h3>
                <p><strong>Type:</strong> ${icon.category}</p>
                <p><strong>Position:</strong> ${icon.x}, ${icon.y}</p>
                <p><strong>ID:</strong> ${icon.id}</p>
            </div>
        `;

        if (window.pixelPusher) {
            window.pixelPusher.showModal(`${icon.name} Properties`, propertiesHTML);
        }
    }

    /**
     * Load saved desktop settings
     */
    loadSavedSettings() {
        const stateManager = window.pixelPusher?.modules?.state;
        if (!stateManager) return;

        // Load theme
        const savedTheme = stateManager.getPreference('theme', 'default');
        this.setTheme(savedTheme);

        // Load wallpaper
        const savedWallpaper = stateManager.getPreference('wallpaper');
        if (savedWallpaper) {
            this.setWallpaper(savedWallpaper);
        }
    }

    /**
     * Set desktop theme
     */
    setTheme(themeName) {
        this.theme = themeName;
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeName}`);

        console.log(`🎨 Theme changed to: ${themeName}`);
    }

    /**
     * Set desktop wallpaper
     */
    setWallpaper(wallpaperUrl) {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        this.wallpaper = wallpaperUrl;

        if (wallpaperUrl) {
            desktop.style.backgroundImage = `url(${wallpaperUrl})`;
            desktop.style.backgroundSize = 'cover';
            desktop.style.backgroundPosition = 'center';
            desktop.style.backgroundRepeat = 'no-repeat';
        } else {
            desktop.style.backgroundImage = '';
        }

        console.log(`🖼️ Wallpaper changed to: ${wallpaperUrl || 'none'}`);
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Ensure icons stay within desktop bounds
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        const desktopRect = desktop.getBoundingClientRect();
        const maxX = desktopRect.width - 80; // Icon width
        const maxY = desktopRect.height - 80; // Icon height

        this.icons.forEach(icon => {
            // Clamp icon positions to desktop bounds
            if (icon.x > maxX) {
                this.updateIconPosition(icon.id, maxX, icon.y);
            }
            if (icon.y > maxY) {
                this.updateIconPosition(icon.id, icon.x, maxY);
            }
        });
    }

    /**
     * Add new desktop icon
     */
    addIcon(iconData) {
        // Don't add browser icon
        if (iconData.id === 'browser') return;

        this.icons.push(iconData);
        this.renderIcon(iconData);

        // Save to state
        if (window.pixelPusher?.modules?.state) {
            window.pixelPusher.modules.state.addDesktopIcon(iconData);
        }
    }

    /**
     * Remove desktop icon
     */
    removeIcon(iconId) {
        // Remove from array
        this.icons = this.icons.filter(icon => icon.id !== iconId);

        // Remove from DOM
        const iconElement = document.getElementById(`icon-${iconId}`);
        if (iconElement) {
            iconElement.remove();
        }

        // Save to state
        if (window.pixelPusher?.modules?.state) {
            window.pixelPusher.modules.state.removeDesktopIcon(iconId);
        }
    }

    /**
     * Get desktop statistics
     */
    getStats() {
        return {
            totalIcons: this.icons.length,
            iconsByCategory: this.icons.reduce((acc, icon) => {
                acc[icon.category] = (acc[icon.category] || 0) + 1;
                return acc;
            }, {}),
            theme: this.theme,
            wallpaper: this.wallpaper,
            gridSize: this.gridSize
        };
    }

    /**
     * Clean up desktop manager
     */
    destroy() {
        // Remove event listeners (would need to track them to remove properly)
        // Clear context menu
        if (this.contextMenu) {
            this.contextMenu.remove();
        }

        console.log('🖥️ Desktop Manager destroyed');
    }
}
window.DesktopManager = DesktopManager;
// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DesktopManager;
}

console.log('🖥️ Desktop manager loaded successfully');