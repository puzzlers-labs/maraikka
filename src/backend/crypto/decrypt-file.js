// File Decryption Module
// Handles secure decryption of individual files using CryptoJS AES
//
// Purpose:
// - Provides secure file decryption for Maraikka encrypted files
// - Validates file encryption status using MARAIKKA_ENCRYPTED prefix
// - Handles both text and binary file decryption
// - Ensures data integrity through validation checks
// - Maintains compatibility with Maraikka encryption format
//
// Dependencies:
// - crypto-js@^4.2.0: CryptoJS library for AES decryption
//   Used for: Core decryption operations
// - @backend/ipc/file-handlers/read-file: Unified file reader
//   Used for: Safe file reading with type detection
// - @backend/ipc/file-handlers/write-file: Unified file writer
//   Used for: Safe file writing with proper encoding
// - @constants/crypto: Encryption-related constants
//   Used for: ENCRYPTION_PREFIX and error messages
//
// Usage Examples:
// ```
// // Basic file decryption
// const result = await decryptFile('/path/to/file', 'password123');
// if (result.success) {
//   console.log('File decrypted:', result.message);
//   console.log('Saved to:', result.savedPath);
//   console.log('Size:', result.size, 'bytes');
// }
//
// // Error handling
// try {
//   const result = await decryptFile(filePath, password);
//   if (!result.success) {
//     console.error('Decryption failed:', result.error);
//   }
// } catch (error) {
//   console.error('Unexpected error:', error.message);
// }
// ```
//
// Integration Points:
// - IPC System: Called by decrypt-file-handler for renderer requests
// - Directory Operations: Used by decrypt-directory for batch processing
// - Frontend: Integrated with UI progress tracking
// - File System: Uses handleReadFile and handleWriteFile for safe operations
//
// Decryption Flow:
// 1. Validate file path and password inputs
// 2. Read file using handleReadFile
// 3. Check for MARAIKKA_ENCRYPTED prefix
// 4. Extract and decrypt encrypted data
// 5. Convert decrypted data from base64
// 6. Write original data using handleWriteFile

const { CRYPTO_ERRORS } = require("@constants/crypto");
const { readFile } = require("@backend/file-manager/read-file");
const { writeFile } = require("@backend/file-manager/write-file");
const { decryptContent } = require("@backend/crypto/decrypt-content");
const path = require("path");

/**
 * Decrypts a single file encrypted with CryptoJS AES
 * Handles both text and binary files with proper validation
 *
 * @param {string} filePath - Path to encrypted file
 * @param {string} password - Decryption password
 * @returns {Promise<Object>} Decryption result object
 * @property {boolean} success - Whether the operation was successful
 * @property {string} [message] - Success message if operation succeeded
 * @property {string} [savedPath] - Full path where decrypted file was saved
 * @property {number} [size] - Size of the decrypted file in bytes
 * @property {string} [error] - Error message if operation failed
 *
 * @example
 * // Decrypt file with error handling
 * try {
 *   const result = await decryptFile('/encrypted/file.txt', 'userPassword');
 *   if (result.success) {
 *     // Handle successful decryption
 *     console.log(result.message);
 *     console.log(`Saved to: ${result.savedPath}`);
 *     console.log(`Size: ${result.size} bytes`);
 *   } else {
 *     // Handle decryption failure
 *     console.error(result.error);
 *   }
 * } catch (error) {
 *   // Handle unexpected errors
 *   console.error('Decryption failed:', error);
 * }
 */
async function decryptFile(filePath, password) {
  try {
    // 1. Validate inputs
    if (!filePath) {
      throw new Error(CRYPTO_ERRORS.FILE_PATH_REQUIRED);
    }

    if (!password) {
      throw new Error(CRYPTO_ERRORS.PASSWORD_REQUIRED);
    }

    // 2. Read file using the unified file-manager utility
    const readResult = await readFile(filePath);

    if (!readResult.success) {
      throw new Error(readResult.error);
    }

    if (!readResult.isEncrypted) {
      throw new Error(CRYPTO_ERRORS.FILE_NOT_ENCRYPTED);
    }

    // 3. Decrypt cipher payload using shared decryptContent
    const decResult = await decryptContent(readResult.content, password);

    if (!decResult.success) {
      throw new Error(decResult.error);
    }

    const { content: originalData } = decResult;

    // 4. Persist decrypted data (overwriting original file)
    const writeResult = await writeFile(filePath, originalData);

    if (!writeResult.success) {
      throw new Error(writeResult.error);
    }

    // 5. Return unified success object
    return {
      success: true,
      message: `File decrypted: ${path.basename(filePath)}`,
      savedPath: writeResult.savedPath,
      size: writeResult.size,
    };
  } catch (error) {
    // Map any internal errors to user-friendly messages if they exist in CRYPTO_ERRORS
    const errorMessage = Object.values(CRYPTO_ERRORS).includes(error.message)
      ? error.message
      : `Failed to decrypt ${path.basename(filePath)}: ${error.message}`;

    return {
      success: false,
      error: errorMessage,
    };
  }
}

module.exports = { decryptFile };
