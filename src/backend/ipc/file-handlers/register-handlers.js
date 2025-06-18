/**
 * File Handlers Registration Module
 * Centralizes registration of all file system operation IPC handlers
 *
 * Purpose:
 * - Registers all file operation related handlers
 * - Maintains consistent error handling for file operations
 * - Centralizes file operation IPC channel management
 * - Provides safe and controlled access to the file system
 *
 * Dependencies:
 * - ipcMain: Electron IPC main process module for handler registration
 * - File Handlers: Individual handler modules for specific file operations
 * - Node.js fs module: Underlying file system operations
 *
 * Integration Points:
 * - Main IPC Registry: Called by main register-handlers.js
 * - File System Operations: Manages all file-related IPC communication
 * - Security Layer: Handles secure file operations between processes
 * - Error Handling: Implements consistent error reporting
 *
 * Process Flow:
 * 1. Module imports required IPC and file operation handlers
 * 2. registerFileHandlers function sets up all IPC channels
 * 3. Each handler is registered with appropriate error handling
 * 4. Renderer process can safely access file system via these handlers
 */

const { ipcMain } = require("electron");

// File Read/Write Operation Handlers
const { handleReadFile } = require("@backend/ipc/file-handlers/read-file");
const { handleWriteFile } = require("@backend/ipc/file-handlers/write-file");

// Directory Operation Handlers
const {
  handleGetDirectoryContents,
} = require("@backend/ipc/file-handlers/get-directory-contents");

/**
 * Registers all file operation IPC handlers for secure file system access.
 * This function sets up the communication channels between the renderer and main processes
 * for all file system operations, ensuring safe and controlled access.
 *
 * Handler Categories:
 * 1. Basic File Operations: Reading and writing files
 * 2. Directory Operations: Listing and managing directory contents
 *
 * Security Considerations:
 * - All handlers implement proper error handling
 * - File paths are validated before operations
 * - Access is restricted to allowed directories
 * - File operations are atomic where possible
 *
 * Error Handling:
 * - Invalid paths return appropriate error messages
 * - Permission issues are caught and reported
 * - File system errors are properly propagated
 *
 * @function registerFileHandlers
 * @returns {void}
 */
function registerFileHandlers() {
  /**
   * Basic File Operation Handlers
   * Handle individual file read/write operations with proper error handling
   * Ensures safe access to file contents and proper resource cleanup
   */
  ipcMain.handle("read-file", handleReadFile);
  ipcMain.handle("write-file", handleWriteFile);

  /**
   * Directory Operation Handlers
   * Manage directory listing and content retrieval
   * Implements proper filtering and security checks
   */
  ipcMain.handle("get-directory-contents", handleGetDirectoryContents);
}

// Export the registration function for use in the main process
module.exports = { registerFileHandlers };
