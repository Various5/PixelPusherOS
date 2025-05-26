/**
 * Pixel Pusher OS - Terminal Manager
 * Handles terminal functionality, command execution, and terminal UI management
 *
 * This module provides:
 * - Terminal initialization and management
 * - Command execution and API communication
 * - Command history and completion
 * - Terminal output formatting and display
 * - Multiple terminal instance support
 * - Keyboard shortcuts and navigation
 */

class TerminalManager {
    constructor() {
        this.terminals = new Map(); // Active terminal instances
        this.commandHistory = [];
        this.historyIndex = -1;
        this.maxHistorySize = 100;
        this.currentPath = '/';
        this.commandCompletions = [];

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

            // Initialize command completions
            this.initializeCommandCompletions();

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
            output: document.getElementById(`terminal-output-${appId}`),
            input: document.getElementById(`terminal-input-${appId}`),
            historyIndex: -1,
            currentCommand: '',
            isExecuting: false
        };

        // Store terminal instance
        this.terminals.set(appId, terminal);

        // Set up terminal-specific event handlers
        this.setupTerminalEventHandlers(terminal);

        // Apply terminal styling
        this.applyTerminalStyling(terminal);

        // Show welcome message
        this.showWelcomeMessage(terminal);

        // Focus input
        terminal.input.focus();

        console.log(`💻 Terminal initialized: ${appId}`);
    }

    /**
     * Set up event handlers for a terminal instance
     */
    setupTerminalEventHandlers(terminal) {
        const input = terminal.input;

        // Handle Enter key (execute command)
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.executeCommand(terminal);
            }
            // Handle Up arrow (previous command)
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory(terminal, 'up');
            }
            // Handle Down arrow (next command)
            else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory(terminal, 'down');
            }
            // Handle Tab (command completion)
            else if (e.key === 'Tab') {
                e.preventDefault();
                this.handleTabCompletion(terminal);
            }
            // Handle Ctrl+C (cancel current command)
            else if (e.ctrlKey && e.key === 'c') {
                e.preventDefault();
                this.cancelCommand(terminal);
            }
            // Handle Ctrl+L (clear terminal)
            else if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                this.clearTerminal(terminal);
            }
            // Handle Ctrl+U (clear line)
            else if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                input.value = '';
            }
        });

        // Handle input changes
        input.addEventListener('input', () => {
            terminal.currentCommand = input.value;
        });

        // Handle terminal container clicks (focus input)
        terminal.container.addEventListener('click', () => {
            input.focus();
        });

        // Handle paste events
        input.addEventListener('paste', (e) => {
            // Allow paste but sanitize content
            setTimeout(() => {
                input.value = this.sanitizeInput(input.value);
            }, 0);
        });
    }

    /**
     * Apply styling to terminal
     */
    applyTerminalStyling(terminal) {
        // Style terminal container
        terminal.container.style.cssText = `
            font-family: 'Courier New', 'Monaco', monospace;
            background: #1a1a1a;
            color: #00ff00;
            padding: 16px;
            height: 100%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;

        // Style output area
        terminal.output.style.cssText = `
            flex: 1;
            overflow-y: auto;
            margin-bottom: 8px;
            white-space: pre-wrap;
            word-wrap: break-word;
            line-height: 1.4;
            font-size: 14px;
            scrollbar-width: thin;
            scrollbar-color: #444 #1a1a1a;
        `;

        // Style input line
        const inputLine = terminal.container.querySelector('.terminal-input-line');
        if (inputLine) {
            inputLine.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 4px 0;
                border-top: 1px solid #333;
            `;
        }

        // Style prompt
        const prompt = terminal.container.querySelector('.terminal-prompt');
        if (prompt) {
            prompt.style.cssText = `
                color: #00d9ff;
                font-weight: bold;
                white-space: nowrap;
            `;
        }

        // Style input
        terminal.input.style.cssText = `
            flex: 1;
            background: transparent;
            border: none;
            outline: none;
            color: #00ff00;
            font-family: inherit;
            font-size: 14px;
            caret-color: #00ff00;
        `;

        // Custom scrollbar for webkit browsers
        const style = document.createElement('style');
        style.textContent = `
            .terminal-output::-webkit-scrollbar {
                width: 8px;
            }
            .terminal-output::-webkit-scrollbar-track {
                background: #1a1a1a;
            }
            .terminal-output::-webkit-scrollbar-thumb {
                background: #444;
                border-radius: 4px;
            }
            .terminal-output::-webkit-scrollbar-thumb:hover {
                background: #555;
            }
        `;
        if (!document.getElementById('terminal-scrollbar-styles')) {
            style.id = 'terminal-scrollbar-styles';
            document.head.appendChild(style);
        }
    }

    /**
     * Show welcome message in terminal
     */
    showWelcomeMessage(terminal) {
        const welcomeMessage = `
╔══════════════════════════════════════════════╗
║          🎨 PIXEL PUSHER OS TERMINAL         ║
╠══════════════════════════════════════════════╣
║  Welcome to the Pixel Pusher OS Terminal!   ║
║                                              ║
║  Type 'help' to see available commands      ║
║  Use ↑↓ arrows for command history          ║
║  Use Tab for command completion              ║
║  Press Ctrl+L to clear the terminal         ║
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
            const response = await fetch(`/api/command/${encodeURIComponent(command)}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Command execution failed');
            }

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
            terminal.input.focus();
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

            case 'exit':
            case 'quit':
                this.closeTerminal(terminal);
                return true;

            case 'theme':
                if (parts[1]) {
                    this.changeTerminalTheme(terminal, parts[1]);
                } else {
                    this.showAvailableThemes(terminal);
                }
                return true;

            default:
                return false; // Not a local command
        }
    }

    /**
     * Handle different types of command responses
     */
    handleCommandResponse(terminal, result) {
        // Handle clear command
        if (result.clear) {
            this.clearTerminal(terminal);
            return;
        }

        // Handle color theme changes
        if (result.color_theme) {
            this.applyColorTheme(result.color_theme);
            this.appendOutput(terminal, `Theme changed to: ${result.color_theme}`, 'system');
            return;
        }

        // Handle visual effects
        if (result.start_effect) {
            this.startVisualEffect(result.start_effect);
            this.appendOutput(terminal, `Started effect: ${result.start_effect}`, 'system');
            return;
        }

        // Handle wallpaper changes
        if (result.wallpaper) {
            this.changeWallpaper(result.wallpaper);
            this.appendOutput(terminal, `Wallpaper changed to: ${result.wallpaper}`, 'system');
            return;
        }

        // Handle application launches
        if (result.explorer) {
            this.openApplication('explorer');
            this.appendOutput(terminal, 'Opening File Explorer...', 'system');
            return;
        }

        if (result.game_start) {
            this.openApplication(result.game_start);
            this.appendOutput(terminal, `Starting ${result.game_start} game...`, 'system');
            return;
        }

        // Handle media files
        if (result.image) {
            this.displayImage(terminal, result.image);
            return;
        }

        if (result.video) {
            this.displayVideo(terminal, result.video);
            return;
        }

        if (result.audio) {
            this.displayAudio(terminal, result.audio);
            return;
        }

        // Handle editor responses
        if (result.editor && result.content) {
            this.openEditor(result.editor, result.content);
            return;
        }

        // Handle error responses
        if (result.error) {
            this.appendOutput(terminal, result.message || 'An error occurred', 'error');
            return;
        }

        // Handle regular text output
        if (result.output) {
            this.appendOutput(terminal, result.output, 'output');
        }
    }

    /**
     * Append output to terminal
     */
    appendOutput(terminal, text, type = 'output') {
        const outputElement = terminal.output;
        const line = document.createElement('div');
        line.className = `terminal-line terminal-${type}`;

        // Apply styling based on type
        const colors = {
            'command': '#00d9ff',
            'output': '#00ff00',
            'error': '#ff4444',
            'system': '#ffaa00',
            'success': '#44ff44',
            'warning': '#ffff44'
        };

        line.style.color = colors[type] || colors.output;
        line.style.marginBottom = '2px';

        // Handle ANSI color codes and special formatting
        line.innerHTML = this.formatOutput(text);

        outputElement.appendChild(line);

        // Auto-scroll to bottom
        outputElement.scrollTop = outputElement.scrollHeight;

        // Limit output history to prevent memory issues
        this.limitOutputHistory(terminal);
    }

    /**
     * Format output text with color codes and special formatting
     */
    formatOutput(text) {
        // Convert newlines to <br> tags
        let formatted = text.replace(/\n/g, '<br>');

        // Handle basic color codes (simplified ANSI)
        formatted = formatted.replace(/\[31m(.*?)\[0m/g, '<span style="color: #ff4444;">$1</span>');
        formatted = formatted.replace(/\[32m(.*?)\[0m/g, '<span style="color: #44ff44;">$1</span>');
        formatted = formatted.replace(/\[33m(.*?)\[0m/g, '<span style="color: #ffff44;">$1</span>');
        formatted = formatted.replace(/\[34m(.*?)\[0m/g, '<span style="color: #4444ff;">$1</span>');
        formatted = formatted.replace(/\[35m(.*?)\[0m/g, '<span style="color: #ff44ff;">$1</span>');
        formatted = formatted.replace(/\[36m(.*?)\[0m/g, '<span style="color: #44ffff;">$1</span>');

        // Handle bold text
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Handle URLs (make clickable)
        formatted = formatted.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" style="color: #00d9ff; text-decoration: underline;">$1</a>'
        );

        return formatted;
    }

    /**
     * Limit output history to prevent memory issues
     */
    limitOutputHistory(terminal) {
        const maxLines = 1000;
        const lines = terminal.output.children;

        if (lines.length > maxLines) {
            const linesToRemove = lines.length - maxLines;
            for (let i = 0; i < linesToRemove; i++) {
                terminal.output.removeChild(lines[0]);
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
            terminal.input.value = terminal.currentCommand;
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

        // Find matching completions
        const matches = this.commandCompletions.filter(cmd =>
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
            this.appendOutput(terminal, `pixel@pusher:${this.currentPath}$ ${input}`, 'command');
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
        terminal.output.innerHTML = '';
        terminal.isExecuting = false;
        this.updatePrompt(terminal, false);
        terminal.input.focus();
    }

    /**
     * Cancel current command
     */
    cancelCommand(terminal) {
        if (terminal.isExecuting) {
            terminal.isExecuting = false;
            this.updatePrompt(terminal, false);
            this.appendOutput(terminal, '^C', 'error');
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
                prompt.textContent = 'executing...';
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
     * Close terminal
     */
    closeTerminal(terminal) {
        if (window.pixelPusher?.modules?.windows) {
            window.pixelPusher.modules.windows.close(terminal.id);
        }
    }

    /**
     * Change terminal theme
     */
    changeTerminalTheme(terminal, themeName) {
        const themes = {
            'green': { bg: '#1a1a1a', text: '#00ff00', prompt: '#00d9ff' },
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
        terminal.input.style.color = theme.text;
        terminal.container.querySelector('.terminal-prompt').style.color = theme.prompt;

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
     * Apply color theme to desktop
     */
    applyColorTheme(themeName) {
        if (window.pixelPusher?.modules?.desktop) {
            window.pixelPusher.modules.desktop.setTheme(themeName);
        }
    }

    /**
     * Start visual effect
     */
    startVisualEffect(effectName) {
        // This would integrate with a visual effects system
        console.log(`Starting visual effect: ${effectName}`);
    }

    /**
     * Change desktop wallpaper
     */
    changeWallpaper(wallpaperName) {
        if (window.pixelPusher?.modules?.desktop) {
            window.pixelPusher.modules.desktop.setWallpaper(`/static/wallpaper/${wallpaperName}`);
        }
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
     * Display image in terminal
     */
    displayImage(terminal, imagePath) {
        const imgElement = document.createElement('img');
        imgElement.src = `/api/files/${imagePath}`;
        imgElement.style.cssText = `
            max-width: 100%;
            max-height: 300px;
            border: 1px solid #444;
            margin: 8px 0;
            border-radius: 4px;
        `;
        imgElement.alt = imagePath;

        const container = document.createElement('div');
        container.appendChild(imgElement);
        container.innerHTML += `<br>📷 Image: ${imagePath}`;

        terminal.output.appendChild(container);
        terminal.output.scrollTop = terminal.output.scrollHeight;
    }

    /**
     * Display video in terminal
     */
    displayVideo(terminal, videoPath) {
        const videoElement = document.createElement('video');
        videoElement.src = `/api/files/${videoPath}`;
        videoElement.controls = true;
        videoElement.style.cssText = `
            max-width: 100%;
            max-height: 300px;
            margin: 8px 0;
            border-radius: 4px;
        `;

        const container = document.createElement('div');
        container.appendChild(videoElement);
        container.innerHTML += `<br>🎥 Video: ${videoPath}`;

        terminal.output.appendChild(container);
        terminal.output.scrollTop = terminal.output.scrollHeight;
    }

    /**
     * Display audio player in terminal
     */
    displayAudio(terminal, audioPath) {
        const audioElement = document.createElement('audio');
        audioElement.src = `/api/files/${audioPath}`;
        audioElement.controls = true;
        audioElement.style.cssText = `
            width: 100%;
            margin: 8px 0;
        `;

        const container = document.createElement('div');
        container.innerHTML = `🎵 Audio: ${audioPath}<br>`;
        container.appendChild(audioElement);

        terminal.output.appendChild(container);
        terminal.output.scrollTop = terminal.output.scrollHeight;
    }

    /**
     * Open text editor
     */
    openEditor(filename, content) {
        // This would integrate with a text editor application
        console.log(`Opening editor for: ${filename}`);
        if (window.pixelPusher?.modules?.windows) {
            window.pixelPusher.modules.windows.open('editor', { filename, content });
        }
    }

    /**
     * Initialize command completions
     */
    initializeCommandCompletions() {
        this.commandCompletions = [
            // Basic commands
            'help', 'about', 'contact', 'clear', 'echo', 'time', 'date', 'uptime', 'whoami',
            // File operations
            'ls', 'dir', 'cd', 'pwd', 'mkdir', 'touch', 'del', 'rm', 'cat', 'edit', 'rename', 'mv',
            'properties', 'find',
            // System commands
            'sysinfo', 'ps', 'kill', 'df', 'free',
            // Visual and themes
            'color', 'effect', 'wallpaper', 'theme',
            // Network
            'curl', 'ping',
            // Applications
            'explorer', 'game',
            // Local commands
            'history', 'exit', 'quit'
        ];
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
        if (existingTerminal) {
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
     * Sanitize input to prevent XSS
     */
    sanitizeInput(input) {
        return input.replace(/[<>&"']/g, (match) => {
            const escapes = {
                '<': '&lt;',
                '>': '&gt;',
                '&': '&amp;',
                '"': '&quot;',
                "'": '&#x27;'
            };
            return escapes[match];
        });
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
            currentPath: this.currentPath,
            completions: this.commandCompletions.length
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
                terminal.output.scrollTop = terminal.output.scrollHeight;
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

console.log('💻 Terminal manager loaded successfully');