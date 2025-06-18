/**
 * IPC Handler: Get Theme
 * Retrieves the current theme setting from the preferences store
 *
 * Purpose:
 * - Provides a standardized way to query current theme state
 * - Ensures theme consistency across different windows
 * - Handles theme state retrieval with proper fallbacks
 * - Maintains theme synchronization in the application
 *
 * Dependencies:
 * - preferences-store: Application preferences management module
 * - getTheme: Function to retrieve theme from electron-store
 * - THEMES: Available theme constants
 * - DEFAULT_THEME: Default theme setting
 *
 * Usage Examples:
 * ```
 * // From renderer process
 * const theme = await window.electronAPI.getTheme();
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

const { getTheme } = require("@backend/utils/preferences-store");

/**
 * Handles requests to get the theme setting
 * Returns the theme preference from the preferences store
 *
 * @param {Event} _event - Electron IPC event object (unused)
 * @returns {Promise<string>} Theme value ('light' or 'dark')
 */
async function handleGetTheme(_event) {
  return getTheme();
}

module.exports = { handleGetTheme };
