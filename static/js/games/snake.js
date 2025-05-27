/**
 * Snake Game Implementation
 * Classic arcade snake game with modern graphics
 */

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

// Make available globally
window.SnakeGame = SnakeGame;