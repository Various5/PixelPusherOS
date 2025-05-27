/**
 * Fixed Terminal Manager - Working Terminal Implementation
 * Handles terminal functionality with proper input handling and API communication
 */

class TerminalManager {
    constructor() {
        this.terminals = new Map(); // Active terminal instances
        this.commandHistory = [];
        this.maxHistorySize = 100;
        this.currentPath = '/';

        console.log('💻 Terminal Manager initialized');
    }

    /**
     * Initialize terminal system
     */
    async init() {
        try {
            // Load command history from storage
            this.loadCommandHistory();

            // Set up global terminal shortcuts
            this.setupGlobalShortcuts();

            console.log('✅ Terminal system ready');

        } catch (error) {
            console.error('❌ Terminal initialization failed:', error);
        }
    }

    /**
     * Initialize a terminal window
     */
    initializeWindow(appId) {
        const terminalContainer = document.getElementById(`terminal-${appId}`);
        if (!terminalContainer) {
            console.error(`Terminal container not found: ${appId}`);
            return;
        }

        // Create terminal instance
        const terminal = {
            id: appId,
            container: terminalContainer,
            output: null,
            input: null,
            historyIndex: -1,
            currentCommand: '',
            isExecuting: false
        };

        // Create terminal structure if it doesn't exist
        this.createTerminalStructure(terminal);

        // Store terminal instance
        this.terminals.set(appId, terminal);

        // Set up terminal-specific event handlers
        this.setupTerminalEventHandlers(terminal);

        // Apply terminal styling
        this.applyTerminalStyling(terminal);

        // Show welcome message
        this.showWelcomeMessage(terminal);

        // Focus input
        setTimeout(() => {
            if (terminal.input) {
                terminal.input.focus();
            }
        }, 100);

        console.log(`💻 Terminal initialized: ${appId}`);
    }

    /**
     * Create terminal structure if needed
     */
    createTerminalStructure(terminal) {
        if (terminal.container.children.length === 0) {
            terminal.container.innerHTML = `
                <div class="terminal-output" id="terminal-output-${terminal.id}"></div>
                <div class="terminal-input-line">
                    <span class="terminal-prompt">pixel@pusher:~$ </span>
                    <input type="text" class="terminal-input" id="terminal-input-${terminal.id}" 
                           placeholder="Type 'help' for commands..." autocomplete="off" spellcheck="false">
                </div>
            `;
        }

        terminal.output = document.getElementById(`terminal-output-${terminal.id}`);
        terminal.input = document.getElementById(`terminal-input-${terminal.id}`);
    }

    /**
     * Set up event handlers for a terminal instance
     */
    setupTerminalEventHandlers(terminal) {
        if (!terminal.input) return;

        // Handle Enter key (execute command)
        terminal.input.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Enter':
                    e.preventDefault();
                    this.executeCommand(terminal);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateHistory(terminal, 'up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateHistory(terminal, 'down');
                    break;
                case 'Tab':
                    e.preventDefault();
                    this.handleTabCompletion(terminal);
                    break;
            }
        });

        // Handle input changes
        terminal.input.addEventListener('input', () => {
            terminal.currentCommand = terminal.input.value;
        });

        // Handle terminal container clicks (focus input)
        terminal.container.addEventListener('click', () => {
            if (terminal.input) {
                terminal.input.focus();
            }
        });

        // Prevent context menu on terminal
        terminal.container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    /**
     * Apply styling to terminal
     */
    applyTerminalStyling(terminal) {
        // Style terminal container
        terminal.container.style.cssText = `
            font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
            background: #0a0a0a;
            color: #00ff41;
            padding: 15px;
            height: 100%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border-radius: 8px;
        `;

        // Style output area
        if (terminal.output) {
            terminal.output.style.cssText = `
                flex: 1;
                overflow-y: auto;
                margin-bottom: 10px;
                white-space: pre-wrap;
                word-wrap: break-word;
                line-height: 1.4;
                font-size: 14px;
                padding: 5px 0;
            `;

            // Custom scrollbar
            terminal.output.classList.add('terminal-scrollbar');
        }

        // Style input line
        const inputLine = terminal.container.querySelector('.terminal-input-line');
        if (inputLine) {
            inputLine.style.cssText = `
                display: flex;
                align-items: center;
                gap: 5px;
                padding: 5px 0;
                border-top: 1px solid #333;
                flex-shrink: 0;
            `;
        }

        // Style prompt
        const prompt = terminal.container.querySelector('.terminal-prompt');
        if (prompt) {
            prompt.style.cssText = `
                color: #00d9ff;
                font-weight: bold;
                white-space: nowrap;
                user-select: none;
            `;
        }

        // Style input
        if (terminal.input) {
            terminal.input.style.cssText = `
                flex: 1;
                background: transparent;
                border: none;
                outline: none;
                color: #00ff41;
                font-family: inherit;
                font-size: 14px;
                caret-color: #00ff41;
                padding: 2px;
            `;
        }

        // Add terminal scrollbar styles if not already added
        if (!document.getElementById('terminal-scrollbar-styles')) {
            const style = document.createElement('style');
            style.id = 'terminal-scrollbar-styles';
            style.textContent = `
                .terminal-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .terminal-scrollbar::-webkit-scrollbar-track {
                    background: #0a0a0a;
                }
                .terminal-scrollbar::-webkit-scrollbar-thumb {
                    background: #333;
                    border-radius: 4px;
                }
                .terminal-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Show welcome message in terminal
     */
    showWelcomeMessage(terminal) {
        const welcomeMessage = `╔══════════════════════════════════════════════╗
║          🎨 PIXEL PUSHER OS TERMINAL         ║
╠══════════════════════════════════════════════╣
║  Welcome to the Pixel Pusher OS Terminal!   ║
║                                              ║
║  Type 'help' to see available commands      ║
║  Use ↑↓ arrows for command history          ║
║  Use Tab for command completion              ║
║                                              ║
║  Ready for your commands! 🚀                ║
╚══════════════════════════════════════════════╝

`;
        this.appendOutput(terminal, welcomeMessage, 'system');
    }

    /**
     * Execute a command in the terminal
     */
    async executeCommand(terminal) {
        const command = terminal.input.value.trim();

        if (!command) return;

        // Prevent multiple simultaneous executions
        if (terminal.isExecuting) {
            this.appendOutput(terminal, 'Command already executing...', 'error');
            return;
        }

        // Add command to history
        this.addToHistory(command);

        // Reset history navigation
        terminal.historyIndex = -1;

        // Show command in output
        this.appendOutput(terminal, `pixel@pusher:${this.currentPath}$ ${command}`, 'command');

        // Clear input
        terminal.input.value = '';
        terminal.currentCommand = '';

        // Set executing state
        terminal.isExecuting = true;
        this.updatePrompt(terminal, true);

        try {
            // Handle local commands first
            if (this.handleLocalCommand(terminal, command)) {
                return;
            }

            // Execute command via API
            const response = await fetch(`/api/command`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ command: command })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            // Handle different response types
            this.handleCommandResponse(terminal, result);

        } catch (error) {
            console.error('Command execution error:', error);
            this.appendOutput(terminal, `Error: ${error.message}`, 'error');
        } finally {
            // Reset executing state
            terminal.isExecuting = false;
            this.updatePrompt(terminal, false);

            // Focus input for next command
            if (terminal.input) {
                terminal.input.focus();
            }
        }
    }

    /**
     * Handle local commands that don't need server execution
     */
    handleLocalCommand(terminal, command) {
        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase();

        switch (cmd) {
            case 'clear':
            case 'cls':
                this.clearTerminal(terminal);
                return true;

            case 'history':
                this.showCommandHistory(terminal);
                return true;

            case 'theme':
                if (parts[1]) {
                    this.changeTerminalTheme(terminal, parts[1]);
                } else {
                    this.showAvailableThemes(terminal);
                }
                return true;

            case 'games':
                this.showGamesCommand(terminal);
                return true;

            default:
                return false; // Not a local command
        }
    }

    /**
     * Handle different types of command responses
     */
    handleCommandResponse(terminal, result) {
        if (!result) {
            this.appendOutput(terminal, 'No response from server', 'error');
            return;
        }

        // Handle different response formats
        if (result.error) {
            this.appendOutput(terminal, result.message || 'Command failed', 'error');
        } else if (result.output) {
            this.appendOutput(terminal, result.output, 'output');
        } else if (result.message) {
            this.appendOutput(terminal, result.message, 'output');
        } else if (typeof result === 'string') {
            this.appendOutput(terminal, result, 'output');
        } else {
            // Handle special commands
            if (result.clear) {
                this.clearTerminal(terminal);
            } else if (result.color_theme) {
                this.applyColorTheme(result.color_theme);
                this.appendOutput(terminal, `Theme changed to: ${result.color_theme}`, 'system');
            } else if (result.game_start) {
                this.openApplication(result.game_start);
                this.appendOutput(terminal, `Starting ${result.game_start} game...`, 'system');
            } else if (result.explorer) {
                this.openApplication('explorer');
                this.appendOutput(terminal, 'Opening File Explorer...', 'system');
            } else {
                this.appendOutput(terminal, JSON.stringify(result, null, 2), 'output');
            }
        }
    }

    /**
     * Append output to terminal
     */
    appendOutput(terminal, text, type = 'output') {
        if (!terminal.output) return;

        const line = document.createElement('div');
        line.className = `terminal-line terminal-${type}`;

        // Apply styling based on type
        const colors = {
            'command': '#00d9ff',
            'output': '#00ff41',
            'error': '#ff4444',
            'system': '#ffaa00',
            'success': '#44ff44',
            'warning': '#ffff44'
        };

        line.style.color = colors[type] || colors.output;
        line.style.marginBottom = '2px';
        line.style.whiteSpace = 'pre-wrap';
        line.style.wordBreak = 'break-word';

        // Handle special formatting
        line.textContent = text;

        terminal.output.appendChild(line);

        // Auto-scroll to bottom
        terminal.output.scrollTop = terminal.output.scrollHeight;

        // Limit output history to prevent memory issues
        this.limitOutputHistory(terminal);
    }

    /**
     * Limit output history to prevent memory issues
     */
    limitOutputHistory(terminal) {
        const maxLines = 500;
        const lines = terminal.output.children;

        if (lines.length > maxLines) {
            const linesToRemove = lines.length - maxLines;
            for (let i = 0; i < linesToRemove; i++) {
                if (lines[0]) {
                    terminal.output.removeChild(lines[0]);
                }
            }
        }
    }

    /**
     * Navigate command history
     */
    navigateHistory(terminal, direction) {
        if (this.commandHistory.length === 0) return;

        if (direction === 'up') {
            if (terminal.historyIndex < this.commandHistory.length - 1) {
                terminal.historyIndex++;
            }
        } else if (direction === 'down') {
            if (terminal.historyIndex > -1) {
                terminal.historyIndex--;
            }
        }

        // Update input with history command
        if (terminal.historyIndex === -1) {
            terminal.input.value = terminal.currentCommand || '';
        } else {
            const historyCommand = this.commandHistory[this.commandHistory.length - 1 - terminal.historyIndex];
            terminal.input.value = historyCommand;
        }

        // Move cursor to end
        terminal.input.setSelectionRange(terminal.input.value.length, terminal.input.value.length);
    }

    /**
     * Handle tab completion
     */
    handleTabCompletion(terminal) {
        const input = terminal.input.value;
        const parts = input.split(' ');
        const lastPart = parts[parts.length - 1];

        const completions = [
            'help', 'ls', 'cd', 'pwd', 'mkdir', 'touch', 'cat', 'rm', 'mv', 'cp',
            'clear', 'history', 'date', 'time', 'whoami', 'echo', 'games', 'theme',
            'explorer', 'settings', 'sysinfo', 'ps', 'kill', 'df', 'free'
        ];

        // Find matching completions
        const matches = completions.filter(cmd =>
            cmd.startsWith(lastPart.toLowerCase())
        );

        if (matches.length === 1) {
            // Single match - complete it
            parts[parts.length - 1] = matches[0];
            terminal.input.value = parts.join(' ');
        } else if (matches.length > 1) {
            // Multiple matches - show them
            this.appendOutput(terminal, `\nPossible completions:`, 'system');
            this.appendOutput(terminal, matches.join('  '), 'output');
        }
    }

    /**
     * Add command to history
     */
    addToHistory(command) {
        // Don't add empty commands or duplicates of the last command
        if (!command || (this.commandHistory.length > 0 && this.commandHistory[this.commandHistory.length - 1] === command)) {
            return;
        }

        this.commandHistory.push(command);

        // Limit history size
        if (this.commandHistory.length > this.maxHistorySize) {
            this.commandHistory.shift();
        }

        // Save to storage
        this.saveCommandHistory();

        // Update metrics
        if (window.pixelPusher?.modules?.state) {
            window.pixelPusher.modules.state.incrementMetric('commandsExecuted');
        }
    }

    /**
     * Clear terminal output
     */
    clearTerminal(terminal) {
        if (terminal.output) {
            terminal.output.innerHTML = '';
        }
        terminal.isExecuting = false;
        this.updatePrompt(terminal, false);
        if (terminal.input) {
            terminal.input.focus();
        }
    }

    /**
     * Update terminal prompt
     */
    updatePrompt(terminal, isExecuting) {
        const prompt = terminal.container.querySelector('.terminal-prompt');
        if (prompt) {
            if (isExecuting) {
                prompt.textContent = 'executing... ';
                prompt.style.color = '#ffaa00';
            } else {
                prompt.textContent = `pixel@pusher:${this.currentPath}$ `;
                prompt.style.color = '#00d9ff';
            }
        }
    }

    /**
     * Show command history
     */
    showCommandHistory(terminal) {
        if (this.commandHistory.length === 0) {
            this.appendOutput(terminal, 'No command history available.', 'system');
            return;
        }

        this.appendOutput(terminal, '\nCommand History:', 'system');
        this.commandHistory.forEach((cmd, index) => {
            this.appendOutput(terminal, `${index + 1}: ${cmd}`, 'output');
        });
    }

    /**
     * Show games command
     */
    showGamesCommand(terminal) {
        this.appendOutput(terminal, '\nAvailable Games:', 'system');
        this.appendOutput(terminal, '🐍 snake    - Classic Snake Game', 'output');
        this.appendOutput(terminal, '🧩 tetris   - CyberBlocks (Tetris)', 'output');
        this.appendOutput(terminal, '🧠 memory   - Memory Match Game', 'output');
        this.appendOutput(terminal, '🦕 dino     - Dino Runner Game', 'output');
        this.appendOutput(terminal, '\nUsage: game <name>', 'system');
    }

    /**
     * Change terminal theme
     */
    changeTerminalTheme(terminal, themeName) {
        const themes = {
            'green': { bg: '#0a0a0a', text: '#00ff41', prompt: '#00d9ff' },
            'blue': { bg: '#001122', text: '#66ccff', prompt: '#ffaa00' },
            'white': { bg: '#ffffff', text: '#000000', prompt: '#0066cc' },
            'amber': { bg: '#2b1810', text: '#ffaa00', prompt: '#ff6600' },
            'matrix': { bg: '#000000', text: '#00ff41', prompt: '#00ff41' }
        };

        const theme = themes[themeName.toLowerCase()];
        if (!theme) {
            this.appendOutput(terminal, `Unknown theme: ${themeName}`, 'error');
            this.showAvailableThemes(terminal);
            return;
        }

        // Apply theme
        terminal.container.style.background = theme.bg;
        terminal.container.style.color = theme.text;
        if (terminal.input) {
            terminal.input.style.color = theme.text;
        }
        const prompt = terminal.container.querySelector('.terminal-prompt');
        if (prompt) {
            prompt.style.color = theme.prompt;
        }

        this.appendOutput(terminal, `Terminal theme changed to: ${themeName}`, 'system');
    }

    /**
     * Show available themes
     */
    showAvailableThemes(terminal) {
        const themes = ['green', 'blue', 'white', 'amber', 'matrix'];
        this.appendOutput(terminal, 'Available themes:', 'system');
        this.appendOutput(terminal, themes.join(', '), 'output');
        this.appendOutput(terminal, 'Usage: theme <theme_name>', 'system');
    }

    /**
     * Open application from terminal
     */
    openApplication(appId) {
        if (window.pixelPusher?.modules?.windows) {
            window.pixelPusher.modules.windows.open(appId);
        }
    }

    /**
     * Apply color theme to desktop
     */
    applyColorTheme(themeName) {
        if (window.pixelPusher?.modules?.desktop) {
            window.pixelPusher.modules.desktop.setTheme(themeName);
        }
    }

    /**
     * Set up global terminal shortcuts
     */
    setupGlobalShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Alt+T - Focus terminal or open new one
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') {
                e.preventDefault();
                this.focusOrCreateTerminal();
            }
        });
    }

    /**
     * Focus existing terminal or create new one
     */
    focusOrCreateTerminal() {
        // Try to focus existing terminal
        const existingTerminal = Array.from(this.terminals.values())[0];
        if (existingTerminal && existingTerminal.input) {
            existingTerminal.input.focus();

            // Bring window to front
            if (window.pixelPusher?.modules?.windows) {
                window.pixelPusher.modules.windows.focus(existingTerminal.id);
            }
        } else {
            // Open new terminal
            if (window.pixelPusher?.modules?.windows) {
                window.pixelPusher.modules.windows.open('terminal');
            }
        }
    }

    /**
     * Load command history from storage
     */
    loadCommandHistory() {
        try {
            const saved = localStorage.getItem('pixelpusher_terminal_history');
            if (saved) {
                this.commandHistory = JSON.parse(saved);
                console.log(`💻 Loaded ${this.commandHistory.length} commands from history`);
            }
        } catch (error) {
            console.warn('Failed to load command history:', error);
        }
    }

    /**
     * Save command history to storage
     */
    saveCommandHistory() {
        try {
            localStorage.setItem('pixelpusher_terminal_history', JSON.stringify(this.commandHistory));
        } catch (error) {
            console.warn('Failed to save command history:', error);
        }
    }

    /**
     * Get terminal statistics
     */
    getStats() {
        return {
            activeTerminals: this.terminals.size,
            commandHistory: this.commandHistory.length,
            maxHistorySize: this.maxHistorySize,
            currentPath: this.currentPath
        };
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Adjust terminal layouts if needed
        this.terminals.forEach(terminal => {
            // Scroll to bottom after resize
            setTimeout(() => {
                if (terminal.output) {
                    terminal.output.scrollTop = terminal.output.scrollHeight;
                }
            }, 100);
        });
    }

    /**
     * Clean up terminal manager
     */
    destroy() {
        // Save command history
        this.saveCommandHistory();

        // Clear all terminals
        this.terminals.clear();

        console.log('💻 Terminal Manager destroyed');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TerminalManager;
}

console.log('💻 Fixed Terminal manager loaded successfully');