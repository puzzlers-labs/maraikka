/**
 * Module: Crypto Handlers Registration
 * One-line description: Centralizes registration of cryptography-related IPC handlers in the main process.
 *
 * Purpose:
 * - Register IPC channels for encryption / decryption operations (file, directory, preview, edit, save)
 * - Provide a single source of truth for crypto IPC channel names
 * - Ensure consistent, centralized error handling for all crypto operations
 * - Facilitate secure data transfer between renderer and main processes
 * - Maintain atomicity and security guarantees for file system operations
 *
 * Dependencies:
 * - electron.ipcMain: Registers IPC handlers in the main process
 * - @backend/ipc/crypto-handlers/*: Individual handler modules for specific crypto operations
 *
 * Usage Examples:
 * ```javascript
 * // In the main process bootstrap code
 * const { registerCryptoHandlers } = require("@backend/ipc/crypto-handlers/register-handlers");
 * registerCryptoHandlers();
 * ```
 *
 * Integration Points:
 * - Called by src/backend/ipc/register-handlers.js to wire crypto handlers during app startup
 * - Invoked before any window creation to ensure handlers are available on first renderer request
 * - Works in conjunction with the security layer that validates and sanitises incoming IPC payloads
 *
 * Process/Operation Flow:
 * 1. Import ipcMain and all concrete crypto handler functions
 * 2. Execute registerCryptoHandlers()
 * 3. For each crypto operation, bind the handler to its channel via ipcMain.handle
 * 4. Renderer processes invoke these channels through the @frontend/encryption helpers
 *
 * NOTE: Do not add business logic in this file—keep it focused on handler registration only.
 */

const { ipcMain } = require("electron");

// File Operation Handlers
const {
  handleEncryptFile,
} = require("@backend/ipc/crypto-handlers/encrypt-file");
const {
  handleDecryptFile,
} = require("@backend/ipc/crypto-handlers/decrypt-file");
const {
  handleEncryptDirectory,
} = require("@backend/ipc/crypto-handlers/encrypt-directory");
const {
  handleDecryptDirectory,
} = require("@backend/ipc/crypto-handlers/decrypt-directory");

// Save Operation Handlers
const {
  handleEncryptAndWriteFile,
} = require("@backend/ipc/crypto-handlers/encrypt-and-write-file");

const {
  handleReadAndDecryptFile,
} = require("@backend/ipc/crypto-handlers/read-and-decrypt-file");

/**
 * Registers every cryptography-related IPC handler required by the application.
 * All handlers are attached using ipcMain.handle, which automatically manages
 * the request/response lifecycle between renderer and main processes.
 *
 * Handler Categories:
 * 1. File operations (encrypt-file, decrypt-file)
 * 2. Directory operations (encrypt-directory, decrypt-directory)
 * 3. Preview/Edit helpers (read-and-decrypt-file)
 * 4. Save helpers (encrypt-and-write-file)
 *
 * Error Handling:
 * Each underlying handler implements its own try/catch logic and propagates
 * structured IPC errors (via the `IpcError` pattern). This function itself
 * does not throw; it merely registers handlers.
 *
 * @function registerCryptoHandlers
 * @returns {void} This function has no return; its side-effect is registering
 *                 ipcMain handlers during application initialisation.
 *
 * @example
 * // Register handlers early in main process entry point
 * const { registerCryptoHandlers } = require("@backend/ipc/crypto-handlers/register-handlers");
 * registerCryptoHandlers();
 */
function registerCryptoHandlers() {
  /**
   * File Encryption/Decryption Handlers
   * Handle individual file crypto operations with proper error handling
   */
  ipcMain.handle("encrypt-file", handleEncryptFile);
  ipcMain.handle("decrypt-file", handleDecryptFile);

  /**
   * Directory Encryption/Decryption Handlers
   * Manage bulk operations on directories while maintaining file structure
   */
  ipcMain.handle("encrypt-directory", handleEncryptDirectory);
  ipcMain.handle("decrypt-directory", handleDecryptDirectory);

  /**
   * Read and Decrypt File Operation Handlers
   * Manage temporary file decryption for viewing and editing
   * Implements secure handling of decrypted content in memory
   */
  ipcMain.handle("read-and-decrypt-file", handleReadAndDecryptFile);

  /**
   * Encrypt and Write File Operation Handlers
   * Handle secure saving of modified files with encryption
   */
  ipcMain.handle("encrypt-and-write-file", handleEncryptAndWriteFile);
}

// Export the registration function for use in the main process
module.exports = { registerCryptoHandlers };
