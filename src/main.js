const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const UpdateManager = require('./updater');

// Set the app name immediately for menu bar
app.setName('Maraikka');

let mainWindow;
let editorWindows = new Map(); // Store editor windows by filePath
let imageEditorWindows = new Map(); // Store image editor windows by filePath
let updateManager;

// Helper function to get theme-appropriate colors based on app theme
function getThemeColors(appTheme = 'dark') {
  return {
    backgroundColor: appTheme === 'light' ? '#ffffff' : '#1a1a1a',
    isDark: appTheme === 'dark'
  };
}

function createWindow() {
  const windowOptions = {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    show: false,
    backgroundColor: getThemeColors('dark').backgroundColor // Default to dark theme
  };

  // Platform-specific window configuration
  if (process.platform === 'darwin') {
    windowOptions.titleBarStyle = 'hiddenInset';
    windowOptions.frame = false;
  } else if (process.platform === 'win32') {
    windowOptions.frame = true;
    windowOptions.autoHideMenuBar = true;
    windowOptions.titleBarStyle = 'default';
  } else {
    // Linux and other platforms
    windowOptions.frame = true;
    windowOptions.autoHideMenuBar = true;
  }

  mainWindow = new BrowserWindow(windowOptions);

  // Load the correct HTML file for both development and production
  const htmlPath = path.join(__dirname, 'renderer', 'index.html');
  mainWindow.loadFile(htmlPath);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
    console.log('🚀 Development mode: DevTools opened');
  }
}

function createTextEditorWindow(filePath, isEncrypted) {
  console.log('createTextEditorWindow called with:', { filePath, isEncrypted });
  
  // Add validation for undefined filePath
  if (!filePath || filePath === undefined) {
    console.error('createTextEditorWindow: filePath is undefined or empty!');
    console.trace('Stack trace for undefined filePath');
    return null;
  }

  // Check if editor window for this file already exists
  if (editorWindows.has(filePath)) {
    const existingWindow = editorWindows.get(filePath);
    if (!existingWindow.isDestroyed()) {
      existingWindow.focus();
      return existingWindow;
    } else {
      editorWindows.delete(filePath);
    }
  }

  const editorWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    titleBarStyle: 'default', // Use default title bar for easy window dragging
    frame: true,
    show: false,
    backgroundColor: getThemeColors('dark').backgroundColor, // Default to dark theme
    title: `${path.basename(filePath)} - Text Editor`
  });

  // Load the text editor HTML file
  const editorHtmlPath = path.join(__dirname, 'renderer', 'text-editor.html');
  editorWindow.loadFile(editorHtmlPath);

  // Store file info for this window
  editorWindow.fileInfo = {
    filePath: filePath,
    isEncrypted: isEncrypted,
    hasUnsavedChanges: false
  };

  editorWindow.once('ready-to-show', () => {
    editorWindow.show();
    // Send file info to the renderer
    console.log('Sending file info to text editor:', { filePath, isEncrypted });
    editorWindow.webContents.send('load-file', {
      filePath: filePath,
      isEncrypted: isEncrypted
    });
    
    // Wait a moment for the renderer to be fully ready, then send theme
    setTimeout(() => {
      // Get and send current app theme to the text editor - try multiple approaches
      const sendTheme = (theme) => {
        console.log('Sending theme to text editor:', theme);
        editorWindow.webContents.send('theme-changed', theme);
        // Also update the window background color
        const colors = getThemeColors(theme);
        editorWindow.setBackgroundColor(colors.backgroundColor);
      };
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        // Try to get theme from main window
        mainWindow.webContents.executeJavaScript(`
          localStorage.getItem('maraikka-theme') || 'dark'
        `).then(theme => {
          console.log('Got theme from main window localStorage:', theme);
          sendTheme(theme);
        }).catch(error => {
          console.log('Failed to get theme from main window, checking document classes');
          // Fallback: check main window's document classes
          mainWindow.webContents.executeJavaScript(`
            document.body.classList.contains('light-theme') ? 'light' : 'dark'
          `).then(theme => {
            console.log('Got theme from main window body classes:', theme);
            sendTheme(theme);
          }).catch(error2 => {
            console.log('All theme detection failed, using dark as default');
            sendTheme('dark');
          });
        });
      } else {
        console.log('Main window not available, using dark theme');
        sendTheme('dark');
      }
    }, 500); // Wait 500ms for renderer to be ready
  });

  // Handle window close - check for unsaved changes
  editorWindow.on('close', (event) => {
    if (editorWindow.fileInfo.hasUnsavedChanges) {
      event.preventDefault();
      editorWindow.webContents.send('check-unsaved-changes');
    }
  });

  // Clean up when window is closed
  editorWindow.on('closed', () => {
    editorWindows.delete(filePath);
  });

  // Store the window reference
  editorWindows.set(filePath, editorWindow);

  if (process.argv.includes('--dev')) {
    editorWindow.webContents.openDevTools();
  }

  return editorWindow;
}

function createImageEditorWindow(filePath) {
  console.log('createImageEditorWindow called with:', { filePath });
  
  // Add validation for undefined filePath
  if (!filePath || filePath === undefined) {
    console.error('createImageEditorWindow: filePath is undefined or empty!');
    console.trace('Stack trace for undefined filePath');
    return null;
  }

  // Check if image editor window for this file already exists
  if (imageEditorWindows.has(filePath)) {
    const existingWindow = imageEditorWindows.get(filePath);
    if (!existingWindow.isDestroyed()) {
      existingWindow.focus();
      return existingWindow;
    } else {
      imageEditorWindows.delete(filePath);
    }
  }

  const imageEditorWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    titleBarStyle: 'default', // Use default title bar for easy window dragging
    frame: true,
    show: false,
    backgroundColor: getThemeColors('dark').backgroundColor, // Default to dark theme
    title: `${path.basename(filePath)} - Image Editor`
  });

  // Load the image editor HTML file
  const imageEditorHtmlPath = path.join(__dirname, 'renderer', 'image-editor.html');
  imageEditorWindow.loadFile(imageEditorHtmlPath);

  // Store file info for this window
  imageEditorWindow.fileInfo = {
    filePath: filePath,
    hasUnsavedChanges: false
  };

  imageEditorWindow.once('ready-to-show', () => {
    imageEditorWindow.show();
    // Send file info to the renderer
    console.log('Sending image file to image editor:', filePath);
    imageEditorWindow.webContents.send('open-image-file', filePath);
    
    // Wait a moment for the renderer to be fully ready, then send theme
    setTimeout(() => {
      // Get and send current app theme to the image editor
      const sendTheme = (theme) => {
        console.log('Sending theme to image editor:', theme);
        imageEditorWindow.webContents.send('theme-changed', theme);
        // Also update the window background color
        const colors = getThemeColors(theme);
        imageEditorWindow.setBackgroundColor(colors.backgroundColor);
      };
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        // Try to get theme from main window
        mainWindow.webContents.executeJavaScript(`
          localStorage.getItem('maraikka-theme') || 'dark'
        `).then(theme => {
          console.log('Got theme from main window localStorage:', theme);
          sendTheme(theme);
        }).catch(error => {
          console.log('Failed to get theme from main window, checking document classes');
          // Fallback: check main window's document classes
          mainWindow.webContents.executeJavaScript(`
            document.body.classList.contains('light-theme') ? 'light' : 'dark'
          `).then(theme => {
            console.log('Got theme from main window body classes:', theme);
            sendTheme(theme);
          }).catch(error2 => {
            console.log('All theme detection failed, using dark as default');
            sendTheme('dark');
          });
        });
      } else {
        console.log('Main window not available, using dark theme');
        sendTheme('dark');
      }
    }, 500); // Wait 500ms for renderer to be ready
  });

  // Handle window close - check for unsaved changes
  imageEditorWindow.on('close', (event) => {
    if (imageEditorWindow.fileInfo.hasUnsavedChanges) {
      event.preventDefault();
      imageEditorWindow.webContents.send('check-unsaved-changes');
    }
  });

  // Clean up when window is closed
  imageEditorWindow.on('closed', () => {
    imageEditorWindows.delete(filePath);
  });

  // Store the window reference
  imageEditorWindows.set(filePath, imageEditorWindow);

  if (process.argv.includes('--dev')) {
    imageEditorWindow.webContents.openDevTools();
  }

  return imageEditorWindow;
}

function createMenu() {
  const template = [
    {
      label: app.getName(),
      submenu: [
        {
          label: 'About ' + app.getName(),
          role: 'about'
        },
        {
          type: 'separator'
        },
        {
          label: 'Preferences...',
          accelerator: process.platform === 'darwin' ? 'Cmd+,' : 'Ctrl+,',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('show-preferences');
            }
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Services',
          role: 'services',
          submenu: []
        },
        {
          type: 'separator'
        },
        {
          label: 'Hide ' + app.getName(),
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'Select Directory...',
          accelerator: process.platform === 'darwin' ? 'Cmd+O' : 'Ctrl+O',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('select-directory-menu');
            }
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Close Window',
          accelerator: process.platform === 'darwin' ? 'Cmd+W' : 'Ctrl+W',
          role: 'close'
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo'
        },
        {
          type: 'separator'
        },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall'
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.reload();
            }
          }
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.reloadIgnoringCache();
            }
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.toggleDevTools();
            }
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          role: 'resetzoom'
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          role: 'zoomin'
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          role: 'zoomout'
        },
        {
          type: 'separator'
        },
        {
          label: 'Toggle Fullscreen',
          accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
          role: 'togglefullscreen'
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        },
        {
          type: 'separator'
        },
        {
          label: 'Bring All to Front',
          role: 'front'
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Maraikka',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('show-about');
            }
          }
        }
      ]
    }
  ];

  // On macOS, the first menu is always the app menu
  if (process.platform === 'darwin') {
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  } else {
    // On Windows/Linux, we don't set an application menu by default
    // But we can still use the accelerators
    Menu.setApplicationMenu(null);
  }
}

// Handle command line arguments for context menu integration
function handleCommandLineArgs() {
  const args = process.argv.slice(2);
  console.log('Command line args:', args);
  
  // Look for our custom arguments
  const encryptIndex = args.indexOf('--encrypt');
  const decryptIndex = args.indexOf('--decrypt');
  
  if (encryptIndex !== -1 && args[encryptIndex + 1]) {
    const filePath = args[encryptIndex + 1];
    console.log('Context menu encrypt request for:', filePath);
    handleContextMenuAction('encrypt', filePath);
    return true;
  }
  
  if (decryptIndex !== -1 && args[decryptIndex + 1]) {
    const filePath = args[decryptIndex + 1];
    console.log('Context menu decrypt request for:', filePath);
    handleContextMenuAction('decrypt', filePath);
    return true;
  }
  
  return false;
}

// Handle context menu actions
async function handleContextMenuAction(action, filePath) {
  // Create a minimal window for password input
  const contextWindow = new BrowserWindow({
    width: 400,
    height: 300,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    frame: process.platform === 'darwin' ? false : true,
    show: false
  });
  
  // Load a simple password dialog
  const contextDialogPath = path.join(__dirname, 'renderer', 'context-dialog.html');
  contextWindow.loadFile(contextDialogPath);
  
  contextWindow.once('ready-to-show', () => {
    contextWindow.show();
    // Send the action and file path to the renderer
    contextWindow.webContents.send('context-action', { action, filePath });
  });
}

app.whenReady().then(() => {
  // Check if this is a context menu invocation
  const isContextMenuAction = handleCommandLineArgs();
  
  if (!isContextMenuAction) {
    // Normal app startup
    createWindow();
    createMenu();
    
    // Initialize update manager
    updateManager = new UpdateManager();
    updateManager.startPeriodicCheck();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (updateManager) {
    updateManager.stopPeriodicCheck();
  }
});

// IPC Handlers
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('get-directory-contents', async (event, dirPath) => {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const contents = [];
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      const stats = await fs.stat(fullPath);
      
      let isEncrypted = false;
      if (!item.isDirectory()) {
        try {
          // Check if file is encrypted by reading first part of file
          const fileContent = await fs.readFile(fullPath, 'utf8');
          isEncrypted = fileContent.startsWith('MARAIKKA_ENCRYPTED:');
        } catch (error) {
          // If we can't read as text, assume it's not encrypted
          isEncrypted = false;
        }
      }
      
      contents.push({
        name: item.name,
        path: fullPath,
        isDirectory: item.isDirectory(),
        size: stats.size,
        modified: stats.mtime,
        encrypted: isEncrypted
      });
    }
    
    return contents;
  } catch (error) {
    throw new Error(`Failed to read directory: ${error.message}`);
  }
});

ipcMain.handle('encrypt-directory', async (event, dirPath, password) => {
  console.log(`IPC: Encrypt directory request - ${dirPath}`);
  try {
    if (!dirPath) {
      throw new Error('Directory path is required');
    }
    if (!password) {
      throw new Error('Password is required');
    }
    
    await encryptDirectory(dirPath, password);
    console.log(`IPC: Directory encryption completed successfully`);
    return { success: true, message: 'Directory encrypted successfully' };
  } catch (error) {
    console.error('IPC: Encryption error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('decrypt-directory', async (event, dirPath, password) => {
  console.log(`IPC: Decrypt directory request - ${dirPath}`);
  try {
    if (!dirPath) {
      throw new Error('Directory path is required');
    }
    if (!password) {
      throw new Error('Password is required');
    }
    
    await decryptDirectory(dirPath, password);
    console.log(`IPC: Directory decryption completed successfully`);
    return { success: true, message: 'Directory decrypted successfully' };
  } catch (error) {
    console.error('IPC: Decryption error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('encrypt-file', async (event, filePath, password) => {
  console.log(`IPC: Encrypt file request - ${filePath}`);
  try {
    if (!filePath) {
      throw new Error('File path is required');
    }
    if (!password) {
      throw new Error('Password is required');
    }
    
    await encryptFile(filePath, password);
    console.log(`IPC: File encryption completed successfully`);
    return { success: true, message: 'File encrypted successfully' };
  } catch (error) {
    console.error('IPC: File encryption error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('decrypt-file', async (event, filePath, password) => {
  console.log(`IPC: Decrypt file request - ${filePath}`);
  try {
    if (!filePath) {
      throw new Error('File path is required');
    }
    if (!password) {
      throw new Error('Password is required');
    }
    
    await decryptFile(filePath, password);
    console.log(`IPC: File decryption completed successfully`);
    return { success: true, message: 'File decrypted successfully' };
  } catch (error) {
    console.error('IPC: File decryption error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-text-file', async (event, filePath) => {
  try {
    if (!filePath) {
      throw new Error('File path is required');
    }
    
    // Check if file exists
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    
    // Read file content as text with size limit for safety
    const stats = await fs.stat(filePath);
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    
    if (stats.size > maxSize) {
      throw new Error('File is too large to preview (max 10MB)');
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    return { success: true, content: content };
  } catch (error) {
    console.error('IPC: Read text file error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-binary-file', async (event, filePath) => {
  try {
    if (!filePath) {
      throw new Error('File path is required');
    }
    
    // Check if file exists
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    
    // Read file content as buffer with size limit for safety
    const stats = await fs.stat(filePath);
    const maxSize = 50 * 1024 * 1024; // 50MB limit for binary files like PDFs
    
    if (stats.size > maxSize) {
      throw new Error('File is too large to preview (max 50MB)');
    }
    
    const buffer = await fs.readFile(filePath);
    return buffer;
  } catch (error) {
    console.error('IPC: Read binary file error:', error);
    throw new Error(`Failed to read file: ${error.message}`);
  }
});

ipcMain.handle('decrypt-file-for-preview', async (event, filePath, password) => {
  try {
    if (!filePath) {
      throw new Error('File path is required');
    }
    
    if (!password) {
      throw new Error('Password is required');
    }
    
    // Check if file exists
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    
    const stats = await fs.stat(filePath);
    const maxSize = 10 * 1024 * 1024; // 10MB limit for in-memory decryption
    
    if (stats.size > maxSize) {
      throw new Error('File too large for preview (max 10MB). Please decrypt the file on disk first.');
    }
    
    // Read the encrypted file
    const encryptedContent = await fs.readFile(filePath, 'utf8');
    
    // Check if it's a Maraikka encrypted file
    if (!encryptedContent.startsWith('MARAIKKA_ENCRYPTED:')) {
      throw new Error('This is not a valid Maraikka encrypted file');
    }
    
    // Extract the encrypted data (remove the prefix)
    const encryptedData = encryptedContent.substring('MARAIKKA_ENCRYPTED:'.length);
    
    try {
      // Decrypt the data
      const decrypted = CryptoJS.AES.decrypt(encryptedData, password);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Invalid password or corrupted file');
      }
      
      // Convert from base64 back to binary
      const binaryData = Buffer.from(decryptedString, 'base64');
      
      // Get the original filename (remove .enc extension if present)
      const originalName = path.basename(filePath).replace(/\.enc$/, '');
      const ext = path.extname(originalName).toLowerCase().substring(1); // Remove the dot
      
      return {
        success: true,
        data: binaryData,
        originalName,
        extension: ext,
        mimeType: getMimeType(ext)
      };
    } catch (decryptError) {
      throw new Error('Failed to decrypt file. Please check your password.');
    }
  } catch (error) {
    console.error('IPC: Decrypt file for preview error:', error);
    return { success: false, error: error.message };
  }
});

function getMimeType(ext) {
  const mimeTypes = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    // Videos
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
    'webm': 'video/webm',
    'mkv': 'video/x-matroska',
    // Text
    'txt': 'text/plain',
    'md': 'text/markdown',
    'js': 'text/javascript',
    'html': 'text/html',
    'css': 'text/css',
    'json': 'application/json',
    'xml': 'text/xml',
    'csv': 'text/csv',
    'log': 'text/plain',
    // PDF
    'pdf': 'application/pdf'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

// Hardware Authentication Storage
const hardwareAuthStore = {
  credentialIds: new Set(),
  masterKey: null,
  isEnabled: false
};

// Generate a master key from hardware authentication challenge
function generateMasterKeyFromChallenge(challenge, credentialId) {
  // Use PBKDF2 to derive a consistent key from the challenge and credential ID
  const combined = challenge + credentialId;
  return crypto.pbkdf2Sync(combined, 'maraikka-salt', 100000, 32, 'sha256').toString('hex');
}

// Hardware Authentication IPC Handlers
ipcMain.handle('hardware-auth-available', async () => {
  try {
    // Check if WebAuthn is available in the renderer process
    // We'll handle this check in the renderer since it has access to navigator.credentials
    return { available: true };
  } catch (error) {
    return { available: false, error: error.message };
  }
});

ipcMain.handle('save-hardware-auth-credential', async (event, credentialId, challenge) => {
  try {
    hardwareAuthStore.credentialIds.add(credentialId);
    hardwareAuthStore.masterKey = generateMasterKeyFromChallenge(challenge, credentialId);
    hardwareAuthStore.isEnabled = true;
    
    // Save to persistent storage (you might want to encrypt this)
    const configPath = path.join(app.getPath('userData'), 'hardware-auth.json');
    await fs.writeFile(configPath, JSON.stringify({
      credentialIds: Array.from(hardwareAuthStore.credentialIds),
      isEnabled: hardwareAuthStore.isEnabled
    }));
    
    return { success: true };
  } catch (error) {
    console.error('Error saving hardware auth credential:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-hardware-auth-config', async () => {
  try {
    const configPath = path.join(app.getPath('userData'), 'hardware-auth.json');
    
    if (await fs.pathExists(configPath)) {
      const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
      hardwareAuthStore.credentialIds = new Set(config.credentialIds || []);
      hardwareAuthStore.isEnabled = config.isEnabled || false;
      
      return {
        success: true,
        isEnabled: hardwareAuthStore.isEnabled,
        hasCredentials: hardwareAuthStore.credentialIds.size > 0,
        credentialIds: Array.from(hardwareAuthStore.credentialIds)
      };
    }
    
    return { success: true, isEnabled: false, hasCredentials: false, credentialIds: [] };
  } catch (error) {
    console.error('Error loading hardware auth config:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('verify-hardware-auth', async (event, challenge, credentialId) => {
  try {
    if (!hardwareAuthStore.credentialIds.has(credentialId)) {
      throw new Error('Credential not registered');
    }
    
    const masterKey = generateMasterKeyFromChallenge(challenge, credentialId);
    hardwareAuthStore.masterKey = masterKey;
    
    return { success: true, masterKey };
  } catch (error) {
    console.error('Error verifying hardware auth:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('remove-hardware-auth', async () => {
  try {
    hardwareAuthStore.credentialIds.clear();
    hardwareAuthStore.masterKey = null;
    hardwareAuthStore.isEnabled = false;
    
    const configPath = path.join(app.getPath('userData'), 'hardware-auth.json');
    if (await fs.pathExists(configPath)) {
      await fs.unlink(configPath);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error removing hardware auth:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-hardware-auth-master-key', async () => {
  if (hardwareAuthStore.isEnabled && hardwareAuthStore.masterKey) {
    return { success: true, masterKey: hardwareAuthStore.masterKey };
  }
  return { success: false, error: 'Hardware authentication not active' };
});

// Handle writing text files
ipcMain.handle('write-text-file', async (event, filePath, content) => {
  console.log('IPC: Write text file request:', filePath);
  
  try {
    await fs.writeFile(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    console.error('IPC: Write text file error:', error);
    return { success: false, error: error.message };
  }
});

// Handle decrypting file for editing (returns string content)
ipcMain.handle('decrypt-file-for-edit', async (event, filePath, password) => {
  console.log('IPC: Decrypt file for edit request:', filePath);
  
  try {
    if (!filePath) {
      throw new Error('File path is required');
    }
    
    if (!password) {
      throw new Error('Password is required');
    }
    
    // Check if file exists
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    
    const stats = await fs.stat(filePath);
    const maxSize = 10 * 1024 * 1024; // 10MB limit for text editing
    
    if (stats.size > maxSize) {
      throw new Error('File too large for editing (max 10MB)');
    }
    
    // Read the encrypted file
    const encryptedContent = await fs.readFile(filePath, 'utf8');
    
    // Check if it's a Maraikka encrypted file
    if (!encryptedContent.startsWith('MARAIKKA_ENCRYPTED:')) {
      throw new Error('This is not a valid Maraikka encrypted file');
    }
    
    // Extract the encrypted data (remove the prefix)
    const encryptedData = encryptedContent.substring('MARAIKKA_ENCRYPTED:'.length);
    
    try {
      // Decrypt the data
      const decrypted = CryptoJS.AES.decrypt(encryptedData, password);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Invalid password or corrupted file');
      }
      
      // Convert from base64 back to text
      const textContent = Buffer.from(decryptedString, 'base64').toString('utf8');
      
      return {
        success: true,
        content: textContent,
        originalName: path.basename(filePath).replace(/\.enc$/, '')
      };
    } catch (decryptError) {
      throw new Error('Failed to decrypt file. Please check your password.');
    }
  } catch (error) {
    console.error('IPC: Decrypt file for edit error:', error);
    return { success: false, error: error.message };
  }
});

// Handle encrypting and saving text file
ipcMain.handle('encrypt-and-save-text-file', async (event, filePath, content, password) => {
  console.log('IPC: Encrypt and save text file request:', filePath);
  
  try {
    // Convert content to base64
    const base64Content = Buffer.from(content, 'utf8').toString('base64');
    
    // Encrypt the base64 content
    const encrypted = CryptoJS.AES.encrypt(base64Content, password).toString();
    
    // Add Maraikka prefix
    const maraikkaEncrypted = 'MARAIKKA_ENCRYPTED:' + encrypted;
    
    // Write encrypted content to file
    await fs.writeFile(filePath, maraikkaEncrypted, 'utf8');
    
    return { success: true };
  } catch (error) {
    console.error('IPC: Encrypt and save text file error:', error);
    return { success: false, error: error.message };
  }
});

// Open text editor in new window
ipcMain.handle('open-text-editor-window', async (event, filePath, isEncrypted) => {
  console.log('IPC: Open text editor window request:', { filePath, isEncrypted });
  
  // Add validation for undefined filePath
  if (!filePath || filePath === undefined) {
    console.error('IPC handler: filePath is undefined or empty!');
    return { success: false, error: 'File path is required' };
  }
  
  try {
    const editorWindow = createTextEditorWindow(filePath, isEncrypted);
    if (!editorWindow) {
      return { success: false, error: 'Failed to create editor window' };
    }
    return { success: true };
  } catch (error) {
    console.error('IPC: Error opening text editor window:', error);
    return { success: false, error: error.message };
  }
});

// Open image editor in new window
ipcMain.handle('open-image-editor-window', async (event, filePath) => {
  console.log('IPC: Open image editor window request:', { filePath });
  
  // Add validation for undefined filePath
  if (!filePath || filePath === undefined) {
    console.error('IPC handler: filePath is undefined or empty!');
    return { success: false, error: 'File path is required' };
  }
  
  try {
    const imageEditorWindow = createImageEditorWindow(filePath);
    if (!imageEditorWindow) {
      return { success: false, error: 'Failed to create image editor window' };
    }
    return { success: true };
  } catch (error) {
    console.error('IPC: Error opening image editor window:', error);
    return { success: false, error: error.message };
  }
});

// Handle unsaved changes response from editor window
ipcMain.handle('editor-unsaved-changes-response', async (event, action, filePath) => {
  console.log('IPC: Editor unsaved changes response:', action, filePath);
  
  const editorWindow = editorWindows.get(filePath);
  if (editorWindow && !editorWindow.isDestroyed()) {
    if (action === 'close-without-saving') {
      editorWindow.fileInfo.hasUnsavedChanges = false;
      editorWindow.close();
    } else if (action === 'cancel') {
      // Do nothing, keep window open
    }
  }
});

// Update unsaved changes status for editor window
ipcMain.handle('update-editor-unsaved-status', async (event, filePath, hasUnsavedChanges) => {
  const editorWindow = editorWindows.get(filePath);
  if (editorWindow && !editorWindow.isDestroyed()) {
    editorWindow.fileInfo.hasUnsavedChanges = hasUnsavedChanges;
    // Update window title to show unsaved indicator
    const fileName = path.basename(filePath);
    const title = hasUnsavedChanges ? `${fileName} • - Text Editor` : `${fileName} - Text Editor`;
    editorWindow.setTitle(title);
  }
});

// Forward theme changes to all editor windows
ipcMain.handle('broadcast-theme-change', async (event, theme) => {
  // Update main window background
  if (mainWindow && !mainWindow.isDestroyed()) {
    const colors = getThemeColors(theme);
    mainWindow.setBackgroundColor(colors.backgroundColor);
  }
  
  // Update all text editor windows
  editorWindows.forEach((editorWindow) => {
    if (!editorWindow.isDestroyed()) {
      const colors = getThemeColors(theme);
      editorWindow.setBackgroundColor(colors.backgroundColor);
      editorWindow.webContents.send('theme-changed', theme);
    }
  });
  
  // Update all image editor windows
  imageEditorWindows.forEach((imageEditorWindow) => {
    if (!imageEditorWindow.isDestroyed()) {
      const colors = getThemeColors(theme);
      imageEditorWindow.setBackgroundColor(colors.backgroundColor);
      imageEditorWindow.webContents.send('theme-changed', theme);
    }
  });
});

// Encryption functions
async function encryptFile(filePath, password) {
  try {
    console.log(`Encrypting file: ${filePath}`);
    
    // Check if file exists
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    
    // Read the original file content
    const originalData = await fs.readFile(filePath);
    console.log(`Read ${originalData.length} bytes from ${filePath}`);
    
    // Check if file is already encrypted by trying to read a marker
    try {
      const content = originalData.toString('utf8');
      if (content.startsWith('MARAIKKA_ENCRYPTED:')) {
        console.log(`File already encrypted: ${filePath}`);
        return;
      }
    } catch (e) {
      // File might be binary, continue with encryption
    }
    
    // Convert to base64 for safe encryption
    const base64Data = originalData.toString('base64');
    
    // Encrypt the base64 data
    const encrypted = CryptoJS.AES.encrypt(base64Data, password).toString();
    
    // Add a marker to identify encrypted files
    const encryptedContent = 'MARAIKKA_ENCRYPTED:' + encrypted;
    
    // Write encrypted content back to the same file
    await fs.writeFile(filePath, encryptedContent, 'utf8');
    
    // Verify file was written
    const verifyData = await fs.readFile(filePath, 'utf8');
    if (!verifyData.startsWith('MARAIKKA_ENCRYPTED:')) {
      throw new Error(`Failed to encrypt file: ${filePath}`);
    }
    
    console.log(`Successfully encrypted: ${filePath} (${originalData.length} -> ${encryptedContent.length} bytes)`);
  } catch (error) {
    console.error(`Error encrypting file ${filePath}:`, error);
    throw new Error(`Failed to encrypt ${path.basename(filePath)}: ${error.message}`);
  }
}

async function decryptFile(filePath, password) {
  try {
    console.log(`Decrypting file: ${filePath}`);
    
    // Check if file exists
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    
    // Read the file content
    const fileContent = await fs.readFile(filePath, 'utf8');
    console.log(`Read ${fileContent.length} characters from ${filePath}`);
    
    // Check if file is encrypted by looking for our marker
    if (!fileContent.startsWith('MARAIKKA_ENCRYPTED:')) {
      console.log(`File is not encrypted: ${filePath}`);
      return; // File is not encrypted, nothing to do
    }
    
    // Extract the encrypted data (remove the marker)
    const encryptedData = fileContent.substring('MARAIKKA_ENCRYPTED:'.length);
    
    if (!encryptedData || encryptedData.trim().length === 0) {
      throw new Error('Encrypted data is empty or corrupted');
    }
    
    // Decrypt the data
    let decrypted;
    try {
      decrypted = CryptoJS.AES.decrypt(encryptedData, password);
    } catch (error) {
      throw new Error('Failed to decrypt - invalid password or corrupted file');
    }
    
    // Convert decrypted data to UTF8 string
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString || decryptedString.length === 0) {
      throw new Error('Decryption failed - incorrect password or corrupted data');
    }
    
    // Convert base64 back to binary data
    let originalData;
    try {
      originalData = Buffer.from(decryptedString, 'base64');
    } catch (error) {
      throw new Error('Failed to decode decrypted data - file may be corrupted');
    }
    
    // Write the original data back to the same file
    await fs.writeFile(filePath, originalData);
    
    console.log(`Successfully decrypted: ${filePath} (${fileContent.length} -> ${originalData.length} bytes)`);
  } catch (error) {
    console.error(`Error decrypting file ${filePath}:`, error);
    throw new Error(`Failed to decrypt ${path.basename(filePath)}: ${error.message}`);
  }
}

async function encryptDirectory(dirPath, password) {
  try {
    console.log(`Encrypting directory: ${dirPath}`);
    
    if (!await fs.pathExists(dirPath)) {
      throw new Error(`Directory does not exist: ${dirPath}`);
    }
    
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    let processedCount = 0;
    let errorCount = 0;
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      try {
        if (item.isDirectory()) {
          await encryptDirectory(fullPath, password);
        } else {
          await encryptFile(fullPath, password);
          processedCount++;
        }
      } catch (error) {
        console.error(`Error processing ${fullPath}:`, error);
        errorCount++;
        // Continue with other files even if one fails
      }
    }
    
    console.log(`Directory encryption completed. Processed: ${processedCount}, Errors: ${errorCount}`);
    
    if (errorCount > 0 && processedCount === 0) {
      throw new Error(`Failed to encrypt any files in directory`);
    }
  } catch (error) {
    console.error(`Error encrypting directory ${dirPath}:`, error);
    throw error;
  }
}

async function decryptDirectory(dirPath, password) {
  try {
    console.log(`Decrypting directory: ${dirPath}`);
    
    if (!await fs.pathExists(dirPath)) {
      throw new Error(`Directory does not exist: ${dirPath}`);
    }
    
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    let processedCount = 0;
    let errorCount = 0;
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      try {
        if (item.isDirectory()) {
          await decryptDirectory(fullPath, password);
        } else {
          await decryptFile(fullPath, password);
          processedCount++;
        }
      } catch (error) {
        console.error(`Error processing ${fullPath}:`, error);
        errorCount++;
        // Continue with other files even if one fails
      }
    }
    
    console.log(`Directory decryption completed. Processed: ${processedCount}, Errors: ${errorCount}`);
    
    if (errorCount > 0 && processedCount === 0) {
      throw new Error(`Failed to decrypt any files in directory`);
    }
  } catch (error) {
    console.error(`Error decrypting directory ${dirPath}:`, error);
    throw error;
  }
}

// Image Editor IPC Handlers
ipcMain.handle('save-annotated-image', async (event, data) => {
  try {
    const { originalPath, imageData } = data;
    
    if (!originalPath || !imageData) {
      throw new Error('Original path and image data are required');
    }
    
    // Convert data URL to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Create annotated filename
    const parsedPath = path.parse(originalPath);
    const annotatedPath = path.join(
      parsedPath.dir,
      `${parsedPath.name}_annotated${parsedPath.ext}`
    );
    
    // Save the annotated image
    await fs.writeFile(annotatedPath, buffer);
    
    console.log(`Saved annotated image: ${annotatedPath}`);
    return { success: true, savedPath: annotatedPath };
  } catch (error) {
    console.error('Error saving annotated image:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-annotated-image', async (event, data) => {
  try {
    const { imageData } = data;
    
    if (!imageData) {
      throw new Error('Image data is required');
    }
    
    // Show save dialog
    const result = await dialog.showSaveDialog(null, {
      title: 'Export Annotated Image',
      defaultPath: 'annotated_image.png',
      filters: [
        { name: 'PNG Images', extensions: ['png'] },
        { name: 'JPEG Images', extensions: ['jpg', 'jpeg'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (result.canceled) {
      return { success: false, error: 'Export canceled' };
    }
    
    // Convert data URL to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Save the exported image
    await fs.writeFile(result.filePath, buffer);
    
    console.log(`Exported annotated image: ${result.filePath}`);
    return { success: true, exportPath: result.filePath };
  } catch (error) {
    console.error('Error exporting annotated image:', error);
    return { success: false, error: error.message };
  }
});

// Get current app theme from main window
ipcMain.handle('get-current-theme', async () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      // Get theme from main window's localStorage
      const theme = await mainWindow.webContents.executeJavaScript(`
        localStorage.getItem('maraikka-theme') || 'dark'
      `);
      return theme;
    } catch (error) {
      console.log('Failed to get theme from main window, defaulting to dark');
      return 'dark';
    }
  }
  return 'dark'; // Default fallback
});

// Update-related IPC handlers
ipcMain.handle('check-for-updates', async () => {
  if (!updateManager) {
    return { error: 'Update manager not initialized' };
  }
  
  try {
    await updateManager.checkForUpdates(false);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('download-update', async () => {
  if (!updateManager) {
    return { error: 'Update manager not initialized' };
  }
  
  try {
    await updateManager.downloadUpdate();
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('install-update', async () => {
  if (!updateManager) {
    return { error: 'Update manager not initialized' };
  }
  
  updateManager.installUpdate();
  return { success: true };
});

ipcMain.handle('get-update-info', async () => {
  if (!updateManager) {
    return { error: 'Update manager not initialized' };
  }
  
  return updateManager.getUpdateInfo();
}); 