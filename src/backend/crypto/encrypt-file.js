// Module Name: File Encryption Module
// Provides secure file encryption using CryptoJS AES

// Purpose:
// - Primary function: Encrypt individual files with password protection
// - Key features: AES encryption, base64 encoding, encryption status tracking
// - Important behaviors: Adds encryption prefix, prevents double encryption
// - Quality considerations: Maintains encryption security and format consistency

// Dependencies:
// - crypto-js: CryptoJS library for AES encryption
// - fs-extra: Enhanced file system operations
// - @constants/crypto: Encryption-related constants

// Usage Examples:
// ```
// // Basic file encryption
// const result = await encryptFile('/path/to/file', 'password123');
// if (result.success) {
//   console.log('File encrypted:', result.message);
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
// - File System: Direct interaction for file operations

// Process/Operation Flow:
// 1. Validate input parameters (file path and password)
// 2. Read file content in UTF-8 encoding
// 3. Check for existing encryption (MARAIKKA_ENCRYPTED prefix)
// 4. Perform AES encryption on content
// 5. Add encryption prefix to encrypted content
// 6. Write encrypted content back to file
// 7. Return success/error status with message

const CryptoJS = require("crypto-js");
const fs = require("fs-extra");
const { ENCRYPTION_PREFIX, CRYPTO_ERRORS } = require("@constants/crypto");

/**
 * Encrypts a single file using CryptoJS AES encryption
 *
 * @param {string} filePath - Path to file to encrypt
 * @param {string} password - Encryption password
 * @returns {Promise<Object>} Encryption result with success status
 * @property {boolean} success - Whether the encryption was successful
 * @property {string} message - Success message if encryption succeeded
 * @property {string} error - Error message if encryption failed
 *
 * @throws {Error} INVALID_PASSWORD - If password is missing or invalid
 * @throws {Error} FILE_ALREADY_ENCRYPTED - If file is already encrypted
 * @throws {Error} ENCRYPTION_FAILED - If encryption process fails
 *
 * @example
 * // Successful encryption
 * const result = await encryptFile('document.txt', 'securePass123');
 * if (result.success) {
 *   console.log(result.message); // "File encrypted successfully"
 * }
 *
 * @example
 * // Handling encryption errors
 * const result = await encryptFile('document.txt', '');
 * if (!result.success) {
 *   console.error(result.error); // "Invalid password provided"
 * }
 */
async function encryptFile(filePath, password) {
  try {
    // Validate inputs
    if (!filePath || !password) {
      throw new Error(CRYPTO_ERRORS.INVALID_PASSWORD);
    }

    // Read file content
    const content = await fs.readFile(filePath, "utf8");

    // Check if already encrypted
    if (content.startsWith(ENCRYPTION_PREFIX)) {
      throw new Error(CRYPTO_ERRORS.FILE_ALREADY_ENCRYPTED);
    }

    // Encrypt content
    const encrypted = CryptoJS.AES.encrypt(content, password).toString();
    const encryptedContent = ENCRYPTION_PREFIX + encrypted;

    // Write encrypted content back to file
    await fs.writeFile(filePath, encryptedContent, "utf8");

    return {
      success: true,
      message: "File encrypted successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || CRYPTO_ERRORS.ENCRYPTION_FAILED,
    };
  }
}

module.exports = { encryptFile };
