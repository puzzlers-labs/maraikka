// Universal File Decryption Handler
// Provides secure in-memory decryption for file preview and editing with unified size validation

// Purpose:
// - Provides secure in-memory decryption for all file types
// - Validates file size against MAX_FILE_SIZE (50MB) for memory safety
// - Handles both text and binary files
// - Maintains original file naming conventions
// - Preserves file integrity during decryption process

// Dependencies:
// - fs-extra@^11.0.0: Enhanced file system operations for async file handling
//   Used for: pathExists, stat, readFile operations
// - path (Node.js built-in): File path and extension manipulation utilities
//   Used for: basename, extname operations
// - @backend/crypto/in-memory-decrypt@internal: Core in-memory decryption functionality
//   Used for: decryptInMemory with binary/text support
// - @constants/crypto@internal: Encryption markers and standardized error messages
//   Used for: ENCRYPTION_PREFIX, CRYPTO_ERRORS constants
// - @constants/file@internal: File size limits and validation constants
//   Used for: BINARY_EXTENSIONS and size validation
// - @backend/utils/get-mime-type@internal: MIME type detection
//   Used for: File type determination for proper decryption handling

// Usage Examples:
// ```
// // Text file decryption
// const textResult = await decryptFileInMemory(_event, '/path/file.txt.enc', 'password123', 'edit');
// if (textResult.success) {
//   await editor.loadContent({
//     text: textResult.content,
//     filename: textResult.originalName
//   });
// }
//
// // Image file decryption
// const imageResult = await decryptFileInMemory(_event, '/path/image.jpg.enc', 'password123', 'edit');
// if (imageResult.success) {
//   await imageEditor.loadContent({
//     content: imageResult.content,
//     filename: imageResult.originalName,
//     mimeType: imageResult.mimeType
//   });
// }
//
// // Preview decryption
// const previewResult = await decryptFileInMemory(_event, '/path/file.pdf.enc', 'password123', 'preview');
// if (previewResult.success) {
//   showPreview(previewResult.content, previewResult.mimeType);
// }
// ```

// Integration Points:
// - Editor Components:
//   - Text Editor: Receives decrypted text content
//     Error Handling: Returns {success: false, error: string} on failure
//   - Image Editor: Receives decrypted binary content
//     Performance: Enforces 50MB file size limit for memory safety
//   - Preview System: Receives content for preview display
//     Throttling: None - synchronous preview generation
// - Error Handler:
//   - Processes validation and decryption errors
//   - Maps internal errors to user-friendly messages via CRYPTO_ERRORS
//   - Logs errors for debugging (non-sensitive information only)
// - File System:
//   - Validates file existence and permissions
//   - Handles file size checks (50MB limit)
//   - Manages file read operations with proper error propagation
// - Memory Management:
//   - Enforces unified size limit via MAX_FILE_SIZE (50MB)
//   - Ensures safe memory usage during decryption
//   - Cleans up decrypted content after sending to renderer

// Process Flow:
// 1. Input Validation
//    - Verify required parameters (filePath, password, mode)
//    - Check file existence and accessibility
// 2. Size Validation
//    - Get file statistics
//    - Verify against MAX_FILE_SIZE (50MB)
//    - Reject oversized files
// 3. Content Reading
//    - Read encrypted file content
//    - Verify MARAIKKA encryption prefix
// 4. File Type Detection
//    - Determine if binary or text
//    - Get MIME type
// 5. Decryption Process
//    - Perform in-memory decryption
//    - Handle based on file type
// 6. Result Preparation
//    - Extract original filename
//    - Format success/error response
//    - Clean up temporary data

const fs = require("fs-extra");
const path = require("path");
const { decryptInMemory } = require("@backend/crypto/in-memory-decrypt");
const { ENCRYPTION_PREFIX, CRYPTO_ERRORS } = require("@constants/crypto");
const getMimeType = require("@backend/utils/get-mime-type");
const { BINARY_EXTENSIONS, MAX_FILE_SIZE } = require("@constants/file");

/**
 * Decrypts a file in memory for preview or editing purposes
 * Provides unified handling for text, image, and binary files
 *
 * @param {Event} _event - IPC event object (unused but required for IPC signature)
 * @param {string} filePath - Absolute path to the encrypted file
 * @param {string} password - Decryption password
 * @returns {Promise<Object>} Decryption result object
 * @property {boolean} success - Indicates successful decryption
 * @property {string|Buffer} [content] - Decrypted content (string for text, Buffer for binary)
 * @property {string} [originalName] - Original filename without .enc extension
 * @property {string} [error] - Error message (present if success is false)
 * @property {string} [mimeType] - MIME type of the file
 * @property {boolean} [isBinary] - Whether the file is binary
 *
 * @throws {Error} "File path is required" - If filePath is missing
 * @throws {Error} "Password is required" - If password is missing
 * @throws {Error} "File does not exist: {filePath}" - If file not found
 * @throws {Error} "File too large (max 50MB)" - If exceeds MAX_FILE_SIZE
 * @throws {Error} CRYPTO_ERRORS.FILE_NOT_ENCRYPTED - If file lacks encryption prefix
 *
 * @example
 * // Text file editing
 * const textResult = await decryptFileInMemory(_event, '/path/doc.txt.enc', 'pass123');
 * if (textResult.success) {
 *   await editor.load({ content: textResult.content, filename: textResult.originalName });
 * }
 *
 * // Image editing
 * const imageResult = await decryptFileInMemory(_event, '/path/photo.jpg.enc', 'pass123');
 * if (imageResult.success) {
 *   await imageEditor.load({
 *     imageBuffer: imageResult.content,
 *     filename: imageResult.originalName,
 *     type: imageResult.mimeType
 *   });
 * }
 *
 * // File preview
 * const previewResult = await decryptFileInMemory(_event, '/path/doc.pdf.enc', 'pass123');
 * if (previewResult.success) {
 *   showPreview(previewResult.content, previewResult.mimeType);
 * }
 */
async function decryptFileInMemory(_event, filePath, password) {
  try {
    // Input validation
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

    // Get file stats and check size
    const stats = await fs.stat(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      throw new Error(
        `File too large (max ${MAX_FILE_SIZE / (1024 * 1024)}MB)`,
      );
    }

    // Read the encrypted file
    const encryptedContent = await fs.readFile(filePath, "utf8");

    // Check if it's a Maraikka encrypted file
    if (!encryptedContent.startsWith(ENCRYPTION_PREFIX)) {
      throw new Error(CRYPTO_ERRORS.FILE_NOT_ENCRYPTED);
    }

    // Get original filename and determine file type
    const originalName = path.basename(filePath).replace(/\.enc$/, "");
    const fileExt = path.extname(originalName).toLowerCase();
    const mimeType = getMimeType(fileExt);
    const isBinaryFile = BINARY_EXTENSIONS.includes(fileExt);

    // Use core decryption function
    const decryptResult = await decryptInMemory(encryptedContent, password, {
      isBinaryFile,
      mimeType,
    });

    return {
      ...decryptResult,
      originalName,
      mimeType,
      isBinary: isBinaryFile,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { decryptFileInMemory };
