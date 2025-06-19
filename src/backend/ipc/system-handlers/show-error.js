// Selective Error Dialog Handler Module
// Provides OS-level error dialogs directly from the main process
//
// Purpose:
// - Display error messages using Electron's native dialog API (cross-platform).
// - Provide synchronous, blocking UI for fatal/user-visible errors.
// - Eliminate dependency on renderer IPC for critical notifications.
// - Quality/Security: Ensures user awareness of unrecoverable errors and avoids silent failures.
//
// Dependencies:
// - electron.dialog: Presents native message boxes.
//
// Usage Examples:
// ```javascript
// // In the main process
// const { BrowserWindow } = require('electron');
// const { handleShowError } = require('./show-error');
//
// const mainWindow = BrowserWindow.getFocusedWindow();
// const showError = handleShowError(mainWindow);
//
// showError('Decryption Failed', 'Unable to decrypt file.');
// ```
//
// Integration Points:
// - Main-process modules that must surface fatal errors.
// - Menu/IPC handlers replacing legacy global.showError utility.
//
// Process/Operation Flow:
// 1. A caller invokes `handleShowError` with an optional parent `BrowserWindow`.
// 2. The factory returns a `showError` function bound to that window context.
// 3. When `showError` is executed it builds an Electron `dialogOptions` object.
// 4. `dialog.showMessageBoxSync` displays a native, synchronous error dialog.
//
// Customization: Simplified implementation always renders a single-button ("OK") error dialog for consistency across platforms.

const { dialog } = require("electron");

/**
 * Creates a pre-configured `showError` function that displays a native error dialog.
 * If a `BrowserWindow` is supplied the dialog will be presented modally.
 *
 * @param {Electron.BrowserWindow|null} [parentWindow=null] - Window to attach the dialog to.
 * @returns {function(string, string): void} Callable which immediately renders the error dialog.
 *
 * @throws {Error} Propagates any exception thrown by `dialog.showMessageBoxSync` after console logging.
 *
 * @example
 * const showError = handleShowError(mainWindow);
 * showError('Network Error', 'Unable to reach server.');
 */
function handleShowError(title, message, parentWindow = null) {
  try {
    const dialogOptions = {
      type: "error",
      title,
      message,
      buttons: ["OK"],
      noLink: true,
    };

    // Synchronous display ensures execution pauses until user responds.
    dialog.showMessageBoxSync(parentWindow ?? undefined, dialogOptions);
  } catch (err) {
    // If this fails, we cannot do anything about it.
  }
}

module.exports = { handleShowError };
