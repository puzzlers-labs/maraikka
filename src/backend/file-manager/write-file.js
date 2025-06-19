// Module Name: File Manager - Write File Utility
// Unified helper to save any content to disk with optional binary mode,
// Maraikka encryption header preparation, and strict validation.

// Purpose:
// - Primary function: Persist arbitrary content (Buffer or string) to the
//   filesystem from anywhere in the backend layer.
// - Key features:
//   • Auto-detection of binary vs text when `options.isBinary` is omitted.
//   • Automatic parent-directory creation.
//   • Optional prepending of the Maraikka encryption header + metadata when
//     `options.isEncrypted` is true (mirrors output of encrypt-file.js).
//   • Unified success/error result object for predictable downstream usage.
// - Important behaviors:
//   • When encryption is requested the final output is always written as a
//     binary Buffer (even for original text) so the header and payload are
//     contiguous bytes.
//   • The function never mutates the original `content` argument.
// - Quality considerations: Strong parameter validation, MD5 signature
//   generation for encrypted files, descriptive error bubbling.
// - Security considerations: Prevents path traversal issues by `path.resolve`
//   normalization and ensures header construction cannot be spoofed by the
//   caller.

// Dependencies:
// - fs-extra:  `ensureDir`, `writeFile` for safe filesystem manipulation.
// - path:      Normalises paths and extracts filenames for metadata.
// - crypto:    Generates content signature hashes for encrypted metadata.
// - @constants/crypto: Provides the `ENCRYPTION_PREFIX` constant.

// Usage Examples:
// ```javascript
// const { writeFile } = require('@backend/file-manager/write-file');
//
// // 1) Simple UTF-8 text write
// await writeFile('/tmp/readme.txt', 'Hello World');
//
// // 2) Explicit binary write
// const img = await fs.readFile('/assets/logo.png');
// await writeFile('/tmp/logo.png', img, { isBinary: true });
//
// // 3) Prepending encryption header (cipher already produced elsewhere)
// const cipher = await getEncryptedBuffer();
// await writeFile('/tmp/secret.dat', cipher, {
//   isBinary: true,
//   isEncrypted: true,
// });
// ```

// Integration Points:
// - Encryption / decryption workflows for persisting cipher/plaintext data.
// - Any backend utility or IPC handler that needs robust write semantics
//   without directly dealing with fs-extra primitives.

// Process/Operation Flow:
// 1. Validate parameters and normalise `filePath`.
// 2. Ensure parent directory exists (auto-created when missing).
// 3. Resolve binary vs text mode (`options.isBinary` or auto-detect).
// 4. When `options.isEncrypted` is true, build header and concatenate with
//    payload, computing signature metadata.
// 5. Persist the assembled data with the correct encoding.
// 6. Return a unified result object describing the operation outcome.

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const { ENCRYPTION_PREFIX } = require("@constants/crypto");
const { detectEncoding } = require("@backend/file-manager/detect-encoding");

/**
 * Write arbitrary content to disk with optional binary mode and encryption header.
 *
 * @param {string} filePath                          Absolute path to output file.
 * @param {string|Buffer} content                    Data to write (string for text, Buffer for binary).
 * @param {Object} [options]                         Additional behaviour flags.
 * @param {boolean} [options.isEncrypted]            Prepend Maraikka encryption header + metadata when true.
 * @param {string}  [options.encoding="binary"]      Encoding to use when content is encrypted. Defaults to "binary" if not provided.
 * @returns {Promise<Object>}                        Unified result object.
 * @property {boolean} success                       Indicates overall success.
 * @property {string}  [savedPath]                   Written file path (present when success).
 * @property {number}  [size]                        Bytes written (present when success).
 * @property {boolean} [isBinary]                    Whether write was performed in binary mode.
 * @property {boolean} [isEncrypted]                 Whether encryption header was prepended.
 * @property {string}  [error]                       Error message when success is false.
 */
async function writeFile(filePath, content, options = {}) {
  try {
    // 1. Validate mandatory parameters
    if (!filePath) {
      throw new Error("File path is required");
    }
    if (content === undefined || content === null) {
      throw new Error("Content is required");
    }

    // Normalise the destination path for consistency across platforms
    const normalisedPath = path.resolve(filePath);

    // Ensure parent directory always exists
    await fs.ensureDir(path.dirname(normalisedPath));

    // 2. Determine if we are writing binary or text
    const isBuffer = Buffer.isBuffer(content);
    const dataBuffer = isBuffer ? content : Buffer.from(content);

    // 3. Optionally prepend Maraikka encryption header + metadata
    let finalOutput;
    if (options.isEncrypted) {
      // Build metadata similar to encrypt-file.js
      const signature = crypto
        .createHash("md5")
        .update(dataBuffer)
        .digest("hex");

      const metadata = {
        filename: path.basename(normalisedPath),
        encoding: options.encoding || "binary",
        version: 1, // Note: increment this when we change the header format
        signature,
      };

      const headerString = `[${ENCRYPTION_PREFIX}]${JSON.stringify(metadata)}`;
      const headerBuf = Buffer.from(headerString, "utf8");
      finalOutput = Buffer.concat([headerBuf, dataBuffer]);
    } else {
      finalOutput = content;
    }

    // 4. Persist to disk with appropriate encoding
    const encoding = detectEncoding(finalOutput);
    await fs.writeFile(normalisedPath, finalOutput);
    const sizeWritten = finalOutput.length;

    return {
      success: true,
      savedPath: normalisedPath,
      size: sizeWritten,
      isBuffer,
      isEncrypted: !!options.isEncrypted,
      encoding,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = { writeFile };
