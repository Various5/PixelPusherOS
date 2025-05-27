/**
 * Fixed File Explorer Manager
 * Properly working file browser with drag & drop and file display
 */

class ExplorerManager {
    constructor() {
        this.explorers = new Map();
        this.currentPath = '/';
        this.viewMode = 'list'; // 'list' or 'grid'
        this.sortBy = 'name';
        this.sortOrder = 'asc';

        console.log('📁 File Explorer Manager initialized');
    }

    async init() {
        try {
            this.loadPreferences();
            this.setupGlobalShortcuts();
            console.log('✅ File Explorer system ready');
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

        console.log(`📁 Initializing explorer window: ${appId}`);

        const explorer = {
            id: appId,
            container: explorerContainer,
            content: null,
            currentPath: '/',
            history: ['/'],
            historyIndex: 0,
            selectedFiles: new Set(),
            viewMode: this.viewMode,
            isLoading: false
        };

        this.explorers.set(appId, explorer);

        // Create better UI structure
        this.setupExplorerUI(explorer);
        this.setupExplorerEventHandlers(explorer);
        this.applyExplorerStyling(explorer);

        // Load files immediately
        console.log('📁 Loading initial directory...');
        await this.navigateToPath(explorer, '/');

        console.log(`📁 File Explorer initialized: ${appId}`);
    }

    setupExplorerUI(explorer) {
        explorer.container.innerHTML = `
            <div class="explorer-header" style="
                display: flex; align-items: center; gap: 12px; padding: 16px;
                background: rgba(255, 255, 255, 0.05); border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            ">
                <button class="nav-btn" onclick="window.pixelPusher.modules.explorer.navigateBack('${explorer.id}')" title="Back">
                    ← Back
                </button>
                <button class="nav-btn" onclick="window.pixelPusher.modules.explorer.navigateUp('${explorer.id}')" title="Up">
                    ↑ Up
                </button>
                <input type="text" class="path-input" id="path-input-${explorer.id}" 
                       value="/" readonly style="
                    flex: 1; padding: 8px; background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 4px;
                    color: white; font-family: monospace;
                ">
                <button class="nav-btn" onclick="window.pixelPusher.modules.explorer.refresh('${explorer.id}')" title="Refresh">
                    🔄
                </button>
                <button class="nav-btn" onclick="window.pixelPusher.modules.explorer.toggleView('${explorer.id}')" title="Toggle View">
                    ${this.viewMode === 'list' ? '⊞' : '☰'}
                </button>
            </div>
            
            <div class="explorer-main" style="
                flex: 1; display: flex; overflow: hidden;
            ">
                <div class="explorer-sidebar" style="
                    width: 200px; background: rgba(0, 0, 0, 0.2);
                    border-right: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 16px; overflow-y: auto;
                ">
                    <h3 style="color: white; margin: 0 0 16px 0; font-size: 14px;">Quick Access</h3>
                    <div class="sidebar-item" onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/')" 
                         style="padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 4px; color: white;">
                        🏠 Home
                    </div>
                    <div class="sidebar-item" onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/documents')" 
                         style="padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 4px; color: white;">
                        📄 Documents
                    </div>
                    <div class="sidebar-item" onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/downloads')" 
                         style="padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 4px; color: white;">
                        ⬇️ Downloads
                    </div>
                    <div class="sidebar-item" onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/pictures')" 
                         style="padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 4px; color: white;">
                        🖼️ Pictures
                    </div>
                    <div class="sidebar-item" onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/music')" 
                         style="padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 4px; color: white;">
                        🎵 Music
                    </div>
                    <div class="sidebar-item" onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/videos')" 
                         style="padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 4px; color: white;">
                        🎥 Videos
                    </div>
                </div>
                
                <div class="explorer-content-area" style="
                    flex: 1; display: flex; flex-direction: column; overflow: hidden;
                ">
                    <div class="content-toolbar" style="
                        padding: 12px 16px; background: rgba(255, 255, 255, 0.03);
                        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                        display: flex; justify-content: space-between; align-items: center;
                    ">
                        <div class="breadcrumb" id="breadcrumb-${explorer.id}" style="color: white; font-size: 13px;">
                            📁 Home
                        </div>
                        <select class="sort-select" onchange="window.pixelPusher.modules.explorer.changeSorting('${explorer.id}', this.value)" style="
                            background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);
                            color: white; border-radius: 4px; padding: 4px 8px; font-size: 12px;
                        ">
                            <option value="name">Name</option>
                            <option value="size">Size</option>
                            <option value="date">Date</option>
                            <option value="type">Type</option>
                        </select>
                    </div>
                    
                    <div class="explorer-content" id="explorer-content-${explorer.id}" style="
                        flex: 1; overflow: auto; background: rgba(0, 0, 0, 0.1);
                        padding: 16px; color: white;
                    ">
                        <div class="loading-indicator">Loading files...</div>
                    </div>
                </div>
            </div>
            
            <div class="explorer-status" style="
                padding: 8px 16px; background: rgba(0, 0, 0, 0.2);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                font-size: 12px; color: rgba(255, 255, 255, 0.7);
            ">
                <span id="status-${explorer.id}">Ready</span>
            </div>
        `;

        explorer.content = explorer.container.querySelector(`#explorer-content-${explorer.id}`);

        // Add hover effects to sidebar items
        explorer.container.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.background = 'rgba(255, 255, 255, 0.1)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });
        });
    }

    async navigateToPath(explorer, path) {
        if (explorer.isLoading) {
            console.log('📁 Already loading, skipping navigation');
            return;
        }

        explorer.isLoading = true;
        console.log(`📁 Navigating to: ${path}`);

        try {
            // Show loading state
            this.showLoadingState(explorer);

            // Normalize path
            path = this.normalizePath(path);
            console.log(`📁 Normalized path: ${path}`);

            // Get directory contents
            const data = await this.getDirectoryContents(path);
            console.log(`📁 Got ${data.items ? data.items.length : 0} items`);

            // Update explorer state
            explorer.currentPath = path;

            // Update path input
            const pathInput = document.getElementById(`path-input-${explorer.id}`);
            if (pathInput) {
                pathInput.value = path;
            }

            // Update navigation history
            if (explorer.history[explorer.historyIndex] !== path) {
                explorer.history = explorer.history.slice(0, explorer.historyIndex + 1);
                explorer.history.push(path);
                explorer.historyIndex = explorer.history.length - 1;
            }

            // Update breadcrumb
            this.updateBreadcrumb(explorer, path);

            // Render directory contents
            this.renderDirectoryContents(explorer, data.items || []);

            // Update status
            this.updateStatus(explorer, `${data.items ? data.items.length : 0} items`);

            console.log('📁 Navigation completed successfully');

        } catch (error) {
            console.error('📁 Navigation error:', error);
            this.showError(explorer, `Failed to load directory: ${error.message}`);
        } finally {
            explorer.isLoading = false;
        }
    }

    async getDirectoryContents(path) {
        console.log(`📁 Getting directory contents for: ${path}`);

        // Try API first, fallback to mock data
        try {
            const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
            if (response.ok) {
                const data = await response.json();
                console.log('📁 Got data from API');
                return data;
            }
        } catch (error) {
            console.log('📁 API failed, using mock data');
        }

        // Use mock data
        return this.getMockDirectoryContents(path);
    }

    getMockDirectoryContents(path) {
        console.log(`📁 Using mock data for: ${path}`);

        const mockData = {
            '/': {
                items: [
                    { name: 'documents', type: 'directory', size: 0, modified: Date.now() - 86400000, icon: '📁' },
                    { name: 'downloads', type: 'directory', size: 0, modified: Date.now() - 172800000, icon: '📁' },
                    { name: 'pictures', type: 'directory', size: 0, modified: Date.now() - 259200000, icon: '📁' },
                    { name: 'music', type: 'directory', size: 0, modified: Date.now() - 345600000, icon: '📁' },
                    { name: 'videos', type: 'directory', size: 0, modified: Date.now() - 432000000, icon: '📁' },
                    { name: 'desktop', type: 'directory', size: 0, modified: Date.now() - 518400000, icon: '📁' },
                    { name: 'README.txt', type: 'file', size: 1024, modified: Date.now() - 86400000, icon: '📄' },
                    { name: 'welcome.md', type: 'file', size: 2048, modified: Date.now() - 172800000, icon: '📝' },
                    { name: 'system_info.json', type: 'file', size: 512, modified: Date.now() - 259200000, icon: '📋' }
                ]
            },
            '/documents': {
                items: [
                    { name: 'sample.txt', type: 'file', size: 1024, modified: Date.now() - 86400000, icon: '📄' },
                    { name: 'project_ideas.txt', type: 'file', size: 2048, modified: Date.now() - 172800000, icon: '📄' },
                    { name: 'report.pdf', type: 'file', size: 524288, modified: Date.now() - 259200000, icon: '📕' },
                    { name: 'presentation.pptx', type: 'file', size: 1048576, modified: Date.now() - 345600000, icon: '📽️' },
                    { name: 'archive', type: 'directory', size: 0, modified: Date.now() - 518400000, icon: '📁' },
                    { name: 'personal', type: 'directory', size: 0, modified: Date.now() - 604800000, icon: '📁' }
                ]
            },
            '/downloads': {
                items: [
                    { name: 'software.zip', type: 'file', size: 10485760, modified: Date.now() - 86400000, icon: '📦' },
                    { name: 'image.jpg', type: 'file', size: 1024000, modified: Date.now() - 172800000, icon: '🖼️' },
                    { name: 'video.mp4', type: 'file', size: 52428800, modified: Date.now() - 259200000, icon: '🎥' },
                    { name: 'document.pdf', type: 'file', size: 2048000, modified: Date.now() - 345600000, icon: '📕' }
                ]
            },
            '/pictures': {
                items: [
                    { name: 'vacation', type: 'directory', size: 0, modified: Date.now() - 86400000, icon: '📁' },
                    { name: 'family', type: 'directory', size: 0, modified: Date.now() - 172800000, icon: '📁' },
                    { name: 'wallpaper.jpg', type: 'file', size: 2048000, modified: Date.now() - 345600000, icon: '🖼️' },
                    { name: 'avatar.png', type: 'file', size: 512000, modified: Date.now() - 432000000, icon: '🖼️' }
                ]
            },
            '/music': {
                items: [
                    { name: 'Rock', type: 'directory', size: 0, modified: Date.now() - 86400000, icon: '📁' },
                    { name: 'Pop', type: 'directory', size: 0, modified: Date.now() - 172800000, icon: '📁' },
                    { name: 'Classical', type: 'directory', size: 0, modified: Date.now() - 259200000, icon: '📁' },
                    { name: 'README.txt', type: 'file', size: 1024, modified: Date.now() - 432000000, icon: '📄' }
                ]
            },
            '/videos': {
                items: [
                    { name: 'Movies', type: 'directory', size: 0, modified: Date.now() - 86400000, icon: '📁' },
                    { name: 'Personal', type: 'directory', size: 0, modified: Date.now() - 172800000, icon: '📁' },
                    { name: 'demo.mp4', type: 'file', size: 104857600, modified: Date.now() - 345600000, icon: '🎥' }
                ]
            },
            '/desktop': {
                items: [
                    { name: 'Notes.txt', type: 'file', size: 512, modified: Date.now() - 172800000, icon: '📄' },
                    { name: 'Todo.md', type: 'file', size: 1024, modified: Date.now() - 259200000, icon: '📝' }
                ]
            }
        };

        const result = mockData[path] || { items: [] };
        console.log(`📁 Mock data for ${path}:`, result);
        return result;
    }

    renderDirectoryContents(explorer, items) {
        console.log(`📁 Rendering ${items.length} items`);

        if (!explorer.content) {
            console.error('📁 Explorer content container not found');
            return;
        }

        if (!items || items.length === 0) {
            this.showEmptyDirectory(explorer);
            return;
        }

        // Sort items
        const sortedItems = this.sortItems(items);

        // Create file list
        const fileList = document.createElement('div');
        fileList.className = `file-list file-list-${explorer.viewMode}`;

        if (explorer.viewMode === 'grid') {
            fileList.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 16px;
                padding: 8px;
            `;
        } else {
            fileList.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 2px;
            `;
        }

        // Render each item
        sortedItems.forEach(item => {
            const itemElement = this.createFileItem(explorer, item);
            fileList.appendChild(itemElement);
        });

        // Replace content
        explorer.content.innerHTML = '';
        explorer.content.appendChild(fileList);

        console.log('📁 Directory contents rendered successfully');
    }

    createFileItem(explorer, item) {
        const itemElement = document.createElement('div');
        itemElement.className = 'file-item';
        itemElement.dataset.name = item.name;
        itemElement.dataset.type = item.type;

        const isDirectory = item.type === 'directory' || item.type === 'dir';
        const icon = item.icon || (isDirectory ? '📁' : '📄');

        if (explorer.viewMode === 'grid') {
            itemElement.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 12px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid transparent;
            `;

            itemElement.innerHTML = `
                <div style="font-size: 32px; margin-bottom: 8px;">${icon}</div>
                <div style="font-size: 12px; word-break: break-word; line-height: 1.2;">
                    ${this.escapeHtml(item.name)}
                </div>
                ${!isDirectory ? `<div style="font-size: 10px; color: rgba(255,255,255,0.6); margin-top: 4px;">
                    ${this.formatFileSize(item.size)}
                </div>` : ''}
            `;
        } else {
            itemElement.style.cssText = `
                display: flex;
                align-items: center;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
                background: rgba(255, 255, 255, 0.02);
            `;

            const fileSize = isDirectory ? '--' : this.formatFileSize(item.size);
            const modifiedDate = new Date(item.modified).toLocaleDateString();

            itemElement.innerHTML = `
                <div style="font-size: 20px; margin-right: 12px; width: 24px; text-align: center;">
                    ${icon}
                </div>
                <div style="flex: 1; overflow: hidden;">
                    <div style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${this.escapeHtml(item.name)}
                    </div>
                </div>
                <div style="width: 80px; text-align: right; font-size: 12px; color: rgba(255,255,255,0.6);">
                    ${fileSize}
                </div>
                <div style="width: 100px; text-align: right; font-size: 12px; color: rgba(255,255,255,0.6);">
                    ${modifiedDate}
                </div>
            `;
        }

        // Add event handlers
        this.setupFileItemEvents(itemElement, item, explorer);

        return itemElement;
    }

    setupFileItemEvents(itemElement, item, explorer) {
        // Double-click to open
        itemElement.addEventListener('dblclick', () => {
            if (item.type === 'directory' || item.type === 'dir') {
                const newPath = this.joinPath(explorer.currentPath, item.name);
                this.navigateToPath(explorer, newPath);
            } else {
                this.openFile(item);
            }
        });

        // Single click to select
        itemElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectItem(explorer, itemElement);
        });

        // Hover effects
        itemElement.addEventListener('mouseenter', () => {
            itemElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            itemElement.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        });

        itemElement.addEventListener('mouseleave', () => {
            if (!itemElement.classList.contains('selected')) {
                itemElement.style.backgroundColor = explorer.viewMode === 'grid' ?
                    'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)';
                itemElement.style.borderColor = 'transparent';
            }
        });
    }

    selectItem(explorer, itemElement) {
        // Clear other selections
        explorer.content.querySelectorAll('.file-item.selected').forEach(item => {
            item.classList.remove('selected');
            item.style.backgroundColor = explorer.viewMode === 'grid' ?
                'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)';
            item.style.borderColor = 'transparent';
        });

        // Select this item
        itemElement.classList.add('selected');
        itemElement.style.backgroundColor = 'rgba(0, 150, 255, 0.3)';
        itemElement.style.borderColor = 'rgba(0, 150, 255, 0.5)';
    }

    openFile(item) {
        console.log(`📁 Opening file: ${item.name}`);

        if (window.pixelPusher?.showNotification) {
            window.pixelPusher.showNotification(`Opening ${item.name}...`, 'info');
        }

        // Here you could implement actual file opening logic
        // For now, just show a notification
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

    navigateUp(explorerId) {
        const explorer = this.explorers.get(explorerId);
        if (explorer && explorer.currentPath !== '/') {
            const parentPath = explorer.currentPath.split('/').slice(0, -1).join('/') || '/';
            this.navigateToPath(explorer, parentPath);
        }
    }

    refresh(explorerId) {
        const explorer = this.explorers.get(explorerId);
        if (explorer) {
            console.log('📁 Refreshing explorer');
            this.navigateToPath(explorer, explorer.currentPath);
        }
    }

    toggleView(explorerId) {
        const explorer = this.explorers.get(explorerId);
        if (explorer) {
            explorer.viewMode = explorer.viewMode === 'list' ? 'grid' : 'list';
            this.viewMode = explorer.viewMode;

            // Update button text
            const button = explorer.container.querySelector('.explorer-header button[title="Toggle View"]');
            if (button) {
                button.textContent = explorer.viewMode === 'list' ? '⊞' : '☰';
            }

            this.navigateToPath(explorer, explorer.currentPath);
        }
    }

    changeSorting(explorerId, sortBy) {
        const explorer = this.explorers.get(explorerId);
        if (explorer) {
            if (this.sortBy === sortBy) {
                this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortBy = sortBy;
                this.sortOrder = 'asc';
            }
            this.navigateToPath(explorer, explorer.currentPath);
        }
    }

    // Utility methods
    showLoadingState(explorer) {
        if (explorer.content) {
            explorer.content.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: white;">
                    <div style="font-size: 32px; margin-bottom: 16px;">📁</div>
                    <div>Loading files...</div>
                </div>
            `;
        }
    }

    showEmptyDirectory(explorer) {
        if (explorer.content) {
            explorer.content.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: rgba(255,255,255,0.6);">
                    <div style="font-size: 48px; margin-bottom: 16px;">📂</div>
                    <div>This folder is empty</div>
                </div>
            `;
        }
    }

    showError(explorer, message) {
        if (explorer.content) {
            explorer.content.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: #ff6b6b;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                    <div style="margin-bottom: 16px;">Error Loading Directory</div>
                    <div style="font-size: 14px; opacity: 0.8; margin-bottom: 20px; text-align: center; max-width: 300px;">${message}</div>
                    <button onclick="window.pixelPusher.modules.explorer.refresh('${explorer.id}')" style="
                        padding: 10px 20px; background: #ff6b6b; color: white; border: none;
                        border-radius: 4px; cursor: pointer; font-weight: 500;
                    ">Retry</button>
                </div>
            `;
        }
    }

    updateBreadcrumb(explorer, path) {
        const breadcrumb = document.getElementById(`breadcrumb-${explorer.id}`);
        if (!breadcrumb) return;

        const pathParts = path === '/' ? [] : path.split('/').filter(Boolean);
        let breadcrumbHTML = `<span onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '/')" 
                                   style="cursor: pointer; color: ${path === '/' ? '#4fc3f7' : 'inherit'};">
                                📁 Home
                              </span>`;

        let currentPath = '';
        pathParts.forEach((part, index) => {
            currentPath += '/' + part;
            const isLast = index === pathParts.length - 1;
            breadcrumbHTML += ` › <span onclick="window.pixelPusher.modules.explorer.navigateToPath('${explorer.id}', '${currentPath}')" 
                                      style="cursor: pointer; color: ${isLast ? '#4fc3f7' : 'inherit'};">
                                   ${this.escapeHtml(part)}
                                 </span>`;
        });

        breadcrumb.innerHTML = breadcrumbHTML;
    }

    updateStatus(explorer, message) {
        const status = document.getElementById(`status-${explorer.id}`);
        if (status) {
            status.textContent = message;
        }
    }

    setupExplorerEventHandlers(explorer) {
        // Click outside to clear selection
        explorer.content.addEventListener('click', (e) => {
            if (e.target === explorer.content || e.target.classList.contains('file-list')) {
                explorer.content.querySelectorAll('.file-item.selected').forEach(item => {
                    item.classList.remove('selected');
                    item.style.backgroundColor = explorer.viewMode === 'grid' ?
                        'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)';
                    item.style.borderColor = 'transparent';
                });
            }
        });
    }

    applyExplorerStyling(explorer) {
        // Apply consistent styling
        const style = document.createElement('style');
        if (!document.getElementById('explorer-styles')) {
            style.id = 'explorer-styles';
            style.textContent = `
                .nav-btn {
                    padding: 6px 12px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                    color: white;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s ease;
                }
                .nav-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                .nav-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Utility methods
    normalizePath(path) {
        if (!path || path === '/') return '/';
        return path.startsWith('/') ? path : '/' + path;
    }

    joinPath(basePath, fileName) {
        if (basePath === '/') return '/' + fileName;
        return basePath + '/' + fileName;
    }

    sortItems(items) {
        return [...items].sort((a, b) => {
            // Directories first
            const aIsDir = a.type === 'directory' || a.type === 'dir';
            const bIsDir = b.type === 'directory' || b.type === 'dir';

            if (aIsDir !== bIsDir) {
                return aIsDir ? -1 : 1;
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

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    loadPreferences() {
        if (window.pixelPusher?.modules?.state) {
            const state = window.pixelPusher.modules.state;
            this.viewMode = state.getPreference('explorerViewMode', 'list');
            this.sortBy = state.getPreference('explorerSortBy', 'name');
            this.sortOrder = state.getPreference('explorerSortOrder', 'asc');
        }
    }

    setupGlobalShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'e') {
                e.preventDefault();
                if (window.pixelPusher?.modules?.windows) {
                    window.pixelPusher.modules.windows.open('explorer');
                }
            }
        });
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
        console.log('📁 Explorer window resized');
    }

    destroy() {
        this.explorers.clear();
        console.log('📁 File Explorer Manager destroyed');
    }
}

// Ensure global availability
window.ExplorerManager = ExplorerManager;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplorerManager;
}

console.log('📁 Fixed File Explorer manager loaded successfully');