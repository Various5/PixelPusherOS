/**
 * Pixel Pusher OS - Utility Functions & Helpers
 * Comprehensive collection of utility functions used throughout the application
 *
 * This module provides:
 * - DOM manipulation and selection utilities
 * - Animation and visual effect helpers
 * - Date/time formatting and manipulation
 * - File handling and validation utilities
 * - Network request and API helpers
 * - Mathematical calculations and conversions
 * - String processing and validation
 * - Browser compatibility and feature detection
 * - Performance optimization utilities
 * - Event handling and debouncing
 * - Local storage and data persistence
 * - Color manipulation and theme utilities
 */

class PixelPusherHelpers {
    constructor() {
        this.cache = new Map(); // General purpose cache
        this.eventListeners = new Map(); // Track event listeners for cleanup
        this.animationFrames = new Set(); // Track animation frames
        this.timers = new Set(); // Track timers for cleanup

        console.log('🔧 Pixel Pusher Helpers initialized');
    }

    // ===========================================
    // DOM MANIPULATION UTILITIES
    // ===========================================

    /**
     * Enhanced query selector with caching and error handling
     */
    $(selector, context = document) {
        const cacheKey = `${selector}_${context.nodeName || 'document'}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const element = context.querySelector(selector);
            if (element) {
                this.cache.set(cacheKey, element);
            }
            return element;
        } catch (error) {
            console.warn(`Invalid selector: ${selector}`, error);
            return null;
        }
    }

    /**
     * Enhanced query selector all with filtering
     */
    $$(selector, context = document) {
        try {
            return Array.from(context.querySelectorAll(selector));
        } catch (error) {
            console.warn(`Invalid selector: ${selector}`, error);
            return [];
        }
    }

    /**
     * Create element with attributes and children
     */
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);

        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, value);
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else {
                element[key] = value;
            }
        });

        // Add children
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Element) {
                element.appendChild(child);
            }
        });

        return element;
    }

    /**
     * Remove element safely
     */
    removeElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
            return true;
        }
        return false;
    }

    /**
     * Get element position relative to viewport
     */
    getElementPosition(element) {
        if (!element) return { x: 0, y: 0, width: 0, height: 0 };

        const rect = element.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            centerX: rect.left + rect.width / 2,
            centerY: rect.top + rect.height / 2
        };
    }

    /**
     * Check if element is visible in viewport
     */
    isElementVisible(element) {
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        return (
            rect.top >= -rect.height &&
            rect.left >= -rect.width &&
            rect.bottom <= viewport.height + rect.height &&
            rect.right <= viewport.width + rect.width
        );
    }

    /**
     * Smooth scroll to element
     */
    scrollToElement(element, options = {}) {
        if (!element) return;

        const defaultOptions = {
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
        };

        element.scrollIntoView({ ...defaultOptions, ...options });
    }

    // ===========================================
    // ANIMATION AND VISUAL EFFECTS
    // ===========================================

    /**
     * Smooth animation with easing functions
     */
    animate(options) {
        const {
            duration = 300,
            easing = 'easeInOutCubic',
            from = 0,
            to = 1,
            onUpdate = () => {},
            onComplete = () => {}
        } = options;

        const startTime = performance.now();
        const startValue = from;
        const endValue = to;
        const valueRange = endValue - startValue;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easedProgress = this.easingFunctions[easing]?.(progress) || progress;
            const currentValue = startValue + (valueRange * easedProgress);

            onUpdate(currentValue, progress);

            if (progress < 1) {
                const frameId = requestAnimationFrame(animate);
                this.animationFrames.add(frameId);
            } else {
                onComplete();
            }
        };

        const frameId = requestAnimationFrame(animate);
        this.animationFrames.add(frameId);

        return frameId;
    }

    /**
     * Easing functions for animations
     */
    easingFunctions = {
        linear: t => t,
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        easeInQuart: t => t * t * t * t,
        easeOutQuart: t => 1 - (--t) * t * t * t,
        easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
        easeInElastic: t => {
            const c4 = (2 * Math.PI) / 3;
            return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
        },
        easeOutElastic: t => {
            const c4 = (2 * Math.PI) / 3;
            return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
        },
        easeInBounce: t => 1 - this.easingFunctions.easeOutBounce(1 - t),
        easeOutBounce: t => {
            const n1 = 7.5625;
            const d1 = 2.75;

            if (t < 1 / d1) {
                return n1 * t * t;
            } else if (t < 2 / d1) {
                return n1 * (t -= 1.5 / d1) * t + 0.75;
            } else if (t < 2.5 / d1) {
                return n1 * (t -= 2.25 / d1) * t + 0.9375;
            } else {
                return n1 * (t -= 2.625 / d1) * t + 0.984375;
            }
        }
    };

    /**
     * Fade in element
     */
    fadeIn(element, duration = 300) {
        if (!element) return;

        element.style.opacity = '0';
        element.style.display = 'block';

        return this.animate({
            duration,
            from: 0,
            to: 1,
            easing: 'easeOutCubic',
            onUpdate: (value) => {
                element.style.opacity = value;
            }
        });
    }

    /**
     * Fade out element
     */
    fadeOut(element, duration = 300) {
        if (!element) return;

        return this.animate({
            duration,
            from: 1,
            to: 0,
            easing: 'easeInCubic',
            onUpdate: (value) => {
                element.style.opacity = value;
            },
            onComplete: () => {
                element.style.display = 'none';
            }
        });
    }

    /**
     * Slide element in from direction
     */
    slideIn(element, direction = 'left', duration = 300) {
        if (!element) return;

        const transforms = {
            left: 'translateX(-100%)',
            right: 'translateX(100%)',
            up: 'translateY(-100%)',
            down: 'translateY(100%)'
        };

        element.style.transform = transforms[direction];
        element.style.display = 'block';

        return this.animate({
            duration,
            easing: 'easeOutCubic',
            onUpdate: (progress) => {
                const remaining = 1 - progress;
                element.style.transform = transforms[direction].replace('100%', `${remaining * 100}%`);
            },
            onComplete: () => {
                element.style.transform = '';
            }
        });
    }

    /**
     * Pulse effect for element
     */
    pulse(element, scale = 1.1, duration = 500) {
        if (!element) return;

        const originalTransform = element.style.transform;

        return this.animate({
            duration: duration / 2,
            easing: 'easeOutCubic',
            onUpdate: (progress) => {
                const currentScale = 1 + (scale - 1) * progress;
                element.style.transform = `${originalTransform} scale(${currentScale})`;
            },
            onComplete: () => {
                this.animate({
                    duration: duration / 2,
                    easing: 'easeInCubic',
                    onUpdate: (progress) => {
                        const currentScale = scale - (scale - 1) * progress;
                        element.style.transform = `${originalTransform} scale(${currentScale})`;
                    },
                    onComplete: () => {
                        element.style.transform = originalTransform;
                    }
                });
            }
        });
    }

    // ===========================================
    // DATE AND TIME UTILITIES
    // ===========================================

    /**
     * Format timestamp to readable string
     */
    formatDate(timestamp, format = 'default') {
        const date = new Date(timestamp);

        const formats = {
            default: date.toLocaleString(),
            short: date.toLocaleDateString(),
            long: date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            time: date.toLocaleTimeString(),
            iso: date.toISOString(),
            relative: this.getRelativeTime(date)
        };

        return formats[format] || formats.default;
    }

    /**
     * Get relative time (e.g., "2 minutes ago")
     */
    getRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (seconds > 5) return `${seconds} seconds ago`;
        return 'just now';
    }

    /**
     * Format duration in seconds to readable string
     */
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    /**
     * Get timestamp for various time periods
     */
    getTimestamp(period = 'now') {
        const now = new Date();

        switch (period) {
            case 'now':
                return now.getTime();
            case 'today':
                return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            case 'week':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                weekStart.setHours(0, 0, 0, 0);
                return weekStart.getTime();
            case 'month':
                return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
            case 'year':
                return new Date(now.getFullYear(), 0, 1).getTime();
            default:
                return now.getTime();
        }
    }

    // ===========================================
    // FILE AND DATA UTILITIES
    // ===========================================

    /**
     * Format file size to human readable format
     */
    formatFileSize(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Get file extension from filename
     */
    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    /**
     * Get file type category
     */
    getFileType(filename) {
        const ext = this.getFileExtension(filename);

        const types = {
            image: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'],
            video: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv'],
            audio: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma'],
            document: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
            spreadsheet: ['xls', 'xlsx', 'csv', 'ods'],
            presentation: ['ppt', 'pptx', 'odp'],
            code: ['js', 'html', 'css', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs'],
            archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2']
        };

        for (const [type, extensions] of Object.entries(types)) {
            if (extensions.includes(ext)) {
                return type;
            }
        }

        return 'unknown';
    }

    /**
     * Read file as different formats
     */
    readFile(file, format = 'text') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);

            switch (format) {
                case 'text':
                    reader.readAsText(file);
                    break;
                case 'dataurl':
                    reader.readAsDataURL(file);
                    break;
                case 'arraybuffer':
                    reader.readAsArrayBuffer(file);
                    break;
                case 'binarystring':
                    reader.readAsBinaryString(file);
                    break;
                default:
                    reader.readAsText(file);
            }
        });
    }

    /**
     * Download data as file
     */
    downloadFile(data, filename, type = 'text/plain') {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }

    // ===========================================
    // NETWORK AND API UTILITIES
    // ===========================================

    /**
     * Enhanced fetch with timeout and retry
     */
    async fetchWithRetry(url, options = {}, retries = 3, timeout = 10000) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            },
            ...options
        };

        for (let i = 0; i < retries; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(url, {
                    ...defaultOptions,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response;
            } catch (error) {
                if (i === retries - 1) throw error;

                // Wait before retry with exponential backoff
                await this.sleep(Math.pow(2, i) * 1000);
            }
        }
    }

    /**
     * API call wrapper with error handling
     */
    async apiCall(endpoint, options = {}) {
        try {
            const response = await this.fetchWithRetry(`/api${endpoint}`, options);
            return await response.json();
        } catch (error) {
            console.error(`API call failed (${endpoint}):`, error);
            throw error;
        }
    }

    /**
     * Check if URL is valid
     */
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * Get query parameters from URL
     */
    getQueryParams(url = window.location.href) {
        const params = new URLSearchParams(new URL(url).search);
        const result = {};

        for (const [key, value] of params) {
            result[key] = value;
        }

        return result;
    }

    // ===========================================
    // MATHEMATICAL UTILITIES
    // ===========================================

    /**
     * Clamp number between min and max
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Linear interpolation
     */
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    /**
     * Map value from one range to another
     */
    mapRange(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }

    /**
     * Generate random number between min and max
     */
    random(min = 0, max = 1) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Generate random integer between min and max (inclusive)
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Round number to specified decimal places
     */
    roundTo(number, decimals = 2) {
        const factor = Math.pow(10, decimals);
        return Math.round(number * factor) / factor;
    }

    /**
     * Calculate distance between two points
     */
    distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    /**
     * Calculate angle between two points
     */
    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    // ===========================================
    // STRING UTILITIES
    // ===========================================

    /**
     * Capitalize first letter of string
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * Convert string to title case
     */
    titleCase(str) {
        return str.split(' ').map(word => this.capitalize(word)).join(' ');
    }

    /**
     * Convert camelCase to kebab-case
     */
    kebabCase(str) {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }

    /**
     * Convert kebab-case to camelCase
     */
    camelCase(str) {
        return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
    }

    /**
     * Truncate string with ellipsis
     */
    truncate(str, length, suffix = '...') {
        if (str.length <= length) return str;
        return str.substring(0, length - suffix.length) + suffix;
    }

    /**
     * Generate random string
     */
    randomString(length = 8, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    }

    /**
     * Generate UUID v4
     */
    uuid4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Escape HTML characters
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Remove HTML tags from string
     */
    stripHtml(str) {
        const div = document.createElement('div');
        div.innerHTML = str;
        return div.textContent || div.innerText || '';
    }

    // ===========================================
    // VALIDATION UTILITIES
    // ===========================================

    /**
     * Validate email address
     */
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    /**
     * Validate URL
     */
    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate password strength
     */
    validatePassword(password) {
        const result = {
            isValid: false,
            score: 0,
            feedback: []
        };

        if (password.length < 8) {
            result.feedback.push('Password must be at least 8 characters long');
        } else {
            result.score += 1;
        }

        if (!/[a-z]/.test(password)) {
            result.feedback.push('Password must contain lowercase letters');
        } else {
            result.score += 1;
        }

        if (!/[A-Z]/.test(password)) {
            result.feedback.push('Password must contain uppercase letters');
        } else {
            result.score += 1;
        }

        if (!/\d/.test(password)) {
            result.feedback.push('Password must contain numbers');
        } else {
            result.score += 1;
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            result.feedback.push('Password must contain special characters');
        } else {
            result.score += 1;
        }

        result.isValid = result.score >= 3;
        return result;
    }

    // ===========================================
    // COLOR UTILITIES
    // ===========================================

    /**
     * Convert hex color to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Convert RGB to hex color
     */
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    /**
     * Generate random color
     */
    randomColor() {
        return this.rgbToHex(
            this.randomInt(0, 255),
            this.randomInt(0, 255),
            this.randomInt(0, 255)
        );
    }

    /**
     * Lighten color by percentage
     */
    lightenColor(hex, percent) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;

        const factor = 1 + (percent / 100);
        return this.rgbToHex(
            Math.min(255, Math.round(rgb.r * factor)),
            Math.min(255, Math.round(rgb.g * factor)),
            Math.min(255, Math.round(rgb.b * factor))
        );
    }

    /**
     * Darken color by percentage
     */
    darkenColor(hex, percent) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;

        const factor = 1 - (percent / 100);
        return this.rgbToHex(
            Math.max(0, Math.round(rgb.r * factor)),
            Math.max(0, Math.round(rgb.g * factor)),
            Math.max(0, Math.round(rgb.b * factor))
        );
    }

    // ===========================================
    // EVENT HANDLING UTILITIES
    // ===========================================

    /**
     * Debounce function calls
     */
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    /**
     * Throttle function calls
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Add event listener with automatic cleanup tracking
     */
    addEventListener(element, event, handler, options = {}) {
        element.addEventListener(event, handler, options);

        const key = `${element.tagName}_${event}_${Date.now()}`;
        this.eventListeners.set(key, { element, event, handler, options });

        return key;
    }

    /**
     * Remove tracked event listener
     */
    removeEventListener(key) {
        const listener = this.eventListeners.get(key);
        if (listener) {
            listener.element.removeEventListener(listener.event, listener.handler, listener.options);
            this.eventListeners.delete(key);
            return true;
        }
        return false;
    }

    // ===========================================
    // STORAGE UTILITIES
    // ===========================================

    /**
     * Enhanced localStorage with JSON support and error handling
     */
    setStorage(key, value, type = 'local') {
        try {
            const storage = type === 'session' ? sessionStorage : localStorage;
            const serialized = JSON.stringify(value);
            storage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.warn(`Failed to set ${type} storage:`, error);
            return false;
        }
    }

    /**
     * Get from storage with default value
     */
    getStorage(key, defaultValue = null, type = 'local') {
        try {
            const storage = type === 'session' ? sessionStorage : localStorage;
            const item = storage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Failed to get ${type} storage:`, error);
            return defaultValue;
        }
    }

    /**
     * Remove from storage
     */
    removeStorage(key, type = 'local') {
        try {
            const storage = type === 'session' ? sessionStorage : localStorage;
            storage.removeItem(key);
            return true;
        } catch (error) {
            console.warn(`Failed to remove ${type} storage:`, error);
            return false;
        }
    }

    /**
     * Clear all storage
     */
    clearStorage(type = 'local') {
        try {
            const storage = type === 'session' ? sessionStorage : localStorage;
            storage.clear();
            return true;
        } catch (error) {
            console.warn(`Failed to clear ${type} storage:`, error);
            return false;
        }
    }

    // ===========================================
    // PERFORMANCE UTILITIES
    // ===========================================

    /**
     * Measure function execution time
     */
    measureTime(func, label = 'Function') {
        const start = performance.now();
        const result = func();
        const end = performance.now();
        console.log(`${label} took ${(end - start).toFixed(2)}ms`);
        return result;
    }

    /**
     * Simple sleep/delay function
     */
    sleep(ms) {
        return new Promise(resolve => {
            const id = setTimeout(resolve, ms);
            this.timers.add(id);
        });
    }

    /**
     * Batch DOM operations for better performance
     */
    batchDOMUpdates(callback) {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                callback();
                resolve();
            });
        });
    }

    /**
     * Check if browser supports a feature
     */
    supportsFeature(feature) {
        const features = {
            webgl: () => {
                try {
                    const canvas = document.createElement('canvas');
                    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
                } catch {
                    return false;
                }
            },
            webworkers: () => typeof Worker !== 'undefined',
            localstorage: () => {
                try {
                    localStorage.setItem('test', 'test');
                    localStorage.removeItem('test');
                    return true;
                } catch {
                    return false;
                }
            },
            touch: () => 'ontouchstart' in window,
            geolocation: () => 'geolocation' in navigator,
            websockets: () => 'WebSocket' in window,
            serviceworker: () => 'serviceWorker' in navigator
        };

        return features[feature] ? features[feature]() : false;
    }

    // ===========================================
    // CLEANUP AND UTILITY MANAGEMENT
    // ===========================================

    /**
     * Clean up all tracked resources
     */
    cleanup() {
        // Clear animation frames
        this.animationFrames.forEach(frameId => {
            cancelAnimationFrame(frameId);
        });
        this.animationFrames.clear();

        // Clear timers
        this.timers.forEach(timerId => {
            clearTimeout(timerId);
            clearInterval(timerId);
        });
        this.timers.clear();

        // Remove event listeners
        this.eventListeners.forEach((listener, key) => {
            this.removeEventListener(key);
        });

        // Clear cache
        this.cache.clear();

        console.log('🧹 Helpers cleanup completed');
    }

    /**
     * Get helper statistics
     */
    getStats() {
        return {
            cachedElements: this.cache.size,
            activeAnimations: this.animationFrames.size,
            activeTimers: this.timers.size,
            eventListeners: this.eventListeners.size,
            browserFeatures: {
                webgl: this.supportsFeature('webgl'),
                webworkers: this.supportsFeature('webworkers'),
                localStorage: this.supportsFeature('localstorage'),
                touch: this.supportsFeature('touch'),
                geolocation: this.supportsFeature('geolocation')
            }
        };
    }
}

// Create global instance
window.PixelPusherHelpers = new PixelPusherHelpers();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PixelPusherHelpers;
}

console.log('🔧 Pixel Pusher Helpers loaded successfully');