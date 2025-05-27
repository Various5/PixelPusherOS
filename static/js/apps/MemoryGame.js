/**
 * Memory Match Game - Individual Game Script
 * Card matching memory game with animated flips
 */

class MemoryGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.canvas.width = 600;
        this.canvas.height = 500;

        // Game settings
        this.gridSize = 4; // 4x4 grid = 16 cards
        this.cardWidth = 80;
        this.cardHeight = 100;
        this.cardSpacing = 20;
        this.animationSpeed = 8;

        // Game state
        this.gameStarted = false;
        this.gameWon = false;
        this.moves = 0;
        this.matches = 0;
        this.startTime = null;
        this.endTime = null;

        // Cards
        this.cards = [];
        this.flippedCards = [];
        this.matchedCards = [];

        // Animation
        this.animatingCards = [];

        // Card symbols/emojis
        this.symbols = ['🎮', '🚀', '⭐', '💎', '🔥', '⚡', '🌟', '🎯'];

        // Colors
        this.colors = {
            background: '#0a0a0a',
            cardBack: '#1a1a2e',
            cardFront: '#ffffff',
            cardBorder: '#00d9ff',
            text: '#ffffff',
            matched: '#00ff41',
            flipped: '#ffaa00'
        };

        this.setupGame();
        this.setupControls();
        this.render();
    }

    setupGame() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedCards = [];
        this.animatingCards = [];
        this.moves = 0;
        this.matches = 0;
        this.gameStarted = false;
        this.gameWon = false;
        this.startTime = null;
        this.endTime = null;

        // Create card pairs
        const cardSymbols = [];
        for (let i = 0; i < (this.gridSize * this.gridSize) / 2; i++) {
            cardSymbols.push(this.symbols[i]);
            cardSymbols.push(this.symbols[i]);
        }

        // Shuffle cards
        this.shuffleArray(cardSymbols);

        // Create card objects
        const startX = (this.canvas.width - (this.gridSize * (this.cardWidth + this.cardSpacing) - this.cardSpacing)) / 2;
        const startY = 80;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const index = row * this.gridSize + col;
                this.cards.push({
                    id: index,
                    symbol: cardSymbols[index],
                    x: startX + col * (this.cardWidth + this.cardSpacing),
                    y: startY + row * (this.cardHeight + this.cardSpacing),
                    flipped: false,
                    matched: false,
                    flipAnimation: 0
                });
            }
        }
    }

    setupControls() {
        this.canvas.addEventListener('click', (e) => {
            if (!this.gameStarted) {
                this.startGame();
                return;
            }

            if (this.gameWon) {
                this.setupGame();
                return;
            }

            this.handleClick(e);
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                if (!this.gameStarted || this.gameWon) {
                    this.setupGame();
                    if (!this.gameStarted) this.startGame();
                }
                e.preventDefault();
            }
        });
    }

    startGame() {
        this.gameStarted = true;
        this.startTime = Date.now();
        this.render();
    }

    handleClick(e) {
        if (this.animatingCards.length > 0) return;
        if (this.flippedCards.length >= 2) return;

        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Find clicked card
        for (const card of this.cards) {
            if (clickX >= card.x && clickX <= card.x + this.cardWidth &&
                clickY >= card.y && clickY <= card.y + this.cardHeight) {

                if (!card.flipped && !card.matched) {
                    this.flipCard(card);
                    break;
                }
            }
        }
    }

    flipCard(card) {
        card.flipped = true;
        card.flipAnimation = 0;
        this.flippedCards.push(card);
        this.animatingCards.push(card);

        // Start flip animation
        this.animateCardFlip(card, () => {
            this.animatingCards = this.animatingCards.filter(c => c.id !== card.id);

            if (this.flippedCards.length === 2) {
                setTimeout(() => this.checkMatch(), 500);
            }
        });
    }

    animateCardFlip(card, callback) {
        const animate = () => {
            card.flipAnimation += this.animationSpeed;

            if (card.flipAnimation >= 90) {
                card.flipAnimation = 90;
                callback();
            } else {
                this.render();
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    checkMatch() {
        this.moves++;

        const [card1, card2] = this.flippedCards;

        if (card1.symbol === card2.symbol) {
            // Match found
            card1.matched = true;
            card2.matched = true;
            this.matchedCards.push(card1, card2);
            this.matches++;

            // Check if game is won
            if (this.matches === (this.gridSize * this.gridSize) / 2) {
                this.endTime = Date.now();
                this.gameWon = true;
            }
        } else {
            // No match - flip cards back
            setTimeout(() => {
                card1.flipped = false;
                card2.flipped = false;
                card1.flipAnimation = 0;
                card2.flipAnimation = 0;
                this.render();
            }, 1000);
        }

        this.flippedCards = [];
        this.render();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw title
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 28px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('MEMORY MATCH', this.canvas.width / 2, 40);

        // Draw stats
        if (this.gameStarted) {
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`Moves: ${this.moves}`, 20, 470);
            this.ctx.fillText(`Matches: ${this.matches}/${(this.gridSize * this.gridSize) / 2}`, 150, 470);

            if (this.startTime) {
                const currentTime = this.endTime || Date.now();
                const elapsed = Math.floor((currentTime - this.startTime) / 1000);
                this.ctx.textAlign = 'right';
                this.ctx.fillText(`Time: ${elapsed}s`, this.canvas.width - 20, 470);
            }
        }

        // Draw cards
        for (const card of this.cards) {
            this.drawCard(card);
        }

        // Draw game state messages
        if (!this.gameStarted) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('MEMORY MATCH', this.canvas.width / 2, this.canvas.height / 2 - 60);

            this.ctx.font = '18px Arial';
            this.ctx.fillText('Click to Start', this.canvas.width / 2, this.canvas.height / 2 - 20);
            this.ctx.fillText('Match all pairs by flipping cards', this.canvas.width / 2, this.canvas.height / 2 + 10);
            this.ctx.fillText('Remember the positions!', this.canvas.width / 2, this.canvas.height / 2 + 40);
        } else if (this.gameWon) {
            this.ctx.fillStyle = 'rgba(0, 255, 65, 0.9)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CONGRATULATIONS!', this.canvas.width / 2, this.canvas.height / 2 - 60);

            this.ctx.font = '20px Arial';
            this.ctx.fillText(`You won in ${this.moves} moves!`, this.canvas.width / 2, this.canvas.height / 2 - 20);

            if (this.endTime && this.startTime) {
                const totalTime = Math.floor((this.endTime - this.startTime) / 1000);
                this.ctx.fillText(`Time: ${totalTime} seconds`, this.canvas.width / 2, this.canvas.height / 2 + 10);
            }

            this.ctx.font = '16px Arial';
            this.ctx.fillText('Click to Play Again', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
    }

    drawCard(card) {
        const x = card.x;
        const y = card.y;

        // Calculate flip animation
        const flipProgress = card.flipAnimation / 90;
        const scaleX = Math.cos(flipProgress * Math.PI / 2);

        this.ctx.save();
        this.ctx.translate(x + this.cardWidth / 2, y + this.cardHeight / 2);
        this.ctx.scale(Math.abs(scaleX), 1);
        this.ctx.translate(-this.cardWidth / 2, -this.cardHeight / 2);

        // Determine card color
        let cardColor = this.colors.cardBack;
        let borderColor = this.colors.cardBorder;

        if (card.matched) {
            borderColor = this.colors.matched;
        } else if (card.flipped) {
            cardColor = this.colors.cardFront;
            borderColor = this.colors.flipped;
        }

        // Draw card background
        this.ctx.fillStyle = cardColor;
        this.ctx.fillRect(0, 0, this.cardWidth, this.cardHeight);

        // Draw card border
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(0, 0, this.cardWidth, this.cardHeight);

        // Draw card content
        if ((card.flipped || card.matched) && flipProgress > 0.5) {
            // Draw symbol
            this.ctx.font = '36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#000000';
            this.ctx.fillText(
                card.symbol,
                this.cardWidth / 2,
                this.cardHeight / 2
            );
        } else if (!card.flipped && !card.matched) {
            // Draw card back pattern
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 1;

            // Draw grid pattern
            for (let i = 10; i < this.cardWidth; i += 10) {
                this.ctx.beginPath();
                this.ctx.moveTo(i, 5);
                this.ctx.lineTo(i, this.cardHeight - 5);
                this.ctx.stroke();
            }
            for (let i = 10; i < this.cardHeight; i += 10) {
                this.ctx.beginPath();
                this.ctx.moveTo(5, i);
                this.ctx.lineTo(this.cardWidth - 5, i);
                this.ctx.stroke();
            }

            // Draw center symbol
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#00d9ff';
            this.ctx.fillText('?', this.cardWidth / 2, this.cardHeight / 2);
        }

        this.ctx.restore();

        // Add glow effect for matched cards
        if (card.matched) {
            this.ctx.shadowColor = this.colors.matched;
            this.ctx.shadowBlur = 10;
            this.ctx.strokeStyle = this.colors.matched;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x, y, this.cardWidth, this.cardHeight);
            this.ctx.shadowBlur = 0;
        }
    }

    destroy() {
        // Cleanup if needed
    }
}

// Initialize game when script loads
if (typeof window !== 'undefined') {
    window.MemoryGame = MemoryGame;
}