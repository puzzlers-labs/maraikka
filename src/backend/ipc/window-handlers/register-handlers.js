/**
 * Window Handlers Registration Module
 * Centralizes registration of all window management IPC handlers
 *
 * Purpose:
 * - Registers all window operation related handlers
 * - Maintains consistent window management patterns
 * - Centralizes window operation IPC channel management
 * - Ensures secure and controlled window creation
 *
 * Dependencies:
 * - ipcMain: Electron IPC main process module for handler registration
 * - Window Handlers: Individual handler modules for window operations
 * - BrowserWindow: Electron window creation and management
 * - Shell: Electron shell for external URL handling
 *
 * Integration Points:
 * - Main IPC Registry: Called by main register-handlers.js
 * - Window Management: Manages all window-related IPC communication
 * - Editor Windows: Handles text and image editor windows
 * - Security Layer: Validates external URL operations
 *
 * Process Flow:
 * 1. Module imports required IPC and window operation handlers
 * 2. registerWindowHandlers function sets up all IPC channels
 * 3. Each handler is registered with appropriate security checks
 * 4. Window creation/management follows security best practices
 * 5. External URL handling includes proper sanitization
 */

const { ipcMain } = require("electron");

// Text Editor Window Handlers
const {
  handleOpenTextEditorWindow,
} = require("@backend/ipc/window-handlers/open-text-editor-window");

// Image Editor Window Handlers
const {
  handleOpenImageEditorWindow,
} = require("@backend/ipc/window-handlers/open-image-editor-window");

// External Window Handlers
const {
  handleOpenExternal,
} = require("@backend/ipc/window-handlers/open-external");

/**
 * Registers all window operation IPC handlers for secure window management.
 * This function sets up the communication channels between the renderer and main processes
 * for all window-related operations, ensuring secure window creation and management.
 *
 * Handler Categories:
 * 1. Text Editor Windows: Managing text editing interfaces
 * 2. Image Editor Windows: Managing image editing interfaces
 * 3. External Windows: Handling external URL operations
 *
 * Window Security:
 * - All new windows follow security best practices
 * - Node integration is disabled by default
 * - Context isolation is enabled
 * - External URLs are validated before opening
 *
 * Window Management:
 * - Windows are tracked for proper cleanup
 * - Resource usage is monitored
 * - Window state is preserved when appropriate
 *
 * Error Handling:
 * - Window creation failures are caught and reported
 * - Invalid URLs are blocked and logged
 * - Resource constraints trigger graceful fallbacks
 * - Zombie windows are automatically cleaned up
 *
 * @function registerWindowHandlers
 * @returns {void}
 */
function registerWindowHandlers() {
  /**
   * Editor Window Handlers
   * Manage creation and lifecycle of editor windows
   * Implements proper security measures and resource management
   */
  ipcMain.handle("open-text-editor-window", handleOpenTextEditorWindow);
  ipcMain.handle("open-image-editor-window", handleOpenImageEditorWindow);

  /**
   * External Window Handlers
   * Handle opening of external URLs with proper security validation
   * Ensures safe handling of external content
   */
  ipcMain.handle("open-external", handleOpenExternal);
}

// Export the registration function for use in the main process
module.exports = { registerWindowHandlers };
