// In-Memory Decryption Module
// Provides secure in-memory decryption for file preview and edit operations
//
// Purpose:
// - Handles decryption of both text and binary files without disk writes
// - Supports preview operations with MIME type detection
// - Enables text editor integration for secure file editing
// - Maintains data security by keeping decrypted content in memory only
// - Ensures consistent decryption logic across the application
//
// Dependencies:
// - crypto-js: Core encryption/decryption functionality
// - @constants/crypto: Encryption-related constants and error codes
//
// Usage Examples:
// ```
// // Text file decryption
// const result = await decryptInMemory(encryptedContent, password, {
//   isBinaryFile: false,
//   mimeType: 'text/plain'
// });
// if (result.success) {
//   console.log('Decrypted text:', result.content);
// }
//
// // Binary file decryption
// const result = await decryptInMemory(encryptedContent, password, {
//   isBinaryFile: true,
//   mimeType: 'image/jpeg'
// });
// if (result.success) {
//   // result.content is a Buffer for binary data
// }
// ```
//
// Integration Points:
// - Preview System: Used by decrypt-file-for-preview for file previews
// - Text Editor: Integrated with decrypt-file-for-edit for secure editing
// - Binary Viewer: Handles binary file preview operations
// - Security Layer: Maintains encryption integrity during operations
//
// Process Flow:
// 1. Validate inputs and encryption status
// 2. Remove encryption prefix and decrypt data
// 3. Convert decrypted base64 to appropriate format
// 4. Return content with type information

const CryptoJS = require("crypto-js");
const { ENCRYPTION_PREFIX, CRYPTO_ERRORS } = require("@constants/crypto");

/**
 * Core function to decrypt file content in memory without disk writes
 * Handles both text and binary files with appropriate conversions
 *
 * @param {string} encryptedContent - The encrypted content to decrypt
 * @param {string} password - Password for decryption
 * @param {Object} options - Additional options for decryption
 * @param {boolean} options.isBinaryFile - Whether the file is binary
 * @param {string} options.mimeType - MIME type of the file
 * @returns {Object} Decryption result with content and metadata
 * @property {boolean} success - Whether decryption was successful
 * @property {string|Buffer} content - Decrypted content (string for text, Buffer for binary)
 * @property {string} mimeType - MIME type of the decrypted content
 * @property {boolean} isBinary - Whether the decrypted content is binary
 * @throws {Error} If decryption fails or input is invalid
 */
async function decryptInMemory(encryptedContent, password, options = {}) {
  try {
    // Validate inputs
    if (!encryptedContent) {
      throw new Error("Encrypted content is required");
    }
    if (!password) {
      throw new Error("Password is required");
    }

    // Check if content is encrypted
    if (!encryptedContent.startsWith(ENCRYPTION_PREFIX)) {
      throw new Error(CRYPTO_ERRORS.FILE_NOT_ENCRYPTED);
    }

    // Remove encryption prefix and decrypt
    const encryptedData = encryptedContent.replace(ENCRYPTION_PREFIX, "");

    // Decrypt the content
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, password);

    if (!decryptedBytes || decryptedBytes.sigBytes <= 0) {
      throw new Error("Failed to decrypt - invalid password or corrupted data");
    }

    // Get decrypted base64 string
    const decryptedBase64 = decryptedBytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedBase64) {
      throw new Error("Failed to decrypt - invalid password or corrupted data");
    }

    // Handle binary vs text files
    if (options.isBinaryFile) {
      // Convert base64 to binary buffer for binary files
      const binaryBuffer = Buffer.from(decryptedBase64, "base64");
      return {
        success: true,
        content: binaryBuffer,
        mimeType: options.mimeType,
        isBinary: true,
      };
    } else {
      // Convert base64 to text for text files
      const textContent = Buffer.from(decryptedBase64, "base64").toString(
        "utf8",
      );
      return {
        success: true,
        content: textContent,
        mimeType: options.mimeType,
        isBinary: false,
      };
    }
  } catch (error) {
    throw error;
  }
}

module.exports = { decryptInMemory };
