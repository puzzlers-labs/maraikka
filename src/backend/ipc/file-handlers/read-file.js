// File Reader IPC Handler
// Thin wrapper around `@backend/file-manager/read-file` to expose file-reading
// capabilities to the renderer process via IPC. All detection logic, size
// enforcement, encryption handling, etc. live inside
// the shared utility; this module merely validates input and forwards the call.

// Purpose:
// - Provide an IPC-friendly interface (`handleReadFile`) while centralising
//   the actual file-I/O logic in one place.

// Dependencies:
// - @backend/file-manager/read-file: Core read utility (binary detection,
//   encryption, etc.).

// Usage Examples:
// ```javascript
// const result = await handleReadFile(event, '/documents/report.pdf');
// if (result.success) console.log('Loaded', result.size, 'bytes');
// ```

// Integration Points:
// - IPC System: Registered as "read-file" in `src/backend/ipc/register-handlers.js`.
// - Front-end editors and preview components request files through this handler.

// Process Flow:
// 1. Validate argument presence.
// 2. Delegate to `readFile(filePath, options)`.
// 3. Propagate result back to caller.

const { readFile } = require("@backend/file-manager/read-file");

/**
 * Reads any file with automatic binary/text detection and returns appropriate format
 * Binary files returned as Buffer for efficient blob creation in renderer
 *
 * @param {Object} _event - IPC event object (automatically provided by Electron)
 * @param {string} filePath - Absolute path to the file to read
 * @returns {Promise<Object>} File reading result. Schema mirrors `readFile` utility.
 *   Key fields include:
 *   - `success`      {boolean}
 *   - `content`      {Buffer|string}
 *   - `mimeType`     {string}
 *   - `isEncrypted`  {boolean}
 *   - `metadata`     {Object}
 *   - `size`         {number}
 *   - `encoding`     {"utf8"|"binary"}
 *   - `error`        {string}
 *
 * @example
 * // File read from renderer via IPC
 * const info = await window.electronAPI.readFile('/documents/report.pdf');
 * if (info.success) console.log('Bytes', info.size);
 */
async function handleReadFile(_event, filePath) {
  if (!filePath) {
    throw new Error("File path is required");
  }

  try {
    return await readFile(filePath);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { handleReadFile };
