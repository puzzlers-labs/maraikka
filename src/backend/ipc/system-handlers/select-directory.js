// Select Directory Handler Module
// Provides secure IPC bridge for native directory selection dialog
//
// Purpose:
// - Handles directory selection requests from renderer process
// - Provides native OS directory picker dialog
// - Returns selected directory path or null if cancelled
// - Ensures secure main-to-renderer process communication
//
// Dependencies:
// - electron.dialog: Native directory selection dialog
// - electron.BrowserWindow: Main window reference for dialog parent
//
// Integration Points:
// - Frontend: Called via window.electronAPI.selectDirectory()
// - IPC Bridge: Registered in preload.js
// - Menu System: Used by File menu "Open Folder" action
// - Encryption Flow: Used before directory encryption/decryption
//
// Process Flow:
// 1. Renderer requests directory selection
// 2. Shows native OS directory picker
// 3. User selects directory or cancels
// 4. Returns path or null to renderer
//
// Security Considerations:
// - Runs in main process with full system access
// - Validates window reference before showing dialog
// - Returns only necessary directory path data
// - Maintains Electron's context isolation

const { dialog } = require("electron");

/**
 * Creates an IPC handler for directory selection requests
 * Presents native directory selection dialog to user
 *
 * @param {BrowserWindow} mainWindow - Main application window reference
 * @returns {Function} IPC handler function
 *
 * @example
 * // Registration in IPC handler registry
 * ipcMain.handle('select-directory', handleSelectDirectory(mainWindow));
 *
 * @example
 * // Usage in renderer process
 * const path = await window.electronAPI.selectDirectory();
 * if (path) {
 *   // Handle selected directory
 * }
 *
 * @throws {Error} If mainWindow reference is invalid
 * @returns {Promise<string|null>} Selected directory path or null if cancelled
 */
function handleSelectDirectory(mainWindow) {
  return async function (_event) {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  };
}

module.exports = { handleSelectDirectory };
