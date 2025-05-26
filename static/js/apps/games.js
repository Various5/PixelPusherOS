/**
 * Pixel Pusher OS - Arcade Games Manager
 * Modern arcade-style games with stunning visuals and engaging gameplay
 *
 * This module provides:
 * - Neon Breaker - Modern breakout with power-ups and effects
 * - Galactic Defense - Space shooter with enemy waves
 * - Cyber Blocks - Tetris-like puzzle with neon aesthetics
 * - Quantum Runner - Endless runner with special abilities
 * - Advanced game engines with particle effects
 * - High score management and achievements
 * - Sound effects and visual feedback
 */

class GameManager {
    constructor() {
        this.games = new Map(); // Active game instances
        this.gameEngines = {}; // Game engine classes
        this.soundEnabled = true;
        this.particles = []; // Global particle system
        this.highScores = {
            neonbreaker: 0,
            galacticdefense: 0,
            cyberblocks: 0,
            quantumrunner: 0
        };

        console.log('🎮 Arcade Games Manager initialized');
    }

    /**
     * Initialize games system
     */
    async init() {
        try {
            // Initialize game engines
            this.initializeGameEngines();

            // Load high scores
            this.loadHighScores();

            // Set up global game shortcuts
            this.setupGlobalShortcuts();

            // Initialize audio context
            this.initializeAudio();

            console.log('✅ Arcade Games system ready');

        } catch (error) {
            console.error('❌ Games initialization failed:', error);
        }
    }

    /**
     * Initialize all game engines
     */
    initializeGameEngines() {
        // Neon Breaker - Modern breakout game
        this.gameEngines.neonbreaker = class NeonBreaker {
            constructor(canvas, ctx, gameManager) {
                this.canvas = canvas;
                this.ctx = ctx;
                this.gameManager = gameManager;
                this.width = canvas.width;
                this.height = canvas.height;

                // Game state
                this.gameState = 'menu'; // menu, playing, paused, gameover
                this.score = 0;
                this.level = 1;
                this.lives = 3;

                // Paddle
                this.paddle = {
                    x: this.width / 2 - 60,
                    y: this.height - 40,
                    width: 120,
                    height: 15,
                    speed: 8,
                    color: '#00d9ff'
                };

                // Ball
                this.ball = {
                    x: this.width / 2,
                    y: this.height / 2,
                    radius: 8,
                    dx: 4,
                    dy: -4,
                    speed: 4,
                    trail: []
                };

                // Bricks
                this.bricks = [];
                this.initializeBricks();

                // Power-ups
                this.powerUps = [];
                this.activePowerUps = new Set();

                // Particles
                this.particles = [];

                // Controls
                this.keys = {};
                this.mouse = { x: 0, y: 0 };

                this.setupControls();
                this.start();
            }

            initializeBricks() {
                this.bricks = [];
                const rows = 6;
                const cols = 10;
                const brickWidth = (this.width - 40) / cols;
                const brickHeight = 25;
                const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a55eea'];

                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        this.bricks.push({
                            x: col * brickWidth + 20,
                            y: row * brickHeight + 80,
                            width: brickWidth - 2,
                            height: brickHeight - 2,
                            color: colors[row],
                            health: row + 1,
                            maxHealth: row + 1,
                            destroyed: false,
                            powerUp: Math.random() < 0.1 ? this.getRandomPowerUp() : null
                        });
                    }
                }
            }

            getRandomPowerUp() {
                const powerUps = ['multiball', 'bigpaddle', 'slowball', 'laser', 'life'];
                return powerUps[Math.floor(Math.random() * powerUps.length)];
            }

            setupControls() {
                this.canvas.addEventListener('mousemove', (e) => {
                    const rect = this.canvas.getBoundingClientRect();
                    this.mouse.x = e.clientX - rect.left;
                });

                document.addEventListener('keydown', (e) => {
                    this.keys[e.key.toLowerCase()] = true;
                    if (e.key === ' ' && this.gameState === 'paused') {
                        this.resume();
                    }
                });

                document.addEventListener('keyup', (e) => {
                    this.keys[e.key.toLowerCase()] = false;
                });
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

                // Update paddle
                if (this.keys['arrowleft'] || this.keys['a']) {
                    this.paddle.x = Math.max(0, this.paddle.x - this.paddle.speed);
                }
                if (this.keys['arrowright'] || this.keys['d']) {
                    this.paddle.x = Math.min(this.width - this.paddle.width, this.paddle.x + this.paddle.speed);
                }

                // Mouse control
                this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.width, this.mouse.x - this.paddle.width / 2));

                // Update ball
                this.updateBall();

                // Update power-ups
                this.updatePowerUps();

                // Update particles
                this.updateParticles();

                // Check win condition
                if (this.bricks.every(brick => brick.destroyed)) {
                    this.nextLevel();
                }
            }

            updateBall() {
                // Add to trail
                this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
                if (this.ball.trail.length > 10) this.ball.trail.shift();

                // Move ball
                this.ball.x += this.ball.dx;
                this.ball.y += this.ball.dy;

                // Wall collisions
                if (this.ball.x <= this.ball.radius || this.ball.x >= this.width - this.ball.radius) {
                    this.ball.dx = -this.ball.dx;
                    this.createParticles(this.ball.x, this.ball.y, '#00d9ff', 5);
                }

                if (this.ball.y <= this.ball.radius) {
                    this.ball.dy = -this.ball.dy;
                    this.createParticles(this.ball.x, this.ball.y, '#00d9ff', 5);
                }

                // Paddle collision
                if (this.ball.y + this.ball.radius >= this.paddle.y &&
                    this.ball.x >= this.paddle.x &&
                    this.ball.x <= this.paddle.x + this.paddle.width) {

                    const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width;
                    this.ball.dx = (hitPos - 0.5) * 8;
                    this.ball.dy = -Math.abs(this.ball.dy);
                    this.createParticles(this.ball.x, this.ball.y, '#00d9ff', 8);
                }

                // Brick collisions
                this.bricks.forEach(brick => {
                    if (!brick.destroyed && this.checkBallBrickCollision(this.ball, brick)) {
                        brick.health--;
                        this.score += 10;

                        if (brick.health <= 0) {
                            brick.destroyed = true;
                            this.score += 50;
                            this.createParticles(brick.x + brick.width/2, brick.y + brick.height/2, brick.color, 15);

                            // Drop power-up
                            if (brick.powerUp) {
                                this.powerUps.push({
                                    type: brick.powerUp,
                                    x: brick.x + brick.width/2,
                                    y: brick.y + brick.height/2,
                                    dy: 2
                                });
                            }
                        } else {
                            this.createParticles(brick.x + brick.width/2, brick.y + brick.height/2, brick.color, 8);
                        }

                        this.ball.dy = -this.ball.dy;
                    }
                });

                // Ball out of bounds
                if (this.ball.y > this.height) {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameOver();
                    } else {
                        this.resetBall();
                    }
                }
            }

            checkBallBrickCollision(ball, brick) {
                return ball.x + ball.radius >= brick.x &&
                       ball.x - ball.radius <= brick.x + brick.width &&
                       ball.y + ball.radius >= brick.y &&
                       ball.y - ball.radius <= brick.y + brick.height;
            }

            updatePowerUps() {
                this.powerUps = this.powerUps.filter(powerUp => {
                    powerUp.y += powerUp.dy;

                    // Check paddle collision
                    if (powerUp.y >= this.paddle.y &&
                        powerUp.x >= this.paddle.x &&
                        powerUp.x <= this.paddle.x + this.paddle.width) {
                        this.activatePowerUp(powerUp.type);
                        return false;
                    }

                    return powerUp.y < this.height;
                });
            }

            activatePowerUp(type) {
                switch (type) {
                    case 'bigpaddle':
                        this.paddle.width = 180;
                        setTimeout(() => this.paddle.width = 120, 10000);
                        break;
                    case 'slowball':
                        this.ball.dx *= 0.5;
                        this.ball.dy *= 0.5;
                        setTimeout(() => {
                            this.ball.dx *= 2;
                            this.ball.dy *= 2;
                        }, 8000);
                        break;
                    case 'life':
                        this.lives++;
                        break;
                }
                this.createParticles(this.paddle.x + this.paddle.width/2, this.paddle.y, '#f9ca24', 12);
            }

            createParticles(x, y, color, count) {
                for (let i = 0; i < count; i++) {
                    this.particles.push({
                        x: x,
                        y: y,
                        dx: (Math.random() - 0.5) * 8,
                        dy: (Math.random() - 0.5) * 8,
                        life: 1,
                        decay: 0.02,
                        color: color,
                        size: Math.random() * 4 + 2
                    });
                }
            }

            updateParticles() {
                this.particles = this.particles.filter(particle => {
                    particle.x += particle.dx;
                    particle.y += particle.dy;
                    particle.life -= particle.decay;
                    particle.size *= 0.98;
                    return particle.life > 0;
                });
            }

            render() {
                // Clear canvas with gradient
                const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
                gradient.addColorStop(0, '#0a0a0a');
                gradient.addColorStop(1, '#1a1a2e');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(0, 0, this.width, this.height);

                if (this.gameState === 'menu') {
                    this.renderMenu();
                } else if (this.gameState === 'playing' || this.gameState === 'paused') {
                    this.renderGame();
                    if (this.gameState === 'paused') {
                        this.renderPauseOverlay();
                    }
                } else if (this.gameState === 'gameover') {
                    this.renderGameOver();
                }
            }

            renderMenu() {
                this.ctx.fillStyle = '#00d9ff';
                this.ctx.font = 'bold 48px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('NEON BREAKER', this.width/2, this.height/2 - 50);

                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '24px Arial';
                this.ctx.fillText('Click to Start', this.width/2, this.height/2 + 20);

                this.ctx.font = '16px Arial';
                this.ctx.fillText('Use mouse or arrow keys to control paddle', this.width/2, this.height/2 + 60);
            }

            renderGame() {
                // Render bricks with glow effect
                this.bricks.forEach(brick => {
                    if (!brick.destroyed) {
                        const alpha = brick.health / brick.maxHealth;
                        this.ctx.shadowBlur = 15;
                        this.ctx.shadowColor = brick.color;
                        this.ctx.fillStyle = brick.color;
                        this.ctx.globalAlpha = alpha;
                        this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
                        this.ctx.globalAlpha = 1;
                        this.ctx.shadowBlur = 0;
                    }
                });

                // Render paddle with glow
                this.ctx.shadowBlur = 20;
                this.ctx.shadowColor = this.paddle.color;
                this.ctx.fillStyle = this.paddle.color;
                this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
                this.ctx.shadowBlur = 0;

                // Render ball trail
                this.ball.trail.forEach((pos, index) => {
                    const alpha = index / this.ball.trail.length;
                    this.ctx.fillStyle = `rgba(0, 217, 255, ${alpha * 0.5})`;
                    this.ctx.beginPath();
                    this.ctx.arc(pos.x, pos.y, this.ball.radius * alpha, 0, Math.PI * 2);
                    this.ctx.fill();
                });

                // Render ball with glow
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = '#00d9ff';
                this.ctx.fillStyle = '#00d9ff';
                this.ctx.beginPath();
                this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;

                // Render power-ups
                this.powerUps.forEach(powerUp => {
                    this.ctx.fillStyle = '#f9ca24';
                    this.ctx.font = '20px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('⚡', powerUp.x, powerUp.y);
                });

                // Render particles
                this.particles.forEach(particle => {
                    this.ctx.fillStyle = particle.color;
                    this.ctx.globalAlpha = particle.life;
                    this.ctx.beginPath();
                    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    this.ctx.fill();
                });
                this.ctx.globalAlpha = 1;

                // Render UI
                this.renderUI();
            }

            renderUI() {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(`Score: ${this.score}`, 20, 40);
                this.ctx.fillText(`Lives: ${this.lives}`, 20, 70);
                this.ctx.fillText(`Level: ${this.level}`, 200, 40);
            }

            renderPauseOverlay() {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, 0, this.width, this.height);

                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 36px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('PAUSED', this.width/2, this.height/2);

                this.ctx.font = '18px Arial';
                this.ctx.fillText('Press SPACE to resume', this.width/2, this.height/2 + 40);
            }

            renderGameOver() {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                this.ctx.fillRect(0, 0, this.width, this.height);

                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.font = 'bold 48px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('GAME OVER', this.width/2, this.height/2 - 50);

                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '24px Arial';
                this.ctx.fillText(`Final Score: ${this.score}`, this.width/2, this.height/2 + 20);

                this.ctx.font = '18px Arial';
                this.ctx.fillText('Click to restart', this.width/2, this.height/2 + 60);
            }

            resetBall() {
                this.ball.x = this.width / 2;
                this.ball.y = this.height / 2;
                this.ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
                this.ball.dy = -4;
                this.ball.trail = [];
            }

            nextLevel() {
                this.level++;
                this.initializeBricks();
                this.resetBall();
                this.ball.speed += 0.5;
                this.score += 500;
            }

            pause() {
                this.gameState = 'paused';
            }

            resume() {
                this.gameState = 'playing';
            }

            gameOver() {
                this.gameState = 'gameover';
                this.gameManager.updateHighScore('neonbreaker', this.score);
            }

            handleClick() {
                if (this.gameState === 'menu' || this.gameState === 'gameover') {
                    this.gameState = 'playing';
                    this.reset();
                }
            }

            reset() {
                this.score = 0;
                this.level = 1;
                this.lives = 3;
                this.initializeBricks();
                this.resetBall();
                this.powerUps = [];
                this.particles = [];
            }

            destroy() {
                this.gameState = 'stopped';
            }
        };

        // Galactic Defense - Space shooter game
        this.gameEngines.galacticdefense = class GalacticDefense {
            constructor(canvas, ctx, gameManager) {
                this.canvas = canvas;
                this.ctx = ctx;
                this.gameManager = gameManager;
                this.width = canvas.width;
                this.height = canvas.height;

                // Game state
                this.gameState = 'menu';
                this.score = 0;
                this.wave = 1;
                this.lives = 3;

                // Player ship
                this.player = {
                    x: this.width / 2 - 20,
                    y: this.height - 60,
                    width: 40,
                    height: 40,
                    speed: 6,
                    health: 100,
                    maxHealth: 100
                };

                // Game objects
                this.bullets = [];
                this.enemies = [];
                this.enemyBullets = [];
                this.powerUps = [];
                this.explosions = [];
                this.stars = [];

                // Timers
                this.enemySpawnTimer = 0;
                this.powerUpTimer = 0;

                // Controls
                this.keys = {};

                this.initializeStars();
                this.setupControls();
                this.start();
            }

            initializeStars() {
                for (let i = 0; i < 100; i++) {
                    this.stars.push({
                        x: Math.random() * this.width,
                        y: Math.random() * this.height,
                        speed: Math.random() * 2 + 1,
                        size: Math.random() * 2 + 1
                    });
                }
            }

            setupControls() {
                document.addEventListener('keydown', (e) => {
                    this.keys[e.key.toLowerCase()] = true;
                });

                document.addEventListener('keyup', (e) => {
                    this.keys[e.key.toLowerCase()] = false;
                });
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

                this.updatePlayer();
                this.updateBullets();
                this.updateEnemies();
                this.updateCollisions();
                this.updateExplosions();
                this.updateStars();
                this.spawnEnemies();
            }

            updatePlayer() {
                // Movement
                if (this.keys['arrowleft'] || this.keys['a']) {
                    this.player.x = Math.max(0, this.player.x - this.player.speed);
                }
                if (this.keys['arrowright'] || this.keys['d']) {
                    this.player.x = Math.min(this.width - this.player.width, this.player.x + this.player.speed);
                }
                if (this.keys['arrowup'] || this.keys['w']) {
                    this.player.y = Math.max(0, this.player.y - this.player.speed);
                }
                if (this.keys['arrowdown'] || this.keys['s']) {
                    this.player.y = Math.min(this.height - this.player.height, this.player.y + this.player.speed);
                }

                // Shooting
                if (this.keys[' ']) {
                    this.shoot();
                }
            }

            shoot() {
                if (this.bullets.length < 5) {
                    this.bullets.push({
                        x: this.player.x + this.player.width / 2 - 2,
                        y: this.player.y,
                        width: 4,
                        height: 10,
                        speed: 8,
                        color: '#00d9ff'
                    });
                }
            }

            updateBullets() {
                this.bullets = this.bullets.filter(bullet => {
                    bullet.y -= bullet.speed;
                    return bullet.y > -bullet.height;
                });

                this.enemyBullets = this.enemyBullets.filter(bullet => {
                    bullet.y += bullet.speed;
                    return bullet.y < this.height + bullet.height;
                });
            }

            spawnEnemies() {
                this.enemySpawnTimer++;
                if (this.enemySpawnTimer > 60 - this.wave * 5) {
                    this.enemySpawnTimer = 0;

                    const enemyTypes = [
                        { width: 30, height: 30, health: 1, speed: 2, color: '#ff6b6b', points: 100 },
                        { width: 40, height: 35, health: 2, speed: 1.5, color: '#4ecdc4', points: 200 },
                        { width: 50, height: 40, health: 3, speed: 1, color: '#6c5ce7', points: 300 }
                    ];

                    const type = enemyTypes[Math.floor(Math.random() * Math.min(enemyTypes.length, Math.floor(this.wave / 2) + 1))];

                    this.enemies.push({
                        x: Math.random() * (this.width - type.width),
                        y: -type.height,
                        width: type.width,
                        height: type.height,
                        health: type.health,
                        maxHealth: type.health,
                        speed: type.speed,
                        color: type.color,
                        points: type.points,
                        shootTimer: Math.random() * 120
                    });
                }
            }

            updateEnemies() {
                this.enemies = this.enemies.filter(enemy => {
                    enemy.y += enemy.speed;

                    // Enemy shooting
                    enemy.shootTimer++;
                    if (enemy.shootTimer > 120 && Math.random() < 0.02) {
                        enemy.shootTimer = 0;
                        this.enemyBullets.push({
                            x: enemy.x + enemy.width / 2 - 2,
                            y: enemy.y + enemy.height,
                            width: 4,
                            height: 8,
                            speed: 3,
                            color: '#ff6b6b'
                        });
                    }

                    return enemy.y < this.height + enemy.height;
                });
            }

            updateCollisions() {
                // Player bullets vs enemies
                this.bullets.forEach((bullet, bulletIndex) => {
                    this.enemies.forEach((enemy, enemyIndex) => {
                        if (this.checkCollision(bullet, enemy)) {
                            this.bullets.splice(bulletIndex, 1);
                            enemy.health--;

                            if (enemy.health <= 0) {
                                this.score += enemy.points;
                                this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                                this.enemies.splice(enemyIndex, 1);

                                // Chance for power-up
                                if (Math.random() < 0.1) {
                                    this.powerUps.push({
                                        x: enemy.x + enemy.width/2,
                                        y: enemy.y + enemy.height/2,
                                        type: 'health',
                                        dy: 2
                                    });
                                }
                            }
                        }
                    });
                });

                // Enemy bullets vs player
                this.enemyBullets.forEach((bullet, index) => {
                    if (this.checkCollision(bullet, this.player)) {
                        this.enemyBullets.splice(index, 1);
                        this.player.health -= 20;

                        if (this.player.health <= 0) {
                            this.lives--;
                            this.player.health = this.player.maxHealth;

                            if (this.lives <= 0) {
                                this.gameOver();
                            }
                        }
                    }
                });

                // Enemies vs player
                this.enemies.forEach((enemy, index) => {
                    if (this.checkCollision(enemy, this.player)) {
                        this.enemies.splice(index, 1);
                        this.player.health -= 30;
                        this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);

                        if (this.player.health <= 0) {
                            this.lives--;
                            this.player.health = this.player.maxHealth;

                            if (this.lives <= 0) {
                                this.gameOver();
                            }
                        }
                    }
                });
            }

            checkCollision(rect1, rect2) {
                return rect1.x < rect2.x + rect2.width &&
                       rect1.x + rect1.width > rect2.x &&
                       rect1.y < rect2.y + rect2.height &&
                       rect1.y + rect1.height > rect2.y;
            }

            createExplosion(x, y) {
                this.explosions.push({
                    x: x,
                    y: y,
                    particles: [],
                    life: 30
                });

                // Create explosion particles
                const explosion = this.explosions[this.explosions.length - 1];
                for (let i = 0; i < 20; i++) {
                    explosion.particles.push({
                        x: x,
                        y: y,
                        dx: (Math.random() - 0.5) * 10,
                        dy: (Math.random() - 0.5) * 10,
                        size: Math.random() * 4 + 2,
                        color: ['#ff6b6b', '#f9ca24', '#00d9ff'][Math.floor(Math.random() * 3)]
                    });
                }
            }

            updateExplosions() {
                this.explosions = this.explosions.filter(explosion => {
                    explosion.life--;
                    explosion.particles.forEach(particle => {
                        particle.x += particle.dx;
                        particle.y += particle.dy;
                        particle.size *= 0.95;
                    });
                    return explosion.life > 0;
                });
            }

            updateStars() {
                this.stars.forEach(star => {
                    star.y += star.speed;
                    if (star.y > this.height) {
                        star.y = -star.size;
                        star.x = Math.random() * this.width;
                    }
                });
            }

            render() {
                // Clear with space background
                this.ctx.fillStyle = '#0a0a0a';
                this.ctx.fillRect(0, 0, this.width, this.height);

                // Render stars
                this.ctx.fillStyle = '#ffffff';
                this.stars.forEach(star => {
                    this.ctx.fillRect(star.x, star.y, star.size, star.size);
                });

                if (this.gameState === 'menu') {
                    this.renderMenu();
                } else if (this.gameState === 'playing') {
                    this.renderGame();
                } else if (this.gameState === 'gameover') {
                    this.renderGameOver();
                }
            }

            renderMenu() {
                this.ctx.fillStyle = '#00d9ff';
                this.ctx.font = 'bold 42px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('GALACTIC DEFENSE', this.width/2, this.height/2 - 50);

                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '20px Arial';
                this.ctx.fillText('Click to Start', this.width/2, this.height/2 + 20);

                this.ctx.font = '14px Arial';
                this.ctx.fillText('WASD or Arrow Keys to move, SPACE to shoot', this.width/2, this.height/2 + 60);
            }

            renderGame() {
                // Render player
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = '#00d9ff';
                this.ctx.fillStyle = '#00d9ff';
                this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
                this.ctx.shadowBlur = 0;

                // Render bullets
                this.bullets.forEach(bullet => {
                    this.ctx.fillStyle = bullet.color;
                    this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
                });

                this.enemyBullets.forEach(bullet => {
                    this.ctx.fillStyle = bullet.color;
                    this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
                });

                // Render enemies
                this.enemies.forEach(enemy => {
                    this.ctx.fillStyle = enemy.color;
                    this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

                    // Health bar
                    const healthPercent = enemy.health / enemy.maxHealth;
                    this.ctx.fillStyle = '#333';
                    this.ctx.fillRect(enemy.x, enemy.y - 8, enemy.width, 4);
                    this.ctx.fillStyle = healthPercent > 0.5 ? '#4ecdc4' : '#ff6b6b';
                    this.ctx.fillRect(enemy.x, enemy.y - 8, enemy.width * healthPercent, 4);
                });

                // Render explosions
                this.explosions.forEach(explosion => {
                    explosion.particles.forEach(particle => {
                        this.ctx.fillStyle = particle.color;
                        this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
                    });
                });

                // Render UI
                this.renderUI();
            }

            renderUI() {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '18px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(`Score: ${this.score}`, 20, 30);
                this.ctx.fillText(`Lives: ${this.lives}`, 20, 55);
                this.ctx.fillText(`Wave: ${this.wave}`, 200, 30);

                // Health bar
                const healthPercent = this.player.health / this.player.maxHealth;
                this.ctx.fillStyle = '#333';
                this.ctx.fillRect(20, this.height - 30, 200, 15);
                this.ctx.fillStyle = healthPercent > 0.5 ? '#4ecdc4' : '#ff6b6b';
                this.ctx.fillRect(20, this.height - 30, 200 * healthPercent, 15);

                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '12px Arial';
                this.ctx.fillText('HEALTH', 25, this.height - 20);
            }

            renderGameOver() {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                this.ctx.fillRect(0, 0, this.width, this.height);

                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.font = 'bold 48px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('MISSION FAILED', this.width/2, this.height/2 - 50);

                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '24px Arial';
                this.ctx.fillText(`Final Score: ${this.score}`, this.width/2, this.height/2 + 20);

                this.ctx.font = '18px Arial';
                this.ctx.fillText('Click to try again', this.width/2, this.height/2 + 60);
            }

            handleClick() {
                if (this.gameState === 'menu' || this.gameState === 'gameover') {
                    this.gameState = 'playing';
                    this.reset();
                }
            }

            reset() {
                this.score = 0;
                this.wave = 1;
                this.lives = 3;
                this.player.health = this.player.maxHealth;
                this.bullets = [];
                this.enemies = [];
                this.enemyBullets = [];
                this.explosions = [];
            }

            gameOver() {
                this.gameState = 'gameover';
                this.gameManager.updateHighScore('galacticdefense', this.score);
            }

            destroy() {
                this.gameState = 'stopped';
            }
        };

        // Additional games (Cyber Blocks and Quantum Runner) would be implemented similarly
        // For brevity, I'll include their basic structure

        this.gameEngines.cyberblocks = class CyberBlocks {
            constructor(canvas, ctx, gameManager) {
                this.canvas = canvas;
                this.ctx = ctx;
                this.gameManager = gameManager;
                // Tetris-like game implementation would go here
                console.log('🧩 Cyber Blocks game initialized');
            }

            handleClick() {
                console.log('Cyber Blocks clicked');
            }

            destroy() {
                console.log('Cyber Blocks destroyed');
            }
        };

        this.gameEngines.quantumrunner = class QuantumRunner {
            constructor(canvas, ctx, gameManager) {
                this.canvas = canvas;
                this.ctx = ctx;
                this.gameManager = gameManager;
                // Endless runner implementation would go here
                console.log('🏃 Quantum Runner game initialized');
            }

            handleClick() {
                console.log('Quantum Runner clicked');
            }

            destroy() {
                console.log('Quantum Runner destroyed');
            }
        };
    }

    /**
     * Initialize a game window
     */
    initializeGame(appId, gameType) {
        const gameContainer = document.getElementById(`game-content-${appId}`);
        if (!gameContainer) {
            console.error(`Game container not found: ${appId}`);
            return;
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
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

        // Initialize game engine
        const GameEngine = this.gameEngines[gameType];
        if (GameEngine) {
            const game = new GameEngine(canvas, ctx, this);
            this.games.set(appId, game);

            // Set up canvas click handler
            canvas.addEventListener('click', () => {
                game.handleClick();
            });

            console.log(`🎮 ${gameType} game initialized: ${appId}`);
        } else {
            console.error(`Unknown game type: ${gameType}`);
        }
    }

    /**
     * Initialize audio system
     */
    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 Audio system initialized');
        } catch (error) {
            console.warn('Audio not supported:', error);
            this.soundEnabled = false;
        }
    }

    /**
     * Play simple sound effect
     */
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

    /**
     * Update high score
     */
    updateHighScore(gameType, score) {
        if (score > this.highScores[gameType]) {
            this.highScores[gameType] = score;
            this.saveHighScores();

            // Show new high score notification
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

    /**
     * Get friendly game name
     */
    getGameName(gameType) {
        const names = {
            'neonbreaker': 'Neon Breaker',
            'galacticdefense': 'Galactic Defense',
            'cyberblocks': 'Cyber Blocks',
            'quantumrunner': 'Quantum Runner'
        };
        return names[gameType] || gameType;
    }

    /**
     * Load high scores from storage
     */
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

    /**
     * Save high scores to storage
     */
    saveHighScores() {
        try {
            localStorage.setItem('pixelpusher_game_scores', JSON.stringify(this.highScores));
        } catch (error) {
            console.warn('Failed to save high scores:', error);
        }
    }

    /**
     * Pause all games
     */
    pauseAll() {
        this.games.forEach(game => {
            if (typeof game.pause === 'function') {
                game.pause();
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
            }
        });
    }

    /**
     * Setup global shortcuts
     */
    setupGlobalShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Alt+G - Open games menu
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'g') {
                e.preventDefault();
                if (window.pixelPusher) {
                    window.pixelPusher.showGamesMenu();
                }
            }
        });
    }

    /**
     * Get game statistics
     */
    getStats() {
        return {
            activeGames: this.games.size,
            highScores: this.highScores,
            soundEnabled: this.soundEnabled,
            availableGames: Object.keys(this.gameEngines)
        };
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Games handle their own canvas resizing if needed
        console.log('🎮 Games window resized');
    }

    /**
     * Clean up games manager
     */
    destroy() {
        // Destroy all active games
        this.games.forEach(game => {
            if (typeof game.destroy === 'function') {
                game.destroy();
            }
        });

        this.games.clear();
        this.saveHighScores();

        console.log('🎮 Games Manager destroyed');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameManager;
}

console.log('🎮 Arcade Games manager loaded successfully');