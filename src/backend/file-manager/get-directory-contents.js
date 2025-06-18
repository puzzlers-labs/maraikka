// Directory Contents Utility
// Provides a lightweight, header-aware directory listing leveraging the
// `read-file` helper in *header-only* mode to minimise I/O.
//
// Purpose:
// - Primary function: Enumerate all entries inside a directory and return rich
//   metadata for each, including encryption status and (when available)
//   Maraikka encryption metadata – without reading whole file contents.
// - Key features: Uses `readFile(..., { returnOnlyHeader: true })` to avoid
//   loading large/binary files, yielding fast results for huge directories.
// - Important behaviours: Treats directories separately (skips encryption
//   detection); gracefully handles read errors on individual files.
// - Quality considerations: Limits I/O to `MAX_HEADER_BYTES` per file; uses
//   shared constants to ensure consistent limits across codebase.
//
// Dependencies:
// - fs-extra:          `readdir` and `stat` async helpers.
// - path:              Safe construction of absolute file paths.
// - @backend/file-manager/read-file: Performs header-only inspections.
//
// Usage Examples:
// ```javascript
// const { getDirectoryContents } = require('@backend/file-manager/get-directory-contents');
// const children = await getDirectoryContents('/Users/alex/Documents');
// children.forEach(item => {
//   if (item.isDirectory) {
//     console.log(`📁 ${item.name}`);
//   } else if (item.isEncrypted) {
//     console.log(`🔒 ${item.name} – algorithm: ${item.metadata.algorithm}`);
//   } else {
//     console.log(`📄 ${item.name} (${item.mimeType})`);
//   }
// });
// ```
//
// Integration Points:
// - May be reused by IPC handlers (e.g., `src/backend/ipc/file-handlers/get-directory-contents.js`).
// - Front-end directory loaders can invoke this utility when they do not need
//   full file buffers.
//
// Process/Operation Flow:
// 1. Read directory entries via `fs.readdir` using `withFileTypes`.
// 2. For each entry:
//    a. Build absolute path & obtain `fs.stat`.
//    b. If entry is **file**, call `readFile` in header-only mode to obtain
//       encryption status, MIME type, etc.
//    c. Compose a normalised metadata object.
// 3. Aggregate results and return sorted array (directories first, then files).

const fs = require("fs-extra");
const path = require("path");

// Local helper – header-aware file loader
const { readFile } = require("@backend/file-manager/read-file");

/**
 * Retrieve directory contents with lightweight header inspection.
 *
 * @param {string} dirPath
 *   Absolute path of the directory to inspect.
 * @returns {Promise<Array<Object>>}
 *   Array containing metadata objects for each directory entry.
 *
 * @property {string}  name         – Base name of entry (no path).
 * @property {string}  path         – Absolute path.
 * @property {boolean} isDirectory  – `true` for directories.
 * @property {number}  size         – Size in bytes (0 for directories when OS returns 0).
 * @property {Date}    modified     – Last modification `Date`.
 * @property {boolean} isEncrypted  – File begins with Maraikka encryption header.
 * @property {string?} mimeType     – MIME type string for files (undefined for dirs).
 * @property {Object?} metadata     – Parsed encryption metadata (when encrypted) (undefined for dirs).
 * @property {string?}  encoding    – "binary" or "utf8" (files only) (undefined for dirs).
 *
 * @throws {Error} When directory cannot be read (non-existent, permission denied, etc.).
 */
async function getDirectoryContents(dirPath) {
  try {
    // 1) Validate & read entries
    const dirEntries = await fs.readdir(dirPath, { withFileTypes: true });
    const results = [];

    for (const entry of dirEntries) {
      const fullPath = path.join(dirPath, entry.name);
      const stats = await fs.stat(fullPath);

      if (entry.isDirectory()) {
        results.push({
          name: entry.name,
          path: fullPath,
          isDirectory: true,
          size: stats.size,
          modified: stats.mtime,
          isEncrypted: false,
          metadata: undefined,
          mimeType: undefined,
          encoding: undefined,
        });
        continue;
      }

      // Files – use header-only read for efficiency
      let headerInfo;
      try {
        headerInfo = await readFile(fullPath, { returnOnlyHeader: true });
      } catch (_err) {
        // Even if header read fails (permissions, binary detection error, etc.),
        // we continue with minimal info rather than aborting whole directory.
        headerInfo = { success: false };
      }

      const {
        isEncrypted = false,
        metadata = undefined,
        mimeType = undefined,
        encoding = undefined,
      } = headerInfo.success ? headerInfo : {};

      results.push({
        name: entry.name,
        path: fullPath,
        isDirectory: false,
        size: stats.size,
        modified: stats.mtime,
        isEncrypted,
        metadata,
        mimeType,
        encoding,
      });
    }

    // Order directories first, then files alphabetically for UX
    results.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

    return results;
  } catch (error) {
    throw new Error(`Unable to read directory contents: ${error.message}`);
  }
}

module.exports = { getDirectoryContents };
