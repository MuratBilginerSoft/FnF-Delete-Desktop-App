const fs = require('fs');
const path = require('path');

class FileScanner {
  constructor() {
    this.cancelScan = false;
  }

  async scanDirectory(scanPath, extensions, mode) {
    try {
      this.cancelScan = false;

      // Validate path
      if (!fs.existsSync(scanPath)) {
        return {
          success: false,
          message: 'Path does not exist',
          files: []
        };
      }

      const stats = fs.statSync(scanPath);
      if (!stats.isDirectory()) {
        return {
          success: false,
          message: 'Path is not a directory',
          files: []
        };
      }

      // Parse extensions (convert to lowercase and remove dots)
      const extensionList = extensions
        .split(',')
        .map(ext => ext.trim().toLowerCase().replace(/^\./, ''))
        .filter(ext => ext.length > 0);

      if (extensionList.length === 0) {
        return {
          success: false,
          message: 'No valid extensions provided',
          files: []
        };
      }

      // Scan recursively
      const files = [];
      await this.scanRecursive(scanPath, extensionList, mode, files);

      return {
        success: true,
        files,
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        totalCount: files.length
      };

    } catch (error) {
      console.error('Scan directory error:', error);
      return {
        success: false,
        message: error.message,
        files: []
      };
    }
  }

  async scanRecursive(dirPath, extensionList, mode, foundFiles) {
    if (this.cancelScan) return;

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (this.cancelScan) break;

        const fullPath = path.join(dirPath, entry.name);

        try {
          if (entry.isDirectory()) {
            // Recursively scan subdirectories
            await this.scanRecursive(fullPath, extensionList, mode, foundFiles);
          } else if (entry.isFile()) {
            // Check if file matches criteria
            const fileExt = path.extname(entry.name).toLowerCase().replace(/^\./, '');
            const shouldInclude = this.shouldIncludeFile(fileExt, extensionList, mode);

            if (shouldInclude) {
              const stats = fs.statSync(fullPath);
              foundFiles.push({
                path: fullPath,
                name: entry.name,
                extension: fileExt,
                size: stats.size,
                directory: dirPath,
                modifiedAt: stats.mtime
              });
            }
          }
        } catch (err) {
          // Skip files/folders that can't be accessed
          console.warn(`Cannot access: ${fullPath}`, err.message);
        }
      }
    } catch (error) {
      console.warn(`Cannot read directory: ${dirPath}`, error.message);
    }
  }

  shouldIncludeFile(fileExt, extensionList, mode) {
    const isInList = extensionList.includes(fileExt);

    if (mode === 'include') {
      // Include only files with specified extensions
      return isInList;
    } else if (mode === 'exclude') {
      // Exclude files with specified extensions
      return !isInList;
    }

    return false;
  }

  cancel() {
    this.cancelScan = true;
  }
}

module.exports = { FileScanner };
