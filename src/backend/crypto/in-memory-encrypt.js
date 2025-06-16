// In-Memory Encryption Module
// Provides secure in-memory encryption for file saving and preview operations
//
// Purpose:
// - Handles encryption of both text and binary files without intermediate writes
// - Supports saving operations with proper binary handling
// - Enables secure preview generation for encrypted content
// - Maintains data security by processing content in memory
// - Ensures consistent encryption logic across the application
//
// Dependencies:
// - crypto-js: Core encryption/decryption functionality
// - @constants/crypto: Encryption-related constants and prefixes
//
// Usage Examples:
// ```
// // Text file encryption
// const result = await encryptInMemory("Hello World", password, {
//   isBinaryFile: false
// });
// if (result.success) {
//   // result.content contains encrypted string with MARAIKKA prefix
// }
//
// // Binary file encryption
// const imageBuffer = await fs.readFile('image.jpg');
// const result = await encryptInMemory(imageBuffer, password, {
//   isBinaryFile: true
// });
// if (result.success) {
//   // result.content contains encrypted binary data with MARAIKKA prefix
// }
// ```
//
// Integration Points:
// - Save System: Used by file-save operations for secure storage
// - Preview System: Generates encrypted content for preview features
// - Binary Handler: Processes image and binary file encryption
// - Security Layer: Maintains encryption integrity during operations
//
// Process Flow:
// 1. Validate input content and password
// 2. Convert content to base64 (handling binary/text appropriately)
// 3. Encrypt the base64 content with AES
// 4. Add MARAIKKA prefix for identification

const CryptoJS = require("crypto-js");
const { ENCRYPTION_PREFIX } = require("@constants/crypto");

/**
 * Core function to encrypt content in memory without intermediate file writes
 * Handles both text strings and binary buffers with appropriate conversions
 *
 * @param {string|Buffer} content - The content to encrypt (text string or binary buffer)
 * @param {string} password - Password for encryption
 * @param {Object} options - Additional options for encryption
 * @param {boolean} options.isBinaryFile - Whether the content is binary
 * @returns {Object} Encryption result with encrypted content
 * @property {boolean} success - Whether encryption was successful
 * @property {string} content - Encrypted content with MARAIKKA prefix
 * @property {boolean} isBinary - Whether the original content was binary
 * @throws {Error} If encryption fails or input validation fails
 */
async function encryptInMemory(content, password, options = {}) {
  try {
    // Validate inputs
    if (!content) {
      throw new Error("Content is required");
    }
    if (!password) {
      throw new Error("Password is required");
    }

    // Convert content to base64
    let base64Content;
    if (options.isBinaryFile) {
      // For binary files, content should be a Buffer
      if (!Buffer.isBuffer(content)) {
        throw new Error("Binary content must be provided as a Buffer");
      }
      base64Content = content.toString("base64");
    } else {
      // For text files, content should be a string
      if (typeof content !== "string") {
        throw new Error("Text content must be provided as a string");
      }
      base64Content = Buffer.from(content, "utf8").toString("base64");
    }

    // Encrypt the base64 content
    const encrypted = CryptoJS.AES.encrypt(base64Content, password).toString();

    // Add Maraikka prefix
    const maraikkaEncrypted = ENCRYPTION_PREFIX + encrypted;

    return {
      success: true,
      content: maraikkaEncrypted,
      isBinary: options.isBinaryFile,
    };
  } catch (error) {
    throw error;
  }
}

module.exports = { encryptInMemory };
