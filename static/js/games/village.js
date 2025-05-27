/**
 * Village Builder Game
 * Simple clicker/idle game where you build a village
 */

class VillageBuilderGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // Game state
        this.gold = 100;
        this.population = 0;
        this.buildings = {
            huts: 0,
            farms: 0,
            mines: 0,
            castles: 0
        };

        // Building costs and benefits
        this.buildingData = {
            huts: { cost: 10, population: 2, goldPerSecond: 0 },
            farms: { cost: 25, population: 1, goldPerSecond: 1 },
            mines: { cost: 50, population: 0, goldPerSecond: 3 },
            castles: { cost: 100, population: 5, goldPerSecond: 5 }
        };

        // UI state
        this.buttons = [];
        this.particles = [];
        this.lastUpdate = Date.now();

        this.init();
    }

    init() {
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;

        // Create UI buttons
        this.createButtons();

        // Set up event handlers
        this.setupEventHandlers();

        // Start game loop
        this.startGame();
    }

    createButtons() {
        const buttonY = 450;
        const buttonWidth = 150;
        const buttonHeight = 40;
        const buttonGap = 20;

        let x = 100;

        // Hut button
        this.buttons.push({
            type: 'huts',
            x: x,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
            text: 'Build Hut',
            icon: '🛖'
        });
        x += buttonWidth + buttonGap;

        // Farm button
        this.buttons.push({
            type: 'farms',
            x: x,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
            text: 'Build Farm',
            icon: '🌾'
        });
        x += buttonWidth + buttonGap;

        // Mine button
        this.buttons.push({
            type: 'mines',
            x: x,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
            text: 'Build Mine',
            icon: '⛏️'
        });
        x += buttonWidth + buttonGap;

        // Castle button
        this.buttons.push({
            type: 'castles',
            x: x,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
            text: 'Build Castle',
            icon: '🏰'
        });
    }

    setupEventHandlers() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.handleClick(x, y);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.handleMouseMove(x, y);
        });
    }

    handleClick(x, y) {
        // Check button clicks
        for (let button of this.buttons) {
            if (x >= button.x && x <= button.x + button.width &&
                y >= button.y && y <= button.y + button.height) {

                this.buildBuilding(button.type);
                break;
            }
        }

        // Create click particle effect
        this.createParticle(x, y, '+1', '#ffff00');
    }

    handleMouseMove(x, y) {
        // Update cursor style for buttons
        let hoveringButton = false;

        for (let button of this.buttons) {
            if (x >= button.x && x <= button.x + button.width &&
                y >= button.y && y <= button.y + button.height) {

                button.hover = true;
                hoveringButton = true;
                this.canvas.style.cursor = 'pointer';
            } else {
                button.hover = false;
            }
        }

        if (!hoveringButton) {
            this.canvas.style.cursor = 'default';
        }
    }

    buildBuilding(type) {
        const data = this.buildingData[type];

        if (this.gold >= data.cost) {
            this.gold -= data.cost;
            this.buildings[type]++;
            this.population += data.population;

            // Increase cost for next building
            this.buildingData[type].cost = Math.floor(data.cost * 1.2);

            // Create particle effect
            const button = this.buttons.find(b => b.type === type);
            if (button) {
                this.createParticle(button.x + button.width / 2, button.y, `-${data.cost}`, '#ff0000');
            }
        }
    }

    createParticle(x, y, text, color) {
        this.particles.push({
            x: x,
            y: y,
            text: text,
            color: color,
            life: 1,
            velocityY: -2
        });
    }

    startGame() {
        this.gameLoop();
    }

    gameLoop() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        // Calculate gold per second
        let goldPerSecond = 0;
        goldPerSecond += this.buildings.farms * this.buildingData.farms.goldPerSecond;
        goldPerSecond += this.buildings.mines * this.buildingData.mines.goldPerSecond;
        goldPerSecond += this.buildings.castles * this.buildingData.castles.goldPerSecond;

        // Add gold
        this.gold += goldPerSecond * deltaTime;

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.y += particle.velocityY;
            particle.life -= deltaTime * 2;

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#87CEEB'; // Sky blue
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw ground
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, 350, this.canvas.width, 250);

        // Draw village
        this.drawVillage();

        // Draw UI
        this.drawUI();

        // Draw particles
        for (let particle of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(particle.text, particle.x, particle.y);
            this.ctx.restore();
        }
    }

    drawVillage() {
        let x = 50;
        let y = 300;

        // Draw huts
        for (let i = 0; i < this.buildings.huts; i++) {
            this.ctx.font = '30px Arial';
            this.ctx.fillText('🛖', x, y);
            x += 40;
            if (x > 700) {
                x = 50;
                y -= 40;
            }
        }

        // Draw farms
        x = 50;
        y = 250;
        for (let i = 0; i < this.buildings.farms; i++) {
            this.ctx.font = '30px Arial';
            this.ctx.fillText('🌾', x, y);
            x += 40;
            if (x > 700) {
                x = 50;
                y -= 40;
            }
        }

        // Draw mines
        x = 50;
        y = 200;
        for (let i = 0; i < this.buildings.mines; i++) {
            this.ctx.font = '30px Arial';
            this.ctx.fillText('⛏️', x, y);
            x += 40;
            if (x > 700) {
                x = 50;
                y -= 40;
            }
        }

        // Draw castles
        x = 300;
        y = 150;
        for (let i = 0; i < this.buildings.castles; i++) {
            this.ctx.font = '40px Arial';
            this.ctx.fillText('🏰', x, y);
            x += 60;
        }
    }

    drawUI() {
        // Draw stats background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, 80);

        // Draw stats
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText(`💰 Gold: ${Math.floor(this.gold)}`, 20, 30);
        this.ctx.fillText(`👥 Population: ${this.population}`, 20, 60);

        // Calculate gold per second
        let goldPerSecond = 0;
        goldPerSecond += this.buildings.farms * this.buildingData.farms.goldPerSecond;
        goldPerSecond += this.buildings.mines * this.buildingData.mines.goldPerSecond;
        goldPerSecond += this.buildings.castles * this.buildingData.castles.goldPerSecond;

        this.ctx.fillText(`⚡ Gold/sec: ${goldPerSecond}`, 300, 30);

        // Draw buttons
        for (let button of this.buttons) {
            const data = this.buildingData[button.type];
            const canAfford = this.gold >= data.cost;

            // Button background
            if (button.hover && canAfford) {
                this.ctx.fillStyle = '#4CAF50';
            } else if (canAfford) {
                this.ctx.fillStyle = '#45a049';
            } else {
                this.ctx.fillStyle = '#666666';
            }

            this.ctx.fillRect(button.x, button.y, button.width, button.height);

            // Button border
            this.ctx.strokeStyle = '#333333';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(button.x, button.y, button.width, button.height);

            // Button text
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Icon and text
            this.ctx.fillText(
                `${button.icon} ${button.text}`,
                button.x + button.width / 2,
                button.y + button.height / 2 - 10
            );

            // Cost
            this.ctx.font = '12px Arial';
            this.ctx.fillText(
                `Cost: ${data.cost}`,
                button.x + button.width / 2,
                button.y + button.height / 2 + 10
            );

            // Reset text align
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'alphabetic';
        }

        // Draw building counts
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Buildings: Huts: ${this.buildings.huts}, Farms: ${this.buildings.farms}, Mines: ${this.buildings.mines}, Castles: ${this.buildings.castles}`, 20, 550);
    }

    destroy() {
        // Clean up event listeners if needed
        this.canvas.style.cursor = 'default';
    }
}

// Make available globally
window.VillageBuilderGame = VillageBuilderGame;