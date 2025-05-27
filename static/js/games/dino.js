/**
 * Dino Runner Game Implementation
 * Chrome dinosaur-inspired endless runner
 */

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

// Make available globally
window.DinoGame = DinoGame;