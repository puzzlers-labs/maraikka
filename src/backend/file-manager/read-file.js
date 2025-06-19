// File Manager - Read File Utility
// Stand-alone helper to load any file from disk with automatic binary detection,
// MIME-type resolution, optional encryption metadata parsing, and strict size
// enforcement.
//
// Purpose:
// - Provide backend components a unified way to read files.
// - Detect binary versus text content using `isbinaryfile` heuristics instead of
//   hard-coded extension lists.
// - Resolve MIME type via the `mime` package for downstream preview/rendering.
// - Detect Maraikka-encrypted files, separate their metadata from the encrypted
//   payload, and expose both to callers.
// - Enforce `MAX_FILE_SIZE` to avoid excessive memory usage.
// - Provide a lightweight *header-only* mode (via `returnOnlyHeader` option) so
//   callers can quickly inspect encryption status and metadata without reading
//   full file contents.
//
// Dependencies:
// - fs-extra:          Async filesystem helpers (`pathExists`, `stat`, `readFile`).
// - mime:              Third-party MIME type resolver (`mime.getType`).
// - isbinaryfile:      Heuristic binary detector (`isBinaryFile`).
// - @constants/file:   Provides `MAX_FILE_SIZE` and `MAX_HEADER_BYTES` limits.
// - @constants/crypto: Encryption prefix constant (`ENCRYPTION_PREFIX`).
//
// Usage Examples:
// ```javascript
// const { readFile } = require('@backend/file-manager/read-file');
//
// // 1) Plain text
// const txt = await readFile('/docs/readme.txt');
// if (txt.success) console.log(txt.content); // UTF-8 string
//
// // 2) Binary image preview
// const img = await readFile('/images/photo.jpg');
// if (img.success) {
//   const blob = new Blob([img.content], { type: img.mimeType });
//   const url  = URL.createObjectURL(blob);
//   display(url);
// }
//
// // 3) Encrypted file
// const enc = await readFile('/secret/file.txt');
// if (enc.success && enc.isEncrypted) {
//   decrypt(enc.content, enc.metadata);
// }
//
// // 4) Header-only metadata inspection (no full file read)
// const info = await readFile('/media/large-video.mp4', { returnOnlyHeader: true });
// if (info.isEncrypted) {
//   console.log('Encrypted with', info.metadata.algorithm);
// }
// ```
//
// Integration Points:
// - IPC handlers (`read-file`, decrypt/encrypt flows) forward results to the
//   renderer.
// - Crypto modules reuse the encryption detection logic.
// - Preload scripts or automated tests can call this utility directly.
//
// Process/Operation Flow:
// 1. Validate parameters and file existence.
// 2. Enforce `MAX_FILE_SIZE` limit.
// 3. Resolve MIME type from path.
// 4. Read the file into a Buffer.
// 5. Determine binary/text via `isbinaryfile` heuristics.
// 6. Detect encryption header and, if present, extract metadata & payload.
// 7. Build and return a unified result object.

const fs = require("fs-extra");
const mime = require("mime");
const { MAX_FILE_SIZE, MAX_HEADER_BYTES } = require("@constants/file");
const { ENCRYPTION_PREFIX } = require("@constants/crypto");
const { detectEncoding } = require("@backend/file-manager/detect-encoding");
const {
  normaliseEncoding,
} = require("@backend/file-manager/normalize-encoding");

/**
 * Read a file from disk with automated type detection and optional encryption
 * parsing.
 *
 * @param {string} filePath
 *   Absolute path to the target file.
 * @param {Object} options
 *   Optional behavior flags and settings.
 * @property {boolean} [options.returnOnlyHeader]
 *   If true, only reads the file header and returns a result object without content.
 *
 * @returns {Promise<Object>} Result object
 * @property {boolean}   success       Indicates overall success.
 * @property {string}    [error]       Populated when `success` is false.
 * @property {Buffer|string} [content] Raw file bytes for binary files or UTF-8
 *                                    text for textual files. When encrypted,
 *                                    this is the cipher payload only.
 * @property {Object}    [metadata]    Parsed encryption metadata (present only
 *                                    when `isEncrypted` is true).
 * @property {string}    [mimeType]    Detected MIME type (e.g. "image/png").
 * @property {boolean}   [isEncrypted] True when the Maraikka encryption header
 *                                    is detected.
 * @property {number}    [size]        File size in bytes.
 * @property {string}    [encoding]    "binary" or "utf8" depending on the form
 *                                    of `content`. Defaults to "binary" if not detected.
 *
 * @example
 * // Quick usage
 * const res = await readFile('/tmp/report.pdf');
 * if (res.success) console.log('Loaded', res.size, 'bytes');
 */
async function readFile(filePath, options = {}) {
  try {
    // Handle optional behaviour flags
    const { returnOnlyHeader = false } = options;

    // 1. Validate filePath
    if (!filePath) {
      throw new Error("File path is required");
    }

    // 2. Ensure file exists
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    // Fetch stats (size is useful regardless of mode) and enforce size limit when doing a full read
    const stats = await fs.stat(filePath);

    if (!returnOnlyHeader && stats.size > MAX_FILE_SIZE) {
      throw new Error(
        `File too large (${stats.size} bytes). Maximum allowed: ${MAX_FILE_SIZE} bytes`,
      );
    }

    // 3. MIME detection using `mime` package
    const mimeType = mime.getType(filePath) || "application/octet-stream";

    // Short-circuit when caller only wants header information
    if (returnOnlyHeader) {
      const bytesToRead = Math.min(stats.size, MAX_HEADER_BYTES);

      // Read the leading portion of the file once
      const fd = fs.openSync(filePath, "r");
      let headerBuffer;
      try {
        headerBuffer = Buffer.alloc(bytesToRead);
        const bytesRead = fs.readSync(fd, headerBuffer, 0, bytesToRead, 0);
        headerBuffer = headerBuffer.subarray(0, bytesRead);
      } finally {
        fs.closeSync(fd);
      }

      // Encryption detection identical to full-read path but scoped to the partial buffer
      const encryptionHeader = `[${ENCRYPTION_PREFIX}]`;
      const headerLength = Buffer.byteLength(encryptionHeader, "utf8");
      const possibleHeader = headerBuffer.toString("utf8", 0, headerLength);
      const isEncrypted = possibleHeader === encryptionHeader;
      let encoding = detectEncoding(headerBuffer);

      let metadata;
      if (isEncrypted) {
        // Attempt to locate the end of the metadata JSON within our buffer
        const bufferUtf8 = headerBuffer.toString("utf8");
        const jsonStart = headerLength;
        const jsonEnd = bufferUtf8.indexOf("}", jsonStart);
        if (jsonEnd === -1) {
          throw new Error(
            "Unable to parse encrypted file metadata from header - increase header read size if necessary",
          );
        }

        const metadataJson = bufferUtf8.slice(jsonStart, jsonEnd + 1);
        try {
          metadata = JSON.parse(metadataJson);
          encoding = normaliseEncoding(metadata.encoding);
        } catch (_err) {
          throw new Error("Unable to parse encrypted file metadata");
        }
      }

      // Note: intentionally omitting `content` to honour returnOnlyHeader contract
      return {
        success: true,
        metadata,
        mimeType,
        isEncrypted,
        size: stats.size,
        encoding,
      };
    }

    // 5. Always read as Buffer – gives full fidelity and lets us decide later
    const fileBuffer = await fs.readFile(filePath);

    // Detect Maraikka-encrypted content (header: "[MARAIKKA_ENCRYPTED:]{json}")
    const encryptionHeader = `[${ENCRYPTION_PREFIX}]`;
    const headerLength = Buffer.byteLength(encryptionHeader, "utf8");
    const possibleHeader = fileBuffer.toString("utf8", 0, headerLength);
    const isEncrypted = possibleHeader === encryptionHeader;

    // If encrypted, extract metadata JSON and encrypted payload separately
    if (isEncrypted) {
      // Find end of metadata JSON (first closing brace after header)
      const fileUtf8 = fileBuffer.toString("utf8");
      const jsonStart = headerLength;
      const jsonEnd = fileUtf8.indexOf("}", jsonStart);
      if (jsonEnd === -1) {
        throw new Error(
          "Encryption metadata is malformed - the file has been corrupted (closing brace not found)",
        );
      }

      const metadataJson = fileUtf8.slice(jsonStart, jsonEnd + 1);
      let metadata;
      try {
        metadata = JSON.parse(metadataJson);
      } catch (_err) {
        throw new Error("Unable to parse encrypted file metadata");
      }

      // Calculate exact byte length of header+metadata to slice payload correctly
      const headerByteLen = Buffer.byteLength(
        encryptionHeader + metadataJson,
        "utf8",
      );
      let isBuffer = true;
      let encryptedPayload = fileBuffer.subarray(headerByteLen);
      if (metadata.encoding !== "binary") {
        isBuffer = false;
        encryptedPayload = encryptedPayload.toString(metadata.encoding);
      }

      return {
        success: true,
        content: encryptedPayload,
        isBuffer,
        metadata,
        mimeType,
        isEncrypted: true,
        size: stats.size,
        encoding: metadata.encoding || "binary",
      };
    }

    let encoding = detectEncoding(fileBuffer);
    let content = fileBuffer;
    let isBuffer = true;

    if (encoding && encoding !== "binary") {
      content = fileBuffer.toString(encoding);
      isBuffer = false;
    }

    return {
      success: true,
      content,
      isBuffer,
      mimeType,
      isEncrypted: false,
      size: stats.size,
      encoding,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = { readFile };
