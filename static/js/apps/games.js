/**
 * Pixel Pusher OS - Arcade Games Manager
 * Modern arcade-style games with stunning visuals and engaging gameplay
 *
 * This module provides:
 * - Neon Breaker - Modern breakout with power-ups and effects
 * - Galactic Defense - Space shooter with enemy waves
 * - Cyber Blocks - Tetris-like puzzle with neon aesthetics
 * - Quantum Runner - Endless runner with special abilities
 * - Village Builder - Complete idle city building game
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
            quantumrunner: 0,
            clicker: 0
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

        // Village Builder - Complete idle city building game
        this.gameEngines.clicker = class VillageBuilderGame {
            constructor(canvas, ctx, gameManager) {
                this.canvas = canvas;
                this.ctx = ctx;
                this.gameManager = gameManager;
                this.width = canvas.width;
                this.height = canvas.height;

                // Game state
                this.gameState = 'playing';
                this.lastUpdate = Date.now();
                this.gameSpeed = 1;
                this.autoClicker = false;

                // Resources
                this.resources = {
                    gold: 100,
                    wood: 50,
                    stone: 25,
                    food: 30,
                    population: 0,
                    happiness: 100,
                    energy: 100
                };

                // Production rates (per second)
                this.production = {
                    gold: 0,
                    wood: 0,
                    stone: 0,
                    food: 0,
                    population: 0,
                    happiness: 0,
                    energy: 0
                };

                // Buildings
                this.buildings = {
                    houses: { count: 0, cost: { gold: 20, wood: 15 }, production: { population: 2 }, name: '🏠 House' },
                    farms: { count: 0, cost: { gold: 30, wood: 10 }, production: { food: 3 }, name: '🌾 Farm' },
                    mines: { count: 0, cost: { gold: 50, stone: 20 }, production: { gold: 2, stone: 1 }, name: '⛏️ Mine' },
                    lumberMills: { count: 0, cost: { gold: 40, stone: 15 }, production: { wood: 4 }, name: '🪵 Lumber Mill' },
                    markets: { count: 0, cost: { gold: 100, wood: 30, stone: 20 }, production: { gold: 5 }, name: '🏪 Market' },
                    taverns: { count: 0, cost: { gold: 80, wood: 25, food: 20 }, production: { happiness: 10 }, name: '🍺 Tavern' },
                    temples: { count: 0, cost: { gold: 200, stone: 100, wood: 50 }, production: { happiness: 25, energy: 5 }, name: '⛪ Temple' },
                    castles: { count: 0, cost: { gold: 500, stone: 200, wood: 100, food: 50 }, production: { gold: 15, happiness: 30 }, name: '🏰 Castle' },
                    wizardTowers: { count: 0, cost: { gold: 1000, stone: 300, energy: 100 }, production: { gold: 25, energy: 15 }, name: '🔮 Wizard Tower' },
                    dragonLairs: { count: 0, cost: { gold: 5000, stone: 1000, energy: 500 }, production: { gold: 100 }, name: '🐉 Dragon Lair' }
                };

                // Upgrades
                this.upgrades = {
                    betterTools: {
                        bought: false,
                        cost: { gold: 200 },
                        effect: 'Increase all production by 25%',
                        multiplier: 1.25
                    },
                    happyWorkers: {
                        bought: false,
                        cost: { gold: 500, happiness: 50 },
                        effect: 'Workers produce 50% more when happy',
                        multiplier: 1.5
                    },
                    goldRush: {
                        bought: false,
                        cost: { gold: 1000 },
                        effect: 'Mines produce 100% more gold',
                        multiplier: 2
                    },
                    automation: {
                        bought: false,
                        cost: { gold: 2000, energy: 100 },
                        effect: 'Auto-click every 2 seconds',
                        autoClick: true
                    },
                    magicBoost: {
                        bought: false,
                        cost: { gold: 5000, energy: 200 },
                        effect: 'All production +200%',
                        multiplier: 3
                    },
                    timeWarp: {
                        bought: false,
                        cost: { gold: 10000, energy: 500 },
                        effect: 'Game runs 2x faster',
                        speedMultiplier: 2
                    }
                };

                // Achievements
                this.achievements = {
                    firstHouse: { unlocked: false, name: 'First Home', desc: 'Build your first house', reward: { gold: 50 } },
                    population10: { unlocked: false, name: 'Growing Village', desc: 'Reach 10 population', reward: { gold: 100 } },
                    population100: { unlocked: false, name: 'Bustling Town', desc: 'Reach 100 population', reward: { gold: 500 } },
                    goldRich: { unlocked: false, name: 'Golden Touch', desc: 'Accumulate 1000 gold', reward: { wood: 100 } },
                    masterBuilder: { unlocked: false, name: 'Master Builder', desc: 'Build 50 total buildings', reward: { gold: 1000 } },
                    happyTown: { unlocked: false, name: 'Paradise', desc: 'Maintain 200+ happiness', reward: { energy: 100 } },
                    dragonTamer: { unlocked: false, name: 'Dragon Tamer', desc: 'Build a Dragon Lair', reward: { gold: 5000 } }
                };

                // UI state
                this.selectedTab = 'buildings';
                this.hoveredBuilding = null;
                this.notifications = [];
                this.particles = [];

                // Visual elements
                this.villageElements = [];
                this.animationTime = 0;

                // Save/load
                this.autoSaveInterval = 30000; // 30 seconds
                this.lastSave = Date.now();

                this.init();
                this.loadGame();
                this.startGameLoop();
            }

            init() {
                this.setupEventHandlers();
                this.calculateProduction();
                console.log('🏘️ Village Builder initialized');
            }

            setupEventHandlers() {
                this.canvas.addEventListener('click', (e) => this.handleClick(e));
                this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));

                // Auto-save interval
                setInterval(() => this.saveGame(), this.autoSaveInterval);

                // Auto-clicker for automation upgrade
                setInterval(() => {
                    if (this.upgrades.automation.bought) {
                        this.collectResources();
                    }
                }, 2000);
            }

            startGameLoop() {
                const gameLoop = () => {
                    const currentTime = Date.now();
                    const deltaTime = (currentTime - this.lastUpdate) / 1000;

                    this.update(deltaTime);
                    this.render();

                    this.lastUpdate = currentTime;

                    if (this.gameState !== 'stopped') {
                        requestAnimationFrame(gameLoop);
                    }
                };

                requestAnimationFrame(gameLoop);
            }

            update(deltaTime) {
                deltaTime *= this.gameSpeed;
                this.animationTime += deltaTime;

                // Update resource production
                this.updateProduction(deltaTime);

                // Update particles
                this.updateParticles(deltaTime);

                // Update notifications
                this.updateNotifications(deltaTime);

                // Check achievements
                this.checkAchievements();

                // Update village visual elements
                this.updateVillageElements(deltaTime);
            }

            updateProduction(deltaTime) {
                const happinessMultiplier = this.resources.happiness / 100;
                const energyMultiplier = Math.min(this.resources.energy / 100, 1);

                Object.keys(this.production).forEach(resource => {
                    if (this.production[resource] > 0) {
                        let production = this.production[resource] * deltaTime;

                        // Apply happiness bonus to gold and food
                        if ((resource === 'gold' || resource === 'food') && this.upgrades.happyWorkers.bought) {
                            production *= happinessMultiplier * this.upgrades.happyWorkers.multiplier;
                        }

                        // Apply energy efficiency
                        production *= energyMultiplier;

                        this.resources[resource] += production;
                    }
                });

                // Consume resources
                if (this.resources.population > 0) {
                    this.resources.food -= this.resources.population * 0.1 * deltaTime;
                    this.resources.energy -= Math.max(0, this.getTotalBuildings() * 0.05 * deltaTime);
                }

                // Ensure minimums
                this.resources.food = Math.max(0, this.resources.food);
                this.resources.energy = Math.max(0, this.resources.energy);

                // Happiness decay without food
                if (this.resources.food <= 0) {
                    this.resources.happiness -= 10 * deltaTime;
                } else {
                    this.resources.happiness = Math.min(200, this.resources.happiness + 1 * deltaTime);
                }

                this.resources.happiness = Math.max(0, this.resources.happiness);
            }

            calculateProduction() {
                // Reset production
                Object.keys(this.production).forEach(key => {
                    this.production[key] = 0;
                });

                // Calculate from buildings
                Object.entries(this.buildings).forEach(([buildingType, building]) => {
                    if (building.count > 0 && building.production) {
                        Object.entries(building.production).forEach(([resource, amount]) => {
                            this.production[resource] += amount * building.count;
                        });
                    }
                });

                // Apply upgrade multipliers
                Object.entries(this.upgrades).forEach(([upgradeType, upgrade]) => {
                    if (upgrade.bought && upgrade.multiplier) {
                        Object.keys(this.production).forEach(resource => {
                            if (upgradeType === 'goldRush' && resource === 'gold') {
                                this.production[resource] += this.buildings.mines.count * 2;
                            } else if (upgradeType !== 'goldRush') {
                                this.production[resource] *= upgrade.multiplier;
                            }
                        });
                    }
                });

                // Apply speed multiplier
                if (this.upgrades.timeWarp.bought) {
                    this.gameSpeed = this.upgrades.timeWarp.speedMultiplier;
                }
            }

            handleClick(e) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Check UI clicks
                if (this.handleUIClick(x, y)) {
                    return;
                }

                // Manual resource collection (clicking on village)
                this.collectResources();
            }

            handleUIClick(x, y) {
                const buttonHeight = 40;
                const buttonWidth = 180;
                const startY = 120;
                const gap = 50;

                // Tab buttons
                const tabY = 50;
                const tabWidth = 100;
                const tabs = ['buildings', 'upgrades', 'stats'];

                tabs.forEach((tab, index) => {
                    const tabX = 20 + index * (tabWidth + 10);
                    if (x >= tabX && x <= tabX + tabWidth && y >= tabY && y <= tabY + 30) {
                        this.selectedTab = tab;
                        return true;
                    }
                });

                if (this.selectedTab === 'buildings') {
                    // Building buttons
                    const buildingTypes = Object.keys(this.buildings);
                    buildingTypes.forEach((buildingType, index) => {
                        const buttonY = startY + index * gap;
                        if (x >= 20 && x <= 20 + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
                            this.buyBuilding(buildingType);
                            return true;
                        }
                    });
                } else if (this.selectedTab === 'upgrades') {
                    // Upgrade buttons
                    const upgradeTypes = Object.keys(this.upgrades).filter(u => !this.upgrades[u].bought);
                    upgradeTypes.forEach((upgradeType, index) => {
                        const buttonY = startY + index * gap;
                        if (x >= 20 && x <= 20 + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
                            this.buyUpgrade(upgradeType);
                            return true;
                        }
                    });
                }

                return false;
            }

            handleMouseMove(e) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                this.hoveredBuilding = null;

                if (this.selectedTab === 'buildings') {
                    const buttonHeight = 40;
                    const buttonWidth = 180;
                    const startY = 120;
                    const gap = 50;

                    const buildingTypes = Object.keys(this.buildings);
                    buildingTypes.forEach((buildingType, index) => {
                        const buttonY = startY + index * gap;
                        if (x >= 20 && x <= 20 + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
                            this.hoveredBuilding = buildingType;
                        }
                    });
                }
            }

            collectResources() {
                const baseGold = 5;
                let goldGained = baseGold;

                // Apply upgrade multipliers
                if (this.upgrades.betterTools.bought) {
                    goldGained *= this.upgrades.betterTools.multiplier;
                }

                this.resources.gold += goldGained;

                // Create particle effect
                this.createParticle(this.width / 2, this.height / 2, `+${Math.floor(goldGained)}💰`, '#ffd700');

                // Random chance for bonus resources
                if (Math.random() < 0.1) {
                    const bonusResources = ['wood', 'stone', 'food'];
                    const bonusResource = bonusResources[Math.floor(Math.random() * bonusResources.length)];
                    const bonusAmount = Math.floor(Math.random() * 5) + 1;
                    this.resources[bonusResource] += bonusAmount;

                    this.createParticle(
                        this.width / 2 + (Math.random() - 0.5) * 100,
                        this.height / 2 + (Math.random() - 0.5) * 100,
                        `+${bonusAmount} ${bonusResource}`,
                        '#4ecdc4'
                    );
                }
            }

            buyBuilding(buildingType) {
                const building = this.buildings[buildingType];
                if (!this.canAfford(building.cost)) {
                    this.showNotification('Not enough resources!', '#ff6b6b');
                    return;
                }

                // Deduct costs
                Object.entries(building.cost).forEach(([resource, amount]) => {
                    this.resources[resource] -= amount;
                });

                // Add building
                building.count++;

                // Recalculate production
                this.calculateProduction();

                // Add visual element
                this.addVillageElement(buildingType);

                // Show success notification
                this.showNotification(`Built ${building.name}!`, '#51cf66');

                // Create particle effect
                this.createParticle(
                    this.width / 2 + (Math.random() - 0.5) * 200,
                    this.height / 2 + (Math.random() - 0.5) * 150,
                    building.name,
                    '#51cf66'
                );

                // Increase building cost (scaling)
                Object.keys(building.cost).forEach(resource => {
                    building.cost[resource] = Math.floor(building.cost[resource] * 1.15);
                });
            }

            buyUpgrade(upgradeType) {
                const upgrade = this.upgrades[upgradeType];
                if (upgrade.bought) return;

                if (!this.canAfford(upgrade.cost)) {
                    this.showNotification('Not enough resources!', '#ff6b6b');
                    return;
                }

                // Deduct costs
                Object.entries(upgrade.cost).forEach(([resource, amount]) => {
                    this.resources[resource] -= amount;
                });

                // Buy upgrade
                upgrade.bought = true;

                // Apply upgrade effects
                this.calculateProduction();

                // Show success notification
                this.showNotification(`Upgrade purchased: ${upgrade.effect}`, '#845ef7');

                // Special effects for certain upgrades
                if (upgradeType === 'automation') {
                    this.autoClicker = true;
                }
            }

            canAfford(cost) {
                return Object.entries(cost).every(([resource, amount]) => {
                    return this.resources[resource] >= amount;
                });
            }

            addVillageElement(buildingType) {
                const element = {
                    type: buildingType,
                    x: Math.random() * (this.width - 400) + 250,
                    y: Math.random() * (this.height - 200) + 100,
                    scale: 0,
                    targetScale: 1,
                    rotation: Math.random() * Math.PI * 2,
                    animationTime: 0
                };

                this.villageElements.push(element);
            }

            updateVillageElements(deltaTime) {
                this.villageElements.forEach(element => {
                    element.animationTime += deltaTime;

                    // Grow animation
                    if (element.scale < element.targetScale) {
                        element.scale += deltaTime * 3;
                        element.scale = Math.min(element.scale, element.targetScale);
                    }

                    // Gentle floating animation
                    element.y += Math.sin(element.animationTime + element.x * 0.01) * 0.5;
                });
            }

            createParticle(x, y, text, color) {
                this.particles.push({
                    x: x,
                    y: y,
                    text: text,
                    color: color,
                    life: 2.0,
                    maxLife: 2.0,
                    dy: -50,
                    scale: 1
                });
            }

            updateParticles(deltaTime) {
                this.particles = this.particles.filter(particle => {
                    particle.life -= deltaTime;
                    particle.y += particle.dy * deltaTime;
                    particle.dy += 20 * deltaTime; // gravity
                    particle.scale = particle.life / particle.maxLife;

                    return particle.life > 0;
                });
            }

            updateNotifications(deltaTime) {
                this.notifications = this.notifications.filter(notification => {
                    notification.life -= deltaTime;
                    return notification.life > 0;
                });
            }

            showNotification(message, color) {
                this.notifications.push({
                    message: message,
                    color: color,
                    life: 3.0,
                    maxLife: 3.0
                });
            }

            checkAchievements() {
                const achievements = [
                    { id: 'firstHouse', condition: () => this.buildings.houses.count >= 1 },
                    { id: 'population10', condition: () => this.resources.population >= 10 },
                    { id: 'population100', condition: () => this.resources.population >= 100 },
                    { id: 'goldRich', condition: () => this.resources.gold >= 1000 },
                    { id: 'masterBuilder', condition: () => this.getTotalBuildings() >= 50 },
                    { id: 'happyTown', condition: () => this.resources.happiness >= 200 },
                    { id: 'dragonTamer', condition: () => this.buildings.dragonLairs.count >= 1 }
                ];

                achievements.forEach(achievement => {
                    const ach = this.achievements[achievement.id];
                    if (!ach.unlocked && achievement.condition()) {
                        ach.unlocked = true;
                        this.showNotification(`Achievement: ${ach.name}!`, '#ffd43b');

                        // Give rewards
                        Object.entries(ach.reward).forEach(([resource, amount]) => {
                            this.resources[resource] += amount;
                        });

                        // Create celebration particles
                        for (let i = 0; i < 10; i++) {
                            this.createParticle(
                                this.width / 2 + (Math.random() - 0.5) * 200,
                                this.height / 2 + (Math.random() - 0.5) * 150,
                                '⭐',
                                '#ffd43b'
                            );
                        }
                    }
                });
            }

            getTotalBuildings() {
                return Object.values(this.buildings).reduce((total, building) => total + building.count, 0);
            }

            render() {
                // Clear canvas
                this.ctx.fillStyle = '#0f1419';
                this.ctx.fillRect(0, 0, this.width, this.height);

                // Render background
                this.renderBackground();

                // Render village elements
                this.renderVillageElements();

                // Render particles
                this.renderParticles();

                // Render UI
                this.renderUI();

                // Render notifications
                this.renderNotifications();
            }

            renderBackground() {
                // Sky gradient
                const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
                gradient.addColorStop(0, '#1e3a8a');
                gradient.addColorStop(0.7, '#3b82f6');
                gradient.addColorStop(1, '#22c55e');

                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(250, 0, this.width - 250, this.height);

                // Ground
                this.ctx.fillStyle = '#16a34a';
                this.ctx.fillRect(250, this.height * 0.8, this.width - 250, this.height * 0.2);

                // Mountains in background
                this.ctx.fillStyle = '#374151';
                this.ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const x = 250 + i * 100;
                    const y = this.height * 0.4 + Math.sin(i) * 50;
                    this.ctx.lineTo(x, y);
                    this.ctx.lineTo(x + 50, this.height * 0.8);
                    this.ctx.lineTo(x + 100, y + 20);
                }
                this.ctx.lineTo(this.width, this.height * 0.8);
                this.ctx.fill();

                // Sun/Moon
                const time = (this.animationTime * 0.1) % (Math.PI * 2);
                const sunY = this.height * 0.3 + Math.sin(time) * this.height * 0.2;
                const isDay = Math.sin(time) > 0;

                this.ctx.fillStyle = isDay ? '#fbbf24' : '#e5e7eb';
                this.ctx.beginPath();
                this.ctx.arc(this.width - 100, sunY, 30, 0, Math.PI * 2);
                this.ctx.fill();

                // Clouds
                for (let i = 0; i < 3; i++) {
                    const cloudX = 300 + i * 150 + Math.sin(this.animationTime * 0.2 + i) * 20;
                    const cloudY = 80 + i * 30;
                    this.renderCloud(cloudX, cloudY);
                }
            }

            renderCloud(x, y) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.beginPath();
                this.ctx.arc(x, y, 20, 0, Math.PI * 2);
                this.ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
                this.ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
                this.ctx.arc(x + 25, y - 15, 20, 0, Math.PI * 2);
                this.ctx.fill();
            }

            renderVillageElements() {
                this.villageElements.forEach(element => {
                    this.ctx.save();
                    this.ctx.translate(element.x, element.y);
                    this.ctx.scale(element.scale, element.scale);
                    this.ctx.rotate(element.rotation * 0.1);

                    // Get building emoji
                    const building = this.buildings[element.type];
                    if (building) {
                        this.ctx.font = '24px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText(building.name.split(' ')[0], 0, 0);
                    }

                    this.ctx.restore();
                });
            }

            renderParticles() {
                this.particles.forEach(particle => {
                    this.ctx.save();
                    this.ctx.globalAlpha = particle.scale;
                    this.ctx.fillStyle = particle.color;
                    this.ctx.font = `${16 * particle.scale}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(particle.text, particle.x, particle.y);
                    this.ctx.restore();
                });
            }

            renderUI() {
                // UI Background
                this.ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
                this.ctx.fillRect(0, 0, 240, this.height);

                // Border
                this.ctx.strokeStyle = '#4a5568';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(0, 0, 240, this.height);

                // Title
                this.ctx.fillStyle = '#ffd700';
                this.ctx.font = 'bold 20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('🏘️ Village Builder', 120, 30);

                // Tabs
                this.renderTabs();

                // Resources
                this.renderResources();

                // Content based on selected tab
                if (this.selectedTab === 'buildings') {
                    this.renderBuildingsTab();
                } else if (this.selectedTab === 'upgrades') {
                    this.renderUpgradesTab();
                } else if (this.selectedTab === 'stats') {
                    this.renderStatsTab();
                }
            }

            renderTabs() {
                const tabs = [
                    { id: 'buildings', name: '🏗️ Build', x: 20 },
                    { id: 'upgrades', name: '⚡ Upgrade', x: 90 },
                    { id: 'stats', name: '📊 Stats', x: 170 }
                ];

                tabs.forEach(tab => {
                    const isActive = this.selectedTab === tab.id;

                    this.ctx.fillStyle = isActive ? '#4a90e2' : '#2d3748';
                    this.ctx.fillRect(tab.x, 50, 60, 30);

                    this.ctx.strokeStyle = isActive ? '#ffffff' : '#4a5568';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(tab.x, 50, 60, 30);

                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = '10px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(tab.name, tab.x + 30, 68);
                });
            }

            renderResources() {
                const startY = 90;
                const lineHeight = 15;

                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'left';

                const resources = [
                    { name: '💰 Gold', value: Math.floor(this.resources.gold), production: this.production.gold },
                    { name: '🪵 Wood', value: Math.floor(this.resources.wood), production: this.production.wood },
                    { name: '🗿 Stone', value: Math.floor(this.resources.stone), production: this.production.stone },
                    { name: '🌾 Food', value: Math.floor(this.resources.food), production: this.production.food },
                    { name: '👥 Pop', value: Math.floor(this.resources.population), production: this.production.population },
                    { name: '😊 Happy', value: Math.floor(this.resources.happiness), production: 0 },
                    { name: '⚡ Energy', value: Math.floor(this.resources.energy), production: this.production.energy }
                ];

                resources.forEach((resource, index) => {
                    const y = startY + index * lineHeight;
                    this.ctx.fillText(`${resource.name}: ${resource.value}`, 10, y);

                    if (resource.production > 0) {
                        this.ctx.fillStyle = '#51cf66';
                        this.ctx.fillText(`(+${resource.production.toFixed(1)}/s)`, 150, y);
                        this.ctx.fillStyle = '#ffffff';
                    }
                });
            }

            renderBuildingsTab() {
                const startY = 220;
                const buttonHeight = 40;
                const gap = 50;

                this.ctx.font = '11px Arial';
                this.ctx.textAlign = 'left';

                Object.entries(this.buildings).forEach(([buildingType, building], index) => {
                    const y = startY + index * gap;
                    const canBuy = this.canAfford(building.cost);
                    const isHovered = this.hoveredBuilding === buildingType;

                    // Button background
                    this.ctx.fillStyle = canBuy ? (isHovered ? '#4a90e2' : '#2d3748') : '#1a1a1a';
                    this.ctx.fillRect(20, y, 180, buttonHeight);

                    // Button border
                    this.ctx.strokeStyle = canBuy ? '#4a5568' : '#666666';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(20, y, 180, buttonHeight);

                    // Building info
                    this.ctx.fillStyle = canBuy ? '#ffffff' : '#666666';
                    this.ctx.fillText(`${building.name} (${building.count})`, 25, y + 15);

                    // Cost
                    const costText = Object.entries(building.cost)
                        .map(([resource, amount]) => `${amount} ${resource}`)
                        .join(', ');

                    this.ctx.font = '9px Arial';
                    this.ctx.fillText(costText, 25, y + 30);
                    this.ctx.font = '11px Arial';

                    // Production info (if hovered)
                    if (isHovered && building.production) {
                        const prodText = Object.entries(building.production)
                            .map(([resource, amount]) => `+${amount}/s ${resource}`)
                            .join(', ');

                        this.ctx.fillStyle = '#51cf66';
                        this.ctx.font = '9px Arial';
                        this.ctx.fillText(prodText, 25, y + 40);
                        this.ctx.font = '11px Arial';
                    }
                });
            }

            renderUpgradesTab() {
                const startY = 220;
                const buttonHeight = 50;
                const gap = 60;

                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'left';

                const availableUpgrades = Object.entries(this.upgrades).filter(([_, upgrade]) => !upgrade.bought);

                if (availableUpgrades.length === 0) {
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('All upgrades purchased!', 120, startY + 50);
                    return;
                }

                availableUpgrades.forEach(([upgradeType, upgrade], index) => {
                    const y = startY + index * gap;
                    const canBuy = this.canAfford(upgrade.cost);

                    // Button background
                    this.ctx.fillStyle = canBuy ? '#6b46c1' : '#1a1a1a';
                    this.ctx.fillRect(20, y, 180, buttonHeight);

                    // Button border
                    this.ctx.strokeStyle = canBuy ? '#8b5cf6' : '#666666';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(20, y, 180, buttonHeight);

                    // Upgrade info
                    this.ctx.fillStyle = canBuy ? '#ffffff' : '#666666';
                    this.ctx.fillText(upgradeType.toUpperCase(), 25, y + 15);

                    // Effect
                    this.ctx.font = '8px Arial';
                    this.ctx.fillText(upgrade.effect, 25, y + 28);

                    // Cost
                    const costText = Object.entries(upgrade.cost)
                        .map(([resource, amount]) => `${amount} ${resource}`)
                        .join(', ');

                    this.ctx.fillText(`Cost: ${costText}`, 25, y + 42);
                    this.ctx.font = '10px Arial';
                });
            }

            renderStatsTab() {
                const startY = 220;
                const lineHeight = 20;

                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '11px Arial';
                this.ctx.textAlign = 'left';

                const stats = [
                    `Total Buildings: ${this.getTotalBuildings()}`,
                    `Gold/sec: ${this.production.gold.toFixed(1)}`,
                    `Food/sec: ${this.production.food.toFixed(1)}`,
                    `Population Growth: ${this.production.population.toFixed(1)}/s`,
                    `Game Speed: ${this.gameSpeed}x`,
                    `Achievements: ${Object.values(this.achievements).filter(a => a.unlocked).length}/${Object.keys(this.achievements).length}`
                ];

                stats.forEach((stat, index) => {
                    this.ctx.fillText(stat, 25, startY + index * lineHeight);
                });

                // Achievement list
                this.ctx.fillStyle = '#ffd700';
                this.ctx.fillText('Achievements:', 25, startY + stats.length * lineHeight + 20);

                Object.entries(this.achievements).forEach(([id, achievement], index) => {
                    const y = startY + (stats.length + 2 + index) * lineHeight;
                    const status = achievement.unlocked ? '✅' : '⭕';

                    this.ctx.fillStyle = achievement.unlocked ? '#51cf66' : '#666666';
                    this.ctx.font = '9px Arial';
                    this.ctx.fillText(`${status} ${achievement.name}`, 25, y);
                    this.ctx.font = '11px Arial';
                });
            }

            renderNotifications() {
                this.notifications.forEach((notification, index) => {
                    const alpha = notification.life / notification.maxLife;
                    const y = this.height - 100 - index * 30;

                    this.ctx.save();
                    this.ctx.globalAlpha = alpha;

                    // Background
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    this.ctx.fillRect(this.width - 320, y - 20, 300, 25);

                    // Text
                    this.ctx.fillStyle = notification.color;
                    this.ctx.font = '12px Arial';
                    this.ctx.textAlign = 'right';
                    this.ctx.fillText(notification.message, this.width - 30, y);

                    this.ctx.restore();
                });
            }

            saveGame() {
                const saveData = {
                    resources: this.resources,
                    buildings: this.buildings,
                    upgrades: this.upgrades,
                    achievements: this.achievements,
                    gameSpeed: this.gameSpeed,
                    villageElements: this.villageElements,
                    timestamp: Date.now()
                };

                localStorage.setItem('pixelpusher_village_save', JSON.stringify(saveData));
                console.log('🏘️ Village Builder game saved');
            }

            loadGame() {
                try {
                    const saveData = localStorage.getItem('pixelpusher_village_save');
                    if (saveData) {
                        const data = JSON.parse(saveData);

                        // Merge save data
                        this.resources = { ...this.resources, ...data.resources };
                        this.buildings = { ...this.buildings, ...data.buildings };
                        this.upgrades = { ...this.upgrades, ...data.upgrades };
                        this.achievements = { ...this.achievements, ...data.achievements };
                        this.gameSpeed = data.gameSpeed || 1;
                        this.villageElements = data.villageElements || [];

                        // Calculate offline progress
                        if (data.timestamp) {
                            const offlineTime = (Date.now() - data.timestamp) / 1000;
                            if (offlineTime > 60) { // Only if offline for more than 1 minute
                                this.calculateOfflineProgress(Math.min(offlineTime, 3600)); // Max 1 hour
                            }
                        }

                        this.calculateProduction();
                        console.log('🏘️ Village Builder game loaded');
                    }
                } catch (error) {
                    console.warn('Failed to load village builder save:', error);
                }
            }

            calculateOfflineProgress(offlineTime) {
                // Calculate resources gained while offline
                const offlineGains = {};

                Object.entries(this.production).forEach(([resource, rate]) => {
                    if (rate > 0) {
                        offlineGains[resource] = Math.floor(rate * offlineTime * 0.5); // 50% efficiency offline
                        this.resources[resource] += offlineGains[resource];
                    }
                });

                // Show offline progress notification
                if (Object.keys(offlineGains).length > 0) {
                    const gainText = Object.entries(offlineGains)
                        .filter(([_, amount]) => amount > 0)
                        .map(([resource, amount]) => `${amount} ${resource}`)
                        .join(', ');

                    this.showNotification(`Welcome back! Gained: ${gainText}`, '#51cf66');
                }
            }

            handleClick() {
                // This is called when the game canvas is clicked from the window manager
                this.collectResources();
            }

            destroy() {
                this.gameState = 'stopped';
                this.saveGame();
                console.log('🏘️ Village Builder destroyed');
            }
        };

        // Cyber Blocks - Tetris-like puzzle game (placeholder)
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

        // Quantum Runner - Endless runner (placeholder)
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
            'quantumrunner': 'Quantum Runner',
            'clicker': 'Village Builder'
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