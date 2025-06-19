// Open Directory Menu Handler
// Provides the "File → Open Folder" action implementation in the main process

// Purpose:
// - Sends a renderer-process signal instructing it to invoke the native directory picker.
// - Allows reuse of the existing renderer flow that already consumes `window.electronAPI.selectDirectory()`.
// - Keeps menu logic decoupled from the IPC implementation so that it can be swapped later without menu changes.
//
// Dependencies:
// - @backend/windows/main-window.getMainWindow: Retrieves the singleton main BrowserWindow
// - global.showError (initialised at application bootstrap): Native error-dialog helper
//
// Usage Examples:
// ```javascript
// const { handleOpenDirectory } = require("@backend/menu/open-directory");
// MenuItem({ label: "Open Folder", click: handleOpenDirectory });
// ```
//
// Integration Points:
// - Menu System: Referenced by `menu-manager.initializeApplicationMenu()`
// - Renderer: Listens for `select-directory` via `window.electronAPI.onSelectDirectory` and launches the picker
//
// Process / Operation Flow:
// 1. Retrieve the current main window.
// 2. Validate that the window exists and is not destroyed.
// 3. Emit `select-directory` to the renderer.
// 4. Renderer picks up the event and shows the directory selection dialog.
// 5. Renderer handles the selected directory (loading contents, etc.).
//
// NOTE: This module purposefully does **not** open the native dialog itself to avoid duplicating the IPC
//       handler already used elsewhere. It merely triggers the existing renderer flow.

const { getMainWindow } = require("@backend/windows/main-window");

/**
 * Emits a renderer-process event that initiates directory selection.
 *
 * @async
 * @function handleOpenDirectory
 *
 * @returns {Promise<void>} Resolves when the signal has been sent or an error has been handled.
 *
 * @throws {Error} When the main window cannot be found or is destroyed.
 *
 * @example
 * // Used as a menu click handler
 * click: handleOpenDirectory
 */
async function handleOpenDirectory() {
  try {
    const mainWindow = getMainWindow();

    // Ensure we have a valid, live window to communicate with
    if (!mainWindow || mainWindow.isDestroyed()) {
      throw new Error("Main window not available or destroyed");
    }

    // Notify the renderer to invoke its directory-selection logic
    mainWindow.webContents.send("select-directory");
  } catch (error) {
    // Forward the error to the global error handler so the user sees a native dialog
    if (global.showError) {
      global.showError("Failed to open folder", error.message);
    }
  }
}

module.exports = { handleOpenDirectory };
