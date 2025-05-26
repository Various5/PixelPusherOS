/**
 * Pixel Pusher OS - Complete Arcade Games Manager
 * Four fully implemented games with modern graphics and effects
 */

class GameManager {
    constructor() {
        this.games = new Map();
        this.gameEngines = {};
        this.soundEnabled = true;
        this.particles = [];
        this.highScores = {
            snake: 0,
            dino: 0,
            memory: 0,
            clicker: 0
        };

        console.log('🎮 Complete Arcade Games Manager initialized');
    }

    async init() {
        try {
            this.initializeGameEngines();
            this.loadHighScores();
            this.setupGlobalShortcuts();
            this.initializeAudio();
            console.log('✅ All games system ready');
        } catch (error) {
            console.error('❌ Games initialization failed:', error);
        }
    }

    initializeGameEngines() {
        // SNAKE GAME - Classic snake with modern graphics
        this.gameEngines.snake = class SnakeGame {
            constructor(canvas, ctx, gameManager) {
                this.canvas = canvas;
                this.ctx = ctx;
                this.gameManager = gameManager;
                this.width = canvas.width = 600;
                this.height = canvas.height = 500;

                this.gameState = 'menu';
                this.score = 0;
                this.snake = [{ x: 10, y: 10 }];
                this.food = { x: 15, y: 15 };
                this.direction = { x: 0, y: 0 };
                this.gridSize = 20;

                this.setupControls();
                this.start();
            }

            setupControls() {
                document.addEventListener('keydown', (e) => {
                    if (this.gameState !== 'playing') return;

                    switch (e.key) {
                        case 'ArrowUp':
                            if (this.direction.y === 0) this.direction = { x: 0, y: -1 };
                            break;
                        case 'ArrowDown':
                            if (this.direction.y === 0) this.direction = { x: 0, y: 1 };
                            break;
                        case 'ArrowLeft':
                            if (this.direction.x === 0) this.direction = { x: -1, y: 0 };
                            break;
                        case 'ArrowRight':
                            if (this.direction.x === 0) this.direction = { x: 1, y: 0 };
                            break;
                    }
                });
            }

            start() {
                this.gameLoop = this.gameLoop.bind(this);
                this.lastTime = 0;
                requestAnimationFrame(this.gameLoop);
            }

            gameLoop(currentTime) {
                if (currentTime - this.lastTime >= 150) {
                    this.update();
                    this.render();
                    this.lastTime = currentTime;
                }
                if (this.gameState !== 'stopped') {
                    requestAnimationFrame(this.gameLoop);
                }
            }

            update() {
                if (this.gameState !== 'playing') return;

                const head = { x: this.snake[0].x + this.direction.x, y: this.snake[0].y + this.direction.y };

                // Wall collision
                if (head.x < 0 || head.x >= this.width / this.gridSize ||
                    head.y < 0 || head.y >= this.height / this.gridSize) {
                    this.gameOver();
                    return;
                }

                // Self collision
                if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
                    this.gameOver();
                    return;
                }

                this.snake.unshift(head);

                // Food collision
                if (head.x === this.food.x && head.y === this.food.y) {
                    this.score += 10;
                    this.generateFood();
                } else {
                    this.snake.pop();
                }
            }

            generateFood() {
                this.food = {
                    x: Math.floor(Math.random() * (this.width / this.gridSize)),
                    y: Math.floor(Math.random() * (this.height / this.gridSize))
                };

                // Make sure food doesn't spawn on snake
                if (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y)) {
                    this.generateFood();
                }
            }

            render() {
                // Clear canvas with dark background
                this.ctx.fillStyle = '#1a1a1a';
                this.ctx.fillRect(0, 0, this.width, this.height);

                if (this.gameState === 'menu') {
                    this.renderMenu();
                } else if (this.gameState === 'playing') {
                    this.renderGame();
                } else if (this.gameState === 'gameover') {
                    this.renderGameOver();
                }
            }

            renderMenu() {
                this.ctx.fillStyle = '#00ff00';
                this.ctx.font = 'bold 32px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('🐍 SNAKE GAME', this.width / 2, this.height / 2 - 50);

                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '18px Arial';
                this.ctx.fillText('Click to Start', this.width / 2, this.height / 2 + 20);
                this.ctx.fillText('Use arrow keys to move', this.width / 2, this.height / 2 + 50);
            }

            renderGame() {
                // Draw snake
                this.ctx.fillStyle = '#00ff00';
                this.snake.forEach((segment, index) => {
                    const brightness = index === 0 ? 1 : 0.7 - (index * 0.05);
                    this.ctx.fillStyle = `rgba(0, 255, 0, ${Math.max(brightness, 0.3)})`;
                    this.ctx.fillRect(
                        segment.x * this.gridSize + 1,
                        segment.y * this.gridSize + 1,
                        this.gridSize - 2,
                        this.gridSize - 2
                    );
                });

                // Draw food
                this.ctx.fillStyle = '#ff4444';
                this.ctx.fillRect(
                    this.food.x * this.gridSize + 1,
                    this.food.y * this.gridSize + 1,
                    this.gridSize - 2,
                    this.gridSize - 2
                );

                // Draw score
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(`Score: ${this.score}`, 10, 30);
            }

            renderGameOver() {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                this.ctx.fillRect(0, 0, this.width, this.height);

                this.ctx.fillStyle = '#ff4444';
                this.ctx.font = 'bold 36px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50);

                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '20px Arial';
                this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2);
                this.ctx.fillText('Click to restart', this.width / 2, this.height / 2 + 40);
            }

            handleClick() {
                if (this.gameState === 'menu' || this.gameState === 'gameover') {
                    this.reset();
                    this.gameState = 'playing';
                }
            }

            reset() {
                this.score = 0;
                this.snake = [{ x: 10, y: 10 }];
                this.direction = { x: 0, y: 0 };
                this.generateFood();
            }

            gameOver() {
                this.gameState = 'gameover';
                this.gameManager.updateHighScore('snake', this.score);
            }

            destroy() {
                this.gameState = 'stopped';
            }
        };

        // DINO RUNNER - Endless runner with obstacles
        this.gameEngines.dino = class DinoRunner {
            constructor(canvas, ctx, gameManager) {
                this.canvas = canvas;
                this.ctx = ctx;
                this.gameManager = gameManager;
                this.width = canvas.width = 700;
                this.height = canvas.height = 400;

                this.gameState = 'menu';
                this.score = 0;
                this.speed = 3;
                this.groundY = this.height - 50;

                this.dino = {
                    x: 50,
                    y: this.groundY - 40,
                    width: 30,
                    height: 40,
                    jumping: false,
                    jumpSpeed: 0,
                    gravity: 0.8
                };

                this.obstacles = [];
                this.clouds = [];
                this.gameSpeed = 2;

                this.initializeClouds();
                this.setupControls();
                this.start();
            }

            initializeClouds() {
                for (let i = 0; i < 5; i++) {
                    this.clouds.push({
                        x: Math.random() * this.width,
                        y: Math.random() * 100 + 20,
                        speed: Math.random() * 0.5 + 0.2
                    });
                }
            }

            setupControls() {
                const jump = () => {
                    if (this.gameState === 'playing' && !this.dino.jumping) {
                        this.dino.jumping = true;
                        this.dino.jumpSpeed = -15;
                    }
                };

                document.addEventListener('keydown', (e) => {
                    if (e.code === 'Space') {
                        e.preventDefault();
                        jump();
                    }
                });

                this.canvas.addEventListener('click', jump);
            }

            start() {
                this.gameLoop = this.gameLoop.bind(this);
                requestAnimationFrame(this.gameLoop);
            }

            gameLoop() {
                this.update();
                this.render();
                if (this.gameState !== 'stopped') {
                    requestAnimationFrame(this.gameLoop);
                }
            }

            update() {
                if (this.gameState !== 'playing') return;

                this.score += 0.1;
                this.gameSpeed = 2 + Math.floor(this.score / 100) * 0.5;

                // Update dino
                if (this.dino.jumping) {
                    this.dino.jumpSpeed += this.dino.gravity;
                    this.dino.y += this.dino.jumpSpeed;

                    if (this.dino.y >= this.groundY - this.dino.height) {
                        this.dino.y = this.groundY - this.dino.height;
                        this.dino.jumping = false;
                        this.dino.jumpSpeed = 0;
                    }
                }

                // Update obstacles
                this.obstacles.forEach((obstacle, index) => {
                    obstacle.x -= this.gameSpeed;

                    // Remove off-screen obstacles
                    if (obstacle.x + obstacle.width < 0) {
                        this.obstacles.splice(index, 1);
                    }

                    // Collision detection
                    if (this.dino.x < obstacle.x + obstacle.width &&
                        this.dino.x + this.dino.width > obstacle.x &&
                        this.dino.y < obstacle.y + obstacle.height &&
                        this.dino.y + this.dino.height > obstacle.y) {
                        this.gameOver();
                    }
                });

                // Spawn obstacles
                if (Math.random() < 0.005 + this.score / 10000) {
                    this.spawnObstacle();
                }

                // Update clouds
                this.clouds.forEach(cloud => {
                    cloud.x -= cloud.speed;
                    if (cloud.x < -50) {
                        cloud.x = this.width + 50;
                    }
                });
            }

            spawnObstacle() {
                const types = ['cactus', 'rock'];
                const type = types[Math.floor(Math.random() * types.length)];

                const obstacle = {
                    x: this.width,
                    y: this.groundY - 30,
                    width: 20,
                    height: 30,
                    type: type
                };

                this.obstacles.push(obstacle);
            }

            render() {
                // Sky gradient
                const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(1, '#FFF8DC');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(0, 0, this.width, this.height);

                if (this.gameState === 'menu') {
                    this.renderMenu();
                } else if (this.gameState === 'playing') {
                    this.renderGame();
                } else if (this.gameState === 'gameover') {
                    this.renderGameOver();
                }
            }

            renderMenu() {
                this.ctx.fillStyle = '#8B4513';
                this.ctx.font = 'bold 32px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('🦕 DINO RUNNER', this.width / 2, this.height / 2 - 50);

                this.ctx.fillStyle = '#654321';
                this.ctx.font = '18px Arial';
                this.ctx.fillText('Click or press SPACE to jump', this.width / 2, this.height / 2 + 20);
                this.ctx.fillText('Click to start!', this.width / 2, this.height / 2 + 50);
            }

            renderGame() {
                // Draw clouds
                this.ctx.fillStyle = '#FFFFFF';
                this.clouds.forEach(cloud => {
                    this.ctx.beginPath();
                    this.ctx.arc(cloud.x, cloud.y, 15, 0, Math.PI * 2);
                    this.ctx.arc(cloud.x + 15, cloud.y, 20, 0, Math.PI * 2);
                    this.ctx.arc(cloud.x + 30, cloud.y, 15, 0, Math.PI * 2);
                    this.ctx.fill();
                });

                // Draw ground
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);

                // Draw dino
                this.ctx.fillStyle = '#32CD32';
                this.ctx.fillRect(this.dino.x, this.dino.y, this.dino.width, this.dino.height);

                // Draw obstacles
                this.obstacles.forEach(obstacle => {
                    this.ctx.fillStyle = obstacle.type === 'cactus' ? '#228B22' : '#696969';
                    this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                });

                // Draw score
                this.ctx.fillStyle = '#000000';
                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(`Score: ${Math.floor(this.score)}`, 10, 30);
            }

            renderGameOver() {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, 0, this.width, this.height);

                this.ctx.fillStyle = '#FF4500';
                this.ctx.font = 'bold 36px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50);

                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '20px Arial';
                this.ctx.fillText(`Final Score: ${Math.floor(this.score)}`, this.width / 2, this.height / 2);
                this.ctx.fillText('Click to restart', this.width / 2, this.height / 2 + 40);
            }

            handleClick() {
                if (this.gameState === 'menu' || this.gameState === 'gameover') {
                    this.reset();
                    this.gameState = 'playing';
                }
            }

            reset() {
                this.score = 0;
                this.gameSpeed = 2;
                this.dino.y = this.groundY - this.dino.height;
                this.dino.jumping = false;
                this.dino.jumpSpeed = 0;
                this.obstacles = [];
            }

            gameOver() {
                this.gameState = 'gameover';
                this.gameManager.updateHighScore('dino', Math.floor(this.score));
            }

            destroy() {
                this.gameState = 'stopped';
            }
        };

        // MEMORY MATCH - Card matching game
        this.gameEngines.memory = class MemoryMatch {
            constructor(canvas, ctx, gameManager) {
                this.canvas = canvas;
                this.ctx = ctx;
                this.gameManager = gameManager;
                this.width = canvas.width = 500;
                this.height = canvas.height = 600;

                this.gameState = 'menu';
                this.cards = [];
                this.flippedCards = [];
                this.matchedPairs = 0;
                this.moves = 0;
                this.timeElapsed = 0;
                this.startTime = null;

                this.cardWidth = 60;
                this.cardHeight = 80;
                this.padding = 10;
                this.cols = 4;
                this.rows = 4;

                this.symbols = ['🍎', '🍌', '🍇', '🍊', '🍓', '🥝', '🍑', '🥥'];

                this.setupControls();
                this.initializeCards();
                this.start();
            }

            setupControls() {
                this.canvas.addEventListener('click', (e) => {
                    if (this.gameState === 'playing') {
                        this.handleCardClick(e);
                    }
                });
            }

            initializeCards() {
                this.cards = [];
                const symbols = [...this.symbols, ...this.symbols]; // Duplicate for pairs

                // Shuffle symbols
                for (let i = symbols.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
                }

                // Create cards
                for (let row = 0; row < this.rows; row++) {
                    for (let col = 0; col < this.cols; col++) {
                        const index = row * this.cols + col;
                        this.cards.push({
                            symbol: symbols[index],
                            x: col * (this.cardWidth + this.padding) + this.padding + 50,
                            y: row * (this.cardHeight + this.padding) + this.padding + 100,
                            flipped: false,
                            matched: false,
                            index: index
                        });
                    }
                }
            }

            start() {
                this.gameLoop = this.gameLoop.bind(this);
                requestAnimationFrame(this.gameLoop);
            }

            gameLoop() {
                this.update();
                this.render();
                if (this.gameState !== 'stopped') {
                    requestAnimationFrame(this.gameLoop);
                }
            }

            update() {
                if (this.gameState === 'playing' && this.startTime) {
                    this.timeElapsed = (Date.now() - this.startTime) / 1000;
                }

                // Check for win condition
                if (this.matchedPairs === this.symbols.length && this.gameState === 'playing') {
                    this.gameWon();
                }
            }

            handleCardClick(e) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const clickedCard = this.cards.find(card =>
                    x >= card.x && x <= card.x + this.cardWidth &&
                    y >= card.y && y <= card.y + this.cardHeight &&
                    !card.flipped && !card.matched
                );

                if (clickedCard && this.flippedCards.length < 2) {
                    clickedCard.flipped = true;
                    this.flippedCards.push(clickedCard);

                    if (this.flippedCards.length === 2) {
                        this.moves++;
                        setTimeout(() => {
                            this.checkMatch();
                        }, 1000);
                    }
                }
            }

            checkMatch() {
                const [card1, card2] = this.flippedCards;

                if (card1.symbol === card2.symbol) {
                    card1.matched = true;
                    card2.matched = true;
                    this.matchedPairs++;
                } else {
                    card1.flipped = false;
                    card2.flipped = false;
                }

                this.flippedCards = [];
            }

            render() {
                // Background gradient
                const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
                gradient.addColorStop(0, '#4a90e2');
                gradient.addColorStop(1, '#7b68ee');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(0, 0, this.width, this.height);

                if (this.gameState === 'menu') {
                    this.renderMenu();
                } else if (this.gameState === 'playing') {
                    this.renderGame();
                } else if (this.gameState === 'won') {
                    this.renderWon();
                }
            }

            renderMenu() {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = 'bold 28px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('🧠 MEMORY MATCH', this.width / 2, this.height / 2 - 50);

                this.ctx.font = '16px Arial';
                this.ctx.fillText('Find matching pairs of cards', this.width / 2, this.height / 2);
                this.ctx.fillText('Click to start!', this.width / 2, this.height / 2 + 30);
            }

            renderGame() {
                // Draw cards
                this.cards.forEach(card => {
                    // Card background
                    this.ctx.fillStyle = card.matched ? '#90EE90' : '#FFFFFF';
                    this.ctx.fillRect(card.x, card.y, this.cardWidth, this.cardHeight);

                    // Card border
                    this.ctx.strokeStyle = '#333333';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(card.x, card.y, this.cardWidth, this.cardHeight);

                    if (card.flipped || card.matched) {
                        // Show symbol
                        this.ctx.font = '30px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillStyle = '#000000';
                        this.ctx.fillText(
                            card.symbol,
                            card.x + this.cardWidth / 2,
                            card.y + this.cardHeight / 2 + 10
                        );
                    } else {
                        // Show card back
                        this.ctx.fillStyle = '#4169E1';
                        this.ctx.fillRect(card.x + 5, card.y + 5, this.cardWidth - 10, this.cardHeight - 10);

                        this.ctx.fillStyle = '#FFFFFF';
                        this.ctx.font = '20px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText('?', card.x + this.cardWidth / 2, card.y + this.cardHeight / 2 + 5);
                    }
                });

                // Draw UI
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '18px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(`Moves: ${this.moves}`, 20, 40);
                this.ctx.fillText(`Pairs: ${this.matchedPairs}/${this.symbols.length}`, 20, 65);
                this.ctx.fillText(`Time: ${Math.floor(this.timeElapsed)}s`, 300, 40);
            }

            renderWon() {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                this.ctx.fillRect(0, 0, this.width, this.height);

                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = 'bold 36px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('🎉 YOU WON! 🎉', this.width / 2, this.height / 2 - 50);

                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '18px Arial';
                this.ctx.fillText(`Moves: ${this.moves}`, this.width / 2, this.height / 2);
                this.ctx.fillText(`Time: ${Math.floor(this.timeElapsed)}s`, this.width / 2, this.height / 2 + 25);
                this.ctx.fillText('Click to play again', this.width / 2, this.height / 2 + 60);
            }

            handleClick() {
                if (this.gameState === 'menu' || this.gameState === 'won') {
                    this.reset();
                    this.gameState = 'playing';
                    this.startTime = Date.now();
                }
            }

            reset() {
                this.matchedPairs = 0;
                this.moves = 0;
                this.timeElapsed = 0;
                this.startTime = null;
                this.flippedCards = [];
                this.initializeCards();
            }

            gameWon() {
                this.gameState = 'won';
                const score = Math.max(0, 1000 - this.moves * 10 - Math.floor(this.timeElapsed));
                this.gameManager.updateHighScore('memory', score);
            }

            destroy() {
                this.gameState = 'stopped';
            }
        };

        // VILLAGE CLICKER - Resource management game
        this.gameEngines.clicker = class VillageClicker {
            constructor(canvas, ctx, gameManager) {
                this.canvas = canvas;
                this.ctx = ctx;
                this.gameManager = gameManager;
                this.width = canvas.width = 800;
                this.height = canvas.height = 600;

                this.gameState = 'menu';
                this.resources = {
                    gold: 100,
                    population: 0,
                    happiness: 50,
                    food: 0
                };

                this.buildings = {
                    houses: 0,
                    farms: 0,
                    mines: 0,
                    taverns: 0
                };

                this.costs = {
                    houses: 50,
                    farms: 75,
                    mines: 100,
                    taverns: 150
                };

                this.buttons = [
                    { name: 'houses', label: '🏠 House', x: 50, y: 200, width: 150, height: 60 },
                    { name: 'farms', label: '🌾 Farm', x: 220, y: 200, width: 150, height: 60 },
                    { name: 'mines', label: '⛏️ Mine', x: 390, y: 200, width: 150, height: 60 },
                    { name: 'taverns', label: '🍺 Tavern', x: 560, y: 200, width: 150, height: 60 }
                ];

                this.setupControls();
                this.start();
                this.gameLoop();
            }

            setupControls() {
                this.canvas.addEventListener('click', (e) => {
                    if (this.gameState === 'playing') {
                        this.handleClick(e);
                    }
                });
            }

            start() {
                this.lastUpdate = Date.now();
                this.gameLoop = this.gameLoop.bind(this);
                requestAnimationFrame(this.gameLoop);
            }

            gameLoop() {
                const now = Date.now();
                const deltaTime = now - this.lastUpdate;

                if (deltaTime >= 1000) { // Update every second
                    this.update();
                    this.lastUpdate = now;
                }

                this.render();
                if (this.gameState !== 'stopped') {
                    requestAnimationFrame(this.gameLoop);
                }
            }

            update() {
                if (this.gameState !== 'playing') return;

                // Generate resources
                this.resources.gold += this.buildings.mines * 5;
                this.resources.food += this.buildings.farms * 3;
                this.resources.population = this.buildings.houses * 4;

                // Calculate happiness
                this.resources.happiness = 50;
                if (this.resources.population > 0) {
                    const foodPerPerson = this.resources.food / this.resources.population;
                    this.resources.happiness += Math.min(foodPerPerson * 10, 30);
                    this.resources.happiness += this.buildings.taverns * 5;
                    this.resources.happiness = Math.min(100, Math.max(0, this.resources.happiness));
                }

                // Consume food
                this.resources.food = Math.max(0, this.resources.food - this.resources.population);

                // Increase costs
                Object.keys(this.costs).forEach(building => {
                    this.costs[building] = Math.floor(50 * Math.pow(1.15, this.buildings[building]));
                });
            }

            handleClick(e) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                this.buttons.forEach(button => {
                    if (x >= button.x && x <= button.x + button.width &&
                        y >= button.y && y <= button.y + button.height) {
                        this.buyBuilding(button.name);
                    }
                });
            }

            buyBuilding(type) {
                if (this.resources.gold >= this.costs[type]) {
                    this.resources.gold -= this.costs[type];
                    this.buildings[type]++;
                }
            }

            render() {
                // Sky gradient
                const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(0.7, '#98FB98');
                gradient.addColorStop(1, '#228B22');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(0, 0, this.width, this.height);

                if (this.gameState === 'menu') {
                    this.renderMenu();
                } else if (this.gameState === 'playing') {
                    this.renderGame();
                }
            }

            renderMenu() {
                this.ctx.fillStyle = '#8B4513';
                this.ctx.font = 'bold 32px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('🏘️ VILLAGE BUILDER', this.width / 2, this.height / 2 - 50);

                this.ctx.fillStyle = '#654321';
                this.ctx.font = '18px Arial';
                this.ctx.fillText('Build and manage your village!', this.width / 2, this.height / 2 + 20);
                this.ctx.fillText('Click to start building!', this.width / 2, this.height / 2 + 50);
            }

            renderGame() {
                // Draw ground
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(0, this.height - 100, this.width, 100);

                // Draw resources panel
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                this.ctx.fillRect(10, 10, this.width - 20, 80);
                this.ctx.strokeStyle = '#333333';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(10, 10, this.width - 20, 80);

                // Resource text
                this.ctx.fillStyle = '#000000';
                this.ctx.font = '16px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(`💰 Gold: ${this.resources.gold}`, 20, 35);
                this.ctx.fillText(`👥 Population: ${this.resources.population}`, 200, 35);
                this.ctx.fillText(`😊 Happiness: ${Math.floor(this.resources.happiness)}%`, 400, 35);
                this.ctx.fillText(`🍞 Food: ${this.resources.food}`, 600, 35);

                // Building counts
                this.ctx.fillText(`🏠 Houses: ${this.buildings.houses}`, 20, 65);
                this.ctx.fillText(`🌾 Farms: ${this.buildings.farms}`, 150, 65);
                this.ctx.fillText(`⛏️ Mines: ${this.buildings.mines}`, 280, 65);
                this.ctx.fillText(`🍺 Taverns: ${this.buildings.taverns}`, 410, 65);

                // Draw building buttons
                this.buttons.forEach(button => {
                    const canAfford = this.resources.gold >= this.costs[button.name];

                    // Button background
                    this.ctx.fillStyle = canAfford ? '#90EE90' : '#FFB6C1';
                    this.ctx.fillRect(button.x, button.y, button.width, button.height);

                    // Button border
                    this.ctx.strokeStyle = '#333333';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(button.x, button.y, button.width, button.height);

                    // Button text
                    this.ctx.fillStyle = '#000000';
                    this.ctx.font = '14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(
                        button.label,
                        button.x + button.width / 2,
                        button.y + 25
                    );
                    this.ctx.fillText(
                        `Cost: ${this.costs[button.name]}`,
                        button.x + button.width / 2,
                        button.y + 45
                    );
                });

                // Draw village buildings
                this.drawVillage();

                // Draw score
                const score = this.resources.gold + this.buildings.houses * 50 +
                             this.buildings.farms * 75 + this.buildings.mines * 100;
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'right';
                this.ctx.fillText(`Score: ${score}`, this.width - 20, 130);
            }

            drawVillage() {
                const groundY = this.height - 100;
                let x = 50;

                // Draw houses
                for (let i = 0; i < this.buildings.houses; i++) {
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(x, groundY - 40, 30, 40);
                    this.ctx.fillStyle = '#FF0000';
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, groundY - 40);
                    this.ctx.lineTo(x + 15, groundY - 55);
                    this.ctx.lineTo(x + 30, groundY - 40);
                    this.ctx.fill();
                    x += 35;
                    if (x > 700) break;
                }

                // Draw farms
                x = 50;
                for (let i = 0; i < this.buildings.farms; i++) {
                    this.ctx.fillStyle = '#FFFF00';
                    this.ctx.fillRect(x, groundY - 20, 25, 20);
                    x += 30;
                    if (x > 700) break;
                }
            }

            handleClick() {
                if (this.gameState === 'menu') {
                    this.gameState = 'playing';
                }
            }

            destroy() {
                this.gameState = 'stopped';
            }
        };
    }

    initializeGame(appId, gameType) {
        const gameContainer = document.getElementById(`game-content-${appId}`);
        if (!gameContainer) {
            console.error(`Game container not found: ${appId}`);
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.style.cssText = `
            width: 100%;
            height: 100%;
            background: #000;
            display: block;
            border-radius: 8px;
        `;

        const ctx = canvas.getContext('2d');
        gameContainer.innerHTML = '';
        gameContainer.appendChild(canvas);

        const GameEngine = this.gameEngines[gameType];
        if (GameEngine) {
            const game = new GameEngine(canvas, ctx, this);
            this.games.set(appId, game);

            canvas.addEventListener('click', () => {
                game.handleClick();
            });

            console.log(`🎮 ${gameType} game initialized: ${appId}`);
        } else {
            console.error(`Unknown game type: ${gameType}`);
        }
    }

    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 Audio system initialized');
        } catch (error) {
            console.warn('Audio not supported:', error);
            this.soundEnabled = false;
        }
    }

    playSound(frequency, duration, type = 'sine') {
        if (!this.soundEnabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    updateHighScore(gameType, score) {
        if (score > this.highScores[gameType]) {
            this.highScores[gameType] = score;
            this.saveHighScores();

            if (window.pixelPusher) {
                window.pixelPusher.showNotification(
                    `🏆 New High Score in ${this.getGameName(gameType)}: ${score}!`,
                    'success',
                    8000
                );
            }

            return true;
        }
        return false;
    }

    getGameName(gameType) {
        const names = {
            'snake': 'Snake Game',
            'dino': 'Dino Runner',
            'memory': 'Memory Match',
            'clicker': 'Village Builder'
        };
        return names[gameType] || gameType;
    }

    loadHighScores() {
        try {
            const saved = localStorage.getItem('pixelpusher_game_scores');
            if (saved) {
                this.highScores = { ...this.highScores, ...JSON.parse(saved) };
                console.log('🏆 High scores loaded');
            }
        } catch (error) {
            console.warn('Failed to load high scores:', error);
        }
    }

    saveHighScores() {
        try {
            localStorage.setItem('pixelpusher_game_scores', JSON.stringify(this.highScores));
        } catch (error) {
            console.warn('Failed to save high scores:', error);
        }
    }

    pauseAll() {
        this.games.forEach(game => {
            if (typeof game.pause === 'function') {
                game.pause();
            }
        });
    }

    resumeAll() {
        this.games.forEach(game => {
            if (typeof game.resume === 'function') {
                game.resume();
            }
        });
    }

    setupGlobalShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'g') {
                e.preventDefault();
                if (window.pixelPusher) {
                    window.pixelPusher.showGamesMenu();
                }
            }
        });
    }

    getStats() {
        return {
            activeGames: this.games.size,
            highScores: this.highScores,
            soundEnabled: this.soundEnabled,
            availableGames: Object.keys(this.gameEngines)
        };
    }

    handleResize() {
        console.log('🎮 Games window resized');
    }

    destroy() {
        this.games.forEach(game => {
            if (typeof game.destroy === 'function') {
                game.destroy();
            }
        });

        this.games.clear();
        this.saveHighScores();

        console.log('🎮 Complete Games Manager destroyed');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameManager;
}

console.log('🎮 Complete Arcade Games manager with all 4 games loaded successfully');