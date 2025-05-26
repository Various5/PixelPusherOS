/**
 * Pixel Pusher OS - File Explorer Manager
 * Handles file system navigation, file operations, and file management
 *
 * This module provides:
 * - File system navigation and browsing
 * - File and folder operations (create, delete, rename, move)
 * - File preview and media support
 * - File upload and download functionality
 * - Context menus and file selection
 * - Multiple explorer window support
 * - File search and filtering capabilities
 */

class ExplorerManager {
    constructor() {
        this.explorers = new Map(); // Active explorer instances
        this.currentPath = '/';
        this.navigationHistory = ['/'];
        this.historyIndex = 0;
        this.clipboard = null; // For cut/copy operations
        this.selectedFiles = new Set();
        this.viewMode = 'list'; // 'list' or 'grid'
        this.sortBy = 'name'; // 'name', 'size', 'date', 'type'
        this.sortOrder = 'asc'; // 'asc' or 'desc'

        console.log('📁 File Explorer Manager initialized');
    }

    /**
     * Initialize file explorer system
     */
    async init() {
        try {
            // Load saved preferences
            this.loadPreferences();

            // Set up global explorer shortcuts
            this.setupGlobalShortcuts();

            // Initialize file type associations
            this.initializeFileTypes();

            console.log('✅ File Explorer system ready');

        } catch (error) {
            console.error('❌ File Explorer initialization failed:', error);
        }
    }

    /**
     * Initialize an explorer window
     */
    async initializeWindow(appId) {
        const explorerContainer = document.getElementById(`explorer-${appId}`);
        if (!explorerContainer) {
            console.error(`Explorer container not found: ${appId}`);
            return;
        }

        // Create explorer instance
        const explorer = {
            id: appId,
            container: explorerContainer,
            toolbar: explorerContainer.querySelector('.explorer-toolbar'),
            content: document.getElementById(`explorer-content-${appId}`),
            pathInput: document.getElementById(`explorer-path-${appId}`),
            currentPath: '/',
            history: ['/'],
            historyIndex: 0,
            selectedFiles: new Set(),
            viewMode: this.viewMode,
            isLoading: false
        };

        // Store explorer instance
        this.explorers.set(appId, explorer);

        // Set up explorer-specific event handlers
        this.setupExplorerEventHandlers(explorer);

        // Apply explorer styling
        this.applyExplorerStyling(explorer);

        // Load initial directory
        await this.navigateToPath(explorer, '/');

        console.log(`📁 File Explorer initialized: ${appId}`);
    }

    /**
     * Set up event handlers for an explorer instance
     */
    setupExplorerEventHandlers(explorer) {
        // Path input navigation
        explorer.pathInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.navigateToPath(explorer, explorer.pathInput.value);
            }
        });

        // Content area events
        explorer.content.addEventListener('click', (e) => {
            this.handleContentClick(explorer, e);
        });

        explorer.content.addEventListener('dblclick', (e) => {
            this.handleContentDoubleClick(explorer, e);
        });

        explorer.content.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(explorer, e);
        });

        // Keyboard navigation
        explorer.container.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(explorer, e);
        });

        // Drag and drop support
        explorer.content.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        explorer.content.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleFileDrop(explorer, e);
        });

        // Selection handling
        explorer.content.addEventListener('mousedown', (e) => {
            this.handleSelectionStart(explorer, e);
        });
    }

    /**
     * Apply styling to explorer
     */
    applyExplorerStyling(explorer) {
        // Style explorer container
        explorer.container.style.cssText = `
            display: flex;
            flex-direction: column;
            height: 100%;
            background: var(--background);
            font-family: var(--font-family);
        `;

        // Style toolbar
        explorer.toolbar.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: var(--surface-light);
            border-bottom: 1px solid var(--border);
            flex-shrink: 0;
        `;

        // Style toolbar buttons
        explorer.toolbar.querySelectorAll('button').forEach(button => {
            button.style.cssText = `
                padding: 6px 12px;
                border: 1px solid var(--border);
                border-radius: 4px;
                background: var(--surface);
                color: var(--text-primary);
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            `;
        });

        // Style path input
        explorer.pathInput.style.cssText = `
            flex: 1;
            padding: 6px 8px;
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--surface);
            color: var(--text-primary);
            font-size: 13px;
            font-family: monospace;
        `;

        // Style content area
        explorer.content.style.cssText = `
            flex: 1;
            overflow: auto;
            padding: 12px;
            background: var(--background);
        `;
    }

    /**
     * Navigate to a specific path
     */
    async navigateToPath(explorer, path) {
        if (explorer.isLoading) return;

        explorer.isLoading = true;
        this.showLoadingState(explorer);

        try {
            // Normalize path
            path = this.normalizePath(path);

            // Fetch directory contents
            const response = await fetch(`/api/explorer/${encodeURIComponent(path.substring(1))}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load directory');
            }

            // Update explorer state
            explorer.currentPath = path;
            explorer.pathInput.value = path;

            // Update navigation history
            if (path !== explorer.history[explorer.historyIndex]) {
                // Remove any forward history
                explorer.history = explorer.history.slice(0, explorer.historyIndex + 1);
                explorer.history.push(path);
                explorer.historyIndex = explorer.history.length - 1;
            }

            // Clear selection
            explorer.selectedFiles.clear();

            // Render directory contents
            this.renderDirectoryContents(explorer, data.items);

            // Update toolbar buttons
            this.updateToolbarButtons(explorer);

        } catch (error) {
            console.error('Navigation error:', error);
            this.showError(explorer, `Failed to load directory: ${error.message}`);
        } finally {
            explorer.isLoading = false;
        }
    }

    /**
     * Render directory contents
     */
    renderDirectoryContents(explorer, items) {
        const content = explorer.content;
        content.innerHTML = '';

        if (!items || items.length === 0) {
            this.showEmptyDirectory(explorer);
            return;
        }

        // Sort items
        const sortedItems = this.sortItems(items);

        // Create file list container
        const fileList = document.createElement('div');
        fileList.className = `file-list file-list-${explorer.viewMode}`;
        fileList.style.cssText = `
            display: ${explorer.viewMode === 'grid' ? 'grid' : 'flex'};
            ${explorer.viewMode === 'grid' ? 
                'grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 16px;' : 
                'flex-direction: column; gap: 2px;'
            }
        `;

        // Render each item
        sortedItems.forEach(item => {
            const itemElement = this.createFileItem(explorer, item);
            fileList.appendChild(itemElement);
        });

        content.appendChild(fileList);
    }

    /**
     * Create a file/folder item element
     */
    createFileItem(explorer, item) {
        const itemElement = document.createElement('div');
        itemElement.className = 'file-item';
        itemElement.dataset.name = item.name;
        itemElement.dataset.type = item.type;
        itemElement.dataset.size = item.size;
        itemElement.dataset.modified = item.modified;

        // Get file icon and color
        const { icon, color } = this.getFileIcon(item);

        if (explorer.viewMode === 'grid') {
            // Grid view
            itemElement.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 12px 8px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
                background: transparent;
                border: 2px solid transparent;
            `;

            itemElement.innerHTML = `
                <div class="file-icon" style="font-size: 32px; color: ${color}; margin-bottom: 8px;">
                    ${icon}
                </div>
                <div class="file-name" style="
                    font-size: 12px;
                    color: var(--text-primary);
                    word-break: break-word;
                    line-height: 1.3;
                    max-width: 100%;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                ">
                    ${this.escapeHtml(item.name)}
                </div>
            `;
        } else {
            // List view
            itemElement.style.cssText = `
                display: flex;
                align-items: center;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
                background: transparent;
                border: 1px solid transparent;
            `;

            const fileSize = item.type === 'file' ? this.formatFileSize(item.size) : '--';
            const modifiedDate = new Date(item.modified * 1000).toLocaleDateString();

            itemElement.innerHTML = `
                <div class="file-icon" style="font-size: 20px; color: ${color}; margin-right: 12px; width: 24px;">
                    ${icon}
                </div>
                <div class="file-name" style="
                    flex: 1;
                    color: var(--text-primary);
                    font-weight: 500;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                ">
                    ${this.escapeHtml(item.name)}
                </div>
                <div class="file-size" style="
                    width: 80px;
                    color: var(--text-secondary);
                    font-size: 12px;
                    text-align: right;
                    margin-right: 16px;
                ">
                    ${fileSize}
                </div>
                <div class="file-date" style="
                    width: 100px;
                    color: var(--text-secondary);
                    font-size: 12px;
                    text-align: right;
                ">
                    ${modifiedDate}
                </div>
            `;
        }

        // Add hover effects
        itemElement.addEventListener('mouseenter', () => {
            itemElement.style.backgroundColor = 'var(--surface-light)';
            if (explorer.viewMode === 'grid') {
                itemElement.style.borderColor = 'var(--border)';
            }
        });

        itemElement.addEventListener('mouseleave', () => {
            if (!explorer.selectedFiles.has(item.name)) {
                itemElement.style.backgroundColor = 'transparent';
                itemElement.style.borderColor = 'transparent';
            }
        });

        return itemElement;
    }

    /**
     * Get appropriate icon and color for file/folder
     */
    getFileIcon(item) {
        if (item.type === 'dir') {
            return { icon: '📁', color: '#ffd700' };
        }

        const ext = item.name.split('.').pop().toLowerCase();
        const iconMap = {
            // Images
            'jpg': { icon: '🖼️', color: '#ff6b6b' },
            'jpeg': { icon: '🖼️', color: '#ff6b6b' },
            'png': { icon: '🖼️', color: '#ff6b6b' },
            'gif': { icon: '🖼️', color: '#ff6b6b' },
            'svg': { icon: '🎨', color: '#ff6b6b' },
            'webp': { icon: '🖼️', color: '#ff6b6b' },

            // Videos
            'mp4': { icon: '🎥', color: '#4ecdc4' },
            'avi': { icon: '🎥', color: '#4ecdc4' },
            'mov': { icon: '🎥', color: '#4ecdc4' },
            'mkv': { icon: '🎥', color: '#4ecdc4' },
            'webm': { icon: '🎥', color: '#4ecdc4' },

            // Audio
            'mp3': { icon: '🎵', color: '#45b7d1' },
            'wav': { icon: '🎵', color: '#45b7d1' },
            'ogg': { icon: '🎵', color: '#45b7d1' },
            'flac': { icon: '🎵', color: '#45b7d1' },
            'm4a': { icon: '🎵', color: '#45b7d1' },

            // Documents
            'txt': { icon: '📄', color: '#6c5ce7' },
            'md': { icon: '📝', color: '#6c5ce7' },
            'pdf': { icon: '📕', color: '#e74c3c' },
            'doc': { icon: '📘', color: '#3498db' },
            'docx': { icon: '📘', color: '#3498db' },
            'rtf': { icon: '📄', color: '#6c5ce7' },

            // Spreadsheets
            'xls': { icon: '📊', color: '#27ae60' },
            'xlsx': { icon: '📊', color: '#27ae60' },
            'csv': { icon: '📊', color: '#27ae60' },

            // Presentations
            'ppt': { icon: '📽️', color: '#e67e22' },
            'pptx': { icon: '📽️', color: '#e67e22' },

            // Code
            'html': { icon: '🌐', color: '#e34c26' },
            'css': { icon: '🎨', color: '#1572b6' },
            'js': { icon: '📜', color: '#f7df1e' },
            'py': { icon: '🐍', color: '#3776ab' },
            'json': { icon: '📋', color: '#6c5ce7' },
            'xml': { icon: '📋', color: '#6c5ce7' },
            'sql': { icon: '🗃️', color: '#336791' },

            // Archives
            'zip': { icon: '📦', color: '#95a5a6' },
            'rar': { icon: '📦', color: '#95a5a6' },
            '7z': { icon: '📦', color: '#95a5a6' },
            'tar': { icon: '📦', color: '#95a5a6' },
            'gz': { icon: '📦', color: '#95a5a6' },

            // Executables
            'exe': { icon: '⚙️', color: '#2c3e50' },
            'msi': { icon: '⚙️', color: '#2c3e50' },
            'app': { icon: '⚙️', color: '#2c3e50' }
        };

        return iconMap[ext] || { icon: '📄', color: '#95a5a6' };
    }

    /**
     * Handle content area clicks
     */
    handleContentClick(explorer, e) {
        const fileItem = e.target.closest('.file-item');

        if (!fileItem) {
            // Clicked empty space - clear selection
            this.clearSelection(explorer);
            return;
        }

        const fileName = fileItem.dataset.name;
        const isSelected = explorer.selectedFiles.has(fileName);

        if (e.ctrlKey || e.metaKey) {
            // Ctrl+Click - toggle selection
            if (isSelected) {
                this.deselectFile(explorer, fileName);
            } else {
                this.selectFile(explorer, fileName);
            }
        } else if (e.shiftKey && explorer.selectedFiles.size > 0) {
            // Shift+Click - range selection
            this.selectRange(explorer, fileName);
        } else {
            // Regular click - select only this file
            this.clearSelection(explorer);
            this.selectFile(explorer, fileName);
        }
    }

    /**
     * Handle content area double clicks
     */
    handleContentDoubleClick(explorer, e) {
        const fileItem = e.target.closest('.file-item');
        if (!fileItem) return;

        const fileName = fileItem.dataset.name;
        const fileType = fileItem.dataset.type;

        if (fileType === 'dir') {
            // Navigate into directory
            const newPath = this.joinPath(explorer.currentPath, fileName);
            this.navigateToPath(explorer, newPath);
        } else {
            // Open file
            this.openFile(explorer, fileName);
        }
    }

    /**
     * Open a file
     */
    async openFile(explorer, fileName) {
        const filePath = this.joinPath(explorer.currentPath, fileName);

        try {
            // Get file extension
            const ext = fileName.split('.').pop().toLowerCase();

            // Handle different file types
            if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
                this.previewImage(filePath);
            } else if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) {
                this.previewVideo(filePath);
            } else if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
                this.previewAudio(filePath);
            } else if (['txt', 'md', 'json', 'css', 'js', 'py', 'html', 'xml'].includes(ext)) {
                this.editTextFile(filePath);
            } else {
                // Download file
                this.downloadFile(filePath);
            }

        } catch (error) {
            console.error('Error opening file:', error);
            this.showError(explorer, `Failed to open file: ${error.message}`);
        }
    }

    /**
     * Preview image file
     */
    previewImage(filePath) {
        const modal = this.createModal('Image Preview', `
            <div style="text-align: center;">
                <img src="/api/files/${filePath.substring(1)}" 
                     style="max-width: 100%; max-height: 70vh; border-radius: 8px;" 
                     alt="Image preview">
                <div style="margin-top: 16px; color: var(--text-secondary);">
                    ${filePath}
                </div>
            </div>
        `);
    }

    /**
     * Preview video file
     */
    previewVideo(filePath) {
        const modal = this.createModal('Video Preview', `
            <div style="text-align: center;">
                <video controls style="max-width: 100%; max-height: 70vh; border-radius: 8px;">
                    <source src="/api/files/${filePath.substring(1)}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <div style="margin-top: 16px; color: var(--text-secondary);">
                    ${filePath}
                </div>
            </div>
        `);
    }

    /**
     * Preview audio file
     */
    previewAudio(filePath) {
        const modal = this.createModal('Audio Preview', `
            <div style="text-align: center;">
                <div style="font-size: 48px; margin-bottom: 20px;">🎵</div>
                <audio controls style="width: 100%; margin-bottom: 16px;">
                    <source src="/api/files/${filePath.substring(1)}" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
                <div style="color: var(--text-secondary);">
                    ${filePath}
                </div>
            </div>
        `);
    }

    /**
     * Edit text file
     */
    editTextFile(filePath) {
        // This would open a text editor window
        console.log(`Opening text editor for: ${filePath}`);

        if (window.pixelPusher?.modules?.windows) {
            window.pixelPusher.modules.windows.open('editor', {
                filename: filePath.split('/').pop(),
                path: filePath
            });
        }
    }

    /**
     * Download file
     */
    downloadFile(filePath) {
        const link = document.createElement('a');
        link.href = `/api/files/${filePath.substring(1)}`;
        link.download = filePath.split('/').pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Select a file
     */
    selectFile(explorer, fileName) {
        explorer.selectedFiles.add(fileName);
        this.updateFileSelection(explorer, fileName, true);
    }

    /**
     * Deselect a file
     */
    deselectFile(explorer, fileName) {
        explorer.selectedFiles.delete(fileName);
        this.updateFileSelection(explorer, fileName, false);
    }

    /**
     * Clear all selections
     */
    clearSelection(explorer) {
        explorer.selectedFiles.forEach(fileName => {
            this.updateFileSelection(explorer, fileName, false);
        });
        explorer.selectedFiles.clear();
    }

    /**
     * Update visual selection state of a file
     */
    updateFileSelection(explorer, fileName, selected) {
        const fileItem = explorer.content.querySelector(`[data-name="${fileName}"]`);
        if (!fileItem) return;

        if (selected) {
            fileItem.style.backgroundColor = 'var(--primary)';
            fileItem.style.borderColor = 'var(--primary)';
            fileItem.style.color = 'white';

            // Update text colors in list view
            if (explorer.viewMode === 'list') {
                fileItem.querySelectorAll('.file-name, .file-size, .file-date').forEach(el => {
                    el.style.color = 'white';
                });
            } else {
                fileItem.querySelector('.file-name').style.color = 'white';
            }
        } else {
            fileItem.style.backgroundColor = 'transparent';
            fileItem.style.borderColor = 'transparent';
            fileItem.style.color = '';

            // Reset text colors
            if (explorer.viewMode === 'list') {
                fileItem.querySelector('.file-name').style.color = 'var(--text-primary)';
                fileItem.querySelectorAll('.file-size, .file-date').forEach(el => {
                    el.style.color = 'var(--text-secondary)';
                });
            } else {
                fileItem.querySelector('.file-name').style.color = 'var(--text-primary)';
            }
        }
    }

    /**
     * Navigate back in history
     */
    navigateBack(explorer) {
        if (!explorer) {
            explorer = Array.from(this.explorers.values())[0];
        }

        if (explorer && explorer.historyIndex > 0) {
            explorer.historyIndex--;
            const path = explorer.history[explorer.historyIndex];
            this.navigateToPath(explorer, path);
        }
    }

    /**
     * Navigate up one directory level
     */
    navigateUp(explorer) {
        if (!explorer) {
            explorer = Array.from(this.explorers.values())[0];
        }

        if (explorer && explorer.currentPath !== '/') {
            const parentPath = explorer.currentPath.split('/').slice(0, -1).join('/') || '/';
            this.navigateToPath(explorer, parentPath);
        }
    }

    /**
     * Refresh current directory
     */
    refresh(explorer) {
        if (!explorer) {
            explorer = Array.from(this.explorers.values())[0];
        }

        if (explorer) {
            this.navigateToPath(explorer, explorer.currentPath);
        }
    }

    /**
     * Show context menu
     */
    showContextMenu(explorer, e) {
        const fileItem = e.target.closest('.file-item');

        let menuItems;
        if (fileItem) {
            // File/folder context menu
            const fileName = fileItem.dataset.name;
            const fileType = fileItem.dataset.type;

            menuItems = [
                { text: '📂 Open', action: () => this.openFile(explorer, fileName) },
                { separator: true },
                { text: '✂️ Cut', action: () => this.cutFile(explorer, fileName) },
                { text: '📋 Copy', action: () => this.copyFile(explorer, fileName) },
                { text: '🗑️ Delete', action: () => this.deleteFile(explorer, fileName) },
                { text: '✏️ Rename', action: () => this.renameFile(explorer, fileName) },
                { separator: true },
                { text: 'ℹ️ Properties', action: () => this.showFileProperties(explorer, fileName) }
            ];
        } else {
            // Empty space context menu
            menuItems = [
                { text: '📄 New File', action: () => this.createNewFile(explorer) },
                { text: '📁 New Folder', action: () => this.createNewFolder(explorer) },
                { separator: true },
                { text: '📎 Paste', action: () => this.pasteFile(explorer), enabled: !!this.clipboard },
                { separator: true },
                { text: '🔄 Refresh', action: () => this.refresh(explorer) }
            ];
        }

        this.showContextMenuItems(e.clientX, e.clientY, menuItems);
    }

    /**
     * Show context menu with items
     */
    showContextMenuItems(x, y, items) {
        // Remove existing context menu
        const existingMenu = document.querySelector('.explorer-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'explorer-context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${Math.min(x, window.innerWidth - 200)}px;
            top: ${Math.min(y, window.innerHeight - items.length * 32)}px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 4px 0;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            min-width: 150px;
        `;

        items.forEach(item => {
            if (item.separator) {
                const separator = document.createElement('div');
                separator.style.cssText = `
                    height: 1px;
                    background: var(--border);
                    margin: 4px 0;
                `;
                menu.appendChild(separator);
            } else {
                const menuItem = document.createElement('div');
                menuItem.textContent = item.text;
                menuItem.style.cssText = `
                    padding: 8px 16px;
                    cursor: ${item.enabled !== false ? 'pointer' : 'not-allowed'};
                    color: ${item.enabled !== false ? 'var(--text-primary)' : 'var(--text-disabled)'};
                    font-size: 14px;
                    transition: background-color 0.2s;
                `;

                if (item.enabled !== false) {
                    menuItem.addEventListener('mouseenter', () => {
                        menuItem.style.backgroundColor = 'var(--primary)';
                        menuItem.style.color = 'white';
                    });

                    menuItem.addEventListener('mouseleave', () => {
                        menuItem.style.backgroundColor = 'transparent';
                        menuItem.style.color = 'var(--text-primary)';
                    });

                    menuItem.addEventListener('click', () => {
                        menu.remove();
                        item.action();
                    });
                }

                menu.appendChild(menuItem);
            }
        });

        document.body.appendChild(menu);

        // Close menu when clicking elsewhere
        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }, 0);
    }

    /**
     * Create new file
     */
    async createNewFile(explorer) {
        const fileName = prompt('Enter file name:');
        if (!fileName) return;

        try {
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filename: this.joinPath(explorer.currentPath, fileName),
                    content: ''
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create file');
            }

            // Refresh directory
            this.refresh(explorer);

            // Show success message
            this.showSuccess(explorer, `File created: ${fileName}`);

        } catch (error) {
            console.error('Error creating file:', error);
            this.showError(explorer, `Failed to create file: ${error.message}`);
        }
    }

    /**
     * Create new folder
     */
    async createNewFolder(explorer) {
        const folderName = prompt('Enter folder name:');
        if (!folderName) return;

        try {
            // Use mkdir command through terminal API
            const command = `mkdir "${folderName}"`;
            const response = await fetch(`/api/command/${encodeURIComponent(command)}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to create folder');
            }

            // Refresh directory
            this.refresh(explorer);

            // Show success message
            this.showSuccess(explorer, `Folder created: ${folderName}`);

        } catch (error) {
            console.error('Error creating folder:', error);
            this.showError(explorer, `Failed to create folder: ${error.message}`);
        }
    }

    /**
     * Delete file
     */
    async deleteFile(explorer, fileName) {
        if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
            return;
        }

        try {
            // Use rm command through terminal API
            const command = `rm "${fileName}"`;
            const response = await fetch(`/api/command/${encodeURIComponent(command)}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to delete file');
            }

            // Refresh directory
            this.refresh(explorer);

            // Show success message
            this.showSuccess(explorer, `Deleted: ${fileName}`);

        } catch (error) {
            console.error('Error deleting file:', error);
            this.showError(explorer, `Failed to delete file: ${error.message}`);
        }
    }

    /**
     * Rename file
     */
    async renameFile(explorer, oldFileName) {
        const newFileName = prompt('Enter new name:', oldFileName);
        if (!newFileName || newFileName === oldFileName) return;

        try {
            // Use mv command through terminal API
            const command = `mv "${oldFileName}" "${newFileName}"`;
            const response = await fetch(`/api/command/${encodeURIComponent(command)}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to rename file');
            }

            // Refresh directory
            this.refresh(explorer);

            // Show success message
            this.showSuccess(explorer, `Renamed: ${oldFileName} → ${newFileName}`);

        } catch (error) {
            console.error('Error renaming file:', error);
            this.showError(explorer, `Failed to rename file: ${error.message}`);
        }
    }

    /**
     * Show file properties
     */
    showFileProperties(explorer, fileName) {
        const fileItem = explorer.content.querySelector(`[data-name="${fileName}"]`);
        if (!fileItem) return;

        const fileType = fileItem.dataset.type;
        const fileSize = fileItem.dataset.size;
        const modifiedTime = new Date(fileItem.dataset.modified * 1000);

        const propertiesHTML = `
            <div style="text-align: left;">
                <h3>${fileName}</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Type:</td>
                        <td style="padding: 8px;">${fileType === 'dir' ? 'Folder' : 'File'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Size:</td>
                        <td style="padding: 8px;">${fileType === 'file' ? this.formatFileSize(fileSize) : '--'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Modified:</td>
                        <td style="padding: 8px;">${modifiedTime.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Location:</td>
                        <td style="padding: 8px;">${explorer.currentPath}</td>
                    </tr>
                </table>
            </div>
        `;

        this.createModal(`Properties - ${fileName}`, propertiesHTML);
    }

    /**
     * Utility functions
     */
    normalizePath(path) {
        if (!path || path === '/') return '/';
        return path.startsWith('/') ? path : '/' + path;
    }

    joinPath(basePath, fileName) {
        if (basePath === '/') return '/' + fileName;
        return basePath + '/' + fileName;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    sortItems(items) {
        return items.sort((a, b) => {
            // Folders first
            if (a.type !== b.type) {
                return a.type === 'dir' ? -1 : 1;
            }

            // Then by sort criteria
            let compareValue = 0;
            switch (this.sortBy) {
                case 'name':
                    compareValue = a.name.localeCompare(b.name);
                    break;
                case 'size':
                    compareValue = (a.size || 0) - (b.size || 0);
                    break;
                case 'date':
                    compareValue = (a.modified || 0) - (b.modified || 0);
                    break;
                case 'type':
                    const extA = a.name.split('.').pop() || '';
                    const extB = b.name.split('.').pop() || '';
                    compareValue = extA.localeCompare(extB);
                    break;
            }

            return this.sortOrder === 'desc' ? -compareValue : compareValue;
        });
    }

    createModal(title, content) {
        return window.pixelPusher ?
            window.pixelPusher.showModal(title, content) :
            alert(content);
    }

    showError(explorer, message) {
        if (window.pixelPusher) {
            window.pixelPusher.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    showSuccess(explorer, message) {
        if (window.pixelPusher) {
            window.pixelPusher.showNotification(message, 'success');
        } else {
            console.log(message);
        }
    }

    showLoadingState(explorer) {
        explorer.content.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 200px;
                color: var(--text-secondary);
                font-size: 16px;
            ">
                <div>🔄 Loading...</div>
            </div>
        `;
    }

    showEmptyDirectory(explorer) {
        explorer.content.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 200px;
                color: var(--text-secondary);
                font-size: 16px;
                text-align: center;
            ">
                <div style="font-size: 48px; margin-bottom: 16px;">📁</div>
                <div>This folder is empty</div>
                <div style="font-size: 14px; margin-top: 8px;">Right-click to create new files or folders</div>
            </div>
        `;
    }

    updateToolbarButtons(explorer) {
        // Update back button state
        const backButton = explorer.toolbar.querySelector('button');
        if (backButton) {
            backButton.disabled = explorer.historyIndex <= 0;
        }
    }

    setupGlobalShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Alt+E - Focus explorer or open new one
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'e') {
                e.preventDefault();
                this.focusOrCreateExplorer();
            }
        });
    }

    focusOrCreateExplorer() {
        const existingExplorer = Array.from(this.explorers.values())[0];
        if (existingExplorer) {
            // Focus existing explorer window
            if (window.pixelPusher?.modules?.windows) {
                window.pixelPusher.modules.windows.focus(existingExplorer.id);
            }
        } else {
            // Open new explorer
            if (window.pixelPusher?.modules?.windows) {
                window.pixelPusher.modules.windows.open('explorer');
            }
        }
    }

    initializeFileTypes() {
        // File type associations would be set up here
        console.log('📄 File type associations initialized');
    }

    loadPreferences() {
        // Load saved preferences from storage
        const stateManager = window.pixelPusher?.modules?.state;
        if (stateManager) {
            this.viewMode = stateManager.getPreference('explorerViewMode', 'list');
            this.sortBy = stateManager.getPreference('explorerSortBy', 'name');
            this.sortOrder = stateManager.getPreference('explorerSortOrder', 'asc');
        }
    }

    savePreferences() {
        // Save preferences to storage
        const stateManager = window.pixelPusher?.modules?.state;
        if (stateManager) {
            stateManager.setPreference('explorerViewMode', this.viewMode);
            stateManager.setPreference('explorerSortBy', this.sortBy);
            stateManager.setPreference('explorerSortOrder', this.sortOrder);
        }
    }

    handleResize() {
        // Handle window resize for explorer windows
        this.explorers.forEach(explorer => {
            // Could adjust layout based on new window size
        });
    }

    destroy() {
        // Clean up explorer manager
        this.explorers.clear();
        console.log('📁 File Explorer Manager destroyed');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplorerManager;
}

console.log('📁 File Explorer manager loaded successfully');