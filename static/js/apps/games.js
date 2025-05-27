/**
 * Updated Games Manager - Loads Individual Game Scripts
 * Manages individual game instances with proper loading
 */

class GameManager {
    constructor() {
        this.games = new Map(); // Active game instances
        this.gameScripts = new Map(); // Loaded game scripts
        this.gameData = {
            snake: {
                name: 'Snake Game',
                icon: '🐍',
                script: '/static/js/games/snake.js',
                class: 'SnakeGame'
            },
            tetris: {
                name: 'CyberBlocks',
                icon: '🧩',
                script: '/static/js/games/tetris.js',
                class: 'TetrisGame'
            },
            memory: {
                name: 'Memory Match',
                icon: '🧠',
                script: '/static/js/games/memory.js',
                class: 'MemoryGame'
            },
            dino: {
                name: 'Dino Runner',
                icon: '🦕',
                script: '/static/js/games/dino.js',
                class: 'DinoGame'
            }
        };

        console.log('🎮 Games Manager initialized');
    }

    /**
     * Initialize games system
     */
    async init() {
        try {
            // Set up global game shortcuts
            this.setupGlobalShortcuts();

            console.log('✅ Games system ready');

        } catch (error) {
            console.error('❌ Games initialization failed:', error);
        }
    }

    /**
     * Load game script dynamically
     */
    async loadGameScript(gameType) {
        if (this.gameScripts.has(gameType)) {
            return true; // Already loaded
        }

        const gameInfo = this.gameData[gameType];
        if (!gameInfo) {
            console.error(`Unknown game type: ${gameType}`);
            return false;
        }

        try {
            // Create script element
            const script = document.createElement('script');
            script.src = gameInfo.script;

            // Return promise that resolves when script loads
            return new Promise((resolve, reject) => {
                script.onload = () => {
                    console.log(`✅ Loaded game script: ${gameType}`);
                    this.gameScripts.set(gameType, true);
                    resolve(true);
                };

                script.onerror = () => {
                    console.error(`❌ Failed to load game script: ${gameType}`);
                    reject(false);
                };

                document.head.appendChild(script);
            });

        } catch (error) {
            console.error(`Error loading game script ${gameType}:`, error);
            return false;
        }
    }

    /**
     * Initialize a game window
     */
    async initializeGame(appId, gameType) {
        const gameContainer = document.getElementById(`game-content-${appId}`);
        if (!gameContainer) {
            console.error(`Game container not found: ${appId}`);
            return;
        }

        try {
            // Show loading message
            gameContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #ffffff; background: #0a0a0a;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🎮</div>
                    <div style="font-size: 18px; margin-bottom: 10px;">Loading ${this.gameData[gameType]?.name || gameType}...</div>
                    <div style="font-size: 14px; color: #888;">Please wait...</div>
                </div>
            `;

            // Load game script if not already loaded
            const scriptLoaded = await this.loadGameScript(gameType);
            if (!scriptLoaded) {
                this.showGameError(gameContainer, `Failed to load ${gameType} game script`);
                return;
            }

            // Wait a moment for script to be processed
            await this.sleep(100);

            // Check if game class is available
            const gameInfo = this.gameData[gameType];
            const GameClass = window[gameInfo.class];

            if (!GameClass) {
                this.showGameError(gameContainer, `Game class ${gameInfo.class} not found`);
                return;
            }

            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.style.cssText = `
                width: 100%;
                height: 100%;
                background: #000;
                display: block;
                border-radius: 8px;
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            `;

            const ctx = canvas.getContext('2d');

            // Clear container and add canvas
            gameContainer.innerHTML = '';
            gameContainer.appendChild(canvas);

            // Initialize game
            const game = new GameClass(canvas, ctx);
            this.games.set(appId, game);

            console.log(`🎮 ${gameType} game initialized: ${appId}`);

        } catch (error) {
            console.error(`Error initializing game ${gameType}:`, error);
            this.showGameError(gameContainer, `Failed to initialize ${gameType}: ${error.message}`);
        }
    }

    /**
     * Show game error message
     */
    showGameError(container, message) {
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #ff4444; background: #0a0a0a; text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
                <div style="font-size: 18px; margin-bottom: 10px;">Game Error</div>
                <div style="font-size: 14px; color: #888; max-width: 300px;">${message}</div>
                <button onclick="window.location.reload()" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: #ff4444;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                ">Reload Page</button>
            </div>
        `;
    }

    /**
     * Close a game
     */
    closeGame(appId) {
        const game = this.games.get(appId);
        if (game && typeof game.destroy === 'function') {
            game.destroy();
        }
        this.games.delete(appId);
        console.log(`🎮 Game closed: ${appId}`);
    }

    /**
     * Pause all games
     */
    pauseAll() {
        this.games.forEach(game => {
            if (typeof game.pause === 'function') {
                game.pause();
            } else if (game.gameRunning !== undefined) {
                game.gameRunning = false;
            }
        });
    }

    /**
     * Resume all games
     */
    resumeAll() {
        this.games.forEach(game => {
            if (typeof game.resume === 'function') {
                game.resume();
            } else if (typeof game.startGame === 'function') {
                game.startGame();
            }
        });
    }

    /**
     * Get available games list
     */
    getAvailableGames() {
        return Object.entries(this.gameData).map(([key, data]) => ({
            id: key,
            name: data.name,
            icon: data.icon
        }));
    }

    /**
     * Setup global shortcuts
     */
    setupGlobalShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Alt+G - Open games menu
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'g') {
                e.preventDefault();
                this.showGamesMenu();
            }
        });
    }

    /**
     * Show games menu
     */
    showGamesMenu() {
        const games = this.getAvailableGames();

        let menuHTML = `
            <div class="games-menu" style="text-align: center; padding: 20px;">
                <h3 style="margin-bottom: 20px; color: #00d9ff;">🎮 Choose a Game</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; max-width: 400px;">
        `;

        games.forEach(game => {
            menuHTML += `
                <div class="game-option" 
                     onclick="window.pixelPusher.modules.windows.open('${game.id}'); document.querySelector('.modal').remove();"
                     style="
                        padding: 20px;
                        background: linear-gradient(135deg, #1a1a2e, #16213e);
                        border: 2px solid #00d9ff;
                        border-radius: 10px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-align: center;
                     "
                     onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 5px 15px rgba(0,217,255,0.3)';"
                     onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                    <div style="font-size: 32px; margin-bottom: 10px;">${game.icon}</div>
                    <div style="font-weight: bold; color: #ffffff; margin-bottom: 5px;">${game.name}</div>
                    <div style="font-size: 12px; color: #888;">Click to play</div>
                </div>
            `;
        });

        menuHTML += `
                </div>
                <div style="margin-top: 20px; color: #888; font-size: 14px;">
                    Press Ctrl+Alt+G to open this menu anytime
                </div>
            </div>
        `;

        if (window.pixelPusher) {
            window.pixelPusher.showModal('Games Center', menuHTML);
        }
    }

    /**
     * Get game statistics
     */
    getStats() {
        return {
            activeGames: this.games.size,
            loadedScripts: this.gameScripts.size,
            availableGames: Object.keys(this.gameData),
            gameInstances: Array.from(this.games.keys())
        };
    }

    /**
     * Utility function for delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Games handle their own canvas resizing
        console.log('🎮 Games window resized');
    }

    /**
     * Clean up games manager
     */
    destroy() {
        // Destroy all active games
        this.games.forEach((game, appId) => {
            this.closeGame(appId);
        });

        this.games.clear();
        this.gameScripts.clear();

        console.log('🎮 Games Manager destroyed');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameManager;
}

console.log('🎮 Updated Games manager loaded successfully');