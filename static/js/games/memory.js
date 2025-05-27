/**
 * Memory Match Game Implementation
 * Classic card matching memory game
 */

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

// Make available globally
window.MemoryGame = MemoryGame;