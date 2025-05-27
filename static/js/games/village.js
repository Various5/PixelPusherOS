/**
 * Village Builder Game - Enhanced Version
 * Beautiful idle/clicker game with animations and polish
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
            huts: {
                cost: 10,
                population: 2,
                goldPerSecond: 0,
                icon: '🛖',
                color: '#8B4513',
                description: 'Houses for villagers'
            },
            farms: {
                cost: 25,
                population: 1,
                goldPerSecond: 1,
                icon: '🌾',
                color: '#228B22',
                description: 'Produces food and gold'
            },
            mines: {
                cost: 50,
                population: 0,
                goldPerSecond: 3,
                icon: '⛏️',
                color: '#696969',
                description: 'Generates gold faster'
            },
            castles: {
                cost: 100,
                population: 5,
                goldPerSecond: 5,
                icon: '🏰',
                color: '#4B0082',
                description: 'Prestigious buildings'
            }
        };

        // Visual state
        this.buttons = [];
        this.particles = [];
        this.clouds = [];
        this.buildings3D = [];
        this.lastUpdate = Date.now();
        this.animationTime = 0;

        // Game metrics
        this.totalGoldEarned = 0;
        this.totalBuildings = 0;
        this.startTime = Date.now();

        this.init();
    }

    init() {
        // Set canvas size
        this.canvas.width = 900;
        this.canvas.height = 650;

        // Create UI buttons
        this.createButtons();

        // Initialize clouds
        this.initializeClouds();

        // Set up event handlers
        this.setupEventHandlers();

        // Start game loop
        this.startGame();
    }

    initializeClouds() {
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: 30 + Math.random() * 100,
                width: 60 + Math.random() * 40,
                speed: 0.2 + Math.random() * 0.3,
                opacity: 0.3 + Math.random() * 0.3
            });
        }
    }

    createButtons() {
        const buttonY = 480;
        const buttonWidth = 180;
        const buttonHeight = 100;
        const buttonGap = 20;

        let x = 90;

        Object.entries(this.buildingData).forEach(([type, data]) => {
            this.buttons.push({
                type: type,
                x: x,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight,
                text: this.capitalize(type),
                icon: data.icon,
                baseColor: data.color,
                hover: false,
                pressed: false,
                scale: 1,
                glowIntensity: 0
            });
            x += buttonWidth + buttonGap;
        });
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    setupEventHandlers() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            this.handleClick(x, y);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            this.handleMouseMove(x, y);
        });

        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            this.handleMouseDown(x, y);
        });

        this.canvas.addEventListener('mouseup', () => {
            this.handleMouseUp();
        });
    }

    handleClick(x, y) {
        // Check button clicks
        for (let button of this.buttons) {
            if (x >= button.x && x <= button.x + button.width &&
                y >= button.y && y <= button.y + button.height) {

                this.buildBuilding(button.type);

                // Button animation
                button.scale = 0.9;
                setTimeout(() => { button.scale = 1; }, 200);

                break;
            }
        }

        // Create click particle effect for gold collection
        if (y < 400) {
            this.createParticle(x, y, '+1 Gold', '#FFD700', 1.5);
            this.gold += 1;
        }
    }

    handleMouseMove(x, y) {
        // Update button hover states
        let hoveringButton = false;

        for (let button of this.buttons) {
            const wasHovering = button.hover;
            button.hover = x >= button.x && x <= button.x + button.width &&
                          y >= button.y && y <= button.y + button.height;

            if (button.hover) {
                hoveringButton = true;
                this.canvas.style.cursor = 'pointer';

                // Animate glow on hover
                if (!wasHovering) {
                    button.glowIntensity = 0;
                }
            }
        }

        if (!hoveringButton) {
            this.canvas.style.cursor = 'default';
        }
    }

    handleMouseDown(x, y) {
        for (let button of this.buttons) {
            if (x >= button.x && x <= button.x + button.width &&
                y >= button.y && y <= button.y + button.height) {
                button.pressed = true;
            }
        }
    }

    handleMouseUp() {
        for (let button of this.buttons) {
            button.pressed = false;
        }
    }

    buildBuilding(type) {
        const data = this.buildingData[type];

        if (this.gold >= data.cost) {
            this.gold -= data.cost;
            this.buildings[type]++;
            this.population += data.population;
            this.totalBuildings++;

            // Add 3D building to scene
            this.add3DBuilding(type);

            // Increase cost for next building
            this.buildingData[type].cost = Math.floor(data.cost * 1.15);

            // Create success particles
            const button = this.buttons.find(b => b.type === type);
            if (button) {
                this.createBurstParticles(
                    button.x + button.width / 2,
                    button.y + button.height / 2,
                    data.icon,
                    10
                );
            }

            // Play success sound effect (visual feedback)
            this.createSuccessWave(button.x + button.width / 2, button.y + button.height / 2);
        } else {
            // Shake effect for insufficient funds
            const button = this.buttons.find(b => b.type === type);
            if (button) {
                this.shakeButton(button);
                this.createParticle(
                    button.x + button.width / 2,
                    button.y,
                    'Not enough gold!',
                    '#ff4444',
                    2
                );
            }
        }
    }

    add3DBuilding(type) {
        const data = this.buildingData[type];
        const gridSize = 60;
        const row = Math.floor(this.buildings3D.length / 10);
        const col = this.buildings3D.length % 10;

        this.buildings3D.push({
            type: type,
            x: 100 + col * gridSize,
            y: 200 + row * 40 - (type === 'castles' ? 20 : 0),
            z: row * 0.1,
            scale: 0,
            targetScale: 1,
            rotation: Math.random() * 0.2 - 0.1,
            floatOffset: Math.random() * Math.PI * 2,
            icon: data.icon
        });
    }

    shakeButton(button) {
        const originalX = button.x;
        let shakeCount = 0;
        const shakeInterval = setInterval(() => {
            button.x = originalX + (Math.random() - 0.5) * 10;
            shakeCount++;
            if (shakeCount > 10) {
                clearInterval(shakeInterval);
                button.x = originalX;
            }
        }, 50);
    }

    createSuccessWave(x, y) {
        this.particles.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: 100,
            opacity: 0.5,
            color: '#00ff00',
            type: 'wave'
        });
    }

    createParticle(x, y, text, color, duration = 1) {
        this.particles.push({
            x: x,
            y: y,
            text: text,
            color: color,
            life: duration,
            maxLife: duration,
            velocityY: -2,
            velocityX: (Math.random() - 0.5) * 2,
            scale: 1,
            type: 'text'
        });
    }

    createBurstParticles(x, y, icon, count) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const speed = 3 + Math.random() * 2;

            this.particles.push({
                x: x,
                y: y,
                text: icon,
                color: '#FFD700',
                life: 1,
                maxLife: 1,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed - 2,
                scale: 0.5 + Math.random() * 0.5,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3,
                type: 'burst'
            });
        }
    }

    startGame() {
        this.gameLoop();
    }

    gameLoop() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        this.animationTime += deltaTime;

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
        const goldEarned = goldPerSecond * deltaTime;
        this.gold += goldEarned;
        this.totalGoldEarned += goldEarned;

        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > this.canvas.width + cloud.width) {
                cloud.x = -cloud.width;
                cloud.y = 30 + Math.random() * 100;
            }
        });

        // Update 3D buildings
        this.buildings3D.forEach(building => {
            if (building.scale < building.targetScale) {
                building.scale += deltaTime * 3;
                if (building.scale > building.targetScale) {
                    building.scale = building.targetScale;
                }
            }
        });

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            if (particle.type === 'text' || particle.type === 'burst') {
                particle.x += particle.velocityX;
                particle.y += particle.velocityY;
                particle.life -= deltaTime;

                if (particle.type === 'burst') {
                    particle.velocityY += 15 * deltaTime; // gravity
                    particle.rotation += particle.rotationSpeed;
                }

                if (particle.life <= 0) {
                    this.particles.splice(i, 1);
                }
            } else if (particle.type === 'wave') {
                particle.radius += 200 * deltaTime;
                particle.opacity -= deltaTime;

                if (particle.opacity <= 0) {
                    this.particles.splice(i, 1);
                }
            }
        }

        // Update button animations
        this.buttons.forEach(button => {
            if (button.hover && button.glowIntensity < 1) {
                button.glowIntensity += deltaTime * 5;
                if (button.glowIntensity > 1) button.glowIntensity = 1;
            } else if (!button.hover && button.glowIntensity > 0) {
                button.glowIntensity -= deltaTime * 5;
                if (button.glowIntensity < 0) button.glowIntensity = 0;
            }
        });
    }

    draw() {
        // Create gradient sky
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#98D8E8');
        gradient.addColorStop(1, '#C0E8D5');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw sun
        this.drawSun();

        // Draw clouds
        this.drawClouds();

        // Draw ground with gradient
        const groundGradient = this.ctx.createLinearGradient(0, 350, 0, this.canvas.height);
        groundGradient.addColorStop(0, '#7CFC00');
        groundGradient.addColorStop(0.5, '#228B22');
        groundGradient.addColorStop(1, '#006400');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, 350, this.canvas.width, 300);

        // Draw village in 3D perspective
        this.drawVillage3D();

        // Draw UI background
        this.drawUIBackground();

        // Draw buttons
        this.drawButtons();

        // Draw stats
        this.drawStats();

        // Draw particles
        this.drawParticles();
    }

    drawSun() {
        const sunX = 100;
        const sunY = 80;
        const sunRadius = 40;

        // Sun glow
        const glowGradient = this.ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2);
        glowGradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
        glowGradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.3)');
        glowGradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        this.ctx.fillStyle = glowGradient;
        this.ctx.fillRect(0, 0, 300, 200);

        // Sun body
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Animated rays
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i + this.animationTime * 0.5;
            const x1 = sunX + Math.cos(angle) * (sunRadius + 10);
            const y1 = sunY + Math.sin(angle) * (sunRadius + 10);
            const x2 = sunX + Math.cos(angle) * (sunRadius + 25);
            const y2 = sunY + Math.sin(angle) * (sunRadius + 25);

            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }
    }

    drawClouds() {
        this.ctx.save();
        this.clouds.forEach(cloud => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;

            // Draw cloud with multiple circles
            for (let i = 0; i < 3; i++) {
                const offsetX = i * 25 - 25;
                const offsetY = Math.sin(i) * 10;
                this.ctx.beginPath();
                this.ctx.arc(
                    cloud.x + offsetX,
                    cloud.y + offsetY,
                    cloud.width / 3,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            }
        });
        this.ctx.restore();
    }

    drawVillage3D() {
        // Sort buildings by Z-depth for proper rendering
        const sortedBuildings = [...this.buildings3D].sort((a, b) => a.z - b.z);

        sortedBuildings.forEach(building => {
            const floatY = Math.sin(this.animationTime * 2 + building.floatOffset) * 2;
            const x = building.x;
            const y = building.y + floatY;
            const scale = building.scale;

            // Shadow
            this.ctx.save();
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.ellipse(x, y + 30 * scale, 25 * scale, 10 * scale, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();

            // Building
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(building.rotation);
            this.ctx.scale(scale, scale);
            this.ctx.font = `${40}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Add glow effect
            this.ctx.shadowColor = this.buildingData[building.type].color;
            this.ctx.shadowBlur = 10;

            this.ctx.fillText(building.icon, 0, 0);
            this.ctx.restore();
        });
    }

    drawUIBackground() {
        // Main UI panel with gradient
        const uiGradient = this.ctx.createLinearGradient(0, 440, 0, this.canvas.height);
        uiGradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
        uiGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
        this.ctx.fillStyle = uiGradient;
        this.ctx.fillRect(0, 440, this.canvas.width, 210);

        // Decorative border
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 440);
        this.ctx.lineTo(this.canvas.width, 440);
        this.ctx.stroke();
    }

    drawButtons() {
        this.buttons.forEach(button => {
            const data = this.buildingData[button.type];
            const canAfford = this.gold >= data.cost;

            // Button shadow
            if (button.hover) {
                this.ctx.save();
                this.ctx.shadowColor = data.color;
                this.ctx.shadowBlur = 20 * button.glowIntensity;
                this.ctx.shadowOffsetX = 0;
                this.ctx.shadowOffsetY = 5;
            }

            // Button background with gradient
            const bgGradient = this.ctx.createLinearGradient(
                button.x, button.y,
                button.x, button.y + button.height
            );

            if (canAfford) {
                if (button.pressed) {
                    bgGradient.addColorStop(0, this.darkenColor(data.color, 20));
                    bgGradient.addColorStop(1, this.darkenColor(data.color, 40));
                } else if (button.hover) {
                    bgGradient.addColorStop(0, this.lightenColor(data.color, 20));
                    bgGradient.addColorStop(1, data.color);
                } else {
                    bgGradient.addColorStop(0, data.color);
                    bgGradient.addColorStop(1, this.darkenColor(data.color, 20));
                }
            } else {
                bgGradient.addColorStop(0, '#444444');
                bgGradient.addColorStop(1, '#222222');
            }

            this.ctx.fillStyle = bgGradient;
            this.ctx.fillRect(
                button.x - (button.scale - 1) * button.width / 2,
                button.y - (button.scale - 1) * button.height / 2,
                button.width * button.scale,
                button.height * button.scale
            );

            // Button border
            this.ctx.strokeStyle = canAfford ? '#FFD700' : '#666666';
            this.ctx.lineWidth = button.hover ? 3 : 2;
            this.ctx.strokeRect(
                button.x - (button.scale - 1) * button.width / 2,
                button.y - (button.scale - 1) * button.height / 2,
                button.width * button.scale,
                button.height * button.scale
            );

            if (button.hover) {
                this.ctx.restore();
            }

            // Icon
            this.ctx.save();
            this.ctx.translate(button.x + button.width / 2, button.y + 25);
            this.ctx.scale(button.scale, button.scale);
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = canAfford ? '#ffffff' : '#999999';
            this.ctx.fillText(data.icon, 0, 0);
            this.ctx.restore();

            // Title
            this.ctx.fillStyle = canAfford ? '#ffffff' : '#999999';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(button.text, button.x + button.width / 2, button.y + 55);

            // Cost
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = canAfford ? '#FFD700' : '#666666';
            this.ctx.fillText(`Cost: ${data.cost} Gold`, button.x + button.width / 2, button.y + 75);

            // Count owned
            if (this.buildings[button.type] > 0) {
                this.ctx.fillStyle = '#00FF00';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.fillText(`Owned: ${this.buildings[button.type]}`, button.x + button.width / 2, button.y + 90);
            }
        });
    }

    drawStats() {
        // Stats background panel
        const panelX = 20;
        const panelY = 20;
        const panelWidth = 300;
        const panelHeight = 120;

        // Panel with gradient
        const panelGradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
        panelGradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        panelGradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        this.ctx.fillStyle = panelGradient;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

        // Panel border
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Gold counter with icon
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('💰', panelX + 15, panelY + 35);
        this.ctx.fillText(`${Math.floor(this.gold)}`, panelX + 50, panelY + 35);

        // Population with icon
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText('👥', panelX + 15, panelY + 65);
        this.ctx.fillText(`${this.population}`, panelX + 50, panelY + 65);

        // Gold per second
        let goldPerSecond = 0;
        goldPerSecond += this.buildings.farms * this.buildingData.farms.goldPerSecond;
        goldPerSecond += this.buildings.mines * this.buildingData.mines.goldPerSecond;
        goldPerSecond += this.buildings.castles * this.buildingData.castles.goldPerSecond;

        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`⚡ ${goldPerSecond.toFixed(1)} gold/sec`, panelX + 15, panelY + 95);

        // Achievement notification area
        const timePlayed = Math.floor((Date.now() - this.startTime) / 1000);
        if (timePlayed % 60 === 0 && timePlayed > 0) {
            this.createParticle(
                this.canvas.width / 2,
                100,
                `🏆 ${Math.floor(timePlayed / 60)} minutes played!`,
                '#FFD700',
                3
            );
        }
    }

    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();

            if (particle.type === 'text') {
                const alpha = particle.life / particle.maxLife;
                this.ctx.globalAlpha = alpha;
                this.ctx.fillStyle = particle.color;
                this.ctx.font = `bold ${16 * particle.scale}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(particle.text, particle.x, particle.y);
            } else if (particle.type === 'burst') {
                const alpha = particle.life / particle.maxLife;
                this.ctx.globalAlpha = alpha;
                this.ctx.translate(particle.x, particle.y);
                this.ctx.rotate(particle.rotation);
                this.ctx.scale(particle.scale, particle.scale);
                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillStyle = particle.color;
                this.ctx.fillText(particle.text, 0, 0);
            } else if (particle.type === 'wave') {
                this.ctx.globalAlpha = particle.opacity;
                this.ctx.strokeStyle = particle.color;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            this.ctx.restore();
        });
    }

    // Color utility functions
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R > 0 ? R : 0) * 0x10000 +
            (G > 0 ? G : 0) * 0x100 +
            (B > 0 ? B : 0)).toString(16).slice(1);
    }

    destroy() {
        this.canvas.style.cursor = 'default';
    }
}

// Make available globally
window.VillageBuilderGame = VillageBuilderGame;