// Directory Contents IPC Handler
// Thin wrapper around the shared directory utility to expose an IPC-friendly
// interface. All heavy-lifting (encryption detection, MIME lookup, metadata
// extraction, etc.) is delegated to `@backend/file-manager/get-directory-contents`.

// Purpose:
// - Registerable IPC handler that returns directory listings to the renderer.
// - Delegates all domain logic to the shared utility to ensure consistent
//   behaviour across back-end modules.

// Dependencies:
// - @backend/file-manager/get-directory-contents: Provides `getDirectoryContents`.

// Usage Examples:
// ```
// // Basic directory contents retrieval
// const contents = await handleGetDirectoryContents(event, '/path/to/directory');
// console.log(contents.length);
// ```

// Integration Points:
// - IPC System: Registered as "get-directory-contents" in the global
//   `src/backend/ipc/register-handlers.js`.
// - Front-end: Invoked by `loadDirectoryContents()` to populate file explorer UI.

// Process Flow:
// 1. Validate directory path parameter (delegated to utility).
// 2. Delegate to `getDirectoryContents(dirPath)`.
// 3. Return the resulting array to caller.

const {
  getDirectoryContents,
} = require("@backend/file-manager/get-directory-contents");

/**
 * Handles getting detailed directory contents with encryption detection and file metadata
 * Provides comprehensive file information including encryption status, sizes, and modification dates
 * for use in file explorer UI components and directory statistics
 *
 * @param {Object} _event - IPC event object (automatically provided by Electron)
 * @param {string} dirPath - Absolute path to directory to analyze and list contents
 * @returns {Promise<Array<Object>>} See `getDirectoryContents` for item schema.
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
async function handleGetDirectoryContents(_event, dirPath) {
  if (!dirPath) {
    throw new Error("Directory path is required");
  }

  try {
    return await getDirectoryContents(dirPath);
  } catch (error) {
    throw new Error(`Failed to read directory: ${error.message}`);
  }
}

module.exports = { handleGetDirectoryContents };
