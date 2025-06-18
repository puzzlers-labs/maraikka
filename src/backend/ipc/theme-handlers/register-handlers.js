/**
 * Theme Handlers Registration Module
 * Centralizes registration of all theme management IPC handlers
 *
 * Purpose:
 * - Registers all theme operation related handlers
 * - Maintains consistent theme management patterns
 * - Centralizes theme operation IPC channel management
 * - Ensures synchronized theme state across windows
 *
 * Dependencies:
 * - ipcMain: Electron IPC main process module for handler registration
 * - Theme Handlers: Individual handler modules for theme operations
 * - Theme System: Core theme management and persistence
 *
 * Integration Points:
 * - Main IPC Registry: Called by main register-handlers.js
 * - Theme Management: Manages all theme-related IPC communication
 * - Window System: Coordinates theme changes across windows
 * - Storage System: Persists theme preferences
 *
 * Process Flow:
 * 1. Module imports required IPC and theme operation handlers
 * 2. registerThemeHandlers function sets up all IPC channels
 * 3. Each handler is registered with appropriate error handling
 * 4. Theme changes are broadcasted to all windows automatically
 * 5. Theme preferences are persisted between sessions
 */

const { ipcMain } = require("electron");

// Theme State Management Handlers
const { handleGetTheme } = require("@backend/ipc/theme-handlers/get-theme");
const { handleSetTheme } = require("@backend/ipc/theme-handlers/set-theme");

/**
 * Registers all theme operation IPC handlers for consistent theme management.
 * This function sets up the communication channels between the renderer and main processes
 * for all theme-related operations, ensuring synchronized theme state across the application.
 *
 * Handler Categories:
 * 1. Theme Retrieval: Getting current theme state
 * 2. Theme Updates: Setting and broadcasting theme changes
 *
 * Theme States:
 * - system: Follows system theme preference
 * - light: Forces light theme
 * - dark: Forces dark theme
 *
 * State Management:
 * - Theme changes are immediately applied
 * - Changes are persisted to storage
 * - All windows are notified of changes
 *
 * Error Handling:
 * - Invalid theme values are rejected
 * - System theme detection failures fallback to light
 * - Storage errors maintain last known good state
 *
 * @function registerThemeHandlers
 * @returns {void}
 */
function registerThemeHandlers() {
  /**
   * Theme State Handlers
   * Manage theme retrieval and updates with proper state synchronization
   * Ensures consistent theme experience across the application
   */
  ipcMain.handle("get-theme", handleGetTheme);
  ipcMain.handle("set-theme", handleSetTheme);
}

// Export the registration function for use in the main process
module.exports = { registerThemeHandlers };
