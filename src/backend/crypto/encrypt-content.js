// Encrypt Content Utility
// One-stop helper that AES-encrypts arbitrary data (text or binary) while maintaining the
// original data shape and recording its detected encoding.

// Purpose:
// - Provide a single entry-point for encrypting both text and binary inputs
// - Automatically detect Buffer (binary) versus string (text) inputs
// - Persist character encoding information for text inputs using `chardet`
// - Return encrypted output in the same conceptual form
//   – Buffer for binary inputs
//   – Base-64 string for text inputs (to avoid unsafe characters)
// - Centralise `node:crypto` AES usage (AES-256-CBC + scrypt-derived key)
// - Surface simple, hard-coded error messages so callers are library-agnostic

// Dependencies:
// - node:crypto – Symmetric encryption (AES-256-CBC)
// - chardet – Best-effort character-set detection for text inputs

// Usage Examples:
// ```javascript
// const { encryptContent } = require('@backend/crypto/encrypt-content');
//
// // Text ➜ base64 string
// const textRes = await encryptContent('Hello World', 'myp4ss');
// if (textRes.success) {
//   console.log(textRes.encoding); // e.g. "UTF-8"
//   console.log(textRes.content);  // base-64 cipher text
// }
//
// // Binary ➜ Buffer
// const img = await fs.readFile('./photo.jpg');
// const binRes = await encryptContent(img, 'myp4ss');
// if (binRes.success && Buffer.isBuffer(binRes.content)) {
//   fs.writeFileSync('./photo.enc', binRes.content);
// }
// ```

// Integration Points:
// - File encryption workflow (`encrypt-file.js`)
// - Any IPC handler that needs uniform encryption logic
// - In-memory encryption for temporary data processing

// Process/Operation Flow:
// 1. Validate `content` and `password` inputs
// 2. Determine if `content` is a Buffer
// 3. Convert non-buffer text content to Buffer
// 4. Detect text encoding via `chardet`
// 5. Generate a 16-byte Salt and IV, derive 32-byte key with `crypto.scryptSync`
// 6. Encrypt using AES-256-CBC and prepend `[salt | iv]` to cipher bytes
// 7. Return: Buffer (binary) or base-64 string (text) plus metadata (`encoding`, `isBuffer`)

const crypto = require("crypto");
const { detectEncoding } = require("@backend/file-manager/detect-encoding");

/**
 * Encrypt arbitrary content using AES.
 * Detects Buffer vs string and returns corresponding encrypted format.
 *
 * @param {string|Buffer} content – Plain content to encrypt. Strings will be treated as text; Buffers as binary.
 * @param {string} password – User-supplied password for key derivation (AES-256-CBC).
 * @returns {Promise<Object>} Result object
 * @property {boolean} success – `true` when encryption succeeds
 * @property {string|Buffer} [content] – Cipher text (Buffer for binary input, base-64 string for text input)
 * @property {string|null} [encoding] – Detected character encoding for text inputs, `null` for binary
 * @property {boolean} [isBuffer] – `true` if the original input was a Buffer
 * @property {string} [error] – Present when `success === false`, contains user-friendly error description
 *
 * @throws {Error} "Invalid content provided" – When `content` is `null`/`undefined`
 * @throws {Error} "Invalid password provided" – When `password` is falsy
 * @throws {Error} "Encryption failed" – Any unexpected runtime failure
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
 *   // res.content is the encrypted Buffer
 * }
 */

// We store encoded string in base64 format to avoid issues with special characters

async function encryptContent(content, password) {
  try {
    if (content === undefined || content === null) {
      throw new Error("Invalid content provided");
    }
    if (!password) {
      throw new Error("Invalid password provided");
    }

    const isBuffer = Buffer.isBuffer(content);

    // Ensure we operate on a Buffer instance for the cipher
    const plainBuffer = isBuffer ? content : Buffer.from(content);
    const encoding = detectEncoding(plainBuffer);

    try {
      // 16-byte salt and IV for AES-256-CBC
      const salt = crypto.randomBytes(16);
      const iv = crypto.randomBytes(16);

      // Derive a 32-byte key using scrypt (synchronous for simplicity)
      const key = crypto.scryptSync(password, salt, 32);

      const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
      const encryptedBuffer = Buffer.concat([
        salt,
        iv,
        cipher.update(plainBuffer),
        cipher.final(),
      ]);

      // Return Buffer for binary input, base64 string for text input
      const encryptedOutput = isBuffer
        ? encryptedBuffer
        : encryptedBuffer.toString("base64");

      return {
        success: true,
        content: encryptedOutput,
        encoding,
        isBuffer,
      };
    } catch (_err) {
      throw new Error("Encryption failed");
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = { encryptContent };
