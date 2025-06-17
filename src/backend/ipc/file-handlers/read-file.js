// File Reader Handler
// Unified file reading with automatic binary/text detection and safety features

// Purpose:
// - Read files with automatic binary/text detection based on extension
// - Enforce size limits and validate file accessibility
// - Return binary data as Buffer for efficient blob creation in renderer
// - Provide consistent response format with metadata

// Dependencies:
// - fs-extra: Enhanced file system operations for reading and stats
// - path: File path manipulation for extension extraction
// - @backend/utils/get-mime-type: MIME type detection utility
// - @constants/file: File type constants and size limits

// Usage Examples:
// ```
// // Automatic binary file reading
// const result = await handleReadFile(event, '/path/image.jpg');
// if (result.success && result.isBinary) {
//   const blob = new Blob([result.content], { type: result.mimeType });
//   const blobURL = URL.createObjectURL(blob);
// }
//
// // Text file reading
// const result = await handleReadFile(event, '/path/document.txt');
// if (result.success && !result.isBinary) {
//   console.log('Text content:', result.content);
// }
// ```

// Integration Points:
// - IPC System: Registered as 'read-file' handler in register-handlers.js
// - Frontend UI: Used by text editor, PDF viewer, and preview components
// - Image Editor: Provides binary data for blob URL creation
// - Crypto System: Uses same detection logic as encryption handlers

// Process Flow:
// 1. Validate input parameters and check file existence
// 2. Get file statistics and enforce size limits
// 3. Auto-detect file type using extension and MIME type
// 4. Read file content as binary Buffer or UTF-8 string
// 5. Return unified response with content, type info, and metadata

const fs = require("fs-extra");
const path = require("path");
const getMimeType = require("@backend/utils/get-mime-type");
const { BINARY_EXTENSIONS, MAX_PREVIEW_FILE_SIZE } = require("@constants/file");

/**
 * Reads any file with automatic binary/text detection and returns appropriate format
 * Binary files returned as Buffer for efficient blob creation in renderer
 *
 * @param {Object} _event - IPC event object (automatically provided by Electron)
 * @param {string} filePath - Absolute path to the file to read
 * @param {Object} options - Additional reading options
 * @param {boolean} [options.forceText] - Force reading as text regardless of detection
 * @param {boolean} [options.forceBinary] - Force reading as binary regardless of detection
 * @returns {Promise<Object>} File reading result
 * @property {boolean} success - Whether the read operation was successful
 * @property {string|Buffer} [content] - File content (string for text, Buffer for binary)
 * @property {string} [mimeType] - Detected MIME type of the file
 * @property {boolean} [isBinary] - Whether the file was read as binary
 * @property {number} [size] - File size in bytes
 * @property {string} [extension] - File extension (lowercase)
 * @property {string} [encoding] - Content encoding type ('utf8', 'binary')
 * @property {string} [error] - Error message if success is false
 *
 * @example
 * // Binary file for blob creation
 * const result = await handleReadFile(event, '/path/image.jpg');
 * if (result.success && result.isBinary) {
 *   const blob = new Blob([result.content], { type: result.mimeType });
 *   const blobURL = URL.createObjectURL(blob);
 * }
 */
async function handleReadFile(_event, filePath, options = {}) {
  try {
    // Input validation
    if (!filePath) {
      throw new Error("File path is required");
    }

    // Check if file exists
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    // Get file statistics
    const stats = await fs.stat(filePath);

    // Enforce size limits for safety
    if (stats.size > MAX_PREVIEW_FILE_SIZE) {
      throw new Error(
        `File too large (${stats.size} bytes). Maximum allowed: ${MAX_PREVIEW_FILE_SIZE} bytes`,
      );
    }

    // Auto-detect file type
    const fileExt = path.extname(filePath).toLowerCase();
    const mimeType = getMimeType(fileExt);

    // Determine if file should be read as binary
    let isBinaryFile = BINARY_EXTENSIONS.includes(fileExt);

    // Allow options to override auto-detection
    if (options.forceText) {
      isBinaryFile = false;
    } else if (options.forceBinary) {
      isBinaryFile = true;
    }

    // Read file content based on detected/forced type
    let content;
    let encoding;
    if (isBinaryFile) {
      // Read as binary Buffer
      content = await fs.readFile(filePath);
      encoding = "binary";
    } else {
      // Read as UTF-8 text
      content = await fs.readFile(filePath, "utf8");
      encoding = "utf8";
    }

    return {
      success: true,
      content: content,
      mimeType: mimeType,
      isBinary: isBinaryFile,
      size: stats.size,
      extension: fileExt,
      encoding: encoding,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = { handleReadFile };
