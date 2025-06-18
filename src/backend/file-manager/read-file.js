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
//
// Dependencies:
// - fs-extra:          Async filesystem helpers (`pathExists`, `stat`, `readFile`).
// - path:              File extension utilities for MIME lookup.
// - mime:              Third-party MIME type resolver (`mime.getType`).
// - isbinaryfile:      Heuristic binary detector (`isBinaryFile`).
// - @constants/file:   Provides strong `MAX_FILE_SIZE` limit.
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
// const enc = await readFile('/secret/file.enc');
// if (enc.success && enc.isEncrypted) {
//   decrypt(enc.content, enc.metadata);
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
const path = require("path");
const mime = require("mime");
const { isBinaryFile } = require("isbinaryfile");
const { MAX_FILE_SIZE } = require("@constants/file");
const { ENCRYPTION_PREFIX } = require("@constants/crypto");

/**
 * Read a file from disk with automated type detection and optional encryption
 * parsing.
 *
 * @param {string} filePath
 *   Absolute path to the target file.
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
 *                                    of `content`.
 *
 * @example
 * // Quick usage
 * const res = await readFile('/tmp/report.pdf');
 * if (res.success) console.log('Loaded', res.size, 'bytes');
 */
async function readFile(filePath) {
  try {
    // 1. Validate filePath
    if (!filePath) {
      throw new Error("File path is required");
    }

    // 2. Ensure file exists
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    // Fetch stats and enforce size limit
    const stats = await fs.stat(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      throw new Error(
        `File too large (${stats.size} bytes). Maximum allowed: ${MAX_FILE_SIZE} bytes`,
      );
    }

    // 3. MIME detection using `mime` package
    const mimeType = mime.getType(filePath) || "application/octet-stream";

    // 5. Always read as Buffer – gives full fidelity and lets us decide later
    const fileBuffer = await fs.readFile(filePath);

    // 4. Binary detection using heuristic rather than extension list
    let isBinaryContent = false;
    try {
      isBinaryContent = await isBinaryFile(fileBuffer, stats.size);
    } catch (_err) {
      // Fallback: treat as binary when mime type is not text/*
      isBinaryContent = !mimeType.startsWith("text/");
    }

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
      const encryptedPayload = fileBuffer.subarray(headerByteLen);

      return {
        success: true,
        content: encryptedPayload,
        metadata,
        mimeType,
        isEncrypted: true,
        size: stats.size,
        encoding: "binary",
      };
    }

    const content = isBinaryContent ? fileBuffer : fileBuffer.toString("utf8");
    const encoding = isBinaryContent ? "binary" : "utf8";

    return {
      success: true,
      content,
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
