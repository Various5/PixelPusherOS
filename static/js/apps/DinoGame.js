/**
 * Dino Runner Game - Individual Game Script
 * Endless runner game with jumping dinosaur
 */

class DinoGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.canvas.width = 800;
        this.canvas.height = 400;

        // Game state
        this.gameRunning = false;
        this.gameOver = false;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('dino_high_score') || '0');

        // Player (Dino)
        this.dino = {
            x: 80,
            y: 300,
            width: 40,
            height: 40,
            velocityY: 0,
            jumping: false,
            ducking: false
        };

        // Game world
        this.ground = 340;
        this.gravity = 0.8;
        this.jumpPower = 15;
        this.gameSpeed = 6;
        this.baseSpeed = 6;

        // Obstacles
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.obstacleInterval = 120;

        // Clouds (background decoration)
        this.clouds = [];
        this.cloudTimer = 0;

        // Colors
        this.colors = {
            background: '#f7f7f7',
            ground: '#83D1AB',
            dino: '#535353',
            obstacle: '#535353',
            cloud: '#c4c4c4',
            text: '#535353'
        };

        this.setupControls();
        this.initClouds();
        this.render();
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning && !this.gameOver) {
                if (e.code === 'Space' || e.code === 'ArrowUp') {
                    this.startGame();
                    e.preventDefault();
                    return;
                }
            }

            if (this.gameOver) {
                if (e.code === 'Space' || e.code === 'ArrowUp') {
                    this.resetGame();
                    e.preventDefault();
                    return;
                }
            }

            if (this.gameRunning) {
                switch (e.code) {
                    case 'Space':
                    case 'ArrowUp':
                        this.jump();
                        e.preventDefault();
                        break;
                    case 'ArrowDown':
                        this.duck(true);
                        e.preventDefault();
                        break;
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (this.gameRunning && e.code === 'ArrowDown') {
                this.duck(false);
                e.preventDefault();
            }
        });

        // Touch/click controls
        this.canvas.addEventListener('click', () => {
            if (!this.gameRunning && !this.gameOver) {
                this.startGame();
            } else if (this.gameOver) {
                this.resetGame();
            } else if (this.gameRunning) {
                this.jump();
            }
        });

        // Touch controls for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.gameRunning && !this.gameOver) {
                this.startGame();
            } else if (this.gameOver) {
                this.resetGame();
            } else if (this.gameRunning) {
                this.jump();
            }
        });
    }

    startGame() {
        this.gameRunning = true;
        this.gameLoop();
    }

    resetGame() {
        this.gameRunning = false;
        this.gameOver = false;
        this.score = 0;
        this.gameSpeed = this.baseSpeed;

        this.dino.y = 300;
        this.dino.velocityY = 0;
        this.dino.jumping = false;
        this.dino.ducking = false;

        this.obstacles = [];
        this.obstacleTimer = 0;

        this.render();
    }

    jump() {
        if (!this.dino.jumping) {
            this.dino.jumping = true;
            this.dino.velocityY = -this.jumpPower;
        }
    }

    duck(isDucking) {
        this.dino.ducking = isDucking;
        if (isDucking) {
            this.dino.height = 20;
            this.dino.y = 320;
        } else {
            this.dino.height = 40;
            this.dino.y = 300;
        }
    }

    gameLoop() {
        if (!this.gameRunning) return;

        this.update();
        this.render();

        if (this.gameRunning && !this.gameOver) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    update() {
        // Update score
        this.score += 0.5;

        // Increase game speed gradually
        this.gameSpeed = this.baseSpeed + Math.floor(this.score / 1000) * 0.5;

        // Update dino physics
        if (this.dino.jumping) {
            this.dino.velocityY += this.gravity;
            this.dino.y += this.dino.velocityY;

            if (this.dino.y >= (this.dino.ducking ? 320 : 300)) {
                this.dino.y = this.dino.ducking ? 320 : 300;
                this.dino.jumping = false;
                this.dino.velocityY = 0;
            }
        }

        // Spawn obstacles
        this.obstacleTimer++;
        if (this.obstacleTimer >= this.obstacleInterval) {
            this.spawnObstacle();
            this.obstacleTimer = 0;
            this.obstacleInterval = 60 + Math.random() * 80; // Random interval
        }

        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= this.gameSpeed;

            // Remove obstacles that are off screen
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
                continue;
            }

            // Check collision
            if (this.checkCollision(this.dino, obstacle)) {
                this.endGame();
                return;
            }
        }

        // Update clouds
        this.cloudTimer++;
        if (this.cloudTimer >= 300) {
            this.spawnCloud();
            this.cloudTimer = 0;
        }

        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const cloud = this.clouds[i];
            cloud.x -= this.gameSpeed * 0.3; // Clouds move slower

            if (cloud.x + cloud.width < 0) {
                this.clouds.splice(i, 1);
            }
        }
    }

    spawnObstacle() {
        const types = ['cactus', 'bird'];
        const type = types[Math.floor(Math.random() * types.length)];

        if (type === 'cactus') {
            this.obstacles.push({
                type: 'cactus',
                x: this.canvas.width,
                y: 320,
                width: 20,
                height: 40
            });
        } else {
            const birdY = Math.random() < 0.5 ? 280 : 240; // Two possible heights
            this.obstacles.push({
                type: 'bird',
                x: this.canvas.width,
                y: birdY,
                width: 30,
                height: 20,
                flapTimer: 0
            });
        }
    }

    spawnCloud() {
        this.clouds.push({
            x: this.canvas.width,
            y: 50 + Math.random() * 100,
            width: 60 + Math.random() * 40,
            height: 30 + Math.random() * 20
        });
    }

    initClouds() {
        // Add some initial clouds
        for (let i = 0; i < 3; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: 50 + Math.random() * 100,
                width: 60 + Math.random() * 40,
                height: 30 + Math.random() * 20
            });
        }
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    endGame() {
        this.gameRunning = false;
        this.gameOver = true;

        if (this.score > this.highScore) {
            this.highScore = Math.floor(this.score);
            localStorage.setItem('dino_high_score', this.highScore.toString());
        }
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw clouds
        this.ctx.fillStyle = this.colors.cloud;
        for (const cloud of this.clouds) {
            this.drawCloud(cloud.x, cloud.y, cloud.width, cloud.height);
        }

        // Draw ground
        this.ctx.fillStyle = this.colors.ground;
        this.ctx.fillRect(0, this.ground, this.canvas.width, this.canvas.height - this.ground);

        // Draw ground line
        this.ctx.strokeStyle = this.colors.text;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.ground);
        this.ctx.lineTo(this.canvas.width, this.ground);
        this.ctx.stroke();

        // Draw dino
        this.drawDino();

        // Draw obstacles
        this.ctx.fillStyle = this.colors.obstacle;
        for (const obstacle of this.obstacles) {
            if (obstacle.type === 'cactus') {
                this.drawCactus(obstacle);
            } else {
                this.drawBird(obstacle);
            }
        }

        // Draw UI
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Score: ${Math.floor(this.score)}`, this.canvas.width - 20, 40);
        this.ctx.fillText(`High Score: ${this.highScore}`, this.canvas.width - 20, 70);

        // Draw game state messages
        if (!this.gameRunning && !this.gameOver) {
            this.drawCenteredText('DINO RUNNER', this.canvas.height / 2 - 60, '36px Arial');
            this.drawCenteredText('Press SPACE or Click to Start', this.canvas.height / 2 - 20, '18px Arial');
            this.drawCenteredText('Use SPACE to Jump, DOWN Arrow to Duck', this.canvas.height / 2 + 10, '14px Arial');
        } else if (this.gameOver) {
            this.drawCenteredText('GAME OVER', this.canvas.height / 2 - 40, '36px Arial');
            this.drawCenteredText(`Final Score: ${Math.floor(this.score)}`, this.canvas.height / 2 - 5, '20px Arial');
            if (Math.floor(this.score) === this.highScore && this.score > 0) {
                this.drawCenteredText('NEW HIGH SCORE!', this.canvas.height / 2 + 25, '18px Arial');
            }
            this.drawCenteredText('Press SPACE or Click to Play Again', this.canvas.height / 2 + 50, '16px Arial');
        }
    }

    drawDino() {
        const x = this.dino.x;
        const y = this.dino.y;
        const w = this.dino.width;
        const h = this.dino.height;

        this.ctx.fillStyle = this.colors.dino;

        if (this.dino.ducking) {
            // Draw ducking dinosaur (simplified oval)
            this.ctx.beginPath();
            this.ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, 2 * Math.PI);
            this.ctx.fill();

            // Draw head
            this.ctx.beginPath();
            this.ctx.ellipse(x + w - 10, y + h/2, 8, 6, 0, 0, 2 * Math.PI);
            this.ctx.fill();
        } else {
            // Draw standing dinosaur
            // Body
            this.ctx.fillRect(x + 5, y + 10, w - 15, h - 15);

            // Head
            this.ctx.fillRect(x + w - 15, y, 12, 15);

            // Legs
            if (!this.dino.jumping) {
                // Simple leg animation based on score
                const legOffset = Math.floor(this.score / 10) % 2 === 0 ? 0 : 2;
                this.ctx.fillRect(x + 8, y + h - 5, 6, 5);
                this.ctx.fillRect(x + 18 + legOffset, y + h - 5, 6, 5);
            }

            // Eye
            this.ctx.fillStyle = this.colors.background;
            this.ctx.fillRect(x + w - 10, y + 3, 3, 3);
        }
    }

    drawCactus(obstacle) {
        const x = obstacle.x;
        const y = obstacle.y;
        const w = obstacle.width;
        const h = obstacle.height;

        // Main stem
        this.ctx.fillRect(x + w/3, y, w/3, h);

        // Arms
        this.ctx.fillRect(x, y + h/3, w/2, w/4);
        this.ctx.fillRect(x + w/2, y + h/2, w/2, w/4);

        // Spikes (simple lines)
        this.ctx.strokeStyle = this.colors.obstacle;
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const spikeY = y + (i + 1) * h/4;
            this.ctx.beginPath();
            this.ctx.moveTo(x + w/3 - 3, spikeY);
            this.ctx.lineTo(x + w/3, spikeY);
            this.ctx.moveTo(x + 2*w/3, spikeY);
            this.ctx.lineTo(x + 2*w/3 + 3, spikeY);
            this.ctx.stroke();
        }
    }

    drawBird(obstacle) {
        const x = obstacle.x;
        const y = obstacle.y;
        const w = obstacle.width;
        const h = obstacle.height;

        // Simple bird shape
        this.ctx.fillStyle = this.colors.obstacle;

        // Body
        this.ctx.beginPath();
        this.ctx.ellipse(x + w/2, y + h/2, w/3, h/3, 0, 0, 2 * Math.PI);
        this.ctx.fill();

        // Wings (flapping animation)
        obstacle.flapTimer = (obstacle.flapTimer + 1) % 20;
        const wingOffset = obstacle.flapTimer < 10 ? -3 : 3;

        // Left wing
        this.ctx.beginPath();
        this.ctx.ellipse(x + w/4, y + h/2 + wingOffset, w/6, h/4, -0.5, 0, 2 * Math.PI);
        this.ctx.fill();

        // Right wing
        this.ctx.beginPath();
        this.ctx.ellipse(x + 3*w/4, y + h/2 + wingOffset, w/6, h/4, 0.5, 0, 2 * Math.PI);
        this.ctx.fill();

        // Beak
        this.ctx.beginPath();
        this.ctx.moveTo(x + w - 5, y + h/2);
        this.ctx.lineTo(x + w + 5, y + h/2);
        this.ctx.lineTo(x + w, y + h/2 - 3);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawCloud(x, y, width, height) {
        // Simple cloud made of circles
        this.ctx.beginPath();
        this.ctx.arc(x + width * 0.25, y + height * 0.5, height * 0.4, 0, 2 * Math.PI);
        this.ctx.arc(x + width * 0.5, y + height * 0.3, height * 0.5, 0, 2 * Math.PI);
        this.ctx.arc(x + width * 0.75, y + height * 0.5, height * 0.4, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    drawCenteredText(text, y, font) {
        this.ctx.font = font;
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = this.colors.text;
        this.ctx.fillText(text, this.canvas.width / 2, y);
        this.ctx.textAlign = 'left';
    }

    destroy() {
        this.gameRunning = false;
    }
}

// Initialize game when script loads
if (typeof window !== 'undefined') {
    window.DinoGame = DinoGame;
}