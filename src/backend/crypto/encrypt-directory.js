// Module Name: Directory Encryption Module
// Provides secure batch encryption functionality for entire directory structures

// Purpose:
// - Primary function: Recursively encrypt all files in a directory structure
// - Key features: Directory traversal, encryption state tracking, duplicate prevention
// - Important behaviors: Preserves directory structure, skips already encrypted files
// - Quality considerations: Maintains encryption consistency and security standards

// Dependencies:
// - fs-extra: Enhanced file system operations for recursive directory handling
// - path: File path manipulation and directory traversal utilities
// - encrypt-file: Individual file encryption functionality with MARAIKKA_ENCRYPTED prefix

// Usage Examples:
// ```
// // Basic directory encryption
// const result = await encryptDirectory('/path/to/dir', 'password123');
// if (result.success) {
//   handleSuccess(result.statistics);
// }
//
// // Error handling with statistics
// try {
//   const result = await encryptDirectory(dirPath, password);
//   if (result.statistics.failedCount > 0) {
//     handleErrors(result.statistics.errors);
//   }
// } catch (error) {
//   handleError(error.message);
// }
// ```

// Integration Points:
// - IPC System: Called by encrypt-directory-handler for renderer requests
// - Frontend: Integrated with UI progress tracking and notifications
// - Batch Operations: Used by directory-level encryption workflows
// - File System: Interacts with fs-extra for file operations

// Process/Operation Flow:
// 1. Validate directory path and password inputs
// 2. Recursively traverse directory structure
// 3. For each file:
//    - Check for MARAIKKA_ENCRYPTED prefix
//    - Encrypt if not already encrypted
//    - Track success/failure statistics
// 4. Return comprehensive result object with statistics

const fs = require("fs-extra");
const path = require("path");
const encryptFile = require("@backend/crypto/encrypt-file");
const { ENCRYPTION_PREFIX } = require("@constants/crypto");

/**
 * Recursively encrypts all files in a directory structure
 * @param {string} dirPath - Path to directory to encrypt
 * @param {string} password - Encryption password
 * @returns {Promise<Object>} Encryption result with success status and statistics
 * @property {boolean} success - Whether the operation was successful
 * @property {string} message - Success or error message
 * @property {Object} statistics - Encryption statistics
 * @property {number} statistics.encryptedCount - Number of files encrypted
 * @property {number} statistics.failedCount - Number of files that failed
 * @property {Array<string>} statistics.errors - List of encryption errors
 */
async function encryptDirectory(dirPath, password) {
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

    let encryptedCount = 0;
    let failedCount = 0;
    const errors = [];

    // Recursively process all files in directory
    async function processDirectory(currentPath) {
      const items = await fs.readdir(currentPath);

      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const itemStats = await fs.stat(itemPath);

        if (itemStats.isDirectory()) {
          // Recursively process subdirectory
          await processDirectory(itemPath);
        } else if (itemStats.isFile()) {
          // Check if file is already encrypted
          let isAlreadyEncrypted = false;
          try {
            const fileContent = await fs.readFile(itemPath, "utf8");
            isAlreadyEncrypted = fileContent.startsWith(ENCRYPTION_PREFIX);
          } catch (error) {
            // If we can't read as text, assume it's not encrypted and try to encrypt
            isAlreadyEncrypted = false;
          }

          if (!isAlreadyEncrypted) {
            // Encrypt file if not already encrypted
            const result = await encryptFile(itemPath, password);
            if (result.success) {
              encryptedCount++;
            } else {
              failedCount++;
              errors.push(`${itemPath}: ${result.error}`);
            }
          }
        }
      }
    }

    await processDirectory(dirPath);

    return {
      success: true,
      message: `Directory encrypted: ${encryptedCount} files processed`,
      statistics: { encryptedCount, failedCount, errors },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Directory encryption failed",
    };
  }
}

module.exports = encryptDirectory;
