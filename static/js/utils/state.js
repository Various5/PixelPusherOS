/**
 * Pixel Pusher OS - State Management System
 * Centralized state management with persistence and change notifications
 *
 * This module provides:
 * - Centralized application state storage
 * - Automatic persistence to localStorage
 * - Change event notifications
 * - Desktop icon management
 * - Game state persistence
 * - User preferences storage
 */

class StateManager {
    constructor() {
        this.state = this.initializeDefaultState();
        this.listeners = {};  // Event listeners for state changes
        this.persistenceTimer = null;

        // Load saved state from localStorage
        this.loadPersistedState();

        // Set up automatic persistence
        this.setupAutoPersistence();

        console.log('💾 State Manager initialized');
    }

    /**
     * Initialize default application state
     */
    initializeDefaultState() {
        return {
            // User information
            currentUser: null,
            userGroup: 'user',
            sessionId: this.generateSessionId(),

            // Window management
            windows: new Set(),
            zIndex: 100,
            activeWindow: null,

            // File system state
            currentPath: '/',
            explorerHistory: ['/'],

            // Desktop configuration
            desktopIcons: this.getDefaultDesktopIcons(),

            // Game states with persistent data
            games: {
                snake: {
                    running: false,
                    score: 0,
                    highScore: 0,
                    settings: { difficulty: 'normal', speed: 150 }
                },
                dino: {
                    running: false,
                    score: 0,
                    highScore: 0,
                    settings: { theme: 'classic' }
                },
                memory: {
                    moves: 0,
                    matches: 0,
                    cards: [],
                    flipped: [],
                    difficulty: 'normal'
                },
                village: {
                    gold: 100,
                    population: 0,
                    buildings: 0,
                    income: 0,
                    costs: { hut: 10, farm: 25, mine: 50, castle: 100 },
                    lastSaved: Date.now()
                }
            },

            // User preferences and settings
            preferences: {
                theme: 'default',
                fontSize: 14,
                windowOpacity: 1.0,
                wallpaper: null,
                animations: true,
                soundEnabled: true,
                autoSave: true
            },

            // System information
            system: {
                startTime: Date.now(),
                version: '2.0.0',
                lastActivity: Date.now()
            },

            // Application metrics
            metrics: {
                sessionsCount: 0,
                commandsExecuted: 0,
                filesCreated: 0,
                gamesPlayed: 0
            }
        };
    }

    /**
     * Get default desktop icon configuration
     */
    getDefaultDesktopIcons() {
        return [
            // System applications
            { id: 'terminal', name: 'Terminal', icon: '💻', x: 60, y: 80, category: 'system' },
            { id: 'explorer', name: 'File Explorer', icon: '📁', x: 60, y: 200, category: 'system' },
            { id: 'browser', name: 'Web Browser', icon: '🌐', x: 60, y: 320, category: 'internet' },

            // Games
            { id: 'snake', name: 'Snake Game', icon: '🐍', x: 180, y: 80, category: 'games' },
            { id: 'dino', name: 'Dino Runner', icon: '🦕', x: 180, y: 200, category: 'games' },
            { id: 'clicker', name: 'Village Builder', icon: '🏘️', x: 180, y: 320, category: 'games' },
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
     * Generate unique session identifier
     */
    generateSessionId() {
        return 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Get state value by path (dot notation supported)
     */
    get(path) {
        if (!path) return this.state;

        const keys = path.split('.');
        let value = this.state;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }

        return value;
    }

    /**
     * Set state value by path with change notification
     */
    set(path, value) {
        if (!path) {
            console.error('State.set() requires a valid path');
            return false;
        }

        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.state;

        // Navigate to the parent object, creating objects if needed
        for (const key of keys) {
            if (!(key in target) || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }

        // Store old value for change detection
        const oldValue = target[lastKey];

        // Set the new value
        target[lastKey] = value;

        // Update last activity
        this.state.system.lastActivity = Date.now();

        // Emit change event
        this.emit('stateChange', {
            path,
            value,
            oldValue,
            timestamp: Date.now()
        });

        // Trigger persistence
        this.scheduleStatePersistence();

        return true;
    }

    /**
     * Update state object (merge with existing)
     */
    update(path, updates) {
        const current = this.get(path);
        if (current && typeof current === 'object' && typeof updates === 'object') {
            this.set(path, { ...current, ...updates });
        } else {
            this.set(path, updates);
        }
    }

    /**
     * Delete state value by path
     */
    delete(path) {
        if (!path) return false;

        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.state;

        // Navigate to parent object
        for (const key of keys) {
            if (target && typeof target === 'object' && key in target) {
                target = target[key];
            } else {
                return false; // Path doesn't exist
            }
        }

        if (target && lastKey in target) {
            const oldValue = target[lastKey];
            delete target[lastKey];

            this.emit('stateChange', {
                path,
                value: undefined,
                oldValue,
                deleted: true,
                timestamp: Date.now()
            });

            this.scheduleStatePersistence();
            return true;
        }

        return false;
    }

    /**
     * Window management methods
     */
    addWindow(windowId) {
        this.state.windows.add(windowId);
        this.state.zIndex++;
        this.emit('windowAdded', { windowId, zIndex: this.state.zIndex });
        this.scheduleStatePersistence();
    }

    removeWindow(windowId) {
        const wasActive = this.state.activeWindow === windowId;
        this.state.windows.delete(windowId);

        if (wasActive) {
            this.state.activeWindow = null;
        }

        this.emit('windowRemoved', { windowId, wasActive });
        this.scheduleStatePersistence();
    }

    setActiveWindow(windowId) {
        this.state.activeWindow = windowId;
        this.emit('windowActivated', { windowId });
    }

    getNextZIndex() {
        return ++this.state.zIndex;
    }

    getActiveWindows() {
        return Array.from(this.state.windows);
    }

    /**
     * Desktop icon management
     */
    getDesktopIcons() {
        return this.state.desktopIcons;
    }

    updateIconPosition(iconId, x, y) {
        const icon = this.state.desktopIcons.find(i => i.id === iconId);
        if (icon) {
            icon.x = x;
            icon.y = y;
            this.emit('iconMoved', { iconId, x, y });
            this.scheduleStatePersistence();
        }
    }

    addDesktopIcon(iconConfig) {
        this.state.desktopIcons.push({
            id: iconConfig.id || this.generateId(),
            name: iconConfig.name,
            icon: iconConfig.icon,
            x: iconConfig.x || 60,
            y: iconConfig.y || 80,
            category: iconConfig.category || 'custom'
        });

        this.emit('iconAdded', iconConfig);
        this.scheduleStatePersistence();
    }

    removeDesktopIcon(iconId) {
        const index = this.state.desktopIcons.findIndex(i => i.id === iconId);
        if (index > -1) {
            const removedIcon = this.state.desktopIcons.splice(index, 1)[0];
            this.emit('iconRemoved', { iconId, icon: removedIcon });
            this.scheduleStatePersistence();
        }
    }

    /**
     * Game state management
     */
    updateGameState(gameName, gameState) {
        if (this.state.games[gameName]) {
            this.state.games[gameName] = {
                ...this.state.games[gameName],
                ...gameState,
                lastUpdated: Date.now()
            };

            this.emit('gameStateChanged', { gameName, gameState });
            this.scheduleStatePersistence();
        }
    }

    getGameState(gameName) {
        return this.state.games[gameName] || null;
    }

    updateGameHighScore(gameName, score) {
        if (this.state.games[gameName]) {
            const currentHigh = this.state.games[gameName].highScore || 0;
            if (score > currentHigh) {
                this.state.games[gameName].highScore = score;
                this.emit('newHighScore', { gameName, score });
                this.scheduleStatePersistence();
                return true; // New high score!
            }
        }
        return false;
    }

    /**
     * User preferences management
     */
    setPreference(key, value) {
        this.state.preferences[key] = value;
        this.emit('preferenceChanged', { key, value });
        this.scheduleStatePersistence();
    }

    getPreference(key, defaultValue = null) {
        return this.state.preferences[key] !== undefined
            ? this.state.preferences[key]
            : defaultValue;
    }

    updatePreferences(preferences) {
        this.state.preferences = { ...this.state.preferences, ...preferences };
        this.emit('preferencesUpdated', preferences);
        this.scheduleStatePersistence();
    }

    /**
     * Metrics tracking
     */
    incrementMetric(metricName, amount = 1) {
        if (this.state.metrics[metricName] !== undefined) {
            this.state.metrics[metricName] += amount;
        } else {
            this.state.metrics[metricName] = amount;
        }

        this.scheduleStatePersistence();
    }

    getMetrics() {
        return { ...this.state.metrics };
    }

    /**
     * Event system for state changes
     */
    on(eventName, callback) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
    }

    off(eventName, callback) {
        if (this.listeners[eventName]) {
            const index = this.listeners[eventName].indexOf(callback);
            if (index > -1) {
                this.listeners[eventName].splice(index, 1);
            }
        }
    }

    emit(eventName, data) {
        if (this.listeners[eventName]) {
            this.listeners[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in state event listener (${eventName}):`, error);
                }
            });
        }
    }

    /**
     * State persistence methods
     */
    setupAutoPersistence() {
        // Save state every 30 seconds
        setInterval(() => {
            this.saveState();
        }, 30000);

        // Save state before page unload
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });

        // Save state when tab becomes hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveState();
            }
        });
    }

    scheduleStatePersistence() {
        // Debounce rapid state changes
        if (this.persistenceTimer) {
            clearTimeout(this.persistenceTimer);
        }

        this.persistenceTimer = setTimeout(() => {
            this.saveState();
        }, 1000); // Save 1 second after last change
    }

    saveState() {
        try {
            // Prepare state for persistence (exclude non-serializable data)
            const stateToSave = {
                preferences: this.state.preferences,
                games: {
                    snake: {
                        highScore: this.state.games.snake.highScore,
                        settings: this.state.games.snake.settings
                    },
                    dino: {
                        highScore: this.state.games.dino.highScore,
                        settings: this.state.games.dino.settings
                    },
                    memory: {
                        difficulty: this.state.games.memory.difficulty
                    },
                    village: this.state.games.village
                },
                desktopIcons: this.state.desktopIcons,
                currentPath: this.state.currentPath,
                explorerHistory: this.state.explorerHistory.slice(-10), // Keep last 10
                metrics: this.state.metrics,
                system: {
                    version: this.state.system.version,
                    sessionsCount: this.state.metrics.sessionsCount + 1
                },
                lastSaved: Date.now()
            };

            localStorage.setItem('pixelpusher_state', JSON.stringify(stateToSave));
            console.debug('💾 State saved to localStorage');

        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }

    loadPersistedState() {
        try {
            const savedState = localStorage.getItem('pixelpusher_state');
            if (savedState) {
                const parsed = JSON.parse(savedState);

                // Merge saved state with defaults (don't overwrite everything)
                this.state.preferences = { ...this.state.preferences, ...parsed.preferences };
                this.state.games = this.mergeGameState(this.state.games, parsed.games);
                this.state.currentPath = parsed.currentPath || '/';
                this.state.explorerHistory = parsed.explorerHistory || ['/'];
                this.state.metrics = { ...this.state.metrics, ...parsed.metrics };

                // Merge desktop icons but keep defaults for missing ones
                if (parsed.desktopIcons && Array.isArray(parsed.desktopIcons)) {
                    this.state.desktopIcons = this.mergeDesktopIcons(
                        this.state.desktopIcons,
                        parsed.desktopIcons
                    );
                }

                console.log('💾 State loaded from localStorage');
            }
        } catch (error) {
            console.warn('Failed to load saved state:', error);
        }
    }

    mergeGameState(defaultGames, savedGames) {
        if (!savedGames) return defaultGames;

        const merged = { ...defaultGames };

        Object.keys(savedGames).forEach(gameName => {
            if (merged[gameName]) {
                merged[gameName] = { ...merged[gameName], ...savedGames[gameName] };
            }
        });

        return merged;
    }

    mergeDesktopIcons(defaultIcons, savedIcons) {
        const merged = [...defaultIcons];

        // Update positions of existing icons
        savedIcons.forEach(savedIcon => {
            const existingIndex = merged.findIndex(icon => icon.id === savedIcon.id);
            if (existingIndex > -1) {
                merged[existingIndex] = { ...merged[existingIndex], ...savedIcon };
            } else if (savedIcon.category === 'custom') {
                // Add custom icons that don't exist in defaults
                merged.push(savedIcon);
            }
        });

        return merged;
    }

    /**
     * Utility methods
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Export current state for debugging
     */
    exportState() {
        return JSON.stringify(this.state, (key, value) => {
            // Handle Set objects
            if (value instanceof Set) {
                return Array.from(value);
            }
            return value;
        }, 2);
    }

    /**
     * Import state from exported data
     */
    importState(stateData) {
        try {
            const imported = JSON.parse(stateData);

            // Validate and merge imported state
            this.state = { ...this.state, ...imported };

            // Convert arrays back to Sets where needed
            if (Array.isArray(this.state.windows)) {
                this.state.windows = new Set(this.state.windows);
            }

            this.emit('stateImported', { imported });
            this.scheduleStatePersistence();

            return true;
        } catch (error) {
            console.error('Failed to import state:', error);
            return false;
        }
    }

    /**
     * Reset state to defaults
     */
    reset() {
        const oldState = { ...this.state };
        this.state = this.initializeDefaultState();

        this.emit('stateReset', { oldState });
        this.saveState();

        console.log('🔄 State reset to defaults');
    }

    /**
     * Get state statistics
     */
    getStats() {
        return {
            totalKeys: Object.keys(this.state).length,
            activeWindows: this.state.windows.size,
            desktopIcons: this.state.desktopIcons.length,
            sessionAge: Date.now() - this.state.system.startTime,
            lastActivity: this.state.system.lastActivity,
            metrics: this.state.metrics,
            memoryUsage: JSON.stringify(this.state).length
        };
    }

    /**
     * Clean up state manager
     */
    destroy() {
        // Clear persistence timer
        if (this.persistenceTimer) {
            clearTimeout(this.persistenceTimer);
        }

        // Save final state
        this.saveState();

        // Clear listeners
        this.listeners = {};

        console.log('💾 State Manager destroyed');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}

console.log('💾 State management system loaded successfully');