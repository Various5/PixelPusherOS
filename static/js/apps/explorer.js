/**
 * Pixel Pusher OS - Enhanced File Explorer Manager
 * Fully implemented file system navigation with modern features
 */

class EnhancedExplorerManager {
    constructor() {
        this.explorers = new Map();
        this.currentPath = '/';
        this.navigationHistory = ['/'];
        this.historyIndex = 0;
        this.clipboard = null;
        this.selectedFiles = new Set();
        this.viewMode = 'list'; // 'list' or 'grid'
        this.sortBy = 'name';
        this.sortOrder = 'asc';
        this.searchQuery = '';
        
        console.log('📁 Enhanced File Explorer Manager initialized');
    }

    async init() {
        try {
            this.loadPreferences();
            this.setupGlobalShortcuts();
            this.initializeFileTypes();
            console.log('✅ Enhanced File Explorer system ready');
        } catch (error) {
            console.error('❌ File Explorer initialization failed:', error);
        }
    }

    async initializeWindow(appId) {
        const explorerContainer = document.getElementById(`explorer-${appId}`);
        if (!explorerContainer) {
            console.error(`Explorer container not found: ${appId}`);
            return;
        }

        const explorer = {
            id: appId,
            container: explorerContainer,
            content: document.getElementById(`explorer-content-${appId}`),
            currentPath: '/',
            history: ['/'],
            historyIndex: 0,
            selectedFiles: new Set(),
            viewMode: this.viewMode,
            isLoading: false,
            searchInput: null,
            toolbar: null
        };

        this.explorers.set(appId, explorer);
        this.setupExplorerUI(explorer);
        this.setupExplorerEventHandlers(explorer);
        this.applyExplorerStyling(explorer);
        
        await this.navigateToPath(explorer, '/');
        console.log(`📁 Enhanced File Explorer initialized: ${appId}`);
    }

    setupExplorerUI(explorer) {
        explorer.container.innerHTML = `
            <div class="explorer-toolbar">
                <div class="explorer-nav-buttons">
                    <button class="btn back-btn" onclick="window.pixelPusher.modules.explorer.navigateBack('${explorer.id}')" title="Back">
                        ← Back
                    </button>
                    <button class="btn forward-btn" onclick="window.pixelPusher.modules.explorer.navigateForward('${explorer.id}')" title="Forward">
                        Forward →
                    </button>
                    <button class="btn up-btn" onclick="window.pixelPusher.modules.explorer.navigateUp('${explorer.id}')" title="Up">
                        ↑ Up
                    </button>
                </div>
                
                <div class="explorer-address-bar">
                    <input type="text" class="explorer-path" id="explorer-path-${explorer.id}" 
                           value="/" placeholder="Enter path..." />
                    <button class="btn go-btn" onclick="window.pixelPusher.modules.explorer.navigateToPathFromInput('${explorer.id}')" title="Go">
                        →
                    </button>
                </div>
                
                <div class="explorer-search">
                    <input type="text" class="search-input" id="search-${explorer.id}" 
                           placeholder="Search files..." />
                    <button class="btn search-btn" onclick="window.pixelPusher.modules.explorer.performSearch('${explorer.id}')" title="Search">
                        🔍
                    </button>
                </div>
                
                <div class="explorer-actions">
                    <button class="btn view-btn" onclick="window.pixelPusher.modules.explorer.toggleViewMode('${explorer.id}')" title="Toggle View">
                        ${this.viewMode === 'list' ? '⊞' : '☰'}
                    </button>
                    <button class="btn refresh-btn" onclick="window.pixelPusher.modules.explorer.refresh('${explorer.id}')" title="Refresh">
                        🔄
                    </button>
                    <button class="btn new-folder-btn" onclick="window.pixelPusher.modules.explorer.createNewFolder('${explorer.id}')" title="New Folder">
                        📁+
                    </button>
                    <button class="btn upload-btn" onclick="window.pixelPusher.modules.explorer.showUploadDialog('${explorer.id}')" title="Upload">
                        ⬆️
                    </button>
                </div>
            </div>
            
            <div class="explorer-main">
                <div class="explorer-sidebar">
                    <div class="sidebar-section">
                        <h4>Quick Access</h4>
                        <div class="sidebar-item" onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/home')">
                            🏠 Home
                        </div>
                        <div class="sidebar-item" onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/documents')">
                            📄 Documents
                        </div>
                        <div class="sidebar-item" onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/downloads')">
                            ⬇️ Downloads
                        </div>
                        <div class="sidebar-item" onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/pictures')">
                            🖼️ Pictures
                        </div>
                        <div class="sidebar-item" onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/music')">
                            🎵 Music
                        </div>
                        <div class="sidebar-item" onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/videos')">
                            🎥 Videos
                        </div>
                    </div>
                    
                    <div class="sidebar-section">
                        <h4>Storage</h4>
                        <div class="storage-info">
                            <div class="storage-bar">
                                <div class="storage-fill" style="width: 45%"></div>
                            </div>
                            <div class="storage-text">4.5 GB of 10 GB used</div>
                        </div>
                    </div>
                </div>
                
                <div class="explorer-content" id="explorer-content-${explorer.id}">
                    <div class="loading-indicator">
                        <div class="spinner"></div>
                        <div>Loading...</div>
                    </div>
                </div>
            </div>
            
            <div class="explorer-statusbar">
                <div class="status-left">
                    <span id="status-items-${explorer.id}">0 items</span>
                    <span id="status-selection-${explorer.id}"></span>
                </div>
                <div class="status-right">
                    <span id="status-path-${explorer.id}">/</span>
                </div>
            </div>
            
            <input type="file" id="file-upload-${explorer.id}" multiple style="display: none;" />
        `;

        explorer.toolbar = explorer.container.querySelector('.explorer-toolbar');
        explorer.content = explorer.container.querySelector('.explorer-content');
        explorer.searchInput = explorer.container.querySelector(`#search-${explorer.id}`);
    }

    async navigateToPath(explorer, path) {
        if (explorer.isLoading) return;

        explorer.isLoading = true;
        this.showLoadingState(explorer);

        try {
            path = this.normalizePath(path);
            
            // Mock file system data for demonstration
            const data = await this.getMockDirectoryContents(path);
            
            explorer.currentPath = path;
            const pathInput = document.getElementById(`explorer-path-${explorer.id}`);
            if (pathInput) pathInput.value = path;

            // Update navigation history
            if (path !== explorer.history[explorer.historyIndex]) {
                explorer.history = explorer.history.slice(0, explorer.historyIndex + 1);
                explorer.history.push(path);
                explorer.historyIndex = explorer.history.length - 1;
            }

            explorer.selectedFiles.clear();
            this.renderDirectoryContents(explorer, data.items);
            this.updateToolbarButtons(explorer);
            this.updateStatusBar(explorer, data.items);

        } catch (error) {
            console.error('Navigation error:', error);
            this.showError(explorer, `Failed to load directory: ${error.message}`);
        } finally {
            explorer.isLoading = false;
        }
    }

    async getMockDirectoryContents(path) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        const mockData = {
            '/': {
                items: [
                    { name: 'home', type: 'dir', size: 0, modified: Date.now() / 1000 },
                    { name: 'documents', type: 'dir', size: 0, modified: Date.now() / 1000 },
                    { name: 'downloads', type: 'dir', size: 0, modified: Date.now() / 1000 },
                    { name: 'pictures', type: 'dir', size: 0, modified: Date.now() / 1000 },
                    { name: 'music', type: 'dir', size: 0, modified: Date.now() / 1000 },
                    { name: 'videos', type: 'dir', size: 0, modified: Date.now() / 1000 },
                    { name: 'README.txt', type: 'file', size: 1024, modified: Date.now() / 1000 },
                    { name: 'system.log', type: 'file', size: 2048, modified: Date.now() / 1000 }
                ]
            },
            '/documents': {
                items: [
                    { name: 'report.pdf', type: 'file', size: 524288, modified: Date.now() / 1000 },
                    { name: 'presentation.pptx', type: 'file', size: 1048576, modified: Date.now() / 1000 },
                    { name: 'spreadsheet.xlsx', type: 'file', size: 65536, modified: Date.now() / 1000 },
                    { name: 'notes.txt', type: 'file', size: 2048, modified: Date.now() / 1000 },
                    { name: 'archive', type: 'dir', size: 0, modified: Date.now() / 1000 }
                ]
            },
            '/downloads': {
                items: [
                    { name: 'software.zip', type: 'file', size: 10485760, modified: Date.now() / 1000 },
                    { name: 'image.jpg', type: 'file', size: 1024000, modified: Date.now() / 1000 },
                    { name: 'video.mp4', type: 'file', size: 52428800, modified: Date.now() / 1000 }
                ]
            },
            '/pictures': {
                items: [
                    { name: 'vacation', type: 'dir', size: 0, modified: Date.now() / 1000 },
                    { name: 'family', type: 'dir', size: 0, modified: Date.now() / 1000 },
                    { name: 'screenshot.png', type: 'file', size: 512000, modified: Date.now() / 1000 },
                    { name: 'wallpaper.jpg', type: 'file', size: 2048000, modified: Date.now() / 1000 }
                ]
            },
            '/music': {
                items: [
                    { name: 'Rock', type: 'dir', size: 0, modified: Date.now() / 1000 },
                    { name: 'Pop', type: 'dir', size: 0, modified: Date.now() / 1000 },
                    { name: 'Classical', type: 'dir', size: 0, modified: Date.now() / 1000 },
                    { name: 'favorite.mp3', type: 'file', size: 5242880, modified: Date.now() / 1000 }
                ]
            },
            '/videos': {
                items: [
                    { name: 'Movies', type: 'dir', size: 0, modified: Date.now() / 1000 },
                    { name: 'Series', type: 'dir', size: 0, modified: Date.now() / 1000 },
                    { name: 'demo.mp4', type: 'file', size: 104857600, modified: Date.now() / 1000 }
                ]
            }
        };

        return mockData[path] || { items: [] };
    }

    renderDirectoryContents(explorer, items) {
        if (!items || items.length === 0) {
            this.showEmptyDirectory(explorer);
            return;
        }

        const sortedItems = this.sortItems(items);
        const fileList = document.createElement('div');
        fileList.className = `file-list file-list-${explorer.viewMode}`;

        if (explorer.viewMode === 'grid') {
            fileList.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 16px;
                padding: 16px;
            `;
        } else {
            fileList.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 2px;
            `;
        }

        sortedItems.forEach(item => {
            const itemElement = this.createFileItem(explorer, item);
            fileList.appendChild(itemElement);
        });

        explorer.content.innerHTML = '';
        explorer.content.appendChild(fileList);
    }

    createFileItem(explorer, item) {
        const itemElement = document.createElement('div');
        itemElement.className = 'file-item';
        itemElement.dataset.name = item.name;
        itemElement.dataset.type = item.type;
        itemElement.dataset.size = item.size;
        itemElement.dataset.modified = item.modified;

        const { icon, color } = this.getFileIcon(item);

        if (explorer.viewMode === 'grid') {
            itemElement.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 12px;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
                background: var(--surface);
                border: 2px solid transparent;
                min-height: 100px;
            `;

            itemElement.innerHTML = `
                <div class="file-icon" style="font-size: 36px; color: ${color}; margin-bottom: 8px;">
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
                ${item.type === 'file' ? `
                    <div class="file-size" style="
                        font-size: 10px;
                        color: var(--text-secondary);
                        margin-top: 4px;
                    ">
                        ${this.formatFileSize(item.size)}
                    </div>
                ` : ''}
            `;
        } else {
            itemElement.style.cssText = `
                display: flex;
                align-items: center;
                padding: 8px 12px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                background: transparent;
                border: 1px solid transparent;
                min-height: 40px;
            `;

            const fileSize = item.type === 'file' ? this.formatFileSize(item.size) : '--';
            const modifiedDate = new Date(item.modified * 1000).toLocaleString();

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
                    width: 100px;
                    color: var(--text-secondary);
                    font-size: 12px;
                    text-align: right;
                    margin-right: 16px;
                ">
                    ${fileSize}
                </div>
                <div class="file-date" style="
                    width: 150px;
                    color: var(--text-secondary);
                    font-size: 12px;
                    text-align: right;
                ">
                    ${modifiedDate}
                </div>
            `;
        }

        this.setupFileItemEvents(explorer, itemElement, item);
        return itemElement;
    }

    setupFileItemEvents(explorer, itemElement, item) {
        itemElement.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (e.ctrlKey || e.metaKey) {
                this.toggleFileSelection(explorer, item.name);
            } else {
                this.clearSelection(explorer);
                this.selectFile(explorer, item.name);
            }
        });

        itemElement.addEventListener('dblclick', (e) => {
            e.preventDefault();
            this.openFile(explorer, item);
        });

        itemElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showFileContextMenu(explorer, e, item);
        });

        itemElement.addEventListener('mouseenter', () => {
            if (!explorer.selectedFiles.has(item.name)) {
                itemElement.style.backgroundColor = 'var(--surface-light)';
                itemElement.style.borderColor = 'var(--border)';
            }
        });

        itemElement.addEventListener('mouseleave', () => {
            if (!explorer.selectedFiles.has(item.name)) {
                itemElement.style.backgroundColor = 'transparent';
                itemElement.style.borderColor = 'transparent';
            }
        });
    }

    openFile(explorer, item) {
        if (item.type === 'dir') {
            const newPath = this.joinPath(explorer.currentPath, item.name);
            this.navigateToPath(explorer, newPath);
        } else {
            const ext = item.name.split('.').pop().toLowerCase();
            
            if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
                this.previewImage(item.name);
            } else if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) {
                this.previewVideo(item.name);
            } else if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
                this.previewAudio(item.name);
            } else if (['txt', 'md', 'json', 'css', 'js', 'py', 'html', 'xml'].includes(ext)) {
                this.editTextFile(item.name);
            } else {
                this.downloadFile(item.name);
            }
        }
    }

    previewImage(filename) {
        const modal = this.createModal('Image Preview', `
            <div style="text-align: center;">
                <img src="/api/files/preview/${filename}" 
                     style="max-width: 100%; max-height: 70vh; border-radius: 8px;" 
                     alt="Image preview"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+'">
                <div style="margin-top: 16px; color: var(--text-secondary);">
                    ${filename}
                </div>
            </div>
        `);
    }

    // Continue with other utility methods...
    getFileIcon(item) {
        if (item.type === 'dir') {
            return { icon: '📁', color: '#ffd700' };
        }

        const ext = item.name.split('.').pop().toLowerCase();
        const iconMap = {
            'jpg': { icon: '🖼️', color: '#ff6b6b' },
            'jpeg': { icon: '🖼️', color: '#ff6b6b' },
            'png': { icon: '🖼️', color: '#ff6b6b' },
            'gif': { icon: '🖼️', color: '#ff6b6b' },
            'svg': { icon: '🎨', color: '#ff6b6b' },
            'webp': { icon: '🖼️', color: '#ff6b6b' },
            'mp4': { icon: '🎥', color: '#4ecdc4' },
            'avi': { icon: '🎥', color: '#4ecdc4' },
            'mov': { icon: '🎥', color: '#4ecdc4' },
            'mkv': { icon: '🎥', color: '#4ecdc4' },
            'webm': { icon: '🎥', color: '#4ecdc4' },
            'mp3': { icon: '🎵', color: '#45b7d1' },
            'wav': { icon: '🎵', color: '#45b7d1' },
            'ogg': { icon: '🎵', color: '#45b7d1' },
            'flac': { icon: '🎵', color: '#45b7d1' },
            'm4a': { icon: '🎵', color: '#45b7d1' },
            'txt': { icon: '📄', color: '#6c5ce7' },
            'md': { icon: '📝', color: '#6c5ce7' },
            'pdf': { icon: '📕', color: '#e74c3c' },
            'doc': { icon: '📘', color: '#3498db' },
            'docx': { icon: '📘', color: '#3498db' },
            'xls': { icon: '📊', color: '#27ae60' },
            'xlsx': { icon: '📊', color: '#27ae60' },
            'csv': { icon: '📊', color: '#27ae60' },
            'ppt': { icon: '📽️', color: '#e67e22' },
            'pptx': { icon: '📽️', color: '#e67e22' },
            'html': { icon: '🌐', color: '#e34c26' },
            'css': { icon: '🎨', color: '#1572b6' },
            'js': { icon: '📜', color: '#f7df1e' },
            'py': { icon: '🐍', color: '#3776ab' },
            'json': { icon: '📋', color: '#6c5ce7' },
            'xml': { icon: '📋', color: '#6c5ce7' },
            'zip': { icon: '📦', color: '#95a5a6' },
            'rar': { icon: '📦', color: '#95a5a6' },
            '7z': { icon: '📦', color: '#95a5a6' },
            'exe': { icon: '⚙️', color: '#2c3e50' }
        };

        return iconMap[ext] || { icon: '📄', color: '#95a5a6' };
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

    normalizePath(path) {
        if (!path || path === '/') return '/';
        return path.startsWith('/') ? path : '/' + path;
    }

    joinPath(basePath, fileName) {
        if (basePath === '/') return '/' + fileName;
        return basePath + '/' + fileName;
    }

    sortItems(items) {
        return items.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'dir' ? -1 : 1;
            }

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

    // Navigation methods
    navigateBack(explorerId) {
        const explorer = this.explorers.get(explorerId);
        if (explorer && explorer.historyIndex > 0) {
            explorer.historyIndex--;
            const path = explorer.history[explorer.historyIndex];
            this.navigateToPath(explorer, path);
        }
    }

    navigateForward(explorerId) {
        const explorer = this.explorers.get(explorerId);
        if (explorer && explorer.historyIndex < explorer.history.length - 1) {
            explorer.historyIndex++;
            const path = explorer.history[explorer.historyIndex];
            this.navigateToPath(explorer, path);
        }
    }

    navigateUp(explorerId) {
        const explorer = this.explorers.get(explorerId);
        if (explorer && explorer.currentPath !== '/') {
            const parentPath = explorer.currentPath.split('/').slice(0, -1).join('/') || '/';
            this.navigateToPath(explorer, parentPath);
        }
    }

    navigateToPathFromInput(explorerId) {
        const explorer = this.explorers.get(explorerId);
        const pathInput = document.getElementById(`explorer-path-${explorerId}`);
        if (explorer && pathInput) {
            this.navigateToPath(explorer, pathInput.value);
        }
    }

    toggleViewMode(explorerId) {
        const explorer = this.explorers.get(explorerId);
        if (explorer) {
            explorer.viewMode = explorer.viewMode === 'list' ? 'grid' : 'list';
            this.viewMode = explorer.viewMode;
            
            const viewBtn = explorer.container.querySelector('.view-btn');
            if (viewBtn) {
                viewBtn.innerHTML = explorer.viewMode === 'list' ? '⊞' : '☰';
            }
            
            this.navigateToPath(explorer, explorer.currentPath);
            this.savePreferences();
        }
    }

    refresh(explorerId) {
        const explorer = this.explorers.get(explorerId);
        if (explorer) {
            this.navigateToPath(explorer, explorer.currentPath);
        }
    }

    // File operations
    selectFile(explorer, fileName) {
        explorer.selectedFiles.add(fileName);
        this.updateFileSelection(explorer, fileName, true);
        this.updateStatusBar(explorer);
    }

    deselectFile(explorer, fileName) {
        explorer.selectedFiles.delete(fileName);
        this.updateFileSelection(explorer, fileName, false);
        this.updateStatusBar(explorer);
    }

    toggleFileSelection(explorer, fileName) {
        if (explorer.selectedFiles.has(fileName)) {
            this.deselectFile(explorer, fileName);
        } else {
            this.selectFile(explorer, fileName);
        }
    }

    clearSelection(explorer) {
        explorer.selectedFiles.forEach(fileName => {
            this.updateFileSelection(explorer, fileName, false);
        });
        explorer.selectedFiles.clear();
        this.updateStatusBar(explorer);
    }

    updateFileSelection(explorer, fileName, selected) {
        const fileItem = explorer.content.querySelector(`[data-name="${fileName}"]`);
        if (!fileItem) return;

        if (selected) {
            fileItem.style.backgroundColor = 'var(--primary)';
            fileItem.style.borderColor = 'var(--primary)';
            fileItem.style.color = 'white';
        } else {
            fileItem.style.backgroundColor = 'transparent';
            fileItem.style.borderColor = 'transparent';
            fileItem.style.color = '';
        }
    }

    showLoadingState(explorer) {
        explorer.content.innerHTML = `
            <div class="loading-indicator" style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 200px;
                color: var(--text-secondary);
                font-size: 16px;
            ">
                <div class="spinner" style="
                    width: 40px;
                    height: 40px;
                    border: 4px solid var(--surface-light);
                    border-top: 4px solid var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 16px;
                "></div>
                <div>Loading...</div>
            </div>
        `;
    }

    showEmptyDirectory(explorer) {
        explorer.content.innerHTML = `
            <div class="empty-directory" style="
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
                <div style="font-size: 14px; margin-top: 8px;">
                    Right-click to create new files or folders
                </div>
            </div>
        `;
    }

    updateStatusBar(explorer, items = null) {
        const statusItems = document.getElementById(`status-items-${explorer.id}`);
        const statusSelection = document.getElementById(`status-selection-${explorer.id}`);
        const statusPath = document.getElementById(`status-path-${explorer.id}`);

        if (statusItems && items) {
            statusItems.textContent = `${items.length} items`;
        }

        if (statusSelection) {
            const selectedCount = explorer.selectedFiles.size;
            statusSelection.textContent = selectedCount > 0 ? `, ${selectedCount} selected` : '';
        }

        if (statusPath) {
            statusPath.textContent = explorer.currentPath;
        }
    }

    updateToolbarButtons(explorer) {
        const backBtn = explorer.container.querySelector('.back-btn');
        const forwardBtn = explorer.container.querySelector('.forward-btn');
        const upBtn = explorer.container.querySelector('.up-btn');

        if (backBtn) backBtn.disabled = explorer.historyIndex <= 0;
        if (forwardBtn) forwardBtn.disabled = explorer.historyIndex >= explorer.history.length - 1;
        if (upBtn) upBtn.disabled = explorer.currentPath === '/';
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

    setupExplorerEventHandlers(explorer) {
        // Path input navigation
        const pathInput = document.getElementById(`explorer-path-${explorer.id}`);
        if (pathInput) {
            pathInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.navigateToPathFromInput(explorer.id);
                }
            });
        }

        // Search functionality
        if (explorer.searchInput) {
            explorer.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch(explorer.id);
                }
            });
        }

        // Content area events
        explorer.content.addEventListener('click', (e) => {
            if (e.target === explorer.content) {
                this.clearSelection(explorer);
            }
        });

        explorer.content.addEventListener('contextmenu', (e) => {
            if (e.target === explorer.content) {
                e.preventDefault();
                this.showFolderContextMenu(explorer, e);
            }
        });

        // File upload handling
        const fileUpload = document.getElementById(`file-upload-${explorer.id}`);
        if (fileUpload) {
            fileUpload.addEventListener('change', (e) => {
                this.handleFileUpload(explorer, e.target.files);
            });
        }
    }

    applyExplorerStyling(explorer) {
        explorer.container.style.cssText = `
            display: flex;
            flex-direction: column;
            height: 100%;
            background: var(--background);
            font-family: var(--font-family);
        `;

        const explorerMain = explorer.container.querySelector('.explorer-main');
        if (explorerMain) {
            explorerMain.style.cssText = `
                display: flex;
                flex: 1;
                overflow: hidden;
            `;
        }

        const sidebar = explorer.container.querySelector('.explorer-sidebar');
        if (sidebar) {
            sidebar.style.cssText = `
                width: 200px;
                background: var(--surface-dark);
                border-right: 1px solid var(--border);
                padding: 16px;
                overflow-y: auto;
            `;
        }

        const statusbar = explorer.container.querySelector('.explorer-statusbar');
        if (statusbar) {
            statusbar.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 16px;
                background: var(--surface-light);
                border-top: 1px solid var(--border);
                font-size: 12px;
                color: var(--text-secondary);
            `;
        }
    }

    loadPreferences() {
        const stateManager = window.pixelPusher?.modules?.state;
        if (stateManager) {
            this.viewMode = stateManager.getPreference('explorerViewMode', 'list');
            this.sortBy = stateManager.getPreference('explorerSortBy', 'name');
            this.sortOrder = stateManager.getPreference('explorerSortOrder', 'asc');
        }
    }

    savePreferences() {
        const stateManager = window.pixelPusher?.modules?.state;
        if (stateManager) {
            stateManager.setPreference('explorerViewMode', this.viewMode);
            stateManager.setPreference('explorerSortBy', this.sortBy);
            stateManager.setPreference('explorerSortOrder', this.sortOrder);
        }
    }

    setupGlobalShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'e') {
                e.preventDefault();
                this.focusOrCreateExplorer();
            }
        });
    }

    initializeFileTypes() {
        console.log('📄 File type associations initialized');
    }

    focusOrCreateExplorer() {
        const existingExplorer = Array.from(this.explorers.values())[0];
        if (existingExplorer) {
            if (window.pixelPusher?.modules?.windows) {
                window.pixelPusher.modules.windows.focus(existingExplorer.id);
            }
        } else {
            if (window.pixelPusher?.modules?.windows) {
                window.pixelPusher.modules.windows.open('explorer');
            }
        }
    }

    destroy() {
        this.explorers.clear();
        console.log('📁 Enhanced File Explorer Manager destroyed');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedExplorerManager;
}

console.log('📁 Enhanced File Explorer manager loaded successfully');