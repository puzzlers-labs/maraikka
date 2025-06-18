// File Writer IPC Handler
// Lightweight wrapper exposing `@backend/file-manager/write-file` to renderer
// processes via IPC. All validation, encryption header handling, and binary
// detection reside in the shared utility.

// Purpose:
// - Provide IPC-friendly `handleWriteFile` without duplicating write logic.

// Dependencies:
// - @backend/file-manager/write-file: Core write utility (binary/text, encryption, etc.).

// Usage Examples:
// ```javascript
// const ok = await handleWriteFile(event, '/tmp/test.txt', 'hello');
// if (ok.success) console.log('saved');
// ```

// Integration Points:
// - IPC System: registered as "write-file" in global handler registry.

// Process Flow:
// 1. Validate presence of mandatory args.
// 2. Delegate to `writeFile(filePath, content, options)`.

const { writeFile } = require("@backend/file-manager/write-file");

/**
 * Intelligently writes any content with automatic binary/text detection and safety features
 * Provides unified file writing with type detection, path validation, and consistent response format
 *
 * @param {Object} _event - IPC event object (automatically provided by Electron)
 * @param {string} filePath - Absolute path where the file should be written
 * @param {string|Buffer} content - Content to write (string for text, Buffer for binary)
 * @param {Object} [options] - Behaviour flags forwarded to `writeFile`.
 * @param {boolean} [options.isBinary] - Force binary mode (overrides auto-detection).
 * @param {boolean} [options.isEncrypted] - Prepend Maraikka encryption header when true.
 * @param {string}  [options.encoding="utf8"] - Encoding to apply for text writes.
 * @returns {Promise<Object>} Unified file writing result
 * @property {boolean} success - Whether the write operation was successful
 * @property {string} [savedPath] - Full path where file was saved (present if success is true)
 * @property {number} [size] - Number of bytes written (present if success is true)
 * @property {boolean} [isBinary] - Whether content was written in binary mode
 * @property {boolean} [isEncrypted] - Whether Maraikka header was prepended
 * @property {string} [error] - Error message (present if success is false)
 *
 * @throws {Error} When file path is missing or invalid
 * @throws {Error} When content is missing or invalid type
 * @throws {Error} When directory creation fails
 * @throws {Error} When file writing fails
 *
 * @example
 * // Writing text content
 * const result = await handleWriteFile(event, '/path/config.json', '{"setting": "value"}');
 * if (result.success) {
 *   console.log(`Text file saved: ${result.savedPath} (${result.size} bytes)`);
 * } else {
 *   console.error(`Failed to save: ${result.error}`);
 * }
 *
 * // Writing binary content
 * const imageBuffer = Buffer.from(base64Data, 'base64');
 * const result = await handleWriteFile(event, '/path/image.png', imageBuffer);
 * if (result.success) {
 *   console.log(`Binary file saved: ${result.savedPath} (${result.size} bytes)`);
 * }
 */
async function handleWriteFile(_event, filePath, content, options = {}) {
  if (!filePath) {
    throw new Error("File path is required");
  }
  if (content === undefined || content === null) {
    throw new Error("Content is required");
  }

  try {
    return await writeFile(filePath, content, options);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { handleWriteFile };
