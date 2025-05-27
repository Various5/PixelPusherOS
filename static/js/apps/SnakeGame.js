/**
 * Snake Game - Individual Game Script
 * Classic Snake game with modern visuals
 */

class SnakeGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.canvas.width = 600;
        this.canvas.height = 400;

        // Game state
        this.gameRunning = false;
        this.gameOver = false;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snake_high_score') || '0');

        // Snake properties
        this.snake = [{ x: 200, y: 200 }];
        this.direction = { x: 20, y: 0 };
        this.nextDirection = { x: 20, y: 0 };

        // Food properties
        this.food = this.generateFood();

        // Game settings
        this.gridSize = 20;
        this.gameSpeed = 150;
        this.lastTime = 0;

        // Colors
        this.colors = {
            background: '#0a0a0a',
            snake: '#00ff41',
            snakeHead: '#00cc33',
            food: '#ff4444',
            text: '#ffffff',
            grid: '#1a1a1a'
        };

        this.setupControls();
        this.render();
    }

    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning && !this.gameOver) {
                if (e.code === 'Space') {
                    this.startGame();
                    return;
                }
            }

            if (this.gameOver && e.code === 'Space') {
                this.resetGame();
                return;
            }

            if (!this.gameRunning) return;

            switch (e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    if (this.direction.y === 0) {
                        this.nextDirection = { x: 0, y: -this.gridSize };
                    }
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    if (this.direction.y === 0) {
                        this.nextDirection = { x: 0, y: this.gridSize };
                    }
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    if (this.direction.x === 0) {
                        this.nextDirection = { x: -this.gridSize, y: 0 };
                    }
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    if (this.direction.x === 0) {
                        this.nextDirection = { x: this.gridSize, y: 0 };
                    }
                    e.preventDefault();
                    break;
                case 'Space':
                    this.togglePause();
                    e.preventDefault();
                    break;
            }
        });

        // Touch/click controls for mobile
        this.canvas.addEventListener('click', (e) => {
            if (!this.gameRunning && !this.gameOver) {
                this.startGame();
                return;
            }

            if (this.gameOver) {
                this.resetGame();
                return;
            }
        });

        // Touch controls
        let touchStartX = 0;
        let touchStartY = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.gameRunning) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 30 && this.direction.x === 0) {
                    this.nextDirection = { x: this.gridSize, y: 0 };
                } else if (deltaX < -30 && this.direction.x === 0) {
                    this.nextDirection = { x: -this.gridSize, y: 0 };
                }
            } else {
                // Vertical swipe
                if (deltaY > 30 && this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: this.gridSize };
                } else if (deltaY < -30 && this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: -this.gridSize };
                }
            }
        });
    }

    startGame() {
        this.gameRunning = true;
        this.gameOver = false;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    togglePause() {
        this.gameRunning = !this.gameRunning;
        if (this.gameRunning) {
            this.lastTime = performance.now();
            this.gameLoop();
        }
    }

    resetGame() {
        this.snake = [{ x: 200, y: 200 }];
        this.direction = { x: 20, y: 0 };
        this.nextDirection = { x: 20, y: 0 };
        this.food = this.generateFood();
        this.score = 0;
        this.gameRunning = false;
        this.gameOver = false;
        this.render();
    }

    gameLoop() {
        if (!this.gameRunning) return;

        const currentTime = performance.now();

        if (currentTime - this.lastTime >= this.gameSpeed) {
            this.update();
            this.lastTime = currentTime;
        }

        this.render();

        if (this.gameRunning && !this.gameOver) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    update() {
        // Update direction
        this.direction = { ...this.nextDirection };

        // Move snake head
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;

        // Check wall collision
        if (head.x < 0 || head.x >= this.canvas.width ||
            head.y < 0 || head.y >= this.canvas.height) {
            this.endGame();
            return;
        }

        // Check self collision
        for (const segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.endGame();
                return;
            }
        }

        this.snake.unshift(head);

        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.food = this.generateFood();

            // Increase speed slightly
            this.gameSpeed = Math.max(80, this.gameSpeed - 2);
        } else {
            this.snake.pop();
        }
    }

    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)) * this.gridSize,
                y: Math.floor(Math.random() * (this.canvas.height / this.gridSize)) * this.gridSize
            };
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));

        return food;
    }

    endGame() {
        this.gameRunning = false;
        this.gameOver = true;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snake_high_score', this.highScore.toString());
        }
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 0.5;
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Draw snake
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? this.colors.snakeHead : this.colors.snake;
            this.ctx.fillRect(segment.x + 1, segment.y + 1, this.gridSize - 2, this.gridSize - 2);

            if (index === 0) {
                // Draw eyes on head
                this.ctx.fillStyle = this.colors.background;
                const eyeSize = 3;
                this.ctx.fillRect(segment.x + 5, segment.y + 5, eyeSize, eyeSize);
                this.ctx.fillRect(segment.x + 12, segment.y + 5, eyeSize, eyeSize);
            }
        });

        // Draw food
        this.ctx.fillStyle = this.colors.food;
        this.ctx.fillRect(this.food.x + 2, this.food.y + 2, this.gridSize - 4, this.gridSize - 4);

        // Draw food glow effect
        this.ctx.shadowColor = this.colors.food;
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(this.food.x + 2, this.food.y + 2, this.gridSize - 4, this.gridSize - 4);
        this.ctx.shadowBlur = 0;

        // Draw UI
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
        this.ctx.fillText(`High Score: ${this.highScore}`, 10, 55);

        // Draw game state messages
        if (!this.gameRunning && !this.gameOver) {
            this.drawCenteredText('SNAKE GAME', this.canvas.height / 2 - 60, '36px Arial');
            this.drawCenteredText('Press SPACE or Click to Start', this.canvas.height / 2 - 20, '18px Arial');
            this.drawCenteredText('Use Arrow Keys or WASD to Move', this.canvas.height / 2 + 10, '14px Arial');
        } else if (!this.gameRunning && this.gameRunning !== null) {
            this.drawCenteredText('PAUSED', this.canvas.height / 2 - 20, '36px Arial');
            this.drawCenteredText('Press SPACE to Resume', this.canvas.height / 2 + 20, '18px Arial');
        } else if (this.gameOver) {
            this.drawCenteredText('GAME OVER', this.canvas.height / 2 - 40, '36px Arial');
            this.drawCenteredText(`Final Score: ${this.score}`, this.canvas.height / 2 - 5, '20px Arial');
            if (this.score === this.highScore && this.score > 0) {
                this.drawCenteredText('NEW HIGH SCORE!', this.canvas.height / 2 + 25, '18px Arial');
            }
            this.drawCenteredText('Press SPACE or Click to Play Again', this.canvas.height / 2 + 50, '16px Arial');
        }
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
        // Remove event listeners would go here in a production version
    }
}

// Initialize game when script loads
if (typeof window !== 'undefined') {
    window.SnakeGame = SnakeGame;
}