/**
 * IPC Handler: Get Current Theme
 * Retrieves the current theme setting from the preferences store
 *
 * Purpose:
 * - Provides a standardized way to query current theme state
 * - Ensures theme consistency across different windows
 * - Handles theme state retrieval with proper fallbacks
 * - Maintains theme synchronization in the application
 *
 * Dependencies:
 * - ipcMain: Electron IPC main process module
 * - preferences-store: Application preferences management module
 * - getTheme: Function to retrieve theme from electron-store
 * - THEMES: Available theme constants
 * - DEFAULT_THEME: Default theme setting
 *
 * Usage Examples:
 * ```
 * // From renderer process
 * const theme = await window.electronAPI.getCurrentTheme();
 *
 * // Handle theme response
 * if (theme === THEMES.LIGHT) {
 *   applyLightTheme();
 * } else {
 *   applyDarkTheme();
 * }
 * ```
 *
 * Integration Points:
 * - Preferences Store: Source of truth for theme state
 * - Text Editor: Uses this for theme initialization
 * - Image Editor: Syncs theme with main window
 * - Theme Manager: Handles theme state queries
 * - Other renderer processes: Theme state synchronization
 *
 * Process Flow:
 * 1. Receive IPC request from renderer
 * 2. Retrieve theme from preferences store
 * 3. Return theme value with automatic default handling
 * 4. Preferences store handles validation and defaults
 */

const { ipcMain } = require("electron");
const { getTheme } = require("@backend/utils/preferences-store");

/**
 * Registers the IPC handler for getting the current theme
 * Returns the theme preference from the preferences store
 *
 * @returns {void} Registers the IPC handler
 */
function registerGetCurrentThemeHandler() {
  ipcMain.handle("get-current-theme", async () => {
    return getTheme();
  });
}

module.exports = registerGetCurrentThemeHandler;
