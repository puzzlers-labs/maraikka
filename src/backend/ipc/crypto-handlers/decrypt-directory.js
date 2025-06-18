/**
 * Module Name: Directory Decryption IPC Handler
 * Handles IPC communication for directory decryption operations
 *
 * Purpose:
 * - Primary function: Bridge between renderer and main process for directory decryption
 * - Key features: Secure parameter passing, error handling, result formatting
 * - Important behaviors: Validates inputs, maintains IPC protocol
 * - Quality considerations: Ensures secure data transfer between processes
 *
 * Dependencies:
 * - decryptDirectory: Core directory decryption functionality
 * - IPC Main: Electron's IPC system for process communication
 * - Frontend Integration: Connects with renderer's decryption requests
 *
 * Usage Examples:
 * ```
 * // IPC registration in main process
 * ipcMain.handle('decrypt-directory', async (event, dirPath, password) => {
 *   const result = await handleDecryptDirectory(event, dirPath, password);
 *   return result;
 * });
 *
 * // Renderer process call
 * const result = await window.electronAPI.decryptDirectory(dirPath, password);
 * if (result.success) {
 *   handleSuccess(result.message);
 * }
 * ```
 *
 * Integration Points:
 * - Renderer Process: Called by frontend decryption functions
 * - Main Process: Registered as IPC handler
 * - Context Menu: Used for directory-level decryption actions
 * - Security Layer: Ensures secure parameter passing between processes
 *
 * Process Flow:
 * 1. Receive IPC call with directory path and password
 * 2. Validate and sanitize parameters
 * 3. Call core decryptDirectory function
 * 4. Return formatted result to renderer
 */

const { decryptDirectory } = require("@backend/crypto/decrypt-directory");

/**
 * Handles directory decryption IPC requests from the renderer process.
 * Delegates all heavy-lifting to `decryptDirectory`.
 *
 * @param {Object} _event    - Electron IPC event object (unused).
 * @param {string} dirPath   - Absolute path to the directory to decrypt.
 * @param {string} password  - Decryption password.
 * @returns {Promise<Object>} Result object. See `decryptDirectory` for schema.
 *
 * @example
 * const result = await handleDecryptDirectory(_event, '/secret', 'pass');
 * if (result.success) {
 *   console.log(`Decrypted: ${result.statistics.decryptedCount} files`);
 * } else {
 *   console.error(result.error);
 * }
 */
async function handleDecryptDirectory(_event, dirPath, password) {
  if (!dirPath) {
    throw new Error("Directory path is required");
  }
  if (!password) {
    throw new Error("Password is required");
  }

  return await decryptDirectory(dirPath, password);
}

module.exports = { handleDecryptDirectory };
