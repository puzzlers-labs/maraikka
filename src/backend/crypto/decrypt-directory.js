// Directory Decryption Module
// Handles recursive decryption of files within directories
//
// Purpose:
// - Primary function: Recursively decrypt all encrypted files in a directory structure
// - Key features: Directory traversal, encryption state detection, accurate statistics collection
// - Important behaviors: Preserves directory layout, skips non-encrypted files, aggregates errors
// - Quality considerations: Leverages header-aware directory listing to minimise I/O and ensure
//   consistent encryption detection.

// Dependencies:
// - fs-extra: Enhanced file system operations for directory validation (path existence, stats)
// - @backend/file-manager/get-directory-contents: Header-aware directory lister (provides isEncrypted flag)
// - decrypt-file: Individual file decryption utility that writes plaintext back to disk

// Usage Examples:
// ```javascript
// // Basic directory decryption
// const { decryptDirectory } = require('@backend/crypto/decrypt-directory');
// const result = await decryptDirectory('/path/to/secret', 'password123');
// if (result.success) {
//   console.log(`Decrypted ${result.statistics.decryptedCount} files`);
// }
//
// // Error handling with statistics
// try {
//   const result = await decryptDirectory(dirPath, password);
//   if (result.statistics.failedCount > 0) {
//     console.warn('Some files failed:', result.statistics.errors);
//   }
// } catch (error) {
//   console.error('Decryption failed:', error.message);
// }
// ```

// Integration Points:
// - IPC System: Called by decrypt-directory-handler for renderer requests
// - Frontend: Integrated with UI progress tracking and notifications
// - Batch Operations: Used by directory-level encryption workflows
// - File System: Interacts with fs-extra for validation and traversal

// Process/Operation Flow:
// 1. Validate directory path and password inputs
// 2. Recursively traverse directory structure using `getDirectoryContents` (header-only reads)
// 3. For each entry returned:
//    a. Recurse into sub-directories.
//    b. Decrypt files where `isEncrypted` is **true** via `decryptFile`.
//    c. Skip non-encrypted files.
//    d. Track success / failure / skipped statistics.
// 4. Return comprehensive result object with statistics

const fs = require("fs-extra");
const { decryptFile } = require("@backend/crypto/decrypt-file");
const {
  getDirectoryContents,
} = require("@backend/file-manager/get-directory-contents");

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
 * @property {number} statistics.skippedCount - Number of files that were skipped
 * @property {Array<string>} statistics.errors - List of error messages with file paths
 *
 * @example
 * // Decrypt directory with error handling
 * try {
 *   const result = await decryptDirectory('/encrypted/files', 'userPassword');
 *   if (result.success) {
 *     // Handle successful decryption
 *     const { decryptedCount, failedCount, skippedCount } = result.statistics;
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
    let skippedCount = 0;
    const errors = [];

    // Recursively process directories leveraging getDirectoryContents
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

        if (!entry.isEncrypted) {
          skippedCount++;
          continue;
        }

        const result = await decryptFile(entry.path, password);
        if (result.success) {
          decryptedCount++;
        } else {
          failedCount++;
          errors.push(`${entry.path}: ${result.error}`);
        }
      }
    }

    await processDirectory(dirPath);

    return {
      success: true,
      message: `Directory decrypted: ${decryptedCount} files processed`,
      statistics: { decryptedCount, failedCount, skippedCount, errors },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Directory decryption failed",
    };
  }
}

module.exports = { decryptDirectory };
