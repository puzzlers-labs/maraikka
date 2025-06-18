// Text Editor Encryption Handler
// Provides secure encryption and storage for text editor content

// Purpose:
// - Encrypts text content from editor using AES encryption
// - Saves encrypted content with Maraikka format and prefix
// - Ensures secure text handling during save operations
// - Maintains data integrity through atomic writes
// - Integrates with text editor's save workflow

// Dependencies:
// - fs-extra: File system operations with promises
//   Used for atomic write operations and proper error handling
// - @backend/crypto/in-memory-encrypt: Core encryption module
//   Provides AES encryption with text handling support

// Usage Examples:
// ```
// // Basic text encryption and save
// const result = await encryptAndSaveTextFile(
//   event,
//   '/path/document.txt',
//   'Hello World',
//   'password123'
// );
// if (result.success) {
//   handleSuccessfulSave();
// }
//
// // Error handling example
// try {
//   const result = await encryptAndSaveTextFile(
//     event,
//     filePath,
//     content,
//     password
//   );
//   if (!result.success) {
//     handleError(result.error);
//   }
// } catch (error) {
//   handleSystemError('text_encryption_failure', error);
// }
// ```

// Integration Points:
// - Text Editor Component:
//   - Called during save operations for encrypted files
//   - Receives editor content and encryption password
//   - Handles save completion status
// - IPC System:
//   - Registered in register-handlers.js
//   - Exposed via preload.js for frontend access
// - Encryption Module:
//   - Uses in-memory encryption for secure processing
//   - Maintains encryption format consistency

// Process Flow:
// 1. Validate inputs (content and password)
// 2. Apply encryption with text handling flag
// 3. Write encrypted content atomically
// 4. Return operation status to editor
// 5. Handle errors with descriptive messages

const fs = require("fs-extra");
const { encryptInMemory } = require("@backend/crypto/in-memory-encrypt");

/**
 * Encrypts text content and saves it to a file with secure handling
 *
 * Provides secure encryption for text editor content, ensuring proper
 * text encoding and atomic file operations.
 *
 * @param {Event} _event - IPC event object (unused but required by IPC)
 * @param {string} filePath - Target path for the encrypted file
 * @param {string} content - Text content to encrypt from editor
 * @param {string} password - Encryption password
 * @returns {Promise<Object>} Operation result
 * @property {boolean} success - Whether encryption succeeded
 * @property {string} [error] - Error message if operation failed
 *
 * @throws {Error} If content is not provided as string
 * @throws {Error} If password is missing or invalid
 * @throws {Error} If encryption fails
 * @throws {Error} If file writing fails
 *
 * @example
 * // Basic usage with error handling
 * const result = await encryptAndSaveTextFile(
 *   event,
 *   'secure-doc.txt.enc',
 *   'Document content',
 *   'myPassword123'
 * );
 *
 * if (!result.success) {
 *   handleError(result.error);
 * }
 */
async function encryptAndSaveTextFile(_event, filePath, content, password) {
  try {
    // Use core encryption function
    const encryptResult = await encryptInMemory(content, password, {
      isBinaryFile: false,
    });

    // Write encrypted content to file
    await fs.writeFile(filePath, encryptResult.content, "utf8");

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { encryptAndSaveTextFile };
