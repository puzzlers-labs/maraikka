const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getDirectoryContents: (dirPath) => ipcRenderer.invoke('get-directory-contents', dirPath),
  encryptDirectory: (dirPath, password) => ipcRenderer.invoke('encrypt-directory', dirPath, password),
  decryptDirectory: (dirPath, password) => ipcRenderer.invoke('decrypt-directory', dirPath, password),
  encryptFile: (filePath, password) => ipcRenderer.invoke('encrypt-file', filePath, password),
  decryptFile: (filePath, password) => ipcRenderer.invoke('decrypt-file', filePath, password),
  readTextFile: (filePath) => ipcRenderer.invoke('read-text-file', filePath),
  decryptFileForPreview: (filePath, password) => ipcRenderer.invoke('decrypt-file-for-preview', filePath, password),
  
  // Menu event listeners
  onShowPreferences: (callback) => ipcRenderer.on('show-preferences', callback),
  onSelectDirectoryMenu: (callback) => ipcRenderer.on('select-directory-menu', callback),
  onShowAbout: (callback) => ipcRenderer.on('show-about', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
}); 