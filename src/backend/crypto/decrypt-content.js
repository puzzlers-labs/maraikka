// Decrypt Content Utility
// High-level helper for AES-decrypting any arbitrary content with automatic type handling

// Purpose:
// - Provide a single utility for decrypting both text and binary data
// - Automatically detect Buffer (binary) versus string (text) inputs
// - Return decrypted output in the same conceptual form as the original plain content
// - Centralise CryptoJS AES usage and error mapping for consistent behaviour across the backend

// Dependencies:
// - crypto-js: Performs AES decryption on base-64 text input
// - @constants/crypto: Provides standardised error messages consumed by this module

// Usage Examples:
// ```javascript
// // Import utility
// const { decryptContent } = require('@backend/crypto/decrypt-content');
//
// // Text decryption (base64 cipher string in, UTF-8 string out)
// const textResult = await decryptContent(cipherBase64, 'p@ssw0rd');
// if (textResult.success) {
//   console.log('Decrypted text:', textResult.content); // "Hello World"
// }
//
// // Binary decryption (Buffer in, Buffer out)
// const binResult = await decryptContent(cipherBuffer, 'p@ssw0rd');
// if (binResult.success && Buffer.isBuffer(binResult.content)) {
//   console.log('Decrypted binary size:', binResult.content.length);
// }
// ```

// Integration Points:
// - File decryption workflow (`decrypt-file.js`) for on-disk decryption
// - Any in-memory decryption requirement where content type may vary
// - Potential future IPC handlers that need uniform decryption logic

// Process/Operation Flow:
// 1. Validate inputs (cipher content presence and password)
// 2. Determine if cipher input is Buffer (binary) or string (text)
// 3. Convert cipher to base64 string for CryptoJS input
// 4. Run CryptoJS AES decryption and capture base64 plain text
// 5. Convert plain text to Buffer if original was binary, else to UTF-8 string
// 6. Return unified success object or mapped error object

const CryptoJS = require("crypto-js");
const { CRYPTO_ERRORS } = require("@constants/crypto");

/**
 * Decrypt arbitrary content previously encrypted with AES.
 * Detects Buffer vs string and returns corresponding decrypted format.
 *
 * @param {string|Buffer} content - Cipher content to decrypt (string for text, Buffer for binary).
 * @param {string} password - AES decryption password.
 * @returns {Promise<Object>} Result object
 * @property {boolean} success - Indicates if decryption succeeded
 * @property {string|Buffer} [content] - Decrypted output (Buffer if original was binary, UTF-8 string otherwise)
 * @property {boolean} [isBinary] - true if original content was binary
 * @property {string} [error] - Populated when success is false, contains user-friendly error message
 *
 * @throws {Error} CRYPTO_ERRORS.INVALID_PASSWORD - When password is missing or empty
 * @throws {Error} CRYPTO_ERRORS.DECRYPTION_FAILED - On validation failure or CryptoJS errors (e.g. wrong password)
 *
 * @example
 * // Text decryption
 * const res = await decryptContent(cipherBase64, 'secret');
 * if (res.success) console.log(res.content);
 *
 * @example
 * // Binary decryption
 * const resBin = await decryptContent(cipherBuffer, 'secret');
 * if (resBin.success && Buffer.isBuffer(resBin.content)) {
 *   // `resBin.content` is a Buffer
 * }
 */
async function decryptContent(content, password) {
  try {
    if (content === undefined || content === null) {
      throw new Error(CRYPTO_ERRORS.DECRYPTION_FAILED);
    }
    if (!password) {
      throw new Error(CRYPTO_ERRORS.INVALID_PASSWORD);
    }

    const isBinary = Buffer.isBuffer(content);

    // Convert cipher content to base64 string for CryptoJS input
    const encryptedString = isBinary ? content.toString("base64") : content;

    const decryptedString = CryptoJS.AES.decrypt(
      encryptedString,
      password,
    ).toString();

    // Convert plain base64 string back to original form (Buffer or UTF-8 string)
    const decryptedOutput = isBinary
      ? Buffer.from(decryptedString, "hex")
      : Buffer.from(decryptedString, "hex").toString("utf-8");

    return {
      success: true,
      content: decryptedOutput,
      isBinary,
    };
  } catch (error) {
    const message = Object.values(CRYPTO_ERRORS).includes(error.message)
      ? error.message
      : CRYPTO_ERRORS.DECRYPTION_FAILED;

    return {
      success: false,
      error: message,
    };
  }
}

module.exports = { decryptContent };
