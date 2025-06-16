// Application Initialization Module
// Handles core application startup and component initialization
//
// Purpose:
// - Orchestrates the application startup sequence
// - Initializes and connects core application components
// - Provides centralized error handling during startup
// - Returns critical application instances for global use
//
// Dependencies:
// - windowManager: Creates and manages application windows
// - ipcHandlers: Manages inter-process communication setup
// - menuManager: Handles menu creation and management
// - UpdateManager: Controls application update lifecycle
//
// Usage Examples:
// ```
// // Initialize with menu handlers
// const handlers = {
//   openFolder: () => handleFolderOpen(),
//   showAbout: () => showAboutDialog(),
//   quit: () => handleAppQuit()
// };
//
// const { updateManager, mainWindow } = await initializeApplication(handlers);
// ```
//
// Integration Points:
// - Main process: Primary initialization point after app ready
// - Menu system: Connects menu actions to application logic
// - IPC system: Sets up renderer-main process communication
// - Update system: Initializes version control and updates
//
// Initialization Flow:
// 1. Create update manager instance
// 2. Create main application window
// 3. Initialize menu system with handlers
// 4. Register IPC communication channels
// 5. Process command line arguments

const windowManager = require("@backend/windows/window-manager");
const ipcHandlers = require("@backend/ipc/ipc-handlers");
const menuManager = require("@backend/menu/menu-manager");
const UpdateManager = require("@updater");

/**
 * Initializes the application and its core components
 * Creates necessary instances and establishes system connections
 *
 * @param {Object} menuHandlers - Menu action handlers
 * @param {Function} menuHandlers.openFolder - Opens folder selection dialog
 * @param {Function} menuHandlers.showAbout - Displays about information
 * @param {Function} menuHandlers.quit - Handles application exit
 * @param {Function} menuHandlers.documentation - Opens documentation
 * @param {Function} menuHandlers.checkUpdates - Initiates update check
 *
 * @example
 * // Initialize with required handlers
 * const handlers = {
 *   openFolder: () => selectDirectory(),
 *   showAbout: () => showAboutDialog(),
 *   quit: () => handleQuit(),
 *   documentation: () => openDocs(),
 *   checkUpdates: () => checkForUpdates()
 * };
 *
 * try {
 *   const { updateManager, mainWindow } = await initializeApplication(handlers);
 * } catch (error) {
 *   app.quit();
 * }
 *
 * @returns {Promise<{updateManager: UpdateManager, mainWindow: Electron.BrowserWindow}>}
 */
async function initializeApplication(menuHandlers) {
  try {
    // Initialize update manager
    const updateManager = new UpdateManager();

    // Create main window
    const mainWindow = windowManager.createMainWindow();

    // Setup application menu
    menuManager.initializeApplicationMenu(menuHandlers);

    // Register IPC handlers
    ipcHandlers.registerIpcHandlers({ updateManager });

    // Handle command line arguments
    const handleCommandLineArgs = require("./handle-command-line-args");
    handleCommandLineArgs();

    return { updateManager, mainWindow };
  } catch (error) {
    const { app } = require("electron");
    app.quit();
    throw error;
  }
}

module.exports = initializeApplication;
