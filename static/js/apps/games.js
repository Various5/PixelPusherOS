/**
 * Fixed Games Manager with Enhanced Error Handling
 * Manages game instances with comprehensive diagnostics
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

        console.log('🎮 Games Manager initialized with diagnostics');
    }

    async init() {
        try {
            // Pre-load game classes to verify they exist
            await this.preloadGameClasses();
            this.setupGlobalShortcuts();
            console.log('✅ Games system ready');
        } catch (error) {
            console.error('❌ Games initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    async preloadGameClasses() {
        console.log('🔍 Pre-loading game classes...');

        for (const [gameType, gameInfo] of Object.entries(this.gameData)) {
            const className = gameInfo.class;

            if (!window[className]) {
                console.warn(`⚠️ Game class ${className} not found for ${gameType}`);

                // Try to dynamically load the game script
                try {
                    await this.loadGameScript(gameType);
                } catch (error) {
                    console.error(`❌ Failed to load ${gameType} script:`, error);
                }
            } else {
                console.log(`✅ Game class ${className} loaded for ${gameType}`);
            }
        }
    }

    async loadGameScript(gameType) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `/static/js/games/${gameType}.js`;
            script.onload = () => {
                console.log(`✅ Dynamically loaded ${gameType}.js`);
                resolve();
            };
            script.onerror = () => {
                reject(new Error(`Failed to load ${gameType}.js`));
            };
            document.head.appendChild(script);
        });
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
            // Show loading with diagnostics
            gameContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #ffffff; background: #0a0a0a;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🎮</div>
                    <div style="font-size: 18px; margin-bottom: 10px;">Loading ${this.gameData[gameType]?.name || gameType}...</div>
                    <div style="font-size: 14px; color: #888;">Initializing game engine...</div>
                    <div style="font-size: 12px; color: #666; margin-top: 10px;">Window ID: ${appId}</div>
                </div>
            `;

            // Wait for DOM to update
            await new Promise(resolve => setTimeout(resolve, 100));

            const gameInfo = this.gameData[gameType];
            if (!gameInfo) {
                throw new Error(`Unknown game type: ${gameType}`);
            }

            const GameClass = window[gameInfo.class];
            if (!GameClass) {
                // Try one more time to load it
                await this.loadGameScript(gameType);
                const GameClassRetry = window[gameInfo.class];
                if (!GameClassRetry) {
                    throw new Error(`Game class ${gameInfo.class} not found after retry`);
                }
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
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
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

            // Set canvas internal size (this is important!)
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;

            console.log(`📐 Canvas created: ${canvas.width}x${canvas.height}`);

            // Initialize game with error handling
            const FinalGameClass = window[gameInfo.class];
            const game = new FinalGameClass(canvas, ctx);

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

            // Report error to user
            if (window.pixelPusher?.showNotification) {
                window.pixelPusher.showNotification(
                    `Failed to load ${this.gameData[gameType]?.name || gameType}`,
                    'error'
                );
            }
        }
    }

    showGameError(container, message) {
        const errorContainer = container || document.createElement('div');

        errorContainer.innerHTML = `
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
                <div style="margin-top: 20px; font-size: 12px; color: #666;">
                    <div>Troubleshooting tips:</div>
                    <ul style="text-align: left; margin-top: 10px;">
                        <li>Check browser console for errors</li>
                        <li>Ensure JavaScript is enabled</li>
                        <li>Try refreshing the page</li>
                        <li>Clear browser cache</li>
                    </ul>
                </div>
            </div>
        `;

        if (container) {
            container.appendChild(errorContainer);
        }
    }

    closeGame(appId) {
        console.log(`🎮 Closing game for window: ${appId}`);

        const game = this.gameInstances.get(appId);
        if (game) {
            // Call destroy method if it exists
            if (typeof game.destroy === 'function') {
                try {
                    game.destroy();
                } catch (error) {
                    console.error(`Error destroying game instance:`, error);
                }
            }

            // Clear game state
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
            available: !!window[data.class]
        }));
    }

    setupGlobalShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Alt+G - Open games menu
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
            const availability = game.available ? '' : 'opacity: 0.5; cursor: not-allowed;';
            const onClick = game.available ?
                `onclick="window.pixelPusher.modules.windows.open('${game.id}'); document.querySelector('.modal').remove();"` :
                `onclick="alert('${game.name} is not available')"`;

            menuHTML += `
                <div class="game-option" 
                     ${onClick}
                     style="
                        padding: 20px;
                        background: linear-gradient(135deg, #1a1a2e, #16213e);
                        border: 2px solid ${game.available ? '#00d9ff' : '#666'};
                        border-radius: 10px;
                        cursor: ${game.available ? 'pointer' : 'not-allowed'};
                        transition: all 0.3s ease;
                        text-align: center;
                        ${availability}
                     "
                     onmouseover="${game.available ? "this.style.transform='scale(1.05)'; this.style.boxShadow='0 5px 15px rgba(0,217,255,0.3)';" : ""}"
                     onmouseout="${game.available ? "this.style.transform='scale(1)'; this.style.boxShadow='none';" : ""}">
                    <div style="font-size: 32px; margin-bottom: 10px;">${game.icon}</div>
                    <div style="font-weight: bold; color: #ffffff; margin-bottom: 5px;">${game.name}</div>
                    <div style="font-size: 12px; color: ${game.available ? '#888' : '#f44'};">
                        ${game.available ? 'Click to play' : 'Not available'}
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
                    ${games.filter(g => !g.available).length > 0 ? 
                        'Some games are not available. Check console for errors.' : 
                        'All games loaded successfully!'}
                </div>
            </div>
        `;

        if (window.pixelPusher) {
            window.pixelPusher.showModal('Games Center', menuHTML);
        }
    }

    handleInitializationError(error) {
        console.error('🎮 Game system initialization failed:', error);

        // Create a warning notification
        if (window.pixelPusher?.showNotification) {
            window.pixelPusher.showNotification(
                'Some games may not be available. Check console for details.',
                'warning',
                10000
            );
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
            }))
        };
    }

    // Diagnostic method for debugging
    runDiagnostics() {
        console.log('🔍 Running Game System Diagnostics...');
        console.log('===================================');

        const stats = this.getStats();
        console.log('📊 Game Statistics:', stats);

        console.log('\n🎮 Game Class Availability:');
        Object.entries(this.gameData).forEach(([type, info]) => {
            const available = !!window[info.class];
            console.log(`   ${info.icon} ${info.name} (${info.class}): ${available ? '✅ Available' : '❌ Not Found'}`);
        });

        console.log('\n🪟 Active Game Instances:');
        if (this.gameInstances.size === 0) {
            console.log('   No active games');
        } else {
            this.gameInstances.forEach((game, windowId) => {
                console.log(`   Window ${windowId}:`, game.constructor.name);
            });
        }

        console.log('\n📁 Game Script URLs:');
        Object.keys(this.gameData).forEach(type => {
            console.log(`   ${type}: /static/js/games/${type}.js`);
        });

        console.log('===================================');
        return stats;
    }

    destroy() {
        // Clean up all game instances
        this.gameInstances.forEach((game, appId) => {
            this.closeGame(appId);
        });

        this.games.clear();
        this.gameInstances.clear();
        console.log('🎮 Games Manager destroyed');
    }
}

// Make diagnostics available globally for debugging
window.GameManagerDiagnostics = () => {
    if (window.pixelPusher?.modules?.games) {
        return window.pixelPusher.modules.games.runDiagnostics();
    } else {
        console.error('Game manager not initialized');
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameManager;
}

console.log('🎮 Fixed Games manager loaded successfully');