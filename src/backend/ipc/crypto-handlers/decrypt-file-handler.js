/**
 * IPC Decrypt File Handler
 * Handles file decryption requests from the renderer process through IPC
 *
 * Purpose:
 * - Provides IPC bridge for file decryption operations
 * - Validates and forwards decryption requests to core crypto module
 * - Maintains separation between renderer and main process crypto operations
 * - Ensures secure handling of decryption parameters
 *
 * Dependencies:
 * - decryptFile: Core decryption functionality from crypto module
 *   Used to perform actual file decryption operations
 *
 * Usage Examples:
 * ```
 * // Basic file decryption
 * const result = await handleDecryptFile(_event, '/path/file.txt', 'password123');
 * if (result.success) {
 *   console.log('File decrypted successfully');
 * }
 *
 * // Error handling
 * try {
 *   const result = await handleDecryptFile(_event, filePath, password);
 *   handleDecryptionResult(result);
 * } catch (error) {
 *   handleDecryptionError(error);
 * }
 * ```
 *
 * Integration Points:
 * - Renderer Process: Receives requests via window.electronAPI.decryptFile
 * - Main Process: Registered as IPC handler for 'decrypt-file' channel
 * - Crypto Module: Interfaces with core decryptFile functionality
 * - File System: Indirect interaction through decryptFile module
 *
 * Process Flow:
 * 1. Receive IPC request from renderer with file path and password
 * 2. Forward parameters to decryptFile utility
 * 3. Return decryption result to renderer
 * 4. Handle any errors and return appropriate response
 */

const { decryptFile } = require("@backend/crypto/decrypt-file");

/**
 * Handles file decryption IPC requests from renderer process
 * Delegates actual decryption to core crypto module
 *
 * @param {Event} _event - Electron IPC event object (unused)
 * @param {string} filePath - Path to file to decrypt
 * @param {string} password - Password for decryption
 * @returns {Promise<Object>} Decryption result object
 * @property {boolean} success - Whether decryption was successful
 * @property {string} message - Success or error message
 * @property {string} [error] - Error message if decryption failed
 *
 * @example
 * // Decrypt file with error handling
 * const result = await handleDecryptFile(_event, '/path/file.txt', 'pass123');
 * if (result.success) {
 *   console.log(result.message);
 * } else {
 *   console.error(result.error);
 * }
 */
async function handleDecryptFile(_event, filePath, password) {
  return await decryptFile(filePath, password);
}

module.exports = { handleDecryptFile };
