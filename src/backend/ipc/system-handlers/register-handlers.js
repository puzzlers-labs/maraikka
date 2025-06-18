/**
 * System Handlers Registration Module
 * Centralizes registration of all system-level IPC handlers
 *
 * Purpose:
 * - Registers all system operation related handlers
 * - Maintains consistent system interaction patterns
 * - Centralizes system operation IPC channel management
 * - Manages global error and info display
 *
 * Dependencies:
 * - ipcMain: Electron IPC main process module
 * - System Handlers: Individual handler modules for system operations
 *
 * Integration Points:
 * - Main IPC Registry: Called by main register-handlers.js
 * - System Operations: Manages system-level functionality
 * - Error Handling: Provides global error display capabilities
 * - Theme System: Coordinates theme changes
 */

const { ipcMain } = require("electron");
const {
  handleShowItemInFolder,
} = require("@backend/ipc/system-handlers/show-item-in-folder");
const {
  handleSelectDirectory,
} = require("@backend/ipc/system-handlers/select-directory");
const {
  handleCheckDirectoryExists,
} = require("@backend/ipc/system-handlers/check-directory-exists");
const { handleShowError } = require("@backend/ipc/system-handlers/show-error");
const { handleShowInfo } = require("@backend/ipc/system-handlers/show-info");

/**
 * Registers all system operation IPC handlers
 * @returns {Object} Object containing global error and info handlers
 */
function registerSystemHandlers() {
  // Make error and info handlers globally available
  global.showError = handleShowError;
  global.showInfo = handleShowInfo;

  // File system operations
  ipcMain.handle("show-item-in-folder", handleShowItemInFolder);
  ipcMain.handle("select-directory", handleSelectDirectory);
  ipcMain.handle("check-directory-exists", handleCheckDirectoryExists);
}

module.exports = { registerSystemHandlers };
