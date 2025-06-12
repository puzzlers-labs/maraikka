const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getDirectoryContents: (dirPath) => ipcRenderer.invoke('get-directory-contents', dirPath),
  encryptDirectory: (dirPath, password) => ipcRenderer.invoke('encrypt-directory', dirPath, password),
  decryptDirectory: (dirPath, password) => ipcRenderer.invoke('decrypt-directory', dirPath, password),
  encryptFile: (filePath, password) => ipcRenderer.invoke('encrypt-file', filePath, password),
  decryptFile: (filePath, password) => ipcRenderer.invoke('decrypt-file', filePath, password),
  readTextFile: (filePath) => ipcRenderer.invoke('read-text-file', filePath),
  readBinaryFile: (filePath) => ipcRenderer.invoke('read-binary-file', filePath),
  decryptFileForPreview: (filePath, password) => ipcRenderer.invoke('decrypt-file-for-preview', filePath, password),
  
  // Text editor APIs
  writeTextFile: (filePath, content) => ipcRenderer.invoke('write-text-file', filePath, content),
  decryptFileForEdit: (filePath, password) => ipcRenderer.invoke('decrypt-file-for-edit', filePath, password),
  encryptAndSaveTextFile: (filePath, content, password) => ipcRenderer.invoke('encrypt-and-save-text-file', filePath, content, password),
  openTextEditorWindow: (filePath, isEncrypted) => ipcRenderer.invoke('open-text-editor-window', filePath, isEncrypted),
  editorUnsavedChangesResponse: (action, filePath) => ipcRenderer.invoke('editor-unsaved-changes-response', action, filePath),
  updateEditorUnsavedStatus: (filePath, hasUnsavedChanges) => ipcRenderer.invoke('update-editor-unsaved-status', filePath, hasUnsavedChanges),
  broadcastThemeChange: (theme) => ipcRenderer.invoke('broadcast-theme-change', theme),
  
  // Image editor APIs
  openImageEditorWindow: (filePath) => ipcRenderer.invoke('open-image-editor-window', filePath),
  saveAnnotatedImage: (data) => ipcRenderer.invoke('save-annotated-image', data),
  exportAnnotatedImage: (data) => ipcRenderer.invoke('export-annotated-image', data),
  
  // Hardware Authentication APIs
  hardwareAuthAvailable: () => ipcRenderer.invoke('hardware-auth-available'),
  saveHardwareAuthCredential: (credentialId, challenge) => ipcRenderer.invoke('save-hardware-auth-credential', credentialId, challenge),
  loadHardwareAuthConfig: () => ipcRenderer.invoke('load-hardware-auth-config'),
  verifyHardwareAuth: (challenge, credentialId) => ipcRenderer.invoke('verify-hardware-auth', challenge, credentialId),
  removeHardwareAuth: () => ipcRenderer.invoke('remove-hardware-auth'),
  getHardwareAuthMasterKey: () => ipcRenderer.invoke('get-hardware-auth-master-key'),
  
  // Menu event listeners
  onShowPreferences: (callback) => ipcRenderer.on('show-preferences', callback),
  onSelectDirectoryMenu: (callback) => ipcRenderer.on('select-directory-menu', callback),
  onShowAbout: (callback) => ipcRenderer.on('show-about', callback),
  
  // Context menu event listeners
  onContextAction: (callback) => ipcRenderer.on('context-action', callback),
  
  // Text editor window event listeners
  onLoadFile: (callback) => ipcRenderer.on('load-file', callback),
  onCheckUnsavedChanges: (callback) => ipcRenderer.on('check-unsaved-changes', callback),
  onThemeChanged: (callback) => ipcRenderer.on('theme-changed', callback),
  getCurrentTheme: () => ipcRenderer.invoke('get-current-theme'),
  
  // Image editor window event listeners
  onOpenImageFile: (callback) => ipcRenderer.on('open-image-file', callback),
  onSaveImage: (callback) => ipcRenderer.on('save-image', callback),
  onExportImage: (callback) => ipcRenderer.on('export-image', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
}); 