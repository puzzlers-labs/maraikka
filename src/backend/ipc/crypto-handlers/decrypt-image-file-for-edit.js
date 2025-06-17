// Image Editor Decryption Handler
// Provides secure in-memory decryption for image file editing with size validation

// Purpose:
// - Provides secure in-memory decryption for image editor functionality
// - Validates file size against MAX_IMAGE_EDIT_SIZE (50MB) for memory safety
// - Ensures binary file handling for image editor compatibility
// - Maintains original file naming conventions
// - Preserves file integrity during decryption process

// Dependencies:
// - fs-extra: Enhanced file system operations for async file handling
// - path: File path and extension manipulation utilities
// - @backend/crypto/in-memory-decrypt: Core in-memory decryption functionality
// - @constants/crypto: Encryption markers and standardized error messages
// - @constants/file: File size limits and validation constants
// - @backend/utils/get-mime-type: MIME type detection for image files

// Usage Examples:
// ```
// // Basic image file decryption with success handling
// const result = await decryptImageFileForEdit(_event, '/path/image.jpg.enc', 'password123');
// if (result.success) {
//   await imageEditor.loadContent({
//     content: result.content, // Buffer data
//     filename: result.originalName,
//     mimeType: result.mimeType
//   });
// }
//
// // Complete error handling example
// try {
//   const result = await decryptImageFileForEdit(_event, filePath, password);
//   if (result.success) {
//     await imageEditor.loadImageBuffer(result.content);
//     updateEditorTitle(result.originalName);
//     setImageFormat(result.mimeType);
//   } else {
//     showErrorNotification(result.error);
//     logDecryptionError(filePath, result.error);
//   }
// } catch (error) {
//   handleFatalError(error);
//   logSystemError('image_decryption_failure', error);
// }
// ```

// Integration Points:
// - Image Editor Component:
//   - Receives decrypted binary content for editing
//   - Uses originalName for display and save operations
//   - Handles content loading states
// - Error Handler:
//   - Processes both validation and decryption errors
//   - Provides user-friendly error messages
//   - Logs errors for debugging
// - File System:
//   - Validates file existence and permissions
//   - Handles file size checks
//   - Manages file read operations
// - Memory Management:
//   - Enforces size limits via MAX_IMAGE_EDIT_SIZE
//   - Ensures safe memory usage during decryption
//   - Cleans up decrypted content when needed

// Process Flow:
// 1. Input Validation
//    - Verify required parameters (filePath, password)
//    - Check file existence and accessibility
// 2. Size Validation
//    - Get file statistics
//    - Verify against MAX_IMAGE_EDIT_SIZE (50MB)
//    - Reject oversized files
// 3. Content Reading
//    - Read encrypted file content
//    - Verify MARAIKKA encryption prefix
// 4. Decryption Process
//    - Perform in-memory decryption
//    - Set binary-specific parameters
// 5. Result Preparation
//    - Extract original filename and MIME type
//    - Format success/error response
//    - Clean up temporary data

const fs = require("fs-extra");
const path = require("path");
const { decryptInMemory } = require("@backend/crypto/in-memory-decrypt");
const { ENCRYPTION_PREFIX, CRYPTO_ERRORS } = require("@constants/crypto");
const getMimeType = require("@backend/utils/get-mime-type");

// 50MB limit for image editing
const MAX_IMAGE_EDIT_SIZE = 50 * 1024 * 1024;

/**
 * Decrypts an encrypted image file for secure in-memory editing
 * Handles size validation, encryption verification, and original filename preservation
 *
 * @param {Event} _event - IPC event object (unused but required for IPC signature)
 * @param {string} filePath - Absolute path to the encrypted image file
 * @param {string} password - Decryption password
 * @returns {Promise<Object>} Decryption result object
 * @property {boolean} success - Indicates successful decryption
 * @property {Buffer} [content] - Decrypted binary content (present if success is true)
 * @property {string} [originalName] - Original filename without .enc extension
 * @property {string} [error] - Error message (present if success is false)
 * @property {string} [mimeType] - MIME type of the original image file
 * @property {boolean} [isBinary] - Always true for image files
 *
 * @throws {Error} "File path is required" - If filePath is missing
 * @throws {Error} "Password is required" - If password is missing
 * @throws {Error} "File does not exist: {filePath}" - If file not found
 * @throws {Error} "File too large for editing (max 50MB)" - If exceeds MAX_IMAGE_EDIT_SIZE
 * @throws {Error} CRYPTO_ERRORS.FILE_NOT_ENCRYPTED - If file lacks encryption prefix
 *
 * @example
 * // Successful decryption with full error handling
 * try {
 *   const result = await decryptImageFileForEdit(_event, '/path/photo.jpg.enc', 'pass123');
 *   if (result.success) {
 *     const { content, originalName, mimeType } = result;
 *     await imageEditor.load({
 *       imageBuffer: content,
 *       filename: originalName,
 *       type: mimeType
 *     });
 *   } else {
 *     handleDecryptionError(result.error);
 *   }
 * } catch (error) {
 *   handleSystemError('image_decryption', error);
 * }
 */
async function decryptImageFileForEdit(_event, filePath, password) {
  try {
    if (!filePath) {
      throw new Error("File path is required");
    }

    if (!password) {
      throw new Error("Password is required");
    }

    // Check if file exists
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    const stats = await fs.stat(filePath);
    if (stats.size > MAX_IMAGE_EDIT_SIZE) {
      throw new Error("File too large for editing (max 50MB)");
    }

    // Read the encrypted file
    const encryptedContent = await fs.readFile(filePath, "utf8");

    // Check if it's a Maraikka encrypted file
    if (!encryptedContent.startsWith(ENCRYPTION_PREFIX)) {
      throw new Error(CRYPTO_ERRORS.FILE_NOT_ENCRYPTED);
    }

    // Get original filename and MIME type
    const originalName = path.basename(filePath).replace(/\.enc$/, "");
    const mimeType = getMimeType(path.extname(originalName));

    // Use core decryption function with binary file parameters
    const decryptResult = await decryptInMemory(encryptedContent, password, {
      isBinaryFile: true,
      mimeType: mimeType,
    });

    return {
      ...decryptResult,
      originalName: originalName,
      mimeType: mimeType,
      isBinary: true,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = decryptImageFileForEdit;
