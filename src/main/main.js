const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { DatabaseManager } = require('./Database.js');
const { FileScanner } = require('./FileScanner.js');

// Lazy load autoUpdater to avoid initialization issues
let autoUpdater;

class Main {
  constructor() {
    this.mainWindow = null;
    this.splashWindow = null;
    this.database = null;
    this.fileScanner = null;
  }

  initialize() {
    try {
      // Create splash screen first
      this.createSplashScreen();

      // Initialize database
      this.database = new DatabaseManager();
      this.database.initialize();

      // Initialize file scanner
      this.fileScanner = new FileScanner();

      // Setup auto updater
      this.setupAutoUpdater();

      // Wait a bit, then create main window
      setTimeout(() => {
        this.createWindow();
        this.setupIpcHandlers();
        this.setupAppEvents();
        console.log('FnF Delete application initialized successfully');
      }, 3000); // 3 second delay for splash screen

    } catch (error) {
      console.error('Initialization error:', error);
      app.quit();
    }
  }

  createSplashScreen() {
    this.splashWindow = new BrowserWindow({
      width: 600,
      height: 450,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    this.splashWindow.loadFile(path.join(__dirname, 'Splash.html'));
    this.splashWindow.center();
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1400,
      minHeight: 900,
      show: false,
      backgroundColor: '#00172D',
      frame: false, // Completely frameless - we'll create custom title bar
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
      },
    });

    // Load the app
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
      this.mainWindow.loadURL('http://localhost:5173');
      // this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../../dist-renderer/index.html'));
    }

    // Show window when ready and close splash
    this.mainWindow.once('ready-to-show', () => {
      // Close splash screen
      if (this.splashWindow) {
        this.splashWindow.close();
        this.splashWindow = null;
      }
      this.mainWindow.show();
    });

    // Handle window close
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  setupAppEvents() {
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    app.on('before-quit', () => {
      if (this.database) {
        this.database.close();
      }
    });
  }

  setupAutoUpdater() {
    // Lazy load autoUpdater after app is ready
    if (!autoUpdater) {
      autoUpdater = require('electron-updater').autoUpdater;
    }

    // Configure autoUpdater
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    // Check for updates when app is ready (only in production)
    if (app.isPackaged) {
      setTimeout(() => {
        autoUpdater.checkForUpdates().catch(err => {
          console.error('Auto updater check error:', err);
        });
      }, 5000); // Check 5 seconds after startup
    }

    // Update available
    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info);
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-available', {
          version: info.version,
          releaseNotes: info.releaseNotes,
          releaseDate: info.releaseDate
        });
      }
    });

    // Update not available
    autoUpdater.on('update-not-available', () => {
      console.log('Update not available');
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-not-available');
      }
    });

    // Download progress
    autoUpdater.on('download-progress', (progressObj) => {
      if (this.mainWindow) {
        this.mainWindow.webContents.send('download-progress', {
          percent: progressObj.percent,
          transferred: progressObj.transferred,
          total: progressObj.total
        });
      }
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded:', info);
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-downloaded', {
          version: info.version
        });
      }
    });

    // Error
    autoUpdater.on('error', (error) => {
      console.error('Auto updater error:', error);
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-error', {
          message: error.message
        });
      }
    });
  }

  setupIpcHandlers() {
    // ============ WINDOW CONTROL HANDLERS ============

    ipcMain.on('window:minimize', () => {
      if (this.mainWindow) {
        this.mainWindow.minimize();
      }
    });

    ipcMain.on('window:maximize', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMaximized()) {
          // When unmaximizing, set to a fixed size (not resizable beyond this)
          this.mainWindow.unmaximize();
          this.mainWindow.setSize(1400, 900);
          this.mainWindow.center();
        } else {
          this.mainWindow.maximize();
        }
      }
    });

    ipcMain.on('window:close', () => {
      if (this.mainWindow) {
        this.mainWindow.close();
      }
    });

    ipcMain.handle('window:isMaximized', () => {
      return this.mainWindow ? this.mainWindow.isMaximized() : false;
    });

    // ============ PROFILE HANDLERS ============

    ipcMain.handle('profile:create', async (event, { name, avatarColor }) => {
      try {
        return this.database.createProfile(name, avatarColor);
      } catch (error) {
        console.error('Create profile error:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('profile:getAll', async () => {
      try {
        return this.database.getAllProfiles();
      } catch (error) {
        console.error('Get profiles error:', error);
        return [];
      }
    });

    ipcMain.handle('profile:get', async (event, profileId) => {
      try {
        return this.database.getProfile(profileId);
      } catch (error) {
        console.error('Get profile error:', error);
        return null;
      }
    });

    ipcMain.handle('profile:updateLastUsed', async (event, profileId) => {
      try {
        this.database.updateProfileLastUsed(profileId);
        return { success: true };
      } catch (error) {
        console.error('Update last used error:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('profile:delete', async (event, profileId) => {
      try {
        return this.database.deleteProfile(profileId);
      } catch (error) {
        console.error('Delete profile error:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('profile:update', async (event, { id, name, avatarColor }) => {
      try {
        return this.database.updateProfile(id, name, avatarColor);
      } catch (error) {
        console.error('Update profile error:', error);
        return { success: false, message: error.message };
      }
    });

    // ============ FILE SCANNING HANDLERS ============

    ipcMain.handle('files:scan', async (event, { scanPath, extensions, mode, includeSubfolders }) => {
      try {
        const result = await this.fileScanner.scanDirectory(scanPath, extensions, mode, includeSubfolders);
        return result;
      } catch (error) {
        console.error('Scan files error:', error);
        return { success: false, message: error.message, files: [] };
      }
    });

    ipcMain.handle('files:moveToTrash', async (event, { filePaths }) => {
      try {
        const results = [];
        for (const filePath of filePaths) {
          try {
            await shell.trashItem(filePath);
            results.push({ path: filePath, success: true });
          } catch (err) {
            results.push({ path: filePath, success: false, error: err.message });
          }
        }
        return { success: true, results };
      } catch (error) {
        console.error('Move to trash error:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('files:selectFolder', async () => {
      try {
        const { dialog } = await import('electron');
        const result = await dialog.showOpenDialog(this.mainWindow, {
          properties: ['openDirectory']
        });

        if (!result.canceled && result.filePaths.length > 0) {
          return { success: true, path: result.filePaths[0] };
        }
        return { success: false };
      } catch (error) {
        console.error('Select folder error:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('files:openWithDefault', async (event, filePath) => {
      try {
        const result = await shell.openPath(filePath);
        if (result) {
          // result is empty string on success, error message on failure
          return { success: false, message: result };
        }
        return { success: true };
      } catch (error) {
        console.error('Open file error:', error);
        return { success: false, message: error.message };
      }
    });

    // ============ DELETION OPERATIONS HANDLERS ============

    ipcMain.handle('operation:create', async (event, { profileId, scanPath, deletionMode, fileExtensions, filesData }) => {
      try {
        // Create operation record
        const operationId = this.database.createDeletionOperation(
          profileId,
          scanPath,
          deletionMode,
          fileExtensions
        );

        // Add deleted files
        let totalSize = 0;
        for (const file of filesData) {
          this.database.addDeletedFile(
            operationId,
            profileId,
            file.path,
            file.name,
            file.extension,
            file.size
          );
          totalSize += file.size;
        }

        // Update operation with totals
        this.database.updateDeletionOperation(
          operationId,
          filesData.length,
          filesData.length,
          totalSize
        );

        return { success: true, operationId };
      } catch (error) {
        console.error('Create operation error:', error);
        return { success: false, message: error.message };
      }
    });

    // ============ STATISTICS HANDLERS ============

    ipcMain.handle('stats:getProfile', async (event, profileId) => {
      try {
        return this.database.getProfileStatistics(profileId);
      } catch (error) {
        console.error('Get statistics error:', error);
        return null;
      }
    });

    ipcMain.handle('stats:getDashboard', async (event, profileId) => {
      try {
        return this.database.getDashboardStats(profileId);
      } catch (error) {
        console.error('Get dashboard stats error:', error);
        return null;
      }
    });

    ipcMain.handle('operation:getDetails', async (event, operationId) => {
      try {
        return this.database.getOperationDetails(operationId);
      } catch (error) {
        console.error('Get operation details error:', error);
        return null;
      }
    });

    // ============ SAVED PATHS HANDLERS ============

    ipcMain.handle('savedPath:create', async (event, { profileId, path, name }) => {
      try {
        return this.database.createSavedPath(profileId, path, name);
      } catch (error) {
        console.error('Create saved path error:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('savedPath:getAll', async (event, profileId) => {
      try {
        return this.database.getSavedPaths(profileId);
      } catch (error) {
        console.error('Get saved paths error:', error);
        return [];
      }
    });

    ipcMain.handle('savedPath:delete', async (event, id) => {
      try {
        return this.database.deleteSavedPath(id);
      } catch (error) {
        console.error('Delete saved path error:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('savedPath:update', async (event, { id, name }) => {
      try {
        return this.database.updateSavedPath(id, name);
      } catch (error) {
        console.error('Update saved path error:', error);
        return { success: false, message: error.message };
      }
    });

    // ============ PROFILE SETTINGS HANDLERS ============

    ipcMain.handle('profileSettings:get', async (event, profileId) => {
      try {
        return this.database.getProfileSettings(profileId);
      } catch (error) {
        console.error('Get profile settings error:', error);
        return null;
      }
    });

    ipcMain.handle('profileSettings:update', async (event, { profileId, includeSubfolders }) => {
      try {
        return this.database.updateProfileSettings(profileId, includeSubfolders);
      } catch (error) {
        console.error('Update profile settings error:', error);
        return { success: false, message: error.message };
      }
    });

    // ============ AUTO UPDATER HANDLERS ============

    ipcMain.handle('updater:checkForUpdates', async () => {
      try {
        if (!app.isPackaged) {
          return { success: false, message: 'Updates only available in production' };
        }
        if (!autoUpdater) {
          autoUpdater = require('electron-updater').autoUpdater;
        }
        await autoUpdater.checkForUpdates();
        return { success: true };
      } catch (error) {
        console.error('Check for updates error:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('updater:downloadUpdate', async () => {
      try {
        if (!autoUpdater) {
          autoUpdater = require('electron-updater').autoUpdater;
        }
        await autoUpdater.downloadUpdate();
        return { success: true };
      } catch (error) {
        console.error('Download update error:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('updater:installUpdate', () => {
      try {
        if (!autoUpdater) {
          autoUpdater = require('electron-updater').autoUpdater;
        }
        autoUpdater.quitAndInstall(false, true);
        return { success: true };
      } catch (error) {
        console.error('Install update error:', error);
        return { success: false, message: error.message };
      }
    });

    // ============ BACKUP / RESTORE HANDLERS ============

    ipcMain.handle('backup:export', async () => {
      try {
        const { dialog } = await import('electron');

        // Generate default filename with date
        const date = new Date().toISOString().slice(0, 10);
        const defaultPath = `fnf-delete-backup-${date}.json`;

        const result = await dialog.showSaveDialog(this.mainWindow, {
          title: 'Export Database Backup',
          defaultPath: defaultPath,
          filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });

        if (result.canceled || !result.filePath) {
          return { success: false, canceled: true };
        }

        // Export all data from database
        const data = this.database.exportAllData();

        // Write to file
        fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf8');

        return {
          success: true,
          path: result.filePath,
          stats: {
            profiles: data.data.profiles.length,
            operations: data.data.deletionOperations.length,
            files: data.data.deletedFiles.length
          }
        };
      } catch (error) {
        console.error('Export backup error:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('backup:import', async () => {
      try {
        const { dialog } = await import('electron');

        const result = await dialog.showOpenDialog(this.mainWindow, {
          title: 'Import Database Backup',
          filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
          ],
          properties: ['openFile']
        });

        if (result.canceled || result.filePaths.length === 0) {
          return { success: false, canceled: true };
        }

        const filePath = result.filePaths[0];

        // Read and parse the file
        const fileContent = fs.readFileSync(filePath, 'utf8');
        let jsonData;
        try {
          jsonData = JSON.parse(fileContent);
        } catch (parseError) {
          return { success: false, message: 'Invalid JSON file format' };
        }

        // Validate the backup data
        const validation = this.database.validateBackupData(jsonData);
        if (!validation.valid) {
          return { success: false, message: validation.error };
        }

        // Import the data
        this.database.importAllData(jsonData);

        return {
          success: true,
          stats: {
            profiles: jsonData.data.profiles.length,
            operations: jsonData.data.deletionOperations.length,
            files: jsonData.data.deletedFiles.length
          }
        };
      } catch (error) {
        console.error('Import backup error:', error);
        return { success: false, message: error.message };
      }
    });

    // ============ RECYCLE BIN / TRASH HANDLERS ============

    ipcMain.handle('trash:getItems', async () => {
      try {
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);
        const os = require('os');

        // Create temp script file for reliable execution
        const tempDir = os.tmpdir();
        const scriptPath = path.join(tempDir, 'fnf-recycle-scan.ps1');

        // PowerShell script to get Recycle Bin contents
        const psScript = `
$shell = New-Object -ComObject Shell.Application
$recycleBin = $shell.NameSpace(10)
$items = @()
foreach ($item in $recycleBin.Items()) {
  $items += [PSCustomObject]@{
    name = $item.Name
    path = $item.Path
    size = $item.ExtendedProperty("Size")
    type = $item.Type
    dateDeleted = $item.ExtendedProperty("System.Recycle.DateDeleted")
    originalPath = $item.ExtendedProperty("System.Recycle.DeletedFrom")
  }
}
$items | ConvertTo-Json -Depth 3 -Compress
`;

        // Write script to temp file
        fs.writeFileSync(scriptPath, psScript, 'utf8');

        // Execute the script file
        const { stdout } = await execPromise(
          `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`,
          { maxBuffer: 50 * 1024 * 1024, timeout: 60000 }
        );

        // Clean up temp file
        try { fs.unlinkSync(scriptPath); } catch (e) { /* ignore */ }

        let items = [];
        if (stdout.trim()) {
          const parsed = JSON.parse(stdout);
          // Handle single item (not array) or array
          items = Array.isArray(parsed) ? parsed : [parsed];
        }

        // Calculate total size and format items
        let totalSize = 0;
        const formattedItems = items.map(item => {
          const size = parseInt(item.size) || 0;
          totalSize += size;

          // Extract extension from name
          const nameParts = item.name.split('.');
          const extension = nameParts.length > 1 ? nameParts.pop().toLowerCase() : '';

          return {
            name: item.name,
            path: item.path,
            size: size,
            extension: extension,
            type: item.type,
            dateDeleted: item.dateDeleted,
            originalPath: item.originalPath
          };
        });

        return {
          success: true,
          files: formattedItems,
          totalSize: totalSize
        };
      } catch (error) {
        console.error('Get trash items error:', error);
        return { success: false, message: error.message, files: [], totalSize: 0 };
      }
    });

    ipcMain.handle('trash:permanentDelete', async (event, { files, profileId }) => {
      try {
        let deletedCount = 0;
        let totalSize = 0;
        let errors = [];

        // Create operation record if profileId is provided
        let operationId = null;
        if (profileId && this.database) {
          operationId = this.database.createPermanentDeletionOperation(profileId);
        }

        for (const file of files) {
          try {
            const filePath = file.path || file;

            // Use Node.js fs to delete the file directly from Recycle Bin path
            // Recycle Bin paths are like C:\$Recycle.Bin\S-1-5-21-xxx\$Rxxx.ext
            if (fs.existsSync(filePath)) {
              const stat = fs.statSync(filePath);
              if (stat.isDirectory()) {
                // For directories, use recursive delete
                fs.rmSync(filePath, { recursive: true, force: true });
              } else {
                // For files, use unlink
                fs.unlinkSync(filePath);
              }

              deletedCount++;
              const fileSize = file.size || 0;
              totalSize += fileSize;

              // Record to database if profileId provided
              if (operationId && this.database) {
                const fileName = file.name || path.basename(filePath);
                const fileExtension = file.extension || path.extname(fileName).slice(1).toLowerCase();
                this.database.addPermanentlyDeletedFile(
                  operationId,
                  profileId,
                  filePath,
                  fileName,
                  fileExtension,
                  fileSize,
                  file.originalPath || null
                );
              }
            } else {
              errors.push({ path: filePath, error: 'File not found' });
            }
          } catch (err) {
            errors.push({ path: file.path || file, error: err.message });
          }
        }

        // Update operation totals
        if (operationId && this.database) {
          this.database.updatePermanentDeletionOperation(operationId, deletedCount, totalSize);
        }

        return {
          success: errors.length === 0,
          deletedCount: deletedCount,
          totalSize: totalSize,
          errors: errors,
          message: errors.length > 0 ? `${deletedCount} files deleted, ${errors.length} errors` : `${deletedCount} files permanently deleted`
        };
      } catch (error) {
        console.error('Permanent delete error:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('trash:emptyAll', async (event, { profileId, totalFiles, totalSize }) => {
      try {
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);

        // Record statistics before emptying if profileId is provided
        if (profileId && this.database && totalFiles > 0) {
          const operationId = this.database.createPermanentDeletionOperation(profileId);
          this.database.updatePermanentDeletionOperation(operationId, totalFiles, totalSize);
        }

        // PowerShell command to empty Recycle Bin
        await execPromise(
          'powershell -NoProfile -ExecutionPolicy Bypass -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"',
          { timeout: 60000 }
        );

        return { success: true, message: 'Recycle Bin emptied successfully', deletedCount: totalFiles, totalSize: totalSize };
      } catch (error) {
        console.error('Empty trash error:', error);
        return { success: false, message: error.message };
      }
    });
  }
}

// Start the application when Electron is ready
app.whenReady().then(() => {
  const mainApp = new Main();
  mainApp.initialize();
});
