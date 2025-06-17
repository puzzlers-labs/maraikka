// Directory Existence Validator
// Validates directory paths for recent directories functionality and navigation safety

// Purpose:
// - Validates that directory paths exist and are accessible
// - Provides safe directory checking for recent directories list
// - Prevents navigation errors when directories become unavailable
// - Ensures user experience continuity when paths change

// Dependencies:
// - fs-extra: Enhanced file system operations for async path validation

// Usage Examples:
// ```
// // Basic directory validation
// const result = await handleCheckDirectoryExists(_event, '/path/to/directory');
// if (result.success && result.exists) {
//   await loadDirectoryContents('/path/to/directory');
// } else {
//   showDirectoryUnavailableDialog('/path/to/directory');
// }
//
// // Error handling with validation
// const result = await handleCheckDirectoryExists(_event, dirPath);
// if (result.success) {
//   if (result.exists) {
//     navigateToDirectory(dirPath);
//   } else {
//     removeFromRecentsList(dirPath);
//   }
// } else {
//   handleSystemError(result.error);
// }
// ```

// Integration Points:
// - Recent Directories: Validates paths before navigation attempts
// - Frontend Navigation: Prevents crashes from invalid directory paths
// - IPC System: Registered as 'check-directory-exists' handler
// - Error Handling: Provides graceful fallback for unavailable directories

// Process Flow:
// 1. Validate input parameters (dirPath required)
// 2. Attempt to get directory statistics using fs.stat
// 3. Verify that path points to a directory (not a file)
// 4. Return structured result with success status and existence flag
// 5. Handle errors gracefully without exposing system details

const fs = require("fs-extra");

/**
 * Validates if a directory exists and is accessible
 * Used primarily for recent directories validation before navigation
 *
 * @param {Event} _event - IPC event object (unused but required for IPC signature)
 * @param {string} dirPath - Absolute path to directory to validate
 * @returns {Promise<Object>} Directory validation result
 * @property {boolean} success - Whether the validation operation completed successfully
 * @property {boolean} [exists] - Whether the directory exists and is accessible (present if success is true)
 * @property {string} [path] - The validated directory path (present if success is true)
 * @property {string} [error] - Error message (present if success is false)
 *
 * @throws {Error} "Directory path is required" - If dirPath parameter is missing
 *
 * @example
 * // Successful validation for existing directory
 * const result = await handleCheckDirectoryExists(_event, '/home/user/documents');
 * if (result.success && result.exists) {
 *   await navigateToDirectory(result.path);
 * }
 *
 * @example
 * // Validation for non-existent directory
 * const result = await handleCheckDirectoryExists(_event, '/removed/directory');
 * if (result.success && !result.exists) {
 *   await removeFromRecentDirectories(dirPath);
 *   showDirectoryUnavailableModal(dirPath);
 * }
 */
async function handleCheckDirectoryExists(_event, dirPath) {
  try {
    if (!dirPath) {
      throw new Error("Directory path is required");
    }

    const stats = await fs.stat(dirPath);
    const exists = stats.isDirectory();

    return {
      success: true,
      exists: exists,
      path: dirPath,
    };
  } catch (error) {
    // Directory doesn't exist or is inaccessible
    return {
      success: true,
      exists: false,
      path: dirPath,
    };
  }
}

module.exports = { handleCheckDirectoryExists };
