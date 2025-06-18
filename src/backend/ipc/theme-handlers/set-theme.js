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
 * 2. Update theme in preferences store
 * 3. Broadcast change to all open windows
 * 4. Each window applies the new theme to its interface
 */

const { ipcMain } = require("electron");
const { setTheme } = require("@backend/utils/preferences-store");
const { BrowserWindow } = require("electron");

/**
 * Registers the IPC handler for setting the theme
 * Updates the theme in preferences store and broadcasts to all windows
 *
 * @returns {void} Registers the IPC handler
 *
 * @throws {Error} If theme update or broadcast fails
 */
function registerSetThemeHandler() {
  ipcMain.handle("set-theme", async (_event, theme) => {
    try {
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
  });
}

module.exports = registerSetThemeHandler;
