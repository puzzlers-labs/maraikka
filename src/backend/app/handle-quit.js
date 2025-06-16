// Application Quit Handler Module
// Handles graceful application shutdown and quit state management
//
// Purpose:
// - Manages the application quit process and state
// - Provides centralized quit handling for consistent behavior
// - Prevents accidental double-quit or race conditions
// - Allows other modules to check if app is in quitting state
//
// Dependencies:
// - electron.app: Application lifecycle management for quit control
//
// Usage Examples:
// ```
// // Trigger application quit
// handleQuit();
//
// // Check if app is quitting (useful in window close handlers)
// if (isAppQuitting()) {
//   window.destroy();
// } else {
//   window.hide();
// }
//
// // Temporarily prevent quit (e.g. during file operations)
// setQuittingState(false);
// ```
//
// Integration Points:
// - Menu handlers: For quit menu items and keyboard shortcuts
// - Window handlers: To differentiate between quit and window close
// - IPC handlers: For renderer-triggered quit requests
// - App lifecycle: For handling platform-specific quit events
//
// Quit Flow:
// 1. Quit request received (menu, shortcut, or system)
// 2. isQuitting flag set to true
// 3. app.quit() triggered
// 4. Windows receive close events
// 5. App terminates if no windows prevent closure

const { app } = require("electron");

// Global quit state flag
// Tracks whether the application is in the process of quitting
// This helps differentiate between window close and application quit
let isQuitting = false;

/**
 * Handles application quit request
 * Sets the quitting flag and triggers the Electron quit sequence
 *
 * @example
 * // In menu handler:
 * {
 *   label: 'Quit',
 *   accelerator: 'CmdOrCtrl+Q',
 *   click: () => handleQuit()
 * }
 *
 * @returns {void}
 */
function handleQuit() {
  isQuitting = true;
  app.quit();
}

/**
 * Gets the current application quitting state
 * Used to check if app is in the process of quitting
 *
 * @example
 * // In window close handler:
 * window.on('close', (e) => {
 *   if (!isAppQuitting()) {
 *     e.preventDefault();  // Prevent window close
 *     window.hide();      // Hide instead of close
 *   }
 * });
 *
 * @returns {boolean} True if app is quitting, false otherwise
 */
function isAppQuitting() {
  return isQuitting;
}

/**
 * Sets the application quitting state
 * Allows manual control of the quitting state when needed
 *
 * @example
 * // Prevent quit during critical operation:
 * setQuittingState(false);
 * await performCriticalOperation();
 * setQuittingState(true);
 *
 * @param {boolean} quitting - The new quitting state
 */
function setQuittingState(quitting) {
  isQuitting = quitting;
}

module.exports = {
  handleQuit,
  isAppQuitting,
  setQuittingState,
};
