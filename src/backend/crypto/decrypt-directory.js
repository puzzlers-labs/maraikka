// Directory Decryption Module
// Handles recursive decryption of files within directories
//
// Purpose:
// - Provides batch decryption functionality for entire directories
// - Recursively processes encrypted files while preserving structure
// - Validates file encryption status using MARAIKKA_ENCRYPTED prefix
// - Maintains detailed statistics and error tracking during process
// - Ensures secure and consistent decryption across file types
//
// Dependencies:
// - fs-extra: Enhanced file system operations for recursive handling
// - path: File path manipulation and directory traversal
// - decrypt-file: Individual file decryption functionality
//
// Usage Examples:
// ```
// // Basic directory decryption
// const result = await decryptDirectory('/path/to/dir', 'password123');
// if (result.success) {
//   console.log(`Decrypted ${result.statistics.decryptedCount} files`);
// }
//
// // Error handling with statistics
// try {
//   const result = await decryptDirectory(dirPath, password);
//   if (result.statistics.failedCount > 0) {
//     console.log('Some files failed:', result.statistics.errors);
//   }
// } catch (error) {
//   console.error('Decryption failed:', error.message);
// }
// ```
//
// Integration Points:
// - IPC System: Called by decrypt-directory for renderer requests
// - Frontend: Integrated with UI progress tracking and notifications
// - Batch Operations: Used by directory-level encryption workflows
// - File System: Interacts with fs-extra for file operations
//
// Decryption Flow:
// 1. Validate directory path and password inputs
// 2. Recursively traverse directory structure
// 3. For each file:
//    - Check for MARAIKKA_ENCRYPTED prefix
//    - Decrypt if encrypted using decrypt-file
//    - Track success/failure statistics
// 4. Return comprehensive result object with statistics

const fs = require("fs-extra");
const path = require("path");
const { decryptFile } = require("@backend/crypto/decrypt-file");
const { ENCRYPTION_PREFIX } = require("@constants/crypto");

/**
 * Recursively decrypts all encrypted files in a directory
 * Processes only files with MARAIKKA_ENCRYPTED prefix
 *
 * @param {string} dirPath - Path to directory containing encrypted files
 * @param {string} password - Decryption password
 * @returns {Promise<Object>} Decryption result object
 * @property {boolean} success - Whether the operation was successful
 * @property {string} message - Human-readable status message
 * @property {Object} statistics - Detailed operation statistics
 * @property {number} statistics.decryptedCount - Number of successfully decrypted files
 * @property {number} statistics.failedCount - Number of files that failed to decrypt
 * @property {Array<string>} statistics.errors - List of error messages with file paths
 *
 * @example
 * // Decrypt directory with error handling
 * try {
 *   const result = await decryptDirectory('/encrypted/files', 'userPassword');
 *   if (result.success) {
 *     // Handle successful decryption
 *     const { decryptedCount, failedCount } = result.statistics;
 *   } else {
 *     // Handle decryption failure
 *     console.error(result.error);
 *   }
 * } catch (error) {
 *   // Handle unexpected errors
 *   console.error('Decryption failed:', error);
 * }
 */
async function decryptDirectory(dirPath, password) {
  try {
    // Validate input parameters
    if (!dirPath || !password) {
      throw new Error("Directory path and password are required");
    }

    // Check if directory exists
    if (!(await fs.pathExists(dirPath))) {
      throw new Error("Directory does not exist");
    }

    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) {
      throw new Error("Path is not a directory");
    }

    let decryptedCount = 0;
    let failedCount = 0;
    const errors = [];

    // Recursively process all encrypted files in directory
    async function processDirectory(currentPath) {
      const items = await fs.readdir(currentPath);

      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const itemStats = await fs.stat(itemPath);

        if (itemStats.isDirectory()) {
          // Recursively process subdirectory
          await processDirectory(itemPath);
        } else if (itemStats.isFile()) {
          // Check if file is encrypted by reading first part of file
          try {
            const fileContent = await fs.readFile(itemPath, "utf8");
            if (fileContent.startsWith(ENCRYPTION_PREFIX)) {
              // Decrypt encrypted file
              const result = await decryptFile(itemPath, password);
              if (result.success) {
                decryptedCount++;
              } else {
                failedCount++;
                errors.push(`${itemPath}: ${result.error}`);
              }
            }
          } catch (error) {
            // Skip binary or unreadable files silently
            continue;
          }
        }
      }
    }

    await processDirectory(dirPath);

    return {
      success: true,
      message: `Directory decrypted: ${decryptedCount} files processed`,
      statistics: { decryptedCount, failedCount, errors },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Directory decryption failed",
    };
  }
}

module.exports = { decryptDirectory };
