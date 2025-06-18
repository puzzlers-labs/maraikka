// Module Name: IPC Handler - Read and Decrypt File
// Loads an encrypted file from disk, decrypts its payload in-memory, and returns the plain content

// Purpose:
// - Act as the single IPC entry-point for reading + decrypting a `.enc` file
// - Delegate disk IO to `readFile` to benefit from size-limits, MIME detection, etc.
// - Delegate cryptography to `decryptContent` for unified AES handling
// - Produce a concise, predictable result object for the renderer layer
//
// Dependencies:
// - readFile  ( @backend/file-manager/read-file )
//   Safe, size-aware file loader that auto-detects binary/text
// - decryptContent ( @backend/crypto/decrypt-content )
//   High-level AES decryptor with Buffer/string awareness
// - mime ( third-party )
//   MIME lookup for determining original content type from file extension
// - path ( Node.js )
//   Path utilities for deriving original filename / extension
//
// Usage Examples:
// ```javascript
// // Text document
// const res = await window.electronAPI.readAndDecryptFile(
//   '/docs/report.txt.enc',
//   'p@ssw0rd'
// );
// if (res.success) editor.load(res.content);
//
// // Image buffer
// const img = await window.electronAPI.readAndDecryptFile(
//   '/images/photo.jpg.enc',
//   'p@ssw0rd'
// );
// if (img.success) imageEditor.load(img.content, img.mimeType);
// ```
//
// Integration Points:
// - Renderer: exposed via `ipcMain.handle('read-and-decrypt-file', ...)`
// - Crypto: delegates to `decryptContent`
// - File-system: delegates to `readFile`
//
// Process/Operation Flow:
// 1. Validate `filePath` & `password`
// 2. Read the encrypted file with `readFile`
// 3. Decrypt the returned payload via `decryptContent`
// 4. Build and return a unified result object

const path = require("path");
const mime = require("mime");
const { readFile } = require("@backend/file-manager/read-file");
const { decryptContent } = require("@backend/crypto/decrypt-content");

/**
 * Read an encrypted file from disk, decrypt it in-memory, and return its plain content.
 *
 * @param {Object} _event           Electron IPC event object (unused).
 * @param {string} filePath         Absolute path to the encrypted file (should end with .enc).
 * @param {string} password         Decryption password.
 * @returns {Promise<Object>}       Result object.
 * @property {boolean} success      Indicates overall success of the operation.
 * @property {string|Buffer} [content]     Decrypted plain content (UTF-8 string or Buffer).
 * @property {string} [originalName]       Original filename without the `.enc` extension.
 * @property {string} [mimeType]           MIME type inferred from the original extension.
 * @property {boolean} [isBinary]          True when the original content was binary.
 * @property {number}  [size]              Byte length of `content` (present on success).
 * @property {string}  [error]             Human-readable error message when `success` is false.
 *
 * @example
 * const res = await handleReadAndDecryptFile(_event, '/tmp/photo.jpg.enc', 'secret');
 * if (res.success) display(res.content);
 */
async function handleReadAndDecryptFile(_event, filePath, password) {
  try {
    // 1. Basic parameter validation
    if (!filePath) {
      throw new Error("File path is required");
    }
    if (!password) {
      throw new Error("Password is required");
    }

    // 2. Read the encrypted file (size-safe & type-aware)
    const readResult = await readFile(filePath);
    if (!readResult.success) {
      throw new Error(readResult.error || "Unable to read file");
    }

    // 3. Decrypt the payload
    const decryptResult = await decryptContent(readResult.content, password);
    if (!decryptResult.success) {
      throw new Error(decryptResult.error || "Decryption failed");
    }

    // 4. Derive original filename & MIME type
    const originalName =
      readResult.metadata && readResult.metadata.filename
        ? readResult.metadata.filename
        : path.basename(filePath);

    const fileExt = path.extname(originalName).toLowerCase();
    const mimeType = mime.getType(fileExt) || "application/octet-stream";

    // 5. Assemble success response
    const { content, isBinary } = decryptResult;
    const size = isBinary ? content.length : Buffer.byteLength(content, "utf8");

    return {
      success: true,
      content,
      originalName,
      encoding: readResult.metadata.encoding,
      mimeType,
      isBinary,
      size,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { handleReadAndDecryptFile: handleReadAndDecryptFile };
