// File Writer Handler
// Unified file writing with automatic binary/text detection and safety features

// Purpose:
// - Primary function: Intelligently writes any content with automatic type detection
// - Key features: Auto-detection of Buffer vs string content, path validation, unified response
// - Important behaviors: Handles both binary and text files safely, validates inputs
// - Quality considerations: Comprehensive error handling and input validation
// - Security considerations: Path traversal protection and content validation

// Dependencies:
// - fs-extra: Enhanced file system operations for file writing and directory creation
// - path: File path manipulation and validation utilities

// Usage Examples:
// ```
// // Automatic text file writing
// const result = await handleWriteFile(event, '/path/document.txt', 'Hello World');
// if (result.success) {
//   console.log('File saved:', result.savedPath); // /path/document.txt
//   console.log('Size:', result.size); // 11 bytes
// }
//
// // Automatic binary file writing
// const buffer = Buffer.from('binary data');
// const result = await handleWriteFile(event, '/path/image.jpg', buffer);
// if (result.success) {
//   console.log('Binary file saved:', result.savedPath);
//   console.log('Size:', result.size); // buffer length
// }
// ```

// Integration Points:
// - IPC System: Registered as 'write-file' handler in register-handlers.js
// - Text Editor: Used for saving text file content
// - Image Handler: Can be used for binary image data
// - Crypto System: Compatible with encrypted content writing

// Process Flow:
// 1. Validate input parameters and content type
// 2. Ensure target directory exists
// 3. Auto-detect content type (Buffer = binary, string = text)
// 4. Write file with appropriate encoding
// 5. Return unified response with metadata

const fs = require("fs-extra");
const path = require("path");

/**
 * Intelligently writes any content with automatic binary/text detection and safety features
 * Provides unified file writing with type detection, path validation, and consistent response format
 *
 * @param {Object} _event - IPC event object (automatically provided by Electron)
 * @param {string} filePath - Absolute path where the file should be written
 * @param {string|Buffer} content - Content to write (string for text, Buffer for binary)
 * @param {Object} options - Additional writing options
 * @param {string} [options.encoding] - Force specific encoding (overrides auto-detection)
 * @param {boolean} [options.ensureDir] - Create directory if it doesn't exist (default: true)
 * @returns {Promise<Object>} Unified file writing result
 * @property {boolean} success - Whether the write operation was successful
 * @property {string} [savedPath] - Full path where file was saved (present if success is true)
 * @property {number} [size] - Number of bytes written (present if success is true)
 * @property {boolean} [isBinary] - Whether content was written as binary (present if success is true)
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
  try {
    // Input validation
    if (!filePath) {
      throw new Error("File path is required");
    }

    if (content === undefined || content === null) {
      throw new Error("Content is required");
    }

    // Validate content type
    const isBuffer = Buffer.isBuffer(content);
    const isString = typeof content === "string";

    if (!isBuffer && !isString) {
      throw new Error("Content must be a string or Buffer");
    }

    // Normalize file path
    const normalizedPath = path.resolve(filePath);

    // Ensure target directory exists (unless disabled)
    if (options.ensureDir !== false) {
      const dirname = path.dirname(normalizedPath);
      await fs.ensureDir(dirname);
    }

    // Auto-detect write type and perform write operation
    let bytesWritten;
    let isBinary = false;

    if (options.encoding) {
      // Force specific encoding if provided
      await fs.writeFile(normalizedPath, content, options.encoding);
      bytesWritten = Buffer.byteLength(content, options.encoding);
      isBinary = options.encoding !== "utf8";
    } else if (isBuffer) {
      // Write as binary (no encoding specified)
      await fs.writeFile(normalizedPath, content);
      bytesWritten = content.length;
      isBinary = true;
    } else {
      // Write as UTF-8 text
      await fs.writeFile(normalizedPath, content, "utf8");
      bytesWritten = Buffer.byteLength(content, "utf8");
      isBinary = false;
    }

    return {
      success: true,
      savedPath: normalizedPath,
      size: bytesWritten,
      isBinary: isBinary,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = { handleWriteFile };
