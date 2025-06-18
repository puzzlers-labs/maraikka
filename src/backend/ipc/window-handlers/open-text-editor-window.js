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
 * - isEncryptedFile: File encryption status detection
 *
 * Usage Examples:
 * ```
 * // From renderer process
 * const result = await window.electronAPI.openTextEditorWindow(filePath);
 * if (result.success) {
 *   // Window opened successfully
 * } else {
 *   // Handle error: result.error
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
 * 2. Check file encryption status
 * 3. Create or focus text editor window with encryption info
 * 4. Wait for window ready state
 * 5. Return operation status
 *
 * Error Handling:
 * - Invalid/missing file path
 * - Window creation failures
 * - Encryption check failures
 * - System resource errors
 */

const {
  createTextEditorWindow,
} = require("@backend/windows/create-text-editor");
const { isEncryptedFile } = require("@backend/utils/file-utils");

/**
 * Opens a text file in the text editor window
 * Creates a new window or focuses existing one for text editing
 *
 * @param {Event} _event - IPC event object
 * @param {string} filePath - Absolute path to the text file
 * @returns {Promise<Object>} Operation result
 * @property {boolean} success - Whether the operation succeeded
 * @property {string} [error] - Error message if operation failed
 *
 * @throws {Error} When window creation fails
 * @throws {Error} When file encryption check fails
 * @throws {Error} When file path is invalid
 *
 * @example
 * // Success case
 * const result = await handleOpenTextEditorWindow(event, '/path/to/file.txt');
 * // { success: true }
 *
 * // Error case - missing path
 * const result = await handleOpenTextEditorWindow(event);
 * // { success: false, error: "File path is required" }
 *
 * // Error case - creation failed
 * const result = await handleOpenTextEditorWindow(event, '/invalid/path.txt');
 * // { success: false, error: "Failed to create text editor window" }
 */
async function handleOpenTextEditorWindow(_event, filePath) {
  // Validate required parameters
  if (!filePath || filePath === undefined) {
    return { success: false, error: "File path is required" };
  }

  try {
    // Check if file is encrypted
    const isEncrypted = await isEncryptedFile(filePath);

    // Create or focus text editor window with encryption info
    const window = createTextEditorWindow(filePath, isEncrypted);

    if (!window) {
      throw new Error("Failed to create text editor window");
    }

    // Wait for window to be ready
    await new Promise((resolve) => {
      window.once("ready-to-show", () => {
        window.show();
        resolve();
      });
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error.message || "Unknown error occurred while opening text editor",
    };
  }
}

module.exports = { handleOpenTextEditorWindow };
