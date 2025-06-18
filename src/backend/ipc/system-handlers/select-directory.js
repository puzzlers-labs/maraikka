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
// - electron.BrowserWindow: Parent window derivation from event.sender
//
// Integration Points:
// - Frontend: Called via window.electronAPI.selectDirectory()
// - IPC Bridge: Registered in preload.js
// - Menu System: Used by File menu "Open Folder" action
// - Encryption Flow: Used before directory encryption/decryption
//
// Process Flow:
// 1. Renderer requests directory selection
// 2. Retrieves parent window from event.sender
// 3. Validates that the parent window exists and is not destroyed
// 4. If validation fails, logs a warning and returns null (no dialog shown)
// 5. Shows native OS directory picker modal to the validated parent window
// 6. User selects directory or cancels
// 7. Returns selected path or null to renderer
//
// Security Considerations:
// - Runs in main process with full system access
// - Derives parent window dynamically for proper modal behaviour
// - Gracefully handles invalid sender window to prevent unexpected UI behaviour
// - Returns only necessary directory path data
// - Maintains Electron's context isolation

const { dialog, BrowserWindow } = require("electron");

/**
 * IPC handler for directory selection requests.
 * Presents a native directory selection dialog, modal to the window that
 * originated the request.
 *
 * @param {Electron.IpcMainInvokeEvent} event - IPC invoke event carrying the sender WebContents
 * @returns {Promise<string|null>} Selected directory path or null if cancelled, or if parent window is invalid
 *
 * @example
 * // Registration in IPC handler registry
 * ipcMain.handle('select-directory', handleSelectDirectory);
 *
 * @example
 * // Usage in renderer process
 * const path = await window.electronAPI.selectDirectory();
 * if (path) {
 *   // Handle selected directory
 * }
 */
async function handleSelectDirectory(event) {
  // Determine the parent window from the sender WebContents for proper modal behaviour
  const parentWindow = BrowserWindow.fromWebContents(event.sender);

  // Validate parent window; if unavailable or destroyed, skip dialog
  if (!parentWindow || parentWindow.isDestroyed()) {
    console.warn(
      "Select-directory: Sender window invalid or destroyed. Skipping directory dialog.",
    );
    return null;
  }

  const result = await dialog.showOpenDialog(parentWindow, {
    properties: ["openDirectory"],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
}

module.exports = { handleSelectDirectory };
