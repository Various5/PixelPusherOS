/**
 * Pixel Pusher OS - Authentication Manager
 * Handles user authentication, session management, and login/logout functionality
 *
 * This module provides:
 * - Login form handling and validation
 * - Session management and persistence
 * - User activity tracking
 * - Automatic session timeout
 * - Login state management
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 3600000; // 1 hour in milliseconds
        this.activityTimer = null;
        this.sessionTimer = null;
        this.isAuthenticated = false;

        console.log('🔐 Authentication Manager initialized');
    }

    /**
     * Initialize authentication system
     */
    async init() {
        try {
            // Check if user is already logged in
            this.checkAuthenticationStatus();

            // Set up login form handlers if present
            this.setupLoginHandlers();

            // Set up registration form handlers if present
            this.setupRegistrationHandlers();

            // Start session monitoring
            this.startSessionMonitoring();

            console.log('✅ Authentication system ready');

        } catch (error) {
            console.error('❌ Authentication initialization failed:', error);
        }
    }

    /**
     * Check current authentication status
     */
    checkAuthenticationStatus() {
        const loginOverlay = document.getElementById('loginOverlay');

        if (!loginOverlay || loginOverlay.style.display === 'none') {
            this.isAuthenticated = true;
            this.extractUserInfo();
        } else {
            this.isAuthenticated = false;
        }

        console.log(`🔐 Authentication status: ${this.isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);
    }

    /**
     * Extract user information from the page
     */
    extractUserInfo() {
        // Try to get user info from global variables or DOM
        const userElement = document.querySelector('[data-user]');
        const groupElement = document.querySelector('[data-group]');

        if (userElement) {
            this.currentUser = {
                username: userElement.dataset.user || 'unknown',
                group: groupElement?.dataset.group || 'user',
                loginTime: Date.now()
            };

            console.log(`👤 Current user: ${this.currentUser.username} (${this.currentUser.group})`);
        }
    }

    /**
     * Set up login form event handlers
     */
    setupLoginHandlers() {
        const loginForm = document.getElementById('loginForm');
        const loginButton = document.getElementById('loginButton');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        if (loginForm) {
            // Handle form submission
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));

            // Handle Enter key in password field
            if (passwordInput) {
                passwordInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.handleLogin(e);
                    }
                });
            }

            // Auto-focus username field
            if (usernameInput) {
                setTimeout(() => usernameInput.focus(), 100);
            }

            // Handle demo login buttons
            this.setupDemoLoginButtons();

            console.log('🔐 Login form handlers set up');
        }
    }

    /**
     * Set up demo login buttons
     */
    setupDemoLoginButtons() {
        const demoButtons = document.querySelectorAll('.demo-login');

        demoButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const username = button.dataset.username;
                const password = button.dataset.password;

                // Fill form with demo credentials
                const usernameInput = document.getElementById('username');
                const passwordInput = document.getElementById('password');

                if (usernameInput && passwordInput) {
                    usernameInput.value = username;
                    passwordInput.value = password;

                    // Trigger login
                    setTimeout(() => this.handleLogin(), 100);
                }
            });
        });
    }

    /**
     * Set up registration form event handlers
     */
    setupRegistrationHandlers() {
        const registerForm = document.getElementById('registerForm');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        if (registerForm) {
            // Handle form submission
            registerForm.addEventListener('submit', (e) => this.handleRegistration(e));

            // Password confirmation validation
            if (confirmPasswordInput) {
                confirmPasswordInput.addEventListener('input', () => {
                    this.validatePasswordConfirmation();
                });
            }

            // Username validation
            const usernameInput = document.getElementById('username');
            if (usernameInput) {
                usernameInput.addEventListener('input', () => {
                    this.validateUsername();
                });
            }

            console.log('📝 Registration form handlers set up');
        }
    }

    /**
     * Handle login form submission
     */
    async handleLogin(event) {
        if (event) {
            event.preventDefault();
        }

        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const rememberCheckbox = document.getElementById('remember');
        const loginButton = document.getElementById('loginButton');

        if (!usernameInput || !passwordInput) {
            this.showError('Login form elements not found');
            return;
        }

        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const remember = rememberCheckbox ? rememberCheckbox.checked : false;

        // Validation
        if (!username || !password) {
            this.showError('Please enter both username and password');
            return;
        }

        // Show loading state
        if (loginButton) {
            loginButton.disabled = true;
            loginButton.textContent = 'Signing in...';
        }

        try {
            // Submit login form (let Flask handle the actual authentication)
            const form = document.getElementById('loginForm');
            if (form) {
                form.submit();
            }

        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please try again.');

            // Reset button state
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = 'Sign In';
            }
        }
    }

    /**
     * Handle registration form submission
     */
    async handleRegistration(event) {
        event.preventDefault();

        const form = document.getElementById('registerForm');
        const submitButton = form.querySelector('button[type="submit"]');

        // Show loading state
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Creating Account...';
        }

        // Validate form before submission
        if (this.validateRegistrationForm()) {
            // Submit form (let Flask handle the actual registration)
            form.submit();
        } else {
            // Reset button state if validation failed
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Create Account';
            }
        }
    }

    /**
     * Validate registration form
     */
    validateRegistrationForm() {
        let isValid = true;

        // Validate username
        if (!this.validateUsername()) {
            isValid = false;
        }

        // Validate password
        if (!this.validatePassword()) {
            isValid = false;
        }

        // Validate password confirmation
        if (!this.validatePasswordConfirmation()) {
            isValid = false;
        }

        return isValid;
    }

    /**
     * Validate username input
     */
    validateUsername() {
        const usernameInput = document.getElementById('username');
        const errorElement = document.getElementById('usernameError');

        if (!usernameInput) return true;

        const username = usernameInput.value.trim();
        let errorMessage = '';

        if (!username) {
            errorMessage = 'Username is required';
        } else if (username.length < 3) {
            errorMessage = 'Username must be at least 3 characters long';
        } else if (username.length > 80) {
            errorMessage = 'Username must be less than 80 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            errorMessage = 'Username can only contain letters, numbers, and underscores';
        }

        // Show/hide error message
        if (errorElement) {
            if (errorMessage) {
                errorElement.textContent = errorMessage;
                errorElement.style.display = 'block';
                usernameInput.classList.add('error');
            } else {
                errorElement.style.display = 'none';
                usernameInput.classList.remove('error');
            }
        }

        return !errorMessage;
    }

    /**
     * Validate password input
     */
    validatePassword() {
        const passwordInput = document.getElementById('password');
        const errorElement = document.getElementById('passwordError');

        if (!passwordInput) return true;

        const password = passwordInput.value;
        let errorMessage = '';

        if (!password) {
            errorMessage = 'Password is required';
        } else if (password.length < 4) {
            errorMessage = 'Password must be at least 4 characters long';
        } else if (password.length > 128) {
            errorMessage = 'Password must be less than 128 characters';
        }

        // Show/hide error message
        if (errorElement) {
            if (errorMessage) {
                errorElement.textContent = errorMessage;
                errorElement.style.display = 'block';
                passwordInput.classList.add('error');
            } else {
                errorElement.style.display = 'none';
                passwordInput.classList.remove('error');
            }
        }

        return !errorMessage;
    }

    /**
     * Validate password confirmation
     */
    validatePasswordConfirmation() {
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const errorElement = document.getElementById('confirmPasswordError');

        if (!passwordInput || !confirmPasswordInput) return true;

        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        let errorMessage = '';

        if (confirmPassword && password !== confirmPassword) {
            errorMessage = 'Passwords do not match';
        }

        // Show/hide error message
        if (errorElement) {
            if (errorMessage) {
                errorElement.textContent = errorMessage;
                errorElement.style.display = 'block';
                confirmPasswordInput.classList.add('error');
            } else {
                errorElement.style.display = 'none';
                confirmPasswordInput.classList.remove('error');
            }
        }

        return !errorMessage;
    }

    /**
     * Start session monitoring and timeout handling
     */
    startSessionMonitoring() {
        if (!this.isAuthenticated) return;

        // Track user activity
        this.setupActivityTracking();

        // Set up session timeout
        this.resetSessionTimer();

        console.log('⏱️ Session monitoring started');
    }

    /**
     * Set up user activity tracking
     */
    setupActivityTracking() {
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        activityEvents.forEach(event => {
            document.addEventListener(event, () => this.updateActivity(), { passive: true });
        });
    }

    /**
     * Update user activity timestamp
     */
    updateActivity() {
        if (!this.isAuthenticated) return;

        // Clear existing timer
        if (this.activityTimer) {
            clearTimeout(this.activityTimer);
        }

        // Reset session timer
        this.resetSessionTimer();

        // Update state if available
        if (window.pixelPusher && window.pixelPusher.modules.state) {
            window.pixelPusher.modules.state.set('system.lastActivity', Date.now());
        }
    }

    /**
     * Reset session timeout timer
     */
    resetSessionTimer() {
        // Clear existing timer
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }

        // Set new timer
        this.sessionTimer = setTimeout(() => {
            this.handleSessionTimeout();
        }, this.sessionTimeout);
    }

    /**
     * Handle session timeout
     */
    handleSessionTimeout() {
        console.warn('⏱️ Session timeout - logging out user');

        // Show timeout notification
        if (window.pixelPusher) {
            window.pixelPusher.showNotification(
                'Your session has expired. Please log in again.',
                'warning',
                5000
            );
        }

        // Redirect to logout
        setTimeout(() => {
            window.location.href = '/logout';
        }, 2000);
    }

    /**
     * Show error message to user
     */
    showError(message) {
        // Try to use existing error display elements
        const errorElement = document.getElementById('loginError') ||
                            document.getElementById('error-message');

        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';

            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        } else {
            // Fallback to notification system
            if (window.pixelPusher) {
                window.pixelPusher.showNotification(message, 'error');
            } else {
                alert(message); // Last resort
            }
        }
    }

    /**
     * Show success message to user
     */
    showSuccess(message) {
        if (window.pixelPusher) {
            window.pixelPusher.showNotification(message, 'success');
        } else {
            console.log('Success:', message);
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            // Clear session data
            this.currentUser = null;
            this.isAuthenticated = false;

            // Clear timers
            if (this.sessionTimer) {
                clearTimeout(this.sessionTimer);
            }
            if (this.activityTimer) {
                clearTimeout(this.activityTimer);
            }

            // Clear local storage
            localStorage.removeItem('pixelpusher_state');

            // Redirect to logout endpoint
            window.location.href = '/logout';

        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    /**
     * Get current user information
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     */
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    /**
     * Get session information
     */
    getSessionInfo() {
        return {
            authenticated: this.isAuthenticated,
            user: this.currentUser,
            sessionAge: this.currentUser ? Date.now() - this.currentUser.loginTime : 0,
            timeoutRemaining: this.sessionTimer ? this.sessionTimeout : 0
        };
    }

    /**
     * Handle window resize for responsive login form
     */
    handleResize() {
        const loginOverlay = document.getElementById('loginOverlay');
        if (loginOverlay && loginOverlay.style.display !== 'none') {
            // Adjust login form for mobile devices
            const isMobile = window.innerWidth < 768;
            const loginContainer = document.querySelector('.login-container');

            if (loginContainer) {
                if (isMobile) {
                    loginContainer.style.width = '90%';
                    loginContainer.style.padding = '20px';
                } else {
                    loginContainer.style.width = '';
                    loginContainer.style.padding = '';
                }
            }
        }
    }

    /**
     * Clean up authentication manager
     */
    destroy() {
        // Clear timers
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }
        if (this.activityTimer) {
            clearTimeout(this.activityTimer);
        }

        // Remove event listeners (would need to track them to remove properly)
        console.log('🔐 Authentication Manager destroyed');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}

console.log('🔐 Authentication manager loaded successfully');