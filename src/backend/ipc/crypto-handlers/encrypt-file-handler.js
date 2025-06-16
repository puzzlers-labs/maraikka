/**
 * Module Name: File Encryption IPC Handler
 * Provides secure IPC bridge for file encryption operations
 *
 * Purpose:
 * - Primary function: Handle file encryption requests from renderer process
 * - Key features: Secure parameter passing, error handling, result formatting
 * - Important behaviors: Maintains process isolation through IPC
 * - Quality considerations: Ensures secure data transfer between processes
 *
 * Dependencies:
 * - encryptFile: Core encryption functionality from crypto module
 *   Used to perform actual file encryption operations
 * - IPC Main: Electron's IPC system for process communication
 *   Handles secure message passing between processes
 *
 * Usage Examples:
 * ```
 * // Basic file encryption
 * const result = await handleEncryptFile(_event, '/path/file.txt', 'password123');
 * if (result.success) {
 *   console.log('File encrypted successfully');
 * }
 *
 * // Error handling
 * try {
 *   const result = await handleEncryptFile(_event, filePath, password);
 *   handleEncryptionResult(result);
 * } catch (error) {
 *   handleEncryptionError(error);
 * }
 * ```
 *
 * Integration Points:
 * - Renderer Process: Receives requests via window.electronAPI.encryptFile
 * - Main Process: Registered as IPC handler for 'encrypt-file' channel
 * - Crypto Module: Interfaces with core encryptFile functionality
 * - File System: Indirect interaction through encryptFile module
 *
 * Process Flow:
 * 1. Receive IPC request from renderer with file path and password
 * 2. Forward parameters to encryptFile utility
 * 3. Return encryption result to renderer
 * 4. Handle any errors and return appropriate response
 */

const encryptFile = require("@backend/crypto/encrypt-file");

/**
 * Handles file encryption IPC requests from renderer process
 * Delegates actual encryption to core crypto module
 *
 * @param {Event} _event - Electron IPC event object (unused)
 * @param {string} filePath - Path to file to encrypt
 * @param {string} password - Password for encryption
 * @returns {Promise<Object>} Encryption result object
 * @property {boolean} success - Whether encryption was successful
 * @property {string} message - Success or error message
 * @property {string} [error] - Error message if encryption failed
 *
 * @example
 * // Encrypt file with error handling
 * const result = await handleEncryptFile(_event, '/path/file.txt', 'pass123');
 * if (result.success) {
 *   console.log(result.message);
 * } else {
 *   console.error(result.error);
 * }
 */
async function handleEncryptFile(_event, filePath, password) {
  return await encryptFile(filePath, password);
}

module.exports = { handleEncryptFile };
