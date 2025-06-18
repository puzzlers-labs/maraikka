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
// - crypto-js: CryptoJS library for AES decryption
// - fs-extra: Enhanced file system operations
// - path: File path manipulation utilities
//
// Usage Examples:
// ```
// // Basic file decryption
// const result = await decryptFile('/path/to/file', 'password123');
// if (result.success) {
//   console.log('File decrypted:', result.message);
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
// - File System: Direct interaction for file operations
//
// Decryption Flow:
// 1. Validate file path and password inputs
// 2. Check for MARAIKKA_ENCRYPTED prefix
// 3. Extract and decrypt encrypted data
// 4. Convert decrypted data from base64
// 5. Write original data back to file

const CryptoJS = require("crypto-js");
const fs = require("fs-extra");
const path = require("path");
const { ENCRYPTION_PREFIX, CRYPTO_ERRORS } = require("@constants/crypto");

/**
 * Decrypts a single file encrypted with CryptoJS AES
 * Handles both text and binary files with proper validation
 *
 * @param {string} filePath - Path to encrypted file
 * @param {string} password - Decryption password
 * @returns {Promise<Object>} Decryption result object
 * @property {boolean} success - Whether the operation was successful
 * @property {string} message - Success message or error description
 * @property {string} [error] - Error message if operation failed
 *
 * @example
 * // Decrypt file with error handling
 * try {
 *   const result = await decryptFile('/encrypted/file.txt', 'userPassword');
 *   if (result.success) {
 *     // Handle successful decryption
 *     console.log(result.message);
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
    if (!filePath || !password) {
      throw new Error("File path and password are required");
    }

    // Check if file exists
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    // Read the file content
    const fileContent = await fs.readFile(filePath, "utf8");

    // Check if file is encrypted by looking for Maraikka prefix
    if (!fileContent.startsWith(ENCRYPTION_PREFIX)) {
      return {
        success: true,
        message: `File is not encrypted: ${path.basename(filePath)}`,
      };
    }

    // Extract the encrypted data (remove the prefix)
    const encryptedData = fileContent.substring(ENCRYPTION_PREFIX.length);

    if (!encryptedData || encryptedData.trim().length === 0) {
      throw new Error("Encrypted data is empty or corrupted");
    }

    // Decrypt the data using CryptoJS
    let decrypted;
    try {
      decrypted = CryptoJS.AES.decrypt(encryptedData, password);
    } catch (error) {
      throw new Error("Failed to decrypt - invalid password or corrupted file");
    }

    // Convert decrypted data to UTF8 string
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedString || decryptedString.length === 0) {
      throw new Error(
        "Decryption failed - incorrect password or corrupted data",
      );
    }

    // Convert base64 back to binary data
    let originalData;
    try {
      originalData = Buffer.from(decryptedString, "base64");
    } catch (error) {
      throw new Error(
        "Failed to decode decrypted data - file may be corrupted",
      );
    }

    // Write the original data back to the same file
    await fs.writeFile(filePath, originalData);

    return {
      success: true,
      message: `File decrypted: ${path.basename(filePath)}`,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to decrypt ${path.basename(filePath)}: ${error.message}`,
    };
  }
}

module.exports = { decryptFile };
