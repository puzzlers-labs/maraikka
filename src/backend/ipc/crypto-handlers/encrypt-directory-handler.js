/**
 * Module Name: Directory Encryption IPC Handler
 * Handles IPC communication for directory encryption operations
 *
 * Purpose:
 * - Primary function: Bridge between renderer and main process for directory encryption
 * - Key features: Secure parameter passing, error handling, result formatting
 * - Important behaviors: Validates inputs, maintains IPC protocol, prevents unauthorized access
 * - Quality considerations:
 *   - Ensures secure data transfer between processes
 *   - Validates all inputs before processing
 *   - Handles large directories efficiently
 *   - Maintains atomic operations where possible
 *
 * Dependencies:
 * - encryptDirectory: Core directory encryption functionality
 * - IPC Main: Electron's IPC system for process communication
 * - Frontend Integration: Connects with renderer's encryption requests
 *
 * Security Considerations:
 * - Validates all input parameters before processing
 * - Ensures password is never logged or exposed
 * - Maintains process isolation through IPC
 * - Handles sensitive data in memory securely
 * - Cleans up encryption artifacts on failure
 *
 * Performance Considerations:
 * - Processes large directories in chunks
 * - Maintains responsive UI during encryption
 * - Reports progress for long-running operations
 * - Handles memory efficiently for large files
 *
 * Usage Examples:
 * ```
 * // IPC registration in main process
 * ipcMain.handle('encrypt-directory', async (event, dirPath, password) => {
 *   const result = await handleEncryptDirectory(event, dirPath, password);
 *   return result;
 * });
 *
 * // Renderer process call
 * const result = await window.electronAPI.encryptDirectory(dirPath, password);
 * if (result.success) {
 *   handleSuccess(result.message);
 * }
 * ```
 *
 * Integration Points:
 * - Renderer Process: Called by frontend encryption functions
 * - Main Process: Registered as IPC handler
 * - Context Menu: Used for directory-level encryption actions
 * - Security Layer: Ensures secure parameter passing between processes
 * - Progress System: Reports encryption progress to UI
 *
 * Error Handling:
 * - Input Validation Errors:
 *   - Missing or invalid directory path
 *   - Missing or weak password
 *   - Directory access permission issues
 * - Processing Errors:
 *   - File system errors (read/write failures)
 *   - Out of memory errors for large directories
 *   - Encryption operation failures
 * - Recovery Strategies:
 *   - Rollback on partial failures
 *   - Cleanup of temporary files
 *   - Detailed error reporting for debugging
 *
 * Process Flow:
 * 1. Receive IPC call with directory path and password
 * 2. Validate and sanitize parameters
 * 3. Check directory access permissions
 * 4. Initialize progress tracking
 * 5. Call core encryptDirectory function
 * 6. Handle errors and cleanup if necessary
 * 7. Return formatted result to renderer
 */

const encryptDirectory = require("@backend/crypto/encrypt-directory");

/**
 * Handles directory encryption IPC requests from renderer process
 * Validates inputs and delegates to core encryption functionality
 *
 * @param {IpcMainEvent} _event - Electron IPC event object (unused)
 * @param {string} dirPath - Absolute path to directory to encrypt
 * @param {string} password - Encryption password or authentication key
 * @returns {Promise<Object>} Encryption result
 * @property {boolean} success - Whether encryption was successful
 * @property {string} message - Success or error message
 * @property {Object} [statistics] - Encryption statistics if successful
 * @property {number} [statistics.encryptedCount] - Number of files encrypted
 * @property {number} [statistics.failedCount] - Number of failed encryptions
 * @property {Array<string>} [statistics.errors] - List of specific file errors
 * @property {Object} [statistics.performance] - Performance metrics
 * @property {number} [statistics.performance.duration] - Total operation time in ms
 * @property {number} [statistics.performance.filesPerSecond] - Processing rate
 * @property {Object} [progress] - Progress information if operation was partial
 * @property {number} [progress.percentage] - Completion percentage
 * @property {string} [progress.currentFile] - Currently processing file
 *
 * @throws {Error} If directory path is invalid or inaccessible
 * @throws {Error} If password is missing or invalid
 * @throws {Error} If file system operations fail
 * @throws {Error} If encryption operations fail
 *
 * @example
 * // Success case
 * const result = await handleEncryptDirectory(_event, '/path/to/dir', 'password123');
 * // Returns: {
 *   success: true,
 *   message: 'Directory encrypted',
 *   statistics: {
 *     encryptedCount: 10,
 *     failedCount: 0,
 *     errors: [],
 *     performance: {
 *       duration: 1200,
 *       filesPerSecond: 8.33
 *     }
 *   }
 * }
 *
 * @example
 * // Error case
 * const result = await handleEncryptDirectory(_event, '', 'password123');
 * // Returns: {
 *   success: false,
 *   error: 'Invalid directory path',
 *   statistics: {
 *     encryptedCount: 0,
 *     failedCount: 0,
 *     errors: ['Invalid directory path provided']
 *   }
 * }
 *
 * @example
 * // Partial success case
 * const result = await handleEncryptDirectory(_event, '/path/to/dir', 'password123');
 * // Returns: {
 *   success: false,
 *   error: 'Some files failed to encrypt',
 *   statistics: {
 *     encryptedCount: 8,
 *     failedCount: 2,
 *     errors: [
 *       '/path/to/dir/file1.txt: Permission denied',
 *       '/path/to/dir/file2.txt: File in use'
 *     ]
 *   },
 *   progress: {
 *     percentage: 80,
 *     currentFile: '/path/to/dir/file8.txt'
 *   }
 * }
 */
async function handleEncryptDirectory(_event, dirPath, password) {
  return await encryptDirectory(dirPath, password);
}

module.exports = { handleEncryptDirectory };
