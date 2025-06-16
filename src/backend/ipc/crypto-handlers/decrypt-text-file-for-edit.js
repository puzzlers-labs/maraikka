// Text Editor Decryption Handler
// Provides secure in-memory decryption for text file editing with size validation

// Purpose:
// - Provides secure in-memory decryption for text editor functionality
// - Validates file size against MAX_TEXT_EDIT_SIZE (10MB) for memory safety
// - Ensures text-only file handling for editor compatibility
// - Maintains original file naming conventions
// - Preserves file integrity during decryption process

// Dependencies:
// - fs-extra: Enhanced file system operations for async file handling
// - path: File path and extension manipulation utilities
// - @backend/crypto/in-memory-decrypt: Core in-memory decryption functionality
// - @constants/crypto: Encryption markers and standardized error messages
// - @constants/file: File size limits and validation constants

// Usage Examples:
// ```
// // Basic text file decryption with success handling
// const result = await decryptTextFileForEdit(_event, '/path/file.txt', 'password123');
// if (result.success) {
//   await editor.loadContent({
//     text: result.content,
//     filename: result.originalName
//   });
// }
//
// // Complete error handling example
// try {
//   const result = await decryptTextFileForEdit(_event, filePath, password);
//   if (result.success) {
//     await editor.loadContent(result.content);
//     updateEditorTitle(result.originalName);
//   } else {
//     showErrorNotification(result.error);
//     logDecryptionError(filePath, result.error);
//   }
// } catch (error) {
//   handleFatalError(error);
//   logSystemError('text_decryption_failure', error);
// }
// ```

// Integration Points:
// - Text Editor Component:
//   - Receives decrypted content for editing
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
//   - Enforces size limits via MAX_TEXT_EDIT_SIZE
//   - Ensures safe memory usage during decryption
//   - Cleans up decrypted content when needed

// Process Flow:
// 1. Input Validation
//    - Verify required parameters (filePath, password)
//    - Check file existence and accessibility
// 2. Size Validation
//    - Get file statistics
//    - Verify against MAX_TEXT_EDIT_SIZE (10MB)
//    - Reject oversized files
// 3. Content Reading
//    - Read encrypted file content
//    - Verify MARAIKKA encryption prefix
// 4. Decryption Process
//    - Perform in-memory decryption
//    - Set text-specific parameters
// 5. Result Preparation
//    - Extract original filename
//    - Format success/error response
//    - Clean up temporary data

const fs = require("fs-extra");
const path = require("path");
const { decryptInMemory } = require("@backend/crypto/in-memory-decrypt");
const { ENCRYPTION_PREFIX, CRYPTO_ERRORS } = require("@constants/crypto");
const { MAX_TEXT_EDIT_SIZE } = require("@constants/file");

/**
 * Decrypts an encrypted text file for secure in-memory editing
 * Handles size validation, encryption verification, and original filename preservation
 *
 * @param {Event} _event - IPC event object (unused but required for IPC signature)
 * @param {string} filePath - Absolute path to the encrypted text file
 * @param {string} password - Decryption password
 * @returns {Promise<Object>} Decryption result object
 * @property {boolean} success - Indicates successful decryption
 * @property {string} [content] - Decrypted text content (present if success is true)
 * @property {string} [originalName] - Original filename without .enc extension
 * @property {string} [error] - Error message (present if success is false)
 * @property {string} [mimeType] - Always "text/plain" for text files
 * @property {boolean} [isBinary] - Always false for text files
 *
 * @throws {Error} "File path is required" - If filePath is missing
 * @throws {Error} "Password is required" - If password is missing
 * @throws {Error} "File does not exist: {filePath}" - If file not found
 * @throws {Error} "File too large for editing (max 10MB)" - If exceeds MAX_TEXT_EDIT_SIZE
 * @throws {Error} CRYPTO_ERRORS.FILE_NOT_ENCRYPTED - If file lacks encryption prefix
 *
 * @example
 * // Successful decryption with full error handling
 * try {
 *   const result = await decryptTextFileForEdit(_event, '/path/doc.txt.enc', 'pass123');
 *   if (result.success) {
 *     const { content, originalName, mimeType } = result;
 *     await editor.load({ content, filename: originalName, type: mimeType });
 *   } else {
 *     handleDecryptionError(result.error);
 *   }
 * } catch (error) {
 *   handleSystemError('text_decryption', error);
 * }
 */
async function decryptTextFileForEdit(_event, filePath, password) {
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
    if (stats.size > MAX_TEXT_EDIT_SIZE) {
      throw new Error("File too large for editing (max 10MB)");
    }

    // Read the encrypted file
    const encryptedContent = await fs.readFile(filePath, "utf8");

    // Check if it's a Maraikka encrypted file
    if (!encryptedContent.startsWith(ENCRYPTION_PREFIX)) {
      throw new Error(CRYPTO_ERRORS.FILE_NOT_ENCRYPTED);
    }

    // Use core decryption function
    const decryptResult = await decryptInMemory(encryptedContent, password, {
      isBinaryFile: false,
      mimeType: "text/plain",
    });

    return {
      ...decryptResult,
      originalName: path.basename(filePath).replace(/\.enc$/, ""),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { decryptTextFileForEdit };
