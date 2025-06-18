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

const CryptoJS = require("crypto-js");
const { ENCRYPTION_PREFIX, CRYPTO_ERRORS } = require("@constants/crypto");
const { handleReadFile } = require("@backend/ipc/file-handlers/read-file");
const { handleWriteFile } = require("@backend/ipc/file-handlers/write-file");
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
    // Validate input parameters
    if (!filePath) {
      throw new Error(CRYPTO_ERRORS.FILE_PATH_REQUIRED);
    }

    if (!password) {
      throw new Error(CRYPTO_ERRORS.PASSWORD_REQUIRED);
    }

    // Read the file using handleReadFile
    const readResult = await handleReadFile(null, filePath);

    if (!readResult.success) {
      throw new Error(readResult.error);
    }

    const fileContent = readResult.content;

    // Check if file is encrypted by looking for Maraikka prefix
    if (!fileContent.startsWith(ENCRYPTION_PREFIX)) {
      throw new Error(CRYPTO_ERRORS.FILE_NOT_ENCRYPTED);
    }

    // Extract the encrypted data (remove the prefix)
    const encryptedData = fileContent.substring(ENCRYPTION_PREFIX.length);

    if (!encryptedData || encryptedData.trim().length === 0) {
      throw new Error(CRYPTO_ERRORS.CORRUPTED_DATA);
    }

    // Decrypt the data using CryptoJS
    let decrypted;
    try {
      decrypted = CryptoJS.AES.decrypt(encryptedData, password);
    } catch (error) {
      throw new Error(CRYPTO_ERRORS.INVALID_PASSWORD);
    }

    // Convert decrypted data to UTF8 string
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedString || decryptedString.length === 0) {
      throw new Error(CRYPTO_ERRORS.INVALID_PASSWORD);
    }

    // Convert base64 back to binary data
    let originalData;
    try {
      originalData = Buffer.from(decryptedString, "base64");
    } catch (error) {
      throw new Error(CRYPTO_ERRORS.CORRUPTED_DATA);
    }

    // Write the decrypted data using handleWriteFile
    const writeResult = await handleWriteFile(null, filePath, originalData, {
      ensureDir: true, // Ensure parent directory exists
    });

    if (!writeResult.success) {
      throw new Error(writeResult.error);
    }

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
