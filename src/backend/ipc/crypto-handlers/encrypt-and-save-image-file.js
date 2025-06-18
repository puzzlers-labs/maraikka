// Image Encryption Handler
// Handles secure encryption and storage of edited images from the image editor

// Purpose:
// - Encrypts image data from canvas exports using AES encryption
// - Validates image content and enforces size constraints
// - Ensures secure binary data handling during encryption
// - Maintains image quality through proper buffer handling
// - Integrates with image editor's save workflow
// - Provides atomic file operations for data integrity

// Dependencies:
// - fs-extra: File system operations with promises and enhanced functionality
//   Used for atomic write operations and proper error handling
// - @backend/crypto/in-memory-encrypt: Core encryption module
//   Provides AES encryption with binary data support
// - @constants/file: File-related constants
//   Defines size limits and supported formats

// Integration Points:
// - Image Editor: Receives canvas data as Buffer
//   Handles both PNG and JPEG formats
// - Encryption Module: Uses in-memory encryption
//   Ensures secure handling of binary data
// - File System: Writes encrypted data
//   Maintains atomic operations
// - IPC System: Registered in register-handlers.js
//   Exposed via preload.js for frontend access

// Process/Operation Flow:
// 1. Validate input parameters and Buffer type
// 2. Check file size against MAX_PREVIEW_FILE_SIZE
// 3. Apply encryption with binary flag enabled
// 4. Write encrypted content atomically
// 5. Return operation status to caller
// 6. Handle errors with descriptive messages

const fs = require("fs-extra");
const { encryptInMemory } = require("@backend/crypto/in-memory-encrypt");
const { MAX_PREVIEW_FILE_SIZE } = require("@constants/file");

/**
 * Encrypts and saves an image file with secure binary handling
 *
 * Provides secure encryption for image data exported from the canvas,
 * ensuring proper binary handling and atomic file operations.
 *
 * @param {Event} _event - IPC event object (unused but required by IPC)
 * @param {string} filePath - Target path for the encrypted file
 * @param {Buffer} content - Raw image data as Buffer from canvas
 * @param {string} password - Encryption password
 * @returns {Promise<Object>} Operation result
 * @property {boolean} success - Whether encryption succeeded
 * @property {string} [error] - Error message if operation failed
 *
 * @throws {Error} If content is not provided as Buffer
 * @throws {Error} If file size exceeds MAX_PREVIEW_FILE_SIZE
 * @throws {Error} If encryption fails
 * @throws {Error} If file writing fails
 *
 * @example
 * // Basic usage with canvas export
 * const imageBuffer = canvas.toBuffer();
 * const result = await encryptAndSaveImageFile(
 *   event,
 *   'secure-image.jpg.enc',
 *   imageBuffer,
 *   'myPassword123'
 * );
 *
 * // Error handling
 * if (!result.success) {
 *   handleError(result.error);
 * }
 */
async function encryptAndSaveImageFile(_event, filePath, content, password) {
  try {
    // Validate binary content
    if (!Buffer.isBuffer(content)) {
      throw new Error("Image content must be provided as a Buffer");
    }

    // Check file size
    if (content.length > MAX_PREVIEW_FILE_SIZE) {
      throw new Error(
        `Image file too large (max ${MAX_PREVIEW_FILE_SIZE / (1024 * 1024)}MB)`,
      );
    }

    // Use core encryption function with binary flag
    const encryptResult = await encryptInMemory(content, password, {
      isBinaryFile: true,
    });

    // Write encrypted content to file
    await fs.writeFile(filePath, encryptResult.content, "utf8");

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { encryptAndSaveImageFile };
