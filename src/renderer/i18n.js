// i18n.js - Internationalization system for Maraikka

class I18n {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = {};
        this.fallbackLanguage = 'en';
        this.supportedLanguages = {
            'en': 'English',
            'es': 'Español',
            'hi': 'हिन्दी',
            'ja': '日本語'
        };
        
        // Initialize with English as default
        this.initializeLanguage();
    }

    /**
     * Initialize the i18n system with saved language preference
     */
    async initializeLanguage() {
        try {
            // Load saved language preference
            const savedLanguage = localStorage.getItem('maraikka-language');
            if (savedLanguage && this.supportedLanguages[savedLanguage]) {
                this.currentLanguage = savedLanguage;
            }
            
            // Load the language files
            await this.loadLanguage(this.currentLanguage);
            
            // If current language is not English, also load English as fallback
            if (this.currentLanguage !== this.fallbackLanguage) {
                await this.loadLanguage(this.fallbackLanguage);
            }
            
            // Update UI after languages are loaded
            this.updateUI();
            
        } catch (error) {
            console.error('Failed to initialize language:', error);
            // Fallback to English if initialization fails
            this.currentLanguage = 'en';
            await this.loadLanguage('en');
            this.updateUI();
        }
    }

    /**
     * Load a language file
     * @param {string} langCode - Language code (e.g., 'en', 'es')
     */
    async loadLanguage(langCode) {
        try {
            const response = await fetch(`../locales/${langCode}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load language file: ${langCode}`);
            }
            const translations = await response.json();
            this.translations[langCode] = translations;
        } catch (error) {
            console.error(`Error loading language ${langCode}:`, error);
            // If we can't load the file, try to use the fallback
            if (langCode !== this.fallbackLanguage) {
                console.warn(`Falling back to ${this.fallbackLanguage} for ${langCode}`);
            }
        }
    }

    /**
     * Get translated text for a key
     * @param {string} key - Translation key (e.g., 'sidebar.actions')
     * @param {Object} params - Parameters for string interpolation
     * @returns {string} Translated text
     */
    t(key, params = {}) {
        const translation = this.getTranslation(key, this.currentLanguage) || 
                          this.getTranslation(key, this.fallbackLanguage) || 
                          key;
        
        // Handle string interpolation
        return this.interpolate(translation, params);
    }

    /**
     * Get translation from a specific language
     * @param {string} key - Translation key
     * @param {string} langCode - Language code
     * @returns {string|null} Translation or null if not found
     */
    getTranslation(key, langCode) {
        const lang = this.translations[langCode];
        if (!lang) return null;

        // Support nested keys like 'sidebar.actions'
        const keys = key.split('.');
        let value = lang;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }
        
        return typeof value === 'string' ? value : null;
    }

    /**
     * Interpolate parameters into translation string
     * @param {string} text - Text with placeholders
     * @param {Object} params - Parameters to interpolate
     * @returns {string} Interpolated text
     */
    interpolate(text, params) {
        if (!params || Object.keys(params).length === 0) {
            return text;
        }

        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    /**
     * Change the current language
     * @param {string} langCode - New language code
     */
    async changeLanguage(langCode) {
        if (!this.supportedLanguages[langCode]) {
            console.error(`Unsupported language: ${langCode}`);
            return;
        }

        // Load the new language if not already loaded
        if (!this.translations[langCode]) {
            await this.loadLanguage(langCode);
        }

        this.currentLanguage = langCode;
        
        // Save language preference
        localStorage.setItem('maraikka-language', langCode);
        
        // Update UI
        this.updateUI();
        
        // Emit language change event
        document.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: langCode } 
        }));
    }

    /**
     * Get available languages
     * @returns {Object} Object with language codes as keys and names as values
     */
    getAvailableLanguages() {
        return { ...this.supportedLanguages };
    }

    /**
     * Get current language code
     * @returns {string} Current language code
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Update all UI elements with current language
     */
    updateUI() {
        // Update all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const params = this.getElementParams(element);
            element.textContent = this.t(key, params);
        });

        // Update all placeholders with data-i18n-placeholder attribute
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const params = this.getElementParams(element);
            element.placeholder = this.t(key, params);
        });

        // Update all titles with data-i18n-title attribute
        const titleElements = document.querySelectorAll('[data-i18n-title]');
        titleElements.forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            const params = this.getElementParams(element);
            element.title = this.t(key, params);
        });
    }

    /**
     * Get interpolation parameters from element attributes
     * @param {HTMLElement} element - DOM element
     * @returns {Object} Parameters object
     */
    getElementParams(element) {
        const params = {};
        for (const attr of element.attributes) {
            if (attr.name.startsWith('data-i18n-param-')) {
                const paramName = attr.name.replace('data-i18n-param-', '');
                params[paramName] = attr.value;
            }
        }
        return params;
    }
}

// Create global i18n instance
window.i18n = new I18n();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18n;
} 