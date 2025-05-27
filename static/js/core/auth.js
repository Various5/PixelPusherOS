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
        this.initialized = false;

        console.log('🔐 Authentication Manager initialized');
    }

    /**
     * Initialize authentication system
     */
    async init() {
        if (this.initialized) {
            console.warn('⚠️ AuthManager already initialized');
            return;
        }

        try {
            // Check if user is already logged in
            this.checkAuthenticationStatus();

            // Set up login form handlers if present
            this.setupLoginHandlers();

            // Set up registration form handlers if present
            this.setupRegistrationHandlers();

            // Start session monitoring only if authenticated
            if (this.isAuthenticated) {
                this.startSessionMonitoring();
            }

            this.initialized = true;
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
        try {
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
        } catch (error) {
            console.warn('Could not extract user info:', error);
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

        if (!loginForm) {
            return; // No login form on this page
        }

        // Prevent multiple event listeners
        if (loginForm.dataset.handlersAttached) {
            return;
        }

        try {
            // Handle form submission
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(e);
            });

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
            if (usernameInput && !usernameInput.value) {
                setTimeout(() => {
                    try {
                        usernameInput.focus();
                    } catch (e) {
                        // Ignore focus errors
                    }
                }, 500);
            }

            // Handle demo login buttons
            this.setupDemoLoginButtons();

            // Mark handlers as attached
            loginForm.dataset.handlersAttached = 'true';

            console.log('🔐 Login form handlers set up');
        } catch (error) {
            console.error('Error setting up login handlers:', error);
        }
    }

    /**
     * Set up demo login buttons
     */
    setupDemoLoginButtons() {
        const demoButtons = document.querySelectorAll('.demo-login, .demo-use-button');

        demoButtons.forEach(button => {
            // Prevent multiple event listeners
            if (button.dataset.handlerAttached) {
                return;
            }

            button.addEventListener('click', (e) => {
                e.preventDefault();

                const username = button.dataset.username;
                const password = button.dataset.password;

                if (!username || !password) {
                    // Get from button text or onclick attribute
                    const buttonText = button.textContent || button.innerText;
                    if (buttonText.includes('admin')) {
                        this.fillDemoCredentials('admin', 'admin');
                    } else if (buttonText.includes('user')) {
                        this.fillDemoCredentials('user', 'user');
                    } else if (buttonText.includes('demo')) {
                        this.fillDemoCredentials('demo', 'demo');
                    }
                } else {
                    this.fillDemoCredentials(username, password);
                }
            });

            button.dataset.handlerAttached = 'true';
        });
    }

    /**
     * Fill form with demo credentials
     */
    fillDemoCredentials(username, password) {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        if (usernameInput && passwordInput) {
            usernameInput.value = username;
            passwordInput.value = password;

            // Animate the fill
            usernameInput.style.animation = 'pulse 0.5s ease-out';
            passwordInput.style.animation = 'pulse 0.5s ease-out';

            // Clear animations after they complete
            setTimeout(() => {
                usernameInput.style.animation = '';
                passwordInput.style.animation = '';
            }, 500);

            // Optional: Auto-submit after a short delay
            setTimeout(() => {
                if (confirm('Submit login with demo account?')) {
                    this.handleLogin();
                }
            }, 1000);
        }
    }

    /**
     * Set up registration form event handlers
     */
    setupRegistrationHandlers() {
        const registerForm = document.getElementById('registerForm');

        if (!registerForm || registerForm.dataset.handlersAttached) {
            return;
        }

        try {
            // Handle form submission
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegistration(e);
            });

            // Password confirmation validation
            const confirmPasswordInput = document.getElementById('confirm_password');
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

            registerForm.dataset.handlersAttached = 'true';
            console.log('📝 Registration form handlers set up');
        } catch (error) {
            console.error('Error setting up registration handlers:', error);
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
            const spinner = loginButton.querySelector('#loadingSpinner');
            const buttonText = loginButton.querySelector('#buttonText');

            if (spinner) spinner.style.display = 'inline-block';
            if (buttonText) buttonText.textContent = 'Signing in...';
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
                const spinner = loginButton.querySelector('#loadingSpinner');
                const buttonText = loginButton.querySelector('#buttonText');

                if (spinner) spinner.style.display = 'none';
                if (buttonText) buttonText.textContent = 'Sign In';
            }
        }
    }

    /**
     * Handle registration form submission
     */
    async handleRegistration(event) {
        if (event) {
            event.preventDefault();
        }

        const form = document.getElementById('registerForm');
        const submitButton = form?.querySelector('button[type="submit"]');

        // Show loading state
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Creating Account...';
        }

        // Validate form before submission
        if (this.validateRegistrationForm()) {
            // Submit form (let Flask handle the actual registration)
            if (form) {
                form.submit();
            }
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
        this.showFieldError('username', errorMessage);
        return !errorMessage;
    }

    /**
     * Validate password input
     */
    validatePassword() {
        const passwordInput = document.getElementById('password');
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
        this.showFieldError('password', errorMessage);
        return !errorMessage;
    }

    /**
     * Validate password confirmation
     */
    validatePasswordConfirmation() {
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm_password');

        if (!passwordInput || !confirmPasswordInput) return true;

        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        let errorMessage = '';

        if (confirmPassword && password !== confirmPassword) {
            errorMessage = 'Passwords do not match';
        }

        // Show/hide error message
        this.showFieldError('confirm_password', errorMessage);
        return !errorMessage;
    }

    /**
     * Show field-specific error
     */
    showFieldError(fieldName, message) {
        const field = document.getElementById(fieldName);
        if (!field) return;

        // Remove existing error
        field.classList.remove('error');
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        if (message) {
            // Add error styling and message
            field.classList.add('error');

            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.cssText = 'color: #e53e3e; font-size: 12px; margin-top: 5px;';
            errorDiv.textContent = message;

            field.parentNode.appendChild(errorDiv);
        }
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
            document.addEventListener(event, () => this.updateActivity(), {
                passive: true,
                once: false
            });
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
        if (window.pixelPusher?.modules?.state) {
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
        this.showError('Your session has expired. Please log in again.');

        // Redirect to logout after a short delay
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
            // Fallback to notification system or alert
            if (window.pixelPusher?.showNotification) {
                window.pixelPusher.showNotification(message, 'error');
            } else {
                console.error('Auth Error:', message);
                // Don't use alert as fallback to avoid blocking
            }
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
            try {
                localStorage.removeItem('pixelpusher_state');
            } catch (e) {
                // Ignore localStorage errors
            }

            // Redirect to logout endpoint
            window.location.href = '/logout';

        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect even if there's an error
            window.location.href = '/logout';
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
                    loginContainer.style.padding = '10px';
                } else {
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

        // Reset state
        this.initialized = false;
        this.isAuthenticated = false;
        this.currentUser = null;

        console.log('🔐 Authentication Manager destroyed');
    }
}

// Global function for demo login buttons (backward compatibility)
window.useDemoAccount = function(username, password) {
    if (window.pixelPusher?.modules?.auth) {
        window.pixelPusher.modules.auth.fillDemoCredentials(username, password);
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}

console.log('🔐 Authentication manager loaded successfully');