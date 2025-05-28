/**
 * Pixel Pusher OS - Enhanced Desktop Manager
 * Improved desktop icons layout with better positioning and grid system
 * Features proper spacing, responsive layout, and visual appeal
 */

class DesktopManager {
    constructor() {
        this.icons = [];
        this.wallpaper = null;
        this.theme = 'default';
        this.gridSize = 140; // Increased grid size for better spacing
        this.iconSize = 80;
        this.iconSpacing = 20;
        this.margin = 40; // Margin from screen edges
        this.draggedIcon = null;
        this.contextMenu = null;
        this.autoArrange = true;

        console.log('🖥️ Enhanced Desktop Manager initialized');
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

            // Auto-arrange icons on first load
            if (this.autoArrange) {
                this.arrangeIconsInGrid();
            }

            console.log('✅ Enhanced desktop environment ready');

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

        // Add desktop background pattern (optional)
        this.addDesktopPattern();
    }

    /**
     * Add subtle desktop background pattern
     */
    addDesktopPattern() {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        // Create a subtle dot pattern overlay
        const pattern = document.createElement('div');
        pattern.id = 'desktop-pattern';
        pattern.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
            background-size: 40px 40px;
            pointer-events: none;
            z-index: 1;
            opacity: 0.3;
        `;
        desktop.appendChild(pattern);
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

        // Remove any browser icons that might exist
        this.icons = this.icons.filter(icon => icon.id !== 'browser');

        // If no custom positions, arrange in grid
        const hasCustomPositions = this.icons.some(icon =>
            icon.x !== undefined && icon.y !== undefined
        );

        if (!hasCustomPositions) {
            this.arrangeIconsInGrid();
        }

        // Render all icons
        this.renderAllIcons();

        console.log(`📁 Loaded ${this.icons.length} desktop icons`);
    }

    /**
     * Get default desktop icons configuration with better organization
     */
    getDefaultIcons() {
        return [
            // System applications (left column)
            { id: 'terminal', name: 'Terminal', icon: '💻', category: 'system', group: 'system' },
            { id: 'explorer', name: 'File Explorer', icon: '📁', category: 'system', group: 'system' },
            { id: 'settings', name: 'Settings', icon: '⚙️', category: 'system', group: 'system' },
            { id: 'taskmanager', name: 'Task Manager', icon: '📊', category: 'system', group: 'system' },

            // Games (middle area)
            { id: 'snake', name: 'Snake', icon: '🐍', category: 'games', group: 'games' },
            { id: 'dino', name: 'Dino Runner', icon: '🦕', category: 'games', group: 'games' },
            { id: 'memory', name: 'Memory Match', icon: '🧠', category: 'games', group: 'games' },
            { id: 'village', name: 'Village Builder', icon: '🏘️', category: 'games', group: 'games' },

            // Media and productivity (right area)
            { id: 'musicplayer', name: 'Music Player', icon: '🎵', category: 'media', group: 'media' },

            // System actions (bottom)
            { id: 'logout', name: 'Sign Out', icon: '🚪', category: 'system', group: 'actions' }
        ];
    }

    /**
     * Arrange icons in a smart grid layout
     */
    arrangeIconsInGrid() {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        const desktopRect = desktop.getBoundingClientRect();
        const usableWidth = desktopRect.width - (this.margin * 2);
        const usableHeight = desktopRect.height - (this.margin * 2) - 80; // Account for taskbar

        const cols = Math.floor(usableWidth / this.gridSize);
        const rows = Math.floor(usableHeight / this.gridSize);

        console.log(`🖥️ Grid layout: ${cols}x${rows} (${usableWidth}x${usableHeight}px)`);

        // Group icons by category for better organization
        const groupedIcons = this.groupIconsByCategory();

        let currentCol = 0;
        let currentRow = 0;

        // Arrange icons group by group
        Object.keys(groupedIcons).forEach(group => {
            const icons = groupedIcons[group];

            console.log(`📋 Arranging ${icons.length} icons in ${group} group`);

            icons.forEach((icon, index) => {
                // Calculate position with better spacing
                const x = this.margin + (currentCol * this.gridSize) + (this.gridSize - this.iconSize) / 2;
                const y = this.margin + (currentRow * this.gridSize) + (this.gridSize - this.iconSize) / 2;

                icon.x = x;
                icon.y = y;

                console.log(`📍 Positioned ${icon.name} at (${x}, ${y})`);

                // Move to next position
                currentCol++;
                if (currentCol >= cols) {
                    currentCol = 0;
                    currentRow++;
                }

                // Prevent overflow
                if (currentRow >= rows) {
                    console.warn('🚨 Desktop grid overflow, wrapping to next available space');
                    currentRow = 0;
                    currentCol = 0;
                }
            });

            // Add some spacing between groups
            currentCol++;
            if (currentCol >= cols) {
                currentCol = 0;
                currentRow++;
            }
        });

        // Save positions to state
        if (window.pixelPusher?.modules?.state) {
            this.icons.forEach(icon => {
                window.pixelPusher.modules.state.updateIconPosition(icon.id, icon.x, icon.y);
            });
        }
    }

    /**
     * Group icons by category for better organization
     */
    groupIconsByCategory() {
        const groups = {
            system: [],
            games: [],
            media: [],
            actions: []
        };

        this.icons.forEach(icon => {
            const group = icon.group || icon.category || 'system';
            if (groups[group]) {
                groups[group].push(icon);
            } else {
                groups.system.push(icon);
            }
        });

        return groups;
    }

    /**
     * Render all desktop icons with enhanced styling
     */
    renderAllIcons() {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        // Clear existing icons
        desktop.querySelectorAll('.desktop-icon').forEach(icon => icon.remove());

        // Filter out browser icons
        this.icons = this.icons.filter(icon => icon.id !== 'browser');

        // Render each icon with enhanced styling
        this.icons.forEach(iconData => {
            this.renderIcon(iconData);
        });

        console.log(`✨ Rendered ${this.icons.length} desktop icons`);
    }

    /**
     * Render a single desktop icon with enhanced styling
     */
    renderIcon(iconData) {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        // Skip browser icon
        if (iconData.id === 'browser') return;

        // Create icon element
        const iconElement = document.createElement('div');
        iconElement.className = 'desktop-icon enhanced-icon';
        iconElement.id = `icon-${iconData.id}`;
        iconElement.dataset.iconId = iconData.id;
        iconElement.dataset.category = iconData.category;
        iconElement.dataset.group = iconData.group || iconData.category;

        // Enhanced positioning and styling
        iconElement.style.cssText = `
            position: absolute;
            left: ${iconData.x}px;
            top: ${iconData.y}px;
            width: ${this.iconSize}px;
            height: ${this.iconSize + 20}px;
            cursor: pointer;
            user-select: none;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 8px;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
            z-index: 10;
            transform-origin: center;
        `;

        // Create enhanced icon content
        iconElement.innerHTML = `
            <div class="icon-image" style="
                font-size: 36px;
                margin-bottom: 6px;
                transition: all 0.3s ease;
                filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
                transform-origin: center;
            ">
                ${iconData.icon}
            </div>
            <div class="icon-label" style="
                font-size: 11px;
                font-weight: 500;
                color: white;
                text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
                word-wrap: break-word;
                line-height: 1.2;
                max-width: 100%;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                transition: all 0.3s ease;
            ">
                ${iconData.name}
            </div>
        `;

        // Add event handlers with enhanced interactions
        this.setupIconEventHandlers(iconElement, iconData);

        // Add to desktop with animation
        desktop.appendChild(iconElement);

        // Animate in
        setTimeout(() => {
            iconElement.style.opacity = '1';
            iconElement.style.transform = 'scale(1)';
        }, Math.random() * 500 + 100);
    }

    /**
     * Set up enhanced event handlers for desktop icons
     */
    setupIconEventHandlers(iconElement, iconData) {
        // Double-click to open application
        iconElement.addEventListener('dblclick', (e) => {
            e.preventDefault();
            this.openApplication(iconData.id);

            // Visual feedback
            iconElement.style.transform = 'scale(0.9)';
            setTimeout(() => {
                iconElement.style.transform = 'scale(1)';
            }, 150);
        });

        // Single click to select with enhanced feedback
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

        // Enhanced hover effects
        iconElement.addEventListener('mouseenter', () => {
            iconElement.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            iconElement.style.transform = 'scale(1.1) translateY(-2px)';
            iconElement.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';

            // Animate icon
            const iconImage = iconElement.querySelector('.icon-image');
            if (iconImage) {
                iconImage.style.transform = 'scale(1.1) rotate(5deg)';
            }
        });

        iconElement.addEventListener('mouseleave', () => {
            if (!iconElement.classList.contains('selected')) {
                iconElement.style.backgroundColor = 'transparent';
                iconElement.style.transform = 'scale(1) translateY(0)';
                iconElement.style.boxShadow = 'none';

                // Reset icon animation
                const iconImage = iconElement.querySelector('.icon-image');
                if (iconImage) {
                    iconImage.style.transform = 'scale(1) rotate(0deg)';
                }
            }
        });

        // Enhanced drag and drop
        this.setupDragAndDrop(iconElement, iconData);
    }

    /**
     * Set up enhanced drag and drop functionality
     */
    setupDragAndDrop(iconElement, iconData) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        let dragOffset = { x: 0, y: 0 };

        iconElement.addEventListener('mousedown', (e) => {
            if (e.detail === 2) return; // Ignore double-clicks

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = iconElement.offsetLeft;
            initialY = iconElement.offsetTop;

            // Calculate drag offset
            const rect = iconElement.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;

            // Visual feedback
            iconElement.style.zIndex = '1000';
            iconElement.style.transform = 'scale(1.1) rotate(5deg)';
            iconElement.style.opacity = '0.8';
            iconElement.style.cursor = 'grabbing';

            // Create drag ghost
            this.createDragGhost(iconElement, iconData);

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);

            e.preventDefault();
        });

        const onMouseMove = (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            iconElement.style.left = (initialX + deltaX) + 'px';
            iconElement.style.top = (initialY + deltaY) + 'px';
        };

        const onMouseUp = (e) => {
            if (!isDragging) return;

            isDragging = false;

            // Reset visual feedback
            iconElement.style.zIndex = '10';
            iconElement.style.transform = 'scale(1) rotate(0deg)';
            iconElement.style.opacity = '1';
            iconElement.style.cursor = 'pointer';

            // Snap to grid
            this.snapToGrid(iconElement, iconData);

            // Remove drag ghost
            this.removeDragGhost();

            // Save new position
            this.saveIconPosition(iconData);

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }

    /**
     * Create visual ghost element during drag
     */
    createDragGhost(iconElement, iconData) {
        const ghost = document.createElement('div');
        ghost.id = 'drag-ghost';
        ghost.innerHTML = iconElement.innerHTML;
        ghost.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 9999;
            opacity: 0.5;
            transform: scale(0.8);
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 8px;
            backdrop-filter: blur(10px);
        `;

        document.body.appendChild(ghost);

        // Update position on mouse move
        document.addEventListener('mousemove', (e) => {
            ghost.style.left = (e.clientX - 40) + 'px';
            ghost.style.top = (e.clientY - 40) + 'px';
        });
    }

    /**
     * Remove drag ghost
     */
    removeDragGhost() {
        const ghost = document.getElementById('drag-ghost');
        if (ghost) {
            ghost.remove();
        }
    }

    /**
     * Snap icon to grid
     */
    snapToGrid(iconElement, iconData) {
        const currentX = parseInt(iconElement.style.left);
        const currentY = parseInt(iconElement.style.top);

        // Calculate nearest grid position
        const gridX = Math.round((currentX - this.margin) / this.gridSize) * this.gridSize + this.margin + (this.gridSize - this.iconSize) / 2;
        const gridY = Math.round((currentY - this.margin) / this.gridSize) * this.gridSize + this.margin + (this.gridSize - this.iconSize) / 2;

        // Ensure within bounds
        const desktop = document.getElementById('desktop');
        const maxX = desktop.offsetWidth - this.iconSize - this.margin;
        const maxY = desktop.offsetHeight - this.iconSize - this.margin - 80; // Account for taskbar

        iconData.x = Math.max(this.margin, Math.min(gridX, maxX));
        iconData.y = Math.max(this.margin, Math.min(gridY, maxY));

        // Animate to final position
        iconElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        iconElement.style.left = iconData.x + 'px';
        iconElement.style.top = iconData.y + 'px';

        // Reset transition after animation
        setTimeout(() => {
            iconElement.style.transition = '';
        }, 300);
    }

    /**
     * Enhanced icon selection
     */
    selectIcon(iconElement) {
        // Deselect all other icons
        document.querySelectorAll('.desktop-icon.selected').forEach(icon => {
            icon.classList.remove('selected');
            icon.style.backgroundColor = 'transparent';
            icon.style.transform = 'scale(1) translateY(0)';
            icon.style.boxShadow = 'none';
        });

        // Select this icon with enhanced feedback
        iconElement.classList.add('selected');
        iconElement.style.backgroundColor = 'rgba(100, 200, 255, 0.4)';
        iconElement.style.transform = 'scale(1.05) translateY(-2px)';
        iconElement.style.boxShadow = '0 8px 25px rgba(100, 200, 255, 0.4)';
        iconElement.style.border = '2px solid rgba(100, 200, 255, 0.8)';
    }

    /**
     * Open application with enhanced feedback
     */
    openApplication(appId) {
        console.log(`🚀 Opening application: ${appId}`);

        // Show loading indicator
        if (window.pixelPusher?.showNotification) {
            window.pixelPusher.showNotification(`Opening ${appId}...`, 'info', 2000);
        }

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
            // Save current state
            if (window.pixelPusher?.modules?.state) {
                window.pixelPusher.modules.state.saveState();
            }

            window.location.href = '/logout';
        }
    }

    /**
     * Save icon position to state
     */
    saveIconPosition(iconData) {
        // Update in memory
        const icon = this.icons.find(i => i.id === iconData.id);
        if (icon) {
            icon.x = iconData.x;
            icon.y = iconData.y;
        }

        // Save to state manager
        if (window.pixelPusher?.modules?.state) {
            window.pixelPusher.modules.state.updateIconPosition(iconData.id, iconData.x, iconData.y);
        }

        console.log(`📍 Saved position for ${iconData.id}: (${iconData.x}, ${iconData.y})`);
    }

    /**
     * Auto-arrange all icons
     */
    autoArrangeIcons() {
        console.log('🔄 Auto-arranging desktop icons...');

        this.arrangeIconsInGrid();
        this.renderAllIcons();

        if (window.pixelPusher?.showNotification) {
            window.pixelPusher.showNotification('Desktop icons arranged', 'success');
        }
    }

    /**
     * Set up enhanced event handlers
     */
    setupEventHandlers() {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        // Handle desktop clicks (deselect icons)
        desktop.addEventListener('click', (e) => {
            if (e.target === desktop || e.target.id === 'desktop-pattern') {
                this.deselectAllIcons();
            }
        });

        // Handle window resize with enhanced repositioning
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // F5 or Ctrl+R to refresh/auto-arrange
        if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
            e.preventDefault();
            this.autoArrangeIcons();
        }

        // Delete key to remove selected icon (if custom)
        if (e.key === 'Delete') {
            const selectedIcon = document.querySelector('.desktop-icon.selected');
            if (selectedIcon && selectedIcon.dataset.category === 'custom') {
                const iconId = selectedIcon.dataset.iconId;
                if (confirm(`Remove ${iconId} from desktop?`)) {
                    this.removeIcon(iconId);
                }
            }
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        console.log('🖥️ Desktop resized, adjusting icons...');

        // Ensure icons stay within desktop bounds
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        const desktopRect = desktop.getBoundingClientRect();
        const maxX = desktopRect.width - this.iconSize - this.margin;
        const maxY = desktopRect.height - this.iconSize - this.margin - 80; // Account for taskbar

        let repositioned = false;

        this.icons.forEach(icon => {
            const iconElement = document.getElementById(`icon-${icon.id}`);
            if (!iconElement) return;

            // Check if icon is out of bounds
            if (icon.x > maxX || icon.y > maxY) {
                // Reposition within bounds
                icon.x = Math.min(icon.x, maxX);
                icon.y = Math.min(icon.y, maxY);

                iconElement.style.left = icon.x + 'px';
                iconElement.style.top = icon.y + 'px';

                repositioned = true;
            }
        });

        if (repositioned) {
            console.log('📍 Repositioned icons due to screen resize');
        }
    }

    /**
     * Deselect all icons
     */
    deselectAllIcons() {
        document.querySelectorAll('.desktop-icon.selected').forEach(icon => {
            icon.classList.remove('selected');
            icon.style.backgroundColor = 'transparent';
            icon.style.transform = 'scale(1) translateY(0)';
            icon.style.boxShadow = 'none';
            icon.style.border = 'none';
        });
    }

    /**
     * Set up enhanced context menu
     */
    setupContextMenu() {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        desktop.addEventListener('contextmenu', (e) => {
            if (e.target === desktop || e.target.id === 'desktop-pattern') {
                e.preventDefault();
                this.showDesktopContextMenu(e.clientX, e.clientY);
            }
        });
    }

    /**
     * Show enhanced desktop context menu
     */
    showDesktopContextMenu(x, y) {
        // Remove existing context menu
        const existingMenu = document.getElementById('desktop-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.id = 'desktop-context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            background: rgba(20, 20, 30, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 8px 0;
            min-width: 200px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            z-index: 9999;
            color: white;
            font-size: 14px;
        `;

        menu.innerHTML = `
            <div class="context-item" onclick="window.pixelPusher.modules.desktop.openApplication('terminal')">
                💻 Open Terminal
            </div>
            <div class="context-item" onclick="window.pixelPusher.modules.desktop.openApplication('explorer')">
                📁 Open File Explorer
            </div>
            <div class="context-separator"></div>
            <div class="context-item" onclick="window.pixelPusher.modules.desktop.autoArrangeIcons()">
                🔄 Auto Arrange Icons
            </div>
            <div class="context-item" onclick="window.pixelPusher.modules.desktop.toggleGrid()">
                ⊞ Toggle Grid View
            </div>
            <div class="context-separator"></div>
            <div class="context-item" onclick="window.pixelPusher.modules.desktop.openApplication('settings')">
                ⚙️ Desktop Settings
            </div>
            <div class="context-item" onclick="window.location.reload()">
                🔄 Refresh Desktop
            </div>
        `;

        // Add context menu styles
        const style = document.createElement('style');
        style.textContent = `
            .context-item {
                padding: 10px 16px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .context-item:hover {
                background: rgba(100, 200, 255, 0.2);
            }
            .context-separator {
                height: 1px;
                background: rgba(255, 255, 255, 0.2);
                margin: 4px 0;
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(menu);

        // Position menu within viewport
        const menuRect = menu.getBoundingClientRect();
        if (menuRect.right > window.innerWidth) {
            menu.style.left = (x - menuRect.width) + 'px';
        }
        if (menuRect.bottom > window.innerHeight) {
            menu.style.top = (y - menuRect.height) + 'px';
        }

        // Remove menu when clicking elsewhere
        setTimeout(() => {
            document.addEventListener('click', function removeMenu() {
                menu.remove();
                document.removeEventListener('click', removeMenu);
            });
        }, 100);
    }

    /**
     * Toggle grid view
     */
    toggleGrid() {
        const pattern = document.getElementById('desktop-pattern');
        if (pattern) {
            pattern.style.display = pattern.style.display === 'none' ? 'block' : 'none';
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

        // Load grid preferences
        this.autoArrange = stateManager.getPreference('autoArrangeIcons', true);
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
     * Add new desktop icon
     */
    addIcon(iconData) {
        // Don't add browser icon
        if (iconData.id === 'browser') return;

        // Find suitable position
        this.findAvailablePosition(iconData);

        this.icons.push(iconData);
        this.renderIcon(iconData);

        // Save to state
        if (window.pixelPusher?.modules?.state) {
            window.pixelPusher.modules.state.addDesktopIcon(iconData);
        }
    }

    /**
     * Find available position for new icon
     */
    findAvailablePosition(iconData) {
        // Simple positioning algorithm
        let x = this.margin;
        let y = this.margin;

        // Check if position is occupied
        while (this.isPositionOccupied(x, y)) {
            x += this.gridSize;
            if (x + this.iconSize > window.innerWidth - this.margin) {
                x = this.margin;
                y += this.gridSize;
            }
        }

        iconData.x = x;
        iconData.y = y;
    }

    /**
     * Check if position is occupied
     */
    isPositionOccupied(x, y) {
        return this.icons.some(icon => {
            return Math.abs(icon.x - x) < this.iconSize &&
                   Math.abs(icon.y - y) < this.iconSize;
        });
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
            iconElement.style.transition = 'all 0.3s ease';
            iconElement.style.transform = 'scale(0)';
            iconElement.style.opacity = '0';

            setTimeout(() => {
                iconElement.remove();
            }, 300);
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
            gridSize: this.gridSize,
            autoArrange: this.autoArrange
        };
    }

    /**
     * Clean up desktop manager
     */
    destroy() {
        // Remove event listeners (would need to track them to remove properly)
        // Clear context menu
        const contextMenu = document.getElementById('desktop-context-menu');
        if (contextMenu) {
            contextMenu.remove();
        }

        // Remove desktop pattern
        const pattern = document.getElementById('desktop-pattern');
        if (pattern) {
            pattern.remove();
        }

        console.log('🖥️ Enhanced Desktop Manager destroyed');
    }
}

// Ensure global availability
window.DesktopManager = DesktopManager;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DesktopManager;
}

console.log('🖥️ Enhanced Desktop manager loaded successfully');