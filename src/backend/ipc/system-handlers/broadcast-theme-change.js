/**
 * IPC Handler: Broadcast Theme Change
 * Broadcasts theme changes to all application windows and updates theme state
 *
 * Purpose:
 * - Handles renderer requests to broadcast theme changes across all windows
 * - Updates the current theme reference for application state consistency
 * - Ensures all windows (main, text editors, image editors) receive theme updates
 * - Maintains theme synchronization across the entire application
 *
 * Dependencies:
 * - broadcastThemeChange: Function to broadcast theme changes to all windows
 * - currentThemeRef: Reference object containing current theme state
 *
 * Usage Examples:
 * ```
 * // Frontend calls via electronAPI
 * window.electronAPI.broadcastThemeChange('dark');
 * window.electronAPI.broadcastThemeChange('light');
 * ```
 *
 * Integration Points:
 * - Main Window: Receives theme change events and updates UI
 * - Text Editor Windows: Updates editor theme and syntax highlighting
 * - Image Editor Windows: Updates editor interface theme
 * - Application Menu: Theme toggle functionality
 *
 * Process Flow:
 * 1. Receive theme change request from renderer process
 * 2. Update current theme reference for state consistency
 * 3. Call broadcastThemeChange to notify all open windows
 * 4. Each window applies the new theme to its interface
 */

/**
 * Creates handler function for broadcasting theme changes
 * Updates application theme state and broadcasts to all windows
 *
 * @param {Function} broadcastThemeChange - Function to broadcast theme changes to all windows
 * @param {Object} currentThemeRef - Reference object containing current theme value
 * @returns {Function} Handler function that processes theme broadcast requests
 *
 * @example
 * // Usage in IPC registration
 * const handler = handleBroadcastThemeChange(broadcastFunction, themeRef);
 * ipcMain.handle('broadcast-theme-change', handler);
 */
function handleBroadcastThemeChange(broadcastThemeChange, currentThemeRef) {
  return async function (_event, theme) {
    currentThemeRef.value = theme;
    broadcastThemeChange(theme);
  };
}

module.exports = { handleBroadcastThemeChange };
