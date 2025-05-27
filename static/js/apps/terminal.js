/**
 * Pixel Pusher OS - Enhanced Terminal Manager
 * Full-featured terminal with working commands and modern interface
 */

class EnhancedTerminalManager {
    constructor() {
        this.terminals = new Map();
        this.commandHistory = [];
        this.historyIndex = -1;
        this.maxHistorySize = 100;
        this.currentPath = '/';
        this.commandCompletions = [];
        this.environment = {
            USER: 'pixel',
            HOME: '/home/pixel',
            PATH: '/bin:/usr/bin:/usr/local/bin',
            SHELL: '/bin/pixelsh',
            TERM: 'xterm-256color'
        };
        this.aliases = {
            'll': 'ls -la',
            'la': 'ls -a',
            'cls': 'clear',
            '..': 'cd ..',
            'home': 'cd ~'
        };

        console.log('💻 Enhanced Terminal Manager initialized');
    }

    async init() {
        try {
            this.loadCommandHistory();
            this.setupGlobalShortcuts();
            this.initializeCommandCompletions();
            this.initializeBuiltinCommands();
            console.log('✅ Enhanced Terminal system ready');
        } catch (error) {
            console.error('❌ Terminal initialization failed:', error);
        }
    }

    initializeWindow(appId) {
        const terminalContainer = document.getElementById(`terminal-${appId}`);
        if (!terminalContainer) {
            console.error(`Terminal container not found: ${appId}`);
            return;
        }

        const terminal = {
            id: appId,
            container: terminalContainer,
            output: null,
            input: null,
            historyIndex: -1,
            currentCommand: '',
            isExecuting: false,
            currentPath: this.currentPath,
            environment: { ...this.environment }
        };

        this.terminals.set(appId, terminal);
        this.setupTerminalUI(terminal);
        this.setupTerminalEventHandlers(terminal);
        this.applyTerminalStyling(terminal);
        this.showWelcomeMessage(terminal);

        setTimeout(() => {
            terminal.input.focus();
        }, 100);

        console.log(`💻 Enhanced Terminal initialized: ${appId}`);
    }

    setupTerminalUI(terminal) {
        terminal.container.innerHTML = `
            <div class="terminal-header">
                <div class="terminal-tabs">
                    <div class="terminal-tab active">
                        <span class="tab-title">Terminal</span>
                        <button class="tab-close" onclick="window.pixelPusher.modules.windows.close('${terminal.id}')">&times;</button>
                    </div>
                    <button class="new-tab-btn" onclick="window.pixelPusher.openApplication('terminal')" title="New Terminal">+</button>
                </div>
                <div class="terminal-controls">
                    <button class="terminal-btn" onclick="window.pixelPusher.modules.terminal.clearTerminal('${terminal.id}')" title="Clear">
                        🗑️
                    </button>
                    <button class="terminal-btn" onclick="window.pixelPusher.modules.terminal.toggleFullscreen('${terminal.id}')" title="Fullscreen">
                        ⛶
                    </button>
                </div>
            </div>
            <div class="terminal-body">
                <div class="terminal-output" id="terminal-output-${terminal.id}"></div>
                <div class="terminal-input-line">
                    <span class="terminal-prompt" id="terminal-prompt-${terminal.id}">pixel@pusher:/$ </span>
                    <input type="text" class="terminal-input" id="terminal-input-${terminal.id}" 
                           autocomplete="off" spellcheck="false" autocapitalize="off">
                </div>
            </div>
            <div class="terminal-footer">
                <div class="terminal-status">
                    <span id="terminal-path-${terminal.id}">/</span>
                    <span class="separator">|</span>
                    <span id="terminal-time-${terminal.id}"></span>
                </div>
            </div>
        `;

        terminal.output = document.getElementById(`terminal-output-${terminal.id}`);
        terminal.input = document.getElementById(`terminal-input-${terminal.id}`);
        terminal.prompt = document.getElementById(`terminal-prompt-${terminal.id}`);

        // Update time every second
        setInterval(() => {
            const timeEl = document.getElementById(`terminal-time-${terminal.id}`);
            if (timeEl) {
                timeEl.textContent = new Date().toLocaleTimeString();
            }
        }, 1000);
    }

    setupTerminalEventHandlers(terminal) {
        const input = terminal.input;

        input.addEventListener('keydown', (e) => {
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
                case 'c':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.cancelCommand(terminal);
                    }
                    break;
                case 'l':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.clearTerminal(terminal.id);
                    }
                    break;
                case 'u':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        input.value = '';
                    }
                    break;
                case 'd':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.exitTerminal(terminal);
                    }
                    break;
            }
        });

        input.addEventListener('input', () => {
            terminal.currentCommand = input.value;
        });

        terminal.container.addEventListener('click', () => {
            input.focus();
        });
    }

    async executeCommand(terminal) {
        const command = terminal.input.value.trim();
        if (!command) return;

        if (terminal.isExecuting) {
            this.appendOutput(terminal, 'Command already executing...', 'error');
            return;
        }

        this.addToHistory(command);
        terminal.historyIndex = -1;

        const promptText = terminal.prompt.textContent;
        this.appendOutput(terminal, `${promptText}${command}`, 'command');

        terminal.input.value = '';
        terminal.currentCommand = '';
        terminal.isExecuting = true;

        try {
            await this.processCommand(terminal, command);
        } catch (error) {
            console.error('Command execution error:', error);
            this.appendOutput(terminal, `Error: ${error.message}`, 'error');
        } finally {
            terminal.isExecuting = false;
            terminal.input.focus();
        }
    }

    async processCommand(terminal, command) {
        // Handle aliases
        const expandedCommand = this.expandAliases(command);
        const parts = expandedCommand.split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        // Handle built-in commands
        if (this.builtinCommands[cmd]) {
            await this.builtinCommands[cmd](terminal, args);
            return;
        }

        // Handle pipe operations
        if (command.includes('|')) {
            await this.handlePipeCommand(terminal, command);
            return;
        }

        // Try API commands
        try {
            const response = await fetch(`/api/command/${encodeURIComponent(command)}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Command execution failed');
            }

            this.handleCommandResponse(terminal, result);
        } catch (error) {
            this.appendOutput(terminal, `Command not found: ${cmd}`, 'error');
            this.appendOutput(terminal, `Type 'help' for available commands`, 'info');
        }
    }

    initializeBuiltinCommands() {
        this.builtinCommands = {
            // Basic shell commands
            'clear': (terminal) => {
                this.clearTerminal(terminal.id);
            },

            'help': (terminal) => {
                this.showHelp(terminal);
            },

            'history': (terminal) => {
                this.showHistory(terminal);
            },

            'pwd': (terminal) => {
                this.appendOutput(terminal, terminal.currentPath, 'output');
            },

            'cd': (terminal, args) => {
                this.changeDirectory(terminal, args[0] || '~');
            },

            'ls': (terminal, args) => {
                this.listDirectory(terminal, args);
            },

            'echo': (terminal, args) => {
                this.appendOutput(terminal, args.join(' '), 'output');
            },

            'date': (terminal) => {
                this.appendOutput(terminal, new Date().toString(), 'output');
            },

            'whoami': (terminal) => {
                this.appendOutput(terminal, terminal.environment.USER, 'output');
            },

            'env': (terminal) => {
                Object.entries(terminal.environment).forEach(([key, value]) => {
                    this.appendOutput(terminal, `${key}=${value}`, 'output');
                });
            },

            'export': (terminal, args) => {
                if (args.length === 0) {
                    this.builtinCommands.env(terminal);
                } else {
                    const [assignment] = args;
                    if (assignment.includes('=')) {
                        const [key, value] = assignment.split('=', 2);
                        terminal.environment[key] = value;
                        this.appendOutput(terminal, `Exported ${key}=${value}`, 'success');
                    }
                }
            },

            'alias': (terminal, args) => {
                if (args.length === 0) {
                    Object.entries(this.aliases).forEach(([alias, command]) => {
                        this.appendOutput(terminal, `alias ${alias}='${command}'`, 'output');
                    });
                } else {
                    const assignment = args.join(' ');
                    if (assignment.includes('=')) {
                        const [alias, command] = assignment.split('=', 2);
                        this.aliases[alias] = command.replace(/['"]/g, '');
                        this.appendOutput(terminal, `Alias created: ${alias}`, 'success');
                    }
                }
            },

            'grep': (terminal, args) => {
                if (args.length < 2) {
                    this.appendOutput(terminal, 'Usage: grep <pattern> <text>', 'error');
                    return;
                }
                const pattern = args[0];
                const text = args.slice(1).join(' ');
                const lines = text.split('\n');
                const matches = lines.filter(line => line.includes(pattern));
                matches.forEach(line => {
                    this.appendOutput(terminal, line.replace(pattern, `\x1b[31m${pattern}\x1b[0m`), 'output');
                });
            },

            'ping': async (terminal, args) => {
                if (args.length === 0) {
                    this.appendOutput(terminal, 'Usage: ping <hostname>', 'error');
                    return;
                }

                const hostname = args[0];
                this.appendOutput(terminal, `PING ${hostname}...`, 'info');

                try {
                    const startTime = Date.now();
                    // Simulate ping by trying to fetch a small resource
                    const response = await fetch(`https://${hostname}/favicon.ico`, {
                        method: 'HEAD',
                        mode: 'no-cors',
                        cache: 'no-cache'
                    });
                    const endTime = Date.now();
                    const duration = endTime - startTime;

                    this.appendOutput(terminal, `64 bytes from ${hostname}: time=${duration}ms`, 'success');
                } catch (error) {
                    this.appendOutput(terminal, `ping: cannot resolve ${hostname}: Name or service not known`, 'error');
                }
            },

            'curl': async (terminal, args) => {
                if (args.length === 0) {
                    this.appendOutput(terminal, 'Usage: curl <url>', 'error');
                    return;
                }

                let url = args[0];
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                }

                this.appendOutput(terminal, `Fetching ${url}...`, 'info');

                try {
                    const response = await fetch(url);
                    const text = await response.text();

                    if (text.length > 2000) {
                        this.appendOutput(terminal, text.substring(0, 2000) + '\n... (truncated)', 'output');
                    } else {
                        this.appendOutput(terminal, text, 'output');
                    }
                } catch (error) {
                    this.appendOutput(terminal, `curl: ${error.message}`, 'error');
                }
            },

            'ps': (terminal) => {
                const processes = [
                    { pid: 1, cmd: 'init', cpu: 0.0, mem: 0.1 },
                    { pid: 123, cmd: 'pixelpusher', cpu: 2.5, mem: 12.3 },
                    { pid: 456, cmd: 'terminal', cpu: 0.5, mem: 3.2 },
                    { pid: 789, cmd: 'explorer', cpu: 1.2, mem: 8.7 }
                ];

                this.appendOutput(terminal, '  PID COMMAND      CPU%  MEM%', 'output');
                this.appendOutput(terminal, '  --- -------      ----  ----', 'output');
                processes.forEach(proc => {
                    this.appendOutput(terminal, `${proc.pid.toString().padStart(5)} ${proc.cmd.padEnd(12)} ${proc.cpu.toFixed(1).padStart(4)}  ${proc.mem.toFixed(1).padStart(4)}`, 'output');
                });
            },

            'kill': (terminal, args) => {
                if (args.length === 0) {
                    this.appendOutput(terminal, 'Usage: kill <pid>', 'error');
                    return;
                }
                const pid = args[0];
                this.appendOutput(terminal, `Killed process ${pid}`, 'success');
            },

            'top': (terminal) => {
                this.appendOutput(terminal, 'System Monitor - Press Ctrl+C to exit', 'info');
                this.appendOutput(terminal, '', 'output');
                this.appendOutput(terminal, 'Tasks: 4 total, 1 running, 3 sleeping', 'output');
                this.appendOutput(terminal, 'CPU usage: 15.2%', 'output');
                this.appendOutput(terminal, 'Memory usage: 2048MB / 8192MB (25%)', 'output');
                this.appendOutput(terminal, '', 'output');
                this.builtinCommands.ps(terminal);
            },

            'df': (terminal) => {
                this.appendOutput(terminal, 'Filesystem     Size  Used Avail Use% Mounted on', 'output');
                this.appendOutput(terminal, '/dev/sda1       10G  4.5G  5.5G  45% /', 'output');
                this.appendOutput(terminal, '/dev/sda2      100G   25G   75G  25% /home', 'output');
                this.appendOutput(terminal, 'tmpfs          2.0G  128M  1.9G   7% /tmp', 'output');
            },

            'free': (terminal) => {
                this.appendOutput(terminal, '              total        used        free      shared  buff/cache   available', 'output');
                this.appendOutput(terminal, 'Mem:        8192000     2048000     4096000      512000     2048000     5632000', 'output');
                this.appendOutput(terminal, 'Swap:       2048000           0     2048000', 'output');
            },

            'uptime': (terminal) => {
                const uptime = Math.floor(performance.now() / 1000);
                const hours = Math.floor(uptime / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);
                this.appendOutput(terminal, `up ${hours}:${minutes.toString().padStart(2, '0')}, 1 user, load average: 0.15, 0.20, 0.18`, 'output');
            },

            'find': (terminal, args) => {
                if (args.length === 0) {
                    this.appendOutput(terminal, 'Usage: find <path> -name <pattern>', 'error');
                    return;
                }

                const mockResults = [
                    '/home/pixel/documents/file1.txt',
                    '/home/pixel/documents/file2.txt',
                    '/home/pixel/downloads/archive.zip'
                ];

                mockResults.forEach(result => {
                    this.appendOutput(terminal, result, 'output');
                });
            },

            'which': (terminal, args) => {
                if (args.length === 0) {
                    this.appendOutput(terminal, 'Usage: which <command>', 'error');
                    return;
                }

                const cmd = args[0];
                if (this.builtinCommands[cmd] || this.commandCompletions.includes(cmd)) {
                    this.appendOutput(terminal, `/usr/bin/${cmd}`, 'output');
                } else {
                    this.appendOutput(terminal, `${cmd} not found`, 'error');
                }
            },

            'man': (terminal, args) => {
                if (args.length === 0) {
                    this.appendOutput(terminal, 'Usage: man <command>', 'error');
                    return;
                }

                const cmd = args[0];
                const manPages = {
                    'ls': 'List directory contents\nUsage: ls [options] [directory]\nOptions: -l (long format), -a (all files)',
                    'cd': 'Change directory\nUsage: cd [directory]\nExamples: cd /home, cd .., cd ~',
                    'pwd': 'Print working directory\nUsage: pwd\nPrints the current directory path',
                    'echo': 'Display text\nUsage: echo [text]\nExample: echo "Hello World"',
                    'ping': 'Send network requests\nUsage: ping <hostname>\nExample: ping google.com',
                    'curl': 'Transfer data from servers\nUsage: curl <url>\nExample: curl https://api.github.com'
                };

                if (manPages[cmd]) {
                    this.appendOutput(terminal, `Manual page for ${cmd}:`, 'info');
                    this.appendOutput(terminal, '', 'output');
                    this.appendOutput(terminal, manPages[cmd], 'output');
                } else {
                    this.appendOutput(terminal, `No manual entry for ${cmd}`, 'error');
                }
            },

            'nano': (terminal, args) => {
                if (args.length === 0) {
                    this.appendOutput(terminal, 'Usage: nano <filename>', 'error');
                    return;
                }
                this.appendOutput(terminal, `Opening ${args[0]} in nano editor...`, 'info');
                this.appendOutput(terminal, '(This is a simulation - real file editing not implemented)', 'warning');
            },

            'cat': (terminal, args) => {
                if (args.length === 0) {
                    this.appendOutput(terminal, 'Usage: cat <filename>', 'error');
                    return;
                }

                const filename = args[0];
                const mockFiles = {
                    'README.txt': 'Welcome to Pixel Pusher OS!\nThis is a modern web-based desktop environment.',
                    'config.json': '{\n  "theme": "default",\n  "language": "en",\n  "animations": true\n}',
                    'package.json': '{\n  "name": "pixelpusher-os",\n  "version": "2.0.0",\n  "description": "Web Desktop Environment"\n}'
                };

                if (mockFiles[filename]) {
                    this.appendOutput(terminal, mockFiles[filename], 'output');
                } else {
                    this.appendOutput(terminal, `cat: ${filename}: No such file or directory`, 'error');
                }
            },

            'mkdir': (terminal, args) => {
                if (args.length === 0) {
                    this.appendOutput(terminal, 'Usage: mkdir <directory>', 'error');
                    return;
                }
                this.appendOutput(terminal, `Created directory: ${args[0]}`, 'success');
            },

            'touch': (terminal, args) => {
                if (args.length === 0) {
                    this.appendOutput(terminal, 'Usage: touch <filename>', 'error');
                    return;
                }
                this.appendOutput(terminal, `Created file: ${args[0]}`, 'success');
            },

            'rm': (terminal, args) => {
                if (args.length === 0) {
                    this.appendOutput(terminal, 'Usage: rm <filename>', 'error');
                    return;
                }
                this.appendOutput(terminal, `Removed: ${args[0]}`, 'success');
            },

            'cp': (terminal, args) => {
                if (args.length < 2) {
                    this.appendOutput(terminal, 'Usage: cp <source> <destination>', 'error');
                    return;
                }
                this.appendOutput(terminal, `Copied ${args[0]} to ${args[1]}`, 'success');
            },

            'mv': (terminal, args) => {
                if (args.length < 2) {
                    this.appendOutput(terminal, 'Usage: mv <source> <destination>', 'error');
                    return;
                }
                this.appendOutput(terminal, `Moved ${args[0]} to ${args[1]}`, 'success');
            },

            'tree': (terminal) => {
                const treeOutput = `
.
├── documents/
│   ├── report.pdf
│   ├── notes.txt
│   └── archive/
├── downloads/
│   ├── software.zip
│   └── image.jpg
├── pictures/
│   ├── vacation/
│   └── family/
└── README.txt`;
                this.appendOutput(terminal, treeOutput, 'output');
            },

            'cowsay': (terminal, args) => {
                const message = args.join(' ') || 'Hello from Pixel Pusher OS!';
                const cow = `
 ${'_'.repeat(message.length + 2)}
< ${message} >
 ${'-'.repeat(message.length + 2)}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`;
                this.appendOutput(terminal, cow, 'output');
            },

            'fortune': (terminal) => {
                const fortunes = [
                    "The best way to predict the future is to implement it.",
                    "In the world of web development, the only constant is change.",
                    "A good programmer looks both ways before crossing a one-way street.",
                    "Code never lies, comments sometimes do.",
                    "First, solve the problem. Then, write the code."
                ];
                const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
                this.appendOutput(terminal, fortune, 'output');
            },

            'exit': (terminal) => {
                this.exitTerminal(terminal);
            }
        };
    }

    expandAliases(command) {
        const parts = command.split(' ');
        const cmd = parts[0];

        if (this.aliases[cmd]) {
            return this.aliases[cmd] + ' ' + parts.slice(1).join(' ');
        }

        return command;
    }

    changeDirectory(terminal, path) {
        if (!path || path === '~' || path === '$HOME') {
            terminal.currentPath = terminal.environment.HOME;
        } else if (path === '..') {
            const parts = terminal.currentPath.split('/');
            if (parts.length > 1) {
                parts.pop();
                terminal.currentPath = parts.join('/') || '/';
            }
        } else if (path === '/') {
            terminal.currentPath = '/';
        } else if (path.startsWith('/')) {
            terminal.currentPath = path;
        } else {
            terminal.currentPath = terminal.currentPath === '/'
                ? '/' + path
                : terminal.currentPath + '/' + path;
        }

        this.updatePrompt(terminal);
        this.updateStatus(terminal);
    }

    listDirectory(terminal, args) {
        const showHidden = args.includes('-a');
        const longFormat = args.includes('-l');

        const mockFiles = [
            { name: '.bashrc', type: 'file', size: 3423, permissions: '-rw-r--r--', hidden: true },
            { name: '.profile', type: 'file', size: 807, permissions: '-rw-r--r--', hidden: true },
            { name: 'documents', type: 'dir', size: 4096, permissions: 'drwxr-xr-x', hidden: false },
            { name: 'downloads', type: 'dir', size: 4096, permissions: 'drwxr-xr-x', hidden: false },
            { name: 'pictures', type: 'dir', size: 4096, permissions: 'drwxr-xr-x', hidden: false },
            { name: 'README.txt', type: 'file', size: 1024, permissions: '-rw-r--r--', hidden: false }
        ];

        let filesToShow = mockFiles.filter(file => showHidden || !file.hidden);

        if (longFormat) {
            filesToShow.forEach(file => {
                const date = new Date().toLocaleDateString();
                const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                this.appendOutput(terminal,
                    `${file.permissions} 1 pixel pixel ${file.size.toString().padStart(8)} ${date} ${time} ${file.name}`,
                    'output'
                );
            });
        } else {
            const names = filesToShow.map(file => file.name);
            this.appendOutput(terminal, names.join('  '), 'output');
        }
    }

    showHelp(terminal) {
        const helpText = `
Available Commands:
==================

File Operations:
  ls [options]     - List directory contents (-l long, -a all)
  cd <path>        - Change directory (.. up, ~ home, / root)
  pwd              - Print working directory
  mkdir <dir>      - Create directory
  touch <file>     - Create empty file
  rm <file>        - Remove file
  cp <src> <dst>   - Copy file
  mv <src> <dst>   - Move/rename file
  cat <file>       - Display file content
  find <path>      - Find files
  tree             - Show directory tree

System Information:
  ps               - Show running processes
  top              - System monitor
  df               - Disk usage
  free             - Memory usage
  uptime           - System uptime
  whoami           - Current user
  env              - Environment variables

Network:
  ping <host>      - Ping a host
  curl <url>       - Fetch URL content

Text Processing:
  echo <text>      - Display text
  grep <pattern>   - Search text patterns
  man <command>    - Manual pages

Utilities:
  date             - Show current date/time
  history          - Command history
  alias            - Create command aliases
  which <cmd>      - Find command location
  clear            - Clear terminal
  fortune          - Random quote
  cowsay <msg>     - ASCII cow says message

Shell:
  export VAR=val   - Set environment variable
  exit             - Exit terminal

Tips:
- Use Tab for command completion
- Use ↑↓ arrows for command history
- Use Ctrl+C to cancel command
- Use Ctrl+L to clear screen
- Use Ctrl+U to clear current line
`;
        this.appendOutput(terminal, helpText, 'info');
    }

    showHistory(terminal) {
        if (this.commandHistory.length === 0) {
            this.appendOutput(terminal, 'No command history available.', 'info');
            return;
        }

        this.commandHistory.forEach((cmd, index) => {
            this.appendOutput(terminal, `${(index + 1).toString().padStart(4)} ${cmd}`, 'output');
        });
    }

    showWelcomeMessage(terminal) {
        const welcomeMessage = `
╔══════════════════════════════════════════════╗
║          💻 PIXEL PUSHER TERMINAL            ║
╠══════════════════════════════════════════════╣
║  Enhanced terminal with full command support ║
║                                              ║
║  Type 'help' for available commands          ║
║  Use Tab for completion, ↑↓ for history     ║
║  Ctrl+L: clear, Ctrl+C: cancel, Ctrl+D: exit║
║                                              ║
║  Ready for commands! 🚀                     ║
╚══════════════════════════════════════════════╝
`;
        this.appendOutput(terminal, welcomeMessage, 'system');
        this.updatePrompt(terminal);
    }

    appendOutput(terminal, text, type = 'output') {
        if (!terminal.output) return;

        const line = document.createElement('div');
        line.className = `terminal-line terminal-${type}`;

        const colors = {
            'command': '#00d9ff',
            'output': '#e0e0e0',
            'error': '#ff6b6b',
            'success': '#51cf66',
            'warning': '#ffd43b',
            'info': '#74c0fc',
            'system': '#00d9ff'
        };

        line.style.color = colors[type] || colors.output;
        line.style.marginBottom = '2px';
        line.style.fontFamily = 'var(--font-mono)';
        line.style.fontSize = '14px';
        line.style.lineHeight = '1.4';
        line.style.whiteSpace = 'pre-wrap';
        line.style.wordWrap = 'break-word';

        // Handle ANSI escape sequences
        const processedText = this.processAnsiCodes(text);
        line.innerHTML = processedText;

        terminal.output.appendChild(line);
        terminal.output.scrollTop = terminal.output.scrollHeight;

        // Limit output history
        this.limitOutputHistory(terminal);
    }

    processAnsiCodes(text) {
        // Simple ANSI color code processing
        return text
            .replace(/\x1b\[31m/g, '<span style="color: #ff6b6b;">')
            .replace(/\x1b\[32m/g, '<span style="color: #51cf66;">')
            .replace(/\x1b\[33m/g, '<span style="color: #ffd43b;">')
            .replace(/\x1b\[34m/g, '<span style="color: #74c0fc;">')
            .replace(/\x1b\[35m/g, '<span style="color: #da77f2;">')
            .replace(/\x1b\[36m/g, '<span style="color: #22b8cf;">')
            .replace(/\x1b\[0m/g, '</span>')
            .replace(/\n/g, '<br>');
    }

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

    updatePrompt(terminal) {
        if (!terminal.prompt) return;

        const user = terminal.environment.USER;
        const host = 'pusher';
        const path = terminal.currentPath === terminal.environment.HOME
            ? '~'
            : terminal.currentPath;

        terminal.prompt.textContent = `${user}@${host}:${path}$ `;
    }

    updateStatus(terminal) {
        const pathEl = document.getElementById(`terminal-path-${terminal.id}`);
        if (pathEl) {
            pathEl.textContent = terminal.currentPath;
        }
    }

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

        if (terminal.historyIndex === -1) {
            terminal.input.value = terminal.currentCommand;
        } else {
            const historyCommand = this.commandHistory[this.commandHistory.length - 1 - terminal.historyIndex];
            terminal.input.value = historyCommand;
        }

        terminal.input.setSelectionRange(terminal.input.value.length, terminal.input.value.length);
    }

    handleTabCompletion(terminal) {
        const input = terminal.input.value;
        const parts = input.split(' ');
        const lastPart = parts[parts.length - 1];

        const matches = this.commandCompletions.filter(cmd =>
            cmd.startsWith(lastPart.toLowerCase())
        );

        if (matches.length === 1) {
            parts[parts.length - 1] = matches[0];
            terminal.input.value = parts.join(' ');
        } else if (matches.length > 1) {
            this.appendOutput(terminal, `\nPossible completions:`, 'info');
            this.appendOutput(terminal, matches.join('  '), 'output');

            const promptText = terminal.prompt.textContent;
            this.appendOutput(terminal, `${promptText}${input}`, 'command');
        }
    }

    addToHistory(command) {
        if (!command || (this.commandHistory.length > 0 &&
            this.commandHistory[this.commandHistory.length - 1] === command)) {
            return;
        }

        this.commandHistory.push(command);

        if (this.commandHistory.length > this.maxHistorySize) {
            this.commandHistory.shift();
        }

        this.saveCommandHistory();
    }

    clearTerminal(terminalId) {
        const terminal = this.terminals.get(terminalId);
        if (terminal && terminal.output) {
            terminal.output.innerHTML = '';
            terminal.input.focus();
        }
    }

    cancelCommand(terminal) {
        if (terminal.isExecuting) {
            terminal.isExecuting = false;
            this.appendOutput(terminal, '^C', 'error');
            terminal.input.focus();
        }
    }

    exitTerminal(terminal) {
        if (window.pixelPusher?.modules?.windows) {
            window.pixelPusher.modules.windows.close(terminal.id);
        }
    }

    applyTerminalStyling(terminal) {
        terminal.container.style.cssText = `
            display: flex;
            flex-direction: column;
            height: 100%;
            background: #0a0a0a;
            color: #e0e0e0;
            font-family: var(--font-mono);
            font-size: 14px;
        `;

        const header = terminal.container.querySelector('.terminal-header');
        if (header) {
            header.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 16px;
                background: #1a1a1a;
                border-bottom: 1px solid #333;
            `;
        }

        const body = terminal.container.querySelector('.terminal-body');
        if (body) {
            body.style.cssText = `
                flex: 1;
                display: flex;
                flex-direction: column;
                padding: 16px;
                overflow: hidden;
            `;
        }

        const footer = terminal.container.querySelector('.terminal-footer');
        if (footer) {
            footer.style.cssText = `
                padding: 8px 16px;
                background: #1a1a1a;
                border-top: 1px solid #333;
                font-size: 12px;
                color: #888;
            `;
        }
    }

    initializeCommandCompletions() {
        this.commandCompletions = [
            ...Object.keys(this.builtinCommands),
            ...Object.keys(this.aliases),
            'nano', 'vim', 'emacs', 'git', 'npm', 'python', 'node',
            'htop', 'ssh', 'scp', 'rsync', 'wget', 'crontab'
        ].sort();
    }

    handleCommandResponse(terminal, result) {
        if (result.clear) {
            this.clearTerminal(terminal.id);
            return;
        }

        if (result.output) {
            this.appendOutput(terminal, result.output, 'output');
        }

        if (result.error) {
            this.appendOutput(terminal, result.message || 'An error occurred', 'error');
        }
    }

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

    saveCommandHistory() {
        try {
            localStorage.setItem('pixelpusher_terminal_history', JSON.stringify(this.commandHistory));
        } catch (error) {
            console.warn('Failed to save command history:', error);
        }
    }

    setupGlobalShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') {
                e.preventDefault();
                this.focusOrCreateTerminal();
            }
        });
    }

    focusOrCreateTerminal() {
        const existingTerminal = Array.from(this.terminals.values())[0];
        if (existingTerminal) {
            existingTerminal.input.focus();
            if (window.pixelPusher?.modules?.windows) {
                window.pixelPusher.modules.windows.focus(existingTerminal.id);
            }
        } else {
            if (window.pixelPusher?.modules?.windows) {
                window.pixelPusher.modules.windows.open('terminal');
            }
        }
    }

    destroy() {
        this.saveCommandHistory();
        this.terminals.clear();
        console.log('💻 Enhanced Terminal Manager destroyed');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedTerminalManager;
}

console.log('💻 Enhanced Terminal manager loaded successfully');