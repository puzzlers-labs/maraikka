/**
 * Crypto Handlers Registration Module
 * Centralizes registration of all cryptography-related IPC handlers
 *
 * Purpose:
 * - Registers all encryption/decryption related handlers
 * - Maintains consistent error handling for crypto operations
 * - Centralizes crypto-related IPC channel management
 * - Provides secure file operations for the application
 *
 * Dependencies:
 * - ipcMain: Electron IPC main process module for handler registration
 * - Crypto Handlers: Individual handler modules for specific crypto operations
 *
 * Integration Points:
 * - Main IPC Registry: Called by main register-handlers.js
 * - Crypto Operations: Manages all crypto-related IPC communication
 * - Security Layer: Handles secure data transfer between processes
 * - File System: Interacts with encrypted/decrypted files
 *
 * Process Flow:
 * 1. Module imports required IPC and crypto handlers
 * 2. registerCryptoHandlers function sets up all IPC channels
 * 3. Each handler is registered with appropriate error handling
 * 4. Renderer process can invoke these handlers via IPC
 */

const { ipcMain } = require("electron");

// File Operation Handlers
const {
  handleEncryptFile,
} = require("@backend/ipc/crypto-handlers/encrypt-file");
const {
  handleDecryptFile,
} = require("@backend/ipc/crypto-handlers/decrypt-file-handler");
const {
  handleEncryptDirectory,
} = require("@backend/ipc/crypto-handlers/encrypt-directory-handler");
const {
  handleDecryptDirectory,
} = require("@backend/ipc/crypto-handlers/decrypt-directory-handler");

// Preview and Edit Operation Handlers
const {
  handleDecryptFileForPreview,
} = require("@backend/ipc/crypto-handlers/decrypt-file-for-preview");
const {
  decryptTextFileForEdit,
} = require("@backend/ipc/crypto-handlers/decrypt-text-file-for-edit");
const {
  decryptImageFileForEdit,
} = require("@backend/ipc/crypto-handlers/decrypt-image-file-for-edit");

// Save Operation Handlers
const {
  encryptAndSaveTextFile,
} = require("@backend/ipc/crypto-handlers/encrypt-and-save-text-file");
const {
  encryptAndSaveImageFile,
} = require("@backend/ipc/crypto-handlers/encrypt-and-save-image-file");

/**
 * Registers all cryptography-related IPC handlers for secure file operations.
 * This function sets up the communication channels between the renderer and main processes
 * for all encryption/decryption operations.
 *
 * Handler Categories:
 * 1. File Operations: Single file encryption/decryption
 * 2. Directory Operations: Bulk file encryption/decryption
 * 3. Preview Operations: Temporary decryption for file preview
 * 4. Edit Operations: Decryption for file editing
 * 5. Save Operations: Encryption after file modification
 *
 * Security Considerations:
 * - All handlers implement proper error handling
 * - Temporary decrypted files are managed securely
 * - File operations are atomic where possible
 *
 * @function registerCryptoHandlers
 * @returns {void}
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
   * Preview and Edit Operation Handlers
   * Manage temporary file decryption for viewing and editing
   * Implements secure handling of decrypted content in memory
   */
  ipcMain.handle("decrypt-file-for-preview", handleDecryptFileForPreview);
  ipcMain.handle("decrypt-file-for-edit", decryptTextFileForEdit);
  ipcMain.handle("decrypt-image-file-for-edit", decryptImageFileForEdit);

  /**
   * Save Operation Handlers
   * Handle secure saving of modified files with encryption
   * Ensures atomic operations to prevent data loss
   */
  ipcMain.handle("encrypt-and-save-text-file", encryptAndSaveTextFile);
  ipcMain.handle("encrypt-and-save-image-file", encryptAndSaveImageFile);
}

// Export the registration function for use in the main process
module.exports = { registerCryptoHandlers };
