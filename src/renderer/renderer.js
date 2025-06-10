// Application state
console.log('🚀 Renderer.js loaded - Version 2.0 with fixed action handling');
let currentDirectory = null;
let currentDirectoryContents = [];
let currentAction = null;
let isProcessing = false;

// DOM elements
const selectDirectoryBtn = document.getElementById('selectDirectoryBtn');
const encryptBtn = document.getElementById('encryptBtn');
const decryptBtn = document.getElementById('decryptBtn');
const refreshBtn = document.getElementById('refreshBtn');
const currentPathElement = document.getElementById('currentPath');
const breadcrumbPath = document.getElementById('breadcrumbPath');
const fileList = document.getElementById('fileList');
const passwordModal = document.getElementById('passwordModal');
const passwordInput = document.getElementById('passwordInput');
const confirmPasswordBtn = document.getElementById('confirmPasswordBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const statusMessage = document.getElementById('statusMessage');
const statusTime = document.getElementById('statusTime');
const totalFiles = document.getElementById('totalFiles');
const encryptedFiles = document.getElementById('encryptedFiles');
const totalDirs = document.getElementById('totalDirs');
const modalTitle = document.getElementById('modalTitle');
const strengthIndicator = document.getElementById('strengthIndicator');
const strengthText = document.getElementById('strengthText');
const listViewBtn = document.getElementById('listViewBtn');
const gridViewBtn = document.getElementById('gridViewBtn');
const notificationContainer = document.getElementById('notificationContainer');
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
confirmPasswordBtn.addEventListener('click', handlePasswordConfirm);
passwordInput.addEventListener('input', checkPasswordStrength);
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handlePasswordConfirm();
    }
});

listViewBtn.addEventListener('click', () => switchView('list'));
gridViewBtn.addEventListener('click', () => switchView('grid'));
preferencesBtn.addEventListener('click', showPreferences);

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    updateStatusTime();
    setInterval(updateStatusTime, 1000);
    updateStatus('Ready');
});

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
    if (currentDirectoryContents.length === 0) {
        fileList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>Directory is Empty</h3>
                <p>This directory contains no files or folders</p>
            </div>
        `;
        return;
    }

    const fileItems = currentDirectoryContents.map(item => {
        const isEncrypted = item.encrypted;
        const isDirectory = item.isDirectory;
        const icon = isDirectory ? 'fas fa-folder' : (isEncrypted ? 'fas fa-lock' : 'fas fa-file');
        const itemClass = isDirectory ? 'directory' : (isEncrypted ? 'encrypted' : '');
        const size = formatFileSize(item.size);
        const modified = formatDate(item.modified);

        return `
            <div class="file-item ${itemClass}" data-path="${item.path}">
                <div class="file-icon ${isDirectory ? 'directory' : (isEncrypted ? 'encrypted' : 'file')}">
                    <i class="${icon}"></i>
                </div>
                <div class="file-info">
                    <div class="file-name">${item.name}</div>
                    <div class="file-meta">
                        <span>${size}</span>
                        <span>${modified}</span>
                        ${isEncrypted ? '<span class="encrypted-badge">Encrypted</span>' : ''}
                    </div>
                </div>
                <div class="file-actions">
                    ${!isDirectory && !isEncrypted ? `
                        <button class="file-action-btn" onclick="encryptSingleFile('${item.path}')">
                            <i class="fas fa-lock"></i> Encrypt
                        </button>
                    ` : ''}
                    ${!isDirectory && isEncrypted ? `
                        <button class="file-action-btn" onclick="decryptSingleFile('${item.path}')">
                            <i class="fas fa-unlock"></i> Decrypt
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    fileList.innerHTML = fileItems;
}

// Password modal functions
function showPasswordModal(action) {
    console.log(`Renderer: showPasswordModal called with action: ${action}`);
    currentAction = action;
    console.log(`Renderer: currentAction set to: ${currentAction}`);
    modalTitle.textContent = action === 'encrypt' ? 'Encrypt Directory' : 'Decrypt Directory';
    passwordInput.value = '';
    passwordModal.classList.add('show');
    passwordInput.focus();
    checkPasswordStrength();
}

function closePasswordModal() {
    console.log(`Renderer: closePasswordModal called, currentAction was: ${currentAction}`);
    passwordModal.classList.remove('show');
    currentAction = null;
    passwordInput.value = '';
}

function togglePasswordVisibility() {
    const input = passwordInput;
    const icon = document.querySelector('.password-toggle i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Password strength checker
function checkPasswordStrength() {
    const password = passwordInput.value;
    const strength = calculatePasswordStrength(password);
    
    strengthIndicator.style.width = `${strength.score}%`;
    strengthIndicator.style.background = strength.color;
    strengthText.textContent = strength.text;
}

function calculatePasswordStrength(password) {
    if (!password) {
        return { score: 0, color: '#333333', text: 'Enter a password' };
    }

    let score = 0;
    const checks = [
        password.length >= 8,
        /[a-z]/.test(password),
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^a-zA-Z0-9]/.test(password)
    ];

    score = (checks.filter(Boolean).length / checks.length) * 100;

    if (score < 40) {
        return { score, color: '#ef4444', text: 'Weak' };
    } else if (score < 70) {
        return { score, color: '#f59e0b', text: 'Fair' };
    } else if (score < 90) {
        return { score, color: '#10b981', text: 'Good' };
    } else {
        return { score, color: '#059669', text: 'Strong' };
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

// Encryption functions
async function encryptDirectory(password) {
    if (isProcessing) return;
    
    console.log(`Renderer: Starting directory encryption for ${currentDirectory}`);
    console.log(`Password provided: ${password ? 'Yes' : 'No'}`);
    
    isProcessing = true;
    disableButtons();
    showProgress('Encrypting directory...');
    
    try {
        console.log('Renderer: Calling electronAPI.encryptDirectory...');
        const result = await window.electronAPI.encryptDirectory(currentDirectory, password);
        
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

async function decryptDirectory(password) {
    if (isProcessing) return;
    
    console.log(`Renderer: Starting directory decryption for ${currentDirectory}`);
    console.log(`Password provided: ${password ? 'Yes' : 'No'}`);
    
    isProcessing = true;
    disableButtons();
    showProgress('Decrypting directory...');
    
    try {
        console.log('Renderer: Calling electronAPI.decryptDirectory...');
        const result = await window.electronAPI.decryptDirectory(currentDirectory, password);
        
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
async function encryptSingleFile(filePath) {
    const password = prompt('Enter password to encrypt this file:');
    if (!password) return;

    showProgress('Encrypting file...');
    
    try {
        const result = await window.electronAPI.encryptFile(filePath, password);
        
        if (result.success) {
            showNotification('Success', 'File encrypted successfully', 'success');
            await loadDirectoryContents();
        } else {
            showNotification('Error', result.error || 'Encryption failed', 'error');
        }
    } catch (error) {
        console.error('File encryption error:', error);
        showNotification('Error', 'Failed to encrypt file', 'error');
    } finally {
        hideProgress();
    }
}

async function decryptSingleFile(filePath) {
    const password = prompt('Enter password to decrypt this file:');
    if (!password) return;

    showProgress('Decrypting file...');
    
    try {
        const result = await window.electronAPI.decryptFile(filePath, password);
        
        if (result.success) {
            showNotification('Success', 'File decrypted successfully', 'success');
            await loadDirectoryContents();
        } else {
            showNotification('Error', result.error || 'Decryption failed', 'error');
        }
    } catch (error) {
        console.error('File decryption error:', error);
        showNotification('Error', 'Failed to decrypt file', 'error');
    } finally {
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
    progressText.textContent = message;
    progressContainer.classList.remove('hidden');
    progressFill.style.width = '100%';
}

function hideProgress() {
    progressContainer.classList.add('hidden');
    progressFill.style.width = '0%';
}

function updateStatus(message) {
    statusMessage.textContent = message;
}

function updateStatusTime() {
    const now = new Date();
    statusTime.textContent = now.toLocaleTimeString();
}

function switchView(viewType) {
    if (viewType === 'list') {
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        fileList.className = 'file-list';
    } else {
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        fileList.className = 'file-list grid-view';
    }
}

// Notification system
function showNotification(title, message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    notification.innerHTML = `
        <div class="notification-header">
            <i class="notification-icon ${iconMap[type]}"></i>
            <span class="notification-title">${title}</span>
        </div>
        <div class="notification-message">${message}</div>
    `;

    notificationContainer.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'notificationSlideOut 0.3s ease forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
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

// Add CSS for notification slide out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes notificationSlideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

// Preferences functionality
function showPreferences() {
    console.log('Renderer: Opening preferences modal');
    preferencesModal.classList.add('show');
    loadPreferences();
}

function closePreferences() {
    console.log('Renderer: Closing preferences modal');
    preferencesModal.classList.remove('show');
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
    
    // Load other preferences
    const autoLock = localStorage.getItem('maraikka-autolock') === 'true';
    const clearClipboard = localStorage.getItem('maraikka-clearclipboard') !== 'false';
    
    document.getElementById('autoLockEnabled').checked = autoLock;
    document.getElementById('clearClipboardEnabled').checked = clearClipboard;
}

function applyTheme(theme) {
    console.log(`Renderer: Applying theme: ${theme}`);
    
    // Remove all theme classes
    document.body.classList.remove('light-theme', 'glass-dark-theme', 'glass-light-theme');
    
    // Apply the selected theme
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else if (theme === 'glass-dark') {
        document.body.classList.add('glass-dark-theme');
    } else if (theme === 'glass-light') {
        document.body.classList.add('glass-light-theme');
    }
    // Dark theme is the default (no class needed)
    
    localStorage.setItem('maraikka-theme', theme);
}

// Tab switching functionality
document.addEventListener('DOMContentLoaded', () => {
    // Preferences tab switching
    document.querySelectorAll('.preferences-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Update active tab
            document.querySelectorAll('.preferences-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            document.querySelectorAll('.preferences-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${targetTab}-tab`).classList.add('active');
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
    
    // Preference checkboxes
    document.getElementById('autoLockEnabled').addEventListener('change', (e) => {
        localStorage.setItem('maraikka-autolock', e.target.checked);
        showNotification('Settings Updated', `Auto-lock ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
    });
    
    document.getElementById('clearClipboardEnabled').addEventListener('change', (e) => {
        localStorage.setItem('maraikka-clearclipboard', e.target.checked);
        showNotification('Settings Updated', `Clear clipboard ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
    });
    
    // Load preferences on startup
    loadPreferences();
});

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