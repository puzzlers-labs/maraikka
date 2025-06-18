/**
 * IPC Handler: Open Text Editor Window
 * This opens a new text editor window for file editing with proper error handling
 *
 * Purpose:
 * - Creates new text editor windows for file editing
 * - Manages existing editor window instances
 * - Handles both encrypted and unencrypted text files
 * - Prevents duplicate windows for the same file
 * - Maintains window lifecycle and state
 *
 * Dependencies:
 * - createTextEditorWindow: Core window creation utility
 * - BrowserWindow: Electron window management
 * - ipcMain: Electron IPC system (registered in register-handlers.js)
 *
 * Usage Examples:
 * ```
 * // From renderer process
 * const result = await window.electronAPI.openTextEditorWindow(filePath, isEncrypted);
 * if (result.success) {
 *   // Window opened successfully
 * } else {
 *   console.error(result.error);
 * }
 * ```
 *
 * Integration Points:
 * - File Menu: Opens text files from menu actions
 * - Context Menu: Opens files from right-click menu
 * - File List: Opens text files from main window
 * - Encryption System: Handles encrypted file editing
 *
 * Process Flow:
 * 1. Validate input parameters
 * 2. Check for existing window instance
 * 3. Create new window if needed
 * 4. Setup window event handlers
 * 5. Return operation status
 */

const {
  createTextEditorWindow,
} = require("@backend/windows/create-text-editor");

/**
 * Handles opening text editor window requests
 * Single entry point for creating or focusing text editor windows
 *
 * @param {Event} _event - IPC event object
 * @param {string} filePath - Path to file to edit
 * @param {boolean} isEncrypted - Whether the file is encrypted
 * @returns {Object} Result object with success status and optional error
 * @property {boolean} success - Whether the operation was successful
 * @property {string} [error] - Error message if operation failed
 *
 * @example
 * // Success case
 * { success: true }
 *
 * // Error case
 * { success: false, error: "File path is required" }
 */
async function handleOpenTextEditorWindow(_event, filePath, isEncrypted) {
  console.log("IPC: Open text editor window request:", {
    filePath,
    isEncrypted,
  });

  // Add validation for undefined filePath
  if (!filePath || filePath === undefined) {
    console.error("IPC handler: filePath is undefined or empty!");
    return { success: false, error: "File path is required" };
  }

  try {
    const editorWindow = createTextEditorWindow(filePath, isEncrypted);
    if (!editorWindow) {
      return { success: false, error: "Failed to create editor window" };
    }
    return { success: true };
  } catch (error) {
    console.error("IPC: Error opening text editor window:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { handleOpenTextEditorWindow };
