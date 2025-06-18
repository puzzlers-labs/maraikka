// Image Editor Window Handler
// Manages the lifecycle of image editor windows and their state
//
// Purpose:
// - Creates and manages image editor windows for both encrypted and unencrypted files
// - Handles window lifecycle events and state management
// - Ensures proper window focus and content loading
// - Coordinates communication between main and renderer processes
//
// Dependencies:
// - createImageEditorWindow: Window creation and management
// - isEncryptedFile: File encryption status detection
//
// Integration Points:
// - IPC Main: Registered as 'open-image-editor-window' handler
// - Frontend: Called via window.electronAPI.openImageEditorWindow
// - Context Menu: Integrated with image annotation functionality
//
// Process Flow:
// 1. Receive file path from renderer process
// 2. Check file encryption status
// 3. Create or focus image editor window with encryption info
// 4. Wait for window ready state
// 5. Return operation status
//
// Error Handling:
// - Invalid/missing file path
// - Window creation failures
// - Encryption check failures
// - IPC communication errors

const {
  createImageEditorWindow,
} = require("@backend/windows/create-image-editor");
const { isEncryptedFile } = require("@backend/utils/file-utils");

/**
 * Opens an image file in the image editor window
 * Creates a new window or focuses existing one for image editing
 *
 * @param {Event} _event - IPC event object
 * @param {string} filePath - Absolute path to the image file
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
 * const result = await handleOpenImageEditorWindow(event, '/path/to/image.jpg');
 * // { success: true }
 *
 * // Error case - missing path
 * const result = await handleOpenImageEditorWindow(event);
 * // { success: false, error: "File path is required" }
 *
 * // Error case - creation failed
 * const result = await handleOpenImageEditorWindow(event, '/invalid/path.jpg');
 * // { success: false, error: "Failed to create image editor window" }
 */
async function handleOpenImageEditorWindow(_event, filePath) {
  // Validate required parameters
  if (!filePath || filePath === undefined) {
    return { success: false, error: "File path is required" };
  }

  try {
    // Check if file is encrypted
    const isEncrypted = await isEncryptedFile(filePath);

    // Create or focus image editor window with encryption info
    const window = createImageEditorWindow(filePath, isEncrypted);

    if (!window) {
      throw new Error("Failed to create image editor window");
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
        error.message || "Unknown error occurred while opening image editor",
    };
  }
}

module.exports = { handleOpenImageEditorWindow };
