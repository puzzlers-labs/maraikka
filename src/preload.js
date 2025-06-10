const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getDirectoryContents: (dirPath) => ipcRenderer.invoke('get-directory-contents', dirPath),
  encryptDirectory: (dirPath, password) => ipcRenderer.invoke('encrypt-directory', dirPath, password),
  decryptDirectory: (dirPath, password) => ipcRenderer.invoke('decrypt-directory', dirPath, password),
  encryptFile: (filePath, password) => ipcRenderer.invoke('encrypt-file', filePath, password),
  decryptFile: (filePath, password) => ipcRenderer.invoke('decrypt-file', filePath, password)
}); 