/**
 * IPC Handler: Set Theme
 * Handles theme changes and broadcasts updates across all application windows
 *
 * Purpose:
 * - Updates theme preference in the electron-store
 * - Broadcasts theme changes to all open windows
 * - Maintains theme consistency across the application
 * - Ensures synchronized theme state between main and renderer processes
 *
 * Dependencies:
 * - ipcMain: Electron IPC main process module
 * - setTheme: Function to update theme in preferences store
 * - BrowserWindow: Electron window management module
 * - THEMES: Available theme constants
 *
 * Usage Examples:
 * ```
 * // From renderer process
 * await window.electronAPI.setTheme('dark');
 * await window.electronAPI.setTheme('light');
 * ```
 *
 * Integration Points:
 * - Main Window: Receives and applies theme updates
 * - Text Editor Windows: Updates editor theme and syntax highlighting
 * - Image Editor Windows: Updates editor interface theme
 * - Preferences Store: Persists theme selection
 *
 * Process Flow:
 * 1. Receive theme change request from renderer
 * 2. Validate theme against allowed values
 * 3. Update theme in preferences store
 * 4. Broadcast change to all open windows
 * 5. Each window applies the new theme to its interface
 */

const { setTheme } = require("@backend/utils/preferences-store");
const { BrowserWindow } = require("electron");
const { THEMES } = require("@constants/theme");

/**
 * Handles theme change requests and broadcasts updates
 * Updates the theme in preferences store and broadcasts to all windows
 *
 * @param {Event} _event - Electron IPC event object (unused)
 * @param {string} theme - The theme to set ('light' or 'dark')
 * @returns {Promise<Object>} Theme update result
 * @property {boolean} success - Whether the theme was updated successfully
 *
 * @throws {Error} If theme is invalid or update/broadcast fails
 */
async function handleSetTheme(_event, theme) {
  try {
    // Validate theme
    const validThemes = Object.values(THEMES);
    if (!validThemes.includes(theme)) {
      throw new Error(
        `Invalid theme: ${theme}. Must be one of: ${validThemes.join(", ")}`,
      );
    }

    // Update theme in store
    setTheme(theme);

    // Broadcast theme change to all windows
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send("theme-changed", theme);
      }
    });

    return { success: true };
  } catch (error) {
    throw new Error(`Failed to set theme: ${error.message}`);
  }
}

module.exports = { handleSetTheme };
