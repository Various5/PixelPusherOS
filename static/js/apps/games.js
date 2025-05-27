/**
 * Games Manager with Inline Game Implementations
 * Manages game instances and includes all game code
 */

// First, define all game classes

class SnakeGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gridSize = 20;
        this.tileCount = 20;
        this.tileSize = 20;

        // Game state
        this.snake = [];
        this.dx = 0;
        this.dy = 0;
        this.foodX = 0;
        this.foodY = 0;
        this.score = 0;
        this.gameRunning = false;
        this.gameOver = false;

        // Initialize
        this.init();
    }

    init() {
        // Set canvas size
        this.canvas.width = 400;
        this.canvas.height = 400;

        // Initialize snake
        this.snake = [
            {x: 10, y: 10}
        ];

        // Place initial food
        this.generateFood();

        // Set up controls
        this.setupControls();

        // Start game
        this.startGame();
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning) return;

            switch(e.key) {
                case 'ArrowUp':
                    if (this.dy === 0) {
                        this.dx = 0;
                        this.dy = -1;
                    }
                    break;
                case 'ArrowDown':
                    if (this.dy === 0) {
                        this.dx = 0;
                        this.dy = 1;
                    }
                    break;
                case 'ArrowLeft':
                    if (this.dx === 0) {
                        this.dx = -1;
                        this.dy = 0;
                    }
                    break;
                case 'ArrowRight':
                    if (this.dx === 0) {
                        this.dx = 1;
                        this.dy = 0;
                    }
                    break;
            }
        });
    }

    startGame() {
        this.gameRunning = true;
        this.gameLoop();
    }

    gameLoop() {
        if (!this.gameRunning) return;

        this.update();
        this.draw();

        setTimeout(() => {
            this.gameLoop();
        }, 100);
    }

    update() {
        if (this.gameOver) return;

        // Move snake
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};

        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.endGame();
            return;
        }

        // Check self collision
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.endGame();
                return;
            }
        }

        this.snake.unshift(head);

        // Check food collision
        if (head.x === this.foodX && head.y === this.foodY) {
            this.score += 10;
            this.generateFood();
        } else {
            this.snake.pop();
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = '#111';
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.tileSize, 0);
            this.ctx.lineTo(i * this.tileSize, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.tileSize);
            this.ctx.lineTo(this.canvas.width, i * this.tileSize);
            this.ctx.stroke();
        }

        // Draw snake
        this.ctx.fillStyle = '#00ff00';
        for (let segment of this.snake) {
            this.ctx.fillRect(segment.x * this.tileSize, segment.y * this.tileSize, this.tileSize - 2, this.tileSize - 2);
        }

        // Draw food
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(this.foodX * this.tileSize, this.foodY * this.tileSize, this.tileSize - 2, this.tileSize - 2);

        // Draw score
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Score: ' + this.score, 10, 25);

        // Draw game over
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 30);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Score: ' + this.score, this.canvas.width / 2, this.canvas.height / 2 + 10);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Press Space to restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
    }

    generateFood() {
        do {
            this.foodX = Math.floor(Math.random() * this.tileCount);
            this.foodY = Math.floor(Math.random() * this.tileCount);
        } while (this.isSnakePosition(this.foodX, this.foodY));
    }

    isSnakePosition(x, y) {
        for (let segment of this.snake) {
            if (segment.x === x && segment.y === y) {
                return true;
            }
        }
        return false;
    }

    endGame() {
        this.gameOver = true;
        this.gameRunning = false;

        // Listen for restart
        const restartHandler = (e) => {
            if (e.key === ' ') {
                document.removeEventListener('keydown', restartHandler);
                this.restart();
            }
        };
        document.addEventListener('keydown', restartHandler);
    }

    restart() {
        this.snake = [{x: 10, y: 10}];
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameOver = false;
        this.generateFood();
        this.startGame();
    }

    destroy() {
        this.gameRunning = false;
    }
}

class DinoGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // Game settings
        this.gravity = 0.6;
        this.jumpPower = -12;
        this.groundY = 300;
        this.speed = 5;

        // Dino properties
        this.dino = {
            x: 50,
            y: this.groundY,
            width: 40,
            height: 40,
            velocityY: 0,
            jumping: false
        };

        // Obstacles
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.obstacleInterval = 100;

        // Game state
        this.score = 0;
        this.highScore = 0;
        this.gameRunning = false;
        this.gameOver = false;

        this.init();
    }

    init() {
        // Set canvas size
        this.canvas.width = 700;
        this.canvas.height = 350;

        // Set up controls
        this.setupControls();

        // Start game
        this.startGame();
    }

    setupControls() {
        const jumpHandler = (e) => {
            if (!this.gameRunning) return;

            if (e.key === ' ' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.jump();
            }
        };

        document.addEventListener('keydown', jumpHandler);

        // Touch controls for mobile
        this.canvas.addEventListener('click', () => {
            if (this.gameRunning && !this.gameOver) {
                this.jump();
            } else if (this.gameOver) {
                this.restart();
            }
        });
    }

    jump() {
        if (!this.dino.jumping) {
            this.dino.velocityY = this.jumpPower;
            this.dino.jumping = true;
        }
    }

    startGame() {
        this.gameRunning = true;
        this.gameLoop();
    }

    gameLoop() {
        if (!this.gameRunning) return;

        this.update();
        this.draw();

        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        if (this.gameOver) return;

        // Update score
        this.score++;

        // Update dino
        this.dino.velocityY += this.gravity;
        this.dino.y += this.dino.velocityY;

        // Ground collision
        if (this.dino.y > this.groundY) {
            this.dino.y = this.groundY;
            this.dino.velocityY = 0;
            this.dino.jumping = false;
        }

        // Update obstacles
        this.obstacleTimer++;
        if (this.obstacleTimer > this.obstacleInterval) {
            this.spawnObstacle();
            this.obstacleTimer = 0;
            this.obstacleInterval = 80 + Math.random() * 120;
        }

        // Move obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= this.speed;

            // Remove off-screen obstacles
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
            }

            // Check collision
            if (this.checkCollision(this.dino, obstacle)) {
                this.endGame();
            }
        }

        // Increase speed over time
        if (this.score % 500 === 0) {
            this.speed += 0.5;
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#f7f7f7';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw ground
        this.ctx.fillStyle = '#555';
        this.ctx.fillRect(0, this.groundY + 40, this.canvas.width, 10);

        // Draw dino
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(this.dino.x, this.dino.y, this.dino.width, this.dino.height);

        // Draw dino eye
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(this.dino.x + 30, this.dino.y + 5, 5, 5);

        // Draw obstacles
        this.ctx.fillStyle = '#d44';
        for (let obstacle of this.obstacles) {
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }

        // Draw score
        this.ctx.fillStyle = '#333';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Score: ' + Math.floor(this.score / 10), 10, 30);

        if (this.highScore > 0) {
            this.ctx.fillText('High: ' + Math.floor(this.highScore / 10), 10, 55);
        }

        // Draw game over
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 40);
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Score: ' + Math.floor(this.score / 10), this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Click or press Space to restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
            this.ctx.textAlign = 'left';
        }
    }

    spawnObstacle() {
        const obstacle = {
            x: this.canvas.width,
            y: this.groundY - 20,
            width: 20,
            height: 60
        };

        // Random obstacle types
        if (Math.random() < 0.3) {
            // Small cactus
            obstacle.height = 40;
            obstacle.y = this.groundY;
        } else if (Math.random() < 0.5) {
            // Flying obstacle
            obstacle.y = this.groundY - 60;
            obstacle.height = 30;
        }

        this.obstacles.push(obstacle);
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    endGame() {
        this.gameOver = true;
        this.gameRunning = false;

        if (this.score > this.highScore) {
            this.highScore = this.score;
        }

        // Listen for restart
        const restartHandler = (e) => {
            if (e.key === ' ') {
                document.removeEventListener('keydown', restartHandler);
                this.restart();
            }
        };
        document.addEventListener('keydown', restartHandler);
    }

    restart() {
        this.dino.y = this.groundY;
        this.dino.velocityY = 0;
        this.dino.jumping = false;
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.score = 0;
        this.speed = 5;
        this.gameOver = false;
        this.startGame();
    }

    destroy() {
        this.gameRunning = false;
    }
}

class MemoryGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // Game settings
        this.rows = 4;
        this.cols = 4;
        this.cardWidth = 80;
        this.cardHeight = 80;
        this.cardGap = 10;
        this.cardPadding = 40;

        // Game state
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.gameRunning = false;
        this.canFlip = true;

        // Card emojis
        this.emojis = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎬', '🎵', '🎸'];

        this.init();
    }

    init() {
        // Set canvas size
        this.canvas.width = this.cols * (this.cardWidth + this.cardGap) + this.cardPadding * 2 - this.cardGap;
        this.canvas.height = this.rows * (this.cardHeight + this.cardGap) + this.cardPadding * 2 - this.cardGap + 60;

        // Create cards
        this.createCards();

        // Set up controls
        this.setupControls();

        // Start game
        this.startGame();
    }

    createCards() {
        this.cards = [];
        const totalPairs = (this.rows * this.cols) / 2;

        // Create pairs
        for (let i = 0; i < totalPairs; i++) {
            const emoji = this.emojis[i % this.emojis.length];
            // Add two cards with same emoji
            this.cards.push({ emoji: emoji, flipped: false, matched: false });
            this.cards.push({ emoji: emoji, flipped: false, matched: false });
        }

        // Shuffle cards
        this.shuffleCards();

        // Assign positions
        let index = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (index < this.cards.length) {
                    this.cards[index].x = this.cardPadding + col * (this.cardWidth + this.cardGap);
                    this.cards[index].y = this.cardPadding + row * (this.cardHeight + this.cardGap) + 60;
                    this.cards[index].index = index;
                    index++;
                }
            }
        }
    }

    shuffleCards() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    setupControls() {
        this.canvas.addEventListener('click', (e) => {
            if (!this.gameRunning || !this.canFlip) return;

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.handleClick(x, y);
        });
    }

    handleClick(x, y) {
        // Find clicked card
        for (let card of this.cards) {
            if (x >= card.x && x <= card.x + this.cardWidth &&
                y >= card.y && y <= card.y + this.cardHeight &&
                !card.flipped && !card.matched) {

                this.flipCard(card);
                break;
            }
        }
    }

    flipCard(card) {
        card.flipped = true;
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.canFlip = false;
            this.moves++;

            // Check for match
            setTimeout(() => {
                this.checkMatch();
            }, 1000);
        }

        this.draw();
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;

        if (card1.emoji === card2.emoji) {
            // Match found
            card1.matched = true;
            card2.matched = true;
            this.matchedPairs++;

            // Check win condition
            if (this.matchedPairs === this.cards.length / 2) {
                this.endGame();
            }
        } else {
            // No match - flip cards back
            card1.flipped = false;
            card2.flipped = false;
        }

        this.flippedCards = [];
        this.canFlip = true;
        this.draw();
    }

    startGame() {
        this.gameRunning = true;
        this.draw();
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw header
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Memory Match', 20, 35);
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Moves: ${this.moves}`, this.canvas.width - 100, 35);

        // Draw cards
        for (let card of this.cards) {
            this.drawCard(card);
        }

        // Draw win message
        if (this.matchedPairs === this.cards.length / 2) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('You Win!', this.canvas.width / 2, this.canvas.height / 2 - 30);
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Moves: ${this.moves}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Click to play again', this.canvas.width / 2, this.canvas.height / 2 + 50);
            this.ctx.textAlign = 'left';
        }
    }

    drawCard(card) {
        // Card background
        if (card.matched) {
            this.ctx.fillStyle = '#27ae60';
        } else if (card.flipped) {
            this.ctx.fillStyle = '#3498db';
        } else {
            this.ctx.fillStyle = '#34495e';
        }

        this.ctx.fillRect(card.x, card.y, this.cardWidth, this.cardHeight);

        // Card border
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(card.x, card.y, this.cardWidth, this.cardHeight);

        // Card content
        if (card.flipped || card.matched) {
            this.ctx.font = '32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(card.emoji, card.x + this.cardWidth / 2, card.y + this.cardHeight / 2);
        } else {
            // Draw back of card
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('?', card.x + this.cardWidth / 2, card.y + this.cardHeight / 2);
        }

        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'alphabetic';
    }

    endGame() {
        this.gameRunning = false;

        // Listen for restart
        this.canvas.addEventListener('click', () => {
            this.restart();
        }, { once: true });
    }

    restart() {
        this.matchedPairs = 0;
        this.moves = 0;
        this.flippedCards = [];
        this.canFlip = true;
        this.createCards();
        this.startGame();
    }

    destroy() {
        this.gameRunning = false;
    }
}

// Make game classes globally available
window.SnakeGame = SnakeGame;
window.DinoGame = DinoGame;
window.MemoryGame = MemoryGame;

// Main GameManager class
class GameManager {
    constructor() {
        this.games = new Map();
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
            }
        };

        console.log('🎮 Games Manager initialized');
    }

    async init() {
        try {
            this.setupGlobalShortcuts();
            console.log('✅ Games system ready');
        } catch (error) {
            console.error('❌ Games initialization failed:', error);
        }
    }

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

            // Wait a moment for DOM to update
            await this.sleep(100);

            const gameInfo = this.gameData[gameType];
            const GameClass = window[gameInfo.class];

            if (!GameClass) {
                this.showGameError(gameContainer, `Game class ${gameInfo.class} not found`);
                return;
            }

            // Create canvas
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

    closeGame(appId) {
        const game = this.games.get(appId);
        if (game && typeof game.destroy === 'function') {
            game.destroy();
        }
        this.games.delete(appId);
        console.log(`🎮 Game closed: ${appId}`);
    }

    pauseAll() {
        this.games.forEach(game => {
            if (typeof game.pause === 'function') {
                game.pause();
            } else if (game.gameRunning !== undefined) {
                game.gameRunning = false;
            }
        });
    }

    resumeAll() {
        this.games.forEach(game => {
            if (typeof game.resume === 'function') {
                game.resume();
            } else if (typeof game.startGame === 'function') {
                game.startGame();
            }
        });
    }

    getAvailableGames() {
        return Object.entries(this.gameData).map(([key, data]) => ({
            id: key,
            name: data.name,
            icon: data.icon
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
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; max-width: 500px; margin: 0 auto;">
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

    getStats() {
        return {
            activeGames: this.games.size,
            availableGames: Object.keys(this.gameData),
            gameInstances: Array.from(this.games.keys())
        };
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    handleResize() {
        console.log('🎮 Games window resized');
    }

    destroy() {
        this.games.forEach((game, appId) => {
            this.closeGame(appId);
        });

        this.games.clear();
        console.log('🎮 Games Manager destroyed');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameManager;
}

console.log('🎮 Games manager with inline games loaded successfully');