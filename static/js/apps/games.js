/**
 * Simple Games Manager - Reliable Script Loading
 * Manages game instances with straightforward script loading
 */

class GameManager {
    constructor() {
        this.games = new Map();
        this.gameInstances = new Map();
        this.gameData = {
            snake: {
                name: 'Snake Game',
                icon: '🐍',
                class: 'SnakeGame'
            },
            memory: {
                name: 'Memory Match',
                icon: '🧠',
                class: 'MemoryGame'
            },
            dino: {
                name: 'Dino Runner',
                icon: '🦕',
                class: 'DinoGame'
            },
            village: {
                name: 'Village Builder',
                icon: '🏘️',
                class: 'VillageBuilderGame'
            }
        };

        console.log('🎮 Games Manager initialized');
    }

    async init() {
        try {
            // Simple initialization - just set up shortcuts
            this.setupGlobalShortcuts();
            console.log('✅ Games system ready');
        } catch (error) {
            console.error('❌ Games initialization failed:', error);
        }
    }

    async initializeGame(appId, gameType) {
        console.log(`🎮 Initializing game: ${gameType} for window: ${appId}`);

        const gameContainer = document.getElementById(`game-content-${appId}`);
        if (!gameContainer) {
            console.error(`❌ Game container not found: game-content-${appId}`);
            this.showGameError(null, `Game container not found for ${appId}`);
            return;
        }

        try {
            // Show loading state
            gameContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #ffffff; background: #0a0a0a;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🎮</div>
                    <div style="font-size: 18px; margin-bottom: 10px;">Loading ${this.gameData[gameType]?.name || gameType}...</div>
                    <div style="font-size: 14px; color: #888;">Initializing game engine...</div>
                </div>
            `;

            // Wait for DOM to update
            await new Promise(resolve => setTimeout(resolve, 100));

            const gameInfo = this.gameData[gameType];
            if (!gameInfo) {
                throw new Error(`Unknown game type: ${gameType}`);
            }

            // Get the game class - if it doesn't exist, the games are already loaded by the HTML template
            let GameClass = window[gameInfo.class];

            if (!GameClass) {
                // Try to find it in different locations
                GameClass = this.findGameClass(gameInfo.class);
            }

            if (!GameClass) {
                throw new Error(`Game class ${gameInfo.class} not found. Make sure game scripts are loaded.`);
            }

            // Create canvas with proper sizing
            const canvas = document.createElement('canvas');
            canvas.id = `game-canvas-${appId}`;
            canvas.style.cssText = `
                width: 100%;
                height: 100%;
                background: #000;
                display: block;
                border-radius: 8px;
                image-rendering: pixelated;
                image-rendering: -moz-crisp-edges;
                image-rendering: crisp-edges;
            `;

            // Clear container and add canvas
            gameContainer.innerHTML = '';
            gameContainer.appendChild(canvas);

            // Get 2D context
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Failed to get 2D context from canvas');
            }

            // Set canvas size after it's added to DOM
            const rect = gameContainer.getBoundingClientRect();
            canvas.width = Math.max(400, rect.width - 20);
            canvas.height = Math.max(300, rect.height - 20);

            console.log(`📐 Canvas created: ${canvas.width}x${canvas.height}`);

            // Initialize game
            const game = new GameClass(canvas, ctx);

            // Store game instance
            this.gameInstances.set(appId, game);
            this.games.set(appId, { type: gameType, instance: game });

            console.log(`✅ ${gameType} game initialized successfully for window ${appId}`);

            // Track game start
            if (window.pixelPusher?.modules?.state) {
                window.pixelPusher.modules.state.incrementMetric('gamesPlayed');
            }

        } catch (error) {
            console.error(`❌ Error initializing game ${gameType}:`, error);
            this.showGameError(gameContainer, `Failed to initialize ${gameType}: ${error.message}`);

            if (window.pixelPusher?.showNotification) {
                window.pixelPusher.showNotification(
                    `Failed to load ${this.gameData[gameType]?.name || gameType}`,
                    'error'
                );
            }
        }
    }

    findGameClass(className) {
        // Try different locations where the class might be
        const locations = [
            window[className],
            window.games?.[className],
            this[className]
        ];

        for (const location of locations) {
            if (location && typeof location === 'function') {
                return location;
            }
        }

        return null;
    }

    showGameError(container, message) {
        const errorHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #ff4444; background: #0a0a0a; text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
                <div style="font-size: 18px; margin-bottom: 10px;">Game Error</div>
                <div style="font-size: 14px; color: #888; max-width: 300px; margin-bottom: 20px;">${message}</div>
                <div style="margin-top: 20px; font-size: 12px; color: #666;">
                    <div><strong>Available Game Classes:</strong></div>
                    <div style="font-family: monospace; margin-top: 5px;">
                        ${this.getAvailableClasses().join(', ') || 'None found'}
                    </div>
                </div>
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

        if (container) {
            container.innerHTML = errorHTML;
        }
    }

    getAvailableClasses() {
        const classes = [];
        Object.values(this.gameData).forEach(game => {
            if (window[game.class]) {
                classes.push(game.class);
            }
        });
        return classes;
    }

    closeGame(appId) {
        console.log(`🎮 Closing game for window: ${appId}`);

        const game = this.gameInstances.get(appId);
        if (game) {
            if (typeof game.destroy === 'function') {
                try {
                    game.destroy();
                } catch (error) {
                    console.error(`Error destroying game instance:`, error);
                }
            }

            if (game.gameRunning !== undefined) {
                game.gameRunning = false;
            }

            this.gameInstances.delete(appId);
        }

        this.games.delete(appId);
        console.log(`✅ Game closed: ${appId}`);
    }

    pauseAll() {
        console.log('⏸️ Pausing all games');
        this.gameInstances.forEach((game, appId) => {
            try {
                if (typeof game.pause === 'function') {
                    game.pause();
                } else if (game.gameRunning !== undefined) {
                    game.gameRunning = false;
                }
            } catch (error) {
                console.error(`Error pausing game ${appId}:`, error);
            }
        });
    }

    resumeAll() {
        console.log('▶️ Resuming all games');
        this.gameInstances.forEach((game, appId) => {
            try {
                if (typeof game.resume === 'function') {
                    game.resume();
                } else if (typeof game.startGame === 'function' && !game.gameOver) {
                    game.startGame();
                }
            } catch (error) {
                console.error(`Error resuming game ${appId}:`, error);
            }
        });
    }

    getAvailableGames() {
        return Object.entries(this.gameData).map(([key, data]) => ({
            id: key,
            name: data.name,
            icon: data.icon,
            available: !!window[data.class],
            className: data.class
        }));
    }

    setupGlobalShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'g') {
                e.preventDefault();
                this.showGamesMenu();
            }
        });
    }

    showGamesMenu() {
        const games = this.getAvailableGames();

        let menuHTML = `
            <div class="games-menu" style="text-align: center; padding: 20px;">
                <h3 style="margin-bottom: 20px; color: #00d9ff;">🎮 Choose a Game</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; max-width: 500px; margin: 0 auto;">
        `;

        games.forEach(game => {
            const isAvailable = game.available;
            const availability = isAvailable ? '' : 'opacity: 0.5; cursor: not-allowed;';
            const onClick = isAvailable ?
                `onclick="window.pixelPusher.modules.windows.open('${game.id}'); document.querySelector('.modal').remove();"` :
                `onclick="alert('${game.name} is not available\\n\\nClass ${game.className} not found.\\nMake sure game scripts are loaded.')"`;

            menuHTML += `
                <div class="game-option" 
                     ${onClick}
                     style="
                        padding: 20px;
                        background: linear-gradient(135deg, #1a1a2e, #16213e);
                        border: 2px solid ${isAvailable ? '#00d9ff' : '#666'};
                        border-radius: 10px;
                        cursor: ${isAvailable ? 'pointer' : 'not-allowed'};
                        transition: all 0.3s ease;
                        text-align: center;
                        ${availability}
                     "
                     onmouseover="${isAvailable ? "this.style.transform='scale(1.05)'; this.style.boxShadow='0 5px 15px rgba(0,217,255,0.3)';" : ""}"
                     onmouseout="${isAvailable ? "this.style.transform='scale(1)'; this.style.boxShadow='none';" : ""}">
                    <div style="font-size: 32px; margin-bottom: 10px;">${game.icon}</div>
                    <div style="font-weight: bold; color: #ffffff; margin-bottom: 5px;">${game.name}</div>
                    <div style="font-size: 12px; color: ${isAvailable ? '#888' : '#f44'};">
                        ${isAvailable ? 'Click to play' : 'Not available'}
                    </div>
                    <div style="font-size: 10px; color: #666; margin-top: 4px;">
                        ${game.className} ${isAvailable ? '✅' : '❌'}
                    </div>
                </div>
            `;
        });

        menuHTML += `
                </div>
                <div style="margin-top: 20px; color: #888; font-size: 14px;">
                    Press Ctrl+Alt+G to open this menu anytime
                </div>
                <div style="margin-top: 10px; font-size: 12px; color: #666;">
                    Available: ${games.filter(g => g.available).length}/${games.length} games
                </div>
            </div>
        `;

        if (window.pixelPusher) {
            window.pixelPusher.showModal('Games Center', menuHTML);
        }
    }

    getStats() {
        const availableGames = this.getAvailableGames();
        return {
            totalGames: Object.keys(this.gameData).length,
            availableGames: availableGames.filter(g => g.available).length,
            unavailableGames: availableGames.filter(g => !g.available).map(g => g.name),
            activeGames: this.gameInstances.size,
            gameInstances: Array.from(this.games.entries()).map(([id, data]) => ({
                windowId: id,
                gameType: data.type
            })),
            availableClasses: this.getAvailableClasses()
        };
    }

    runDiagnostics() {
        console.log('🔍 Running Game System Diagnostics...');
        console.log('===================================');

        const stats = this.getStats();
        console.log('📊 Game Statistics:', stats);

        console.log('\n🎮 Game Class Availability:');
        Object.entries(this.gameData).forEach(([type, info]) => {
            const available = !!window[info.class];
            console.log(`   ${info.icon} ${info.name} (${info.class}): ${available ? '✅ Available' : '❌ Not Found'}`);

            if (available) {
                console.log(`      Type: ${typeof window[info.class]}`);
                console.log(`      Constructor: ${window[info.class].name}`);
            }
        });

        console.log('\n🪟 Active Game Instances:');
        if (this.gameInstances.size === 0) {
            console.log('   No active games');
        } else {
            this.gameInstances.forEach((game, windowId) => {
                console.log(`   Window ${windowId}:`, game.constructor.name);
            });
        }

        console.log('\n🌐 Global Window Objects:');
        console.log('   Available game classes in window object:');
        Object.values(this.gameData).forEach(game => {
            const available = window[game.class];
            console.log(`   - ${game.class}: ${available ? '✅ Found' : '❌ Missing'}`);
        });

        console.log('===================================');
        return stats;
    }

    destroy() {
        this.gameInstances.forEach((game, appId) => {
            this.closeGame(appId);
        });

        this.games.clear();
        this.gameInstances.clear();

        console.log('🎮 Games Manager destroyed');
    }
}

// Debug utilities
window.GameManagerDiagnostics = () => {
    if (window.pixelPusher?.modules?.games) {
        return window.pixelPusher.modules.games.runDiagnostics();
    } else {
        console.error('Game manager not initialized');
    }
};
window.GameManager = GameManager;
// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameManager;
}

console.log('🎮 Simple Games manager loaded successfully');