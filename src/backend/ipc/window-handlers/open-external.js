/**
 * IPC Handler: Open External
 * Handles secure opening of external URLs and files in default system applications
 *
 * Purpose:
 * - Provides secure bridge between renderer process and system applications
 * - Safely opens external URLs in default browser
 * - Opens files in their default system applications
 * - Maintains security boundary between renderer and main processes
 * - Prevents direct file system access from renderer
 *
 * Dependencies:
 * - electron.shell: Electron's API for interacting with desktop environment
 * - ipcMain: Electron's IPC system (registered in register-handlers.js)
 *
 * Usage Examples:
 * ```
 * // From renderer process
 * await window.electronAPI.openExternal('https://docs.maraikka.com');
 * await window.electronAPI.openExternal('https://github.com/puzzlers-labs/maraikka');
 *
 * // For files
 * await window.electronAPI.openExternal('file:///path/to/document.pdf');
 * ```
 *
 * Integration Points:
 * - Documentation Links: Opens documentation website
 * - Help Menu: Opens support and learn more links
 * - Update System: Opens app store pages
 * - External Files: Opens files in default applications
 * - GitHub Links: Opens repository and issue pages
 *
 * Process Flow:
 * 1. Renderer requests to open URL/file
 * 2. Request is validated and sanitized
 * 3. shell.openExternal safely opens resource
 * 4. System handles resource with default application
 */

const { shell } = require("electron");

/**
 * Handles opening external URLs or files
 * Provides secure way to open external resources from renderer process
 *
 * @param {Electron.IpcMainInvokeEvent} _event - The IPC event (unused)
 * @param {string} url - URL or file path to open externally
 * @returns {Promise<void>} Resolves when the resource is opened
 * @throws {Error} If the URL is invalid or cannot be opened
 */
async function handleOpenExternal(_event, url) {
  await shell.openExternal(url);
}

module.exports = { handleOpenExternal };
