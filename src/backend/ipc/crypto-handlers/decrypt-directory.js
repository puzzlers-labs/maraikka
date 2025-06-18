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

const decryptDirectory = require("@backend/crypto/decrypt-directory");

/**
 * Handles directory decryption IPC requests from renderer process
 * Validates inputs and delegates to core decryption functionality
 *
 * @param {IpcMainEvent} _event - Electron IPC event object (unused)
 * @param {string} dirPath - Absolute path to directory to decrypt
 * @param {string} password - Decryption password or authentication key
 * @returns {Promise<Object>} Decryption result
 * @property {boolean} success - Whether decryption was successful
 * @property {string} message - Success or error message
 * @property {Object} [statistics] - Decryption statistics if successful
 * @property {number} [statistics.decryptedCount] - Number of files decrypted
 * @property {number} [statistics.failedCount] - Number of failed decryptions
 * @property {Array<string>} [statistics.errors] - List of specific file errors
 *
 * @example
 * // Success case
 * const result = await handleDecryptDirectory(_event, '/path/to/dir', 'password123');
 * // Returns: { success: true, message: 'Directory decrypted', statistics: {...} }
 *
 * @example
 * // Error case
 * const result = await handleDecryptDirectory(_event, '', 'password123');
 * // Returns: { success: false, error: 'Invalid directory path' }
 */
async function handleDecryptDirectory(_event, dirPath, password) {
  return await decryptDirectory(dirPath, password);
}

module.exports = { handleDecryptDirectory };
