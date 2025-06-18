/**
 * Directory Encryption IPC Handler
 * Bridges renderer and main processes for directory-level encryption.
 *
 * Purpose:
 * - Exposes a minimal IPC wrapper around core `encryptDirectory`.
 * - Validates parameters before delegating heavy-lifting to the crypto layer.
 * - Maintains process isolation and consistent error handling.
 *
 * Dependencies:
 * - encryptDirectory: Core directory encryption utility located in `@backend/crypto/encrypt-directory`.
 *
 * Usage Examples:
 * ```js
 * // Main process registration
 * ipcMain.handle('encrypt-directory', (event, dirPath, password) =>
 *   handleEncryptDirectory(event, dirPath, password));
 *
 * // Renderer call
 * const res = await window.electronAPI.encryptDirectory('/secret', 'pass123');
 * if (res.success) console.log(res.message);
 * ```
 *
 * Integration Points:
 * - Renderer Process: `window.electronAPI.encryptDirectory`.
 * - Main Process: IPC channel `encrypt-directory`.
 *
 * Process Flow:
 * 1. Receive IPC request.
 * 2. Validate parameters.
 * 3. Delegate to `encryptDirectory`.
 * 4. Return result to renderer.
 */

const { encryptDirectory } = require("@backend/crypto/encrypt-directory");

/**
 * Handles directory encryption IPC requests.
 * Delegates the operation to core `encryptDirectory` after basic validation.
 *
 * @param {Object} _event   - Electron IPC event object (unused).
 * @param {string} dirPath  - Absolute path of the directory to encrypt.
 * @param {string} password - Encryption password.
 * @returns {Promise<Object>} Result object returned by `encryptDirectory`.
 *
 * @example
 * const res = await handleEncryptDirectory(_event, '/my/dir', 'pass');
 * if (res.success) console.log(res.message);
 */
async function handleEncryptDirectory(_event, dirPath, password) {
  if (!dirPath) {
    throw new Error("Directory path is required");
  }
  if (!password) {
    throw new Error("Password is required");
  }

  return await encryptDirectory(dirPath, password);
}

module.exports = { handleEncryptDirectory };
