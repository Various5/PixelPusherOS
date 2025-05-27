/**
 * Pixel Pusher OS - Fixed File Explorer Manager
 * Modern file browser with drag & drop, upload, and polished UI
 */

class ExplorerManager {
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
            content: null,
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

        // Start loading files immediately
        console.log('📁 Starting file loading for:', appId);
        setTimeout(() => {
            this.navigateToPath(explorer, '/');
        }, 100);

        console.log(`📁 Enhanced File Explorer initialized: ${appId}`);
    }

    setupExplorerUI(explorer) {
        explorer.container.innerHTML = `
            <div class="explorer-toolbar">
                <div class="nav-section">
                    <button class="nav-btn back-btn" onclick="window.pixelPusher.modules.explorer.navigateBack('${explorer.id}')" title="Back">
                        <span class="btn-icon">←</span>
                    </button>
                    <button class="nav-btn forward-btn" onclick="window.pixelPusher.modules.explorer.navigateForward('${explorer.id}')" title="Forward">
                        <span class="btn-icon">→</span>
                    </button>
                    <button class="nav-btn up-btn" onclick="window.pixelPusher.modules.explorer.navigateUp('${explorer.id}')" title="Up">
                        <span class="btn-icon">↑</span>
                    </button>
                    <button class="nav-btn home-btn" onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/')" title="Home">
                        <span class="btn-icon">🏠</span>
                    </button>
                </div>
                
                <div class="address-section">
                    <div class="address-bar">
                        <span class="address-icon">📁</span>
                        <input type="text" class="path-input" id="explorer-path-${explorer.id}" 
                               value="/" placeholder="Enter path..." />
                        <button class="nav-btn go-btn" onclick="window.pixelPusher.modules.explorer.navigateToPathFromInput('${explorer.id}')" title="Go">
                            <span class="btn-icon">→</span>
                        </button>
                    </div>
                </div>
                
                <div class="actions-section">
                    <div class="search-container">
                        <input type="text" class="search-input" id="search-${explorer.id}" 
                               placeholder="Search files..." />
                        <button class="nav-btn search-btn" onclick="window.pixelPusher.modules.explorer.performSearch('${explorer.id}')" title="Search">
                            <span class="btn-icon">🔍</span>
                        </button>
                    </div>
                    
                    <div class="view-controls">
                        <button class="nav-btn view-btn" onclick="window.pixelPusher.modules.explorer.toggleViewMode('${explorer.id}')" title="Toggle View">
                            <span class="btn-icon">${this.viewMode === 'list' ? '⊞' : '☰'}</span>
                        </button>
                        <button class="nav-btn refresh-btn" onclick="window.pixelPusher.modules.explorer.refresh('${explorer.id}')" title="Refresh">
                            <span class="btn-icon">🔄</span>
                        </button>
                    </div>
                    
                    <div class="file-actions">
                        <button class="action-btn new-folder-btn" onclick="window.pixelPusher.modules.explorer.createNewFolder('${explorer.id}')" title="New Folder">
                            <span class="btn-icon">📁</span>
                            <span class="btn-text">New Folder</span>
                        </button>
                        <button class="action-btn upload-btn" onclick="window.pixelPusher.modules.explorer.showUploadDialog('${explorer.id}')" title="Upload Files">
                            <span class="btn-icon">⬆️</span>
                            <span class="btn-text">Upload</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="explorer-main">
                <div class="explorer-sidebar">
                    <div class="sidebar-section">
                        <div class="sidebar-header">Quick Access</div>
                        <div class="sidebar-items">
                            <div class="sidebar-item" onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/home')" title="Home">
                                <span class="sidebar-icon">🏠</span>
                                <span class="sidebar-label">Home</span>
                            </div>
                            <div class="sidebar-item" onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/documents')" title="Documents">
                                <span class="sidebar-icon">📄</span>
                                <span class="sidebar-label">Documents</span>
                            </div>
                            <div class="sidebar-item" onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/downloads')" title="Downloads">
                                <span class="sidebar-icon">⬇️</span>
                                <span class="sidebar-label">Downloads</span>
                            </div>
                            <div class="sidebar-item" onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/pictures')" title="Pictures">
                                <span class="sidebar-icon">🖼️</span>
                                <span class="sidebar-label">Pictures</span>
                            </div>
                            <div class="sidebar-item" onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/music')" title="Music">
                                <span class="sidebar-icon">🎵</span>
                                <span class="sidebar-label">Music</span>
                            </div>
                            <div class="sidebar-item" onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/videos')" title="Videos">
                                <span class="sidebar-icon">🎥</span>
                                <span class="sidebar-label">Videos</span>
                            </div>
                            <div class="sidebar-item" onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/desktop')" title="Desktop">
                                <span class="sidebar-icon">🖥️</span>
                                <span class="sidebar-label">Desktop</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="sidebar-section">
                        <div class="sidebar-header">Storage</div>
                        <div class="storage-info">
                            <div class="storage-visual">
                                <div class="storage-bar">
                                    <div class="storage-fill" style="width: 45%"></div>
                                </div>
                                <div class="storage-text">4.5 GB of 10 GB used</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="explorer-content-area">
                    <div class="content-header">
                        <div class="breadcrumb-container">
                            <div class="breadcrumb" id="breadcrumb-${explorer.id}">
                                <span class="breadcrumb-item active">Home</span>
                            </div>
                        </div>
                        <div class="content-actions">
                            <select class="sort-select" id="sort-${explorer.id}" onchange="window.pixelPusher.modules.explorer.changeSorting('${explorer.id}', this.value)">
                                <option value="name">Sort by Name</option>
                                <option value="date">Sort by Date</option>
                                <option value="size">Sort by Size</option>
                                <option value="type">Sort by Type</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="explorer-content" id="explorer-content-${explorer.id}">
                        <div class="loading-state">
                            <div class="loading-spinner"></div>
                            <div class="loading-text">Loading files...</div>
                        </div>
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
            <div class="drop-overlay" id="drop-overlay-${explorer.id}" style="display: none;">
                <div class="drop-content">
                    <div class="drop-icon">📁</div>
                    <div class="drop-text">Drop files here to upload</div>
                </div>
            </div>
        `;

        explorer.toolbar = explorer.container.querySelector('.explorer-toolbar');
        explorer.content = explorer.container.querySelector('.explorer-content');
        explorer.searchInput = explorer.container.querySelector(`#search-${explorer.id}`);
    }

    async navigateToPath(explorer, path) {
        if (explorer.isLoading) {
            console.log('📁 Navigation already in progress, skipping...');
            return;
        }

        explorer.isLoading = true;
        console.log('📁 Navigating to path:', path);

        this.showLoadingState(explorer);

        try {
            path = this.normalizePath(path);
            console.log('📁 Normalized path:', path);

            // Get directory contents (always use mock data for demo)
            const data = await this.getMockDirectoryContents(path);
            console.log('📁 Got directory data:', data);

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
            this.updateBreadcrumb(explorer, path);
            this.renderDirectoryContents(explorer, data.items || []);
            this.updateToolbarButtons(explorer);
            this.updateStatusBar(explorer, data.items || []);

            console.log('📁 Navigation completed successfully');

        } catch (error) {
            console.error('📁 Navigation error:', error);
            this.showError(explorer, `Failed to load directory: ${error.message}`);
        } finally {
            explorer.isLoading = false;
        }
    }

    async getMockDirectoryContents(path) {
        console.log('📁 Getting mock data for path:', path);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 200));

        const mockData = {
            '/': {
                items: [
                    { name: 'documents', type: 'dir', size: 0, modified: Date.now() / 1000 - 86400 },
                    { name: 'downloads', type: 'dir', size: 0, modified: Date.now() / 1000 - 172800 },
                    { name: 'pictures', type: 'dir', size: 0, modified: Date.now() / 1000 - 259200 },
                    { name: 'music', type: 'dir', size: 0, modified: Date.now() / 1000 - 345600 },
                    { name: 'videos', type: 'dir', size: 0, modified: Date.now() / 1000 - 432000 },
                    { name: 'desktop', type: 'dir', size: 0, modified: Date.now() / 1000 - 518400 },
                    { name: 'home', type: 'dir', size: 0, modified: Date.now() / 1000 - 604800 },
                    { name: 'README.txt', type: 'file', size: 1024, modified: Date.now() / 1000 - 86400 },
                    { name: 'welcome.md', type: 'file', size: 2048, modified: Date.now() / 1000 - 172800 },
                    { name: 'system_info.json', type: 'file', size: 512, modified: Date.now() / 1000 - 259200 }
                ]
            },
            '/documents': {
                items: [
                    { name: 'sample.txt', type: 'file', size: 1024, modified: Date.now() / 1000 - 86400 },
                    { name: 'project_ideas.txt', type: 'file', size: 2048, modified: Date.now() / 1000 - 172800 },
                    { name: 'report.pdf', type: 'file', size: 524288, modified: Date.now() / 1000 - 259200 },
                    { name: 'presentation.pptx', type: 'file', size: 1048576, modified: Date.now() / 1000 - 345600 },
                    { name: 'spreadsheet.xlsx', type: 'file', size: 65536, modified: Date.now() / 1000 - 432000 },
                    { name: 'archive', type: 'dir', size: 0, modified: Date.now() / 1000 - 518400 },
                    { name: 'personal', type: 'dir', size: 0, modified: Date.now() / 1000 - 604800 },
                    { name: 'work', type: 'dir', size: 0, modified: Date.now() / 1000 - 691200 }
                ]
            },
            '/downloads': {
                items: [
                    { name: 'software.zip', type: 'file', size: 10485760, modified: Date.now() / 1000 - 86400 },
                    { name: 'image.jpg', type: 'file', size: 1024000, modified: Date.now() / 1000 - 172800 },
                    { name: 'video.mp4', type: 'file', size: 52428800, modified: Date.now() / 1000 - 259200 },
                    { name: 'document.pdf', type: 'file', size: 2048000, modified: Date.now() / 1000 - 345600 },
                    { name: 'music.mp3', type: 'file', size: 5242880, modified: Date.now() / 1000 - 432000 }
                ]
            },
            '/pictures': {
                items: [
                    { name: 'vacation', type: 'dir', size: 0, modified: Date.now() / 1000 - 86400 },
                    { name: 'family', type: 'dir', size: 0, modified: Date.now() / 1000 - 172800 },
                    { name: 'screenshots', type: 'dir', size: 0, modified: Date.now() / 1000 - 259200 },
                    { name: 'wallpaper.jpg', type: 'file', size: 2048000, modified: Date.now() / 1000 - 345600 },
                    { name: 'avatar.png', type: 'file', size: 512000, modified: Date.now() / 1000 - 432000 },
                    { name: 'photo1.jpg', type: 'file', size: 1536000, modified: Date.now() / 1000 - 518400 },
                    { name: 'photo2.jpg', type: 'file', size: 1792000, modified: Date.now() / 1000 - 604800 }
                ]
            },
            '/music': {
                items: [
                    { name: 'Rock', type: 'dir', size: 0, modified: Date.now() / 1000 - 86400 },
                    { name: 'Pop', type: 'dir', size: 0, modified: Date.now() / 1000 - 172800 },
                    { name: 'Classical', type: 'dir', size: 0, modified: Date.now() / 1000 - 259200 },
                    { name: 'Jazz', type: 'dir', size: 0, modified: Date.now() / 1000 - 345600 },
                    { name: 'README.txt', type: 'file', size: 1024, modified: Date.now() / 1000 - 432000 },
                    { name: 'playlist.m3u', type: 'file', size: 2048, modified: Date.now() / 1000 - 518400 }
                ]
            },
            '/videos': {
                items: [
                    { name: 'Movies', type: 'dir', size: 0, modified: Date.now() / 1000 - 86400 },
                    { name: 'Series', type: 'dir', size: 0, modified: Date.now() / 1000 - 172800 },
                    { name: 'Personal', type: 'dir', size: 0, modified: Date.now() / 1000 - 259200 },
                    { name: 'demo.mp4', type: 'file', size: 104857600, modified: Date.now() / 1000 - 345600 },
                    { name: 'tutorial.mkv', type: 'file', size: 209715200, modified: Date.now() / 1000 - 432000 }
                ]
            },
            '/desktop': {
                items: [
                    { name: 'Shortcuts', type: 'dir', size: 0, modified: Date.now() / 1000 - 86400 },
                    { name: 'Notes.txt', type: 'file', size: 512, modified: Date.now() / 1000 - 172800 },
                    { name: 'Todo.md', type: 'file', size: 1024, modified: Date.now() / 1000 - 259200 }
                ]
            },
            '/home': {
                items: [
                    { name: 'profile', type: 'dir', size: 0, modified: Date.now() / 1000 - 86400 },
                    { name: 'config', type: 'dir', size: 0, modified: Date.now() / 1000 - 172800 },
                    { name: '.bashrc', type: 'file', size: 2048, modified: Date.now() / 1000 - 259200 },
                    { name: '.profile', type: 'file', size: 1024, modified: Date.now() / 1000 - 345600 }
                ]
            }
        };

        const result = mockData[path] || { items: [] };
        console.log('📁 Returning mock data:', result);
        return result;
    }

    renderDirectoryContents(explorer, items) {
        console.log('📁 Rendering directory contents:', items.length, 'items');

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
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 16px;
                padding: 20px;
                overflow-y: auto;
            `;
        } else {
            fileList.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 1px;
                overflow-y: auto;
            `;
        }

        sortedItems.forEach(item => {
            const itemElement = this.createFileItem(explorer, item);
            fileList.appendChild(itemElement);
        });

        explorer.content.innerHTML = '';
        explorer.content.appendChild(fileList);

        console.log('📁 Directory contents rendered successfully');
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
                padding: 16px;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                text-align: center;
                background: rgba(255, 255, 255, 0.02);
                border: 2px solid transparent;
                min-height: 120px;
                backdrop-filter: blur(10px);
            `;

            itemElement.innerHTML = `
                <div class="file-icon-container" style="margin-bottom: 12px;">
                    <div class="file-icon" style="font-size: 42px; color: ${color}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">
                        ${icon}
                    </div>
                </div>
                <div class="file-details">
                    <div class="file-name" style="
                        font-size: 13px;
                        color: rgba(255, 255, 255, 0.9);
                        font-weight: 500;
                        word-break: break-word;
                        line-height: 1.3;
                        max-width: 100%;
                        overflow: hidden;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        margin-bottom: 4px;
                    ">
                        ${this.escapeHtml(item.name)}
                    </div>
                    ${item.type === 'file' ? `
                        <div class="file-size" style="
                            font-size: 11px;
                            color: rgba(255, 255, 255, 0.6);
                            font-weight: 400;
                        ">
                            ${this.formatFileSize(item.size)}
                        </div>
                    ` : `
                        <div class="file-type" style="
                            font-size: 11px;
                            color: rgba(255, 255, 255, 0.6);
                            font-weight: 400;
                        ">
                            Folder
                        </div>
                    `}
                </div>
            `;
        } else {
            itemElement.style.cssText = `
                display: flex;
                align-items: center;
                padding: 12px 16px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                background: transparent;
                border: 1px solid transparent;
                min-height: 48px;
                backdrop-filter: blur(10px);
            `;

            const fileSize = item.type === 'file' ? this.formatFileSize(item.size) : '--';
            const modifiedDate = new Date(item.modified * 1000).toLocaleDateString();

            itemElement.innerHTML = `
                <div class="file-icon-container" style="margin-right: 16px; width: 32px; display: flex; justify-content: center;">
                    <div class="file-icon" style="font-size: 24px; color: ${color};">
                        ${icon}
                    </div>
                </div>
                <div class="file-details" style="flex: 1; display: flex; align-items: center;">
                    <div class="file-name" style="
                        flex: 1;
                        color: rgba(255, 255, 255, 0.9);
                        font-weight: 500;
                        font-size: 14px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        margin-right: 20px;
                    ">
                        ${this.escapeHtml(item.name)}
                    </div>
                    <div class="file-size" style="
                        width: 100px;
                        color: rgba(255, 255, 255, 0.6);
                        font-size: 12px;
                        text-align: right;
                        margin-right: 20px;
                    ">
                        ${fileSize}
                    </div>
                    <div class="file-date" style="
                        width: 100px;
                        color: rgba(255, 255, 255, 0.6);
                        font-size: 12px;
                        text-align: right;
                    ">
                        ${modifiedDate}
                    </div>
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
                itemElement.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                itemElement.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                itemElement.style.transform = 'translateY(-2px)';
                itemElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }
        });

        itemElement.addEventListener('mouseleave', () => {
            if (!explorer.selectedFiles.has(item.name)) {
                itemElement.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                itemElement.style.borderColor = 'transparent';
                itemElement.style.transform = 'translateY(0)';
                itemElement.style.boxShadow = 'none';
            }
        });
    }

    showLoadingState(explorer) {
        explorer.content.innerHTML = `
            <div class="loading-state" style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 300px;
                color: rgba(255, 255, 255, 0.7);
                font-size: 16px;
            ">
                <div class="loading-spinner" style="
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(255, 255, 255, 0.2);
                    border-top: 3px solid rgba(99, 102, 241, 1);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 16px;
                "></div>
                <div class="loading-text">Loading files...</div>
            </div>
        `;

        // Add spinner animation if not already present
        if (!document.getElementById('spinner-styles')) {
            const style = document.createElement('style');
            style.id = 'spinner-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    showEmptyDirectory(explorer) {
        explorer.content.innerHTML = `
            <div class="empty-directory" style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 300px;
                color: rgba(255, 255, 255, 0.6);
                font-size: 16px;
                text-align: center;
            ">
                <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;">📁</div>
                <div style="font-weight: 500; margin-bottom: 8px;">This folder is empty</div>
                <div style="font-size: 14px; opacity: 0.7;">
                    Right-click to create new files or folders
                </div>
            </div>
        `;
    }

    updateBreadcrumb(explorer, path) {
        const breadcrumb = document.getElementById(`breadcrumb-${explorer.id}`);
        if (!breadcrumb) return;

        const pathParts = path === '/' ? [''] : path.split('/').filter(Boolean);
        let currentPath = '';

        let breadcrumbHTML = `
            <span class="breadcrumb-item ${path === '/' ? 'active' : ''}" 
                  onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/')">
                Home
            </span>
        `;

        pathParts.forEach((part, index) => {
            currentPath += '/' + part;
            const isLast = index === pathParts.length - 1;

            breadcrumbHTML += `
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item ${isLast ? 'active' : ''}" 
                      onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '${currentPath}')">
                    ${this.escapeHtml(part)}
                </span>
            `;
        });

        breadcrumb.innerHTML = breadcrumbHTML;
    }

    // Drag and Drop Implementation
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
            if (e.target === explorer.content || e.target.closest('.file-list')) {
                this.clearSelection(explorer);
            }
        });

        explorer.content.addEventListener('contextmenu', (e) => {
            if (e.target === explorer.content || e.target.closest('.file-list')) {
                e.preventDefault();
                this.showFolderContextMenu(explorer, e);
            }
        });

        // Drag and Drop Events
        const dropOverlay = document.getElementById(`drop-overlay-${explorer.id}`);

        explorer.content.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            if (dropOverlay) dropOverlay.style.display = 'flex';
        });

        explorer.content.addEventListener('dragleave', (e) => {
            if (!explorer.content.contains(e.relatedTarget)) {
                if (dropOverlay) dropOverlay.style.display = 'none';
            }
        });

        explorer.content.addEventListener('drop', (e) => {
            e.preventDefault();
            if (dropOverlay) dropOverlay.style.display = 'none';

            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                this.handleFileUpload(explorer, files);
            }
        });

        // File upload handling
        const fileUpload = document.getElementById(`file-upload-${explorer.id}`);
        if (fileUpload) {
            fileUpload.addEventListener('change', (e) => {
                this.handleFileUpload(explorer, Array.from(e.target.files));
                e.target.value = ''; // Reset input
            });
        }
    }

    handleFileUpload(explorer, files) {
        if (files.length === 0) return;

        console.log('📁 Uploading files:', files.map(f => f.name));

        if (window.pixelPusher?.showNotification) {
            window.pixelPusher.showNotification(
                `Uploading ${files.length} file${files.length > 1 ? 's' : ''}...`,
                'info'
            );
        }

        // Simulate upload process with progress
        let uploadedCount = 0;
        files.forEach((file, index) => {
            setTimeout(() => {
                uploadedCount++;

                if (uploadedCount === files.length) {
                    if (window.pixelPusher?.showNotification) {
                        window.pixelPusher.showNotification(
                            `Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}!`,
                            'success'
                        );
                    }

                    // Refresh the current directory
                    setTimeout(() => {
                        this.refresh(explorer.id);
                    }, 1000);
                }
            }, (index + 1) * 500); // Stagger uploads
        });
    }

    // File operation implementations
    openFile(explorer, item) {
        if (item.type === 'dir') {
            const newPath = this.joinPath(explorer.currentPath, item.name);
            this.navigateToPath(explorer, newPath);
        } else {
            const ext = item.name.split('.').pop().toLowerCase();

            if (window.pixelPusher?.showNotification) {
                window.pixelPusher.showNotification(
                    `Opening ${item.name}...`,
                    'info'
                );
            }

            // Handle different file types
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
                <div style="background: #000; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
                    <div style="font-size: 48px; color: #666; margin-bottom: 16px;">🖼️</div>
                    <div style="color: #999; font-size: 14px;">
                        Image preview for: ${filename}
                    </div>
                    <div style="color: #666; font-size: 12px; margin-top: 8px;">
                        (In a real implementation, the actual image would be displayed here)
                    </div>
                </div>
            </div>
        `);
    }

    editTextFile(filename) {
        const modal = this.createModal('Text Editor', `
            <div style="display: flex; flex-direction: column; height: 400px;">
                <div style="margin-bottom: 16px; font-weight: 600; color: rgba(255, 255, 255, 0.9);">
                    📝 Editing: ${filename}
                </div>
                <textarea style="
                    flex: 1; 
                    border: 1px solid rgba(255, 255, 255, 0.2); 
                    border-radius: 8px; 
                    padding: 16px; 
                    font-family: 'Monaco', 'Consolas', monospace;
                    background: rgba(0, 0, 0, 0.3);
                    color: rgba(255, 255, 255, 0.9);
                    resize: none;
                    outline: none;
                " placeholder="File content would load here...">
# ${filename}

This is a demonstration of the text editor functionality.
You can edit files directly in Pixel Pusher OS.

## Features
- Syntax highlighting (simulated)
- Auto-save functionality
- Multiple file format support

Created in Pixel Pusher OS File Explorer.
                </textarea>
                <div style="margin-top: 16px; text-align: right; display: flex; gap: 12px; justify-content: flex-end;">
                    <button onclick="this.closest('.modal').remove()" style="
                        padding: 10px 20px; 
                        border: 1px solid rgba(255, 255, 255, 0.3); 
                        background: transparent; 
                        color: rgba(255, 255, 255, 0.7);
                        border-radius: 6px; 
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">Cancel</button>
                    <button onclick="
                        window.pixelPusher?.showNotification?.('File saved successfully!', 'success'); 
                        this.closest('.modal').remove();
                    " style="
                        padding: 10px 20px; 
                        border: none; 
                        background: #6366f1; 
                        color: white; 
                        border-radius: 6px; 
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    ">Save File</button>
                </div>
            </div>
        `);
    }

    // Utility methods
    getFileIcon(item) {
        if (item.type === 'dir') {
            return { icon: '📁', color: '#60a5fa' };
        }

        const ext = item.name.split('.').pop().toLowerCase();
        const iconMap = {
            // Images
            'jpg': { icon: '🖼️', color: '#ef4444' },
            'jpeg': { icon: '🖼️', color: '#ef4444' },
            'png': { icon: '🖼️', color: '#ef4444' },
            'gif': { icon: '🖼️', color: '#ef4444' },
            'svg': { icon: '🎨', color: '#8b5cf6' },
            'webp': { icon: '🖼️', color: '#ef4444' },

            // Videos
            'mp4': { icon: '🎥', color: '#06b6d4' },
            'avi': { icon: '🎥', color: '#06b6d4' },
            'mov': { icon: '🎥', color: '#06b6d4' },
            'mkv': { icon: '🎥', color: '#06b6d4' },
            'webm': { icon: '🎥', color: '#06b6d4' },

            // Audio
            'mp3': { icon: '🎵', color: '#10b981' },
            'wav': { icon: '🎵', color: '#10b981' },
            'ogg': { icon: '🎵', color: '#10b981' },
            'flac': { icon: '🎵', color: '#10b981' },
            'm4a': { icon: '🎵', color: '#10b981' },

            // Documents
            'txt': { icon: '📄', color: '#6b7280' },
            'md': { icon: '📝', color: '#6366f1' },
            'pdf': { icon: '📕', color: '#dc2626' },
            'doc': { icon: '📘', color: '#2563eb' },
            'docx': { icon: '📘', color: '#2563eb' },

            // Spreadsheets
            'xls': { icon: '📊', color: '#059669' },
            'xlsx': { icon: '📊', color: '#059669' },
            'csv': { icon: '📊', color: '#059669' },

            // Presentations
            'ppt': { icon: '📽️', color: '#ea580c' },
            'pptx': { icon: '📽️', color: '#ea580c' },

            // Code files
            'html': { icon: '🌐', color: '#f97316' },
            'css': { icon: '🎨', color: '#3b82f6' },
            'js': { icon: '📜', color: '#facc15' },
            'py': { icon: '🐍', color: '#3776ab' },
            'json': { icon: '📋', color: '#8b5cf6' },
            'xml': { icon: '📋', color: '#8b5cf6' },

            // Archives
            'zip': { icon: '📦', color: '#6b7280' },
            'rar': { icon: '📦', color: '#6b7280' },
            '7z': { icon: '📦', color: '#6b7280' },

            // Executables
            'exe': { icon: '⚙️', color: '#374151' },
            'app': { icon: '⚙️', color: '#374151' }
        };

        return iconMap[ext] || { icon: '📄', color: '#9ca3af' };
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
            // Always put directories first
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

            const viewBtn = explorer.container.querySelector('.view-btn .btn-icon');
            if (viewBtn) {
                viewBtn.textContent = explorer.viewMode === 'list' ? '⊞' : '☰';
            }

            this.navigateToPath(explorer, explorer.currentPath);
            this.savePreferences();
        }
    }

    refresh(explorerId) {
        const explorer = this.explorers.get(explorerId);
        if (explorer) {
            console.log('📁 Refreshing explorer:', explorerId);
            this.navigateToPath(explorer, explorer.currentPath);
        }
    }

    changeSorting(explorerId, sortBy) {
        const explorer = this.explorers.get(explorerId);
        if (explorer) {
            // Toggle sort order if same field
            if (this.sortBy === sortBy) {
                this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortBy = sortBy;
                this.sortOrder = 'asc';
            }

            this.savePreferences();
            this.navigateToPath(explorer, explorer.currentPath);
        }
    }

    showUploadDialog(explorerId) {
        const fileUpload = document.getElementById(`file-upload-${explorerId}`);
        if (fileUpload) {
            fileUpload.click();
        }
    }

    createNewFolder(explorerId) {
        const explorer = this.explorers.get(explorerId);
        if (!explorer) return;

        const folderName = prompt('Enter folder name:', 'New Folder');
        if (folderName && folderName.trim()) {
            if (window.pixelPusher?.showNotification) {
                window.pixelPusher.showNotification(`Created folder: ${folderName}`, 'success');
            }

            setTimeout(() => {
                this.refresh(explorerId);
            }, 500);
        }
    }

    performSearch(explorerId) {
        const explorer = this.explorers.get(explorerId);
        const searchInput = document.getElementById(`search-${explorerId}`);

        if (!explorer || !searchInput) return;

        const query = searchInput.value.trim();
        if (!query) {
            this.navigateToPath(explorer, explorer.currentPath);
            return;
        }

        if (window.pixelPusher?.showNotification) {
            window.pixelPusher.showNotification(`Searching for: ${query}`, 'info');
        }

        // For demo purposes, just filter current items
        this.navigateToPath(explorer, explorer.currentPath);
    }

    // File operations
    selectFile(explorer, fileName) {
        explorer.selectedFiles.add(fileName);
        this.updateFileSelection(explorer, fileName, true);
        this.updateStatusBar(explorer);
    }

    clearSelection(explorer) {
        explorer.selectedFiles.forEach(fileName => {
            this.updateFileSelection(explorer, fileName, false);
        });
        explorer.selectedFiles.clear();
        this.updateStatusBar(explorer);
    }

    toggleFileSelection(explorer, fileName) {
        if (explorer.selectedFiles.has(fileName)) {
            explorer.selectedFiles.delete(fileName);
            this.updateFileSelection(explorer, fileName, false);
        } else {
            this.selectFile(explorer, fileName);
        }
    }

    updateFileSelection(explorer, fileName, selected) {
        const fileItem = explorer.content.querySelector(`[data-name="${fileName}"]`);
        if (!fileItem) return;

        if (selected) {
            fileItem.style.backgroundColor = 'rgba(99, 102, 241, 0.3)';
            fileItem.style.borderColor = '#6366f1';
            fileItem.style.transform = 'translateY(-2px)';
            fileItem.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
        } else {
            fileItem.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
            fileItem.style.borderColor = 'transparent';
            fileItem.style.transform = 'translateY(0)';
            fileItem.style.boxShadow = 'none';
        }
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

        if (backBtn) {
            backBtn.disabled = explorer.historyIndex <= 0;
            backBtn.style.opacity = explorer.historyIndex <= 0 ? '0.5' : '1';
        }
        if (forwardBtn) {
            forwardBtn.disabled = explorer.historyIndex >= explorer.history.length - 1;
            forwardBtn.style.opacity = explorer.historyIndex >= explorer.history.length - 1 ? '0.5' : '1';
        }
        if (upBtn) {
            upBtn.disabled = explorer.currentPath === '/';
            upBtn.style.opacity = explorer.currentPath === '/' ? '0.5' : '1';
        }
    }

    createModal(title, content) {
        if (window.pixelPusher?.showModal) {
            return window.pixelPusher.showModal(title, content);
        } else {
            alert(title + '\n\n' + content.replace(/<[^>]*>/g, ''));
        }
    }

    showError(explorer, message) {
        console.error('📁 Explorer error:', message);

        explorer.content.innerHTML = `
            <div class="error-state" style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 300px;
                color: #ef4444;
                font-size: 16px;
                text-align: center;
            ">
                <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
                <div style="font-weight: 500; margin-bottom: 8px;">Error Loading Directory</div>
                <div style="font-size: 14px; opacity: 0.8; margin-bottom: 20px;">${message}</div>
                <button onclick="window.pixelPusher.modules.explorer.refresh('${explorer.id}')" style="
                    padding: 10px 20px;
                    background: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                ">Retry</button>
            </div>
        `;

        if (window.pixelPusher?.showNotification) {
            window.pixelPusher.showNotification(message, 'error');
        }
    }

    showFileContextMenu(explorer, e, item) {
        // Simplified context menu for demo
        if (window.pixelPusher?.showNotification) {
            window.pixelPusher.showNotification(`Context menu for: ${item.name}`, 'info');
        }
    }

    showFolderContextMenu(explorer, e) {
        // Simplified context menu for demo
        if (window.pixelPusher?.showNotification) {
            window.pixelPusher.showNotification('Right-click context menu', 'info');
        }
    }

    applyExplorerStyling(explorer) {
        // Add modern styling
        const style = document.createElement('style');
        style.textContent = `
            .explorer-toolbar {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 12px 16px;
                background: rgba(255, 255, 255, 0.05);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(12px);
            }
            
            .nav-section, .actions-section {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .address-section {
                flex: 1;
                margin: 0 16px;
            }
            
            .address-bar {
                display: flex;
                align-items: center;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                padding: 8px 12px;
                gap: 8px;
            }
            
            .path-input {
                flex: 1;
                background: transparent;
                border: none;
                outline: none;
                color: rgba(255, 255, 255, 0.9);
                font-size: 14px;
                font-family: 'Monaco', 'Consolas', monospace;
            }
            
            .nav-btn, .action-btn {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 6px;
                color: rgba(255, 255, 255, 0.8);
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .nav-btn {
                padding: 8px;
                min-width: 36px;
                justify-content: center;
            }
            
            .action-btn {
                padding: 8px 12px;
            }
            
            .nav-btn:hover, .action-btn:hover {
                background: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 255, 0.25);
                transform: translateY(-1px);
            }
            
            .search-container {
                display: flex;
                align-items: center;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 6px;
                padding: 6px;
                gap: 4px;
            }
            
            .search-input {
                background: transparent;
                border: none;
                outline: none;
                color: rgba(255, 255, 255, 0.9);
                font-size: 13px;
                width: 120px;
            }
            
            .explorer-main {
                display: flex;
                flex: 1;
                overflow: hidden;
            }
            
            .explorer-sidebar {
                width: 220px;
                background: rgba(0, 0, 0, 0.2);
                border-right: 1px solid rgba(255, 255, 255, 0.1);
                padding: 16px;
                overflow-y: auto;
            }
            
            .sidebar-section {
                margin-bottom: 24px;
            }
            
            .sidebar-header {
                font-size: 12px;
                font-weight: 600;
                color: rgba(255, 255, 255, 0.6);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 12px;
            }
            
            .sidebar-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 14px;
                color: rgba(255, 255, 255, 0.8);
            }
            
            .sidebar-item:hover {
                background: rgba(255, 255, 255, 0.08);
                color: rgba(255, 255, 255, 0.95);
            }
            
            .sidebar-icon {
                font-size: 16px;
                width: 20px;
                text-align: center;
            }
            
            .explorer-content-area {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .content-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 20px;
                background: rgba(255, 255, 255, 0.03);
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }
            
            .breadcrumb {
                display: flex;
                align-items: center;
                gap: 8px;
                color: rgba(255, 255, 255, 0.7);
                font-size: 13px;
            }
            
            .breadcrumb-item {
                cursor: pointer;
                transition: color 0.2s ease;
            }
            
            .breadcrumb-item:hover {
                color: rgba(255, 255, 255, 0.9);
            }
            
            .breadcrumb-item.active {
                color: #6366f1;
                font-weight: 500;
            }
            
            .breadcrumb-separator {
                color: rgba(255, 255, 255, 0.4);
                font-size: 12px;
            }
            
            .sort-select {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 6px;
                color: rgba(255, 255, 255, 0.8);
                padding: 6px 10px;
                font-size: 12px;
                outline: none;
                cursor: pointer;
            }
            
            .explorer-content {
                flex: 1;
                overflow: auto;
                background: rgba(0, 0, 0, 0.1);
            }
            
            .explorer-statusbar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 16px;
                background: rgba(0, 0, 0, 0.2);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                font-size: 12px;
                color: rgba(255, 255, 255, 0.6);
            }
            
            .drop-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(99, 102, 241, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                backdrop-filter: blur(8px);
            }
            
            .drop-content {
                text-align: center;
                color: white;
            }
            
            .drop-icon {
                font-size: 64px;
                margin-bottom: 16px;
            }
            
            .drop-text {
                font-size: 18px;
                font-weight: 500;
            }
        `;
        document.head.appendChild(style);
    }

    // Preferences and cleanup
    loadPreferences() {
        if (window.pixelPusher?.modules?.state) {
            const state = window.pixelPusher.modules.state;
            this.viewMode = state.getPreference('explorerViewMode', 'list');
            this.sortBy = state.getPreference('explorerSortBy', 'name');
            this.sortOrder = state.getPreference('explorerSortOrder', 'asc');
        }
    }

    savePreferences() {
        if (window.pixelPusher?.modules?.state) {
            const state = window.pixelPusher.modules.state;
            state.setPreference('explorerViewMode', this.viewMode);
            state.setPreference('explorerSortBy', this.sortBy);
            state.setPreference('explorerSortOrder', this.sortOrder);
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
        if (existingExplorer && window.pixelPusher?.modules?.windows) {
            window.pixelPusher.modules.windows.focus(existingExplorer.id);
        } else if (window.pixelPusher?.modules?.windows) {
            window.pixelPusher.modules.windows.open('explorer');
        }
    }

    getStats() {
        return {
            activeExplorers: this.explorers.size,
            viewMode: this.viewMode,
            sortBy: this.sortBy,
            sortOrder: this.sortOrder
        };
    }

    handleResize() {
        // Handle window resize if needed
    }

    destroy() {
        this.explorers.clear();
        console.log('📁 Enhanced File Explorer Manager destroyed');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplorerManager;
}

console.log('📁 Fixed File Explorer manager loaded successfully');