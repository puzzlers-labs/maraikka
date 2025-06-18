// Module Name: Directory Encryption Module
// Provides secure batch encryption functionality for entire directory structures

// Purpose:
// - Primary function: Recursively encrypt all files in a directory structure
// - Key features: Directory traversal, encryption state tracking, duplicate prevention
// - Important behaviors: Preserves directory structure, skips already encrypted files
// - Quality considerations: Maintains encryption consistency and security standards

// Dependencies:
// - fs-extra: Enhanced file system operations for directory validation (path existence, stats)
// - @backend/file-manager/get-directory-contents: Header-aware directory lister (provides isEncrypted flag)
// - encrypt-file: Individual file encryption utility that delegates header prep to write-file

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
// 2. Recursively traverse directory structure using `getDirectoryContents` (header-only reads)
// 3. For each entry returned:
//    a. Recurse into sub-directories.
//    b. Encrypt files where `isEncrypted` is **false** via `encryptFile`.
//    c. Track success / failure statistics.
// 4. Return comprehensive result object with statistics

const fs = require("fs-extra");
const { encryptFile } = require("@backend/crypto/encrypt-file");
const {
  getDirectoryContents,
} = require("@backend/file-manager/get-directory-contents");

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
 * @property {number} statistics.skippedCount - Number of files that were skipped
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
    let skippedCount = 0;
    const errors = [];

    // Recursively process all files/directories leveraging getDirectoryContents
    async function processDirectory(currentPath) {
      let entries;
      try {
        entries = await getDirectoryContents(currentPath);
      } catch (err) {
        failedCount++;
        errors.push(`${currentPath}: ${err.message}`);
        return;
      }

      for (const entry of entries) {
        if (entry.isDirectory) {
          await processDirectory(entry.path);
          continue;
        }

        // Skip files that are already encrypted
        if (entry.isEncrypted) {
          skippedCount++;
          continue;
        }

        const result = await encryptFile(entry.path, password);
        if (result.success) {
          encryptedCount++;
        } else {
          failedCount++;
          errors.push(`${entry.path}: ${result.error}`);
        }
      }
    }

    await processDirectory(dirPath);

    return {
      success: true,
      message: `Directory encrypted: ${encryptedCount} files processed`,
      statistics: { encryptedCount, failedCount, skippedCount, errors },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Directory encryption failed",
    };
  }
}

module.exports = { encryptDirectory };
