// IPC Preview Decryption Handler
// Provides secure in-memory decryption for file preview functionality

// Purpose:
// - Decrypts file content temporarily for preview without disk writes
// - Enforces size limits for memory safety (max 10MB)
// - Handles both text and binary file types
// - Maintains data security through in-memory operations
// - Provides MIME type detection for proper file handling

// Dependencies:
// - fs-extra: Enhanced file system operations for async/await
// - path: File path and extension manipulation
// - @backend/utils/get-mime-type: MIME type detection utility
// - @backend/crypto/in-memory-decrypt: Core decryption functionality
// - @constants/file: File-related constants and limits

// Usage Examples:
// ```
// // Basic file preview decryption
// const result = await handleDecryptFileForPreview(event, '/path/file.txt', 'password123');
// if (result.success) {
//   // Handle decrypted content
//   console.log('Preview content:', result.content);
//   console.log('MIME type:', result.mimeType);
// }
//
// // Binary file handling
// const imageResult = await handleDecryptFileForPreview(event, '/path/image.jpg', 'password123');
// if (imageResult.success && imageResult.isBinary) {
//   // Handle binary content (Buffer)
//   processBinaryPreview(imageResult.content, imageResult.mimeType);
// }
// ```

// Integration Points:
// - IPC System: Registered as handler for 'decrypt-file-for-preview' channel
// - Preview System: Provides decrypted content for UI preview
// - MIME Handler: Integrates with file type detection
// - Memory Manager: Enforces size limits for safe operation

// Process Flow:
// 1. Validate file existence and accessibility
// 2. Check file size against MAX_PREVIEW_FILE_SIZE limit
// 3. Read encrypted file content
// 4. Determine file type and MIME type
// 5. Decrypt content in memory using decryptInMemory
// 6. Return decrypted content with metadata

const fs = require("fs-extra");
const path = require("path");
const getMimeType = require("@backend/utils/get-mime-type");
const { decryptInMemory } = require("@backend/crypto/in-memory-decrypt");
const { BINARY_EXTENSIONS, MAX_PREVIEW_FILE_SIZE } = require("@constants/file");

/**
 * Handles decrypting file content for preview purposes with size validation
 * Provides in-memory decryption without writing to disk
 *
 * @param {Event} _event - IPC event object from renderer process
 * @param {string} filePath - Absolute path to the encrypted file
 * @param {string} password - Decryption password
 * @returns {Promise<Object>} Decryption result
 * @property {boolean} success - Whether decryption was successful
 * @property {string|Buffer} content - Decrypted content (string for text, Buffer for binary)
 * @property {string} mimeType - Detected MIME type of the file
 * @property {boolean} isBinary - Whether the content is binary
 * @property {string} error - Error message if success is false
 *
 * @throws {Error} If file doesn't exist
 * @throws {Error} If file exceeds size limit
 * @throws {Error} If decryption fails
 *
 * @example
 * try {
 *   const result = await handleDecryptFileForPreview(event, '/path/doc.txt', 'pass123');
 *   if (result.success) {
 *     processPreview(result.content, result.mimeType);
 *   } else {
 *     handleError(result.error);
 *   }
 * } catch (error) {
 *   handleError(error.message);
 * }
 */
async function handleDecryptFileForPreview(_event, filePath, password) {
  try {
    // Check if file exists
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    // Check file size
    const stats = await fs.stat(filePath);
    if (stats.size > MAX_PREVIEW_FILE_SIZE) {
      throw new Error(
        "File too large for preview (max 10MB). Please decrypt the file on disk first.",
      );
    }

    // Read the encrypted file
    const encryptedContent = await fs.readFile(filePath, "utf8");

    // Get file extension and MIME type
    const fileExt = path.extname(filePath).toLowerCase();
    const mimeType = getMimeType(fileExt);
    const isBinaryFile = BINARY_EXTENSIONS.includes(fileExt);

    // Use core decryption function
    return await decryptInMemory(encryptedContent, password, {
      isBinaryFile,
      mimeType,
    });
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = { handleDecryptFileForPreview };
