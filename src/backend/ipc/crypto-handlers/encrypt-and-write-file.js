// Module Name: IPC Handler - Encrypt and Save File
// Handles encryption of arbitrary content (text or binary) and persists it to disk

// Purpose:
// - Provide a single IPC-accessible entry-point for encrypt-and-save operations
// - Accept plain content (string or Buffer), encrypt it using AES, then write the cipher text to disk
// - Maintain strict separation between renderer processes and core crypto/file-system logic
// - Deliver uniform success/error result objects for predictable renderer handling

// Dependencies:
// - encryptContent ( @backend/crypto/encrypt-content )
//   AES encryption with automatic Buffer/string detection
// - writeFile ( @backend/file-manager/write-file )
//   Robust utility for writing text or binary payloads to disk

// Usage Examples:
// ```javascript
// // Text encryption – from renderer via IPC
// const result = await window.electronAPI.encryptAndSaveFile(
//   '/tmp/notes.txt.enc',
//   'Confidential notes',
//   'sup3r-s3cret'
// );
// if (result.success) {
//   console.log(`Encrypted file saved at ${result.savedPath}`);
// }
//
// // Binary encryption – image buffer
// const buffer = fs.readFileSync('/path/logo.png');
// const result = await window.electronAPI.encryptAndSaveFile(
//   '/tmp/logo.png.enc',
//   buffer,
//   'sup3r-s3cret'
// );
// ```

// Integration Points:
// - Renderer Process: Exposed through `ipcMain.handle('encrypt-and-save-file', ...)`
// - Crypto Module: Delegates encryption to `encryptContent`
// - File System: Persists encrypted output through `writeFile`

// Process/Operation Flow:
// 1. Validate incoming parameters (filePath, content, password)
// 2. Invoke `encryptContent` to obtain cipher text (Buffer or base64 string)
// 3. Persist cipher text with `writeFile`, mirroring the original content type
// 4. Return a unified result object back to the renderer

const { encryptContent } = require("@backend/crypto/encrypt-content");
const { writeFile } = require("@backend/file-manager/write-file");

/**
 * Encrypt provided content and save it to disk.
 *
 * @param {Object} _event           Electron IPC event object (unused).
 * @param {string} filePath         Absolute or relative destination path for the encrypted file.
 * @param {string|Buffer} content   Plain content to encrypt. Strings are treated as UTF-8.
 * @param {string} password         Encryption password.
 * @returns {Promise<Object>}       Result object.
 * @property {boolean} success      Indicates if the operation completed successfully.
 * @property {string}  [savedPath]  Full path of the written file (present when success).
 * @property {number}  [size]       Byte size of the written file (present when success).
 * @property {string}  [error]      Populated when success is false describing the failure reason.
 *
 * @example
 * const res = await handleEncryptAndWriteFile(_event, 'secrets.enc', 'Top secret', 'p@ss');
 * if (res.success) {
 *   console.log(res.savedPath);
 * }
 */
async function handleEncryptAndWriteFile(_event, filePath, content, password) {
  try {
    // Parameter validation
    if (!filePath) {
      throw new Error("File path is required");
    }
    if (content === undefined || content === null) {
      throw new Error("Content must be provided");
    }
    if (!password) {
      throw new Error("Password is required");
    }

    // Encrypt the incoming content
    const encryptResult = await encryptContent(content, password);
    if (!encryptResult.success) {
      throw new Error(encryptResult.error || "Encryption failed");
    }

    // Convert to Buffer if needed (text output is base64 string)
    const cipherBuffer = encryptResult.isBinary
      ? encryptResult.content // already a Buffer
      : Buffer.from(encryptResult.content, "base64"); // base64 string

    // Write the encrypted payload to disk
    const writeResult = await writeFile(filePath, cipherBuffer, {
      isEncrypted: true,
      isBinary: true,
    });

    if (!writeResult.success) {
      throw new Error(writeResult.error || "File write failed");
    }

    return {
      success: true,
      savedPath: writeResult.savedPath,
      size: writeResult.size,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { handleEncryptAndWriteFile };
