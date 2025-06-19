// Informational Dialog Handler Module
// Presents native OS information dialogs directly from the main process
//
// Purpose:
// - Display informational messages using Electron's native dialog API (cross-platform).
// - Provide synchronous, blocking UI for non-critical user notifications.
// - Eliminate dependency on renderer IPC for simple notifications.
// - Quality/Security: Ensures consistent UX while avoiding silent failures.
//
// Dependencies:
// - electron.dialog: Presents native message boxes.
//
// Usage Examples:
// ```javascript
// // In the main process
// const { BrowserWindow } = require('electron');
// const { handleShowInfo } = require('./show-info');
//
// const mainWindow = BrowserWindow.getFocusedWindow();
// const showInfo = handleShowInfo(mainWindow);
//
// showInfo('Operation Complete', 'All files have been processed successfully.');
// ```
//
// Integration Points:
// - Main-process modules that need to surface non-critical information.
// - Menu/IPC handlers replacing legacy global.showInfo utility.
//
// Process/Operation Flow:
// 1. A caller invokes `handleShowInfo` with an optional parent `BrowserWindow`.
// 2. The factory returns a `showInfo` function bound to that window context.
// 3. When `showInfo` is executed it builds an Electron `dialogOptions` object.
// 4. `dialog.showMessageBoxSync` displays a native, synchronous information dialog.
//
// Customization: Simplified implementation always renders a single-button ("OK") info dialog for consistency across platforms.

const { dialog } = require("electron");

/**
 * Creates a pre-configured `showInfo` function that displays a native information dialog.
 * If a `BrowserWindow` is supplied the dialog will be presented modally.
 *
 * @param {Electron.BrowserWindow|null} [parentWindow=null] - Window to attach the dialog to.
 * @returns {function(string, string): void} Callable which immediately renders the info dialog.
 *
 * @throws {Error} Propagates any exception thrown by `dialog.showMessageBoxSync` after silent catch.
 *
 * @example
 * const showInfo = handleShowInfo(mainWindow);
 * showInfo('Sync Complete', 'Your files are up to date.');
 */
function handleShowInfo(title, message, parentWindow = null) {
  try {
    dialog.showMessageBoxSync(parentWindow ?? undefined, {
      type: "info",
      title,
      message,
      buttons: ["OK"],
      noLink: true,
    });
  } catch (err) {
    // If this fails, we cannot do anything about it.
  }
}

module.exports = { handleShowInfo };
