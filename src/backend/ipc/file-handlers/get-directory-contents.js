// Directory Contents Handler
// Provides detailed directory listing with encryption detection and file metadata

// Purpose:
// - Primary function: Retrieves comprehensive directory contents with encryption status detection
// - Key features: File size analysis, modification date tracking, encryption prefix detection
// - Important behaviors: Handles binary files gracefully, preserves directory structure information
// - Quality considerations: Secure encryption detection without exposing sensitive data
// - Security considerations: Safe handling of encrypted files with proper error management

// Dependencies:
// - fs-extra: Enhanced file system operations for directory reading and file stats
// - path: File path manipulation for constructing full file paths
// - @constants/crypto: ENCRYPTION_PREFIX constant for detecting encrypted files

// Usage Examples:
// ```
// // Basic directory contents retrieval
// const contents = await handleGetDirectoryContents(event, '/path/to/directory');
// contents.forEach(item => {
//   console.log(`${item.name}: ${item.encrypted ? 'Encrypted' : 'Plain'} ${item.isDirectory ? 'Directory' : 'File'}`);
// });
//
// // Error handling with detailed response
// try {
//   const result = await handleGetDirectoryContents(event, dirPath);
//   if (result.length === 0) {
//     console.log('Directory is empty');
//   }
// } catch (error) {
//   console.error('Failed to read directory:', error.message);
// }
// ```

// Integration Points:
// - IPC System: Registered as 'get-directory-contents' handler in register-handlers.js
// - Frontend UI: Called by loadDirectoryContents() for file list rendering
// - File Explorer: Provides data for both list and grid view components
// - Encryption System: Integrates with ENCRYPTION_PREFIX detection logic
// - Statistics Module: Feeds data to updateStats() for directory analysis

// Process Flow:
// 1. Validate directory path parameter and check accessibility
// 2. Read directory entries using fs.readdir with file type information
// 3. For each directory item:
//    - Construct full file path using path.join
//    - Retrieve file statistics (size, modification time)
//    - Detect encryption status by reading file prefix for non-directories
//    - Handle binary files gracefully with try-catch error management
// 4. Compile comprehensive item objects with all metadata
// 5. Return structured array with name, path, type, size, date, and encryption status

const fs = require("fs-extra");
const path = require("path");
const { ENCRYPTION_PREFIX } = require("@constants/crypto");

/**
 * Handles getting detailed directory contents with encryption detection and file metadata
 * Provides comprehensive file information including encryption status, sizes, and modification dates
 * for use in file explorer UI components and directory statistics
 *
 * @param {Object} event - IPC event object (automatically provided by Electron)
 * @param {string} dirPath - Absolute path to directory to analyze and list contents
 * @returns {Promise<Array<Object>>} Array of file/directory objects with detailed metadata
 * @property {string} name - File or directory name without path
 * @property {string} path - Full absolute path to the item
 * @property {boolean} isDirectory - Whether the item is a directory (true) or file (false)
 * @property {number} size - File size in bytes (0 for directories)
 * @property {Date} modified - Last modification timestamp as Date object
 * @property {boolean} encrypted - Whether file is encrypted with MARAIKKA prefix (false for directories)
 *
 * @throws {Error} When directory path is invalid, inaccessible, or read operation fails
 *
 * @example
 * // IPC call from renderer process
 * const contents = await window.electronAPI.getDirectoryContents('/Users/john/Documents');
 *
 * // Process results in frontend
 * contents.forEach(item => {
 *   if (item.isDirectory) {
 *     console.log(`📁 ${item.name} (Directory)`);
 *   } else if (item.encrypted) {
 *     console.log(`🔒 ${item.name} (${formatFileSize(item.size)}) - Encrypted`);
 *   } else {
 *     console.log(`📄 ${item.name} (${formatFileSize(item.size)})`);
 *   }
 * });
 */
async function handleGetDirectoryContents(event, dirPath) {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const contents = [];

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      const stats = await fs.stat(fullPath);

      let isEncrypted = false;
      if (!item.isDirectory()) {
        try {
          // Check if file is encrypted by reading first part of file
          const fileContent = await fs.readFile(fullPath, "utf8");
          isEncrypted = fileContent.startsWith(ENCRYPTION_PREFIX);
        } catch (error) {
          // If we can't read as text, assume it's not encrypted
          isEncrypted = false;
        }
      }

      contents.push({
        name: item.name,
        path: fullPath,
        isDirectory: item.isDirectory(),
        size: stats.size,
        modified: stats.mtime,
        encrypted: isEncrypted,
      });
    }

    return contents;
  } catch (error) {
    throw new Error(`Failed to read directory: ${error.message}`);
  }
}

module.exports = { handleGetDirectoryContents };
