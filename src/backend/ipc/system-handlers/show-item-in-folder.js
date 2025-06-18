// Show Item in Folder Handler
// Reveals files and folders in the system file manager (Finder, Explorer, Nautilus)

// Purpose:
// - Provides "Show in Folder" functionality for context menu
// - Uses Electron's shell API to reveal items in system file manager
// - Cross-platform support for macOS Finder, Windows Explorer, and Linux file managers
// - Essential UX feature for file management applications

// Dependencies:
// - electron.shell: Cross-platform API for revealing files/folders in system file manager
// - fs: Node.js file system module for path validation

// Usage Examples:
// ```
// // From renderer process via IPC
// await window.electronAPI.showItemInFolder('/path/to/file.txt');
//
// // Direct usage in main process
// const { handleShowItemInFolder } = require('./show-item-in-folder');
// await handleShowItemInFolder(null, '/path/to/file.txt');
// ```

// Integration Points:
// - Context Menu: Triggered when user selects "Show in Folder" from right-click menu
// - File Browser: Can be called from file action buttons or keyboard shortcuts
// - Preview Pane: Available as action from file preview interface

// Process Flow:
// 1. Receive file path from renderer process via IPC
// 2. Validate file path exists and is accessible
// 3. Use Electron shell.showItemInFolder to reveal in system file manager
// 4. System file manager opens and highlights the specified item

const { shell } = require("electron");
const fs = require("fs");
const path = require("path");

/**
 * Handles showing item in folder requests from renderer process
 * Uses Electron's shell API to reveal files/folders in system file manager
 *
 * @param {Event} _event - IPC event object (unused but required by IPC signature)
 * @param {string} filePath - Absolute path to file or folder to reveal
 * @returns {Promise<void>}
 * @throws {Error} If file path is invalid or file doesn't exist
 *
 * @example
 * // Reveal a file in system file manager
 * await handleShowItemInFolder(null, '/Users/username/Documents/file.txt');
 */
async function handleShowItemInFolder(_event, filePath) {
  // Basic path validation
  if (!filePath || typeof filePath !== "string") {
    throw new Error("Invalid file path provided");
  }

  try {
    // Check if path exists
    const exists = fs.existsSync(filePath);
    if (!exists) {
      // If path doesn't exist, check if parent directory exists
      const parentDir = path.dirname(filePath);
      const parentExists = fs.existsSync(parentDir);

      if (parentExists) {
        // If parent exists, show that instead
        shell.showItemInFolder(parentDir);
        return;
      } else {
        throw new Error(`Path not found: ${filePath}`);
      }
    }

    // Show the item in folder
    shell.showItemInFolder(filePath);
  } catch (error) {
    // Throw a more descriptive error
    throw new Error(`Failed to show item in folder: ${error.message}`);
  }
}

module.exports = { handleShowItemInFolder };
