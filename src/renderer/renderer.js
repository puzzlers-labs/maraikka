// Application state
console.log('🚀 Renderer.js loaded - Version 2.0 with fixed action handling');
let currentDirectory = null;
let currentDirectoryContents = [];
let currentAction = null;
let currentFilePath = null;
let isProcessing = false;

// DOM elements
const selectDirectoryBtn = document.getElementById('selectDirectoryBtn');
const encryptBtn = document.getElementById('encryptBtn');
const decryptBtn = document.getElementById('decryptBtn');
const refreshBtn = document.getElementById('refreshBtn');
const currentPathElement = document.getElementById('currentPathText');
const fileList = document.getElementById('fileList');
const fileGrid = document.getElementById('fileGrid');
const emptyState = document.getElementById('emptyState');
const passwordModal = document.getElementById('passwordModal');
const passwordInput = document.getElementById('passwordInput');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const modalTitle = document.getElementById('passwordModalTitle');
const listViewBtn = document.getElementById('listViewBtn');
const gridViewBtn = document.getElementById('gridViewBtn');
const preferencesBtn = document.getElementById('preferencesBtn');
const preferencesModal = document.getElementById('preferencesModal');

// Event listeners
selectDirectoryBtn.addEventListener('click', selectDirectory);
encryptBtn.addEventListener('click', () => {
    console.log('Renderer: Encrypt button clicked');
    showPasswordModal('encrypt');
});
decryptBtn.addEventListener('click', () => {
    console.log('Renderer: Decrypt button clicked');
    showPasswordModal('decrypt');
});
refreshBtn.addEventListener('click', refreshDirectory);
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handlePasswordConfirm();
    }
});

listViewBtn.addEventListener('click', () => switchView('list'));
gridViewBtn.addEventListener('click', () => switchView('grid'));
preferencesBtn.addEventListener('click', showPreferences);

// Setup preview event listeners (moved here to ensure elements are defined)
document.addEventListener('DOMContentLoaded', () => {
    const previewCloseBtn = document.getElementById('closePreviewBtn');
    const previewResizeHandle = document.querySelector('.resize-handle');
    
    if (previewCloseBtn) {
        previewCloseBtn.addEventListener('click', closePreviewPane);
    }
    
    if (previewResizeHandle) {
        previewResizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);
            e.preventDefault();
        });
    }
    
    // Close preview with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentPreviewFile) {
            closePreviewPane();
        }
    });
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Setup menu event listeners
    setupMenuListeners();
    
    // Setup preferences event listeners
    setupPreferencesListeners();
    setupHardwareAuthListeners();
    
    // Load saved preferences
    loadPreferences();
    
    // Initialize hardware authentication
    initializeHardwareAuth();
});

// Setup menu event listeners
function setupMenuListeners() {
    // Listen for preferences menu item
    window.electronAPI.onShowPreferences(() => {
        console.log('Menu: Show preferences triggered');
        showPreferences();
    });
    
    // Listen for select directory menu item
    window.electronAPI.onSelectDirectoryMenu(() => {
        console.log('Menu: Select directory triggered');
        selectDirectory();
    });
    
    // Listen for show about menu item
    window.electronAPI.onShowAbout(() => {
        console.log('Menu: Show about triggered');
        showPreferences();
        // Switch to about tab
        setTimeout(() => {
            const aboutTab = document.querySelector('[data-tab="about"]');
            if (aboutTab) {
                aboutTab.click();
            }
        }, 100);
    });
    
    // Also listen for Cmd+, shortcut directly in renderer
    document.addEventListener('keydown', (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === ',') {
            event.preventDefault();
            console.log('Keyboard: Cmd+, shortcut triggered');
            showPreferences();
        }
    });
    
    // Setup new navigation menu items
    setupNavigationMenuItems();
}

// Setup navigation menu items
function setupNavigationMenuItems() {
    // No additional navigation items needed for encryption app
}

// Set active menu item
function setActiveMenuItem(activeId) {
    // Remove active class from all menu items
    const menuItems = document.querySelectorAll('.nav-menu-item');
    menuItems.forEach(item => {
        item.classList.remove('active'); 
    });
    
    // Add active class to clicked item
    const activeItem = document.getElementById(activeId);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// Directory selection
async function selectDirectory() {
    try {
        console.log('Renderer: Requesting directory selection...');
        const selectedPath = await window.electronAPI.selectDirectory();
        console.log('Renderer: Directory selection result:', selectedPath);
        
        if (selectedPath) {
            currentDirectory = selectedPath;
            console.log('Renderer: Set currentDirectory to:', currentDirectory);
            await loadDirectoryContents();
            enableButtons();
            updateCurrentPath();
            updateStatus('Directory loaded successfully');
            showNotification('Directory Selected', `Loaded: ${selectedPath}`, 'success');
        } else {
            console.log('Renderer: No directory selected');
        }
    } catch (error) {
        console.error('Renderer: Error selecting directory:', error);
        showNotification('Error', 'Failed to select directory', 'error');
    }
}

// Load directory contents
async function loadDirectoryContents() {
    if (!currentDirectory) return;

    try {
        showProgress('Loading directory contents...');
        const contents = await window.electronAPI.getDirectoryContents(currentDirectory);
        currentDirectoryContents = contents;
        renderFileList();
        updateStats();
        hideProgress();
    } catch (error) {
        console.error('Error loading directory contents:', error);
        hideProgress();
        showNotification('Error', 'Failed to load directory contents', 'error');
    }
}

// Render file list
function renderFileList() {
    // Clear existing content
    fileList.innerHTML = '';
    fileGrid.innerHTML = '';
    
    if (!currentDirectoryContents || currentDirectoryContents.length === 0) {
        emptyState.classList.remove('hidden');
        fileList.classList.add('hidden');
        fileGrid.classList.add('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    
    const isGridView = gridViewBtn.classList.contains('active');
    
    if (isGridView) {
        fileList.classList.add('hidden');
        fileGrid.classList.remove('hidden');
        renderGridView();
    } else {
        fileGrid.classList.add('hidden');
        fileList.classList.remove('hidden');
        renderListView();
    }
}

function renderListView() {
    currentDirectoryContents.forEach((item, index) => {
        const isEncrypted = item.encrypted;
        const isDirectory = item.isDirectory;
        const icon = getFileIcon(item.name, isDirectory, isEncrypted);
        const size = formatFileSize(item.size);
        const modified = formatDate(item.modified);

        const listItem = document.createElement('li');
        listItem.className = 'file-item';
        listItem.style.animationDelay = `${index * 0.05}s`;
        
        listItem.innerHTML = `
            <div class="file-icon">
                <i class="${icon}"></i>
            </div>
            <div class="file-info">
                <div class="file-name">${item.name}</div>
                <div class="file-meta">
                    <span>${isDirectory ? 'Directory' : size}</span>
                    <span>${modified}</span>
                    ${isEncrypted ? '<span style="color: #10b981;"><i class="fas fa-lock"></i> Encrypted</span>' : ''}
                </div>
            </div>
            <div class="file-actions">
                ${!isDirectory ? `
                    ${isPreviewableFile(item.name) || isPreviewableEncryptedFile(item.name, isEncrypted) ? `
                        <button class="file-action-btn" data-action="preview" data-file-path="${item.path}" data-encrypted="${isEncrypted}" title="Preview">
                            <i class="fas fa-eye"></i> Preview
                        </button>
                    ` : ''}
                    <button class="file-action-btn" data-action="encrypt" data-file-path="${item.path}">
                        <i class="fas fa-lock"></i> Encrypt
                    </button>
                    <button class="file-action-btn" data-action="decrypt" data-file-path="${item.path}">
                        <i class="fas fa-unlock"></i> Decrypt
                    </button>
                ` : ''}
            </div>
        `;
        
        fileList.appendChild(listItem);
    });
    
    setupFileActionListeners();
}

function renderGridView() {
    currentDirectoryContents.forEach((item, index) => {
        const isEncrypted = item.encrypted;
        const isDirectory = item.isDirectory;
        const icon = getFileIcon(item.name, isDirectory, isEncrypted);
        const size = formatFileSize(item.size);

        const gridItem = document.createElement('div');
        gridItem.className = 'file-card';
        gridItem.style.animationDelay = `${index * 0.05}s`;
        
        gridItem.innerHTML = `
            <div class="file-icon">
                <i class="${icon}"></i>
            </div>
            <div class="file-name">${item.name}</div>
            <div class="file-meta">
                <span>${isDirectory ? 'Directory' : size}</span>
                ${isEncrypted ? '<div style="color: #10b981; margin-top: 0.25rem;"><i class="fas fa-lock"></i> Encrypted</div>' : ''}
            </div>
            <div class="file-actions">
                ${!isDirectory ? `
                                    ${isPreviewableFile(item.name) || isPreviewableEncryptedFile(item.name, isEncrypted) ? `
                    <button class="file-action-btn" data-action="preview" data-file-path="${item.path}" data-encrypted="${isEncrypted}" title="Preview">
                        <i class="fas fa-eye"></i>
                    </button>
                ` : ''}
                    <button class="file-action-btn" data-action="encrypt" data-file-path="${item.path}">
                        <i class="fas fa-lock"></i>
                    </button>
                    <button class="file-action-btn" data-action="decrypt" data-file-path="${item.path}">
                        <i class="fas fa-unlock"></i>
                    </button>
                ` : ''}
            </div>
        `;
        
        fileGrid.appendChild(gridItem);
    });
    
    setupFileActionListeners();
}

function getFileIcon(filename, isDirectory, isEncrypted) {
    if (isDirectory) return 'fas fa-folder';
    if (isEncrypted) return 'fas fa-lock';
    
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
        // Images
        'jpg': 'fas fa-image', 'jpeg': 'fas fa-image', 'png': 'fas fa-image', 'gif': 'fas fa-image', 'svg': 'fas fa-image',
        // Documents
        'pdf': 'fas fa-file-pdf', 'doc': 'fas fa-file-word', 'docx': 'fas fa-file-word', 'txt': 'fas fa-file-text',
        // Code
        'js': 'fas fa-file-code', 'html': 'fas fa-file-code', 'css': 'fas fa-file-code', 'json': 'fas fa-file-code',
        // Archives
        'zip': 'fas fa-file-archive', 'rar': 'fas fa-file-archive', '7z': 'fas fa-file-archive',
        // Audio/Video
        'mp3': 'fas fa-file-audio', 'mp4': 'fas fa-file-video', 'avi': 'fas fa-file-video'
    };
    
    return iconMap[ext] || 'fas fa-file';
}

function isPreviewableFile(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const previewableExtensions = [
        // Images
        'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg',
        // Videos
        'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv',
        // Text files
        'txt', 'md', 'js', 'html', 'css', 'json', 'xml', 'csv', 'log',
        // PDFs
        'pdf'
    ];
    
    return previewableExtensions.includes(ext);
}

function isPreviewableEncryptedFile(filename, isEncrypted) {
    if (!isEncrypted) return false;
    
    // For encrypted files, check the original extension (remove .enc if present)
    let originalName = filename;
    if (filename.toLowerCase().endsWith('.enc')) {
        originalName = filename.slice(0, -4); // Remove '.enc'
    }
    
    return isPreviewableFile(originalName);
}

function setupFileActionListeners() {
    // Add event listeners for all file action buttons
    document.querySelectorAll('.file-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.getAttribute('data-action');
            const filePath = btn.getAttribute('data-file-path');
            const isEncrypted = btn.getAttribute('data-encrypted') === 'true';
            
            if (action === 'preview') {
                previewFile(filePath, isEncrypted);
            } else {
                showSingleFilePasswordModal(action, filePath);
            }
        });
    });
}

// Password modal functions
function showPasswordModal(action) {
    console.log(`Renderer: showPasswordModal called with action: ${action}`);
    currentAction = action;
    console.log(`Renderer: currentAction set to: ${currentAction}`);
    modalTitle.textContent = action === 'encrypt' ? 'Encrypt Directory' : 'Decrypt Directory';
    passwordInput.value = '';
    passwordModal.classList.remove('hidden');
    passwordInput.focus();
}

function closePasswordModal() {
    console.log(`Renderer: closePasswordModal called, currentAction was: ${currentAction}`);
    passwordModal.classList.add('hidden');
    currentAction = null;
    currentFilePath = null;
    passwordInput.value = '';
}

function showSingleFilePasswordModal(action, filePath) {
    console.log(`Renderer: showSingleFilePasswordModal called with action: ${action}, file: ${filePath}`);
    currentAction = action;
    currentFilePath = filePath;
    const fileName = filePath.split('/').pop();
    modalTitle.textContent = action === 'encrypt' ? `Encrypt File: ${fileName}` : `Decrypt File: ${fileName}`;
    passwordInput.value = '';
    passwordModal.classList.remove('hidden');
    passwordInput.focus();
}

function togglePasswordVisibility() {
    const input = passwordInput;
    const toggle = input.nextElementSibling;
    const icon = toggle.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Handle password confirmation
async function handlePasswordConfirm() {
    const password = passwordInput.value;
    console.log(`Renderer: Password confirm - Action: ${currentAction}, Directory: ${currentDirectory}`);
    
    if (!password) {
        showNotification('Error', 'Please enter a password', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Error', 'Password must be at least 6 characters long', 'error');
        return;
    }

    // Check if this is a single file operation or directory operation
    if (currentFilePath) {
        // Single file operation
        const actionToPerform = currentAction;
        const fileToProcess = currentFilePath;
        console.log(`Renderer: Single file operation - Action: ${actionToPerform}, File: ${fileToProcess}`);
        
        closePasswordModal();
        
        if (actionToPerform === 'encrypt') {
            console.log('Renderer: Starting single file encryption...');
            await encryptSingleFile(fileToProcess, password);
        } else if (actionToPerform === 'decrypt') {
            console.log('Renderer: Starting single file decryption...');
            await decryptSingleFile(fileToProcess, password);
        } else {
            console.error('Renderer: Unknown single file action:', actionToPerform);
            showNotification('Error', `Unknown action: ${actionToPerform}`, 'error');
        }
    } else {
        // Directory operation
        if (!currentDirectory) {
            showNotification('Error', 'No directory selected', 'error');
            return;
        }

        // Store the action before closing modal (which resets currentAction)
        const actionToPerform = currentAction;
        console.log(`Renderer: Stored action: ${actionToPerform}`);
        
        closePasswordModal();
        
        if (actionToPerform === 'encrypt') {
            console.log('Renderer: Starting encryption process...');
            await encryptDirectory(password);
        } else if (actionToPerform === 'decrypt') {
            console.log('Renderer: Starting decryption process...');
            await decryptDirectory(password);
        } else {
            console.error('Renderer: Unknown action:', actionToPerform);
            showNotification('Error', `Unknown action: ${actionToPerform}`, 'error');
        }
    }
}

// Encryption functions
async function encryptDirectory(password = null) {
    if (isProcessing) return;
    
    console.log(`Renderer: Starting directory encryption for ${currentDirectory}`);
    
    isProcessing = true;
    disableButtons();
    showProgress('Encrypting directory...');
    
    try {
        let authKey = password;
        
        // If no password provided, get authentication method (hardware or password)
        if (!authKey) {
            const auth = await getAuthenticationMethod();
            authKey = auth.key;
        }
        
        console.log('Renderer: Calling electronAPI.encryptDirectory...');
        const result = await window.electronAPI.encryptDirectory(currentDirectory, authKey);
        
        console.log('Renderer: Encryption result:', result);
        
        if (result.success) {
            showNotification('Success', result.message || 'Directory encrypted successfully', 'success');
            await loadDirectoryContents();
        } else {
            console.error('Renderer: Encryption failed:', result.error);
            showNotification('Error', result.error || 'Encryption failed', 'error');
        }
    } catch (error) {
        console.error('Renderer: Encryption error:', error);
        showNotification('Error', `Failed to encrypt directory: ${error.message}`, 'error');
    } finally {
        isProcessing = false;
        enableButtons();
        hideProgress();
    }
}

async function decryptDirectory(password = null) {
    if (isProcessing) return;
    
    console.log(`Renderer: Starting directory decryption for ${currentDirectory}`);
    
    isProcessing = true;
    disableButtons();
    showProgress('Decrypting directory...');
    
    try {
        let authKey = password;
        
        // If no password provided, get authentication method (hardware or password)
        if (!authKey) {
            const auth = await getAuthenticationMethod();
            authKey = auth.key;
        }
        
        console.log('Renderer: Calling electronAPI.decryptDirectory...');
        const result = await window.electronAPI.decryptDirectory(currentDirectory, authKey);
        
        console.log('Renderer: Decryption result:', result);
        
        if (result.success) {
            showNotification('Success', result.message || 'Directory decrypted successfully', 'success');
            await loadDirectoryContents();
        } else {
            console.error('Renderer: Decryption failed:', result.error);
            showNotification('Error', result.error || 'Decryption failed', 'error');
        }
    } catch (error) {
        console.error('Renderer: Decryption error:', error);
        showNotification('Error', `Failed to decrypt directory: ${error.message}`, 'error');
    } finally {
        isProcessing = false;
        enableButtons();
        hideProgress();
    }
}

// Single file encryption/decryption
async function encryptSingleFile(filePath, password = null) {
    if (isProcessing) return;
    
    console.log(`Renderer: Starting single file encryption for ${filePath}`);
    
    isProcessing = true;
    disableButtons();
    showProgress('Encrypting file...');
    
    try {
        let authKey = password;
        
        // If no password provided, get authentication method (hardware or password)
        if (!authKey) {
            const auth = await getAuthenticationMethod();
            authKey = auth.key;
        }
        
        const result = await window.electronAPI.encryptFile(filePath, authKey);
        
        if (result.success) {
            const fileName = filePath.split('/').pop();
            showNotification('Success', `File "${fileName}" encrypted successfully`, 'success');
            await loadDirectoryContents();
        } else {
            showNotification('Error', result.error || 'Encryption failed', 'error');
        }
    } catch (error) {
        console.error('File encryption error:', error);
        showNotification('Error', 'Failed to encrypt file', 'error');
    } finally {
        isProcessing = false;
        enableButtons();
        hideProgress();
    }
}

async function decryptSingleFile(filePath, password = null) {
    if (isProcessing) return;
    
    console.log(`Renderer: Starting single file decryption for ${filePath}`);
    
    isProcessing = true;
    disableButtons();
    showProgress('Decrypting file...');
    
    try {
        let authKey = password;
        
        // If no password provided, get authentication method (hardware or password)
        if (!authKey) {
            const auth = await getAuthenticationMethod();
            authKey = auth.key;
        }
        
        const result = await window.electronAPI.decryptFile(filePath, authKey);
        
        if (result.success) {
            const fileName = filePath.split('/').pop();
            showNotification('Success', `File "${fileName}" decrypted successfully`, 'success');
            await loadDirectoryContents();
        } else {
            showNotification('Error', result.error || 'Decryption failed', 'error');
        }
    } catch (error) {
        console.error('File decryption error:', error);
        showNotification('Error', 'Failed to decrypt file', 'error');
    } finally {
        isProcessing = false;
        enableButtons();
        hideProgress();
    }
}

// Refresh directory
async function refreshDirectory() {
    if (currentDirectory) {
        updateStatus('Refreshing directory...');
        await loadDirectoryContents();
        updateStatus('Directory refreshed');
        showNotification('Refreshed', 'Directory contents updated', 'info');
    }
}

// UI helper functions
function enableButtons() {
    encryptBtn.disabled = false;
    decryptBtn.disabled = false;
    refreshBtn.disabled = false;
}

function disableButtons() {
    encryptBtn.disabled = true;
    decryptBtn.disabled = true;
    refreshBtn.disabled = true;
}

function updateCurrentPath() {
    if (currentDirectory) {
        const pathSpan = currentPathElement.querySelector('span');
        pathSpan.textContent = currentDirectory;
        breadcrumbPath.textContent = currentDirectory;
    }
}

function updateStats() {
    const files = currentDirectoryContents.filter(item => !item.isDirectory);
    const directories = currentDirectoryContents.filter(item => item.isDirectory);
    const encrypted = currentDirectoryContents.filter(item => item.encrypted);

    totalFiles.textContent = files.length;
    totalDirs.textContent = directories.length;
    encryptedFiles.textContent = encrypted.length;
}

function showProgress(message) {
    if (progressContainer && progressText) {
        progressText.textContent = message;
        progressContainer.classList.remove('hidden');
        if (progressFill) progressFill.style.width = '100%';
    }
}

function hideProgress() {
    if (progressContainer) {
        progressContainer.classList.add('hidden');
        if (progressFill) progressFill.style.width = '0%';
    }
}

function updateStatus(message) {
    // Status message is now handled through notifications
    console.log('Status:', message);
}

function updateStatusTime() {
    // Status time is no longer needed in the new template
}

function switchView(viewType) {
    if (viewType === 'list') {
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
    } else {
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
    }
    
    // Re-render the file list with the new view
    renderFileList();
}

// Notification system
function showNotification(title, message, type = 'info') {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    notification.innerHTML = `
        <div class="notification-content">
            <i class="notification-icon ${iconMap[type]}"></i>
            <div class="notification-text">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
        </div>
    `;

    notificationContainer.appendChild(notification);

    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(date) {
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Notification styles are now handled in CSS

// Preferences functionality
function showPreferences() {
    console.log('Renderer: Opening preferences modal');
    preferencesModal.classList.remove('hidden');
    loadPreferences();
}

function closePreferences() {
    console.log('Renderer: Closing preferences modal');
    preferencesModal.classList.add('hidden');
}

function loadPreferences() {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('maraikka-theme') || 'dark';
    applyTheme(savedTheme);
    
    // Update theme selector
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('active');
        if (option.dataset.theme === savedTheme) {
            option.classList.add('active');
        }
    });
    
    // Additional preferences can be loaded here as needed
}

function applyTheme(theme) {
    console.log(`Renderer: Applying theme: ${theme}`);
    
    // Remove all theme classes
    document.body.classList.remove('light-theme', 'dark');
    
    // Apply the selected theme
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.add('dark');
    }
    
    localStorage.setItem('maraikka-theme', theme);
}

// Setup preferences event listeners (called after DOM is loaded)
function setupPreferencesListeners() {
    // Preferences tab switching
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Update active tab
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            document.querySelectorAll('.tab-panel').forEach(content => {
                content.classList.remove('active');
                content.classList.add('hidden');
            });
            const targetPanel = document.getElementById(`${targetTab}Tab`);
            if (targetPanel) {
                targetPanel.classList.add('active');
                targetPanel.classList.remove('hidden');
            }
        });
    });
    
    // Theme selector
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.dataset.theme;
            
            // Update active theme option
            document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            // Apply theme
            applyTheme(theme);
            showNotification('Theme Updated', `Switched to ${theme} theme`, 'success');
        });
    });
    
    // Additional preference controls can be added here as needed
}

// External link handler
function openExternal(url) {
    console.log(`Renderer: Opening external URL: ${url}`);
    // In a real Electron app, you would use shell.openExternal
    // For now, just show a notification
    showNotification('External Link', 'Link functionality will be implemented in production build', 'info');
}

// Close preferences with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && preferencesModal.classList.contains('show')) {
        closePreferences();
    }
});

// Close preferences when clicking outside
preferencesModal.addEventListener('click', (e) => {
    if (e.target === preferencesModal) {
        closePreferences();
    }
});

// File Preview Functionality
let isResizing = false;
let currentPreviewFile = null;

// Preview pane elements
const previewPane = document.getElementById('previewPane');
const previewFileName = document.getElementById('previewFileName');
const previewContent = document.querySelector('.preview-content');
const previewLoader = document.getElementById('previewLoader');
const previewError = document.getElementById('previewError');
const closePreviewBtn = document.getElementById('closePreviewBtn');
const resizeHandle = document.querySelector('.resize-handle');
const appContainer = document.querySelector('.app-container');

// Preview file function
async function previewFile(filePath, isEncrypted = false) {
    try {
        currentPreviewFile = filePath;
        const fileName = filePath.split('/').pop();
        previewFileName.textContent = fileName;
        
        // Open preview pane
        openPreviewPane();
        
        if (isEncrypted) {
            showPasswordPrompt(filePath);
        } else {
            // Show loading state
            showPreviewLoader();
            
            // Get file content based on type
            const ext = fileName.split('.').pop().toLowerCase();
            await renderPreviewContent(filePath, ext);
        }
        
    } catch (error) {
        console.error('Error previewing file:', error);
        showPreviewError();
    }
}

function openPreviewPane() {
    previewPane.classList.remove('hidden');
    appContainer.classList.add('preview-open');
    
    // Set initial margin based on preview pane width
    const mainContent = document.querySelector('.main-content');
    const previewWidth = previewPane.offsetWidth || 480; // Default 30rem = 480px
    mainContent.style.marginRight = `${previewWidth}px`;
}

function closePreviewPane() {
    previewPane.classList.add('hidden');
    appContainer.classList.remove('preview-open');
    
    // Reset main content margin to 0
    const mainContent = document.querySelector('.main-content');
    mainContent.style.marginRight = '0';
    
    clearPreviewContent();
    currentPreviewFile = null;
}

function showPreviewLoader() {
    previewLoader.classList.remove('hidden');
    previewError.classList.add('hidden');
    clearPreviewContent();
}

function showPreviewError() {
    previewLoader.classList.add('hidden');
    previewError.classList.remove('hidden');
    clearPreviewContent();
}

function clearPreviewContent() {
    // Remove any existing content except loader and error
    const existingContent = previewContent.querySelector('.preview-image-container, .preview-video, .preview-text, .preview-pdf, .preview-unsupported, .preview-password-prompt');
    if (existingContent) {
        existingContent.remove();
    }
}

function showPasswordPrompt(filePath) {
    previewLoader.classList.add('hidden');
    previewError.classList.add('hidden');
    clearPreviewContent();
    
    const fileName = filePath.split('/').pop();
    const promptDiv = document.createElement('div');
    promptDiv.className = 'preview-password-prompt';
    
    promptDiv.innerHTML = `
        <i class="fas fa-lock"></i>
        <h3>Encrypted File</h3>
        <p>Enter password to preview "${fileName}"</p>
        <div class="preview-password-form">
            <input type="password" class="preview-password-input" placeholder="Enter password" />
            <div class="preview-password-buttons">
                <button class="preview-password-btn secondary cancel-btn">Cancel</button>
                <button class="preview-password-btn primary unlock-btn">Unlock & Preview</button>
            </div>
            <div class="preview-error-message hidden"></div>
        </div>
    `;
    
    previewContent.appendChild(promptDiv);
    
    const passwordInput = promptDiv.querySelector('.preview-password-input');
    const unlockBtn = promptDiv.querySelector('.unlock-btn');
    const cancelBtn = promptDiv.querySelector('.cancel-btn');
    const errorDiv = promptDiv.querySelector('.preview-error-message');
    
    // Focus password input
    passwordInput.focus();
    
    // Handle unlock button
    const handleUnlock = async () => {
        const password = passwordInput.value.trim();
        if (!password) {
            showPasswordError(errorDiv, 'Please enter a password');
            return;
        }
        
        if (password.length < 6) {
            showPasswordError(errorDiv, 'Password must be at least 6 characters');
            return;
        }
        
        try {
            unlockBtn.disabled = true;
            unlockBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Decrypting...';
            hidePasswordError(errorDiv);
            
            await previewEncryptedFile(filePath, password);
        } catch (error) {
            console.error('Error decrypting file for preview:', error);
            showPasswordError(errorDiv, error.message || 'Failed to decrypt file');
        } finally {
            unlockBtn.disabled = false;
            unlockBtn.innerHTML = 'Unlock & Preview';
        }
    };
    
    // Handle cancel button
    const handleCancel = () => {
        closePreviewPane();
    };
    
    // Event listeners
    unlockBtn.addEventListener('click', handleUnlock);
    cancelBtn.addEventListener('click', handleCancel);
    
    // Enter key to unlock
    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !unlockBtn.disabled) {
            handleUnlock();
        }
    });
}

function showPasswordError(errorDiv, message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hidePasswordError(errorDiv) {
    errorDiv.classList.add('hidden');
}

async function previewEncryptedFile(filePath, password) {
    try {
        const result = await window.electronAPI.decryptFileForPreview(filePath, password);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        // Clear password prompt
        clearPreviewContent();
        showPreviewLoader();
        
        // Render the decrypted content
        await renderDecryptedPreviewContent(result);
        
    } catch (error) {
        console.error('Error previewing encrypted file:', error);
        throw error;
    }
}

async function renderDecryptedPreviewContent(decryptedData) {
    try {
        previewLoader.classList.add('hidden');
        previewError.classList.add('hidden');
        
        const { data, extension, mimeType } = decryptedData;
        
        if (isImageFile(extension)) {
            await renderDecryptedImagePreview(data, mimeType);
        } else if (isVideoFile(extension)) {
            await renderDecryptedVideoPreview(data, mimeType);
        } else if (isTextFile(extension)) {
            await renderDecryptedTextPreview(data);
        } else if (extension === 'pdf') {
            await renderDecryptedPDFPreview(data);
        } else {
            renderUnsupportedPreview();
        }
    } catch (error) {
        console.error('Error rendering decrypted preview:', error);
        showPreviewError();
    }
}

async function renderDecryptedImagePreview(data, mimeType) {
    // Create container for image and controls
    const container = document.createElement('div');
    container.className = 'preview-image-container';
    
    // Create image element
    const img = document.createElement('img');
    img.className = 'preview-image';
    img.alt = 'Preview';
    
    // Convert buffer to blob and create object URL
    const blob = new Blob([data], { type: mimeType });
    const imageUrl = URL.createObjectURL(blob);
    img.src = imageUrl;
    
    // Create controls
    const controls = document.createElement('div');
    controls.className = 'preview-image-controls';
    controls.innerHTML = `
        <button class="zoom-out-btn" title="Zoom Out">
            <i class="fas fa-minus"></i>
        </button>
        <button class="zoom-in-btn" title="Zoom In">
            <i class="fas fa-plus"></i>
        </button>
        <button class="zoom-fit-btn" title="Fit to Window">
            <i class="fas fa-expand-arrows-alt"></i>
        </button>
        <div class="zoom-level">100%</div>
        <button class="zoom-reset-btn" title="Reset Zoom">
            <i class="fas fa-undo"></i>
        </button>
    `;
    
    container.appendChild(img);
    container.appendChild(controls);
    
    img.onload = () => {
        previewContent.appendChild(container);
        setupImageZoomPan(container, img, controls);
    };
    
    img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        showPreviewError();
    };
    
    // Clean up URL when preview closes
    const originalClosePreview = closePreviewPane;
    closePreviewPane = () => {
        URL.revokeObjectURL(imageUrl);
        closePreviewPane = originalClosePreview;
        originalClosePreview();
    };
}

async function renderDecryptedVideoPreview(data, mimeType) {
    const video = document.createElement('video');
    video.className = 'preview-video';
    video.controls = true;
    video.preload = 'metadata';
    
    // Convert buffer to blob and create object URL
    const blob = new Blob([data], { type: mimeType });
    const videoUrl = URL.createObjectURL(blob);
    video.src = videoUrl;
    
    video.onloadedmetadata = () => {
        previewContent.appendChild(video);
    };
    
    video.onerror = () => {
        URL.revokeObjectURL(videoUrl);
        showPreviewError();
    };
    
    // Clean up URL when preview closes
    const originalClosePreview = closePreviewPane;
    closePreviewPane = () => {
        URL.revokeObjectURL(videoUrl);
        closePreviewPane = originalClosePreview;
        originalClosePreview();
    };
}

async function renderDecryptedTextPreview(data) {
    const textDiv = document.createElement('div');
    textDiv.className = 'preview-text';
    textDiv.textContent = data.toString('utf8');
    
    previewContent.appendChild(textDiv);
}

async function renderDecryptedPDFPreview(data) {
    // Convert buffer to blob and create object URL
    const blob = new Blob([data], { type: 'application/pdf' });
    const pdfUrl = URL.createObjectURL(blob);
    
    const iframe = document.createElement('iframe');
    iframe.className = 'preview-pdf';
    iframe.src = pdfUrl;
    
    iframe.onload = () => {
        previewContent.appendChild(iframe);
    };
    
    iframe.onerror = () => {
        URL.revokeObjectURL(pdfUrl);
        showPreviewError();
    };
    
    // Clean up URL when preview closes
    const originalClosePreview = closePreviewPane;
    closePreviewPane = () => {
        URL.revokeObjectURL(pdfUrl);
        closePreviewPane = originalClosePreview;
        originalClosePreview();
    };
}

async function renderPreviewContent(filePath, ext) {
    try {
        previewLoader.classList.add('hidden');
        previewError.classList.add('hidden');
        
        if (isImageFile(ext)) {
            await renderImagePreview(filePath);
        } else if (isVideoFile(ext)) {
            await renderVideoPreview(filePath);
        } else if (isTextFile(ext)) {
            await renderTextPreview(filePath);
        } else if (ext === 'pdf') {
            await renderPDFPreview(filePath);
        } else {
            renderUnsupportedPreview();
        }
    } catch (error) {
        console.error('Error rendering preview:', error);
        showPreviewError();
    }
}

function isImageFile(ext) {
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
}

function isVideoFile(ext) {
    return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext);
}

function isTextFile(ext) {
    return ['txt', 'md', 'js', 'html', 'css', 'json', 'xml', 'csv', 'log'].includes(ext);
}

async function renderImagePreview(filePath) {
    // Create container for image and controls
    const container = document.createElement('div');
    container.className = 'preview-image-container';
    
    // Create image element
    const img = document.createElement('img');
    img.className = 'preview-image';
    img.src = `file://${filePath}`;
    img.alt = 'Preview';
    
    // Create controls
    const controls = document.createElement('div');
    controls.className = 'preview-image-controls';
    controls.innerHTML = `
        <button class="zoom-out-btn" title="Zoom Out">
            <i class="fas fa-minus"></i>
        </button>
        <button class="zoom-in-btn" title="Zoom In">
            <i class="fas fa-plus"></i>
        </button>
        <button class="zoom-fit-btn" title="Fit to Window">
            <i class="fas fa-expand-arrows-alt"></i>
        </button>
        <div class="zoom-level">100%</div>
        <button class="zoom-reset-btn" title="Reset Zoom">
            <i class="fas fa-undo"></i>
        </button>
    `;
    
    container.appendChild(img);
    container.appendChild(controls);
    
    img.onload = () => {
        previewContent.appendChild(container);
        setupImageZoomPan(container, img, controls);
    };
    
    img.onerror = () => {
        showPreviewError();
    };
}

function setupImageZoomPan(container, img, controls) {
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let lastTranslateX = 0;
    let lastTranslateY = 0;
    
    const minScale = 0.1;
    const maxScale = 5;
    const scaleStep = 0.2;
    
    // Update transform
    function updateTransform() {
        img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        controls.querySelector('.zoom-level').textContent = `${Math.round(scale * 100)}%`;
    }
    
    // Zoom to fit
    function zoomToFit() {
        const containerRect = container.getBoundingClientRect();
        const imgRect = img.getBoundingClientRect();
        
        const scaleX = containerRect.width / img.naturalWidth;
        const scaleY = containerRect.height / img.naturalHeight;
        scale = Math.min(scaleX, scaleY, 1);
        
        translateX = 0;
        translateY = 0;
        updateTransform();
    }
    
    // Reset zoom
    function resetZoom() {
        scale = 1;
        translateX = 0;
        translateY = 0;
        updateTransform();
    }
    
    // Zoom in/out
    function zoom(delta) {
        const newScale = Math.max(minScale, Math.min(maxScale, scale + delta));
        if (newScale !== scale) {
            scale = newScale;
            updateTransform();
        }
    }
    
    // Mouse wheel zoom
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -scaleStep : scaleStep;
        zoom(delta);
    });
    
    // Mouse drag to pan
    container.addEventListener('mousedown', (e) => {
        if (scale > 1) {
            isDragging = true;
            container.classList.add('dragging');
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            lastTranslateX = translateX;
            lastTranslateY = translateY;
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;
            translateX = lastTranslateX + deltaX;
            translateY = lastTranslateY + deltaY;
            updateTransform();
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        container.classList.remove('dragging');
    });
    
    // Button controls
    controls.querySelector('.zoom-in-btn').addEventListener('click', () => zoom(scaleStep));
    controls.querySelector('.zoom-out-btn').addEventListener('click', () => zoom(-scaleStep));
    controls.querySelector('.zoom-fit-btn').addEventListener('click', zoomToFit);
    controls.querySelector('.zoom-reset-btn').addEventListener('click', resetZoom);
    
    // Initial zoom at 100%
    updateTransform();
}

async function renderVideoPreview(filePath) {
    const video = document.createElement('video');
    video.className = 'preview-video';
    video.src = `file://${filePath}`;
    video.controls = true;
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
        previewContent.appendChild(video);
    };
    
    video.onerror = () => {
        showPreviewError();
    };
}

async function renderTextPreview(filePath) {
    try {
        // Use Electron's fs to read text files
        const content = await window.electronAPI.readTextFile(filePath);
        
        const textDiv = document.createElement('div');
        textDiv.className = 'preview-text';
        textDiv.textContent = content;
        
        previewContent.appendChild(textDiv);
    } catch (error) {
        console.error('Error reading text file:', error);
        showPreviewError();
    }
}

async function renderPDFPreview(filePath) {
    const iframe = document.createElement('iframe');
    iframe.className = 'preview-pdf';
    iframe.src = `file://${filePath}`;
    
    iframe.onload = () => {
        previewContent.appendChild(iframe);
    };
    
    iframe.onerror = () => {
        showPreviewError();
    };
}

function renderUnsupportedPreview() {
    const unsupportedDiv = document.createElement('div');
    unsupportedDiv.className = 'preview-unsupported';
    unsupportedDiv.innerHTML = `
        <i class="fas fa-file"></i>
        <h3>Preview not available</h3>
        <p>This file type is not supported for preview.</p>
    `;
    
    previewContent.appendChild(unsupportedDiv);
}

// Event listeners for preview pane
closePreviewBtn.addEventListener('click', closePreviewPane);

// Resize functionality
resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    e.preventDefault();
});

function handleResize(e) {
    if (!isResizing) return;
    
    const containerRect = appContainer.getBoundingClientRect();
    const newWidth = containerRect.right - e.clientX;
    
    // Apply min/max constraints
    const minWidth = 320; // 20rem
    const maxWidth = 800; // 50rem
    const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    
    previewPane.style.width = `${constrainedWidth}px`;
    
    // Update main content margin
    if (appContainer.classList.contains('preview-open')) {
        document.querySelector('.main-content').style.marginRight = `${constrainedWidth}px`;
    }
}

function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
}

// Close preview with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !previewPane.classList.contains('hidden')) {
        closePreviewPane();
    }
});

// Hardware Authentication Functions
let hardwareAuthConfig = {
    isEnabled: false,
    hasCredentials: false,
    credentialIds: []
};

async function initializeHardwareAuth() {
    try {
        const config = await window.electronAPI.loadHardwareAuthConfig();
        if (config.success) {
            hardwareAuthConfig = config;
            updateHardwareAuthUI();
        }
    } catch (error) {
        console.error('Error loading hardware auth config:', error);
    }
}

function updateHardwareAuthUI() {
    const checkbox = document.getElementById('hardwareAuthEnabled');
    const statusDiv = document.getElementById('hardwareAuthStatus');
    const statusText = document.getElementById('hardwareAuthStatusText');
    const registerBtn = document.getElementById('registerHardwareAuth');
    const removeBtn = document.getElementById('removeHardwareAuth');
    
    if (checkbox) {
        checkbox.checked = hardwareAuthConfig.isEnabled;
        
        if (hardwareAuthConfig.isEnabled && hardwareAuthConfig.hasCredentials) {
            statusDiv.classList.remove('hidden');
            statusText.textContent = 'Hardware authenticator registered';
            statusText.parentElement.classList.add('success');
            registerBtn.classList.add('hidden');
            removeBtn.classList.remove('hidden');
        } else if (hardwareAuthConfig.isEnabled) {
            statusDiv.classList.remove('hidden');
            statusText.textContent = 'No authenticator registered';
            statusText.parentElement.classList.remove('success');
            registerBtn.classList.remove('hidden');
            removeBtn.classList.add('hidden');
        } else {
            statusDiv.classList.add('hidden');
        }
    }
}

function setupHardwareAuthListeners() {
    const checkbox = document.getElementById('hardwareAuthEnabled');
    const registerBtn = document.getElementById('registerHardwareAuth');
    const removeBtn = document.getElementById('removeHardwareAuth');
    
    if (checkbox) {
        checkbox.addEventListener('change', async (e) => {
            if (e.target.checked) {
                // Enable hardware auth
                if (!hardwareAuthConfig.hasCredentials) {
                    // Need to register first
                    showHardwareAuthModal('register');
                } else {
                    hardwareAuthConfig.isEnabled = true;
                    updateHardwareAuthUI();
                }
            } else {
                // Disable hardware auth
                hardwareAuthConfig.isEnabled = false;
                updateHardwareAuthUI();
            }
        });
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            showHardwareAuthModal('register');
        });
    }
    
    if (removeBtn) {
        removeBtn.addEventListener('click', async () => {
            if (confirm('Remove hardware authentication? You will need to re-register your authenticator to use this feature again.')) {
                try {
                    const result = await window.electronAPI.removeHardwareAuth();
                    if (result.success) {
                        hardwareAuthConfig = {
                            isEnabled: false,
                            hasCredentials: false,
                            credentialIds: []
                        };
                        updateHardwareAuthUI();
                        showNotification('Hardware Authentication', 'Authenticator removed successfully', 'success');
                    } else {
                        showNotification('Error', 'Failed to remove authenticator: ' + result.error, 'error');
                    }
                } catch (error) {
                    console.error('Error removing hardware auth:', error);
                    showNotification('Error', 'Failed to remove authenticator', 'error');
                }
            }
        });
    }
}

function showHardwareAuthModal(mode = 'register') {
    const modal = document.getElementById('hardwareAuthModal');
    const title = document.getElementById('hardwareAuthModalTitle');
    const content = document.getElementById('hardwareAuthContent');
    const startBtn = document.getElementById('startHardwareAuth');
    const cancelBtn = document.getElementById('cancelHardwareAuth');
    
    if (mode === 'register') {
        title.textContent = 'Register Hardware Authenticator';
        content.innerHTML = `
            <i class="fas fa-key"></i>
            <h3>Register Your Authenticator</h3>
            <p>Use your FIDO2 device (YubiKey, Touch ID, Windows Hello) to secure your encryption keys.</p>
            <div class="auth-progress hidden" id="authProgress">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Waiting for authenticator...</span>
            </div>
        `;
        startBtn.textContent = 'Register';
        startBtn.onclick = () => registerHardwareAuth();
    } else if (mode === 'authenticate') {
        title.textContent = 'Hardware Authentication';
        content.innerHTML = `
            <i class="fas fa-fingerprint"></i>
            <h3>Authenticate</h3>
            <p>Use your registered authenticator to unlock encryption.</p>
            <div class="auth-progress" id="authProgress">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Waiting for authenticator...</span>
            </div>
        `;
        startBtn.classList.add('hidden');
        // Auto-start authentication
        setTimeout(() => authenticateHardware(), 500);
    }
    
    cancelBtn.onclick = () => closeHardwareAuthModal();
    modal.classList.remove('hidden');
}

function closeHardwareAuthModal() {
    const modal = document.getElementById('hardwareAuthModal');
    modal.classList.add('hidden');
    
    // Reset checkbox if registration was cancelled
    const checkbox = document.getElementById('hardwareAuthEnabled');
    if (checkbox && !hardwareAuthConfig.hasCredentials) {
        checkbox.checked = false;
    }
}

async function registerHardwareAuth() {
    const progressDiv = document.getElementById('authProgress');
    const startBtn = document.getElementById('startHardwareAuth');
    
    try {
        // Check if WebAuthn is available
        if (!navigator.credentials || !navigator.credentials.create) {
            throw new Error('WebAuthn is not supported in this browser');
        }
        
        progressDiv.classList.remove('hidden');
        startBtn.disabled = true;
        
        // Generate challenge
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        
        // Create credential options
        const publicKeyCredentialCreationOptions = {
            challenge: challenge,
            rp: {
                name: "Maraikka",
                id: "localhost",
            },
            user: {
                id: crypto.getRandomValues(new Uint8Array(64)),
                name: "maraikka-user",
                displayName: "Maraikka User",
            },
            pubKeyCredParams: [
                {
                    alg: -7, // ES256
                    type: "public-key"
                },
                {
                    alg: -257, // RS256
                    type: "public-key"
                }
            ],
            authenticatorSelection: {
                authenticatorAttachment: "cross-platform", // Allow both platform and roaming authenticators
                userVerification: "preferred"
            },
            timeout: 60000,
            attestation: "direct"
        };
        
        // Create credential
        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions
        });
        
        if (credential) {
            // Convert challenge to base64 for storage
            const challengeBase64 = btoa(String.fromCharCode(...challenge));
            const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
            
            // Save credential to backend
            const result = await window.electronAPI.saveHardwareAuthCredential(credentialId, challengeBase64);
            
            if (result.success) {
                hardwareAuthConfig = {
                    isEnabled: true,
                    hasCredentials: true,
                    credentialIds: [credentialId]
                };
                
                updateHardwareAuthUI();
                closeHardwareAuthModal();
                showNotification('Hardware Authentication', 'Authenticator registered successfully!', 'success');
            } else {
                throw new Error(result.error);
            }
        }
        
    } catch (error) {
        console.error('Hardware auth registration error:', error);
        progressDiv.classList.add('hidden');
        startBtn.disabled = false;
        
        let errorMessage = 'Failed to register authenticator';
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Authentication was cancelled or not allowed';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = 'This authenticator is not supported';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showNotification('Registration Failed', errorMessage, 'error');
    }
}

async function authenticateHardware() {
    const progressDiv = document.getElementById('authProgress');
    
    try {
        if (!navigator.credentials || !navigator.credentials.get) {
            throw new Error('WebAuthn is not supported in this browser');
        }
        
        if (!hardwareAuthConfig.hasCredentials || hardwareAuthConfig.credentialIds.length === 0) {
            throw new Error('No registered authenticators found');
        }
        
        // Generate challenge
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        
        // Convert credential IDs back to ArrayBuffer
        const allowCredentials = hardwareAuthConfig.credentialIds.map(id => ({
            id: Uint8Array.from(atob(id), c => c.charCodeAt(0)),
            type: 'public-key'
        }));
        
        const publicKeyCredentialRequestOptions = {
            challenge: challenge,
            allowCredentials: allowCredentials,
            timeout: 60000,
            userVerification: "preferred"
        };
        
        const assertion = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions
        });
        
        if (assertion) {
            const challengeBase64 = btoa(String.fromCharCode(...challenge));
            const credentialId = btoa(String.fromCharCode(...new Uint8Array(assertion.rawId)));
            
            // Verify with backend
            const result = await window.electronAPI.verifyHardwareAuth(challengeBase64, credentialId);
            
            if (result.success) {
                closeHardwareAuthModal();
                return result.masterKey;
            } else {
                throw new Error(result.error);
            }
        }
        
    } catch (error) {
        console.error('Hardware auth authentication error:', error);
        
        let errorMessage = 'Authentication failed';
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Authentication was cancelled or not allowed';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = 'This authenticator is not supported';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        progressDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span style="color: #ef4444;">${errorMessage}</span>
        `;
        
        setTimeout(() => {
            closeHardwareAuthModal();
        }, 3000);
        
        throw error;
    }
}

async function isHardwareAuthEnabled() {
    try {
        const config = await window.electronAPI.loadHardwareAuthConfig();
        return config.success && config.isEnabled && config.hasCredentials;
    } catch (error) {
        console.error('Error checking hardware auth status:', error);
        return false;
    }
}

async function getAuthenticationMethod() {
    const isHardwareEnabled = await isHardwareAuthEnabled();
    
    if (isHardwareEnabled) {
        try {
            showHardwareAuthModal('authenticate');
            const masterKey = await authenticateHardware();
            return { method: 'hardware', key: masterKey };
        } catch (error) {
            console.error('Hardware auth failed, falling back to password:', error);
            // Fall back to password if hardware auth fails
        }
    }
    
    // Use password authentication
    return new Promise((resolve) => {
        const originalHandlePasswordConfirm = window.handlePasswordConfirm;
        
        window.handlePasswordConfirm = async () => {
            const password = document.getElementById('passwordInput').value;
            if (password) {
                closePasswordModal();
                resolve({ method: 'password', key: password });
                window.handlePasswordConfirm = originalHandlePasswordConfirm;
            }
        };
        
        showPasswordModal('encrypt');
    });
}