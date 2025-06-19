// Documentation Handler Module
// Emits an IPC event instructing the renderer to open the Maraikka documentation site

// Purpose:
// - Keeps menu logic decoupled from the IPC implementation
// - Re-uses the existing `window.electronAPI.openExternal()` bridge that delegates
//   to the main-process `handleOpenExternal` function located in
//   `@backend/ipc/window-handlers/open-external.js`.
// - Mirrors the pattern used in `open-directory.js` where the menu simply sends
//   a message that the renderer reacts to.

// Dependencies:
// - @backend/windows/main-window.getMainWindow  : Retrieves the singleton main window
// - global.showError                           : Native error-dialog helper

const { getMainWindow } = require("@backend/windows/main-window");

/**
 * Emits a renderer-process event requesting the documentation website to be
 * opened. The renderer is expected to handle this event by calling
 * `window.electronAPI.openExternal(url)` which, in turn, invokes the secure
 * main-process handler defined in `open-external.js`.
 *
 * @async
 * @function handleDocumentation
 * @returns {Promise<void>} Resolves when the IPC message is dispatched or the
 *                          error handler has been invoked.
 *
 * @example
 * // Used as a menu click handler (see menu-manager.js)
 * click: handleDocumentation
 */
async function handleDocumentation() {
  try {
    const mainWindow = getMainWindow();

    // Ensure we have a valid, live window to communicate with
    if (!mainWindow || mainWindow.isDestroyed()) {
      throw new Error("Main window not available or destroyed");
    }

    // Notify the renderer to open the documentation URL via its IPC bridge
    mainWindow.webContents.send("open-external", "https://docs.maraikka.com");
  } catch (error) {
    // Forward the error to the global error handler so the user sees a native dialog
    if (global.showError) {
      global.showError("Failed to open documentation", error.message);
    }
  }
}

module.exports = handleDocumentation;
