// Module Name: File Encryption Module
// Provides secure file encryption using CryptoJS AES

// Purpose:
// - Primary function: Encrypt individual files with password protection
// - Key features: AES encryption, base64 encoding, encryption status tracking
// - Important behaviors: Delegates header construction to write-file utility, prevents double encryption
// - Quality considerations: Maintains encryption security and format consistency

// Dependencies:
// - crypto-js@^4.2.0: CryptoJS library for AES encryption
//   Used for: Core encryption operations
// - @backend/file-manager/read-file: Unified file reader
//   Used for: Safe file reading with type detection
// - @backend/file-manager/write-file: Unified file writer
//   Used for: Safe file writing with automatic encryption header handling
// - @constants/crypto: Encryption-related constants
//   Used for: Standardized error messages

// Usage Examples:
// ```
// // Basic file encryption
// const result = await encryptFile('/path/to/file', 'password123');
// if (result.success) {
//   console.log('File encrypted:', result.message);
//   console.log('Saved to:', result.savedPath);
//   console.log('Size:', result.size, 'bytes');
// }
//
// // Error handling
// try {
//   const result = await encryptFile(filePath, password);
//   if (!result.success) {
//     console.error('Encryption failed:', result.error);
//   }
// } catch (error) {
//   console.error('Unexpected error:', error.message);
// }
// ```

// Integration Points:
// - IPC System: Called by encrypt-file-handler for renderer requests
// - Directory Operations: Used by encrypt-directory for batch processing
// - Frontend: Integrated with UI progress tracking
// - File System: Uses readFile and writeFile utilities for safe operations

// Process/Operation Flow:
// 1. Validate input parameters (file path and password)
// 2. Read file contents using the unified backend file-manager utility
// 3. Abort if file is already encrypted (flag provided by readFile)
// 4. Persist encrypted buffer via writeFile with `isEncrypted` flag (header auto-prepended)
// 5. Return success/error status

const { readFile } = require("@backend/file-manager/read-file");
const { writeFile } = require("@backend/file-manager/write-file");
const { encryptContent } = require("@backend/crypto/encrypt-content");
const path = require("path");

/**
 * Encrypts a single file using CryptoJS AES encryption
 *
 * @param {string} filePath - Path to file to encrypt
 * @param {string} password - Encryption password
 * @returns {Promise<Object>} Encryption result with success status
 * @property {boolean} success - Whether the encryption was successful
 * @property {string} [message] - Success message if encryption succeeded
 * @property {string} [savedPath] - Full path where encrypted file was saved
 * @property {number} [size] - Size of the encrypted file in bytes
 * @property {string} [error] - Error message if encryption failed
 *
 * @throws {Error} CRYPTO_ERRORS.PASSWORD_REQUIRED - If password is missing
 * @throws {Error} CRYPTO_ERRORS.FILE_PATH_REQUIRED - If file path is missing
 * @throws {Error} CRYPTO_ERRORS.FILE_ALREADY_ENCRYPTED - If file is already encrypted
 * @throws {Error} CRYPTO_ERRORS.ENCRYPTION_FAILED - If encryption process fails
 *
 * @example
 * // Successful encryption
 * const result = await encryptFile('document.txt', 'securePass123');
 * if (result.success) {
 *   console.log(result.message);
 *   console.log(`Saved to: ${result.savedPath}`);
 *   console.log(`Size: ${result.size} bytes`);
 * }
 *
 * @example
 * // Handling encryption errors
 * const result = await encryptFile('document.txt', '');
 * if (!result.success) {
 *   console.error(result.error); // "Password is required"
 * }
 */
async function encryptFile(filePath, password) {
  try {
    // Validate inputs
    if (!filePath) {
      throw new Error(CRYPTO_ERRORS.FILE_PATH_REQUIRED);
    }

    if (!password) {
      throw new Error(CRYPTO_ERRORS.PASSWORD_REQUIRED);
    }

    // Read file contents using the unified backend file-manager utility
    const readResult = await readFile(filePath);

    if (!readResult.success) {
      throw new Error(readResult.error);
    }

    const originalContent = readResult.content; // Buffer | string

    // Abort when file is already encrypted (readResult exposes this flag)
    if (readResult.isEncrypted) {
      throw new Error(CRYPTO_ERRORS.FILE_ALREADY_ENCRYPTED);
    }

    const encResult = await encryptContent(originalContent, password);

    if (!encResult.success) {
      throw new Error(encResult.error || CRYPTO_ERRORS.ENCRYPTION_FAILED);
    }

    // Persist encrypted data using the unified writeFile utility.
    // Header preparation and metadata inclusion are delegated to writeFile
    // via the `isEncrypted` flag.
    const writeResult = await writeFile(filePath, encResult.content, {
      isEncrypted: true,
      encoding: readResult.encoding,
    });

    if (!writeResult.success) {
      throw new Error(writeResult.error);
    }

    return {
      success: true,
      message: `File encrypted: ${path.basename(filePath)}`,
      savedPath: writeResult.savedPath,
      size: writeResult.size,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = { encryptFile };
