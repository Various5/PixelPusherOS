/**
 * Tetris Game (CyberBlocks) - Individual Game Script
 * Modern Tetris implementation with neon aesthetics
 */

class TetrisGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.canvas.width = 400;
        this.canvas.height = 600;

        // Game board
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));

        // Game state
        this.gameRunning = false;
        this.gameOver = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropTime = 0;
        this.dropInterval = 1000;

        // Current piece
        this.currentPiece = null;
        this.nextPiece = null;

        // Tetris pieces (tetrominoes)
        this.pieces = {
            I: { shape: [[1,1,1,1]], color: '#00ffff' },
            O: { shape: [[1,1],[1,1]], color: '#ffff00' },
            T: { shape: [[0,1,0],[1,1,1]], color: '#ff00ff' },
            S: { shape: [[0,1,1],[1,1,0]], color: '#00ff00' },
            Z: { shape: [[1,1,0],[0,1,1]], color: '#ff0000' },
            J: { shape: [[1,0,0],[1,1,1]], color: '#0000ff' },
            L: { shape: [[0,0,1],[1,1,1]], color: '#ff7f00' }
        };

        this.pieceTypes = Object.keys(this.pieces);

        this.setupControls();
        this.reset();
        this.render();
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning) {
                if (e.code === 'Space') {
                    this.startGame();
                    return;
                }
                return;
            }

            if (this.gameOver) {
                if (e.code === 'Space') {
                    this.reset();
                    this.startGame();
                }
                return;
            }

            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.movePiece(-1, 0);
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.movePiece(1, 0);
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.movePiece(0, 1);
                    e.preventDefault();
                    break;
                case 'ArrowUp':
                case 'KeyW':
                case 'Space':
                    this.rotatePiece();
                    e.preventDefault();
                    break;
                case 'KeyP':
                    this.togglePause();
                    e.preventDefault();
                    break;
            }
        });

        // Touch/click controls
        this.canvas.addEventListener('click', () => {
            if (!this.gameRunning && !this.gameOver) {
                this.startGame();
            } else if (this.gameOver) {
                this.reset();
                this.startGame();
            } else if (this.gameRunning) {
                this.rotatePiece();
            }
        });
    }

    reset() {
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropTime = 0;
        this.dropInterval = 1000;
        this.gameRunning = false;
        this.gameOver = false;
        this.currentPiece = this.generatePiece();
        this.nextPiece = this.generatePiece();
    }

    startGame() {
        this.gameRunning = true;
        this.gameLoop();
    }

    togglePause() {
        this.gameRunning = !this.gameRunning;
        if (this.gameRunning) {
            this.gameLoop();
        }
    }

    generatePiece() {
        const type = this.pieceTypes[Math.floor(Math.random() * this.pieceTypes.length)];
        const pieceData = this.pieces[type];

        return {
            type: type,
            shape: pieceData.shape,
            color: pieceData.color,
            x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(pieceData.shape[0].length / 2),
            y: 0
        };
    }

    gameLoop() {
        if (!this.gameRunning) return;

        const now = Date.now();

        if (now - this.dropTime > this.dropInterval) {
            this.dropPiece();
            this.dropTime = now;
        }

        this.render();

        if (this.gameRunning && !this.gameOver) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    dropPiece() {
        if (this.canMove(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
        } else {
            this.placePiece();
            this.clearLines();
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.generatePiece();

            // Check game over
            if (!this.canPlace(this.currentPiece)) {
                this.gameOver = true;
                this.gameRunning = false;
            }
        }
    }

    movePiece(dx, dy) {
        if (this.canMove(this.currentPiece, dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            this.render();
        }
    }

    rotatePiece() {
        const rotated = this.rotatePieceData(this.currentPiece);
        if (this.canPlace(rotated)) {
            this.currentPiece = rotated;
            this.render();
        }
    }

    rotatePieceData(piece) {
        const rotated = {
            ...piece,
            shape: piece.shape[0].map((_, i) =>
                piece.shape.map(row => row[i]).reverse()
            )
        };
        return rotated;
    }

    canMove(piece, dx, dy) {
        return this.canPlace({
            ...piece,
            x: piece.x + dx,
            y: piece.y + dy
        });
    }

    canPlace(piece) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardX = piece.x + x;
                    const boardY = piece.y + y;

                    if (boardX < 0 || boardX >= this.BOARD_WIDTH ||
                        boardY >= this.BOARD_HEIGHT ||
                        (boardY >= 0 && this.board[boardY][boardX])) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    placePiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardX = this.currentPiece.x + x;
                    const boardY = this.currentPiece.y + y;

                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;

        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++; // Check the same line again
            }
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += this.calculateScore(linesCleared);
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
        }
    }

    calculateScore(lines) {
        const baseScores = [0, 100, 300, 500, 800];
        return baseScores[lines] * this.level;
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw board background
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= this.BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * this.BLOCK_SIZE, this.BOARD_HEIGHT * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.BLOCK_SIZE);
            this.ctx.lineTo(this.BOARD_WIDTH * this.BLOCK_SIZE, y * this.BLOCK_SIZE);
            this.ctx.stroke();
        }

        // Draw placed pieces
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x]);
                }
            }
        }

        // Draw current piece
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.drawBlock(
                            this.currentPiece.x + x,
                            this.currentPiece.y + y,
                            this.currentPiece.color
                        );
                    }
                }
            }
        }

        // Draw ghost piece
        if (this.currentPiece && this.gameRunning) {
            const ghostPiece = { ...this.currentPiece };
            while (this.canMove(ghostPiece, 0, 1)) {
                ghostPiece.y++;
            }

            this.ctx.globalAlpha = 0.3;
            for (let y = 0; y < ghostPiece.shape.length; y++) {
                for (let x = 0; x < ghostPiece.shape[y].length; x++) {
                    if (ghostPiece.shape[y][x]) {
                        this.drawBlock(
                            ghostPiece.x + x,
                            ghostPiece.y + y,
                            ghostPiece.color
                        );
                    }
                }
            }
            this.ctx.globalAlpha = 1.0;
        }

        // Draw UI
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';

        const uiX = this.BOARD_WIDTH * this.BLOCK_SIZE + 20;
        this.ctx.fillText(`Score: ${this.score}`, uiX, 30);
        this.ctx.fillText(`Level: ${this.level}`, uiX, 55);
        this.ctx.fillText(`Lines: ${this.lines}`, uiX, 80);

        // Draw next piece
        if (this.nextPiece) {
            this.ctx.fillText('Next:', uiX, 120);
            const startX = uiX;
            const startY = 130;

            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        this.ctx.fillStyle = this.nextPiece.color;
                        this.ctx.fillRect(
                            startX + x * 20,
                            startY + y * 20,
                            18,
                            18
                        );
                        this.ctx.strokeStyle = '#fff';
                        this.ctx.strokeRect(
                            startX + x * 20,
                            startY + y * 20,
                            18,
                            18
                        );
                    }
                }
            }
        }

        // Draw game state messages
        if (!this.gameRunning && !this.gameOver) {
            this.drawCenteredText('CYBERBLOCKS', this.canvas.height / 2 - 60, '32px Arial');
            this.drawCenteredText('Press SPACE to Start', this.canvas.height / 2 - 20, '18px Arial');
            this.drawCenteredText('Arrow Keys: Move/Rotate', this.canvas.height / 2 + 10, '14px Arial');
        } else if (this.gameOver) {
            this.drawCenteredText('GAME OVER', this.canvas.height / 2 - 40, '32px Arial');
            this.drawCenteredText(`Final Score: ${this.score}`, this.canvas.height / 2 - 5, '18px Arial');
            this.drawCenteredText('Press SPACE to Play Again', this.canvas.height / 2 + 30, '16px Arial');
        }
    }

    drawBlock(x, y, color) {
        if (x < 0 || x >= this.BOARD_WIDTH || y < 0 || y >= this.BOARD_HEIGHT) return;

        const pixelX = x * this.BLOCK_SIZE;
        const pixelY = y * this.BLOCK_SIZE;

        // Main block
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);

        // Glow effect
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 5;
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
        this.ctx.shadowBlur = 0;

        // Border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(pixelX + 1, pixelY + 1, this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
    }

    drawCenteredText(text, y, font) {
        this.ctx.font = font;
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(text, this.canvas.width / 2, y);
        this.ctx.textAlign = 'left';
    }

    destroy() {
        this.gameRunning = false;
    }
}

// Initialize game when script loads
if (typeof window !== 'undefined') {
    window.TetrisGame = TetrisGame;
}