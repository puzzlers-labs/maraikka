// Encrypt Content Utility
// High-level helper for AES-encrypting any arbitrary content with automatic type handling

// Purpose:
// - Provide a single utility for encrypting both text and binary data
// - Automatically detect Buffer (binary) versus string (text) inputs
// - Return encrypted output in the same conceptual form (Buffer for binary, base64 string for text)
// - Centralise CryptoJS AES usage and error mapping for consistent behaviour across the backend

// Dependencies:
// - crypto-js: Performs AES encryption and produces base-64 text output
// - @constants/crypto: Provides standardised error messages consumed by this module

// Usage Examples:
// ```javascript
// // Import utility
// const { encryptContent } = require('@backend/crypto/encrypt-content');
//
// // Text encryption (UTF-8 string in, base64 string out)
// const textResult = await encryptContent('Hello World', 'p@ssw0rd');
// if (textResult.success) {
//   console.log('Encrypted text:', textResult.content); // Encrypted base64 string
// }
//
// // Binary encryption (Buffer in, Buffer out)
// const imageBuffer = await fs.readFile('/path/image.png');
// const binResult = await encryptContent(imageBuffer, 'p@ssw0rd');
// if (binResult.success && Buffer.isBuffer(binResult.content)) {
//   console.log('Encrypted binary size:', binResult.content.length);
// }
// ```

// Integration Points:
// - File encryption workflow (`encrypt-file.js`) for on-disk encryption
// - Any in-memory encryption requirement where content type may vary
// - Potential future IPC handlers that need uniform encryption logic

// Process/Operation Flow:
// 1. Validate inputs (content presence and password)
// 2. Determine if input is Buffer (binary) or string (text)
// 3. Convert content to base64 string for AES processing
// 4. Run CryptoJS AES encryption and capture base64 cipher text
// 5. Convert cipher text to Buffer if original was binary, else leave as string
// 6. Return unified success object or mapped error object

const CryptoJS = require("crypto-js");
const { CRYPTO_ERRORS } = require("@constants/crypto");

/**
 * Encrypt arbitrary content using AES.
 * Detects Buffer vs string and returns corresponding encrypted format.
 *
 * @param {string|Buffer} content - Plain content to encrypt (string for text, Buffer for binary).
 * @param {string} password - AES encryption password.
 * @returns {Promise<Object>} Result object
 * @property {boolean} success - Indicates if encryption succeeded
 * @property {string|Buffer} [content] - Encrypted output (Buffer if input was binary, base64 string otherwise)
 * @property {boolean} [isBinary] - true if original content was binary
 * @property {string} [error] - Populated when success is false, contains user-friendly error message
 *
 * @throws {Error} CRYPTO_ERRORS.INVALID_PASSWORD - When password is missing or empty
 * @throws {Error} CRYPTO_ERRORS.ENCRYPTION_FAILED - On validation failure or CryptoJS errors
 *
 * @example
 * // Text encryption
 * const res = await encryptContent('Hello', 'secret');
 * if (res.success) console.log(res.content);
 *
 * @example
 * // Binary encryption
 * const buf = await fs.readFile('image.jpg');
 * const res = await encryptContent(buf, 'secret');
 * if (res.success && Buffer.isBuffer(res.content)) {
 *   // `res.content` is a Buffer
 * }
 */
async function encryptContent(content, password) {
  try {
    if (content === undefined || content === null) {
      throw new Error(CRYPTO_ERRORS.ENCRYPTION_FAILED);
    }
    if (!password) {
      throw new Error(CRYPTO_ERRORS.INVALID_PASSWORD);
    }

    const isBinary = Buffer.isBuffer(content);

    // Convert plain content to base64 string for CryptoJS input
    const base64Plain = isBinary
      ? content.toString("base64")
      : Buffer.from(content, "utf8").toString("base64");

    // Encrypt base64 string with AES
    let encryptedBase64;
    try {
      encryptedBase64 = CryptoJS.AES.encrypt(base64Plain, password).toString();
    } catch (_err) {
      throw new Error(CRYPTO_ERRORS.ENCRYPTION_FAILED);
    }

    // Return Buffer for binary input, base64 string for text input
    const encryptedOutput = isBinary
      ? Buffer.from(encryptedBase64, "base64")
      : encryptedBase64;

    return {
      success: true,
      content: encryptedOutput,
      isBinary: isBinary,
    };
  } catch (error) {
    const message = Object.values(CRYPTO_ERRORS).includes(error.message)
      ? error.message
      : CRYPTO_ERRORS.ENCRYPTION_FAILED;

    return {
      success: false,
      error: message,
    };
  }
}

module.exports = { encryptContent };
