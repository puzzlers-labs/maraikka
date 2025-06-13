// Text Editor Window JavaScript
class TextEditor {
    constructor() {
        this.currentFile = null;
        this.isEncrypted = false;
        this.hasUnsavedChanges = false;
        this.originalContent = '';
        this.editor = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupIPCListeners();
        
        // Apply theme immediately - don't wait for IPC
        this.initializeTheme();
        
        // Initialize UI state - show loading by default
        this.showLoadingSection();
    }

    initializeElements() {
        // Main sections
        this.passwordSection = document.getElementById('passwordSection');
        this.loadingSection = document.getElementById('loadingSection');
        this.editorSection = document.getElementById('editorSection');
        
        // Elements
        this.fileName = document.getElementById('fileName');
        this.unsavedIndicator = document.getElementById('unsavedIndicator');
        this.textEditor = document.getElementById('textEditor');
        this.saveBtn = document.getElementById('saveBtn');
        this.fileStatus = document.getElementById('fileStatus');
        this.characterCount = document.getElementById('characterCount');
        this.lineCount = document.getElementById('lineCount');
        
        // Password elements
        this.passwordInput = document.getElementById('passwordInput');
        this.passwordSubmitBtn = document.getElementById('passwordSubmitBtn');
        this.passwordError = document.getElementById('passwordError');
        
        // Modal elements
        this.unsavedChangesModal = document.getElementById('unsavedChangesModal');
        this.saveAndCloseBtn = document.getElementById('saveAndCloseBtn');
        this.closeWithoutSavingBtn = document.getElementById('closeWithoutSavingBtn');
        this.cancelCloseBtn = document.getElementById('cancelCloseBtn');

        // Debug: Check if all elements were found
        console.log('Elements initialized:', {
            passwordSection: !!this.passwordSection,
            loadingSection: !!this.loadingSection,
            editorSection: !!this.editorSection,
            textEditor: !!this.textEditor,
            fileName: !!this.fileName,
            saveBtn: !!this.saveBtn
        });
    }

    setupEventListeners() {
        // Text editor input
        this.textEditor.addEventListener('input', (e) => {
            this.handleTextChange();
            this.updateStats();
        });

        // Save button
        this.saveBtn.addEventListener('click', () => this.saveFile());

        // Password form
        this.passwordSubmitBtn.addEventListener('click', () => this.handlePasswordSubmit());
        this.passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handlePasswordSubmit();
            }
        });

        // Unsaved changes modal
        this.saveAndCloseBtn.addEventListener('click', () => this.handleSaveAndClose());
        this.closeWithoutSavingBtn.addEventListener('click', () => this.handleCloseWithoutSaving());
        this.cancelCloseBtn.addEventListener('click', () => this.handleCancelClose());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveFile();
            }
        });

        // Focus password input when section is shown
        this.passwordInput.addEventListener('focus', () => {
            this.passwordError.classList.add('hidden');
        });
    }

    setupIPCListeners() {
        // Listen for file load event
        window.electronAPI.onLoadFile((event, fileInfo) => {
            this.loadFile(fileInfo.filePath, fileInfo.isEncrypted);
        });

        // Listen for unsaved changes check
        window.electronAPI.onCheckUnsavedChanges((event) => {
            if (this.hasUnsavedChanges) {
                this.showUnsavedChangesModal();
            } else {
                this.confirmClose();
            }
        });

        // Listen for theme changes from main window
        if (window.electronAPI && window.electronAPI.onThemeChanged) {
            window.electronAPI.onThemeChanged((event, theme) => {
                console.log('Theme changed via IPC:', theme);
                this.applyTheme(theme);
            });
        }
    }

    async loadFile(filePath, isEncrypted) {
        console.log('TextEditor.loadFile called with:', { filePath, isEncrypted });
        this.currentFile = filePath;
        this.isEncrypted = isEncrypted;
        
        // Update file name in header
        this.fileName.textContent = this.getFileName(filePath);
        console.log('Updated file name to:', this.getFileName(filePath));
        
        if (isEncrypted) {
            console.log('File is encrypted, showing password section');
            this.showPasswordSection();
        } else {
            console.log('File is not encrypted, loading content directly');
            await this.loadFileContent();
        }
    }

    showPasswordSection() {
        this.passwordSection.classList.remove('hidden');
        this.loadingSection.classList.add('hidden');
        this.editorSection.classList.add('hidden');
        this.passwordInput.focus();
    }

    showLoadingSection() {
        this.passwordSection.classList.add('hidden');
        this.loadingSection.classList.remove('hidden');
        this.editorSection.classList.add('hidden');
    }

    showEditorSection() {
        this.passwordSection.classList.add('hidden');
        this.loadingSection.classList.add('hidden');
        this.editorSection.classList.remove('hidden');
        this.textEditor.focus();
    }

    async handlePasswordSubmit() {
        const password = this.passwordInput.value.trim();
        
        if (!password) {
            this.showPasswordError('Please enter a password');
            return;
        }

        this.showLoadingSection();
        
        try {
            const result = await window.electronAPI.decryptFileForEdit(this.currentFile, password);
            
            if (result.success) {
                this.originalContent = result.content;
                this.textEditor.value = result.content;
                this.updateStats();
                this.setFileStatus('File loaded successfully');
                this.showEditorSection();
                this.hasUnsavedChanges = false;
                this.updateUnsavedIndicator();
            } else {
                this.showPasswordError(result.error || 'Failed to decrypt file');
                this.showPasswordSection();
            }
        } catch (error) {
            console.error('Error decrypting file:', error);
            this.showPasswordError('An error occurred while decrypting the file');
            this.showPasswordSection();
        }
    }

    async loadFileContent() {
        console.log('Loading file content for:', this.currentFile);
        this.showLoadingSection();
        
        try {
            const result = await window.electronAPI.readTextFile(this.currentFile);
            console.log('File read result:', result);
            
            if (result.success) {
                this.originalContent = result.content;
                this.textEditor.value = result.content;
                
                console.log('Content loaded into editor:', result.content.substring(0, 100) + '...');
                this.updateStats();
                this.setFileStatus('File loaded successfully');
                this.showEditorSection();
                
                this.hasUnsavedChanges = false;
                this.updateUnsavedIndicator();
            } else {
                console.error('Failed to load file:', result.error);
                this.setFileStatus('Error: ' + (result.error || 'Failed to load file'));
                this.showEditorSection(); // Show editor even on error so user can see the error
            }
        } catch (error) {
            console.error('Error loading file:', error);
            this.setFileStatus('Error: Failed to load file');
            this.showEditorSection();
        }
    }

    handleTextChange() {
        const currentContent = this.textEditor.value;
        const hasChanges = currentContent !== this.originalContent;
        
        if (hasChanges !== this.hasUnsavedChanges) {
            this.hasUnsavedChanges = hasChanges;
            this.updateUnsavedIndicator();
            this.updateWindowTitle();
        }
        
        // Update visual indicator
        if (hasChanges) {
            this.textEditor.classList.add('has-changes');
        } else {
            this.textEditor.classList.remove('has-changes');
        }
    }

    updateUnsavedIndicator() {
        if (this.hasUnsavedChanges) {
            this.unsavedIndicator.classList.remove('hidden');
        } else {
            this.unsavedIndicator.classList.add('hidden');
        }
    }

    updateWindowTitle() {
        window.electronAPI.updateEditorUnsavedStatus(this.currentFile, this.hasUnsavedChanges);
    }

    updateStats() {
        const content = this.textEditor.value;
        const characterCount = content.length;
        const lineCount = content.split('\n').length;
        
        this.characterCount.textContent = `${characterCount} characters`;
        this.lineCount.textContent = `${lineCount} line${lineCount !== 1 ? 's' : ''}`;
    }

    async saveFile() {
        if (!this.currentFile) {
            this.setFileStatus('Error: No file to save');
            return;
        }

        const content = this.textEditor.value;
        
        try {
            this.setFileStatus('Saving...');
            this.saveBtn.disabled = true;
            
            let result;
            
            if (this.isEncrypted) {
                const password = this.passwordInput.value;
                if (!password) {
                    this.setFileStatus('Error: Password required for encrypted file');
                    this.saveBtn.disabled = false;
                    return;
                }
                
                result = await window.electronAPI.encryptAndSaveTextFile(this.currentFile, content, password);
            } else {
                result = await window.electronAPI.writeTextFile(this.currentFile, content);
            }
            
            if (result.success) {
                this.originalContent = content;
                this.hasUnsavedChanges = false;
                this.updateUnsavedIndicator();
                this.updateWindowTitle();
                this.textEditor.classList.remove('has-changes');
                this.setFileStatus('File saved successfully');
            } else {
                this.setFileStatus('Error: ' + (result.error || 'Failed to save file'));
            }
        } catch (error) {
            console.error('Error saving file:', error);
            this.setFileStatus('Error: Failed to save file');
        } finally {
            this.saveBtn.disabled = false;
        }
    }

    showPasswordError(message) {
        this.passwordError.textContent = message;
        this.passwordError.classList.remove('hidden');
    }

    setFileStatus(message) {
        this.fileStatus.textContent = message;
        
        // Auto-clear status messages after 3 seconds
        if (message.includes('successfully') || message.includes('Error')) {
            setTimeout(() => {
                if (this.fileStatus.textContent === message) {
                    this.fileStatus.textContent = 'Ready';
                }
            }, 3000);
        }
    }

    getFileName(filePath) {
        return filePath.split(/[\\/]/).pop();
    }

    // Unsaved changes modal handlers
    showUnsavedChangesModal() {
        this.unsavedChangesModal.classList.remove('hidden');
    }

    hideUnsavedChangesModal() {
        this.unsavedChangesModal.classList.add('hidden');
    }

    async handleSaveAndClose() {
        await this.saveFile();
        // Check if save was successful by looking at unsaved changes
        if (!this.hasUnsavedChanges) {
            this.confirmClose();
        }
        this.hideUnsavedChangesModal();
    }

    handleCloseWithoutSaving() {
        this.hideUnsavedChangesModal();
        window.electronAPI.editorUnsavedChangesResponse('close-without-saving', this.currentFile);
    }

    handleCancelClose() {
        this.hideUnsavedChangesModal();
        window.electronAPI.editorUnsavedChangesResponse('cancel', this.currentFile);
    }

    confirmClose() {
        window.electronAPI.editorUnsavedChangesResponse('close-without-saving', this.currentFile);
    }

    async initializeTheme() {
        // First, immediately apply theme from localStorage as fallback
        const localTheme = localStorage.getItem('maraikka-theme') || 'dark';
        console.log('Applying local theme immediately:', localTheme);
        this.applyTheme(localTheme);
        
        try {
            // Then try to get current app theme from main process
            const appTheme = await window.electronAPI.getCurrentTheme();
            console.log('App theme from main process:', appTheme);
            
            // Apply app theme (this will override localStorage if different)
            if (appTheme !== localTheme) {
                console.log('App theme differs from local, applying:', appTheme);
                this.applyTheme(appTheme);
            }
        } catch (error) {
            console.log('Failed to get app theme from main process, using localStorage theme:', localTheme);
        }
    }

    applyTheme(theme) {
        console.log('Applying theme:', theme);
        
        // Apply theme to HTML element
        const html = document.querySelector('html');
        html.classList.remove('dark');
        if (theme === 'dark') {
            html.classList.add('dark');
            html.style.colorScheme = 'dark';
        } else {
            html.style.colorScheme = 'light';
        }
        
        // Apply theme to body (using same classes as main app)
        document.body.classList.remove('light-theme', 'dark');
        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.add('dark');
        }
        
        // Save theme preference (matching main app's key)
        localStorage.setItem('maraikka-theme', theme);
        console.log('Applied theme:', theme);
    }
}

// Initialize the text editor when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - initializing text editor');
    
    // Initialize text editor (theme will be applied in constructor)
    window.textEditor = new TextEditor();
    
    // Show editor section by default (will be overridden when file loads)
    setTimeout(() => {
        const editorSection = document.getElementById('editorSection');
        const passwordSection = document.getElementById('passwordSection');
        const loadingSection = document.getElementById('loadingSection');
        
        if (editorSection && passwordSection && loadingSection) {
            // Hide password and loading sections, show editor
            passwordSection.classList.add('hidden');
            loadingSection.classList.add('hidden');
            editorSection.classList.remove('hidden');
            console.log('Default sections visibility set - editor section should be visible');
        }
    }, 100);
}); 