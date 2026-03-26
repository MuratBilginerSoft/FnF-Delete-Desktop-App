const fs = require('fs');
const path = require('path');

class FileScanner {
  constructor() {
    this.cancelScan = false;
  }

  async scanDirectory(scanPath, extensions, mode, includeSubfolders = true) {
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

      // For 'all' mode, we don't need extensions
      let extensionList = [];
      if (mode !== 'all') {
        // Parse extensions (convert to lowercase and remove dots)
        extensionList = extensions
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
      }

      // Scan based on includeSubfolders setting
      const files = [];
      if (includeSubfolders) {
        await this.scanRecursive(scanPath, extensionList, mode, files);
      } else {
        await this.scanShallow(scanPath, extensionList, mode, files);
      }

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

  async scanShallow(dirPath, extensionList, mode, foundFiles) {
    if (this.cancelScan) return;

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (this.cancelScan) break;

        const fullPath = path.join(dirPath, entry.name);

        try {
          // Only scan files, skip subdirectories
          if (entry.isFile()) {
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
          // Skip files that can't be accessed
          console.warn(`Cannot access: ${fullPath}`, err.message);
        }
      }
    } catch (error) {
      console.warn(`Cannot read directory: ${dirPath}`, error.message);
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
    if (mode === 'all') {
      // Include all files regardless of extension
      return true;
    }

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

  // ============ FOLDER SCANNING ============

  async scanFolders(scanPath, keywords, mode, includeSubfolders = false) {
    try {
      this.cancelScan = false;

      if (!fs.existsSync(scanPath)) {
        return { success: false, message: 'Path does not exist', folders: [] };
      }

      const stats = fs.statSync(scanPath);
      if (!stats.isDirectory()) {
        return { success: false, message: 'Path is not a directory', folders: [] };
      }

      let keywordList = [];
      if (mode !== 'all') {
        keywordList = keywords
          .split(',')
          .map(k => k.trim().toLowerCase())
          .filter(k => k.length > 0);

        if (keywordList.length === 0) {
          return { success: false, message: 'No valid keywords provided', folders: [] };
        }
      }

      const folders = [];
      if (includeSubfolders) {
        await this.scanFoldersRecursive(scanPath, keywordList, mode, folders);
      } else {
        await this.scanFoldersShallow(scanPath, keywordList, mode, folders);
      }

      return {
        success: true,
        folders,
        totalSize: folders.reduce((sum, f) => sum + f.size, 0),
        totalCount: folders.length
      };
    } catch (error) {
      console.error('Scan folders error:', error);
      return { success: false, message: error.message, folders: [] };
    }
  }

  async scanFoldersShallow(dirPath, keywordList, mode, foundFolders) {
    if (this.cancelScan) return;

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (this.cancelScan) break;

        const fullPath = path.join(dirPath, entry.name);

        try {
          if (entry.isDirectory()) {
            const shouldInclude = this.shouldIncludeFolder(entry.name, keywordList, mode);

            if (shouldInclude) {
              const folderInfo = this.getFolderInfo(fullPath, entry.name, dirPath);
              foundFolders.push(folderInfo);
            }
          }
        } catch (err) {
          console.warn(`Cannot access: ${fullPath}`, err.message);
        }
      }
    } catch (error) {
      console.warn(`Cannot read directory: ${dirPath}`, error.message);
    }
  }

  async scanFoldersRecursive(dirPath, keywordList, mode, foundFolders) {
    if (this.cancelScan) return;

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (this.cancelScan) break;

        const fullPath = path.join(dirPath, entry.name);

        try {
          if (entry.isDirectory()) {
            const shouldInclude = this.shouldIncludeFolder(entry.name, keywordList, mode);

            if (shouldInclude) {
              const folderInfo = this.getFolderInfo(fullPath, entry.name, dirPath);
              foundFolders.push(folderInfo);
            }

            // Always recurse to find more matches deeper
            await this.scanFoldersRecursive(fullPath, keywordList, mode, foundFolders);
          }
        } catch (err) {
          console.warn(`Cannot access: ${fullPath}`, err.message);
        }
      }
    } catch (error) {
      console.warn(`Cannot read directory: ${dirPath}`, error.message);
    }
  }

  shouldIncludeFolder(folderName, keywordList, mode) {
    if (mode === 'all') return true;

    const lowerName = folderName.toLowerCase();
    const isMatch = keywordList.some(keyword => lowerName.includes(keyword));

    if (mode === 'include') return isMatch;
    if (mode === 'exclude') return !isMatch;

    return false;
  }

  getFolderInfo(fullPath, name, parentDir) {
    try {
      const stats = fs.statSync(fullPath);
      const { fileCount, totalSize } = this.calculateFolderStats(fullPath);

      return {
        path: fullPath,
        name: name,
        size: totalSize,
        fileCount: fileCount,
        directory: parentDir,
        modifiedAt: stats.mtime
      };
    } catch (error) {
      return {
        path: fullPath,
        name: name,
        size: 0,
        fileCount: 0,
        directory: parentDir,
        modifiedAt: new Date()
      };
    }
  }

  calculateFolderStats(folderPath) {
    let fileCount = 0;
    let totalSize = 0;

    try {
      const entries = fs.readdirSync(folderPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(folderPath, entry.name);
        try {
          if (entry.isFile()) {
            const stats = fs.statSync(entryPath);
            fileCount++;
            totalSize += stats.size;
          } else if (entry.isDirectory()) {
            const subStats = this.calculateFolderStats(entryPath);
            fileCount += subStats.fileCount;
            totalSize += subStats.totalSize;
          }
        } catch (err) {
          // Skip inaccessible entries
        }
      }
    } catch (error) {
      // Skip inaccessible directories
    }

    return { fileCount, totalSize };
  }

  cancel() {
    this.cancelScan = true;
  }
}

module.exports = { FileScanner };
